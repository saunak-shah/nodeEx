/**
 * Created by INFYZO\rachana.thakkar on 20/8/16.
 */
var db = require('./../../app/db'),
    ObjectID = require('mongodb').ObjectID,
    generalLib = require('./generalLib');

module.exports = function (req, res) {
    var output = {};
    var updateData = {};
    var data = req.body.data;

    if (req.files) {
        var data = JSON.parse(data);
    }

    // If uuid is empty
    if (!data.uuid) {
        res.json({responseCode: 0, responseMsg: 'Device not recognized.'});
        return false;
    }

    // if user Id is empty
    if (!data.uid) {
        res.json({responseCode: 0, responseMsg: 'User Id should not be empty.'});
        return false;
    }

    // if type is empty
    if (!data.type) {
        res.json({responseCode: 0, responseMsg: 'type is not defined.'});
        return false;
    }

    var where = {_id: new ObjectID(data.uid)};
    var table = 'user';

    switch (data.type) {
        // Get all the profile related fields
        case 'orientation':
            var keys = [];
            data.subType = "Interested In";
            var interestedInPreference = data.interestedIn;
            for (x in data.interestedIn) {
                keys.push(x);
            }

            updateData = {
                interestedIn: keys,
                'preference.interestedIn': interestedInPreference,
                isOrientation:false
            };
            break;
        case 'privacySettings':
            if ('privacySettings' in data) {
                var updateprivacySettings = data.privacySettings;
            }
            if (data.to) {
                var table = 'privacySettings';
                where.from = new ObjectID(data.uid);
                where.to = new ObjectID(data.to);
                delete where._id;
            } else {
                var table = 'user';
            }
            switch (data.subType) {
                case "personalInfo":
                    updateData = {
                        'privacySettings.isMyPhotoBlur': updateprivacySettings.personalInfo.isMyPhotoBlur,
                        'privacySettings.hasChild': updateprivacySettings.personalInfo.hasChild,
                        'privacySettings.noOfChildren': updateprivacySettings.personalInfo.noOfChildren,
                        'privacySettings.healthInfo': updateprivacySettings.personalInfo.healthInfo,
                        'privacySettings.bloodGroup': updateprivacySettings.personalInfo.bloodGroup,
                        'privacySettings.motherTongue': updateprivacySettings.personalInfo.motherTongue,
                        'privacySettings.knownLanguage': updateprivacySettings.personalInfo.knownLanguage
                    };
                    break;
                case "familyInfo":
                    updateData = {
                        'privacySettings.religion': updateprivacySettings.familyInfo.religion,
                        'privacySettings.cast': updateprivacySettings.familyInfo.cast,
                        'privacySettings.native': updateprivacySettings.familyInfo.native,
                        'privacySettings.familyInfo.parentsContactNo': updateprivacySettings.familyInfo.parentsContactNo,
                        'privacySettings.familyInfo.fathersOccupation': updateprivacySettings.familyInfo.fathersOccupation,
                        'privacySettings.familyInfo.fathersCompanyName': updateprivacySettings.familyInfo.fathersCompanyName,
                        'privacySettings.familyInfo.fathersDesignation': updateprivacySettings.familyInfo.fathersDesignation,

                        'privacySettings.familyInfo.mothersOccupation': updateprivacySettings.familyInfo.mothersOccupation,
                        'privacySettings.familyInfo.mothersCompanyName': updateprivacySettings.familyInfo.mothersCompanyName,
                        'privacySettings.familyInfo.motherDesignation': updateprivacySettings.familyInfo.motherDesignation,

                        'privacySettings.familyInfo.noOfBrothers': updateprivacySettings.familyInfo.noOfBrothers,
                        'privacySettings.familyInfo.noOfMarriedBrothers': updateprivacySettings.familyInfo.noOfMarriedBrothers,
                        'privacySettings.familyInfo.noOfSisters': updateprivacySettings.familyInfo.noOfSisters,
                        'privacySettings.familyInfo.noOfMarriedSisters': updateprivacySettings.familyInfo.noOfMarriedSisters,
                        'privacySettings.familyInfo.state': updateprivacySettings.familyInfo.state,
                        'privacySettings.familyInfo.city': updateprivacySettings.familyInfo.city,

                        'privacySettings.familyDetail.familyStatus': updateprivacySettings.familyInfo.familyStatus,
                        'privacySettings.familyDetail.familyType': updateprivacySettings.familyInfo.familyType,
                        'privacySettings.familyDetail.familyValues': updateprivacySettings.familyInfo.familyValues
                    };
                    break;
                case "educationDetails":
                    updateData = {
                        'privacySettings.educationQualification': updateprivacySettings.educationDetails.educationQualification,
                        'privacySettings.education.degree': updateprivacySettings.educationDetails.degree,
                        'privacySettings.educationInstitute': updateprivacySettings.educationDetails.educationInstitute,
                        'privacySettings.schoolBoard': updateprivacySettings.educationDetails.schoolBoard
                    };
                    break;
                case 'professionalDetails':
                    var companyName = updateprivacySettings.professionalDetails.companyName;
                    delete updateprivacySettings.professionalDetails.companyName;
                    updateData = {
                        'privacySettings.companyName': companyName,
                        'privacySettings.professional': updateprivacySettings.professionalDetails
                    };
                    break;
                case 'contactDetails':
                    updateData = {
                        'privacySettings.email': updateprivacySettings.contactDetails.email,
                        'privacySettings.mobile': updateprivacySettings.contactDetails.mobile,
                        'privacySettings.currentAddress': updateprivacySettings.contactDetails.currentAddress,
                        'privacySettings.permanentAddress': updateprivacySettings.contactDetails.permanentAddress
                    };
                    break;
                case 'appearance':
                    updateData = {
                        'privacySettings.appearance': updateprivacySettings.appearance
                    };
                    break;
                case 'lifestyle':
                    updateData = {
                        'privacySettings.lifestyle': updateprivacySettings.lifestyle
                    };
                    break;
                case 'horoscopeDetails':
                    updateData = {
                        'privacySettings.sign': updateprivacySettings.horoscopeDetails.sign,
                        'privacySettings.horoscopeDetail.birthTime': updateprivacySettings.horoscopeDetails.birthTime,
                        'privacySettings.horoscopeDetail.placeOfBirth.country': updateprivacySettings.horoscopeDetails.country,
                        'privacySettings.horoscopeDetail.placeOfBirth.state': updateprivacySettings.horoscopeDetails.state,
                        'privacySettings.horoscopeDetail.placeOfBirth.city': updateprivacySettings.horoscopeDetails.city
                    };
                    break;
                case "social":
                    updateData = {
                        'privacySettings.facebook': updateprivacySettings.social.facebook,
                        'privacySettings.twitter': updateprivacySettings.social.twitter,
                        'privacySettings.linkedIn': updateprivacySettings.social.linkedIn,
                        'privacySettings.instagram': updateprivacySettings.social.instagram
                    };
                    break;
                default :
                    res.json({responseCode: 0, responseMsg: 'Invalid subtype.'});
            }
            break;
        case 'profile':
            if ('preference' in data) {
                var updatePreference = data.preference;
            }

            switch (data.subType) {
                case "personalInfo":
                    if (req.files) {
                        // function to check if path not exists create directory
                        function makeDir(path) {
                            if (!fs.existsSync(path)) {
                                fs.mkdirSync(path);
                            }
                        }

                        // check key is available in object
                        if ('divorceCertificate' in req.files) {
                            var fileOpt = req.files.divorceCertificate[0];
                        }

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
                                    updateData =
                                    {
                                        $set: {
                                            maritalStatus: updatePreference.personalInfo.maritalStatus,
                                            hasChild: updatePreference.personalInfo.hasChild,
                                            noOfChildren: updatePreference.personalInfo.noOfChildren,
                                            healthInfo: updatePreference.personalInfo.healthInfo,
                                            aboutMe: updatePreference.personalInfo.aboutMe,
                                            knownLanguage: updatePreference.personalInfo.knownLanguage,
                                            'preference.bloodGroup': updatePreference.personalInfo.bloodGroup,
                                            'preference.divorceCertificate': fileOpt.fieldname + '.' + extension,
                                            'preference.motherTongue': updatePreference.personalInfo.motherTongue
                                        }
                                    };

                                    db.saveUser(table, where, updateData, function (row) {
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
                        updateData = {
                            maritalStatus: updatePreference.personalInfo.maritalStatus,
                            hasChild: updatePreference.personalInfo.hasChild,
                            noOfChildren: updatePreference.personalInfo.noOfChildren,
                            healthInfo: updatePreference.personalInfo.healthInfo,
                            aboutMe: updatePreference.personalInfo.aboutMe,
                            knownLanguage: updatePreference.personalInfo.knownLanguage,
                            'preference.bloodGroup': updatePreference.personalInfo.bloodGroup,
                            'preference.motherTongue': updatePreference.personalInfo.motherTongue
                        };
                    }
                    break;
                case "familyInfo":
                    updateData = {
                        religion: updatePreference.familyInfo.religion,
                        cast: updatePreference.familyInfo.cast,
                        native: updatePreference.familyInfo.native,
                        'familyInfo.parentsContactNo': updatePreference.familyInfo.parentsContactNo,
                        'familyInfo.fathersOccupation': updatePreference.familyInfo.fathersOccupation,
                        'familyInfo.fathersCompanyName': updatePreference.familyInfo.fathersCompanyName,
                        'familyInfo.fathersDesignation': updatePreference.familyInfo.fathersDesignation,
                        'familyInfo.mothersOccupation': updatePreference.familyInfo.mothersOccupation,
                        'familyInfo.mothersCompanyName': updatePreference.familyInfo.mothersCompanyName,
                        'familyInfo.motherDesignation': updatePreference.familyInfo.motherDesignation,
                        'familyInfo.noOfBrothers': updatePreference.familyInfo.noOfBrothers,
                        'familyInfo.noOfMarriedBrothers': updatePreference.familyInfo.noOfMarriedBrothers,
                        'familyInfo.noOfSisters': updatePreference.familyInfo.noOfSisters,
                        'familyInfo.noOfMarriedSisters': updatePreference.familyInfo.noOfMarriedSisters,
                        'familyInfo.state': updatePreference.familyInfo.state,
                        'familyInfo.city': updatePreference.familyInfo.city,
                        'preference.familyDetail.familyStatus': updatePreference.familyInfo.familyStatus,
                        'preference.familyDetail.familyType': updatePreference.familyInfo.familyType,
                        'preference.familyDetail.familyValues': updatePreference.familyInfo.familyValues
                    };
                    break;
                case "appearance":
                    updateData = {
                        'preference.appearance': updatePreference.appearance
                    };

                    break;
                case "lifestyle":
                    updateData = {
                        'preference.lifestyle': updatePreference.lifestyle
                    };
                    break;
                case "interest":
                    updateData = {
                        'preference.interest': updatePreference.interest
                    };
                    break;
                case "educationDetails":
                    updateData = {
                        schoolBoard: updatePreference.educationDetails.schoolBoard,
                        educationInstitute: updatePreference.educationDetails.educationInstitute,
                        'education.degree': updatePreference.educationDetails.degree,
                        'preference.educationQualification': updatePreference.educationDetails.educationQualification
                    };
                    break;
                case "professionalDetails":

                    if (req.files) {
                        // function to check if path not exists create directory
                        function makeDir(path) {
                            if (!fs.existsSync(path)) {
                                fs.mkdirSync(path);
                            }
                        }

                        // check key is available in object
                        if ('uploadCV' in req.files) {
                            var fileOpt = req.files.uploadCV[0];
                        }

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
                                    updateData = {
                                        $set: {
                                            companyName: updatePreference.professionalDetails.companyName,
                                            'preference.professional.occupation': updatePreference.professionalDetails.occupation,
                                            'preference.professional.industry': updatePreference.professionalDetails.industry,
                                            'preference.professional.designation': updatePreference.professionalDetails.designation,
                                            'preference.professional.experience': updatePreference.professionalDetails.experience,
                                            'preference.professional.uploadCV': fileOpt.fieldname + '.' + extension,
                                            'preference.professional.salary': updatePreference.professionalDetails.salary
                                        }
                                    };

                                    db.saveUser(table, where, updateData, function (row) {
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
                        var companyName = updatePreference.professionalDetails.companyName;
                        delete updatePreference.professionalDetails.companyName;
                        updateData = {
                            companyName: companyName,
                            'preference.professional': updatePreference.professionalDetails
                        };
                    }
                    break;
                case "contactDetails":
                    updateData = {
                        email: updatePreference.contactDetails.email,
                        mobile: updatePreference.contactDetails.mobile,
                        currentAddress: updatePreference.contactDetails.currentAddress,
                        permanentAddress: updatePreference.contactDetails.permanentAddress
                    };
                    break;
                case "badges":
                    if (req.files) {
                        // function to check if path not exists create directory
                        function makeDir(path) {
                            if (!fs.existsSync(path)) {
                                fs.mkdirSync(path);
                            }
                        }

                        // check key is available in object
                        if ('passport' in req.files) {
                            var fileOpt = req.files.passport[0];
                        } else if ('drivingLicence' in req.files) {
                            var fileOpt = req.files.drivingLicence[0];
                        } else if ('panCard' in req.files) {
                            var fileOpt = req.files.panCard[0];
                        } else if ('adharCard' in req.files) {
                            var fileOpt = req.files.adharCard[0];
                        }

                        // type1 to check image type
                        var type1 = fileOpt.mimetype.split('/');
                        // type2 to check pdf
                        var type2 = fileOpt.mimetype.split('/').pop();
                        if (type1[0] == 'image' || type2 == 'pdf') {
                            var fs = require('fs');
                            var path = 'uploads/profile/' + data.uid + '/';
                            // check if uid not exists make directory for uid
                            makeDir(path);

                            var uploadPath = 'uploads/profile/' + data.uid + '/badges/';
                            // check if badges folder not exists make directory for badges
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
                                    var updateData = {$set: {}};
                                    updateData.$set['preference.badges.' + fileOpt.fieldname] = fileOpt.fieldname + '.' + extension;

                                    db.saveUser(table, where, updateData, function (row) {
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
                    } else {
                        res.json({responseCode: 0, responseMsg: 'File not passed.'});
                        return false;
                    }
                    return false;
                    break;
                case "horoscopeDetails":
                    if (req.files) {
                        // function to check if path not exists create directory
                        function makeDir(path) {
                            if (!fs.existsSync(path)) {
                                fs.mkdirSync(path);
                            }
                        }

                        // check key is available in object
                        if ('kundliUpload' in req.files) {
                            var fileOpt = req.files.kundliUpload[0];
                        }

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
                                    updateData = {
                                        $set: {
                                            'horoscopeDetail.birthTime': updatePreference.horoscopeDetails.birthTime,
                                            'horoscopeDetail.placeOfBirth.country': updatePreference.horoscopeDetails.country,
                                            'horoscopeDetail.placeOfBirth.state': updatePreference.horoscopeDetails.state,
                                            'horoscopeDetail.placeOfBirth.city': updatePreference.horoscopeDetails.city,
                                            'preference.sign': updatePreference.horoscopeDetails.sign,
                                            'preference.horoscope.kundliUpload': fileOpt.fieldname + '.' + extension
                                        }
                                    };
                                    db.saveUser(table, where, updateData, function (row) {
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
                        updateData = {
                            'horoscopeDetail.birthTime': updatePreference.horoscopeDetails.birthTime,
                            'horoscopeDetail.placeOfBirth.country': updatePreference.horoscopeDetails.country,
                            'horoscopeDetail.placeOfBirth.state': updatePreference.horoscopeDetails.state,
                            'horoscopeDetail.placeOfBirth.city': updatePreference.horoscopeDetails.city,
                            'preference.sign': updatePreference.horoscopeDetails.sign
                        };
                    }
                    break;
                case "social":
                    updateData = {
                        'preference.facebook': updatePreference.social.facebook,
                        'preference.twitter': updatePreference.social.twitter,
                        'preference.linkedIn': updatePreference.social.linkedIn,
                        'preference.instagram': updatePreference.social.instagram
                    };
                    break;
            }
            break;

        case 'settings':
            if (data.hasOwnProperty("partner")) {
                var updatePartner = data.partner;
            }

            switch (data.subType) {
                case "partnerPersonalInfo":
                    var partnerPersonalInfoFilters = ['gender', 'age', 'maritalStatus', 'hasChild', 'noOfChildren', 'distance', 'preferredCity'];
                    var partnerPersonalInfoPartner = ['divorceCertificate', 'motherTongue', 'bloodGroup'];
                    var partnerPersonalInfoObj = {};
                    //The data which will save in Filters Object
                    for (var i = 0; i < partnerPersonalInfoFilters.length; i++) {
                        partnerPersonalInfoObj['filters.' + partnerPersonalInfoFilters[i]] = updatePartner.partnerPersonalInfo[partnerPersonalInfoFilters[i]];
                    }
                    //The data which will save in partner Object
                    for (var i = 0; i < partnerPersonalInfoPartner.length; i++) {
                        partnerPersonalInfoObj['partner.' + partnerPersonalInfoPartner[i]] = updatePartner.partnerPersonalInfo[partnerPersonalInfoPartner[i]];
                    }
                    updateData = partnerPersonalInfoObj;
                    break;
                case "familyInfo":
                    var familyInfoFilters = ['religion', 'cast', 'native'];
                    var familyInfoPartner = ['familyStatus', 'familyType', 'familyValues'];
                    var familyInfoObj = {};
                    //The data which will save in Filters Object
                    for (var i = 0; i < familyInfoFilters.length; i++) {
                        familyInfoObj['filters.' + familyInfoFilters[i]] = updatePartner.familyInfo[familyInfoFilters[i]];
                    }
                    //The data which will save in partner Object
                    for (var i = 0; i < familyInfoPartner.length; i++) {
                        familyInfoObj['partner.familyDetail.' + familyInfoPartner[i]] = updatePartner.familyInfo[familyInfoPartner[i]];
                    }
                    updateData = familyInfoObj;
                    break;
                case "educationAndProfessionalDetails":
                    var educationQualification = ['uploadCV', 'occupation', 'industry', 'designation', 'experience', 'salary'];
                    var educationQualificationObj = {};
                    for (var i = 0; i < educationQualification.length; i++) {
                        educationQualificationObj['partner.professional.' + educationQualification[i]] = updatePartner.educationAndProfessionalDetails[educationQualification[i]];
                    }
                    educationQualificationObj['partner.educationQualification'] = updatePartner.educationAndProfessionalDetails.educationQualification;
                    updateData = educationQualificationObj;
                    break;
                case "appearance":
                    updateData = {'partner.appearance': updatePartner.appearance};
                    break;
                case "lifestyle":
                    updateData = {'partner.lifestyle': updatePartner.lifestyle};
                    break;
                case "interest":
                    updateData = {'partner.interest': updatePartner.interest};
                    break;
                case "horoscope":
                    updateData = {
                        'partner.sign': updatePartner.horoscope.sign,
                        'partner.horoscope.kundliUpload': updatePartner.horoscope.kundliUpload
                    };
                    break;
                case "badges":
                    updateData = {'partner.badges': updatePartner.badges};
                    break;
                case "social":
                    var social = ['facebook', 'twitter', 'linkedIn', 'instagram'];
                    var socialObj = {};
                    for (var i = 0; i < social.length; i++) {
                        socialObj['partner.' + social[i]] = updatePartner.social[social[i]];
                    }
                    updateData = socialObj;
                    break;
                default:
                    res.json({responseCode: 0, responseMsg: 'Sub-Type is not defined..'});
                    return false;
            }
            break;
        case 'isOnline':
            var currentDate = new Date();
            var isOnlineAfterSomeTime = new Date(currentDate.getTime() + (60 * 60 * 1000));

            //console.log(isOnlineAfterSomeTime.getTime().toString());return false;
            updateData = {
                isOnline: isOnlineAfterSomeTime.getTime().toString()
            };
            break;
        case 'updateToken':
            updateData = {
                fgcmToken: data.fgcmToken
            };
            data.subType = "Fgcm token";
            break;
        default:
            res.json({responseCode: 0, responseMsg: 'Type is not defined..'});
            return false;
    }

    // update user data.
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
};