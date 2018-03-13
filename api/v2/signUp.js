/**
 * Created by INFYZO\saunak.shah on 24/11/16.
 */
var db = require('./../../app/db'),
    ObjectID = require('mongodb').ObjectID,
    generalLib = require('./generalLib'),
    config = require('./../../app/config');

module.exports = function (req, res) {
    var data = req.body.data;

    if (req.file) {
        var data = JSON.parse(req.body.data);
    } else {
        res.json({responseCode: 0, responseMsg: 'Please upload Profile Pic.'});
        return false;
    }

    // encrypt password
    data.password = generalLib.encyPasscode(data.password);

    var output = {};
    data.lastLoginIP = req.connection.remoteAddress;
    data.createdOn = data.updatedOn = new Date();

    // check if user exists
    db.get('user', {'email.self': data.email}, function (result) {
        if (result) {
            res.json({responseCode: 402, responseMsg: 'Email already exists.'});
            return false;
        } else {
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

            var sharp = require('sharp');
            var image = sharp(req.file.buffer);
            image
                .metadata()
                .then(function (metadata) {
                    // check image dimension
                    if (metadata.height < 512 && metadata.width < 512) {
                        res.json({responseCode: 0, responseMsg: 'Please upload another image.'});
                        return false;
                    } else {
                        var NodeGeocoder = require('node-geocoder');
                        var geocoder = NodeGeocoder();

                        // function to get city and countryCode
                        geocoder.reverse({lat: data.lat, lon: data.lon}, function (err, loc) {
                            if (err) {
                                res.json({
                                    responseCode: 402,
                                    responseMsg: 'There is some error to fetch location.'
                                });
                                return false;
                            } else {
                                var coordinates = [];
                                coordinates.push(parseFloat(data.lon));
                                coordinates.push(parseFloat(data.lat));

                                // set data
                                var updateData = {
                                    uuid:data.uuid,
                                    'email.self':data.email,
                                    'email.privacy':false,
                                    password:data.password,
                                    'mobile.self':data.mobile,
                                    'mobile.privacy':false,
                                    'dob.self':data.dob,
                                    'dob.privacy':false,
                                    'age.self':data.age,
                                    'age.partner':age,
                                    fname:data.fname,
                                    lname:data.lname,
                                    gender:data.gender,
                                    fgcmToken:data.fgcmToken,
                                    'city.self': loc[0].city + ',' + loc[0].administrativeLevels.level1long,
                                    'city.partner':"",
                                    'location.self': {
                                        type: "Point",
                                        coordinates: coordinates
                                    },
                                    'location.partner':200,
                                    createdOn:new Date(),
                                    updatedOn:new Date()
                                };

                                // unset latitude and longitude
                                delete data.lat;
                                delete data.lon;

                                // update user data
                                db.updateUser('user', {'email.self': data.email}, updateData, function (row) {
                                    if (!row) {
                                        res.json({
                                            responseCode: 500,
                                            responseMsg: 'There is some error to update data.'
                                        });
                                        return false;
                                    } else {
                                        data._id = row.upserted[0]._id;

                                        if (req.file) {
                                            var uploadPath = 'uploads/profile/' + data._id + '/';
                                            // create directory of user if not exists
                                            var fs = require('fs');
                                            if (!fs.existsSync(uploadPath)) {
                                                fs.mkdirSync(uploadPath);
                                            }
                                            var timestamp = new Date().getTime().toString();
                                            var ext = req.file.originalname.split('.').pop();
                                            var type = req.file.mimetype.split('/');

                                            if (type[0] == 'image') {
                                                // function to upload file
                                                generalLib.uploadFile(req, res, uploadPath, timestamp, function (path) {
                                                    if (!path) {
                                                        res.json({
                                                            responseCode: 0,
                                                            responseMsg: 'There is some error to upload file.'
                                                        });
                                                        return false;
                                                    } else {
                                                        // function to resize image
                                                        generalLib.resizeImage(ext, path, uploadPath, timestamp, function (clb) {
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

                                                                // function to create otp
                                                                generalLib.randomOtp(function (otp) {
                                                                    if (!otp) {
                                                                        res.end(JSON.stringify({
                                                                            responseCode: 0,
                                                                            responseMsg: 'There is some error to create otp.'
                                                                        }));
                                                                    } else {
                                                                        var emailSubject = 'Your one time password for your Lovecoy Account';
                                                                        var emailTemplate = 'Hello,<br><br> <Message> <Value> This is your one-time password. <br>' + otp + ' <br><br>Thank you,<br> Lovecoy </Value></Message></a>';
                                                                        // function to send email
                                                                        generalLib.sendMail(data.email, otp, req, emailSubject, emailTemplate, function (email) {
                                                                            if (!email) {
                                                                                res.end(JSON.stringify({
                                                                                    responseCode: 0,
                                                                                    responseMsg: 'There is some error to send mail.'
                                                                                }));
                                                                                return false;
                                                                            } else {
                                                                                var updateData = {
                                                                                    'profilePics.self': profilePics,
                                                                                    'profilePics.privacy':true,
                                                                                    'otp': otp
                                                                                };
                                                                                // update user data.
                                                                                db.saveUser('user', {'email.self': data.email}, {$set: updateData}, function (user) {
                                                                                    if (!user) {
                                                                                        res.json({
                                                                                            responseCode: 500,
                                                                                            responseMsg: 'There is some error to get data.'
                                                                                        });
                                                                                        return false;
                                                                                    } else {
                                                                                        output.responseCode = 200;
                                                                                        output.responseMsg = "Signup successfuly.";

                                                                                        delete user.lastLoginIP;
                                                                                        delete user.createdOn;
                                                                                        delete user.updatedOn;

                                                                                        output.data = {_id: user._id,isOrientation:true};
                                                                                        res.json(output);
                                                                                    }
                                                                                });
                                                                            }
                                                                        });
                                                                    }
                                                                });
                                                            }
                                                        });
                                                    }
                                                });
                                            } else {
                                                res.json({responseCode: 0, responseMsg: 'Invalid file format.'});
                                                return false;
                                            }
                                        }
                                    }
                                });
                            }
                        });
                    }
                });
        }
    });

};