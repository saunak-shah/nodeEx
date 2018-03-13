/**
 * Created by INFYZO\rachana.thakkar on 7/9/16.
 */
var db = require('./../../app/db');
var gl = require('./generalLib');
var ObjectID = require('mongodb').ObjectID;
var appConfig = require('./../../app/config');
module.exports = function (req, res) {
    var data = req.body.data;
    var excludedItems = {
        uuid: 0,
        fbId: 0,
        filters: 0,
        partner: 0,
        createdOn: 0,
        updatedOn: 0,
        lastLoginIP: 0,
        socketId: 0,
        question: 0,
        questions: 0,
        gifts: 0,
        fcgm: 0,
        interestedIn: 0
    };
    db.getSelected('user', {_id: new ObjectID(data.uid)}, excludedItems, function (result) {
        if (!result) {
            res.json({responseCode: 402, responseMsg: 'User not found.'});
            return false;
        } else {
            var output = {responseCode: 200, responseMsg: "User found.."};
            var viewObject = result;
            var updatedProfilePics = [];
            if (viewObject.profilePics.original.large.length > 0) {
                for (var pic = 0; pic < viewObject.profilePics.original.large.length; pic++) {
                    if (pic > 0 && viewObject.privacySettings.isMyPhotoBlur == true)
                        updatedProfilePics.push(viewObject.profilePics.blur.large[pic]);
                    else
                        updatedProfilePics.push(viewObject.profilePics.original.large[pic]);
                }
            }

            // personalInfo
            output.personalInfo = {
                profilePics: updatedProfilePics
            };
            output.personalInfo.divorceCertificate = viewObject.preference.divorceCertificate;
            var basicFieldsA = ['fname', 'lname', 'age', 'gender', 'dob', 'aboutMe', 'maritalStatus'];
            for (var i = 0; i < basicFieldsA.length; i++) {
                output.personalInfo[basicFieldsA[i]] = (viewObject[basicFieldsA[i]] != undefined) ? viewObject[basicFieldsA[i]] : '';
            }
            var basicFieldsB = ['noOfChildren', 'healthInfo','hasChild','knownLanguage'];
            for (var i = 0; i < basicFieldsB.length; i++) {
                if (viewObject[basicFieldsB[i]] == undefined)
                    viewObject[basicFieldsB[i]] = (basicFieldsB[i] == 'noOfChildren') ? 0 : [];
                output.personalInfo[basicFieldsB[i]] = gl.checkPrivacy(viewObject, basicFieldsB[i], '', '', '');
            }
            var basicFieldsC = ['bloodGroup', 'motherTongue'];
            for (var i = 0; i < basicFieldsC.length; i++) {
                output.personalInfo[basicFieldsC[i]] = gl.checkPrivacy(viewObject, basicFieldsC[i], '', 'preference', '');
            }

            //familyInfo
            output.familyInfo = {};
            var familyInfoA = ['religion', 'cast', 'native'];
            for (var i = 0; i < familyInfoA.length; i++) {
                if (viewObject[familyInfoA[i]] == undefined)
                    viewObject[familyInfoA[i]] = '';
                output.familyInfo[familyInfoA[i]] = gl.checkPrivacy(viewObject, familyInfoA[i], '', '', '');
            }
            var familyFieldsB = ['parentsContactNo', 'fathersOccupation', 'fathersCompanyName',
                'fathersDesignation', 'mothersOccupation', 'mothersCompanyName',
                'motherDesignation', 'noOfBrothers', 'noOfMarriedBrothers',
                'noOfSisters', 'noOfMarriedSisters', 'state', 'city'];
            if (viewObject.familyInfo == undefined)
                viewObject.familyInfo = {};
            for (var i = 0; i < familyFieldsB.length; i++) {
                if (viewObject.familyInfo[familyFieldsB[i]] == undefined)
                    viewObject.familyInfo[familyFieldsB[i]] = (gl.inArray(familyFieldsB[i], ['noOfBrothers', 'noOfMarriedBrothers', 'noOfSisters', 'noOfMarriedSisters'])) ? 0 : '';
                output.familyInfo[familyFieldsB[i]] = gl.checkPrivacy(viewObject, familyFieldsB[i], 'familyInfo', 'familyInfo', '');
            }
            var familyFieldsC = ['familyStatus', 'familyType', 'familyValues'];
            for (var i = 0; i < familyFieldsC.length; i++) {
                output.familyInfo[familyFieldsC[i]] = gl.checkPrivacy(viewObject, familyFieldsC[i], 'familyDetail', 'familyDetail', 'preference');
            }

            //educationDetails
            if (viewObject.educationInstitute == undefined)
                viewObject.educationInstitute = '';
            if (viewObject.schoolBoard == undefined)
                viewObject.schoolBoard = '';
            if (viewObject.education == undefined) {
                viewObject.education = {};
                viewObject.education.degree = '';
            }

            output.educationDetails = {
                educationInstitute: gl.checkPrivacy(viewObject, 'educationInstitute', '', '', ''),
                schoolBoard: gl.checkPrivacy(viewObject, 'schoolBoard', '', '', ''),
                degree: gl.checkPrivacy(viewObject, 'degree', 'education', 'education', ''),
                educationQualification: gl.checkPrivacy(viewObject, 'educationQualification', '', 'preference', '')
            };

            //professional Details
            if (viewObject.companyName == undefined)
                viewObject.companyName = '';
            output.professionalDetails = {
                companyName: gl.checkPrivacy(viewObject, 'companyName', '', '', '')
            };

            output.professionalDetails.uploadCV = (viewObject.preference.professional.uploadCV == '') ? false : true;
            var professionalDetails = ['occupation', 'industry', 'designation', 'experience', 'salary'];
            for (var i = 0; i < professionalDetails.length; i++) {
                output.professionalDetails[professionalDetails[i]] = gl.checkPrivacy(viewObject, professionalDetails[i], 'professional', 'professional', 'preference');
            }

            //Contact Details
            var contactDetails = ['email', 'mobile','city','currentAddress', 'permanentAddress'];
            output.contactDetails = {};
            for (var i = 0; i < contactDetails.length; i++) {
                if (viewObject[contactDetails[i]] == undefined)
                    viewObject[contactDetails[i]] = '';
                output.contactDetails[contactDetails[i]] = gl.checkPrivacy(viewObject, contactDetails[i], '', '', '');
            }

            //appearance
            var appearance = ['height', 'weight', 'bodyType', 'complexion', 'physicallyChallenged', 'eyeColor', 'hairColor'];
            output.appearance = {};
            for (var i = 0; i < appearance.length; i++) {
                output.appearance[appearance[i]] = gl.checkPrivacy(viewObject, appearance[i], 'appearance', 'appearance', 'preference');
            }

            //lifestyle
            var lifestyle = ['smoking', 'drinking', 'diet', 'living'];
            output.lifestyle = {};
            for (var i = 0; i < lifestyle.length; i++) {
                output.lifestyle[lifestyle[i]] = gl.checkPrivacy(viewObject, lifestyle[i], 'lifestyle', 'lifestyle', 'preference');
            }

            //horoscopeDetail
            if (viewObject.horoscopeDetail == undefined) {
                viewObject.horoscopeDetail = {};
                viewObject.horoscopeDetail.birthTime = '';
                viewObject.horoscopeDetail.placeOfBirth = {};
                viewObject.horoscopeDetail.placeOfBirth.country = '';
                viewObject.horoscopeDetail.placeOfBirth.state = '';
                viewObject.horoscopeDetail.placeOfBirth.city = '';
            }

            output.horoscope = {
                birthTime: gl.checkPrivacy(viewObject, 'birthTime', 'horoscopeDetail', 'horoscopeDetail', ''),
                country: (viewObject.privacySettings.horoscopeDetail.placeOfBirth.country == false) ? '*****' : viewObject.horoscopeDetail.placeOfBirth.country,
                state: (viewObject.privacySettings.horoscopeDetail.placeOfBirth.state == false) ? '*****' : viewObject.horoscopeDetail.placeOfBirth.state,
                city: (viewObject.privacySettings.horoscopeDetail.placeOfBirth.city == false) ? '*****' : viewObject.horoscopeDetail.placeOfBirth.city,
                sign: gl.checkPrivacy(viewObject, 'sign', '', 'preference', ''),
                kundliUpload: (viewObject.preference.horoscope.kundliUpload != '') ? true : false
            };

            //badges
            var badges = ['passport', 'drivingLicence', 'panCard', 'adharCard'];
            output.badges = {};
            for (var i = 0; i < badges.length; i++) {
                output.badges[badges[i]] = (viewObject.preference.badges[badges[i]] == '') ? false : true;
            }

            //social
            var social = ['facebook', 'twitter', 'linkedIn', 'instagram'];
            output.social = {};
            for (var i = 0; i < social.length; i++) {
                output.social[social[i]] = gl.checkPrivacy(viewObject, social[i], '', 'preference', '');
            }
            output.interest = viewObject.preference.interest;
            output.interestedIn = viewObject.preference.interestedIn;
            output.dateOMeter = viewObject.dateOMeter;
        }
        res.json(output);
    })
}


