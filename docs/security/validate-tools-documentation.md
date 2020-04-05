# The runValidate function

*Notes:* 
1. in this documentation we’ll use runValidate function for server-side 
2. the path of ValidateTools is “src/modules/tools/server/lib/ValidateTools.js                      

**why do we use this function?**
If the app has only client-side validation, a user can send any data directly to the server and that data will go into the database. This might not be data we want to put in the database and it might cause the code/database to crash. 
This is why we *MUST* use server-side validation.

**when do we use this function?**
We use this function right before every create, update or change things in the database.
for example, these are some methods that we need to validate the data before we use them: 
```put, patch, post``` - if we directly fetch from client-side using these methods, the validation should be in before remote.
```create, upsert, update, upsertWithWhere, and more``` - right before we use them in our remote mothods we need to validate the data.

 
**The steps:**
1. Import your ValidateRules and ValidateTools components (the path of the ValidateRules is in the notes above).
   ValidateRules:
   ValidateRules is an object. each property of this object is another object that stores the rules of each table in the database. 
   The rules can include type, format, regular expressions for the inputs, length and more.
   ValidateRules object For example: 
   module.exports = {
        CustomUser: {
            property1: { type: "number" },
            property2: {
                type: "string",
                format: {
                    pattern: '^[\u0590-\u05fe \' \" ]+ [\u0590-\u05fe \' \" ]+$',
                    message: "invalid realm"
                }
            },
            property3: {
                type: "string",
                format: {
                    pattern: '/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])[a-zA-Z0-9!@#$%^&*().~`\[\]{}\|\\-_=+<>:"?]{6,}$/',
                    message: "invalid password",
                    flags: ""
                }
            }
        }
    }
                                                    
2. Define the data which you want to validate as an object.
   For example: 
   let yourData = {
        property1: 76,
        property2: ‘הכרזת העצמאות’,
        property3: ‘יא-יב’
   }

3. Define a white list. White list is the list of the properties of the data object which we want the runValidate function to validate.
   For example:
   let whitelist = {
        property1: true, 
        property2: false, 
        property3: true
   };

4. Run runValidate as in this example: 
   let valid = await ValidateTools.runValidate(yourData, ValidateRules.yourRulesObject, whitelist);
   if (!valid.success || valid.errors) {
      return { error: valid.errors, ok: false };
   }

   The values that we send to runValidate function:
   The first value - the data object which we want to validate
   The second value - the rules object which we imported from validateRules
   The third value - the white list which we have defined

5. Using the validated data as in this example:
   let [err, res] = await to(Offers.create(valid.data));

*note:*
the properties of the rules objects must be corresponding to the properties of the data object, the white list object and the columns in the database.

-----------------------------------------------------------------------------------------------------------------------------------

***Questions***
Security team 2020 - Roni Cohen, Tal Lavi and Abigail Grigoriady 
Reut Schremer




