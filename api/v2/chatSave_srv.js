/**
 * Created by INFYZO\hitesh.parikh on 27/8/16.
 */
var db = require('./../../app/db');
var generalLib = require('./generalLib');

module.exports = function (req, res) {
    var data = req.body.data;
    var ObjectID = require('mongodb').ObjectID;
    var from = new ObjectID(data.uid);
    var to = new ObjectID(data.to);

    // Default output
    var output = {
        responseCode: 500,
        responseMsg: 'There is some error to save data.'
    };

    // Save message object
    var insertObj = {
        to: to,
        ts: new Date(data.ts),
        msgType: data.msgType,
        from: {
            from: from,
            name: data.name
        },
        msg: data.msg
    };

    if (data.iSelfieAction != undefined) {
        var iSelfieAction = data.iSelfieAction;
        insertObj['iSelfieAction'] = iSelfieAction;
    }

    if (data.exclusiveChat != undefined) {
        insertObj['exclusiveChat'] = data.exclusiveChat;
    }

    //dateOMeter Entry from 3rd entry
    generalLib.dateOMeter(to, from, data.msgType);

    // Save chat messages in chatMessages collection
    db.insertOne('chatMessages', insertObj, function (chat) {

        // Update gift data from user document who send it asynchronously
        if (data.msgType == 'gift') {
            var decrementGift = {};
            var receivedGift = {};
            decrementGift['gifts.self.' + data.msg.gift] = -1;

            db.updateData('user', {_id: from}, {$inc: decrementGift}, function (row) {
                // Any issue during update or insert query will return false
                if (!row.ok) {
                    console.log('There is some error to update data in User Collection');
                } else {
                    console.log('Gift updated successfully.');
                }
            });

            receivedGift['gifts.received.' + data.msg.gift] = from;
            db.updateData('user', {_id: to}, {$push: receivedGift}, function (row) {
                // Any issue during update or insert query will return false
                if (!row.ok) {
                    console.log('There is some error to update data in User Collection');
                } else {
                    console.log('Gift updated in received successfully.');
                }
            });
        }

        // If any issue related to chat return error output.
        if (!chat) {
            // Response as json output
            res.json(output);
            res.end();
        } else {
            if (data.iSelfieAction != undefined && data.iSelfieAction == 2) {
                var where = {
                    $or: [{$and: [{to: to, 'from.from': from}]},
                        {$and: [{to: from, 'from.from': to}]}]
                };

                db.updateMultiData('chatMessages', where, {iSelfieAction: iSelfieAction}, function (result) {
                    if (!result.ok) {
                        // Response as json output
                        res.json(output);
                        res.end();
                    } else {
                        output.responseCode = 200;
                        output.responseMsg = 'Chat saved successfully';
                        res.json(output);
                        res.end();
                    }
                });
            }
        }
    });
};
