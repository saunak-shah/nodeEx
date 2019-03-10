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

        searchMapReduce: function (table, where, page, limit) {

            return this._db.collection(table).mapReduce(
                function () {
                    emit(this._id);
                },
                function () {
                    var result = {};
                    result._id = this._id;
                    result.fname = this.fname;
                    result.lname = this.lname;
                    var updatedProfilePics = [];
                    if (this.profilePics.length == 0) {
                        updatedProfilePics = [];
                        result.thumbImage = '';
                    } else {
                        for (var pic = 0; pic < object.profilePics.length; pic++) {
                            if (pic > 0 && this.privacySettings.isMyPhotoBlur == true)
                                updatedProfilePics.push('http://' + appConfig.host + '/Lovecoy-Webservice/uploads/profile/' + this._id + '/blur_large_' + this.profilePics[pic]);
                            else
                                updatedProfilePics.push('http://' + appConfig.host + '/Lovecoy-Webservice/uploads/profile/' + this._id + '/large_' + this.profilePics[pic]);
                        }
                    }
                    result.thumbImage = 'http://' + appConfig.host + '/Lovecoy-Webservice/uploads/profile/' + this._id + '/thumb_' + this.profilePics[0];
                    result.profilePics = updatedProfilePics;
                    result.age = this.age;
                    result.city = this.city;
                    result.occupation = (!('preference.professional' in this) == true) ? 'N/A' : result.occupation = this.preference.professional.occupation;
                    result.designation = (!('preference.professional' in this) == true) ? 'N/A' : result.designation = this.preference.professional.designation;
                    result.aboutMe = (!('aboutMe' in this) == true) ? 'N/A' : result.aboutMe = this.aboutMe;
                    result.distance = generalLib.distance(userDetails.location.coordinates[0], userDetails.location.coordinates[1], this.location.coordinates[0], this.location.coordinates[1], 'K');
                    if ('detometer' in this == true)
                        result.detometer = this.detometer;
                    if (type == 2) {
                        //Return value object of 'preferenceCheck' key from Options collection
                        var preference = [];
                        var tempTotalPercent = {'myMatch': 0, 'meMatch': 0, 'commonMatch': 0};
                        for (var key in dbObj) {
                            var currentKey = {};
                            currentKey.category = key;
                            currentKey.fields = [];
                            var Arr = dbObj[key].fields;
                            var rootKeys = ['general', 'socialMediaLinks'];
                            //Each category point
                            var point = {'myMatch': 0, 'meMatch': 0, 'commonMatch': 0};
                            for (var r = 0; r < Arr.length; r++) {
                                var currentField = {};
                                for (var x = 0; x < matches.length; x++) {
                                    if (rootKeys.indexOf(key) >= 0) {
                                        var checkConditionPartner = (matches[x] == 'myMatch') ? userDetails.partner[Arr[r].name] : this.partner[Arr[r].name];
                                        var checkConditionPreference = (matches[x] == 'myMatch') ? this.preference[Arr[r].name] : userDetails.preference[Arr[r].name];
                                        currentField[Arr[r].name] = (this.privacySettings[Arr[r].name] != false) ? this.preference[Arr[r].name] : '*****';
                                    }
                                    else {
                                        var checkConditionPartner = (matches[x] == 'myMatch') ? userDetails.partner[key][Arr[r].name] : this.partner[key][Arr[r].name];
                                        var checkConditionPreference = (matches[x] == 'myMatch') ? this.preference[key][Arr[r].name] : userDetails.preference[key][Arr[r].name];
                                        currentField[Arr[r].name] = (this.privacySettings[key][Arr[r].name] != false) ? this.preference[key][Arr[r].name] : '*****';
                                    }
                                    if (matches[x] == 'commonMatch') {
                                        var condition1 = currentField.myMatch;
                                        var condition2 = currentField.meMatch;
                                        //set Arr[r].check as 'commonMatchCondition' so last case will be execute
                                        Arr[r].check = 'commonMatchCondition';
                                    }
                                    currentField[matches[x]] = false;
                                    switch (Arr[r].check) {
                                        case 'array':
                                            if (checkConditionPartner.indexOf(checkConditionPreference) >= 0) {
                                                point[matches[x]] += 1;
                                                currentField[matches[x]] = true;
                                            }
                                            break;
                                        case 'fileCheck':
                                            if ((checkConditionPartner == true && checkConditionPreference != '') || (checkConditionPartner == false)) {
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
                                            if ((checkConditionPreference > checkConditionPartner[0] && checkConditionPreference) < (checkConditionPartner[1])) {
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
                                'myMatch': generalLib.percent(point.myMatch, Arr.length, dbObj[key].percent),
                                'meMatch': generalLib.percent(point.meMatch, Arr.length, dbObj[key].percent),
                                'commonMatch': generalLib.percent(point.commonMatch, Arr.length, dbObj[key].percent)
                            }
                            preference.push(currentKey);
                            tempTotalPercent.myMatch += currentKey.percent.myMatch;
                            tempTotalPercent.meMatch += currentKey.percent.meMatch;
                            tempTotalPercent.commonMatch += currentKey.percent.commonMatch;
                        }
                        result.preference = preference;
                        result.totalPercent = {
                            'myMatch': parseFloat(tempTotalPercent.myMatch.toFixed(2)),
                            'meMatch': parseFloat(tempTotalPercent.meMatch.toFixed(2)),
                            'commonMatch': parseFloat(tempTotalPercent.commonMatch.toFixed(2))
                        }
                    }
                    return result;
                },
                {
                    query: where,
                    out: "map_reduce_search"
                }
            )

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

        // Save each chat message to chatMessage collection
        saveChat: function (table, data, clb) {
            this._db.collection(table).insertOne(data, function (err, doc) {
                if (typeof clb === 'function') {
                    if (err) clb(false);
                    else clb(doc.result);
                }
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
        }
    }
})();
