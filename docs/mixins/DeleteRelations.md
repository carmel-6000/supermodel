**Delete Relations**

The delete relations mixin, deletes a specific row and its instances from the database.


***How to use it?***

Use the function ```deleteRelationalById(id, next)``` 

    Accepts: 
        * id    - number    - the id of the row in Model you want to delete
        * next  - function  - a callback function (usually cb/next)

***options for delete***
Sometimes we only want to delete an ouoter object but the inner should turn to null.
example for delete all:
    we want to delete a group from model Group, thus we will want all group participants deleted where groupId = deletedGroupId.
example for switching to null:
    in the group (from pre example) we want to keep participants so we will change group id=null.
The first example is the default. 
If you want the second behavior, add a key to the model:
{name:"Group",
...
deleteRelationalById:["name of model to turn to null instead of deleting", "another one"],
...
}

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

