/**
 * Created by INFYZO\alok.chauhan on 27/8/16.
 */
var db = require('./../../app/db');
var model = require('./model');
var generalLib = require('./generalLib');
module.exports = function (req, res) {
    var ObjectID = require('mongodb').ObjectID;
    var data = (req.file) ? JSON.parse(req.body.data) : req.body.data;
    var uid = new ObjectID(data.uid);
    var to = new ObjectID(data.to);

    var insertObj = {
        to: to,
        ts: new Date(),
        readFlag: 0,
        from: {
            from: uid,
            name: data.name
        },
        "msg": {
            "data": "",
            "file": {}
        },
        msgType: ""
    };
    var generalLib = require('./generalLib');

    //dateOMeter Entry for first and second level
    generalLib.dateOMeter(to, uid, data.msgType);

    if (req.file) {

        if (req.file.mimetype) {
            var mime = req.file.mimetype;
            var filetype = mime.substr(0, 5);

            if (filetype == "audio") {
                insertObj.msgType = "Audio";
                var uploadPath = 'uploads/chatmedia/audio/';
            } else {
                res.json({responseCode: 500, responseMsg: 'Invalid audio file.'});
                return false;
            }
        }

        var timestamp = new Date().getTime().toString();
        generalLib.uploadFile(req, res, uploadPath, timestamp, function (path) {
            var appConfig = require('./../../app/config');

            insertObj.msg.file = {
                url: "http://" + appConfig.host + '/Lovecoy-Webservice/' + path,
                type: req.file.mimetype,
                size: req.file.size
            };
        });
    }

    db.get('user', {_id: uid}, function (result) {
        if (!result) {
            res.json({responseCode: 401, responseMsg: 'Incorrect email or password. Login failed'});
            return false;
        } else {
            var user = {};
            var updateData = {};

            switch (data.connectionStatus) {
                case 'requested':
                    // set id and connection status
                    user._id = new ObjectID(data.to);
                    user.status = data.connectionStatus;

                    var cnt = 0;
                    var len = (result.connections[data.category].users) ? result.connections[data.category].users.length : 0;

                    if(len > 0){
                        for (x in result.connections[data.category].users) {
                            var users = result.connections[data.category].users;
                            cnt++;
                            if (users[x]._id == data.to) {
                                users[x].status = "connected";
                                updateData['connections.' + data.category + '.users'] = users;
                                // update status to current user
                                db.saveUser('user', {_id: uid}, {$set: updateData}, function (row) {
                                    if (!row) {
                                        res.json({responseCode: 0, responseMsg: 'There is some error to update data.'});
                                        return false;
                                    } else {
                                        // if status is hold then no need to update or insert status to opponent user
                                        db.get('user', {_id: to}, function (opponentUser) {
                                            if (!opponentUser) {
                                                res.json({
                                                    responseCode: 0,
                                                    responseMsg: 'There is some error to get data.'
                                                });
                                                return false;
                                            } else {
                                                for (y in opponentUser.connections[data.category].users) {
                                                    var toUsers = opponentUser.connections[data.category].users;

                                                    if (toUsers[y]._id == data.uid &&
                                                        (toUsers[y].status == "pending" ||
                                                        toUsers[y].status == "requested")) {

                                                        toUsers[y].status = "connected";
                                                        var updateData = {};
                                                        updateData['connections.' + data.category + '.users'] = toUsers;
                                                        // update status to opponent user
                                                        db.saveUser('user', {_id: to}, {$set: updateData}, function (updateUser) {
                                                            if (!updateUser) {
                                                                res.json({
                                                                    responseCode: 0,
                                                                    responseMsg: 'There is some error to update data.'
                                                                });
                                                                return false;
                                                            } else {
                                                                saveChatMsg(req, res, data, insertObj, result);
                                                            }
                                                        });
                                                    }
                                                }
                                            }
                                        });
                                    }
                                });
                            } else {
                                if (cnt == len) {
                                    user._id = new ObjectID(data.to);
                                    user.status = data.connectionStatus;
                                    updateData['connections.' + data.category + '.users'] = user;
                                    saveUser('user', data, updateData, res);
                                }
                            }
                        }
                    } else{
                        user._id = new ObjectID(data.to);
                        user.status = data.connectionStatus;
                        updateData['connections.' + data.category + '.users'] = user;
                        saveUser('user', data, updateData, res);
                    }

                    break;

                case 'hold':
                    user._id = new ObjectID(data.to);
                    user.status = data.connectionStatus;

                    var cnt = 0;
                    var len = (result.connections[data.category].users) ? result.connections[data.category].users.length : 0;

                    if(len > 0) {
                        for (x in result.connections[data.category].users) {
                            var users = result.connections[data.category].users;
                            cnt++;
                            if (users[x]._id == data.to) {
                                users[x].status = "hold";
                                updateData['connections.' + data.category + '.users'] = users;
                                // update status to current user
                                db.saveUser('user', {_id: uid}, {$set: updateData}, function (row) {
                                    if (!row) {
                                        res.json({responseCode: 0, responseMsg: 'There is some error to update data.'});
                                        return false;
                                    } else {
                                        saveChatMsg(req, res, data, insertObj, result);
                                    }
                                });
                            } else {
                                if (cnt == len) {
                                    updateData['connections.' + data.category + '.users'] = user;
                                    saveUser('user', data, updateData, res);
                                }
                            }
                        }
                    }else{
                        updateData['connections.' + data.category + '.users'] = user;
                        saveUser('user', data, updateData, res);
                    }
                    break;

                case 'block':
                    updateData['connections.' + data.category + '.users'] = {_id: to};
                    db.saveUser('user', {_id: uid}, {$pull: updateData}, function (updateUser) {
                        if (!updateUser) {
                            res.json({
                                responseCode: 0,
                                responseMsg: 'There is some error to update data.'
                            });
                            return false;
                        } else {
                            var updateData = {};
                            updateData['connections.' + data.category + '.block'] = to;
                            saveUser('user', data, updateData, res);
                        }
                    });
                    break;

                case 'ignore':
                    if (data.isChat == 1) {
                        updateData['connections.' + data.category + '.users'] = {_id: to};
                        db.saveUser('user', {_id: uid}, {$pull: updateData}, function (updateUser) {
                            if (!updateUser) {
                                res.json({
                                    responseCode: 0,
                                    responseMsg: 'There is some error to update data.'
                                });
                                return false;
                            } else {
                                var updateData = {};
                                updateData['connections.' + data.category + '.ignore'] = to;
                                saveUser('user', data, updateData, res);
                            }
                        });
                    } else {
                        updateData['connections.' + data.category + '.ignore'] = to;
                        saveUser('user', data, updateData, res);
                    }
                    break;

                default:
                    res.json({responseCode: 0, responseMsg: 'Field is not defined..'});
                    return false;
            }

            function saveChatMsg(req, res, data, insertObj, result) {
                if (data.connectionStatus == "requested") {
                    insertObj.msgType = "Chat";
                    insertObj.msg.data = data.name + " has sent you chat request"
                } else if (data.connectionStatus == "requested" && req.file) {
                    insertObj.msgType = "Audio";
                    insertObj.msg.data = data.name + " has sent you audio request"
                } else if (data.connectionStatus == "hold") {
                    insertObj.msgType = "Hold";
                    insertObj.msg.data = data.name + " has sent you hold request"
                }
                db.insertOne('chatMessages', insertObj, function () {
                    var output = {};
                    output.responseCode = 200;
                    output.responseMsg = insertObj.msgType + ' request sent successfully.';

                    output.data = result;
                    res.json(output);
                    return false;
                });
            }

            function saveUser(table, data, updateData, res) {
                // insert new array to current user.
                db.saveUser(table, {_id: uid}, {$addToSet: updateData}, function (row) {
                    if (!row) {
                        res.json({responseCode: 0, responseMsg: 'There is some error to update data.'});
                        return false;
                    } else {
                        if (data.connectionStatus !== "hold" && data.connectionStatus !== "ignore") {
                            var updateData = {};
                            var toUser = {
                                _id: new ObjectID(data.uid),
                                status: "pending"
                            };

                            if (data.connectionStatus == "block") {
                                updateData['connections.' + data.category + '.blockedBy'] = uid;
                            } else {
                                updateData['connections.' + data.category + '.users'] = toUser;
                            }
                            // insert new array to opponent user.
                            db.saveUser('user', {_id: to}, {$addToSet: updateData}, function (opponentUser) {
                                if (!opponentUser) {
                                    res.json({responseCode: 0, responseMsg: 'There is some error to update data.'});
                                    return false;
                                } else {
                                    if (data.connectionStatus !== "block") {
                                        saveChatMsg(req, res, data, insertObj, result);
                                    } else {
                                        var output = {};
                                        output.responseCode = 200;
                                        output.responseMsg = data.connectionStatus + ' request sent successfully.';

                                        output.data = result;
                                        res.json(output);
                                        return false;
                                    }
                                }
                            });
                        } else {
                            if (data.connectionStatus == "hold") {
                                saveChatMsg(req, res, data, insertObj, result);
                            } else {
                                var output = {};
                                output.responseCode = 200;
                                output.responseMsg = data.connectionStatus + ' request sent successfully.';

                                output.data = result;
                                res.json(output);
                                return false;
                            }
                        }
                    }
                });
            }
        }
    });
};