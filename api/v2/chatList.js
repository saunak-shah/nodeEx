/**
 * Lovecoy Bootstrap file.
 * @author Infyzo Websol Pvt. Ltd.
 * @copyright 2016 Infyzo Websol Pvt. Ltd.
 * @licence
 * @version 1.0.0
 */

var db = require('./../../app/db');
var generalLib = require('./generalLib');
var ObjectID = require('mongodb').ObjectID;
var model = require('./model');

module.exports = function (req, res) {
    var data = req.body.data;
    var output = {};

    // convert request uid to object id
    var id = new ObjectID(data.uid);

    // Send Data object to db functions
    var data = {
        id: id
    };

    // function to get chat count by category
    chatMessages({to: id,$or: [{readFlag: 0}, {readFlag: 1}], category:"Casual"});
    chatMessages({to: id,$or: [{readFlag: 0}, {readFlag: 1}], category:"Friendship"});
    chatMessages({to: id,$or: [{readFlag: 0}, {readFlag: 1}], category:"Dating"});
    chatMessages({to: id,$or: [{readFlag: 0}, {readFlag: 1}], category:"Relationship"});
    chatMessages({to: id,$or: [{readFlag: 0}, {readFlag: 1}], category:"LiveIn"});
    chatMessages({to: id,$or: [{readFlag: 0}, {readFlag: 1}], category:"Marriage"});



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
    function chatMessages(where){
        db.getAll('chatMessages', where, {}, function (result) {
            if(where.category == "Casual"){
                catList[0].Casual.cnt = result.length;
            } else if(where.category == "Friendship"){
                catList[0].Friendship.cnt = result.length;
            } else if(where.category == "Dating"){
                catList[0].Dating.cnt = result.length;
            } else if(where.category == "Relationship"){
                catList[0].Relationship.cnt = result.length;
            } else if(where.category == "LiveIn"){
                catList[0].LiveIn.cnt = result.length;
            } else if(where.category == "Marriage"){
                catList[0].Marriage.cnt = result.length;
                // function to get favouritelist with chat count
                getFavouriteList();
            }
        });
    }

    function getCasualChat(id, cat, toUsers, user){
        db.getChatByCat(id, cat, function(chatList){
            if(!chatList){
                res.json({
                    responseCode: 401,
                    responseMsg: 'Chat List not found.'
                });
            } else{
                if(cat == "Casual"){
                    getChatList(id,cat, chatList, toUsers, user);
                } else if (cat == "Friendship") {
                    getChatList(id, cat, chatList, toUsers);
                } else if (cat == "Dating") {
                    getChatList(id, cat, chatList, toUsers);
                } else if (cat == "Relationship") {
                    getChatList(id, cat, chatList, toUsers);
                } else if (cat == "LiveIn") {
                    getChatList(id, cat, chatList, toUsers);
                } else if (cat == "Marriage") {
                    getChatList(id, cat, chatList, toUsers, function () {
                        output.responseCode = 200;
                        output.responseMsg = "Profile get successfully.";
                        output.data = {
                            catChatCnt: catList,
                            favouriteList: toUsers,
                            catUsers: catUsers
                        };
                        res.json(output);
                    });
                }
            }
        })
    };

    function getChatList(id, cat, chatList, toUsers, user) {
        var catUsers = {
            Casual:[],
            Friendship:[],
            Dating:[],
            Relationship:[],
            LiveIn:[],
            Marriage:[]
        };

        var ids = [];
        for (x in chatList) {
            ids.push(chatList[x]._id)
        }
        var whereAll = {
            _id: {$in: ids}
        };
        var selectAll = {
            _id: 1,
            fname: 1,
            lname: 1,
            age: 1,
            city: 1,
            location: 1,
            tagLine: 1,
            distance: 1,
            industry: 1,
            designation: 1,
            connections: 1,
            subscription: 1,
            profilePics: 1
        };

        db.getAll('user', whereAll, selectAll, function (filteredUsers) {
            if(filteredUsers.length > 0){
                var ids = [];
                for (x in chatList) {
                    ids.push(chatList[x]._id.toString())
                }

                for (y in filteredUsers) {
                    var pos = ids.indexOf(filteredUsers[y]._id.toString());
                    filteredUsers[y].catCnt = chatList[pos].total
                }

                for (i in filteredUsers) {
                    // Create a user array for output
                    catUsers[cat].push(
                        {
                            _id: filteredUsers[i]._id,
                            fname: filteredUsers[i].fname,
                            lname: filteredUsers[i].lname,
                            age: filteredUsers[i].age.self,
                            city: filteredUsers[i].city.self,
                            thumbImage: (filteredUsers[i].profilePics[0].thumb !== undefined)
                                ? filteredUsers[i].profilePics[0].thumb : '',
                            profilePics: (filteredUsers[i].profilePics[0].large !== undefined)
                                ? filteredUsers[i].profilePics[0].large : '',
                            distance: generalLib.distance(user.location.self.coordinates[0],
                                user.location.self.coordinates[1],
                                filteredUsers[i].location.self.coordinates[0],
                                filteredUsers[i].location.self.coordinates[1], 'K'),
                            industry: (filteredUsers[i].industry != undefined) ? filteredUsers[i].industry.self : '',
                            designation: (filteredUsers[i].designation != undefined) ? filteredUsers[i].designation.self : '',
                            tagLine: filteredUsers[i].tagLine,
                            category: Object.keys(filteredUsers[i].connections).map(function (data) {
                                return {
                                    category: data,
                                    status: filteredUsers[i].connections[data].status
                                };
                            }),
                            isLock: (filteredUsers[i].subscription > user.subscription) ? true : false,
                            subscription: filteredUsers[i].subscription,
                            lastChatTime: "10:35am",
                            casCnt: filteredUsers[i].catCnt
                        }
                    );
                }
            }

            output.responseCode = 200;
            output.responseMsg = "Profile get successfully.";
            output.data = {
                catChatCnt: catList,
                favouriteList: toUsers,
                catUsers: catUsers
            };
            res.json(output);
        });
    }

    function getFavouriteList(){
        var select = {
            'connections.favourite': true,
            'city.self': true,
            'location.self': true
        };

        db.getSelected('user', {_id:id}, select, function (user) {
            if(!user){
                res.json({
                    responseCode: 401,
                    responseMsg: 'Unauthorized user.'
                });
            } else {
                if(user.hasOwnProperty("connections") && user.connections.hasOwnProperty("favourite")){
                    db.getChatList(id,user.connections.favourite, function (favouriteList){
                        output.responseCode = 200;
                        output.responseMsg = "Profile get successfully.";
                        output.data = {
                            catChatCnt: catList,
                            favouriteList: favouriteList,
                            //catUsers: catUsers
                        };
                        res.json(output);return false;
                        var favArr = [];
                        for(x in favouriteList){
                            favArr.push(favouriteList[x]._id)
                        }

                        var whereAll = {
                            _id: {$in: favArr}
                        };

                        var selectAll = {
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
                        db.getAll('user', whereAll, selectAll, function (filteredUsers) {

                            // due to comparision need to convert object id to string
                            var favArr = [];
                            for(x in favouriteList){
                                favArr.push(favouriteList[x]._id.toString())
                            }

                            for(y in filteredUsers){
                                var pos = favArr.indexOf(filteredUsers[y]._id.toString());
                                filteredUsers[y].cnt = favouriteList[pos].total
                            }

                            var toUsers=[];

                            for(i in filteredUsers){
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
                                    distance: generalLib.distance(user.location.self.coordinates[0],
                                        user.location.self.coordinates[1],
                                        filteredUsers[i].location.self.coordinates[0],
                                        filteredUsers[i].location.self.coordinates[1], 'K'),
                                    industry: (filteredUsers[i].industry != undefined) ? filteredUsers[i].industry.self : '',
                                    designation: (filteredUsers[i].designation != undefined) ? filteredUsers[i].designation.self : '',
                                    tagLine: filteredUsers[i].tagLine,
                                    category: Object.keys(filteredUsers[i].connections).map(function (data) {
                                        return {category: data, status: filteredUsers[i].connections[data].status};
                                    }),
                                    isLock: (filteredUsers[i].subscription > user.subscription) ? true : false,
                                    subscription: filteredUsers[i].subscription,
                                    lastChatTime:"10:35am",
                                    cnt: filteredUsers[i].cnt
                                };
                            }

                            output.responseCode = 200;
                            output.responseMsg = "Profile get successfully.";
                            output.data={
                                catChatCnt :users,
                                favoutiteList:toUsers
                            };

                            //output.data=toUsers;
                            res.json(output);
                        });
                    });
                } else{
                    getCasualChat(id, "Casual", [], user);
                    getCasualChat(id, "Friendship", [], user);
                    getCasualChat(id, "Dating", [], user);
                    getCasualChat(id, "Relationship", [], user);
                    getCasualChat(id, "LiveIn", [], user);
                    getCasualChat(id, "Marriage", [], user);
                }
            }
        });
    }
};
