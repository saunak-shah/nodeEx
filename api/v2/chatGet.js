/**
 * Get chat list for perticular user
 * @author Infyzo Websol Pvt. Ltd.
 * @copyright 2016 Infyzo Websol Pvt. Ltd.
 * @licence
 * @version 1.0.0
 */

var db = require('./../../app/db');
var ObjectID = require('mongodb').ObjectID;

module.exports = function (req, res) {
    var data = req.body.data;

    // Get the selected data from the database
    var select = {
        from: true,
        to: true,
        ts: true,
        msg: true
    };

    // Send Data object to db functions
    // To is actual a used data of db table since from user already send those message to connected user
    // From.from: From user means a user who want to connect with logged in user (uid)
    // ts: Time stamp last updated time stamp in android db
    var where = {
        $and: [{
            to: new ObjectID(data.uid),
            'from.from': new ObjectID(data.to),
            ts: {
                $gt: new Date(data.ts)
            },
            readFlag: 0
        }]
    };

    var table = 'chatMessages';

    // Change the read flag to deliver
    var updateData = {readFlag: 1};

    db.updateMultiData(table, where, updateData, function (doc) {
        // Create output object for response
        var output = {responseCode: 500, responseMsg: 'There is some error to fetch data.'};

        if (!doc.ok) {
            res.json(output);
        } else {
            // Get all delivered messages the read flag to deliver
            where['$and'][0].readFlag = 1;

            // Get list of all chats
            db.getAll(table, where, select, function (chats) {

                // Create output object for response
                output = {responseCode: 200, responseMsg: 'Chat data attached for users.'};

                // Create output data as empty object for response
                output.data = [];

                // Check if we get result from the db query if yes add it to data object
                if (chats) {
                    output.data = chats;
                }

                // Response as json output
                res.json(output);
            });
        }
    });
};
