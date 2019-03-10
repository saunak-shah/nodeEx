/**
 * Created by INFYZO\alok.chauhan on 18/11/16.
 */

var db = require('./../../app/db'),
    ObjectID = require('mongodb').ObjectID;
module.exports = function (req, res) {
    var data = req.body.data;
    var where = {
        _id: new ObjectID(data.uid)
    };

    db.get('user', where, function (result) {
        var output = {responseCode: 200, responseMsg: 'exclusive chat result.'};
        output.data = [];
        if (result) {
            //if no user found in user collection
            if (!result) {
                res.json({responseCode: 500, responseMsg: 'There is some error to find data.'});
                return false;
            } else {
                //fetch details of exclusive chat user
                if (result.exclusiveWith) {
                    db.get('user', {_id: new ObjectID(result.exclusiveWith)}, function (exclusiveUser) {
                        result.profilePic = exclusiveUser.profilePics.original.thumb[0];
                        result.profilePicLarge = exclusiveUser.profilePics.original.large[0];

                        result.exclusiveUser = exclusiveUser;
                        output.data = result;
                        res.json(output);
                    })
                } else {
                    output.data = result;
                    res.json(output);
                }
            }

        }

    });
};

