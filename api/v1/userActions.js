/**
 * Created by INFYZO\alok.chauhan on 27/8/16.
 */
var db = require('./../../app/db');
var model = require('./model');

module.exports = function (req, res) {
    var ObjectID = require('mongodb').ObjectID;
    var data = req.body.data;
    var msgType = "msg";

    if (req.file) {
        var data = JSON.parse(data);
        var generalLib = require('./generalLib');
        if (req.file.mimetype) {
            var mime = req.file.mimetype;
            var filetype = mime.substr(0, 5);

            if (filetype == "audio") {
                msgType = "audio";
                var uploadPath = 'uploads/chatmedia/audio/';
            } else {
                res.json({responseCode: 500, responseMsg: 'Invalid audio file.'});
                return false;
            }
        }

        var timestamp = new Date().getTime().toString();
        generalLib.uploadFile(req, res, uploadPath, timestamp, function (path) {
            var appConfig = require('./../../app/config');

            msg.file = {
                url: "http://" + appConfig.host + '/Lovecoy-Webservice/' + path,
                type: req.file.mimetype,
                size: req.file.size
            };
        });
    }

    // If uuid is empty
    if (!data.uuid) {
        res.json({responseCode: 500, responseMsg: 'Device not recognized.'});
        return false;
    }

    // if user Id is empty
    if (!data.uid) {
        res.json({responseCode: 500, responseMsg: 'User Id should not be empty.'});
        return false;
    }

    // if user name is empty
    if (!data.name) {
        res.json({responseCode: 500, responseMsg: 'Name should not be empty.'});
        return false;
    }

    // if to Id is empty
    if (!data.to) {
        res.json({responseCode: 500, responseMsg: 'To user id should not be empty.'});
        return false;
    }

    // if user Id is empty
    if (!data.connectionStatus) {
        res.json({responseCode: 500, responseMsg: 'Connection Status should not be empty.'});
        return false;
    }

    // Convert from and to params which are in string to objectId of mongodb
    var from = new ObjectID(data.uid);
    var to = new ObjectID(data.to);

    var msg = {
        data: data.name + ' sent you a request',
        file: {}
    };

    // Connection Status flag either from [connected, hold, declined]
    var updateData = {
        connectionStatus: data.connectionStatus
    };

    var where = {
        from: from,
        to: to
    };

    //Send gift to user
    if (data.gift) {
        var giftsData = {};
        giftsData['gifts.' + data.gift] = -1;
        db.updateData('user', {_id: from}, {$inc: giftsData}, function (row) {
            // Any issue during update or insert query will return false
            if (!row.ok) {
                console.log('There is some error to update data.');
            }
        });
        updateData.gifts = {};
        updateData.gifts[data.gift] = 1;
        msg.gift = data.gift;
        msgType = "gift";
    }
    //Enter the To User's globalPrivacy settings in privacy Setting table.
    db.getSelected('user', {_id: to}, {privacySettings: 1}, function (users) {
        var updatedDataTo={};
        updatedDataTo.connectionStatus= data.connectionStatus;
        updatedDataTo.privacySettings = users.privacySettings;
        db.updateUser('privacySettings', {
            from: to,
            to: from
        }, updatedDataTo, function (row) {
            var output = {responseCode: 500, responseMsg: 'There is some error to update data.', data: []};

            // Any issue during update or insert query will return false
            if (!row.ok) {
                res.json(output);
                res.end();
            }
        });
    });


    db.getSelected('user', {_id: from}, {privacySettings: 1}, function (users) {
        updateData.privacySettings = users.privacySettings;
        db.updateUser('privacySettings', {
            from: from,
            to: to
        }, updateData, function (row) {
            var output = {responseCode: 500, responseMsg: 'There is some error to update data.', data: []};

            // Any issue during update or insert query will return false
            if (!row.ok) {
                res.json(output);
                res.end();
            }

            // Request is for connected i.e chat request of audio send will store here as connected in chatRoom
            if (data.connectionStatus === 'connected') {
                db.updateData('user', {_id: from}, {
                    $addToSet: {
                        "dateOMeter.dm-1": {
                            "_id": ObjectID(to),
                            "type": msgType
                        }
                    }
                }, function (row) {
                    // Any issue during update or insert query will return false
                    if (!row.ok) {
                        console.log('There is some error to update data.');
                    }
                });
                db.updateData('user', {_id: to}, {
                    $addToSet: {
                        "dateOMeter.dm-0": {
                            "_id": ObjectID(from),
                            "type": msgType
                        }
                    }
                }, function (row) {
                    // Any issue during update or insert query will return false
                    if (!row.ok) {
                        console.log('There is some error to update data.');
                    }
                });
                // Check whether request already been sent to use
                model.isChatRequestSend('userChatRooms', where, function (isSent) {
                    // If request not send means notSent will set to true and
                    // system will add the request to collection and notify user as response

                    // set msgType chat if msgType is not gift and audio
                    if (msgType !== "gift" && msgType !== "audio") {
                        msg = "chat";
                    } else {
                        msg = msgType;
                    }

                    if (!isSent) {

                        where.canChat = 0;

                        // Save request into userChatRooms collection and response json output
                        model.saveChatRequest('userChatRooms', where, function (result) {

                            if (!result) {
                                console.log('Some error');
                                res.json(output);
                                res.end();
                            } else {
                                var insertObj = {
                                    to: to,
                                    ts: new Date(),
                                    from: {
                                        from: from,
                                        name: data.name
                                    },
                                    msg: msg,
                                    msgType: msgType
                                };

                                model.saveChat('chatMessages', insertObj, function (chat) {
                                    output.responseCode = 200;
                                    output.responseMsg = msg.charAt(0).toUpperCase() + msg.slice(1) + ' request sent successfully.';

                                    output.data = result;
                                    res.json(output);
                                    return false;
                                });
                            }
                        });
                    }
                    // Request already saved in to collection so return with message
                    else {
                        output.responseCode = 200;
                        output.responseMsg = msg.charAt(0).toUpperCase() + msg.slice(1) + ' request already sent';
                        res.json(output);
                        res.end();
                    }
                });
            }
            else {
                // In case hold or declined status will just save in privacy settings.
                output.responseCode = 200;
                if (data.connectionStatus == "hold") {
                    output.responseMsg = 'Hold profile successfully';
                } else {
                    output.responseMsg = 'Here is your next profile';
                }
                output.data = row;
                res.json(output);
            }
        });
    });
    // Insert or update data in to privacySettings collection for user action flag

};