var db = require('./../../app/db');

module.exports = function (req, res) {
    var ObjectID = require('mongodb').ObjectID;
    var data = req.body.data;

    if (data.email && data.password) {
        var crypto = require('crypto');
        var gl = require('./generalLib');
        data.password = gl.encyPasscode(data.password);
        var where = {
            'email.self': data.email,
            password: data.password
        };

        // function to get user
        db.get('user', where, function (resultUser) {
            if (!resultUser) {
                res.json({responseCode: 401, responseMsg: 'Incorrect email or password. Login failed'});
                return false;
            } else {
                var NodeGeocoder = require('node-geocoder');
                var geocoder = NodeGeocoder();
                // function to get city and countryCode
                geocoder.reverse({lat: data.lat, lon: data.lon}, function (err, loc) {
                    if (err) {
                        res.json({responseCode: 402, responseMsg: 'There is some error to fetch location.'});
                        return false;
                    } else {
                        var coordinates = [];
                        coordinates.push(parseFloat(data.lon));
                        coordinates.push(parseFloat(data.lat));

                        data.location = {
                            type: "Point",
                            coordinates: coordinates
                        };
                        // unset latitude and longitude
                        delete data.lat;
                        delete data.lon;

                        var updateData = {
                            'city.self': loc[0].city + ',' + loc[0].administrativeLevels.level1long,
                            'city.partner':"",
                            'location.self': {
                                type: "Point",
                                coordinates: coordinates
                            },
                            fgcmToken:data.fgcmToken,
                            lastLoginIP: req.connection.remoteAddress,
                            createdOn:new Date(),
                            updatedOn:new Date()
                        };
                        // set isOrientation
                        var isOrientation = true;
                        if (resultUser && (resultUser.hasOwnProperty("connections"))) {
                            var isOrientation = false;
                        }
                        // update location
                        db.saveUser('user', {_id: new ObjectID(resultUser._id)},{$set: updateData}, function (updateUser) {
                            if (!updateUser) {
                                res.json({
                                    responseCode: 500,
                                    responseMsg: 'There is some error to update data.'
                                });
                                return false;
                            } else {
                                var output = {responseCode: 200, responseMsg: 'Login successfully'};
                                updateUser.isOrientation = isOrientation;
                                delete  updateUser.password;
                                output.data = updateUser;
                                res.json(output);
                            }
                        });
                    }
                });
            }
        });
    } else {
        //if fbId is empty
        if (!data.fbId) {
            res.json({responseCode: 500, responseMsg: 'Facebook Id should not be empty.'});
            return false;
        }
        //if fname is empty
        if (!data.fname) {
            res.json({responseCode: 500, responseMsg: 'First Name should not be empty.'});
            return false;
        }
        //if lname is empty
        if (!data.lname) {
            res.json({responseCode: 500, responseMsg: 'Last Name should not be empty.'});
            return false;
        }
        //if gender is empty
        if (!data.gender) {
            res.json({responseCode: 500, responseMsg: 'Gender should not be empty.'});
            return false;
        }

        // check if user exists
        db.get('user', {fbId: data.fbId}, function (result) {
            var output = {};

            //Below condition will be true only if result is found and isDelete flag is true
            if (result && result.isDelete == 1) {
                res.json({
                    responseCode: 402,
                    responseMsg: 'Your profile on LoveCoy has been deleted.For further details, please contact our Customer Relations'
                });
                return false;
            }

            var NodeGeocoder = require('node-geocoder');
            var geocoder = NodeGeocoder();
            // function to get city and countryCode
            geocoder.reverse({lat: data.lat, lon: data.lon}, function (err, loc) {
                if (err) {
                    res.json({responseCode: 402, responseMsg: 'There is some error to fetch location.'});
                    return false;
                } else {
                    var coordinates = [];
                    coordinates.push(parseFloat(data.lon));
                    coordinates.push(parseFloat(data.lat));

                    // check fbImage
                    if (data.fbImage) {
                        var fbImage = data.fbImage;
                    } else {
                        var fbImage = '';
                    }
                    // unset latitude and longitude
                    delete data.lat;
                    delete data.lon;
                    delete data.fbImage;

                    var isOrientation = true;
                    if (result && (result.hasOwnProperty("connections"))) {
                        var isOrientation = false;
                    }

                    // set data to update
                    var updateData = {};
                    updateData.uuid = data.uuid;
                    updateData.fname = data.fname;
                    updateData.lname = data.lname;
                    updateData.gender = data.gender;
                    updateData.fgcmToken = data.fgcmToken;
                    updateData.city = {
                        self:loc[0].city + ',' + loc[0].administrativeLevels.level1long,
                        partner:""
                    };
                    updateData.location = {
                        self:{
                            type:"Point",
                            coordinates:coordinates
                        },
                        partner:200
                    };
                    updateData.lastLoginIP = req.connection.remoteAddress;
                    updateData.createdOn = new Date();
                    updateData.updatedOn = new Date();

                    if(data.email) {
                        updateData.email = {
                            self:data.email,
                            privacy:false
                        }
                    }
                    if(data.mobile) {
                        updateData.mobile = {
                            self:data.mobile,
                            privacy:false
                        }
                    }
                    // function matches no existing document, MongoDB will insert a new document
                    // function matches existing document, MongoDB will update document
                    db.updateUser('user', {fbId: data.fbId}, updateData, function (row) {
                        if (!row) {
                            res.json({responseCode: 500, responseMsg: 'There is some error to update data.'});
                            return false;
                        } else {
                            // if result found,login with facebook
                            if(result){
                                output.responseCode = 200;
                                output.responseMsg = "Login successful";

                                var isProfile = false;
                                if(!data.email || !data.profilePics || !data.dob || !data.mobile){
                                    var isProfile = true;
                                }

                                result.isOrientation = isOrientation;
                                result.isProfile = isProfile;

                                delete result.lastLoginIP;
                                delete result.createdOn;
                                delete result.updatedOn;
                                delete result.password;

                                output.data = result;
                                res.json(output);
                            } else{
                                // signup with facebook
                                data._id = row.upserted[0]._id;
                                // if profilePic url found
                                if (fbImage.length > 0) {
                                    var https = require('https');
                                    var fs = require('fs'),
                                        generalLib = require('./generalLib'),
                                        config = require('./../../app/config');

                                    // function for facebook profile pic download by url
                                    var download = function (url, uploadPath, fileName, cb) {
                                        var request = https.get(url, function (response) {
                                            var extension = response.headers['content-type'].split('/').pop();
                                            // create directory of user if not exists
                                            if (!fs.existsSync(uploadPath)) {
                                                fs.mkdirSync(uploadPath);
                                            }
                                            var file = fs.createWriteStream(uploadPath + 'original_' + fileName + '.' + extension);
                                            response.pipe(file);
                                            file.on('finish', function () {
                                                file.close(cb(fileName + '.' + extension));
                                            });
                                        });
                                    };

                                    var uploadPath = 'uploads/profile/' + data._id + '/';
                                    var timestamp = new Date().getTime().toString();
                                    download(fbImage, uploadPath, timestamp, function (fileName) {
                                        var extension = fileName.split('.').pop();
                                        var sharp = require('sharp');
                                        var image = sharp(uploadPath + 'original_' + fileName);
                                        image
                                            .metadata()
                                            .then(function (metadata) {
                                                if (metadata.height >= 512 && metadata.width >= 512) {
                                                    generalLib.resizeImage(extension, uploadPath + 'original_' + fileName, uploadPath, timestamp, function (clb) {
                                                        if (!clb) {
                                                            res.json({
                                                                responseCode: 500,
                                                                responseMsg: 'There is some error to upload image.'
                                                            });
                                                            return false;
                                                        } else {
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

                                                            var updateData = {
                                                                profilePics:profilePics
                                                            };
                                                            // update profile pics
                                                            db.updateUser('user', {_id: new ObjectID(data._id)}, updateData, function (updateUser) {
                                                                if (!updateUser) {
                                                                    res.json({
                                                                        responseCode: 500,
                                                                        responseMsg: 'There is some error to update data.'
                                                                    });
                                                                    return false;
                                                                } else {
                                                                    getUser(isOrientation,data);
                                                                }
                                                            });
                                                        }
                                                    });
                                                } else {
                                                    // function to remove Image
                                                    generalLib.removeImage(uploadPath + 'original_' + timestamp + '.' + extension, res);
                                                    getUser(isOrientation,data);
                                                }
                                            });
                                    });
                                } else {
                                    getUser(isOrientation,data);
                                }
                            }
                            // get updated user info and send response
                            function getUser(isOrientation,data) {
                                db.get('user', {_id: new ObjectID(data._id)}, function (user) {
                                    if (!user) {
                                        res.json({responseCode: 500, responseMsg: 'There is some error to get data.'});
                                        return false;
                                    } else {
                                        output.responseCode = 200;
                                        output.responseMsg = "Login successful";

                                        var isProfile = false;
                                        if(!data.email || !data.profilePics || !data.dob || !data.mobile){
                                            var isProfile = true;
                                        }

                                        user.isOrientation = isOrientation;
                                        user.isProfile = isProfile;

                                        delete user.lastLoginIP;
                                        delete user.createdOn;
                                        delete user.updatedOn;
                                        delete user.password;

                                        output.data = user;
                                        res.json(output);
                                    }
                                });
                            }
                        }
                    });
                }
            });
        });
    }
};