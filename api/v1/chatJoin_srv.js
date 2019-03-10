/**
 * Created by INFYZO\hitesh.parikh on 27/8/16.
 */

var db = require('./../../app/db');
var model = require('./model');
var ObjectID = require('mongodb').ObjectID;

module.exports = function (req, res) {

    var data = req.body.data;
    var id = new ObjectID(data.uid);
    // Default output
    var output = {
        responseCode: 500,
        responseMsg: 'There is some error to fetch data.'
    };

    var where = {
        _id: id
    };

    var update = {
        socketId: data.socketId
    };

    db.updateUser('user', where, update, function (user) {

        if (!user) {
            // Response as json output
            res.json(output);
            res.end();
        } else {
            // Send Data object to db functions
            var data = {
                id: id
            };

            // Get list of all users
            model.getChatList(data, function (list) {

                if (!user) {
                    // Response as json output
                    res.json(output);
                } else {
                    output.responseCode = 200;
                    output.responseMsg = 'Chat list successfully listed';
                    output.data = [];

                    // Create output data as empty object for response
                    if (list.length > 0) {
                        // Send output data as custom array that required for the list
                        for (var i = 0; i < list.length; i++) {
                            output.data[i] = {
                                canChat: ((data.id.toString() === list[i].to.toString()) || list[i].canChat) ? true : false,
                                to: list[i].user[0]._id
                            };
                        }
                    }
                    // Response as json output
                    res.json(output);
                    res.end();
                }
            });
        }
    });
};
