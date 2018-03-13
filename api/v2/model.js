/**
 * Created by INFYZO\hitesh.parikh on 2/9/16.
 */
module.exports = (function () {
    var db = require('./../../app/db');

    return {

        _db: db.getDBo(),

        // This method will return the rest of users data other than requester
        // based on requester settings like Distance, Current Location, age range
        //gender,marital status,noOfChildren,religion,cast,native,interestedIn
        searchUserMatch: function (table, where, page, limit, callback) {

            // Create index based on location key in user collection
            this._db.collection(table).createIndex({location: "2dsphere"});

            this._db.collection(table).find(where).skip((page - 1) * limit).limit(limit).toArray(function (err, res) {
                if (err) {
                    throw err;
                }

                // Return the data
                callback(res);
            });
        },

        // Check whether request already been sent to use
        // return true if already sent other wise false
        isChatRequestSend: function (table, data, clb) {
            this._db.collection(table).findOne({
                $or: [
                    {to: data.to, from: data.from},
                    {from: data.to, to: data.from}
                ]
            }, function (err, doc) {
                if (err || doc) {
                    clb(true);
                    return;
                }

                clb(false);

            });
        },

        // Ge the chat entry from from or to ids in the collection
        // if we get data output is otherwise resutn false
        getChatRequest: function (table, data, clb) {
            this._db.collection(table).findOne({
                $or: [
                    {to: data.to, from: data.from},
                    {from: data.to, to: data.from}
                ]
            }, function (err, doc) {
                if (err) {
                    clb({'error': true});
                } else {
                    clb(doc);
                }
            });
        },

        // Save request for userChatRooms
        // return false in call back if and db error other wise sent data
        saveChatRequest: function (table, data, clb) {
            this._db.collection(table).insertOne(data, function (err, doc) {
                if (typeof clb === 'function') {
                    if (err) {
                        clb(false);
                    }

                    clb(doc);
                }
            });
        },

        // Get the list of chat users which containing from and to id
        // where requested user exits in userChatRoom db
        getChatList: function (data, callback) {
            var that = this;
            var id = data.id;
            fres = [];
            sres = [];

            // Since we need data where request user lying in the database in from and to
            // along with end user info like name, profile pic so we need to aggregate them
            // as from first and than to
            // from aggregate with user collection and return it
            that._db.collection('userChatRooms').aggregate([
                {
                    $lookup: {
                        from: "user",
                        localField: "from",
                        foreignField: "_id",
                        as: "user"
                    }
                },
                {
                    $match: {to: id}
                }
            ], function (ferr, fres) {
                if (ferr) {
                    callback(ferr);
                }

                // Since we need data where request user lying in the database in from and to
                // along with end user info like name, profile pic so we need to aggregate them
                // as from first and than to
                // to aggregate with user collection and return it
                that._db.collection('userChatRooms').aggregate([
                    {
                        $lookup: {
                            from: "user",
                            localField: "to",
                            foreignField: "_id",
                            as: "user"
                        }
                    },
                    {
                        $match: {from: id}
                    }
                ], function (serr, sres) {
                    if (serr) {
                        callback(serr);
                    }

                    // Concat the first result and second result
                    var userList = fres.concat(sres);

                    // Return entire array of user list
                    callback(userList);
                });
            });
        },

        getUserList: function (data, callback) {
            var that = this;
            var id = data.from;

            that._db.collection('privacySettings').aggregate([
                {
                    $lookup: {
                        from: "user",
                        localField: "to",
                        foreignField: "_id",
                        as: "user"
                    }
                },
                {
                    $match: {from: id, connectionStatus: data.connectionStatus}
                }
            ], function (err, res) {
                if (err) {
                    callback(err);
                }

                // Return entire array of user list
                callback(res);
            });
        },
        //fetch question randomly
        getRandomQuestions: function (table, where, clb) {
            this._db.collection(table).aggregate([
                {
                    $unwind: "$_id"
                },
                {
                    $match: {"isPublished": where.isPublished}
                },
                {
                    $sample: {size: where.size}
                }
            ], function (err, doc) {
                if (typeof clb === 'function') {
                    if (err) clb(false);
                    else clb(doc);
                }
            });
        },
        // Search Data using map reduce of mongo db
        searchData: function (table, where, userDetails, options, type, generalLib, clb) {
            mapper = function () {
                var result = {};
                result._id = this._id;
                result.fname = this.fname;
                result.lname = this.lname;
                result.age = this.age;
                result.city = this.city;
                result.thumbImage = (this.profilePics.original.thumb[0] !== undefined) ? this.profilePics.original.thumb[0] : '';
                result.profilePics = (this.profilePics.original.large[0] !== undefined) ? this.profilePics.original.large[0] : '';
                result.distance = generalLib.distance(userDetails.location.coordinates[0], userDetails.location.coordinates[1],
                    this.location.coordinates[0], this.location.coordinates[1], 'K');

                if (type == 2) {

                    // For RML Category we provides some interesting stats
                    // Will help the user for there best match
                    // Out strong mathematical algorithm are behind it

                    var matches = ['myMatch', 'meMatch', 'commonMatch'];

                    // Return value object of 'preferenceCheck' key from Options collection
                    var preference = [];
                    var tempTotalPercent = {'myMatch': 0, 'meMatch': 0, 'commonMatch': 0};

                    for (var key in options) {
                        var currentKey = {
                            category: key,
                            fields: []
                        };

                        var arr = options[key].fields;
                        var rootKeys = ['general', 'socialMediaLinks'];

                        // Each category point
                        var point = {'myMatch': 0, 'meMatch': 0, 'commonMatch': 0};

                        for (var r = 0; r < arr.length; r++) {
                            var currentField = {};

                            for (var x = 0; x < matches.length; x++) {

                                if (rootKeys.indexOf(key) >= 0) {
                                    var checkConditionPartner = (matches[x] == 'myMatch')
                                        ? userDetails.partner[arr[r].name] : this.partner[arr[r].name];
                                    var checkConditionPreference = (matches[x] == 'myMatch')
                                        ? this.preference[arr[r].name] : userDetails.preference[arr[r].name];
                                    currentField[arr[r].name] = this.preference[arr[r].name];
                                } else {
                                    var checkConditionPartner = (matches[x] == 'myMatch')
                                        ? userDetails.partner[key][arr[r].name] : this.partner[key][arr[r].name];
                                    var checkConditionPreference = (matches[x] == 'myMatch')
                                        ? this.preference[key][arr[r].name] : userDetails.preference[key][arr[r].name];
                                    currentField[arr[r].name] = this.preference[key][arr[r].name];
                                }

                                var checkArrType = arr[r].check;

                                if (matches[x] == 'commonMatch') {
                                    var condition1 = currentField.myMatch;
                                    var condition2 = currentField.meMatch;

                                    checkArrType = 'commonMatchCondition';
                                }

                                currentField[matches[x]] = false;

                                switch (checkArrType) {
                                    case 'array':
                                        if ((checkConditionPartner.indexOf(checkConditionPreference) >= 0)
                                            || (checkConditionPartner.length == 0 && checkConditionPreference != "")) {
                                            point[matches[x]] += 1;
                                            currentField[matches[x]] = true;
                                        }
                                        break;
                                    case 'fileCheck':
                                        if ((checkConditionPartner == true && checkConditionPreference != '')
                                            || (checkConditionPartner == false)) {
                                            point[matches[x]] += 1;
                                            currentField[matches[x]] = true;
                                        }
                                        break;
                                    case 'value':
                                        if (checkConditionPartner == checkConditionPreference) {
                                            point[matches[x]] += 1;
                                            currentField[matches[x]] = true;
                                        }
                                        break;
                                    case 'range':
                                        if ((checkConditionPartner[0] == 0 && checkConditionPreference != 0)
                                            || (checkConditionPreference > checkConditionPartner[0]
                                            && checkConditionPreference < checkConditionPartner[1])) {
                                            point[matches[x]] += 1;
                                            currentField[matches[x]] = true;
                                        }
                                        break;
                                    case 'commonMatchCondition':
                                        if (condition1 == true && condition2 == true) {
                                            point[matches[x]] += 1;
                                            currentField[matches[x]] = true;
                                        }
                                }
                            }

                            currentKey.fields.push(currentField);
                        }


                        currentKey.percent = {
                            'myMatch': generalLib.percent(point.myMatch, arr.length, options[key].percent),
                            'meMatch': generalLib.percent(point.meMatch, arr.length, options[key].percent),
                            'commonMatch': generalLib.percent(point.commonMatch, arr.length, options[key].percent)
                        };

                        preference.push(currentKey);
                        currentKey.categoryPercent = options[key].percent;
                        tempTotalPercent.myMatch += currentKey.percent.myMatch;
                        tempTotalPercent.meMatch += currentKey.percent.meMatch;
                        tempTotalPercent.commonMatch += currentKey.percent.commonMatch;
                    }
                    result.preference = preference;
                    result.totalPercent = {
                        'myMatch': parseFloat(tempTotalPercent.myMatch.toFixed(2)),
                        'meMatch': parseFloat(tempTotalPercent.meMatch.toFixed(2)),
                        'commonMatch': parseFloat(tempTotalPercent.commonMatch.toFixed(2))
                    };
                }

                emit(this._id, result);
            };

            reducer = function () {

            };

            this._db.collection(table).mapReduce(
                mapper,
                reducer,
                {
                    query: where,
                    scope: {'type': type, 'options': options, 'userDetails': userDetails, 'generalLib': generalLib},
                    //sort: {'totalPercent.myMatch': -1},
                    //limit: 10,
                    out: {inline: 1}
                },
                function (err, results) {
                    if (err) {
                        clb(err);
                    }

                    clb(results);
                }
            );
        }
    }
})();
