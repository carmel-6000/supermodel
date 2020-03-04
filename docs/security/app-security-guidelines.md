

# App Security

1. Build
    - Irrelevant models should not be exposed to Restfull API

2. Input Validation _(use: src/modules/tools/server/lib/ValidateTools.js)_
    - Input validation should be conducted on the server side
    - _(done)_ Input validation should consist of data filtering and clearing invalid characters
    - On numbers and strings, ranges must be validated - zeros, nulls, exceedings, etcs
    - Never use raw data into SQL queries without filtering out

* We need to filter out all occurrences in which a server error is yielded and sent to the client (e.g, instead of this: return cb(err,null), use this: return cb({},null); (unless you use the error on the client side, ex. to show a relevant message)

3. Emails Transfer
    - Emails should be transferred with a third party provider _(recommended to use sendgrid)_

4. Passwords _(use: module auth v1.2.0)_
    - _(done)_ Should not be less than 6 characters
    - _(done)_ Should consist of a combination of numbers and chars
    - _(done)_ Before changing any password - a verification of the current password should be conducted
    - _(done)_ Blocking should be applied after 5 failed attempts
    - _(done)_ The password should never be displayed as a plain text (dots or * are good)
    - _(done)_ Password should be saved as hashed on the server
    - _(done)_ After 6 months the user should be forced to change password

5. User Roles and Permissions _(use: src/modules/scripts/default-acls-generator.js)_
    - All data over Restfull API should be restricted by user roles (ACLS)
    - Views should be restricted by user roles
    - Routes should be rendered according to roles and permissions

6. Sessions _(use: module auth)_
    - Upon any system failure, user session must be ended (logged out)
    - _(done)_ After 10 minutes of non-activity, session should be expired
    - _(done)_ After 5 hours of usage, session should be expired

7. User Rights _(use: src/modules/supermodel/mixins/DeleteRelations.js)_
    - All users are able to delete their data completely and easily _(example in supermodel/changelog/changelog1.0.0.md)_

8. Authentication
    - _(done)_ Authentication should take place on first request
    - _(done)_ Access tokens should be verified and saved into cookies and not localstorage
    - User roles should not be exposed as text on cookies/session
    - User id should never be transferred to Http requests _(use: supermodel/mixins/ExcludeModelFields)_

9. System Error and Stability
    - All client side errors should be hidden
    - Remove all console.log's from client-side and those not relevant also from server-side

10. App should never fail
    - No connectivity should be catched and a proper message should be displayed
    - No content should not be displayed as empty screens/boxes - always show a proper message
    - _(done)_ Non existing pages should fall into a default 404 page or homepage

11. Accessibility
    - All images should include both ALT and TITLE tags with descriptive information as an alternative
