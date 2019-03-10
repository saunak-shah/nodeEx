/**
 * Created by INFYZO\hitesh.parikh on 27/8/16.
 */
var db = require('./../../app/db');
var ObjectID = require('mongodb').ObjectID;
var model = require('./model');

module.exports = function (req, res) {
    var data = req.body.data;

    var from = new ObjectID(data.uid);
    var to = new ObjectID(data.to);

    var updateChatWhere = {
        from: to,
        to: from
    };

    var updateChatFlag = {
        canChat: 1
    };

    model.getChatRequest('userChatRooms', updateChatWhere, function (chatEntry) {

        // Output
        var output = {
            responseCode: 200,
            responseMsg: 'Chat flag successfully updated'
        };

        // Handle database entry in case of select case not working with Chat Entry
        // Check if already enable can chat or chat initiator will call the same.
        if (chatEntry && (chatEntry.canChat || data.to === from.toString())) {
            res.json(output);
        } else {
            if (!chatEntry.error) {
                db.updateUser('userChatRooms', updateChatWhere, updateChatFlag, function (chat) {
                    res.json(output);
                });
            }
        }
    });
};
