/**
 * Created by INFYZO\hitesh.parikh on 5/9/16.
 */

var model = require('./model');
var ObjectID = require('mongodb').ObjectID;

module.exports = function (req, res) {
    var data = req.body.data;

    var uid = new ObjectID(data.uid);

    var where = {
        from: uid,
        connectionStatus: data.flag
    };

    var output = {responseCode: 500, responseMsg: 'There is some error to delete entry.'};

    model.getUserList(where, function (users) {
        if (!users) {
            res.json(output);
            return false;
        } else {
            output.responseCode = 200;
            output.responseMsg = 'Your ' + data.flag +  ' List';
            output.data = [];

            // Send output data as custom array that required for the list
            for (i = 0; i < users.length; i++) {
                var profilePic = '';
                var profilePicLarge = '';

                if(users[i].user[0].isDelete == 1){
                    continue
                }

                if (users[i].user[0].profilePics.original.thumb) {
                    profilePic = users[i].user[0].profilePics.original.thumb[0];
                    profilePicLarge = users[i].user[0].profilePics.original.large[0];
                }

                output.data[i] = {
                    _id: users[i].user[0]._id,
                    name: users[i].user[0].fname + ' ' + users[i].user[0].lname,
                    city: users[i].user[0].city,
                    profilePic: profilePic,
                    profilePicLarge: profilePicLarge
                };
            }

            if (output.data.length <= 0){
                output.responseMsg = 'No data in ' + data.flag +  ' List';
            }

            res.json(output);
        }
    });
};
