/**
 * Created by INFYZO\alok.chauhan on 6/9/16.
 */
var model = require('./model');
module.exports = function (req, res) {
    var db = require('./../../app/db');

    var where = {
        isPublished: 1,
        size: 5
    };

    //fetch question randomly
    model.getRandomQuestions('questions', where, function (result) {
        var output = {responseCode: 200, responseMsg: 'question fetch successfully.'};
        output.data = [];
        if (result) {
            output.data = result;
        }

        res.json(output);
    });
};