/**
 * Created by INFYZO\hitesh.parikh on 27/8/16.
 */
var db = require('./../../app/db');
var model = require('./model');
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
    model.saveChat('chatMessages', insertObj, function (chat) {
        if (data.msgType == 'gift') {
            var giftsData = {};
            giftsData['gifts.' + data.msg.gift] = -1;
            db.updateData('user', {_id: from}, {$inc: giftsData}, function (row) {
                // Any issue during update or insert query will return false
                if (!row.ok) {
                    console.log('There is some error to update data in User Collection');
                } else {
                    var where = {
                        from: from,
                        to: to
                    };
                    var giftsData = {};
                    giftsData['gifts.' + data.msg.gift] = 1;
                    db.updateData('privacySettings', where, {
                        $inc: giftsData,
                        $set: {'connectionStatus': 'connected'}
                    }, function (row) {
                        // Any issue during update or insert query will return false
                        if (!row.ok) {
                            console.log('There is some error to update data in User Collection');
                        }
                    });
                }
            });
        }
        if (!chat) {
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

    db.getIn('user', [from, to], 1, 2, function (resultData) {
        if (resultData[0]._id.toString() == to.toString()) {
            var toData = resultData[0];
            var fromData = resultData[1];
        } else {
            var toData = resultData[1];
            var fromData = resultData[0];
        }
        var updateData = generalLib.dateOMeter(fromData, to, data.msgType);
        if (Object.keys(updateData).length > 0) {
            db.updateData('user', {_id: from}, updateData, function (row) {
                // Any issue during update or insert query will return false
                if (!row.ok) {
                    console.log('There is some error to update data.');
                }
                else {
                    var updateData = generalLib.dateOMeter(toData, from, data.msgType);
                    if (Object.keys(updateData).length > 0) {
                        db.updateData('user', {_id: to}, updateData, function (row) {
                            // Any issue during update or insert query will return false
                            if (!row.ok) {
                                console.log('There is some error to update data.');
                            }
                        });
                    }
                }
            });
        }
    });
};
