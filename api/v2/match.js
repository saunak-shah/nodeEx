/**
 * Created by INFYZO\hitesh.parikh on 9/12/16.
 */
var db = require('./../../app/db');
var ObjectID = require('mongodb').ObjectID;
var NodeGeocoder = require('node-geocoder');
var geocoder = NodeGeocoder();
var generalLib = require('./generalLib');
var data = {};
var where = {};
var type = 1; // Set the default type to 1 - CFD
var subType = '';
var subTypeSTR = ['Casual', 'Friendship', 'Dating'];
var subTypeLTR = ['Relationship', 'LiveIn', 'Marriage'];

// Default output
var output = {
    responseCode: 500,
    responseMsg: 'There is some error to with request.'
};

module.exports = function (req, res) {
    data = req.body.data;

    // Convert uid from string to mongo object id
    var uid = new ObjectID(data.uid);

    // Set where condition to update user for current location
    where = {_id: uid};

    // Set the type for API call for the 1 - CFD and 2 - RML
    type = data.type;

    // Set the subType for InterestedIn Data
    subType = data.subType;

    // If type is 1 i.e STR so it must having STR sub type
    // and 2 i.e LTR so it must having LTR sub Type
    if (!((type == 1 && subTypeSTR.indexOf(subType) != -1)
        || (type == 2 && subTypeLTR.indexOf(subType) != -1))) {
        res.json(output);
        res.end();
        return false;
    }

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
            return false;
        } else {
            // Set the current City and location for the user data update
            var updateData = {
                'location.self': {
                    type: 'Point',
                    coordinates: [parseFloat(data.lon), parseFloat(data.lat)]
                },
                'city.self': loc[0].city + ',' + loc[0].administrativeLevels.level1long
            };

            // Call to update Latest latitude and longitude of user location.
            db.saveUser('user', where, {$set: updateData}, getFilters);
        }
    }

    // Get the filters from the user collection with location settings
    function getFilters(userDetails) {
        // If location is not updated in google api reverse lookup that return with error
        if (!userDetails) {
            var output = {responseCode: 500, responseMsg: 'Location not Updated...'};
            output.data = [];
            res.json(output);
            res.end();
            return false;
        } else {

            // Creates an array for those users who are already in
            // connection and requested and pending and hold and ignored and blocked with
            // Self Id
            var user_not_in = [userDetails._id];

            // Ignored ids of the category which requested
            if (userDetails.connections[subType].ignore != undefined) {
                user_not_in.push.apply(user_not_in, userDetails.connections[subType].ignore);
            }

            // Blocked ids of the category which requested
            if (userDetails.connections[subType].block != undefined) {
                user_not_in.push.apply(user_not_in, userDetails.connections[subType].block);
            }

            // Connected users of other category and requested and pending of requested category
            for (var connections in userDetails.connections) {
                delete userDetails.connections['favourite'];

                if (userDetails.connections[connections].users != undefined) {
                    userDetails.connections[connections].users.map(function (data) {
                        if (subType == connections) {
                            user_not_in.push(data._id);
                        } else if (subType != connections && data.status == 'connected') {
                            user_not_in.push(data._id);
                        }
                    });
                }
            }

            // Get the opposite gender for filter
            var filterGender = (userDetails.gender == 'm') ? 'f' : 'm';

            // Default criteria which covers
            // Self id with excluded users
            // deleted profiles
            // Gender Array
            // Age Range
            var finalCriteria = {
                _id: {$not: {$in: user_not_in}},
                isDelete: 0,
                gender: filterGender,
                'age.self': {$gte: userDetails.age.partner[0], $lte: userDetails.age.partner[1]}
            };

            // If selected preferredCity then result will be based on preferredCity otherwise it will based on location
            if (userDetails.city.partner != undefined && userDetails.city.partner != '') {
                finalCriteria['city.self'] = userDetails.city.partner;
            } else {
                // Location with distance set in profile
                // Location lookup settings for longitude and latitude with
                // maximum distance of my partner in kilometer
                // divided by earth radius 6378.1
                var loc = {
                    $geoWithin: {
                        $centerSphere: [
                            [userDetails.location.self.coordinates[0], userDetails.location.self.coordinates[1]],
                            userDetails.location.partner / 6378.1]
                    }
                };

                finalCriteria['location.self'] = loc;
            }

            // Search Data based on Category
            finalCriteria['connections.' + subType] = {$exists: true, $ne: null};

            // If type is 2 i.e LTR so add more query to it
            if (type == 2 && subTypeLTR.indexOf(subType) != -1) {

                // Add marital status to filter criteria
                // if userDetails partner (settings) has this field
                // and should not be 'any' as value and containing it in others
                if (userDetails.maritalStatus != undefined
                    && userDetails.maritalStatus.partner != undefined
                    && userDetails.maritalStatus.partner.length > 0
                    && userDetails.maritalStatus.partner.indexOf('Any') == -1) {

                    finalCriteria['maritalStatus.self'] = {
                        $in: userDetails.maritalStatus.partner
                    };
                }

                // Add no Of Children to filter criteria
                // if userDetails partner (settings) has this field
                // and check if my filter partner value less than or others self value
                if (userDetails.noOfChildren != undefined
                    && userDetails.noOfChildren.partner != undefined) {

                    finalCriteria['noOfChildren.self'] = {
                        $lte: userDetails.noOfChildren.partner
                    };
                }

                // Add religion to filter criteria
                // if userDetails partner (settings) has this field
                // and should not be 'any' as value and containing it in others
                if (userDetails.religion != undefined
                    && userDetails.religion.partner != undefined
                    && userDetails.religion.partner.length > 0
                    && userDetails.religion.partner.indexOf('Any') == -1) {

                    finalCriteria['religion.self'] = {
                        $in: userDetails.religion.partner
                    };
                }

                // Add cast to filter criteria
                // if userDetails partner (settings) has this field
                // and should not be 'any' as value and containing it in others
                if (userDetails.cast != undefined
                    && userDetails.cast.partner != undefined
                    && userDetails.cast.partner.length > 0
                    && userDetails.cast.partner.indexOf('Any') == -1) {

                    finalCriteria['cast.self'] = {
                        $in: userDetails.cast.partner
                    };
                }

                // Add Native State to filter criteria
                // if userDetails partner (settings) has this field
                // and should not be 'any' as value and containing it in others
                if (userDetails.nativeState != undefined &&
                    userDetails.nativeState.partner != undefined
                    && userDetails.nativeState.partner.length > 0
                    && userDetails.nativeState.partner.indexOf('Any') == -1) {

                    finalCriteria['nativeState.self'] = {
                        $in: userDetails.nativeState.partner
                    };
                }
            }

            // Search data with userDetails and final criteria
            searchData(userDetails, finalCriteria);
        }
    }

    function searchData(userDetails, finalCriteria) {
        // Get the self open for for that category
        var selfOpenFor = userDetails.connections[subType]['openFor'];

        // Set the criteria and and-ing them for the final data
        var where = {
            $and: [finalCriteria]
        };

        // Get all the users which are matching with filtered criteria
        db.getAll('user', where, {}, function (filteredUsers) {

            if (!filteredUsers) {
                var output = {responseCode: 402, responseMsg: 'Data not found My Match'};
                res.json(output);
                res.end();
                return false;
            } else {
                var users = [];

                // Check if type is STR (Short Term Relationship)
                if (type == 1 && subTypeSTR.indexOf(subType) != -1) {
                    users = generalLib.STRData(userDetails, filteredUsers, selfOpenFor, subType);
                } else if (type == 2 && subTypeLTR.indexOf(subType) != -1) {
                    users = generalLib.LTRData(userDetails, filteredUsers);
                }

                // Success output
                var output = {responseCode: 200, responseMsg: 'Search result for STR'};
                var resultData = {};

                // User Details
                resultData._id = userDetails._id;
                resultData.fname = userDetails.fname;
                resultData.lname = userDetails.lname;
                resultData.thumbImage = (userDetails.profilePics[0].length == 0) ? '' : userDetails.profilePics[0].thumb;
                resultData.subscription = userDetails.subscription

                // If We have users than sort them with STR weightage in descending order
                if (users.length > 0) {
                    users.sort(function (a, b) {
                        return b.myWeightage - a.myWeightage;
                    });
                }

                resultData.searchData = users;
                output.data = resultData;
                res.json(output);
                res.end();
            }
        });
    }
};
