/**
 * Created by INFYZO\hitesh.parikh on 5/9/16.
 */


var ObjectID = require('mongodb').ObjectID;
var db = require('./../../app/db');
var generalLib = require('./generalLib');

module.exports = function (req, res) {
    var data = req.body.data;
    db.getSelected('user', {_id: new ObjectID(data.uid)}, {"connections": 1, "location": 1}, function (result) {
        if (!result) {
            res.json({responseCode: 402, responseMsg: 'User not found.'});
        } else {
            var userIds = [];
            var userIdsCat = [];
            var proposalIds = [];
            for (var x in result.connections) {
                var catObj = {"category": x};
                var catUsers = [];
                for (var y in result.connections[x].users) {
                    if (result.connections[x].users[y].status == data.flag) {
                        userIds.push(result.connections[x].users[y]._id);
                        catUsers.push(result.connections[x].users[y]._id);
                    }
                }
                catObj.users = catUsers;
                userIdsCat.push(catObj);
            }

            db.getAll('user', {_id: {$in: userIds}}, {}, function (results) {
                if (!result) {
                    res.json({responseCode: 402, responseMsg: 'Users not found.'});
                } else {
                    for (var x in results) {
                        var selectedUserCat = [];
                        var userObj = {};
                        userObj._id = results[x]._id,
                            userObj.fname = results[x].fname,
                            userObj.lname = results[x].lname,
                            userObj.age = results[x].age.self,
                            userObj.city = results[x].city.self,
                            userObj.thumbImage = (results[x].profilePics[0].length == 0) ? '' : results[x].profilePics[0].thumb,
                            userObj.profilePics = (results[x].profilePics[0].length == 0) ? '' : results[x].profilePics[0].large,
                            userObj.distance = generalLib.distance(results[x].location.self.coordinates[0], results[x].location.self.coordinates[1], result.location.self.coordinates[0], result.location.self.coordinates[1], 'K'),
                            userObj.industry = (results[x].industry != undefined) ? results[x].industry.self : '',
                            userObj.designation = (results[x].designation != undefined) ? results[x].designation.self : '',
                            userObj.tagLine = (results[x].tagLine != undefined) ? results[x].tagLine : "";
                        for (var y in userIdsCat) {
                            for (var z in userIdsCat[y].users) {
                                if (results[x]._id.toString() == userIdsCat[y].users[z].toString()) {
                                    selectedUserCat.push(userIdsCat[y].category);
                                }
                            }
                        }
                        var category = [];
                        for (var x in result.connections) {
                            var obj = {};
                            obj.category = x;
                            obj.status = (selectedUserCat.indexOf(x) < 0) ? 0 : 1;
                            if (x != "favourite")
                                category.push(obj);
                        }
                        userObj.category = category;
                        proposalIds.push(userObj);
                    }
                    var output = {responseCode: 200, responseMsg: 'Proposal list'};
                    output.data = proposalIds;
                    res.json(output);
                    res.end();
                }
            });
        }
    });
};
