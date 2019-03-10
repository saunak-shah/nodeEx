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

    // Set the subType for InterestedIn Data
    subType = data.subType;

    // Pagination number
    page = (data.page) ? data.page : page;

    // Set the current user coordinates
    /*coordinates.push(parseFloat(data.lat));
     coordinates.push(parseFloat(data.lon));*/

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
            db.saveUser('user', where, {$set: updateData}, getFilters);
        }
    }

    // Get the filters from the user collection with location settings
    function getFilters(userDetails) {
        // Get the users who already has an action with requester
        var wherePrivacy = {
            from: where._id
        };

        db.getAll('privacySettings', wherePrivacy, {to: 1}, function (toUsers) {

            // If any error occurs during getting the users from privacySettings collection
            // default error output will return as error

            if (!toUsers) {
                res.json(output);
                res.end();
            } else {

                // Location lookup settings for latitude, longitude and maximum distance
                // WE are taking the minimum distance as zero
                var loc = {
                    $near: {
                        $geometry: userDetails.location,
                        //convert max distance into KM
                        $maxDistance: parseInt(userDetails.filters.distance * 1000)
                    }
                };

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
                    "filters.gender": userDetails.gender,
                    "filters.age.0": {$lte: userDetails.age},
                    "filters.age.1": {$gte: userDetails.age}
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
                    finalCriteria['filters.hasChild'] = userDetails.hasChild;
                    finalCriteria['filters.noOfChildren'] = {$gte: userDetails.noOfChildren};
                }
                // Search data with userDetails, final criteria and matches
                searchData(userDetails, finalCriteria, matches);
            }
        });
    }

    function searchData(userDetails, finalCriteria, matches) {
        var whereAnd = [finalCriteria];
        if (type == 2) {
            whereAnd.push(
                {$or: [{'filters.maritalStatus': userDetails.maritalStatus}, {'filters.maritalStatus': []}]},
                {$or: [{'filters.religion': userDetails.religion}, {'filters.religion': []}]},
                {$or: [{'filters.cast': userDetails.cast}, {'filters.cast': []}]},
                {$or: [{'filters.native': userDetails.native}, {'filters.native': []}]}
            );
        }
        // Set the criteria and and-ing them for the final data
        var where = {
            $and: whereAnd
        };
        db.getAll('user', where, {}, function (totalUsers) {
            if (!totalUsers) {
                var output = {responseCode: 402, responseMsg: 'Data not found Reverse Match'};
                res.json(output);
                res.end();
            } else {
                model.searchUserMatch('user', where, page, limit, function (searchResult) {

                    // Condition will be true if data not found
                    if (!searchResult || searchResult.length <= 0) {
                        var output = {responseCode: 402, responseMsg: 'Data not found for Reverse Match'};
                        output.data = [];
                        res.json(output);
                        res.end();

                    } else {

                        var output = {responseCode: 200, responseMsg: 'Search result for Reverse Match'};
                        var searchResultArrayLength = searchResult.length;

                        //All values store in this resultData object
                        var resultData = {};
                        resultData._id = where._id;
                        resultData.fname = userDetails.fname;
                        resultData.lname = userDetails.lname;
                        resultData.thumbImage = (userDetails.profilePics.original.thumb.length == 0) ? resultData.thumbImage = '' : userDetails.profilePics.original.thumb[0];
                        resultData.totalUsers = totalUsers.length;
                        // If currentUser has no Partner object and interested in Relationship/LiveIn/Marriage than below condition will be true..
                        if (type == 2 && ('partner' in userDetails) == false) {
                            resultData.missingEntry = true;
                            output.data = resultData;
                            res.json(output);
                            return false;
                        }

                        resultData.searchData = [];
                        //Function will fetch the Object of preferenceCheck
                        db.get('options', {key: 'preferenceCheck'}, function (options) {
                            if (!options) {
                                res.json({responseCode: 402, responseMsg: 'Options not found.'});
                                return false;
                            } else {
                                var dbObj = options.value;
                                for (var i = 0; i < searchResultArrayLength; i++) {
                                    var result = {};
                                    result._id = searchResult[i]._id;
                                    result.fname = searchResult[i].fname;
                                    result.lname = searchResult[i].lname;
                                    result.age = searchResult[i].age;
                                    result.city = searchResult[i].city;
                                    result.occupation = (!('preference.professional' in searchResult[i]) == true || searchResult[i].privacySettings.professional.occupation == false ) ? '*****' : result.occupation = searchResult[i].preference.professional.occupation;
                                    result.designation = (!('preference.professional' in searchResult[i]) == true || searchResult[i].privacySettings.professional.designation == false ) ? '*****' : result.designation = searchResult[i].preference.professional.designation;
                                    result.aboutMe = (!('aboutMe' in searchResult[i]) == true) ? 'N/A' : result.aboutMe = searchResult[i].aboutMe;
                                    result.distance = generalLib.distance(userDetails.location.coordinates[0], userDetails.location.coordinates[1], searchResult[i].location.coordinates[0], searchResult[i].location.coordinates[1], 'K');
                                    result.thumbImage = (searchResult[i].profilePics.original.thumb.length == 0) ? '' : searchResult[i].profilePics.original.thumb[0];
                                    result.profilePics = (searchResult[i].profilePics.original.large.length == 0) ? '' : searchResult[i].profilePics.original.large[0];
                                    if ('dateOMeter' in searchResult[i] == true)
                                        result.dateOMeter = searchResult[i].dateOMeter;
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
                                                        var checkConditionPartner = (matches[x] == 'myMatch') ? userDetails.partner[Arr[r].name] : searchResult[i].partner[Arr[r].name];
                                                        var checkConditionPreference = (matches[x] == 'myMatch') ? searchResult[i].preference[Arr[r].name] : userDetails.preference[Arr[r].name];
                                                        currentField[Arr[r].name] = searchResult[i].preference[Arr[r].name];
                                                    }
                                                    else {
                                                        var checkConditionPartner = (matches[x] == 'myMatch') ? userDetails.partner[key][Arr[r].name] : searchResult[i].partner[key][Arr[r].name];
                                                        var checkConditionPreference = (matches[x] == 'myMatch') ? searchResult[i].preference[key][Arr[r].name] : userDetails.preference[key][Arr[r].name];
                                                        currentField[Arr[r].name] = searchResult[i].preference[key][Arr[r].name];
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
                    }
                });
            }
        });
    }
};
