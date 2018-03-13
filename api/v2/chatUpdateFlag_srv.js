/**
 * Created by INFYZO\hitesh.parikh on 27/8/16.
 */
var db = require('./../../app/db');
var ObjectID = require('mongodb').ObjectID;
var model = require('./model');

module.exports = function (req, res) {
    var data = req.body.data;

    // Who read the messages
    var to = new ObjectID(data.uid);

    // Whose messages are read by uid
    var from = new ObjectID(data.to);

    var where = {
        $and: [{
            to: to,
            'from.from': from,
            ts: {$lte: new Date(data.ts)},
            readFlag: 1
        }]
    };

    var updateChatReadFlag = {
        readFlag: data.readFlag
    };

    db.updateMultiData('chatMessages', where, updateChatReadFlag, function (updateFlags) {
        // Output
        var output = {
            responseCode: 200,
            responseMsg: 'Chat flag successfully updated'
        };

        // Handle database entry in case of select case not working with Chat Entry
        // Check if already enable can chat or chat initiator will call the same.
        if (!updateFlags.ok) {
            // Output
            output = {
                responseCode: 500,
                responseMsg: 'There is some error to update data.'
            };
        }

        res.json(output);
    });
};
