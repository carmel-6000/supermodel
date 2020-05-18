**Generate Instance Times**

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

