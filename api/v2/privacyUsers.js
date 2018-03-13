/**
 * Created by INFYZO\rachana.thakkar on 13/12/16.
 */
var db = require('./../../app/db');
var gl = require('./generalLib');
var ObjectID = require('mongodb').ObjectID;
module.exports = function (req, res) {
    var output = {responseCode: 500, responseMsg: 'There is technical issue with systems'};
    var data = req.body.data;
    var field = data.field;
    var privacyUsers = [];
    var select = {};
    select[data.field] = 1;
    db.getSelected('user', {_id: new ObjectID(data.uid)}, select, function (result) {
        if (!result) {
            res.json(output);
            res.end();
        } else {
            db.getAll('user', {_id: {$in: result[field].privacy}}, {_id:1,fname:1,lname:1,age:1,aboutMe:1,profilePics:1}, function (results) {
                if (!results) {
                    var output = {responseCode: 500, responseMsg: 'There is technical issue with systems'};
                    res.json(output);
                    res.end();
                } else {
                    for (var x in results) {
                        var userObj = {};
                        userObj._id = results[x]._id;
                        userObj.fname = results[x].fname;
                        userObj.lname = results[x].lname;
                        userObj.age = results[x].age;
                        userObj.aboutMe = results[x].aboutMe;
                        userObj.profilePics = results[x].profilePics;
                        privacyUsers.push(userObj);
                    }
                    var output = {responseCode: 200, responseMsg: 'privacyUsers list'};
                    output.data = privacyUsers;
                    res.json(output);
                    res.end();
                }
            });
        }
    });
}