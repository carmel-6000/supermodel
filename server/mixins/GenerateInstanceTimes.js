'use strict';

const logSuperModel = require('debug')('module:super');
const to = function (promise) { return promise.then(data => { return [null, data]; }).catch(err => [err]); };
const TimeCalcs = require('./../../../tools/server/lib/TimeCalcs.js');

const CREATED = 'created';
const times = ['created', 'modified', 'lastUpdated', 'last_updated', 'updated'];

module.exports = function GenerateInstanceTimes(Model) {

    Model.observe('after save', function (ctx, next) {

        (async (next) => {
            logSuperModel("Generate instance time is launched now with model '%s' ", Model.name/*, ctx.req.method*/);

            const instance = ctx && ctx.instance;
            logSuperModel("Ctx.instance is ", instance);
            const instanceId = instance && ctx.instance.id;
            if (!instanceId) return next();

            let mp = Model.definition.properties; //modelProperties
            if (!mp || typeof mp !== "object") return next();

            let mpKeys = Object.keys(mp);
            let tp = []; //timeProperties
            times.some(p => { if (mpKeys.includes(p)) tp.push(p); });

            if (!tp || tp.length === 0) return next();
            logSuperModel("Time properties found in model properties are ", tp);

            let [mFindErr, mFindRes] = await to(Model.findOne({ where: { id: instanceId }, fields: tp }));
            if (mFindErr || !mFindRes) { logSuperModel("error finding model instance", mFindErr); return next(); }

            logSuperModel("Model instance result with the time properties fields is ", mFindRes);
            if (!mFindRes.__data) return next();

            for (const key in mFindRes.__data) {
                if (!mFindRes.__data.hasOwnProperty(key)) continue;
                const element = mFindRes.__data[key];
                if (key === CREATED && element) {
                    logSuperModel("Created already exists in modelinstance, removing 'created' from tp...");
                    let index = tp.indexOf(key);
                    if (index === -1) continue;
                    tp.splice(index, 1);
                    break;
                }
            }
            if (!tp || tp.length === 0) return next();

            await Model.saveTimes(tp, instanceId);

            return next();
        })(next);

    });

    Model.saveTimes = async function (tp, instanceId) {
        const now = TimeCalcs.getTimezoneDatetime(Date.now());

        let tpObject = {};
        for (const key of tp) { tpObject[key] = now; }
        logSuperModel("Time properties object to upsert into model '%s' is: ", Model.name, tpObject);

        // let [mUpsertErr, mUpsertRes] = await to(Model.upsertWithWhere({ id: instanceId }, tpObject))
        let [mUpsertErr, mUpsertRes] = await to(Model.updateAll({ id: instanceId }, tpObject))
        if (mUpsertErr || !mUpsertRes) return logSuperModel("Error upserting time to model '%s' with error: ", Model.name, mUpsertErr);
        logSuperModel("Success upserting times to model '%s' with res", Model.name, mUpsertRes);
    }

}
