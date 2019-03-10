/**
 * Created by INFYZO\rachana.thakkar on 19/8/16.
 */
var db = require('./../../app/db');
var gl = require('./generalLib');
var ObjectID = require('mongodb').ObjectID;

module.exports = function (req, res) {
    var data = req.body.data;
    var output = {responseCode: 500, responseMsg: 'There is technical issue with systems'};

    var where = {
        _id: new ObjectID(data.uid)
    };

    switch (data.type) {

        // Get all the profile related fields
        case 'interestedIn':
            db.get('options', {key: 'interestedIn'}, function (options) {
                if (!options) {
                    res.json({responseCode: 402, responseMsg: 'Options not found.'});
                    return false;
                } else {
                    db.getSelected('user', where, {connections: 1, _id: 1}, function (userDetails) {
                        if (!userDetails) {
                            res.json(output);
                            res.end();
                        } else {
                            var Obj = {};
                            Obj.interestedIn = {};
                            for (var x in options.options) {
                                Obj.interestedIn[x] = {};
                                Obj.interestedIn[x].status = (userDetails.connections == undefined) ? 0 : userDetails.connections[x].status;
                                Obj.interestedIn[x].openFor = (userDetails.connections == undefined) ? [] : userDetails.connections[x].openFor;
                                Obj.interestedIn[x].options = {};
                                for (var y in options.options[x]) {
                                    Obj.interestedIn[x].options[options.options[x][y].subCategory] = options.options[x][y].openFor;
                                }
                            }
                            output.responseCode = 200;
                            output.responseMsg = data.type + ' found';
                            output.data = Obj;
                            res.json(output);
                        }
                    });
                }
            });
            break;

        //Fields which are as it is.
        case 'oneField':
            var select = {};
            select[data.field] = 1;
            db.get('options', {key: data.field}, function (options) {
                if (!options) {
                    res.json(output);
                    res.end();
                } else {
                    db.getSelected('user', where, {}, function (userDetails) {
                        if (!userDetails) {
                            res.json(output);
                            res.end();
                        } else {
                            var Obj = {};
                            if (userDetails[data.field] == undefined) {
                                Obj.self = options.self;
                                if (options.partner != undefined) Obj.partner = options.partner;
                                if (options.partnerType != undefined) Obj.partnerType = options.partnerType;
                                if (options.selfType != undefined) Obj.selfType = options.selfType;
                                if (options.privacy != undefined) Obj.privacy = options.privacy;
                                if (options.options != undefined) Obj.options = options.options;
                            } else {
                                //Below condition is for the root field
                                Obj.self = (options.isRoot == undefined) ? userDetails[data.field].self : userDetails[data.field];
                                if (userDetails[data.field].partner != undefined) Obj.partner = userDetails[data.field].partner;
                                if (userDetails[data.field].privacy != undefined) Obj.privacy = userDetails[data.field].privacy;
                                if (options.options != undefined) Obj.options = options.options;
                                if (options.partnerType != undefined) Obj.partnerType = options.partnerType;
                                if (options.selfType != undefined) Obj.selfType = options.selfType;
                            }
                            output.responseCode = 200;
                            output.responseMsg = data.field + ' found';
                            output.data = Obj;
                        }
                        res.json(output);
                    });
                }
            });
            break;

        case 'settings':
            data.subType = "Settings";
            db.get('user', {_id: new ObjectID(data.uid)}, function (user) {
                if (!user) {
                    res.json({
                        responseCode: 401,
                        responseMsg: 'Unauthorized user.'
                    });
                } else {
                    delete user.age.self;
                    delete user.location.self;
                    delete user.city.self;
                    var where = {
                        key: {
                            $in: ['maritalStatus', 'noOfChildren', 'religion', "cast", "nativeState"]
                        }
                    };

                    // function to get options
                    db.getAll('options', where, {}, function (options) {
                        if (!options) {
                            res.json({
                                responseCode: 401,
                                responseMsg: 'No options found.'
                            });
                        } else {
                            for (var x in options) {
                                if (options[x].key == "maritalStatus") {
                                    var maritalStatus = {
                                        partner: (user.maritalStatus && user.maritalStatus.partner) ? user.maritalStatus.partner : "",
                                        options: options[x].options
                                    }
                                }
                                if (options[x].key == "noOfChildren") {
                                    var noOfChildren = {
                                        partner: (user.noOfChildren && user.noOfChildren.partner) ? user.noOfChildren.partner : 0,
                                    }
                                }
                                if (options[x].key == "religion") {
                                    var religion = {
                                        partner: (user.religion && user.religion.partner) ? user.religion.partner : "",
                                        options: options[x].options
                                    };
                                }
                                if (options[x].key == "cast") {
                                    var cast = {
                                        partner: (user.cast && user.cast.partner) ? user.cast.partner : "",
                                        options: options[x].options
                                    };
                                }
                                if (options[x].key == "nativeState") {
                                    var nativeCity = {
                                        partner: (user.nativeState && user.nativeState.partner) ? user.nativeState.partner : "",
                                        options: options[x].options
                                    };
                                }
                            }
                        }
                        output.responseCode = 200;
                        output.responseMsg = data.subType + ' data';
                        output.data = {
                            age: user.age,
                            location: user.location,
                            city: user.city,
                            maritalStatus: maritalStatus,
                            noOfChildren: noOfChildren,
                            religion: religion,
                            cast: cast,
                            nativeCity: nativeCity
                        };
                        res.json(output);
                        res.end();
                    });
                }
            });
            break;

        case "myOnlineTimeSlots":

        data.subType = "Time Slots";
        db.get('user', {_id: new ObjectID(data.uid)}, function (user) {
            if (!user) {
                res.json({
                    responseCode: 401,
                    responseMsg: 'Unauthorized user.'
                });
            } else {
                var days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                var nextDays = 7;
                var daysSorted = [];
                var today = new Date();

                for(var i = 0; i < nextDays; i++)
                {
                    var newDate = new Date(today.setDate(today.getDate() + 1));
                    daysSorted.push(days[newDate.getDay()]);
                }

                var timeslots = {};

                for(x in daysSorted){
                    if(user.onlineTimeSlots.hasOwnProperty(daysSorted[x])){
                        var day = daysSorted[x];
                        timeslots[day] = user.onlineTimeSlots[day]
                    }
                }
                var output = {};
                output.responseCode = 200;
                output.responseMsg = data.subType + ' fetched successfully.';
                output.data = timeslots;
                res.json(output);return false;
            }
        });

        break;

        case 'onlineAvailableUsers':
            data.subType = "Online Time";
            db.get('user', {_id: new ObjectID(data.uid)}, function (user) {
                if (!user) {
                    res.json({
                        responseCode: 401,
                        responseMsg: 'Unauthorized user.'
                    });
                } else {
                    var userIds = [];
                    for(x in user.connections){
                        for(y in user.connections[x].users){
                            if(user.connections[x].users[y].status == "connected"){
                                userIds.push(user.connections[x].users[y]._id)
                            }
                        }
                    }

                    var select = {
                        _id: 1,
                        fname: 1,
                        lname: 1,
                        onlineTimeSlots: 1,
                        profilePics: 1
                    };

                    var days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                    var myDate = new Date();
                    var hour  = myDate.getHours();
                    var currDay  = myDate.getDay();
                    var ampm = hour >= 12 ? 'PM' : 'AM';
                    var mhour = hour % 12;
                    var mhour = hour ? hour : 12; // the hour '0' should be '12'

                    var chkTimeSlots = {};
                    chkTimeSlots['onlineTimeSlots.' + days[currDay]] = {
                        $exists: true
                    };

                    db.getAll("user", {$and: [{_id: {$in: userIds}}, chkTimeSlots]}, select, function (users) {

                        var availableTime = {};
                        var user={};
                        for(x in users){

                            var inc = 0;
                            for(var i = hour; i < 24; i++)
                                {
                                    if(hour > 12){
                                        console.log("aaa");
                                        inc++;
                                        var cusHr = (mhour+inc);
                                        var frmtHr = mhour + '-' +cusHr + ' '+ ampm;

                                        if(users[x].onlineTimeSlots[days[currDay]].indexOf(frmtHr)){
                                            user.fname = users[x].fname;
                                            user.lname = users[x].lname;

                                            availableTime[frmtHr] = user;

                                            //console.log(availableTime);
                                        }
                                    } else{
                                        inc++;
                                        console.log(inc);
                                        var cusHr = (mhour+inc);
                                        var frmtHr = mhour + '-' +cusHr + ' '+ ampm;

                                        if(users[x].onlineTimeSlots[days[currDay]].indexOf(frmtHr)){
                                            user.fname = users[x].fname;
                                            user.lname = users[x].lname;

                                            availableTime[frmtHr] = user;

                                            //console.log(availableTime);
                                        }
                                    }
                                }
                        }
                        //console.log(availableTime);


                        var output = {};
                        output.responseCode = 200;
                        output.responseMsg = data.subType + ' fetched successfully.';
                        output.data = availableTime;
                        res.json(output);
                    });
                    console.log(userIds);
                }
            });
            break;

        default:
            res.json(output);
            res.end();
            break;
    }
};

var dat = {
    "dateOMeter": {
        "1": [{
            "_id": ObjectID("58493dcf0026150e3687aca8"),
            "fname": "Original",
            "lname": "Data",
            "thumb": "https://lovecoy.s3.ap-south-1.amazonaws.com/uploads/profile/581492de240bdb6713beba48/thumb_1477743358296.jpg"
        }, {
            "_id": ObjectID("584a3d200026150e3687acac"),
            "fname": "Rachana",
            "lname": "Thakkar",
            "thumb": "https://lovecoy.s3.ap-south-1.amazonaws.com/uploads/profile/581492de240bdb6713beba48/blur_thumb_1477743358296.jpg"
        }],
        "2": [{
            "_id": ObjectID("58493dcf0026150e3687aca8"),
            "fname": "Original",
            "lname": "Data",
            "thumb": "https://lovecoy.s3.ap-south-1.amazonaws.com/uploads/profile/581492de240bdb6713beba48/thumb_1477743358296.jpg"
        }, {
            "_id": ObjectID("584a3d200026150e3687acac"),
            "fname": "Rachana",
            "lname": "Thakkar",
            "thumb": "https://lovecoy.s3.ap-south-1.amazonaws.com/uploads/profile/581492de240bdb6713beba48/blur_thumb_1477743358296.jpg"
        }]
    }

}

