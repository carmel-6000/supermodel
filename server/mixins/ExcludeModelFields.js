'use strict';

const logExclude = require('debug')('mixin:exclude');
function to(promise) { return promise.then(data => { return [null, data]; }).catch(err => [err]); }

// For security reasons sometimes we might want to exclude certain fields from the client
module.exports = function ExcludeModelFields(Model) {

    let role = null;
    Model.afterRemote('*', function (ctx, modelInstance, next) {
        (async (next) => {
            logExclude("ExcludeModelFields mixin is now launched", Model.name);
            if (!ctx || !ctx.result || typeof ctx.result !== "object") return next();

            const userId = ctx.req && ctx.req.accessToken && ctx.req.accessToken.userId;
            role = await getRole(userId);

            let field = null;
            if (Array.isArray(ctx.result)) {
                for (const element of ctx.result) {
                    field = (element && element.__data || element);
                    deleteExcludedFields(field, Model);
                }

                logExclude("after delete ctx.result", ctx.result);
                return next();
            }

            field = (ctx.result && ctx.result.__data) || ctx.result;
            deleteExcludedFields(field, Model);
            logExclude("after delete ctx.result", ctx.result);

            return next();
        })(next);
    });

    function deleteExcludedFields(field, M) {
        const modelName = M.name;
        logExclude("deleteExcludedFields is launched with model '%s'", modelName);

        if (!M.definition || !M.definition.settings || !M.definition.settings.excludeFields ||
            !Array.isArray(M.definition.settings.excludeFields)) return;
        let eModelFields = [...M.definition.settings.excludeFields]; // We can get eModelFields from modelProperties
        if (!field || !eModelFields) return;

        for (let key in field) {
            //Check if to include a certain field for a specific role
            for (let i = 0; i < eModelFields.length; i++) {
                const emf = eModelFields[i];
                if (typeof emf === 'object') {
                    let emfKeys = Object.keys(emf);
                    let emfk = emfKeys && emfKeys[0];
                    if (!emfk) continue;
                    if (emf[emfk]) {
                        //We can maybe accept roles aslo in an array so we can include fields for multiple roles
                        if (emf[emfk].includeForRoles) {
                            if (role && role === emf[emfk].includeForRoles || //if role is a string
                                (Array.isArray(emf[emfk].includeForRoles) &&
                                    emf[emfk].includeForRoles.includes(role))) //if role is an array
                                continue;
                        }
                        eModelFields.push(emfk);
                    }
                }
            }

            //Delete field if it is supposed to be excluded
            if (eModelFields.includes(key)) {
                delete field[key];
                logExclude("ExcludeModelFields on Model '%s' deleted key '%s'", modelName, key);
            }

            //Go over relations to check if they have fields that need to be excluded
            const modelR = M.relations;
            if (!modelR) return;
            for (let Rname in modelR) {
                if (key === Rname) {
                    const R = modelR[Rname];
                    logExclude("R.modelTo.name", R.modelTo.name);

                    let newField = null;
                    if (Array.isArray(field[key])) {
                        logExclude("Field found was array");
                        for (const element of field[key]) {
                            newField = (element && element.__data || element);
                            deleteExcludedFields(newField, R.modelTo);
                        }
                        continue;
                    }

                    logExclude("Field found was object");

                    newField = (field[key] && field[key].__data || field[key]);
                    deleteExcludedFields(newField, R.modelTo)
                }
            }
        }
    }

    async function getRole(userId) {
        const [rmRoleErr, rmRole] = await to(Model.app.models.RoleMapping.findOne({
            where: { principalId: userId },
            fields: { roleId: true },
            include: 'role'
        }));
        if (rmRoleErr) { logExclude("error finding user role from rolemapping", rmRoleErr); return; }

        logExclude("user role from rolemapping: rmRole", rmRole)
        if (!(rmRole && rmRole.role && rmRole.role.name)) { logExclude("no user role found, try %s..."); return; }

        let userRole = null;
        try {
            const parsedRmRole = JSON.parse(JSON.stringify(rmRole));
            userRole = parsedRmRole && parsedRmRole.role && parsedRmRole.role.name;
        } catch (err) { logExclude("Could not parse rmRole into object, userRole, err", userRole, err); return; }

        return userRole;
    }
}
