'use strict'
/**
 ** R - relation
 *
 * Note: Make sure that all your relations in related models (.json) are correct
 *          Possible relation types: belongsTo, hasMany, hasOne 
 */

//to run with debug data: DEBUG=module:supermodel node directory;
const logSuperModel = require('debug')('module:supermodel');
const to = function (promise) { return promise.then(data => { return [null, data]; }).catch(err => [err]); };
const path = require('path');
const fs = require('fs');
const fileModels = ["Images", "Files", "Audio", "Video"];

module.exports = function DeleteRelations(Model, options) {
    Model.deleteRelationalById = (id, next) => {
        (async (next) => {
            logSuperModel("I am :", Model.name);
            let error = null;
            const setError = err => error = err;
            const [findInitErr, findInit] = await to(Model.findById(id));
            if (!findInit) return next ? next({ error: `no such id in ${Model.name}` }) : { error: `no such id in ${Model.name}` };
            if (findInitErr) setError(findInitErr);
            const JSONdata = Model.definition.settings.deleteRelationsById || {};
            const changeToNull = JSONdata.toNull;
            const continueBelongsTo = JSONdata.continueBelongsTo;
            await deleteInstances(Model, [findInit], [], setError, changeToNull, continueBelongsTo);
            //destroy initial instance by id: 
            let [deleteInitialErr, deleteInitial] = await to(Model.destroyById(id));
            if (deleteInitialErr) setError(deleteInitialErr);
            return next ? next(error, { success: 1 }) : [error, { success: 1 }];
        })(next)
    }

    /**
     * @param model (object) model to delete instances from
     * @param ids (array) of model instance to handle
     * @param handledModelInstances (array) avoid infinate loop by checking if in this cycle the model was already checked
     * @param setError (function) for collecting all errors from function in one place 
     */
    const deleteInstances = async (model, ids, handledModelInstances, setError, changeToNull = [], continueBelongsTo = []) => {
        if (!model || handledModelInstances.includes(model.name)) return;
        logSuperModel("we are with model: ", model.name);
        const modelR = model.relations;
        if (!modelR) return;
        for (let Rname in modelR) {
            const R = modelR[Rname];
            logSuperModel("relation: ", R.name, "type", R.type);
            switch (R.type) {
                case "belongsTo": {
                    //if has relation.hasone try deleting it
                    if (continueBelongsTo.includes((R.modelThrough ? R.modelThrough : R.modelTo).name))
                        await continueRecursion(R, ids, model.name, handledModelInstances, setError, changeToNull, continueBelongsTo);
                    else logSuperModel(Rname, "belongs to - aborting", model.name);
                    break;
                }
                case "hasOne": case "hasMany":
                    await continueRecursion(R, ids, model.name, handledModelInstances, setError, changeToNull, continueBelongsTo);

                    break;
                default: logSuperModel("We do not support relation type: %s in model %s", R.type, model.name);//!make sure log works %s
            }
        }
    }
    const continueRecursion = async (R, ids, name, handledModelInstances, setError, changeToNull, continueBelongsTo) => {
        const nextModel = (R.modelThrough ? R.modelThrough : R.modelTo);
        const foreignKey = R.keyTo;
        logSuperModel("from", name, "to", nextModel.name, "relation: ", R.name, "foreignkey:", foreignKey, "keyFrom", R.keyFrom);
        const where = { [foreignKey]: { inq: ids.map(instance => instance[R.keyFrom]) } };
        logSuperModel("model: ", nextModel.name, "where", where);
        const [findErr, res] = await to(nextModel.find({ where: where }));
        if (findErr) setError(findErr);
        if (!res) return;
        logSuperModel("key from :", R.keyFrom);
        const foundInstances = res;//.map(instance => instance[R.keyFrom]);
        logSuperModel("foundInstances: ", foundInstances);
        if (foundInstances.length === 0) return;
        const handledInstances = [...handledModelInstances, name];
        //We want this function to run from leaf to root so we call it first on the next level
        logSuperModel("modelNext", nextModel.name);
        if (changeToNull.includes(nextModel.name)) {
            if (!where || !Object.keys(where).length > 0) return;
            const [deleteErr, deleteRes] = await to(nextModel.update(where, { [foreignKey]: null }));
            logSuperModel("deleteRes: ", deleteRes, "model", nextModel.name, "err", deleteErr);
            if (deleteErr) setError(deleteErr);
        }
        else {
            logSuperModel("HI there");
            //We want this function to run from leaf to root so we call it first on the next level
            await deleteInstances(nextModel, foundInstances, handledInstances, setError, changeToNull, continueBelongsTo);
            logSuperModel("going to destroy all", where, "in model: ", nextModel.name);
            logSuperModel("foundInstances: ", foundInstances, "R.keyTo: ", R.keyTo);
            if (fileModels.includes(nextModel.name)) await Model.deleteFileById(foundInstances.map(instance => instance[R.keyTo]), nextModel);
            const [deleteErr, deleteRes] = await to(nextModel.destroyAll(where));
            logSuperModel("deleteRes", deleteRes);
            if (deleteErr) setError(deleteErr);
        }
    }
    Model.deleteFileById = async (fileIds) => {
        logSuperModel("deleteFileById is launched now with fileIds: ", fileIds);

        let [findFileErr, findFileRes] = await to(Model.find({
            where: { id: { inq: fileIds } }
        }));

        if (findFileErr || !findFileRes) {
            logSuperModel("Error finding previous file path", findFileErr);
            return null;
        }

        const isProd = process.env.NODE_ENV == 'production';
        const baseFileDirPath = '../../../../../public';

        let filePath = null;
        for (let file of findFileRes) {
            logSuperModel("file is", file);
            filePath = file.path;
            if (!isProd) {
                const port = Model.app.get("port");
                filePath = filePath.replace(`http://localhost:${port}`, '');
            }

            try {
                const fullFilePath = path.join(__dirname, `${baseFileDirPath}${filePath}`);
                logSuperModel("fullfilepath", fullFilePath);
                if (!fs.existsSync(fullFilePath)) continue;
                fs.unlinkSync(fullFilePath);
                logSuperModel("File with path %s was successfully removed (deleted)", fullFilePath);
                continue;
            } catch (err) {
                logSuperModel("Error deleting file", err);
                return err;
            }
        }
    }

    Model.remoteMethod("deleteRelationalById", {
        accepts: [{ arg: "id", type: "number", required: true }],
        http: { verb: "delete" },
        description: "the function deletes the instance and ***All related instances***",
        returns: { arg: "res", type: "object" }
    })
}