/**
 * Created by infyzoadmin on 25/8/16.
 */

module.exports = {
    'signUp': [
        {
            field: 'uuid',
            message: 'Device not recognized.'
        },
        {
            field: 'email',
            message: 'Email should not be empty.'
        },
        {
            field: 'password',
            message: 'Password should not be empty.'
        },
        {
            field: 'dob',
            message: 'Date of Birth should not be empty.'
        },
        {
            field: 'lat',
            message: 'Latitude should not be empty.'
        },
        {
            field: 'lon',
            message: 'Longitude should not be empty.'
        },
        {
            field: 'fname',
            message: 'First Name should not be empty.'
        },
        {
            field: 'lname',
            message: 'Last Name should not be empty.'
        },
        {
            field: 'gender',
            message: 'Gender should not be empty.'
        },
        {
            field: 'mobile',
            message: 'Mobile no should not be empty.'
        }
    ],
    'login': [
        {
            field: 'uuid',
            message: 'Device not recognized.'
        },
        {
            field: 'lat',
            message: 'Latitude should not be empty.'
        },
        {
            field: 'lon',
            message: 'Longitude should not be empty.'
        }
    ],
    'verifyOtp': [
        {
            field: 'uuid',
            message: 'Device not recognized.'
        },
        {
            field: 'uid',
            message: 'User Id should not be empty.'
        },
        {
            field: 'otp',
            message: 'Otp should not be empty.'
        }
    ],
    'user/edit': [
        {
            field: 'uuid',
            message: 'Device not recognized.'
        },
        {
            field: 'uid',
            message: 'User Id should not be empty.'
        },
        {
            field: 'type',
            message: 'Type should not empty.'
        }
    ],
    'user/save': [
        {
            field: 'uuid',
            message: 'Device not recognized.'
        },
        {
            field: 'uid',
            message: 'User Id should not be empty.'
        },
        {
            field: 'type',
            message: 'Type should not empty.'
        }
    ],
    'user/holdList': [
        {
            field: 'uuid',
            message: 'Device not recognized.'
        },
        {
            field: 'uid',
            message: 'User Id should not be empty.'
        },
        {
            field: 'type',
            message: 'Type should not empty.'
        }
    ],
    'user/action': [
        {
            field: 'uuid',
            message: 'Device not recognized.'
        },
        {
            field: 'uid',
            message: 'User Id should not be empty.'
        },
        {
            field: 'name',
            message: 'Name should not be empty.'
        },
        {
            field: 'to',
            message: 'To user id should not be empty.'
        },
        {
            field: 'connectionStatus',
            message: 'Connection Status should not be empty.'
        },
        {
            field: 'category',
            message: 'Category should not be empty.'
        }
    ],
    'user/view': [
        {
            field: 'uuid',
            message: 'Device not recognized.'
        },
        {
            field: 'uid',
            message: 'User id should not be empty.'
        }
    ],

    'chat/list': [
        {
            field: 'uuid',
            message: 'Device not recognized.'
        },
        {
            field: 'uid',
            message: 'User id should not be empty.'
        }
    ],
    'chat/join': [
        {
            field: 'uid',
            message: 'User id should not be empty.'
        },
        {
            field: 'socketId',
            message: 'Socket should not be empty.'
        }
    ],
    'chat/updateFlag': [
        {
            field: 'uid',
            message: 'User id should not be empty.'
        },
        {
            field: 'to',
            message: 'To user id should not be empty.'
        },
        {
            field: 'ts',
            message: 'Timestamp should not be empty.'
        },
        {
            field: 'readFlag',
            message: 'Read Flag should not be empty.'
        },
    ],
    'chat/save': [
        {
            field: 'uid',
            message: 'User id should not be empty.'
        },
        {
            field: 'to',
            message: 'To user id should not be empty.'
        },
        {
            field: 'ts',
            message: 'Timestamp should not be empty.'
        },
        {
            field: 'msg',
            message: 'Message should not be empty.'
        }
    ],
    'chat/saveMedia': [
        {
            field: 'uuid',
            message: 'Device not recognized.'
        },
        {
            field: 'uid',
            message: 'User id should not be empty.'
        }
    ],
    'chat/get': [
        {
            field: 'uuid',
            message: 'Device not recognized.'
        },
        {
            field: 'uid',
            message: 'User id should not be empty.'
        },
        {
            field: 'to',
            message: 'To user id should not be empty.'
        },
        {
            field: 'ts',
            message: 'Timestamp should not be empty.'
        }
    ],
    'chat/getCanChat': [
        {
            field: 'uuid',
            message: 'Device not recognized.'
        },
        {
            field: 'uid',
            message: 'User id should not be empty.'
        },
        {
            field: 'to',
            message: 'To user id should not be empty.'
        }
    ],
    'match': [
        {
            field: 'uuid',
            message: 'Device not recognized.'
        },
        {
            field: 'uid',
            message: 'User id should not be empty.'
        },
        {
            field: 'type',
            message: 'Type should not be empty.'
        },
        {
            field: 'subType',
            message: 'SubType should not be empty.'
        },
        {
            field: 'lat',
            message: 'Latitude should not be empty.'
        },
        {
            field: 'lon',
            message: 'Longitude should not be empty.'
        }
    ],
    'matchReverse': [
        {
            field: 'uuid',
            message: 'Device not recognized.'
        },
        {
            field: 'uid',
            message: 'User id should not be empty.'
        },
        {
            field: 'type',
            message: 'Type should not be empty.'
        },
        {
            field: 'subType',
            message: 'SubType should not be empty.'
        },
        {
            field: 'lat',
            message: 'Latitude should not be empty.'
        },
        {
            field: 'lon',
            message: 'Longitude should not be empty.'
        }
    ],
    'matchBi': [
        {
            field: 'uuid',
            message: 'Device not recognized.'
        },
        {
            field: 'uid',
            message: 'User id should not be empty.'
        },
        {
            field: 'type',
            message: 'Type should not be empty.'
        },
        {
            field: 'subType',
            message: 'SubType should not be empty.'
        },
        {
            field: 'lat',
            message: 'Latitude should not be empty.'
        },
        {
            field: 'lon',
            message: 'Longitude should not be empty.'
        }
    ],
    'user/profilePic': [
        {
            field: 'uuid',
            message: 'Device not recognized.'
        },
        {
            field: 'uid',
            message: 'User id should not be empty.'
        }
    ],
    'user/delete': [
        {
            field: 'uuid',
            message: 'Device not recognized.'
        },
        {
            field: 'uid',
            message: 'User id should not be empty.'
        }
    ],
    'user/list': [
        {
            field: 'uuid',
            message: 'Device not recognized.'
        },
        {
            field: 'uid',
            message: 'User id should not be empty.'
        },
        {
            field: 'flag',
            message: 'Flag should not be empty.'
        }
    ],
    'questions/get': [
        {
            field: 'uuid',
            message: 'Device not recognized.'
        },
        {
            field: 'uid',
            message: 'User id should not be empty.'
        }

    ],
    'slabs/get': [
        {
            field: 'uuid',
            message: 'Device not recognized.'
        },
        {
            field: 'uid',
            message: 'User id should not be empty.'
        }

    ],
    'user/payment': [
        {
            field: 'uuid',
            message: 'Device not recognized.'
        },
        {
            field: 'uid',
            message: 'User id should not be empty.'
        },

        {
            field: 'transactionId',
            message: 'transaction id should not be empty.'
        },
        {
            field: 'fName',
            message: 'First Name should not be empty.'
        },
        {
            field: 'lName',
            message: 'Last Name should not be empty.'
        },
        {
            field: 'address',
            message: 'Address should not be empty.'
        },
        {
            field: 'city',
            message: 'City should not be empty.'
        },
        {
            field: 'state',
            message: 'State should not be empty.'
        },
        {
            field: 'country',
            message: 'Country should not be empty.'
        },
        {
            field: 'zipCode',
            message: 'zipCode should not be empty.'
        },
        {
            field: 'mobile',
            message: 'Mobile should not be empty.'
        },
        {
            field: 'email',
            message: 'Email should not be empty.'
        },
        {
            field: 'slab',
            message: 'Slab should not be empty.'
        },
        {
            field: 'paymentStatus',
            message: 'Payment status should not be empty.'
        }

    ],
    'user/signout': [
        {
            field: 'uuid',
            message: 'Device not recognized.'
        },
        {
            field: 'uid',
            message: 'User id should not be empty.'
        }
    ],

    'chat/getCanChat': [
        {
            field: 'uuid',
            message: 'Device not recognized.'
        },
        {
            field: 'uid',
            message: 'User id should not be empty.'
        }
    ],

    'user/splash': [
        {
            field: 'uuid',
            message: 'Device not recognized.'
        },
        {
            field: 'uid',
            message: 'User id should not be empty.'
        }
    ],

    'user/forgotPassword': [
        {
            field: 'uuid',
            message: 'Device not recognized.'
        },
        {
            field: 'email',
            message: 'Email should not be empty.'
        }
    ],
    'user/setPassword': [
        {
            field: 'uuid',
            message: 'Device not recognized.'
        }, {
            field: 'uid',
            message: 'User id should not be empty.'
        }, {
            field: 'password',
            message: 'Password should not be empty.'
        }
    ],
    'user/view': [
        {
            field: 'uuid',
            message: 'Device not recognized.'
        }, {
            field: 'uid',
            message: 'User id should not be empty.'
        }, {
            field: 'loggedInId',
            message: 'loggedInId should not be empty.'
        }
    ],
    'privacy/users': [
        {
            field: 'uuid',
            message: 'Device not recognized.'
        }, {
            field: 'uid',
            message: 'User id should not be empty.'
        }, {
            field: 'field',
            message: 'Field should not be empty.'
        }
    ],
    'compulsory/field': [
        {
            field: 'uuid',
            message: 'Device not recognized.'
        },
        {
            field: 'uid',
            message: 'User id should not be empty.'
        }
        ,
        {
            field: 'category',
            message: 'Category should not be empty.'
        }
    ]
};
