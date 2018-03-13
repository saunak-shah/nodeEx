/**
 * Created by INFYZO\alok.chauhan on 16/8/16.
 */
var db = require('./../../app/db');
var model = require('./model');
var generalLib = require('./generalLib');
var ObjectID = require('mongodb').ObjectID;
var NodeGeocoder = require('node-geocoder');
var geocoder = NodeGeocoder();
var data = {};
var where = {};
var type = 1; // Set the default type to 1 - CFD
var coordinates = [];

// Pagination code
var page = 1;
var limit = 10;

// Default output
var output = {
    responseCode: 500,
    responseMsg: 'There is some error to fetch location.'
};

module.exports = function (req, res) {
    data = req.body.data;

    // Convert uid from string to mongo object id
    var uid = new ObjectID(data.uid);

    // Set where condition to update user for current location
    where._id = uid;

    // Set the type for API call for the 1 - CFD and 2 - RML
    type = data.type;

    // Pagination number
    page = (data.page) ? data.page : page;

    // Set the subType for InterestedIn Data
    subType = data.subType;

    // Function to get city and countryCode
    geocoder.reverse({lat: parseFloat(data.lat), lon: parseFloat(data.lon)}, updateLocation);

    // Update the user collections with latest latitude and longitude
    // with it's city and country match with geocode for the user who access the search result

    function updateLocation(err, loc) {

        // If any error occurs during getting the city and country from geo coder
        // default error output will return as error

        if (err) {
            res.json(output);
            res.end();
        } else {
            // Set the current City and location for the user data update
            var updateData = {
                location: {
                    type: 'Point',
                    coordinates: [parseFloat(data.lat), parseFloat(data.lon)]
                },
                city: loc[0].city + ',' + loc[0].administrativeLevels.level1long
            };

            // Call to update Latest latitude and longitude of user location.
            db.saveUser('user', where, {$set: updateData}, function (userDetails) {
                if (!userDetails) {
                    var output = {responseCode: 0, responseMsg: 'Location not Updated...'};
                    output.data = [];
                    res.json(output);
                    res.end();
                }
                else {
                    // Location lookup settings for latitude, longitude and maximum distance
                    // WE are taking the minimum distance as zero
                    //Set A logic start
                    var loc = {
                        $near: {
                            $geometry: userDetails.location,
                            //convert max distance into KM
                            $maxDistance: parseInt(userDetails.filters.distance * 1000)
                        }
                    };

                    // Get the users who already has an action with requester
                    var wherePrivacy = {
                        from: where._id
                    };

                    db.getAll("privacySettings", wherePrivacy, {to: 1}, function (toUsers) {

                        // If any error occurs during getting the users from privacySettings collection
                        // default error output will return as error

                        if (!toUsers) {
                            res.json(output);
                            res.end();
                        } else {

                            // Creates an array for those users who are already in connection
                            // or declined or hold status

                            var user_not_in = [wherePrivacy.from];

                            for (var i in toUsers) {
                                user_not_in.push(new ObjectID(toUsers[i].to));
                            }

                            // Default criteria which covers
                            // Self id with excluded users
                            // deleted profiles
                            // Location with distance set in profile
                            // Gender Array
                            // Age Range

                            var finalCriteria = {
                                _id: {$not: {$in: user_not_in}},
                                isDelete: {$ne: 1},
                                gender: {$in: userDetails.filters.gender},
                                age: {$gte: userDetails.filters.age[0], $lte: userDetails.filters.age[1]}
                            };

                            //If selected preferredCity then result will be based on preferredCity otherwise it will based on location
                            if (userDetails.filters.preferredCity != undefined && userDetails.filters.preferredCity != '')
                                finalCriteria.city = {$regex: userDetails.filters.preferredCity};
                            else
                                finalCriteria.location = loc;

                            // Search Data based on SubType
                            finalCriteria.interestedIn = {$in: [subType]};

                            // Matches default array
                            var matches = [];

                            // This is the flag which we have from the request params
                            // 1-CFD, 2 = RML

                            if (type == 2) {

                                // For RML Category we provides some interesting stats
                                // Will help the user for there best match
                                // Out strong mathematical algorithm are behind it

                                matches = ['myMatch', 'meMatch', 'commonMatch'];

                                // Add marital status to filter criteria if userDetails has this field
                                if (userDetails.filters.maritalStatus.length > 0) {
                                    finalCriteria.maritalStatus = {
                                        $in: userDetails.filters.maritalStatus
                                    };
                                }

                                // Add has Child to filter criteria if userDetails has this field
                                if (userDetails.filters.hasChild) {
                                    finalCriteria.hasChild = userDetails.filters.hasChild;
                                }

                                // Add no of child to filter criteria if userDetails has this field
                                if (userDetails.filters.noOfChildren) {
                                    finalCriteria.noOfChildren = {$lte: userDetails.filters.noOfChildren}
                                }

                                // Add religion to filter criteria if userDetails has this field
                                if (userDetails.filters.religion.length > 0) {
                                    finalCriteria.religion = {
                                        $in: userDetails.filters.religion
                                    };
                                }

                                // Add cast to filter criteria if userDetails has this field
                                if (userDetails.filters.cast.length > 0) {
                                    finalCriteria.cast = {
                                        $in: userDetails.filters.cast
                                    };
                                }

                                // Add native to filter criteria if userDetails has this field
                                if (userDetails.filters.native.length > 0) {
                                    finalCriteria.native = {
                                        $in: userDetails.filters.native
                                    };
                                }

                            }

                            // Search data with userDetails, final criteria and matches
                            var whereA = {
                                $and: [finalCriteria]
                            };

                            //Set A logic end
                            //Set B logic start

                            // Default criteria which covers
                            // Self id with excluded users
                            // deleted profiles
                            // Location with distance set in profile
                            // Gender Array
                            // Age Range

                            var finalCriteriaB = {
                                _id: {$not: {$in: user_not_in}},
                                isDelete: {$ne: 1},
                                "filters.gender": userDetails.gender,
                                "filters.age.0": {$lte: userDetails.age},
                                "filters.age.1": {$gte: userDetails.age}
                            };

                            //If selected preferredCity then result will be based on preferredCity otherwise it will based on location
                            if (userDetails.filters.preferredCity)
                                finalCriteriaB.city = {$regex: userDetails.filters.preferredCity};
                            else
                                finalCriteriaB.location = loc;

                            // This is the flag which we have from the request params
                            finalCriteriaB.interestedIn = {$in: [subType]};

                            // 1-CFD, 2 = RML

                            if (type == 2) {

                                // For RML Category we provides some interesting stats
                                // Will help the user for there best match
                                // Out strong mathematical algorithm are behind it

                                matches = ['myMatch', 'meMatch', 'commonMatch'];
                                finalCriteriaB['filters.hasChild'] = userDetails.hasChild;
                                finalCriteriaB['filters.noOfChildren'] = {$gte: userDetails.noOfChildren}
                            }

                            var whereAnd = [finalCriteriaB];
                            if (type == 2) {
                                whereAnd.push(
                                    {$or: [{'filters.maritalStatus': userDetails.maritalStatus}, {'filters.maritalStatus': []}]},
                                    {$or: [{'filters.religion': userDetails.religion}, {'filters.religion': []}]},
                                    {$or: [{'filters.cast': userDetails.cast}, {'filters.cast': []}]},
                                    {$or: [{'filters.native': userDetails.native}, {'filters.native': []}]}
                                );
                            }
                            // Set the criteria and and-ing them for the final data
                            var whereB = {
                                $and: whereAnd
                            };

                            //Set B logic End

                            //Set C logic start
                            model.searchUserMatch("user", whereA, page, 0, function (finalResultA) {
                                var setA = [];
                                var finalResultDataA = finalResultA;
                                var finalResultDataLengthA = finalResultDataA.length;
                                for (var i = 0; i < finalResultDataLengthA; i++) {
                                    setA.push(finalResultDataA[i]._id.toString());
                                }
                                model.searchUserMatch("user", whereB, page, 0, function (finalResultB) {
                                    var setB = [];
                                    var finalResultDataB = finalResultB;
                                    var finalResultDataLengthB = finalResultDataB.length;
                                    for (var j = 0; j < finalResultDataLengthB; j++) {
                                        setB.push(finalResultDataB[j]._id.toString());
                                    }
                                    // fetch intersect of set A and set B
                                    var setC = generalLib.intersect(setA, setB);
                                    var setCLength = setC.length;
                                    var searchObjId = [];
                                    for (var r = 0; r < setCLength; r++) {
                                        var newId = new ObjectID(setC[r]);
                                        searchObjId.push(newId);
                                    }
                                    db.getIn("user", searchObjId, page, limit, function (finalResult) {
                                        //Condition will be true if data not found
                                        if (finalResult.length <= 0) {
                                            var output = {responseCode: 402, responseMsg: "Data not found for Common Matches"};
                                            output.data = [];
                                            res.json(output);
                                            return false;
                                        }
                                        var output = {
                                            responseCode: 200,
                                            responseMsg: "Search result for Common Matches"
                                        };
                                        var finalResultArrayLength = finalResult.length;

                                        //All values store in this resultData object
                                        var resultData = {};
                                        resultData._id = uid;
                                        resultData.fname = userDetails.fname;
                                        resultData.lname = userDetails.lname;
                                        resultData.thumbImage = (userDetails.profilePics.original.thumb.length == 0) ? resultData.thumbImage = '' : userDetails.profilePics.original.thumb[0];
                                        resultData.totalUsers = setCLength;
                                        // If currentUser has no Partner object and interested in Relationship/LiveIn/Marriage than below condition will be true..
                                        if (type == 2 && ("partner" in userDetails) == false) {
                                            resultData.missingEntry = true;
                                            output.data = resultData;
                                            res.json(output);
                                            return false
                                        }
                                        resultData.searchData = [];
                                        //Function will fetch the Object of preferenceCheck
                                        db.get('options', {key: 'preferenceCheck'}, function (options) {
                                            if (!options) {
                                                res.json({responseCode: 402, responseMsg: 'Options not found.'});
                                                return false;
                                            } else {
                                                var dbObj = options.value;
                                                for (var i = 0; i < finalResultArrayLength; i++) {
                                                    var result = {};
                                                    result._id = finalResult[i]._id;
                                                    result.fname = finalResult[i].fname;
                                                    result.lname = finalResult[i].lname;
                                                    result.age = finalResult[i].age;
                                                    result.city = finalResult[i].city;
                                                    result.occupation = (!('preference.professional' in finalResult[i]) == true || finalResult[i].privacySettings.professional.occupation == false ) ? '*****' : result.occupation = finalResult[i].preference.professional.occupation;
                                                    result.designation = (!('preference.professional' in finalResult[i]) == true || finalResult[i].privacySettings.professional.designation == false ) ? '*****' : result.designation = finalResult[i].preference.professional.designation;
                                                    result.aboutMe = (!('aboutMe' in finalResult[i]) == true) ? 'N/A' : result.aboutMe = finalResult[i].aboutMe;
                                                    result.distance = generalLib.distance(userDetails.location.coordinates[0], userDetails.location.coordinates[1], finalResult[i].location.coordinates[0], finalResult[i].location.coordinates[1], 'K');
                                                    result.thumbImage = (finalResult[i].profilePics.original.thumb.length == 0) ? '' : finalResult[i].profilePics.original.thumb[0];
                                                    result.profilePics = (finalResult[i].profilePics.original.large.length == 0) ? '' : finalResult[i].profilePics.original.large[0];
                                                    if ('dateOMeter' in finalResult[i] == true)
                                                        result.dateOMeter = finalResult[i].dateOMeter;
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
                                                                        var checkConditionPartner = (matches[x] == 'myMatch') ? userDetails.partner[Arr[r].name] : finalResult[i].partner[Arr[r].name];
                                                                        var checkConditionPreference = (matches[x] == 'myMatch') ? finalResult[i].preference[Arr[r].name] : userDetails.preference[Arr[r].name];
                                                                        currentField[Arr[r].name] = finalResult[i].preference[Arr[r].name];
                                                                    }
                                                                    else {
                                                                        var checkConditionPartner = (matches[x] == 'myMatch') ? userDetails.partner[key][Arr[r].name] : finalResult[i].partner[key][Arr[r].name];
                                                                        var checkConditionPreference = (matches[x] == 'myMatch') ? finalResult[i].preference[key][Arr[r].name] : userDetails.preference[key][Arr[r].name];
                                                                        currentField[Arr[r].name] = finalResult[i].preference[key][Arr[r].name];
                                                                    }
                                                                    var checkArrType = Arr[r].check;
                                                                    if (matches[x] == 'commonMatch') {
                                                                        var condition1 = currentField.myMatch;
                                                                        var condition2 = currentField.meMatch;
                                                                        //set Arr[r].check as 'commonMatchCondition' so last case will be execute
                                                                        checkArrType = 'commonMatchCondition';
                                                                    }
                                                                    currentField[matches[x]] = false;
                                                                    switch (checkArrType) {
                                                                        case 'array':
                                                                            if (checkConditionPartner.indexOf(checkConditionPreference) >= 0 || checkConditionPartner.length == 0) {
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
                                                                            if (checkConditionPartner.length == 0 || (checkConditionPreference > checkConditionPartner[0] && checkConditionPreference < checkConditionPartner[1])) {
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
                                                            };
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
                                                        };
                                                    }
                                                    resultData.searchData.push(result);
                                                }
                                                output.data = resultData;
                                                res.json(output);
                                                res.end();
                                            }
                                        });
                                    });
                                });
                            });
                            //Set C logic End
                        }
                    });
                }
            });
        }
    }
};
