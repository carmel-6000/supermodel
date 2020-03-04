module.exports = {
    CustomUser: {
        id: { type: "number" },
        realm: {
            type: "string",
            format: {
                pattern: '^[\u0590-\u05fe \' \" ]+ [\u0590-\u05fe \' \" ]+$',
                message: "invalid realm"
            }
        },
        password: {
            type: "string",
            format: {
                pattern: '/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])[a-zA-Z0-9!@#$%^&*().~`\[\]{}\|\\-_=+<>:"?]{6,}$/',
                message: "invalid password",
                flags: ""
            }
        },
        email: { type: "string" },
        emailVerified: {
            type: "number",
            numericality: { greaterThan: -1, lessThanOrEqualTo: 1 }
        },
        mainImageId: { type: "number", },
        address: {
            type: "string",
            format: {
                pattern: '(^[\'\u0590-\u05FF ]* [0-9]*[0-9  ]$|^[0-9  ][0-9]* [\'\u0590-\u05FF ]*$)',
                message: "invalid address"
            }
        },
    },
    RecordsPermissions: {
        model: {
            type: "string",
            format: { pattern: '^(images|files)' }
        }, // string, files or images
        recordId: {
            type: "number",
            numericality: {
                greaterThan: 0, lessThanOrEqualTo: 4294967295
            }
        }, // number, unsigned int size/null
        principalType: {
            type: "string",
            format: { pattern: '^($OWNER|ROLE|USER)' }
        }, // enum
        principalId: {
            type: "string",
            format: { pattern: '^[a-zA-Z0-9$]+$' }
        },
        permission: {
            type: "string",
            format: { pattern: '^(ALLOW|DENY)' }
        } // enum
    },
    Images: {
        title: {
            type: "string",
            length: { maximum: 200 }
        },
        description: { type: "string" },
        format: {
            type: "string",
            format: { pattern: '^(png|jpg|jpeg|gif|svg)$' }
        },
        category: {
            type: "string",
            length: { maximum: 100 }
        },
        owner: { type: "number" }
    },
    RoleMapping: {
        principalType: {
            type: "string",
            format: { pattern: '^USER$' }
        },
        principalId: {
            type: "string",
            format: { pattern: '^[0-9]*$' }
        },
        roleId: { type: "number" },
    },
    Other: {
        int:{
            type:"number"
        },
        tinyInt: {
            type: "number",
            numericality: { greaterThan: -1, lessThanOrEqualTo: 1 }
        },
        string: {
            type: "string",
            format: {
                pattern: '(^[A-Za-z]*$)',
                message: "invalid string"
            }
        },
        enum: {
            type: "string",
            format: { pattern: '^(first|second)' }
        },
        date: {
            type: "date"
        },
        anotherDate: {
            type: "string",
            format: {
                pattern: '^[TZ0-9-:._]*',
                flags: ""
            }
        }
    }
}