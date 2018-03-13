/**
 * Created by INFYZO\alok.chauhan on 9/9/16.
 */

var db = require('./../../app/db'),
    ObjectID = require('mongodb').ObjectID;

module.exports = function (req, res) {
    var output = {};
    var data = req.body.data;

    var where = {
        _id: new ObjectID(data.uid)

    };

    var updateData = {
        slab: parseInt(data.slab)
    };


    // save user payment history
    db.updateUser('paymentHistory', {_id: new ObjectID()}, data, function (paymentHistory) {
        var output = {responseCode: 500, responseMsg: 'There is technical issue with Payment. Please try again.'};
        if (!paymentHistory) {
            res.json(output);
        } else {
            //if payment status done successfully then update slab in user collection
            if (data.paymentStatus == "success") {
                db.updateUser('user', where, updateData, function (slab) {
                });
            }
            output.responseCode = 200;
            output.responseMsg = "Payment details saves successfully.";
            output.data = paymentHistory;
            res.json(output);
        }
    });
};