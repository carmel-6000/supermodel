**Exclude Model Fields**

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

