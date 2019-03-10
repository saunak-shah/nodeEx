/**
 * Created by INFYZO\rachana.thakkar on 3/9/16.
 */
var db = require('./../../app/db');
var ObjectID = require('mongodb').ObjectID;

module.exports = function (req, res) {
    var data = req.body.data;

    var uid = new ObjectID(data.uid);

    var where = {
        _id: uid
    };

    var output = {responseCode: 0, responseMsg: 'There is some error to delete entry.'};

    db.updateUser('user', where, {"isDelete": 1}, function (row) {
        if (!row) {
            res.json(output);
            return false;
        } else {
            output.responseCode = 200;
            output.responseMsg = "Your profile on LoveCoy has been deleted successfully.For further details, please contact our Customer Relations";
            res.json(output);
        }
    });
}