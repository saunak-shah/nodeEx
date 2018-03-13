/**
 * Created by infyzo on 24/11/16.
 */
var db = require('./../../app/db');
var gl = require('./generalLib');
var ObjectID = require('mongodb').ObjectID;

module.exports = function (req, res) {
    var data = req.body.data;
    var uid = new ObjectID(data.uid);
    var oldPassword = data.oldPassword;
    //Generate MD5 password
    var password = gl.encyPasscode(data.password);

    // Change Password Process
    if (oldPassword != undefined) {
        //Generate OLD MD5 password
        var encryptedPassword = gl.encyPasscode(oldPassword);
        // Check if user old password is correct or not...
        db.get('user', {password: encryptedPassword, _id: uid}, function (result) {
            if (!result) {
                res.json({
                    responseCode: 402,
                    responseMsg: 'Your Password is incorrect.'
                });
                return false;
            } else {
                //Update password in user collection
                db.updateUser('user', {_id: uid}, {password: password}, function (row) {
                    if (!row) {
                        res.json({responseCode: 500, responseMsg: 'There is some error to update data.'});
                        return false;
                    } else {
                        var output = {
                            responseCode: 200,
                            responseMsg: "Your password has been changed.."
                        };
                        res.json(output);
                    }
                });
            }
        });
    }
    //Default Set Password Process
    else {
        //Update password in user collection
        db.updateUser('user', {_id: uid}, {password: password}, function (row) {
            if (!row) {
                res.json({responseCode: 500, responseMsg: 'There is some error to update data.'});
                return false;
            } else {
                var output = {
                    responseCode: 200,
                    responseMsg: "Your password is set successfully.."
                };
                res.json(output);
            }
        });
    }
};