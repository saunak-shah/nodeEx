/**
 * Created by INFYZO\saunak.shah on 26/10/16.
 */

var db = require('./../../app/db');
var model = require('./model');
var ObjectID = require('mongodb').ObjectID;

module.exports = function (req, res) {
    var data = req.body.data;

    var from = new ObjectID(data.uid);
    var to = new ObjectID(data.to);

    var updateChatWhere = {
        from: to,
        to: from
    };

    model.getChatRequest('userChatRooms', updateChatWhere, function (chatEntry) {
        // Output
        var output = {
            responseCode: 200,
            responseMsg: 'Data fetched successfully.',
            data:{
                canChat: (chatEntry.canChat) ? true : false
            }
        };
        res.json(output);
    });
};