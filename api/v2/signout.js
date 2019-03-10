/**
 * Created by INFYZO\saunak.shah on 28/10/16.
 */

var db = require('./../../app/db');
var ObjectID = require('mongodb').ObjectID;

module.exports = function (req, res) {
    var data = req.body.data;
    var updateData = {
        fgcmToken:""
    };

    // update fgcm token blank
    db.updateUser('user', {_id: new ObjectID(data.uid)}, updateData, function(updateUser){
        if(!updateUser) {
            res.json({responseCode: 500, responseMsg: 'There is some error to update data.'});
            return false;
        } else {
            var output = {
                responseCode: 200,
                responseMsg: 'Sign out successfully.'
            };
            res.json(output);
        }
    });

};
