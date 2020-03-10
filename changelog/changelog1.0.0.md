# Super Model

***Version: 1.0.0***


## What is the Super Model?

The super model is a module .......... (TODO Eran)


## Mixins

1. **Delete Relations**

The delete relations mixin, deletes a specific row and its instances from the database.


***How to use it?***

Use the function ```deleteRelationalById(id, next)``` 

    Accepts: 
        * id    - number    - the id of the row in Model you want to delete
        * next  - function  - a callback function (usually cb/next)


***How it works?***

According to the id the ```deleteRelationalById``` accepts, we find the row to delete.
We look for relations of the Model and behave accordingly:

- If the relation is ```hasMany/hasOne``` we continue to check the relations of the related model, and delete instances that contain the deleted row id or the id of a row that's deleted due to its relation to the original row. 

\\ex. 
We want to delete the user Shira, her id is 3 in CustomUser. She teaches in a few classes, so in the classes table in column `teacherId`  their is the number 3. if we will delete only the line in CustomUser where id = 3, and then try to get all of the classes teachers will run into an error because there is no teacherId 3. To solve the problem when we delete the classes to. We will delete first the class and then the teacter to avoid existance of a class with no teacher if an error occures when deleteing CustomUser where id=3.
Let's say every class has students, and class number 2 has teacherId = 3:
Every student in class 2 has `classId` = 2. So if we delete class 2 the students will require a class that doesn't exist. Thus, we will delete them too.
In the future we will add an option to switch `classId` to null instead of deleteing the student.

- If the relation is ```belongsTo``` we stop the search for the related models of the that specific model. 


> How to use it?

- Enable the mixin in your model.
\\ex.
    "mixins": {
        "DeleteRelations": true,
    }
- Make sure all you relations are defined properly (existance, type, model, foreignKey, through, keyThrouh).
- Call the function `deleteRelationalById`.

**NOTE**: Make sure to use this mixin **ONLY** from a remote method!!
          Why? Because if we use `fetch`, someone that a permit to delete 1 row can delete another only by sending an id. 
 
\\ex. 
models/customuser.js

    Customuser.deleteAccount = function (email, options, cb) {
		(async (cb) => {
			const token = options && options.accessToken;
			const userId = token && token.userId;
			if (!userId) return cb("AUTHORIZATION_ERROR", null);

            if (!email) return cb("EMPTY_EMAIL_INPUT", null);
			let [cuFindErr, cuFindRes] = await to(Customuser.findOne({ where: { id: userId, email } }))
			if (cuFindErr || !cuFindRes) {
				console.log("error finding user to delete", cuFindErr);
				return cb(cuFindErr || "USER_NOT_FOUND", null);
			}
			
            await Customuser.deleteRelationalById(userId, cb);
		})(cb);
	}

    Customuser.remoteMethod('deleteAccount', {
        http: { verb: 'delete' },
        accepts: [
            { arg: 'email', type: "string" },
            { arg: "options", type: "object", http: "optionsFromRequest" }
        ],
        returns: { arg: 'res', type: 'object', root: 'true' }
    });


***Question and/or Suggestions***

Chanah Emunah D - year 2020



2. **Exclude Model Fields**

The exclude model fields mixin, removes unwanted fields from result returned from the server side to the client.


***How to use it?***

a. Go to the [MODEL].json file you want it to exclude fields from.

b. Apply the ```ExcludeModelFields``` mixin

\\ex. 
    "mixins": {
        "ExcludeModelFields": true
    },

**NOTE**: It is recommended to put it as the last mixin for each model. 
    So that it will be the last to run as ```afterRemote``` and won't do any problems excluding fields you wish to use in other methods.

c. Add a ```excludeFields``` in the .json file 

\\ex. 
    ...,
    "excludeFields":[
        "id",
        "password",
        "loginAccess",
        {"address":{"includeForRoles":"teacher"}},
        {"profession":{"includeForRoles":["teacher", "admin"]}}
    ],
    ...


***How it works?***

> How to use it?

As mentioned above, in order for the mixin to work and actually exclude the fields you don't want the client to receive, you need to define what those fields are.

In the .json file, add a field named `excludeFields`.
It is an `array`.
The values of this `array` can be 
- `strings` 
- `objects`


> What to put as the value? 

- `string`: Name of the field you want to **NEVER** return to the client.
    \\ex. ```"password"```
- `object`: Name of field you might want to return to **only** certain roles.
    * key (string): Name of field not to return
    * value (object): 
        * key: (string) `"includeForRoles"`
        * value: (string/array of strings) Names of roles you want to include this field for.
    \\ex. ```{"address":{"includeForRoles":"teacher"}},```
        ```{"profession":{"includeForRoles":["teacher", "admin"]}}```


> What does the mixin do?

The mixin is an `afterRemote('*', ...)`. Which means, it is triggered after every method. It goes over the data returned to the client and removes the fields we don't want to client to recieve according to the excludeFields you defined in the [model].json file.

**NOTE**: The excluded fields can still be used in your remote methods, they are removed only from the result returned to the client. So don't worry about that (:


***Question and/or Suggestions***

Shira Rabi - year 2020



3. **Generate Instance Times**

The generate instance times mixin automatically adds a ```created, modified``` to you model.


***How to use it?***

a. Go to the [MODEL].json file.

b. Apply the ```GenerateInstanceTimes``` mixin

\\ex. 
    "mixins": {
        "GenerateInstanceTimes": true
    },


***How it works?***

> What does the mixin do?

This mixin is an ```Model.observe('after save', ...)```. 
If you want- check in the internet to know when it is triggered.

- It adds a ```created``` to each model instance if it was just created.
- It adds a ```modified``` to each model instance when it is modified.
    * This supports: ```modified, lastUpdated, last_updated, updated```.

**NOTE**: This mixin supports only the fields mentioned above. If you table doens't have them as columns, the code will skip updating them (and won't crash).


***Question and/or Suggestions***

Shira Rabi - year 2020


