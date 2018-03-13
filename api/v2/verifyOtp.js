/**
 * Created by INFYZO\saunak.shah on 25/11/16.
 */
var db = require('./../../app/db');
var ObjectID = require('mongodb').ObjectID;

module.exports = function (req, res) {
    var data = req.body.data;
    // get user data
    db.get('user', {_id: new ObjectID(data.uid)}, function (result) {
        if (!result) {
            res.json({
                responseCode: 500,
                responseMsg: 'There is some error to get data.'
            });
            return false;
        } else {
            var output = {};
            if(result.otp !== data.otp){
                output.responseCode = 200;
                output.responseMsg = "Otp not matched.";
            } else{
                var updateData = {
                    'otp': ''
                };
                // update user data.
                db.saveUser('user', {_id: new ObjectID(data.uid)}, {$set: updateData}, function (user) {
                    if (!user) {
                        res.json({
                            responseCode: 500,
                            responseMsg: 'There is some error to get data.'
                        });
                        return false;
                    } else {
                        output.responseCode = 200;
                        output.responseMsg = "Otp has been verified.";

                        delete user.lastLoginIP;
                        delete user.createdOn;
                        delete user.updatedOn;

                        output.data = user;
                        res.json(output);
                    }
                });
            }
        }
    });

};