/**
 * Created by INFYZO\rachana.thakkar on 20/8/16.
 */
var db = require('./../../app/db'),
    ObjectID = require('mongodb').ObjectID,
    generalLib = require('./generalLib');

module.exports = function (req, res) {

    var output = {};
    var updateData = {};
    var data = (req.files) ? JSON.parse(req.body.data) : req.body.data;

    var where = {_id: new ObjectID(data.uid)};
    var table = 'user';

    switch (data.type) {
        // Get all the profile related fields
        case 'interestedIn':
            var connections = {};
            db.get('options', {key: 'interestedIn'}, function (options) {
                if (!options) {
                    res.json({responseCode: 402, responseMsg: 'Options not found.'});
                    return false;
                } else {
                    db.getSelected('user', where, {}, function (userDetails) {
                        if (!userDetails) {
                            res.json(output);
                            res.end();
                        } else {
                            //FirstTime Save Orientation
                            if (userDetails.connections == undefined) {
                                updateData.connections = {};
                                for (var y in options.options) {
                                    var keyObj = {
                                        "status": (data.interestedIn.category == y) ? data.interestedIn.status : 0,
                                        "openFor": (data.interestedIn.category == y) ? data.interestedIn.openFor : []
                                    };
                                    updateData.connections[y] = keyObj;
                                }
                            } else {
                                updateData['connections.' + data.interestedIn.category + '.status'] = data.interestedIn.status;
                                if (data.interestedIn.openFor != undefined)updateData['connections.' + data.interestedIn.category + '.openFor'] = data.interestedIn.openFor;
                            }
                            db.saveUser(table, where, {$set: updateData}, function (row) {
                                if (!row) {
                                    res.json({responseCode: 0, responseMsg: 'There is some error to update data.'});
                                    return false;
                                } else {
                                    output.responseCode = 200;
                                    output.responseMsg = data.interestedIn.category + ' updated successfully';
                                    output.data = row;
                                    res.json(output);
                                }
                            });
                            return false;
                        }
                    });
                }
            });
            break;

        case 'oneField':
            db.get('options', {key: data.field}, function (options) {
                if (!options) {
                    res.json({responseCode: 402, responseMsg: 'Unauthorized Request.'});
                    return false;
                } else {
                    if (req.files) {
                        var fs = require('fs');
                        // function to check if path not exists create directory
                        function makeDir(path) {
                            if (!fs.existsSync(path)) {
                                fs.mkdirSync(path);
                            }
                        }
                        // check key is available in object
                        var fileOpt = req.files[data.field][0];
                        // type1 to check image type
                        var type1 = fileOpt.mimetype.split('/');
                        // type2 to check pdf
                        var type2 = fileOpt.mimetype.split('/').pop();
                        if (type1[0] == 'image' || type2 == 'pdf') {
                            var fs = require('fs');
                            var uploadPath = 'uploads/profile/' + data.uid + '/';
                            // check if uid not exists make directory for uid
                            makeDir(uploadPath);

                            var fileName = fileOpt.fieldname;
                            // extension of file
                            var extension = fileOpt.originalname.split('.').pop();
                            // file upload path
                            var filePath = uploadPath + fileName + '.' + extension;

                            fs.writeFile(filePath, fileOpt.buffer, function (err) {
                                if (err) {
                                    return res.end('Error uploading file.');
                                } else {
                                    updateData[data.field] = {};
                                    updateData[data.field].self = fileOpt.fieldname + '.' + extension;
                                    if (data.partner != undefined)
                                        updateData[data.field].partner = data.partner;
                                    if (data.privacy != undefined)
                                        updateData[data.field].privacy = data.privacy;
                                    if (data.self == options.self)
                                        unset[data.field] = 1;
                                    db.saveUser(table, where, {$set: updateData}, function (row) {
                                        if (!row) {
                                            res.json({
                                                responseCode: 0,
                                                responseMsg: 'There is some error to update data.'
                                            });
                                            return false;
                                        } else {
                                            output.responseCode = 200;
                                            output.responseMsg = "Image uploaded successfully.";
                                            output.data = row;
                                            res.json(output);
                                        }
                                    });
                                }
                            });
                        } else {
                            res.json({responseCode: 0, responseMsg: 'Invalid file type.'});
                            return false;
                        }
                        return false;
                    } else {

                        //Save for ObjectFields
                        if (options.isRoot == undefined) {
                            updateData[data.field] = {};
                            updateData[data.field].self = data.self;
                            if (data.partner != undefined)
                                updateData[data.field].partner = data.partner;
                            if (data.privacy != undefined)
                                updateData[data.field].privacy = data.privacy;
                        } else {
                            //Save for flatFields
                            updateData[data.field] = data.self;
                        }
                        if (data.self == options.self){
                            var unset = {};
                            unset[data.field] = 1;
                            var setData = {
                                $unset: unset
                            }
                        }else {
                            var setData = {
                                $set: updateData
                            }
                        }
                        db.saveUser(table, where, setData, function (row) {
                            if (!row) {
                                res.json({responseCode: 0, responseMsg: 'There is some error to update data.'});
                                return false;
                            } else {
                                output.responseCode = 200;
                                output.responseMsg = data.field + ' updated successfully';
                                output.data = row;
                                res.json(output);
                            }
                        });
                    }
                }
            });
            break;

        case 'editProfile':
            data.subType = "Profile";
            var updateData = {};

            if (data.dob) {
                var arrDob = data.dob.split('/');
                // if facebook user hide year from birth day
                if (arrDob.length == 3) {
                    var birthdate = new Date(data.dob);
                    var cur = new Date();
                    var diff = cur - birthdate; // This is the difference in milliseconds
                    data.age = Math.floor(diff / 31536000000); // Divide by 1000*60*60*24*365
                }

                var minAge = 18;
                var maxAge = 70;
                var variations = [5, 2];

                // We have 18+ years policy for our users so we are restricting < 18 year users
                if (data.age < minAge) {
                    res.json({responseCode: 500, responseMsg: 'You are not 18+ so we can\'t log you in.'});
                    return false;
                }

                // We have policy for max age so we are restricting > max age users
                if (data.age > maxAge) {
                    res.json({
                        responseCode: 500,
                        responseMsg: 'Your age must be less than 70 for lovecoy app so we can\'t log you in.'
                    });
                    return false;
                }

                if (data.age && data.gender == 'm') {
                    // age from if gender is male
                    var age = [];
                    age.push((data.age - variations[0] < minAge) ? minAge : data.age - variations[0]);
                    // age to if gender is male
                    age.push((data.age + variations[1] > maxAge) ? maxAge : data.age + variations[1]);
                } else if (data.age && data.gender == 'f') {
                    var age = [];
                    // age from if gender is female
                    age.push((data.age - variations[1] < minAge) ? minAge : data.age - variations[1]);
                    // age to if gender is female
                    age.push((data.age + variations[0] > maxAge) ? maxAge : data.age + variations[0]);
                }
            }

            if (req.files) {
                // check key is available in object
                if ('profilePics' in req.files) {
                    var fileOpt = req.files.profilePics[0];
                }

                // type1 to check image type
                var type1 = fileOpt.mimetype.split('/');
                if (type1[0] == 'image') {
                    var sharp = require('sharp');
                    var image = sharp(fileOpt.buffer);
                    image
                        .metadata()
                        .then(function (metadata) {
                            // check image dimension
                            if (metadata.height < 512 && metadata.width < 512) {
                                res.json({responseCode: 0, responseMsg: 'Please upload another image.'});
                                return false;
                            } else {
                                var fs = require('fs');
                                var uploadPath = 'uploads/profile/' + data.uid + '/';
                                // make directory as per uid

                                if (!fs.existsSync(uploadPath)) {
                                    fs.mkdirSync(uploadPath);
                                }

                                var timestamp = new Date().getTime().toString();
                                // extension of file
                                var extension = fileOpt.originalname.split('.').pop();
                                // file upload path
                                var filePath = uploadPath + 'original_' + timestamp + '.' + extension;

                                fs.writeFile(filePath, fileOpt.buffer, function (err) {
                                    if (err) {
                                        return res.end('Error uploading file.');
                                    } else {
                                        // function to resize image
                                        generalLib.resizeImage(extension, filePath, uploadPath, timestamp, function (clb) {
                                            if (!clb) {
                                                res.json({
                                                    responseCode: 500,
                                                    responseMsg: 'There is some error to upload image.'
                                                });
                                                return false;
                                            } else {
                                                var config = require('./../../app/config');
                                                var profilePics = [
                                                    {
                                                        large: req.protocol + "://" + config.host + ':' + config.port + '/' + uploadPath + timestamp + '.' + extension,
                                                        largeBlur: req.protocol + "://" + config.host + ':' + config.port + '/' + uploadPath + 'blur_' + timestamp + '.' + extension,
                                                        medium: req.protocol + "://" + config.host + ':' + config.port + '/' + uploadPath + 'medium_' + timestamp + '.' + extension,
                                                        mediumBlur: req.protocol + "://" + config.host + ':' + config.port + '/' + uploadPath + 'blur_medium_' + timestamp + '.' + extension,
                                                        thumb: req.protocol + "://" + config.host + ':' + config.port + '/' + uploadPath + 'thumb_' + timestamp + '.' + extension,
                                                        thumbBlur: req.protocol + "://" + config.host + ':' + config.port + '/' + uploadPath + 'blur_thumb_' + timestamp + '.' + extension
                                                    }
                                                ];
                                                // set data to update
                                                updateData.profilePics =profilePics;
                                                updateData.fname = data.fname;
                                                updateData.lname = data.lname;
                                                updateData.email = {
                                                    self: data.email,
                                                    privacy: false
                                                };
                                                updateData.gender = data.gender;
                                                updateData.mobile = {
                                                    self: data.mobile,
                                                    privacy: false
                                                };
                                                updateData.dob = {
                                                    self:data.dob,
                                                    privacy:false
                                                };
                                                updateData.age = {
                                                    self: data.age,
                                                    partner: age
                                                };

                                                db.saveUser(table, where, {$set: updateData}, function (row) {
                                                    if (!row) {
                                                        res.json({
                                                            responseCode: 0,
                                                            responseMsg: 'There is some error to update data.'
                                                        });
                                                        return false;
                                                    } else {
                                                        output.responseCode = 200;
                                                        output.responseMsg = data.subType + " updated successfully.";
                                                        output.data = row;
                                                        res.json(output);
                                                    }
                                                });

                                            }
                                        });
                                    }
                                });
                            }
                        });
                } else {
                    res.json({responseCode: 0, responseMsg: 'Invalid file type.'});
                    return false;
                }
                return false;
            } else {
                updateData.fname = data.fname;
                updateData.lname = data.lname;
                updateData.email = {
                    self: data.email
                };
                updateData.gender = data.gender;
                updateData.mobile = {
                    self: data.mobile,
                    privacy: false
                };
                updateData.dob = {
                    self:data.dob,
                    privacy:false
                };
                updateData.age = {
                    self: data.age,
                    partner: age
                }
            }
            break;

        case 'favourite':
            updateData = {
                'connections.favourite': new ObjectID(data.to)
            };
            var select = (data.isFavourite == 0) ? {$pull: updateData} : {$addToSet: updateData};
            db.saveUser('user', where, select, function (updateUser) {
                if (!updateUser) {
                    res.json({
                        responseCode: 0,
                        responseMsg: 'There is some error to update data.'
                    });
                    return false;
                } else {
                    output.responseCode = 200;
                    output.responseMsg = 'Data updated successfully';
                    output.data = updateUser;
                    res.json(output);
                    return false;
                }
            });
            break;

        case 'settings':
            data.subType = "Settings";
            updateData = {
                'age.partner': data.age.partner,
                'location.partner': data.location.partner,
                'city.partner': data.city.partner,
                'maritalStatus.partner': data.maritalStatus.partner,
                'noOfChildren.partner': data.noOfChildren.partner,
                'religion.partner': data.religion.partner,
                'cast.partner': data.cast.partner,
                'nativeState.partner': data.nativeState.partner
            };
            break;

        case 'myOnlineTimeSlots':
            data.subType = "Time Slots";
            updateData = {
                'onlineTimeSlots': data.onlineTimeSlots
            };
            break;
        case 'updateToken':
            updateData = {
                fgcmToken: data.fgcmToken
            };
            data.subType = "Fgcm token";
            break;
        default:
            res.json({responseCode: 0, responseMsg: 'Field is not defined..'});
            return false;
    }
    // update user data.
    if (data.type != "interestedIn" && data.type != "oneField" && data.type != "favourite") {
        db.saveUser(table, where, {$set: updateData}, function (row) {
            if (!row) {
                res.json({responseCode: 0, responseMsg: 'There is some error to update data.'});
                return false;
            } else {
                output.responseCode = 200;
                output.responseMsg = data.subType + ' updated successfully';
                output.data = row;
                res.json(output);
            }
        });
    }
}
