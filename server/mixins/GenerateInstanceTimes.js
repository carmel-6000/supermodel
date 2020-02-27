'use strict';

const logSuperModel = require('debug')('module:super');
function to(promise) { return promise.then(data => { return [null, data]; }).catch(err => [err]); }

const CREATED = 'created';
const times = ['created', 'modified', 'lastUpdated', 'last_updated'];

module.exports = function GenerateInstanceTimes(Model) {
    Model.afterRemote('*', function (ctx, modelInstance, next) {
        (async (next) => {
            logSuperModel("Generate instance time is launched now with model '%s' ", Model.name, ctx.req.method);
            if (ctx.req.method !== "POST" && ctx.req.method !== "PUT" && ctx.req.method !== "PATCH")
                return next();

            logSuperModel("modelInstance", modelInstance, modelInstance && modelInstance.id);

            if (!modelInstance || !modelInstance.id) return next();

            let mp = Model.definition.properties; //modelProperties
            if (!mp || typeof mp !== "object") return next();

            let mpKeys = Object.keys(mp);
            let tp = []; //timeProperties
            times.some(p => { if (mpKeys.includes(p)) tp.push(p); });

            if (!tp || tp.length === 0) return next();
            logSuperModel("Time properties found in model properties are ", tp);

            let [mFindErr, mFindRes] = await to(Model.findOne({ where: { id: modelInstance.id }, fields: tp }));
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

            await Model.saveTimes(tp, modelInstance.id);

            return next();
        })(next);

        Model.saveTimes = async function (tp, instanceId) {
            const now = getTimezoneDatetime(Date.now());

            let tpObject = {};
            for (const key of tp) { tpObject[key] = now; }
            logSuperModel("Time properties object to upsert into model '%s' is: ", Model.name, tpObject);

            let [mUpsertErr, mUpsertRes] = await to(Model.upsertWithWhere({ id: instanceId }, tpObject))
            if (mUpsertErr || !mUpsertRes) return logSuperModel("Error upserting time to model '%s' with error: ", Model.name, mUpsertErr);
            logSuperModel("Success upserting times to model '%s' with res", Model.name, mUpsertRes);
        }
    });
}

// accepts: d - date
//          useOffset - if we want to use israel's timezone
// returns: datetime with format to post to database
function getTimezoneDatetime(d = Date.now(), useOffset = true) {
    // from this format -> 2/7/2020, 9:46:11
    // to this format   -> 2020-02-07T09:37:36.000Z
    if (!useOffset) { return new Date(d); }
    let now = new Date(d).toLocaleString("en-US", { timeZone: "Asia/Jerusalem", hour12: false });
    let nowArr = now.split(", ");
    let dateArr = nowArr[0].split("/");
    let month = dateArr[0].length === 2 ? dateArr[0] : "0" + dateArr[0];
    let day = dateArr[1].length === 2 ? dateArr[1] : "0" + dateArr[1];
    let date = dateArr[2] + "-" + month + "-" + day;
    let time = nowArr[1];
    let datetime = date + "T" + time + ".000Z";
    datetime = new Date(datetime);
    return datetime;
}



/*

model               created         modified            other           relevant
_____________________________________________________________________________________

ACL                 no              no                  no              no
AccessToken         yes             no                  no              ?
Audio               yes             yes                 no              yes
CustomUser          no              no                  no              yes
Files               yes             yes                 no              yes
Images              yes             yes                 no              yes
Notification        yes             yes                 no              yes
NotificationsMap    yes             yes                 no              no
Role                yes             yes                 no              no (?)
RoleMapping         no              no                  no              ?
User                yes             no                  lastUpdated     no (?)
Video               yes             yes                 no              yes
access_logger       yes             no                  no              no (?)
offers              yes             no                  last_updated    yes
offers_users        yes             no                  last_updated    yes
passwords           yes             no                  no              no (?)
records_permissions no              no                  no              ?
schools             yes             no                  last_updated    yes

*/