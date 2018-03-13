var db = require('./../../app/db');

module.exports = function (req, res) {
    var ObjectID = require('mongodb').ObjectID;
    var data = req.body.data;

    // if Date of birth is not empty
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
            res.json({responseCode: 500, responseMsg: 'Your age must be less than 70 for lovecoy app so we can\'t log you in.'});
            return false;
        }
    }

    // check if user exists
    db.get('user', {fbId: data.fbId}, function (result) {
        var output = {};

        data.lastLoginIP = req.connection.remoteAddress;
        data.createdOn = data.updatedOn = new Date();
        // if no user found in user collection
        if (!result) {
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
            //First time gifts and privacySettings will be added in user account
            db.get('options', {key: "defaultObjects"}, function (options) {
                data.profilePics = options.value.profilePics;
                data.email = options.value.email;
                data.mobile = options.value.mobile;
                data.maritalStatus = options.value.maritalStatus;
                data.hasChild = options.value.hasChild;
                data.noOfChildren = options.value.noOfChildren;
                data.religion = options.value.religion;
                data.cast = options.value.cast;
                data.native = options.value.native;
                data.currentAddress = options.value.currentAddress;
                data.permanentAddress = options.value.permanentAddress;
                data.healthInfo = options.value.healthInfo;
                data.companyName = options.value.companyName;
                data.educationInstitute = options.value.educationInstitute;
                data.schoolBoard = options.value.schoolBoard;
                data.familyInfo = options.value.familyInfo;
                data.horoscopeDetail = options.value.horoscopeDetail;
                data.aboutMe = options.value.aboutMe;
                data.knownLanguage = options.value.knownLanguage;
                data.education = options.value.education;

                data.preference = options.value.preference;
                data.partner = options.value.partner;
                data.privacySettings = options.value.privacySettings;
                data.filters = options.value.filters;
                data.filters.gender = [(data.gender == 'm') ? 'f' : 'm'];
                data.filters.age = age;
                data.gifts = options.value.gifts;
                data.dateOMeter = options.value.dateOMeter;
                data.isDelete = options.value.isDelete;
            });
        } else {
            //Below condition will be true only if result is found and isDelete flag is true
            if (result.isDelete == 1) {
                res.json({responseCode: 402, responseMsg: 'Your profile on LoveCoy has been deleted.For further details, please contact our Customer Relations'});
                return false;
            }
            data.filters = result.filters;
        }

        var NodeGeocoder = require('node-geocoder');
        var geocoder = NodeGeocoder();

        // function to get city and countryCode
        geocoder.reverse({lat: data.lat, lon: data.lon}, function (err, loc) {
            if (err) {
                res.json({responseCode: 402, responseMsg: 'There is some error to fetch location.'});
                return false;
            } else {
                data.city = loc[0].city + ',' + loc[0].administrativeLevels.level1long;
                var coordinates = [];
                coordinates.push(parseFloat(data.lat));
                coordinates.push(parseFloat(data.lon));

                data.location = {
                    type: "Point",
                    coordinates: coordinates
                };

                // check fbImage
                if(data.fbImage) {
                    var fbImage = data.fbImage;
                } else {
                    var fbImage = '';
                }
                // unset latitude and longitude
                delete data.lat;
                delete data.lon;
                delete data.fbImage;

                data.isOrientation = true;
                if (result && (result.interestedIn !== undefined && result.interestedIn.length > 0)) {
                    data.isOrientation = false;
                }
                db.updateUser('user', {fbId: data.fbId}, data, function (row) {
                    if (!row) {
                        res.json({responseCode: 500, responseMsg: 'There is some error to update data.'});
                        return false;
                    } else {
                        data._id =  (row.hasOwnProperty('upserted')) ? row.upserted[0]._id : result._id;

                        // if profilePic url found
                        if(fbImage.length > 0) {
                            var https = require('https');
                            var fs = require('fs'),
                                generalLib = require('./generalLib'),
                                config = require('./../../app/config');

                            // function for facebook profile pic download by url
                            var download = function(url, uploadPath, fileName, cb) {
                                var request = https.get(url, function(response) {
                                    var extension = response.headers['content-type'].split('/').pop();
                                    // create directory of user if not exists
                                    if (!fs.existsSync(uploadPath)) {
                                        fs.mkdirSync(uploadPath);
                                    }
                                    var file = fs.createWriteStream(uploadPath+'original_'+fileName+'.'+extension);
                                    response.pipe(file);
                                    file.on('finish', function() {
                                        file.close(cb(fileName+'.'+extension));
                                    });
                                });
                            };

                            var uploadPath = 'uploads/profile/'+data._id+'/';
                            var timestamp = new Date().getTime().toString();
                            download(fbImage, uploadPath, timestamp, function(fileName){
                                var extension = fileName.split('.').pop();
                                var sharp = require('sharp');
                                var image = sharp(uploadPath+'original_'+fileName);
                                image
                                    .metadata()
                                    .then(function(metadata) {
                                        if(metadata.height >= 512 && metadata.width >= 512){
                                            generalLib.resizeImage(extension, uploadPath+'original_'+fileName, uploadPath, timestamp,function(clb) {
                                                if(!clb){
                                                    res.json({responseCode: 500, responseMsg: 'There is some error to upload image.'});
                                                    return false;
                                                } else {
                                                    var profilePics = {
                                                        original: {
                                                            large: [],
                                                            medium: [],
                                                            thumb: []
                                                        },
                                                        blur: {
                                                            large: [],
                                                            medium: [],
                                                            thumb: []
                                                        }
                                                    };

                                                    // condition for no profilePics found in user collection
                                                    if (!result || result.profilePics.original.large.length <=0) {
                                                        // push new profile pic
                                                        profilePics.original.large.push(req.protocol + "://" + config.host + ':' +config.port+'/' + uploadPath+timestamp + '.' + extension);
                                                        profilePics.original.medium.push(req.protocol + "://" + config.host + ':' +config.port+'/' + uploadPath+'medium_'+timestamp + '.' + extension);
                                                        profilePics.original.thumb.push(req.protocol + "://" + config.host + ':' +config.port+'/' + uploadPath+'thumb_'+timestamp + '.' + extension);

                                                        profilePics.blur.large.push(req.protocol + "://" + config.host + ':' +config.port+'/' + uploadPath+'blur_'+timestamp + '.' + extension);
                                                        profilePics.blur.medium.push(req.protocol + "://" + config.host + ':' +config.port+'/' + uploadPath+'blur_medium_'+timestamp + '.' + extension);
                                                        profilePics.blur.thumb.push(req.protocol + "://" + config.host + ':' +config.port+'/' + uploadPath+'blur_thumb_'+timestamp + '.' + extension);
                                                    } else {
                                                        // push new profile pic
                                                        profilePics.original.large.push(req.protocol + "://" + config.host + ':' +config.port+'/' + uploadPath+timestamp + '.' + extension);
                                                        profilePics.original.medium.push(req.protocol + "://" + config.host + ':' +config.port+'/' + uploadPath+'medium_'+timestamp + '.' + extension);
                                                        profilePics.original.thumb.push(req.protocol + "://" + config.host + ':' +config.port+'/' + uploadPath+'thumb_'+timestamp + '.' + extension);

                                                        profilePics.blur.large.push(req.protocol + "://" + config.host + ':' +config.port+'/' + uploadPath+'blur_'+timestamp + '.' + extension);
                                                        profilePics.blur.medium.push(req.protocol + "://" + config.host + ':' +config.port+'/' + uploadPath+'blur_medium_'+timestamp + '.' + extension);
                                                        profilePics.blur.thumb.push(req.protocol + "://" + config.host + ':' +config.port+'/' + uploadPath+'blur_thumb_'+timestamp + '.' + extension);

                                                        // push old profile pics data in profilePics object
                                                        var imgArr = ['large','medium','thumb'];
                                                        var len = imgArr.length;
                                                        for (a = 0; a < len; a++) {
                                                            for (x in result.profilePics.original[imgArr[a]]) {
                                                                profilePics.original[imgArr[a]].push(result.profilePics.original[imgArr[a]][x]);
                                                            }
                                                        }

                                                        var blurImgArr = ['large','medium','thumb'];
                                                        var len = blurImgArr.length;
                                                        for (b = 0; b < len; b++) {
                                                            for (y in result.profilePics.blur[blurImgArr[b]]) {
                                                                profilePics.blur[blurImgArr[b]].push(result.profilePics.blur[blurImgArr[b]][y]);
                                                            }
                                                        }
                                                    }
                                                    data.profilePics = profilePics;
                                                    // update profile pics
                                                    db.updateUser('user', {_id: new ObjectID(data._id)}, data, function(updateUser){
                                                        if(!updateUser) {
                                                            res.json({responseCode: 500, responseMsg: 'There is some error to update data.'});
                                                            return false;
                                                        } else {
                                                            getUser();
                                                        }
                                                    });
                                                }
                                            });
                                        } else {
                                            // function to remove Image
                                            generalLib.removeImage(uploadPath+ 'original_'+ timestamp + '.' + extension,res);
                                            getUser();
                                        }
                                    });
                            });
                        } else {
                            getUser();
                        }

                        // get updated user info and send response
                        function getUser(){
                            db.get('user', {_id: new ObjectID(data._id)}, function (user) {
                                if (!user) {
                                    res.json({responseCode: 500, responseMsg: 'There is some error to get data.'});
                                    return false;
                                } else{
                                    output.responseCode = 200;
                                    output.responseMsg = "Login successful";

                                    delete user.lastLoginIP;
                                    delete user.createdOn;
                                    delete user.updatedOn;

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
};