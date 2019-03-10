/**
 * Created by INFYZO\alok.chauhan on 6/9/16.
 */

module.exports = function (req, res) {
    var db = require('./../../app/db');
    var data = req.body.data;
    var where = {
        isPublished: 1,
        category:data.category
    };

    var select={
        _id:true,
        category: true,
        subscription: true,
        privacySlab: true
    };

    //get payment slabs
    db.getAll('paymentSlabs',where,select, function (result) {
        var output = {responseCode: 200, responseMsg: 'slabs result.'};
        output.data = [];
        if (result) {
            output.data = result;
        }
        res.json(output);
    });
};

