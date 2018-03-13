/**
 * Created by INFYZO\rachana.thakkar on 26/12/16.
 */
var model = require('./model');
var ObjectID = require('mongodb').ObjectID;
var db = require('./../../app/db');
var generalLib = require('./generalLib');

module.exports = function (req, res) {
    var data = req.body.data;
    var output = {};

    db.getSelected('user', {_id: new ObjectID(data.uid)}, {}, function (result) {
        if (!result) {
            res.json({responseCode: 402, responseMsg: 'User not found.'});
            res.end();
        } else {
            //Fields which are compulsory to insert based on selected category
            db.get('options', {key: data.category}, function (compulsoryField) {
                if (!result) {
                    res.json({responseCode: 402, responseMsg: 'Option not found.'});
                    res.end();
                } else {
                    //Fields which are already in user Object
                    var userFields = Object.keys(result);
                    var remainingFields = [];
                    for (var i in compulsoryField.fields) {
                        if (userFields.indexOf(compulsoryField.fields[i]) < 0) {
                            remainingFields.push(compulsoryField.fields[i]);
                        }
                    }
                    //Fields which are not fill up by user and its compulsory
                    if (remainingFields.length > 0) {
                        var item = remainingFields[Math.floor(Math.random() * remainingFields.length)];
                        //compulsory field default object
                        db.get('options', {key: item}, function (options) {
                            if (!options) {
                                res.json({responseCode: 402, responseMsg: 'Given Key not found.'});
                                res.end();
                            } else {
                                output.responseCode = 200;
                                output.responseMsg = item + ' is compulsory Field';
                                output.data = options;
                                res.json(output);
                            }
                        });
                    }
                    else {
                        output.responseCode = 200;
                        output.responseMsg = "No Compulsory Field is remaining..";
                        res.json(output);
                    }
                }
            });
        }
    });
}
