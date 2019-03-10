/**
 * Created by INFYZO\saunak.shah on 15/12/16.
 */

var db = require('./../../app/db');
var ObjectID = require('mongodb').ObjectID;
var generalLib = require('./generalLib');

module.exports = function (req, res) {
    var data = req.body.data;

    switch (data.type) {

        case 1:
            db.get('user', {_id:new ObjectID(data.uid)}, function (result) {
                if(!result){
                    res.json({
                        responseCode: 401,
                        responseMsg: 'Unauthorized user.'
                    });
                }else{
                    var output = {};
                    output.responseCode = 200;
                    output.responseMsg = '';
                    var catArr = ["Casual","Friendship","Dating","Relationship","LiveIn","Marriage"];
                    var catList = [{
                        Casual: {
                            cnt: 0
                        },
                        Friendship: {
                            cnt: 0
                        },
                        Dating: {
                            cnt: 0
                        },
                        Relationship: {
                            cnt: 0
                        },
                        LiveIn: {
                            cnt: 0
                        },
                        Marriage: {
                            cnt: 0
                        }
                    }];

                    for(x in catArr){
                        var cnt = 0;
                        var len = (result.connections[catArr[x]].users) ? result.connections[catArr[x]].users.length : 0;
                        if(len > 0){
                            for(y in result.connections[catArr[x]].users){
                                var users = result.connections[catArr[x]].users;
                                var len = users.length;
                                cnt++;
                                if(users[y].status == "hold"){
                                    catList[0][catArr[x]].cnt = cnt;

                                    if(cnt == len && catArr[x] == "Marriage"){
                                        output.data = catList;
                                        res.json(output);
                                        return false;
                                    }
                                } else{
                                    if(cnt == len && catArr[x] == "Marriage"){
                                        output.data = catList;
                                        res.json(output);
                                        return false;
                                    }
                                }
                            }
                        } else{
                            if(cnt == len && catArr[x] == "Marriage"){
                                output.data = catList;
                                res.json(output);
                                return false;
                            }
                        }

                    }
                }
            });
            break;

        case 2:
            if(!data.category){
                res.json({responseCode: 0, responseMsg: 'Category should not be empty.'});
                return false;
            }
            db.get('user', {_id:new ObjectID(data.uid)}, function (result) {
                if(!result){
                    res.json({
                        responseCode: 401,
                        responseMsg: 'Unauthorized user.'
                    });
                } else {
                    var userIds = [];
                    var users = result.connections[data.category].users;

                    var cnt = 0;
                    var len = users.length;
                    for (x in users) {
                        cnt++;
                        if (users[x].status == 'hold') {
                            userIds.push(users[x]._id);
                            if (cnt == len) {
                                getUsers(res, userIds, data.category);
                            }
                        } else {
                            if (cnt == len) {
                                getUsers(res, userIds, data.category);
                            }
                        }
                    }
                }

                function getUsers(res, userIds, category) {
                    if (userIds.length <= 0) {
                        res.json({
                            responseCode: 0,
                            responseMsg: 'No profile for ' + category
                        });
                    } else {
                        var select = {
                            _id: 1,
                            fname: 1,
                            lname: 1,
                            age: 1,
                            city:1,
                            location:1,
                            tagLine: 1,
                            distance: 1,
                            industry:1,
                            designation:1,
                            connections:1,
                            subscription:1,
                            profilePics: 1
                        };
                        db.getAll('user', {_id: {$in: userIds}}, select, function (filteredUsers) {
                            if (!filteredUsers) {
                                res.json({
                                    responseCode: 401,
                                    responseMsg: 'There is some error.'
                                });
                            } else {
                                var output = {};
                                output.responseCode = 200;
                                output.responseMsg = '';
                                var toUsers=[];

                                for(i in filteredUsers){

                                    // Remove favourite from the connection object
                                    delete filteredUsers[i].connections.favourite;

                                    // Create a user array for output
                                    toUsers[i] = {
                                        _id: filteredUsers[i]._id,
                                        fname: filteredUsers[i].fname,
                                        lname: filteredUsers[i].lname,
                                        age: filteredUsers[i].age.self,
                                        city: filteredUsers[i].city.self,
                                        thumbImage: (filteredUsers[i].profilePics[0].thumb !== undefined)
                                            ? filteredUsers[i].profilePics[0].thumb : '',
                                        profilePics: (filteredUsers[i].profilePics[0].large !== undefined)
                                            ? filteredUsers[i].profilePics[0].large : '',
                                        distance: generalLib.distance(result.location.self.coordinates[0],
                                            result.location.self.coordinates[1],
                                            filteredUsers[i].location.self.coordinates[0],
                                            filteredUsers[i].location.self.coordinates[1], 'K'),
                                        industry: (filteredUsers[i].industry != undefined) ? filteredUsers[i].industry.self : '',
                                        designation: (filteredUsers[i].designation != undefined) ? filteredUsers[i].designation.self : '',
                                        tagLine: filteredUsers[i].tagLine,
                                        category: Object.keys(filteredUsers[i].connections).map(function (data) {
                                            return {category: data, status: filteredUsers[i].connections[data].status};
                                        }),
                                        isLock: (filteredUsers[i].subscription > result.subscription) ? true : false,
                                        subscription: filteredUsers[i].subscription
                                    };
                                }

                                output.data = {
                                    _id:result._id,
                                    fname:result.fname,
                                    lname:result.lname,
                                    thumbImage:result.profilePics[0].thumb,
                                    subscription:result.subscription,
                                    searchData:toUsers
                                };
                                res.json(output);
                                return false;
                            }
                        });
                    }
                }
            });
            break;

        default:
            res.json({responseCode: 0, responseMsg: 'Field is not defined..'});
            return false;
    }
};