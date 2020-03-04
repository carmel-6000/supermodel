# acls:

By default all users have access to all the data. 
To make the app more secure we need to add acls =  Controlling data access to all tables json files.

In every table json file we should add acls array with object of permissions for different types of remotes (post, get, patch, custom remote methods, and more).
The first acl should always be **block access to every data** in table json file
ex.
*****************
"acls": [
      {
        "principalType": "ROLE",
        "principalId": "$everyone",
        "permission": "DENY",
        "property": "*"
      }
]
 


"*"- everything
*****************

Then allow access to the data each time for specific type of users with the appropriate permission (ALLOW/DENY).

Every object in the acls can have the following properties:
 * model
 * property- access data- array of remote methods or array of type of actions for example       ("find","findById","patchOrCreate","patchAttributes",  "create", name_of_remote_method).     Note: You can find more information and properties in the loopback documentation or in       the internet.
 * accessType-  ‘EXECUTE’, ‘READ’, or ‘WRITE’ (what type of access the user has to the data)
 * principalType-
    USER
    APP
    ROLE
 * principalId (define who we want to have access or deny access to the data)
    custom roles
    $owner
    $authenticated
    $unauthenticated
    $everyone
 * permission (allow or deny access)
    DENY
    ALLOW


**example of acls :**

******************
  "acls": [
    {
      "principalType": "ROLE",
      "principalId": "$everyone",
      "permission": "DENY",
      "property": "*"
    },
       {
      "principalType": "ROLE",
      "principalId": "teacher",
      "permission": "ALLOW",
      "property": [
        "fetchCurUserOffers",
        "getUserArchiveOffers"
      ]
    },
    {
      "principalType": "ROLE",
      "principalId": "$authenticated",
      "permission": "ALLOW",
      "property": "fetchCurOfferUser"
    },
    {
      "principalType": "ROLE",
      "principalId": "$authenticated",
      "permission": "ALLOW",
      "property": [
        "patchOrCreate","patchAttributes"
      ],
      "accessType": "WRITE"
    },
    {
      "principalType": "ROLE",
      "principalId": "$authenticated",
      "permission": "ALLOW",
      "property": [
        "find",
        "findById",
        "findOne",
        "__get__user",
        "__count__user"
      ],
      "accessType": "READ"
    }
  ]
******************

# Note: You can find more information in the loopback documentation or in the internet.
