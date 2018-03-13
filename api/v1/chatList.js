/**
 * Lovecoy Bootstrap file.
 * @author Infyzo Websol Pvt. Ltd.
 * @copyright 2016 Infyzo Websol Pvt. Ltd.
 * @licence
 * @version 1.0.0
 */

var db = require('./../../app/db');
var model = require('./model');
var appConfig = require('./../../app/config');
var ObjectID = require('mongodb').ObjectID;

module.exports = function (req, res) {
    var data = req.body.data;

    // convert request uid to object id
    var id = new ObjectID(data.uid);

    // Send Data object to db functions
    var data = {
        id: id
    };

    // Get list of all users
    model.getChatList(data, function (list) {

        // Create output object for response
        var output = {responseCode: 200, responseMsg: 'List of user in connection with you.'};

        // Create output data as empty object for response
        output.data = [];

        if (list.length > 0) {
            // Send output data as custom array that required for the list
            for (var i = 0; i < list.length; i++) {
                var profilePic = '';
                var profilePicLarge = '';

                if (list[i].user[0].profilePics.original.thumb.length > 0) {
                    profilePic = list[i].user[0].profilePics.original.thumb[0];
                    profilePicLarge = list[i].user[0].profilePics.original.large[0];
                }

                output.data[i] = {
                    canChat: ((data.id.toString() === list[i].to.toString()) || list[i].canChat) ? true : false,
                    _id: list[i].user[0]._id,
                    name: list[i].user[0].fname + ' ' + list[i].user[0].lname,
                    city: list[i].user[0].city,
                    profilePic: profilePic,
                    profilePicLarge: profilePicLarge,
                    fgcmToken: list[i].user[0].fgcmToken
                };
            }
        }

        // Response as json output
        res.json(output);
    });
};
