/**
 * Created by INFYZO\hitesh.parikh on 27/8/16.
 */

var db = require('./../../app/db');
var ObjectID = require('mongodb').ObjectID;

module.exports = function (req, res) {

    var data = req.body.data;
    var id = new ObjectID(data.uid);

    // Default output
    var output = {
        responseCode: 500,
        responseMsg: 'There is some error to fetch data.'
    };

    // Where object which need to search in collection
    var where = {
        _id: id
    };

    // Update object whcih need to update
    var update = {
        socketId: data.socketId
    };

    // Save user which also returns updated document.
    db.saveUser('user', where, {$set: update}, function (user) {

        if ( ! user) {
            // Response as json output
            res.json(output);
            res.end();
        } else {
            output.responseCode = 200;
            output.responseMsg = 'Chat list successfully listed';
            output.data = [];

            // Loops though connected users and return only connected users
            for (var i = 0 in user.connections) {
                for(var j = 0 in user.connections[i].users) {
                    if (user.connections[i].users[j].status == 'connected') {
                        output.data.push({to: user.connections[i].users[j]._id, canChat: 1});
                    } else if (user.connections[i].users[j].status == 'requested') {
                        output.data.push({to: user.connections[i].users[j]._id, canChat: 0});
                    }
                }
            }

            res.json(output);
            res.end();
        }
    });
};
