/**
 * Created by INFYZO\saunak.shah on 22/8/16.
 */

module.exports = (function () {

    return {
        // function to upload file(image,audio)
        uploadFile: function (req, res, uploadPath, timestamp, callback) {
            var fs = require('fs');
            var extension = req.file.originalname.split('.').pop();

            if (!fs.existsSync(uploadPath)) {
                fs.mkdirSync(uploadPath);
            }

            if (req.url == '/user/profilePic' || req.url == '/signUp') {
                var newPath = uploadPath + 'original_' + timestamp + '.' + extension;
            } else {
                var newPath = uploadPath + timestamp + '.' + extension;
            }

            fs.writeFile(newPath, req.file.buffer, function (err) {
                if (err) {
                    callback(false);
                    return res.end('Error uploading file.');
                } else {
                    callback(newPath);
                }
            });
        },

        removeImage: function (path, res) {
            var fs = require('fs');
            fs.exists(path, function (exists) {
                if (!exists) {
                    // 404 missing files
                    res.json({responseCode: 500, responseMsg: '404 Not Found.'});
                    return false;
                } else {
                    fs.unlink(path, function (err) {
                        if (err) {
                            res.json({responseCode: 0, responseMsg: 'profilePic not uploaded.'});
                            return false;
                        }
                    });
                }
            });
        },

        resizeImage: function (ext, path, uploadPath, timestamp, clb) {
            var that = this;
            var sharp = require('sharp');
            sharp(path)
                .resize(512, 512)
                .toFile(uploadPath + '' + timestamp + '.' + ext, function (err) {
                    if (err) {
                        return false;
                    } else {
                        sharp(path)
                            .resize(214, 214)
                            .toFile(uploadPath + 'medium_' + timestamp + '.' + ext, function (err) {
                                if (err) {
                                    return false;
                                } else {
                                    sharp(path)
                                        .resize(85, 85)
                                        .toFile(uploadPath + 'thumb_' + timestamp + '.' + ext, function (err) {
                                            if (err) {
                                                return false;
                                            } else {
                                                // Blur Image upload
                                                that.blurImage(ext, path, uploadPath, timestamp, 10, function (result) {
                                                    if (!result) {
                                                        res.json({
                                                            responseCode: 0,
                                                            responseMsg: 'There is some issue to upload blur image.'
                                                        });
                                                        return false;
                                                    } else {
                                                        clb(true);
                                                    }
                                                });
                                            }
                                        });
                                }
                            });
                    }
                });
        },

        blurImage: function (ext, path, uploadPath, timestamp, num, clb) {
            var sharp = require('sharp');
            sharp(path)
                .resize(512, 512)
                .blur(num)
                .toFile(uploadPath + 'blur_' + '' + timestamp + '.' + ext, function (err) {
                    if (err) {
                        return false;
                    } else {
                        sharp(path)
                            .resize(214, 214)
                            .blur(num)
                            .toFile(uploadPath + 'blur_' + 'medium_' + timestamp + '.' + ext, function (err) {
                                if (err) {
                                    return false;
                                } else {
                                    sharp(path)
                                        .resize(85, 85)
                                        .blur(num)
                                        .toFile(uploadPath + 'blur_' + 'thumb_' + timestamp + '.' + ext, function (err) {
                                            if (err) {
                                                return false;
                                            } else {
                                                var fs = require('fs');
                                                // remove original image
                                                fs.unlink(uploadPath + 'original_' + timestamp + '.' + ext, function (err) {
                                                    if (err)
                                                        res.json({
                                                            responseCode: 0,
                                                            responseMsg: 'profilePic not uploaded.'
                                                        });
                                                    else {
                                                        return clb(true);
                                                    }
                                                });
                                            }
                                        });
                                }
                            });
                    }
                });
        },

        // function to create otp
        randomOtp: function (clb) {
            var crypto = require('crypto');
            crypto.randomBytes(3, function (err, buffer) {
                if (err) {
                    return console.log(err);
                } else {
                    var otp = parseInt(buffer.toString('hex'), 16).toString().substr(0, 6);
                    return clb(otp);
                }
            });
        },

        // function to encrypt password
        encyPasscode: function (data) {
            var crypto = require('crypto');
            data = crypto
                .createHash("sha256")
                .update(data)
                .digest('hex');
            return data;
        },

        // function to send email for verification
        sendMail: function (userEmail, otp, req, emailSubject, emailTemplate, callback) {
            var nodemailer = require('nodemailer');
            var config = require("./../../app/config");

            // create reusable transporter object using the default SMTP transport
            var transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: config.emailConfig.smtpEmail,
                    pass: config.emailConfig.smtpPassword
                }
            });

            // setup e-mail data with unicode symbols
            var mailOptions = {
                from: '"Lovecoy " <test.infyzo@gmail.com>',
                to: '' + userEmail + ' , ' + config.emailConfig.smtpEmail + '', // list of receivers
                subject: emailSubject, // Subject line
                html: emailTemplate // html body
            };

            // send mail with defined transport object
            transporter.sendMail(mailOptions, function (error, info) {
                if (!info) {
                    return callback(false);
                } else {
                    /*console.log('Message sent: ' + info.response);*/
                    return callback(true);
                }
            });
        },

        //check value is in array Option or not
        inArray: function (needle, haystack) {
            var count = haystack.length;
            for (var i = 0; i < count; i++) {
                if (haystack[i] === needle) {
                    return true;
                }
            }
            return false;
        },
        //find intersect values
        intersect: function (a, b) {
            var t;
            if (b.length > a.length) t = b, b = a, a = t; // indexOf to loop over shorter
            return a.filter(function (e) {
                if (b.indexOf(e) !== -1) return true;
            });
        },

        percent: function (point, total, val) {
            var findPercent = (((100 * point) / total) * val) / 100;
            return parseFloat(findPercent.toFixed(2));
        },

        distance: function (lon1, lat1, lon2, lat2, unit) {
            var radlat1 = Math.PI * lat1 / 180
            var radlat2 = Math.PI * lat2 / 180
            var theta = lon1 - lon2
            var radtheta = Math.PI * theta / 180
            var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
            dist = Math.acos(dist)
            dist = dist * 180 / Math.PI
            dist = dist * 60 * 1.1515
            if (unit == 'K') {
                dist = dist * 1.609344
            }
            if (unit == 'N') {
                dist = dist * 0.8684
            }
            return parseFloat(dist.toFixed(2));
        },

        setOrientationData: function (obj) {
            var interestedIn = [];
            for (var x in obj) {
                var opt = [];
                for (var y in obj[x]) {
                    opt.push({
                        label: obj[x][y],
                        name: obj[x][y],
                        type: 'checkbox',
                        value: false
                    });
                }

                interestedIn.push({
                    label: x,
                    name: x,
                    value: false,
                    type: 'switch',
                    options: opt
                });
            }

            return interestedIn;
        },

        getProfile: function (obj, user, subType) {

            var glb = {
                appearance: [],
                lifestyle: [],
                interest: []
            };

            // default options
            for (x in obj) {

                var opt = [];
                // options for appearance object
                if (obj[x].key == 'bodyType' || obj[x].key == 'complexion' || obj[x].key == 'eyeColor'
                    || obj[x].key == 'hairColor') {

                    type = 'dropdown';
                    arrKey = 'appearance';

                    if (obj[x].key == 'bodyType') {
                        // To push height and weight object to appearance
                        var appeArr = ['height', 'weight'];
                        for (a in appeArr) {
                            glb[arrKey].push({
                                label: appeArr[a],
                                name: appeArr[a],
                                value: (user.preference && user.preference.appearance && user.preference.appearance[appeArr[a]]) ? user.preference.appearance[appeArr[a]] : 0,
                                type: 'seekbar',
                                options: ''
                            });
                        }
                        // To push physicallyChallenged to appearance object
                        glb[arrKey].push({
                            label: 'physicallyChallenged',
                            name: 'physicallyChallenged',
                            value: (user.preference && user.preference.appearance
                            && user.preference.appearance['physicallyChallenged'])
                                ? user.preference.appearance['physicallyChallenged'] : false,
                            type: 'switch',
                            options: ''
                        });
                    }

                    // To push object in options array
                    for (var y in obj[x].value) {
                        opt.push({
                            label: obj[x].value[y],
                            name: obj[x].value[y],
                            type: type,
                            value: (user.preference && user.preference.appearance
                            && user.preference.appearance[obj[x].key] == obj[x].value[y]) ? true : false
                        });
                    }
                }

                // options for lifestyle object
                if (obj[x].key == 'smoking' || obj[x].key == 'drinking' || obj[x].key == 'diet'
                    || obj[x].key == 'living') {

                    type = 'radio';
                    arrKey = 'lifestyle';

                    // To push object in options array
                    for (var y in obj[x].value) {
                        opt.push({
                            label: obj[x].value[y],
                            name: obj[x].value[y],
                            type: type,
                            value: (user.preference && user.preference.lifestyle
                            && user.preference.lifestyle[obj[x].key] == obj[x].value[y]) ? true : false
                        });
                    }
                }

                // options for interest object
                if (obj[x].key == 'interest') {

                    type = 'switch';
                    arrKey = 'interest';

                    // To push object in options array
                    for (var y in obj[x].value) {
                        opt.push({
                            label: y,
                            name: y,
                            type: type,
                            value: (user.preference
                            && user.preference.interest && user.preference.interest[y] !== undefined)
                                ? user.preference.interest[y] : obj[x].value[y]
                        });
                    }
                }

                glb[arrKey].push({
                    label: obj[x].key,
                    name: obj[x].key,
                    value: false,
                    type: type,
                    options: opt
                });
            }

            return glb[subType];
        },

        getSettings: function (obj, user, subType) {
            var glb = {};
            glb[subType] = [];
            //Obj loop start
            for (var x in obj) {
                var opt = [];

                switch (subType) {
                    case 'appearance' :
                    case 'lifestyle' :
                        type = 'multiSelect';
                        query = (user.partner && user.partner[subType] && user.partner[subType][obj[x].key] !== undefined) ? user.partner[subType][obj[x].key] : [];
                        break;

                    case 'interest' :
                        type = 'multiSwitch';
                        query = '';
                        opt = (user.partner && user.partner.interest) ? user.partner.interest : false;
                        break;

                    case 'familyInfo' :
                        type = 'multiSelect';
                        if (obj[x].key == 'familyStatus' || obj[x].key == 'familyType' || obj[x].key == 'familyValues')
                            query = (user.partner && user.partner.familyDetail && user.partner.familyDetail[obj[x].key] !== undefined) ? user.partner.familyDetail[obj[x].key] : [];
                        else
                            query = (user.filters && user.filters[obj[x].key] !== undefined) ? user.filters[obj[x].key] : [];
                        break;

                    case 'horoscope' :
                        type = 'multiSelect';
                        query = (user.partner && user.partner[obj[x].key] !== undefined) ? user.partner[obj[x].key] : [];
                        break;

                    case 'partnerPersonalInfo' :
                        type = (obj[x].key == 'maritalStatus' || obj[x].key == 'gender') ? 'multiSwitch' : 'multiSelect';
                        if (obj[x].key == 'languages')
                            query = (user.partner && user.partner.motherTongue !== undefined) ? user.partner.motherTongue : [];
                        else if (obj[x].key == 'bloodGroup')
                            query = (user.partner && user.partner[obj[x].key] !== undefined) ? user.partner[obj[x].key] : [];
                        else
                            query = (user.filters && user.filters[obj[x].key] !== undefined) ? user.filters[obj[x].key] : [];
                        break;

                    case 'educationAndProfessionalDetails' :
                        type = 'multiSelect';
                        if (obj[x].key != "educationQualification")
                            query = (user.partner && user.partner.professional && user.partner.professional[obj[x].key] !== undefined) ? user.partner.professional[obj[x].key] : [];
                        else
                            query = (user.partner && user.partner[obj[x].key] !== undefined) ? user.partner[obj[x].key] : [];
                        break;

                    default :
                        break
                }

                //All object Keys value insertion
                if (obj[x].key !== 'interest') {
                    for (y in obj[x].value) {
                        opt.push({
                            label: obj[x].value[y],
                            name: obj[x].value[y],
                            type: type,
                            value: (query.indexOf(obj[x].value[y]) >= 0) ? true : false
                        });
                    }
                }

                if (obj[x].key) {
                    obj[x].key = (obj[x].key == 'languages') ? 'motherTongue' : obj[x].key
                    glb[subType].push({
                        label: obj[x].key,
                        name: obj[x].key,
                        value: query,
                        type: type,
                        options: opt
                    });
                }
            }
            //Obj loop over

            //Other keys will be added as per need
            switch (subType) {
                case 'appearance':
                    var appeArr = ['height', 'weight'];
                    for (var z in appeArr) {
                        glb[subType].push({
                            label: appeArr[z],
                            name: appeArr[z],
                            value: (user.partner && user.partner.appearance && user.partner.appearance[appeArr[z]]) ? user.partner.appearance[appeArr[z]] : [],
                            type: 'rangeBar',
                            options: ''
                        });
                    }
                    glb[subType].push({
                        label: 'physicallyChallenged',
                        name: 'physicallyChallenged',
                        value: (user.partner.appearance.physicallyChallenged) ? user.partner.appearance.physicallyChallenged : false,
                        type: 'switch',
                        options: ''
                    });
                    break;

                case 'familyInfo':
                    glb[subType].push({
                        label: 'native',
                        name: 'native',
                        value: (user.filters.native) ? user.filters.native : [],
                        type: 'multiSelect',
                        options: ''
                    });
                    break;

                case 'horoscope':
                    glb[subType].push({
                        label: 'kundliUpload',
                        name: 'kundliUpload',
                        value: (user.partner.horoscope.kundliUpload) ? user.partner.horoscope.kundliUpload : false,
                        type: 'switch',
                        options: ''
                    });
                    break;

                case 'partnerPersonalInfo':
                    var generalArr = ['divorceCertificate', 'age', 'distance'];
                    for (var y in generalArr) {
                        //Assign type of generalArr
                        if (generalArr[y] == 'divorceCertificate')
                            type = 'switch';
                        if (generalArr[y] == 'age')
                            type = 'rangeBar';
                        if (generalArr[y] == 'distance')
                            type = 'seekBar';
                        query = (generalArr[y] == 'divorceCertificate') ? user.partner[generalArr[y]] : user.filters[generalArr[y]];
                        glb[subType].push({
                            label: generalArr[y],
                            name: generalArr[y],
                            value: (query) ? query : false,
                            type: type,
                            options: ''
                        });
                    }
                    glb[subType].push({
                        label: 'hasChild',
                        name: 'hasChild',
                        value: (user.filters && user.filters['hasChild'] !== undefined) ? user.filters['hasChild'] : false,
                        type: 'switch',
                        options: ''
                    });
                    glb[subType].push({
                        label: 'noOfChildren',
                        name: 'noOfChildren',
                        value: (user.filters && user.filters['noOfChildren']) ? user.filters['noOfChildren'] : 0,
                        type: 'number',
                        options: ''
                    });
                    glb[subType].push({
                        label: 'preferredCity',
                        name: 'preferredCity',
                        value: (user.filters.preferredCity !== undefined) ? user.filters.preferredCity : '',
                        type: 'dropdown',
                        options: ''
                    });
                    break;

                case 'educationAndProfessionalDetails':
                    var generalArr = ['uploadCV', 'experience', 'salary'];
                    for (var y in generalArr) {
                        //Assign type of generalArr
                        type = (generalArr[y] == 'uploadCV') ? 'switch' : 'rangeBar';
                        query = user.partner.professional[generalArr[y]];
                        glb[subType].push({
                            label: generalArr[y],
                            name: generalArr[y],
                            value: (query) ? query : false,
                            type: type,
                            options: ''
                        });
                    }
                    break;

                default:
                    break;

            }

            return glb[subType];
        },
        // Convert bytes to KB or MB or GB
        formatBytes: function formatBytes(bytes, decimals) {
            if (bytes == 0) return '0 Byte';
            var k = 1000;
            var dm = decimals + 1 || 3;
            var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
            var i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
        },
        // checkPrivacy two Objects
        checkPrivacy: function (viewObject, key, parentPrivacyKey, parentObjectkey, outerParentObjectkey) {
            if (outerParentObjectkey != '')
                return (viewObject.privacySettings[parentPrivacyKey][key] == false) ? '*****' : viewObject[outerParentObjectkey][parentObjectkey][key];
            else if (parentPrivacyKey != '' && parentObjectkey != '')
                return (viewObject.privacySettings[parentPrivacyKey][key] == false) ? '*****' : viewObject[parentObjectkey][key];
            else if (parentPrivacyKey != '')
                return (viewObject.privacySettings[parentPrivacyKey][key] == false) ? '*****' : viewObject[key];
            else if (parentObjectkey != '')
                return (viewObject.privacySettings[key] == false) ? '*****' : viewObject[parentObjectkey][key];
            else
                return (viewObject.privacySettings[key] == false) ? '*****' : viewObject[key];
        },
        //DateOMeter Logic
        dateOMeter: function (to, from, connectionStatus) {
            var db = require('./../../app/db');
            switch (connectionStatus) {

                case 'requested':
                    db.getAll('user', {_id: {$in: [to, from]}}, {
                        fname: 1,
                        _id: 1,
                        lname: 1,
                        'profilePics.self.original.thumb': 1
                    }, function (userDetails) {
                        if (!userDetails) {
                            console.log('There is some error to update data.');
                        } else {
                            for (var i in userDetails) {
                                var updateId = (userDetails[i]._id.toString() == from.toString()) ? to : from;
                                db.updateData('user', {_id: updateId}, {
                                    $addToSet: {
                                        "dateOMeter.1": {
                                            "_id": userDetails[i]._id,
                                            "fname": userDetails[i].fname,
                                            "lname": userDetails[i].lname,
                                            "thumb": userDetails[i].profilePics.self.original.thumb[0]
                                        }
                                    }
                                }, function (row) {
                                    // Any issue during update or insert query will return false
                                    if (!row.ok) {
                                        console.log('There is some error to update data.');
                                    }
                                });
                            }
                        }
                    });

                case 'connected':
                    db.getAll('user', {_id: {$in: [to, from]}}, {
                        fname: 1,
                        _id: 1,
                        lname: 1,
                        'profilePics.self.original.thumb': 1
                    }, function (userDetails) {
                        if (!userDetails) {
                            console.log('There is some error to update data.');
                        } else {
                            for (var i in userDetails) {
                                var updateId = (userDetails[i]._id.toString() == from.toString()) ? to : from;
                                db.updateData('user', {_id: updateId}, {
                                    $addToSet: {
                                        "dateOMeter.2": {
                                            "_id": userDetails[i]._id,
                                            "fname": userDetails[i].fname,
                                            "lname": userDetails[i].lname,
                                            "thumb": userDetails[i].profilePics.self.original.thumb[0]
                                        }
                                    },
                                    $pull: {
                                        "dateOMeter.1": {
                                            "_id": userDetails[i]._id,
                                            "fname": userDetails[i].fname,
                                            "lname": userDetails[i].lname,
                                            "thumb": userDetails[i].profilePics.self.original.thumb[0]
                                        }
                                    }
                                }, function (row) {
                                    // Any issue during update or insert query will return false
                                    if (!row.ok) {
                                        console.log('There is some error to update data.');
                                    }
                                });
                            }
                        }
                    });

                // Get all the profile related fields
                case 'gift':
                case 'instantSelfie':
                case 'like':
                case 'onlineDate':
                case 'ourWall':
                case 'firstDate':
                case 'bondry':
                case 'commited':

                    var where = {$and: [{to: from}, {'from.from': to}, {msgType: connectionStatus}]};
                    db.get('options', {key: "dateOMeter"}, function (options) {
                        if (!options) {
                            console.log('There is some error to update data.');
                        } else {
                            for (var key in options.values) {
                                if (options.values[key].toUpperCase() == connectionStatus.toUpperCase()) {
                                    var selectedKey = key;
                                    break;
                                }
                            }

                            db.get('chatMessages', where, function (chatPair) {
                                if (!chatPair) {
                                    console.log("not found");
                                } else {
                                    db.getAll('user', {_id: {$in: [to, from]}}, {
                                        fname: 1,
                                        _id: 1,
                                        lname: 1,
                                        'profilePics.self.original.thumb': 1
                                    }, function (userDetails) {
                                        if (!userDetails) {
                                            console.log('There is some error to update data.');
                                        } else {
                                            for (var i in userDetails) {
                                                var addToSet = {};
                                                addToSet["dateOMeter." + selectedKey] = {
                                                    "_id": userDetails[i]._id,
                                                    "fname": userDetails[i].fname,
                                                    "lname": userDetails[i].lname,
                                                    "thumb": userDetails[i].profilePics.self.original.thumb[0]
                                                };

                                                var pull = {};
                                                pull["dateOMeter." + (selectedKey - 1)] = {
                                                    "_id": userDetails[i]._id,
                                                    "fname": userDetails[i].fname,
                                                    "lname": userDetails[i].lname,
                                                    "thumb": userDetails[i].profilePics.self.original.thumb[0]
                                                };
                                                var updateId = (userDetails[i]._id.toString() == from.toString()) ? to : from;
                                                console.log({
                                                    $addToSet: addToSet,
                                                    $pull: pull
                                                });
                                                db.updateData('user', {_id: updateId}, {
                                                    $addToSet: addToSet,
                                                    $pull: pull
                                                }, function (row) {
                                                    // Any issue during update or insert query will return false
                                                    if (!row.ok) {
                                                        console.log('There is some error to update data.');
                                                    }
                                                });
                                            }
                                        }
                                    });
                                }
                            });
                        }
                    });
            }
        },

        STRData: function (userDetails, filteredUsers, selfOpenFor, subType) {
            var users = [];
            for (var i = 0 in filteredUsers) {
                var finalWeightage = 0;
                var chunk = 4;

                // Weightage of the first order by powering the chunk divided value with 2
                var weightage = Math.pow(2, selfOpenFor.length / chunk);

                // Get the partner user open for options
                var userOpenFor = filteredUsers[i].connections[subType]['openFor'];

                for (var j = 0; j < selfOpenFor.length; j++) {
                    var userIndex = userOpenFor.indexOf(selfOpenFor[j]);

                    // If we don't found the self index in partner than don't add a weightage to it
                    if (userIndex == -1) {
                        finalWeightage += 0;
                    }
                    // If self index is greater or equals to partner index
                    // since we have index in ascending order so we are assuming our logic like
                    // first come first calculated index so we add full weightage of self and partner
                    else if (j >= userIndex) {
                        finalWeightage += weightage + weightage;
                    }
                    // if self index is less than the partner index than
                    // we need to divide the weightage with pow of index difference.
                    else if (j < userIndex) {
                        var diff = userIndex - j;
                        finalWeightage += weightage + (weightage / Math.pow(2, diff));
                    }

                    // Decrese a chunk each time
                    chunk--;

                    // Since we have tile in group of 4 so as soon as our chunk become 0
                    // We made it again 4 and divide our weigtage with 2 for half.
                    if (chunk == 0) {
                        weightage = weightage / 2;
                        chunk = 4;
                    }
                }

                // Remove favourite from the connection object
                delete filteredUsers[i].connections.favourite;

                // Create a user array for output
                users[i] = {
                    _id: filteredUsers[i]._id,
                    fname: filteredUsers[i].fname,
                    lname: filteredUsers[i].lname,
                    age: filteredUsers[i].age.self,
                    city: filteredUsers[i].city.self,
                    thumbImage: (filteredUsers[i].profilePics[0].thumb !== undefined)
                        ? filteredUsers[i].profilePics[0].thumb : '',
                    profilePics: (filteredUsers[i].profilePics[0].large !== undefined)
                        ? filteredUsers[i].profilePics[0].large : '',
                    distance: this.distance(userDetails.location.self.coordinates[0],
                        userDetails.location.self.coordinates[1],
                        filteredUsers[i].location.self.coordinates[0],
                        filteredUsers[i].location.self.coordinates[1], 'K'),
                    industry: (filteredUsers[i].industry != undefined) ? filteredUsers[i].industry.self : '',
                    designation: (filteredUsers[i].designation != undefined) ? filteredUsers[i].designation.self : '',
                    tagLine: filteredUsers[i].tagLine,
                    category: Object.keys(filteredUsers[i].connections).map(function (data) {
                        return {category: data, status: filteredUsers[i].connections[data].status};
                    }),
                    isLock: (filteredUsers[i].subscription > userDetails.subscription) ? true : false,
                    subscription: filteredUsers[i].subscription,
                    weightage: finalWeightage
                };
            }

            return users;
        },

        LTRData: function (userDetails, filteredUsers) {
            var users = [];
            var ltrData={};
            var matchPreferences = ['knownLanguage', 'bloodGroup', 'sunSign', 'height',
                'weight', 'bodyType', 'complexion', 'eyeColor', 'hairColor', 'smoking',
                'drinking', 'diet', 'living', 'uploadCV', 'occupation', 'industry', 'salary',
                'educationQualification', 'degree', 'music', 'movie', 'books', 'tvShows', 'sports',
                'travel', 'Shopping', 'Cooking', 'Politics', 'Pets', 'Current Affairs',
                'kundli', 'passport', 'facebook', 'linkedIn', 'twitter', 'instagram'];

            // Loop through the all filtered users
            for (var i = 0 in filteredUsers) {
                // Initial weightage which later on will be calculated as a weightage
                var myWeightage = 0, iWeightage = 0, weWeightage = 0;

                // user preference than need to match
                var myPreference = 0, iPreference = 0, wePreference = 0;

                for (var j in matchPreferences) {
                    if (userDetails.hasOwnProperty(matchPreferences[j])) {
                        var val = false;
                        myPreference++;

                        if (filteredUsers[i].hasOwnProperty(matchPreferences[j])) {
                            if (filteredUsers[i][matchPreferences[j]]['self'] == 'Any'
                                || filteredUsers[i][matchPreferences[j]]['self'] == 'Irrelevant') {
                                myWeightage += 2;
                                ltrData[matchPreferences[j]] = val;
                            } else if (filteredUsers[i][matchPreferences[j]]['self']
                                == userDetails[matchPreferences[j]]['self']) {
                                myWeightage += 5;
                                var val = true;
                                ltrData[matchPreferences[j]] = val;
                            }
                        } else {
                            myWeightage += 1;
                            ltrData[matchPreferences[j]] = val;
                        }
                    }

                    if (filteredUsers[i].hasOwnProperty(matchPreferences[j])) {

                        iPreference++;

                        if (userDetails.hasOwnProperty(matchPreferences[j])) {

                            if (filteredUsers[i][matchPreferences[j]]['partner'].indexOf('Any') != -1
                                || filteredUsers[i][matchPreferences[j]]['partner'].indexOf('Irrelevant') != -1) {

                                iWeightage += 2;

                            } else if (filteredUsers[i][matchPreferences[j]]['partner']
                                    .indexOf(userDetails[matchPreferences[j]]['self']) != -1) {

                                iWeightage += 5;

                            }
                        } else {

                            iWeightage += 1;

                        }
                    }

                    if (userDetails.hasOwnProperty(matchPreferences[j])
                        && filteredUsers[i].hasOwnProperty(matchPreferences[j])) {

                        wePreference++;

                        if (filteredUsers[i][matchPreferences[j]]['partner'].indexOf('Any') != -1
                            || filteredUsers[i][matchPreferences[j]]['partner'].indexOf('Irrelevant') != -1) {

                            weWeightage += 2;

                        } else if (filteredUsers[i][matchPreferences[j]]['partner']
                                .indexOf(userDetails[matchPreferences[j]]['self']) != -1) {

                            weWeightage += 5;

                        }
                    }
                }

                var myMatchper = (100 * myWeightage) / (myPreference * 5);
                var iMatchper = (100 * iWeightage) / (iPreference * 5);
                var weMatchper = (100 * weWeightage) / (wePreference * 5);

                // Create a user array for output
                users[i] = {
                    _id: filteredUsers[i]._id,
                    fname: filteredUsers[i].fname,
                    lname: filteredUsers[i].lname,
                    age: filteredUsers[i].age.self,
                    city: filteredUsers[i].city.self,
                    thumbImage: (filteredUsers[i].profilePics[0].thumb !== undefined)
                        ? filteredUsers[i].profilePics[0].thumb : '',
                    profilePics: (filteredUsers[i].profilePics[0].large !== undefined)
                        ? filteredUsers[i].profilePics[0].large : '',
                    distance: this.distance(userDetails.location.self.coordinates[0],
                        userDetails.location.self.coordinates[1],
                        filteredUsers[i].location.self.coordinates[0],
                        filteredUsers[i].location.self.coordinates[1], 'K'),
                    industry: (filteredUsers[i].industry != undefined) ? filteredUsers[i].industry.self : '',
                    designation: (filteredUsers[i].designation != undefined) ? filteredUsers[i].designation.self : '',
                    tagLine: filteredUsers[i].tagLine,
                    category: Object.keys(filteredUsers[i].connections).map(function (data) {
                        return {category: data, status: filteredUsers[i].connections[data].status};
                    }),
                    isLock: (filteredUsers[i].subscription > userDetails.subscription) ? true : false,
                    subscription: filteredUsers[i].subscription,
                    myWeightage: myMatchper,
                    iWeightage: iMatchper,
                    weWeightage: weMatchper,
                    ltrData:ltrData
                };
            }

            return users;
        }
    }
})();
