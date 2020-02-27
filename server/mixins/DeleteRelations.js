'use strict'
/**
 ** R - relation
 *
 * Note: Make sure that all your relations in related models (.json) are correct
 *          Possible relation types: belongsTo, hasMany, hasOne 
 */

//to run with debug data: DEBUG=module:tools node directory;
const logTools = require('debug')('module:tools');
const to = function (promise) { return promise.then(data => { return [null, data]; }).catch(err => [err]); };
const path = require('path');
const fs = require('fs');
const fileModels = ["Images", "Files", "Audio", "Video"];

module.exports = function deleteRelations(Model, options) {
    Model.deleteRelationalById = (id, next) => {
        (async (next) => {
            let error = null;
            const setError = err => error = err;
            const [findInitErr, findInit] = await to(Model.findById(id));
            if (!findInit) return next({ error: `no such id in ${Model.name}` });
            if (findInitErr) setError(findInitErr);
            await deleteInstances(Model, [id], [], setError);
            //destroy initial instance by id: 
            let [deleteInitialErr, deleteInitial] = await to(Model.destroyById(id));
            if (deleteInitialErr) setError(deleteInitialErr);
            return next(error, { success: 1 })
        })(next)
    }

    /**
     * @param model (object) model to delete instances from
     * @param ids (array) of model instance to handle
     * @param handledModelInstances (array) avoid infinate loop by checking if in this cycle the model was already checked
     * @param setError (function) for collecting all errors from function in one place 
     */
    const deleteInstances = async (model, ids, handledModelInstances, setError) => {
        if (!model || handledModelInstances.includes(model.name)) return;
        const modelR = model.relations;
        if (!modelR) return;
        for (let Rname in modelR) {
            const R = modelR[Rname];
            switch (R.type) {
                case "belongsTo": break;
                case "hasOne": case "hasMany":
                    const nextModel = (R.modelThrough ? R.modelThrough : R.modelTo);
                    const foreignKey = R.keyTo;
                    const where = { [foreignKey]: { inq: ids } };
                    logTools("model: ", nextModel.name, "where", where);
                    const [findErr, res] = await to(nextModel.find({ where: where }));
                    if (findErr) setError(findErr);
                    if (!res) continue;
                    const foundInstances = res.map(instance => instance.id);
                    logTools("foundInstances: ", foundInstances);
                    if (foundInstances.length === 0) continue;
                    const handledInstances = [...handledModelInstances, nextModel.name];
                    //We want this function to run from leaf to root so we call it first on the next level
                    await deleteInstances(nextModel, foundInstances, handledInstances, setError);
                    logTools("modelNext", nextModel.name);
                    if (fileModels.includes(nextModel.name)) await deleteFileById(foundInstances, nextModel);
                    const [deleteErr, deleteRes] = await to(nextModel.destroyAll(where));
                    if (deleteErr) setError(deleteErr);
                    logTools("delete res: ", deleteRes);
                    break;
                default: logTools("We do not support relation type: %s in model %s", R.type, model.name);//!make sure log works %s
            }
        }
    }

    const deleteFileById = async (fileIds, Model) => {
        logTools("deleteFileById is launched now with fileIds: ", fileIds);

        let [findFileErr, findFileRes] = await to(Model.find({
            where: { id: { inq: fileIds } }
        }));

        if (findFileErr || !findFileRes) {
            logTools("Error finding previous file path", findFileErr);
            return null;
        }

        const isProd = process.env.NODE_ENV == 'production';
        const baseFileDirPath = isProd ? '../../../../../build' : '../../../../../public';

        let filePath = null;
        for (let file of findFileRes) {
            logTools("file is", file);
            filePath = file.path;
            if (!isProd) filePath = filePath.replace('http://localhost:8080', '');

            try {
                const fullFilePath = path.join(__dirname, `${baseFileDirPath}${filePath}`);
                logTools("fullfilepath", fullFilePath);
                if (!fs.existsSync(fullFilePath)) continue;
                fs.unlinkSync(fullFilePath);
                logTools("File with path %s was successfully removed (deleted)", fullFilePath);
                continue;
            } catch (err) {
                logTools("Error deleting file", err);
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