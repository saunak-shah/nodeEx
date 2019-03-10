/**
 * Created by INFYZO\rachana.thakkar on 7/9/16.
 */
var db = require('./../../app/db');
var gl = require('./generalLib');
var ObjectID = require('mongodb').ObjectID;

module.exports = function (req, res) {
    var data = req.body.data;
    var excludedItems = {
        uuid: 0,
        fbId: 0,
        fgcmToken: 0,
        socketId: 0,
        otp: 0,
        isDelete: 0,
        lastLoginIP: 0,
        password: 0,
        gifts: 0,
        dateOMeter: 0,
        connections: 0
    };
    db.getSelected('user', {_id: new ObjectID(data.uid)}, excludedItems, function (result) {
            if (!result) {
                res.json({responseCode: 402, responseMsg: 'User not found.'});
                return false;
            } else {
                var output = {responseCode: 200, responseMsg: "User found.."};
                db.getAll('options', {
                    "$or": [{
                        "type": "field"
                    }, {
                        "key": "dateOMeter"
                    }]
                }, {}, function (options) {
                    if (!options) {
                        res.json(output);
                        res.end();
                    } else {
                        var addedFields = [];
                        for (var y in result) {
                            //Below flag is manage to privacy
                            var show = true;
                            if ((data.loggedInId != data.uid && result[y].privacy != false) || (data.loggedInId == data.uid)) {
                                //to check PrivacyUsers
                                if (typeof(result[y].privacy) == "object" && data.loggedInId != data.uid) {
                                    var pUsers = [];
                                    for (var val in result[y].privacy) {
                                        pUsers.push(result[y].privacy[val].toString());
                                    }
                                    if (pUsers.indexOf(data.loggedInId) < 0) {
                                        show=false;
                                        delete result[y];
                                    }
                                }
                            }
                            if(show == true){addedFields.push(y)}
                        }
                        //if user check his/her own profile.so need to send fields which are not included in user table
                        if (data.loggedInId == data.uid) {
                            for (var x in options) {
                                if (options[x].key != "dateOMeter") {
                                    if (addedFields.indexOf(options[x].key) < 0) {
                                        result[options[x].key] = {};
                                        result[options[x].key].self = options[x].self;
                                        if (options[x].privacy != undefined) result[options[x].key].privacy = options[x].privacy;
                                        if (options[x].partner != undefined) result[options[x].key].partner = options[x].partner;
                                    }
                                }
                            }
                        }
                        output.data = result;
                        res.json(output);
                    }
                });
            }
        }
    );
}


