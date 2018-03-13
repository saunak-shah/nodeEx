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
        case 'orientation':
            db.get('options', {key: 'interestedIn'}, function (options) {
                if (!options) {
                    // userId might be wrong or user not present. sent authentication wrong message and event
                    res.json({responseCode: 402, responseMsg: 'Options not found.'});
                    return false;
                } else {
                    output.responseCode = 200;
                    output.responseMsg = '';
                    output.data = {
                        interestedIn: gl.setOrientationData(options.value)
                    };

                    res.json(output);
                }
            });
            break;
        // Get all the profile related fields
        case 'profile':
            switch (data.subType) {
                case 'personalInfo':
                    var select = {
                        aboutMe: 1,
                        'preference.bloodGroup': 1,
                        hasChild: 1,
                        noOfChildren: 1,
                        healthInfo: 1,
                        'preference.motherTongue': 1,
                        knownLanguage: 1,
                        maritalStatus: 1,
                        'preference.divorceCertificate': 1
                    };
                    db.getSelected('user', where, select, function (userDetails) {
                        if (!userDetails) {
                            res.json(output);
                            res.end();
                        } else {
                            output.responseCode = 200;
                            output.responseMsg = data.subType + ' data';

                            var result = [
                                {
                                    label: 'aboutMe',
                                    name: 'aboutMe',
                                    value: (userDetails.aboutMe) ? userDetails.aboutMe : '',
                                    type: 'textarea'
                                },
                                {
                                    label: 'hasChild',
                                    name: 'hasChild',
                                    value: (userDetails.hasChild) ? userDetails.hasChild : false,
                                    type: 'switch'
                                },
                                {
                                    label: 'noOfChildren',
                                    name: 'noOfChildren',
                                    value: (userDetails.noOfChildren) ? userDetails.noOfChildren : 0,
                                    type: 'text'
                                },
                                {
                                    label: 'divorceCertificate',
                                    name: 'divorceCertificate',
                                    value: (userDetails.preference.divorceCertificate) ? userDetails.preference.divorceCertificate : '',
                                    type: 'upload'
                                }
                            ];

                            var optionWhere = {
                                key: {
                                    $in: ['bloodGroup', 'healthInfo', 'maritalStatus', 'languages']
                                }
                            };

                            db.getAll('options', optionWhere, {}, function (options) {
                                for (var i in options) {

                                    if ('healthInfo' == options[i].key) {
                                        var opts = [];
                                        for (var j in options[i].value) {
                                            opts.push({
                                                label: options[i].value[j],
                                                name: options[i].value[j],
                                                type: 'checkbox',
                                                value: (userDetails.healthInfo && userDetails.healthInfo.indexOf(options[i].value[j]) >= 0) ? true : false
                                            });
                                        }

                                        result.push({
                                            label: options[i].key,
                                            name: options[i].key,
                                            value: false,
                                            type: 'checkbox',
                                            options: opts
                                        });
                                    } else if ('bloodGroup' == options[i].key) {
                                        var opts = [];
                                        for (var j in options[i].value) {
                                            opts.push({
                                                label: options[i].value[j],
                                                name: options[i].value[j],
                                                type: 'dropdown',
                                                value: (userDetails.preference.bloodGroup == options[i].value[j]) ? true : false
                                            });

                                        }
                                        result.push({
                                            label: options[i].key,
                                            name: options[i].key,
                                            value: false,
                                            type: 'dropdown',
                                            options: opts
                                        });
                                    } else if ('languages' == options[i].key) {
                                        var familyInfo = ['motherTongue', 'knownLanguage'];

                                        var len = familyInfo.length;

                                        for (x = 0; x < len; x++) {

                                            if (familyInfo[x] == 'motherTongue') {
                                                var newquery = userDetails.preference.motherTongue;
                                                type = 'dropdown';
                                            } else {
                                                var newquery = (userDetails.knownLanguage) ? userDetails.knownLanguage : '';
                                                type = 'multiSelect';
                                            }
                                            var opt = [];

                                            var valLen = options[i].value.length;

                                            for (j = 0; j < valLen; j++) {
                                                opt.push({
                                                    label: options[i].value[j],
                                                    name: options[i].value[j],
                                                    type: type,
                                                    value: (newquery.indexOf(options[i].value[j]) >= 0) ? true : false
                                                });
                                            }
                                            result.push({
                                                label: familyInfo[x],
                                                name: familyInfo[x],
                                                value: false,
                                                type: type,
                                                options: opt
                                            });
                                        }
                                    } else if ('maritalStatus' == options[i].key) {
                                        var opts = [];
                                        for (var j in options[i].value) {
                                            opts.push({
                                                label: options[i].value[j],
                                                name: options[i].value[j],
                                                type: 'radio',
                                                value: (userDetails.maritalStatus == options[i].value[j]) ? true : false
                                            });

                                        }
                                        result.push({
                                            label: options[i].key,
                                            name: options[i].key,
                                            value: false,
                                            type: 'radio',
                                            options: opts
                                        });
                                    }
                                }

                                output.data = result;
                                res.json(output);
                                res.end();
                            });
                        }
                    });
                    break;
                case 'familyInfo':
                    var select = {
                        'familyInfo.parentsContactNo': 1,
                        'familyInfo.fathersOccupation': 1,
                        'familyInfo.fathersCompanyName': 1,
                        'familyInfo.fathersDesignation': 1,
                        'familyInfo.mothersOccupation': 1,
                        'familyInfo.mothersCompanyName': 1,
                        'familyInfo.motherDesignation': 1,
                        'familyInfo.noOfBrothers': 1,
                        'familyInfo.noOfMarriedBrothers': 1,
                        'familyInfo.noOfSisters': 1,
                        'familyInfo.noOfMarriedSisters': 1,
                        'familyInfo.state': 1,
                        'familyInfo.city': 1,
                        religion: 1,
                        cast: 1,
                        native: 1,
                        'preference.familyDetail.familyStatus': 1,
                        'preference.familyDetail.familyType': 1,
                        'preference.familyDetail.familyValues': 1
                    };
                    db.getSelected('user', where, select, function (userDetails) {
                        if (!userDetails) {
                            res.json(output);
                            res.end();
                        } else {
                            output.responseCode = 200;
                            output.responseMsg = data.subType + ' data';

                            var result = [
                                {
                                    label: 'parentsContactNo',
                                    name: 'parentsContactNo',
                                    value: (userDetails.familyInfo && userDetails.familyInfo.parentsContactNo) ? userDetails.familyInfo.parentsContactNo : '',
                                    type: 'mobile'
                                },
                                {
                                    label: 'fathersCompanyName',
                                    name: 'fathersCompanyName',
                                    value: (userDetails.familyInfo && userDetails.familyInfo.fathersCompanyName) ? userDetails.familyInfo.fathersCompanyName : '',
                                    type: 'text'
                                },
                                {
                                    label: 'mothersCompanyName',
                                    name: 'mothersCompanyName',
                                    value: (userDetails.familyInfo && userDetails.familyInfo.mothersCompanyName) ? userDetails.familyInfo.mothersCompanyName : '',
                                    type: 'text'
                                },
                                {
                                    label: 'noOfBrothers',
                                    name: 'noOfBrothers',
                                    value: (userDetails.familyInfo && userDetails.familyInfo.noOfBrothers) ? userDetails.familyInfo.noOfBrothers : 0,
                                    type: 'number'
                                },
                                {
                                    label: 'noOfMarriedBrothers',
                                    name: 'noOfMarriedBrothers',
                                    value: (userDetails.familyInfo && userDetails.familyInfo.noOfMarriedBrothers) ? userDetails.familyInfo.noOfMarriedBrothers : 0,
                                    type: 'number'
                                },
                                {
                                    label: 'noOfSisters',
                                    name: 'noOfSisters',
                                    value: (userDetails.familyInfo && userDetails.familyInfo.noOfSisters) ? userDetails.familyInfo.noOfSisters : 0,
                                    type: 'number'
                                },
                                {
                                    label: 'noOfMarriedSisters',
                                    name: 'noOfMarriedSisters',
                                    value: (userDetails.familyInfo && userDetails.familyInfo.noOfMarriedSisters) ? userDetails.familyInfo.noOfMarriedSisters : 0,
                                    type: 'number'
                                },
                                {
                                    label: 'state',
                                    name: 'state',
                                    value: (userDetails.familyInfo && userDetails.familyInfo.state) ? userDetails.familyInfo.state : '',
                                    type: 'text'
                                },
                                {
                                    label: 'city',
                                    name: 'city',
                                    value: (userDetails.familyInfo && userDetails.familyInfo.city) ? userDetails.familyInfo.city : '',
                                    type: 'text'
                                },
                                {
                                    label: 'native',
                                    name: 'native',
                                    value: (userDetails.native) ? userDetails.native : '',
                                    type: 'text'
                                }
                            ];

                            var optionWhere = {
                                key: {
                                    $in: ['religion', 'cast', 'familyStatus', 'familyType', 'familyValues', 'occupation', 'designation']
                                }
                            };

                            db.getAll('options', optionWhere, {}, function (options) {
                                for (var i in options) {

                                    if ('familyStatus' == options[i].key) {
                                        var opts = [];
                                        for (var j in options[i].value) {
                                            opts.push({
                                                label: options[i].value[j],
                                                name: options[i].value[j],
                                                type: 'radio',
                                                value: (userDetails.preference && userDetails.preference.familyDetail
                                                && userDetails.preference.familyDetail.familyStatus
                                                && userDetails.preference.familyDetail.familyStatus == options[i].value[j]) ? true : false
                                            });
                                        }

                                        result.push({
                                            label: options[i].key,
                                            name: options[i].key,
                                            value: false,
                                            type: 'radio',
                                            options: opts
                                        });
                                    } else if ('familyType' == options[i].key) {
                                        var opts = [];
                                        for (var j in options[i].value) {
                                            opts.push({
                                                label: options[i].value[j],
                                                name: options[i].value[j],
                                                type: 'radio',
                                                value: (userDetails.preference && userDetails.preference.familyDetail && userDetails.preference.familyDetail.familyType && userDetails.preference.familyDetail.familyType == options[i].value[j]) ? true : false
                                            });

                                        }
                                        result.push({
                                            label: options[i].key,
                                            name: options[i].key,
                                            value: false,
                                            type: 'radio',
                                            options: opts
                                        });
                                    } else if ('familyValues' == options[i].key) {
                                        var opts = [];
                                        for (var j in options[i].value) {
                                            opts.push({
                                                label: options[i].value[j],
                                                name: options[i].value[j],
                                                type: 'radio',
                                                value: (userDetails.preference && userDetails.preference.familyDetail
                                                && userDetails.preference.familyDetail.familyValues
                                                && userDetails.preference.familyDetail.familyValues == options[i].value[j]) ? true : false
                                            });

                                        }
                                        result.push({
                                            label: options[i].key,
                                            name: options[i].key,
                                            value: false,
                                            type: 'radio',
                                            options: opts
                                        });
                                    } else if ('religion' == options[i].key) {
                                        var opts = [];
                                        for (var j in options[i].value) {
                                            opts.push({
                                                label: options[i].value[j],
                                                name: options[i].value[j],
                                                type: 'dropdown',
                                                value: (userDetails.religion == options[i].value[j]) ? true : false
                                            });

                                        }
                                        result.push({
                                            label: options[i].key,
                                            name: options[i].key,
                                            value: false,
                                            type: 'dropdown',
                                            options: opts
                                        });
                                    } else if ('cast' == options[i].key) {
                                        var opts = [];
                                        for (var j in options[i].value) {
                                            opts.push({
                                                label: options[i].value[j],
                                                name: options[i].value[j],
                                                type: 'dropdown',
                                                value: (userDetails.cast && userDetails.cast == options[i].value[j]) ? true : false
                                            });

                                        }
                                        result.push({
                                            label: options[i].key,
                                            name: options[i].key,
                                            value: false,
                                            type: 'dropdown',
                                            options: opts
                                        });
                                    } else if ('occupation' == options[i].key) {
                                        var familyInfo = ['fathersOccupation', 'mothersOccupation'];

                                        for (x = 0, len = familyInfo.length; x < len; x++) {
                                            var opt = [];

                                            for (j = 0, len = options[i].value.length; j < len; j++) {
                                                opt.push({
                                                    label: options[i].value[j],
                                                    name: options[i].value[j],
                                                    type: 'dropdown',
                                                    value: (userDetails.familyInfo && userDetails.familyInfo[familyInfo[x]] && userDetails.familyInfo[familyInfo[x]] == options[i].value[j]) ? true : false
                                                });
                                            }

                                            result.push({
                                                label: familyInfo[x],
                                                name: familyInfo[x],
                                                value: false,
                                                type: 'dropdown',
                                                options: opt
                                            });
                                        }
                                    } else if ('designation' == options[i].key) {
                                        var familyInfo = ['fathersDesignation', 'motherDesignation'];
                                        var len = familyInfo.length;

                                        for (x = 0; x < len; x++) {
                                            var opt = [];

                                            var valLen = options[i].value.length

                                            for (j = 0; j < valLen; j++) {
                                                opt.push({
                                                    label: options[i].value[j],
                                                    name: options[i].value[j],
                                                    type: 'dropdown',
                                                    value: (userDetails.familyInfo && userDetails.familyInfo[familyInfo[x]] && userDetails.familyInfo[familyInfo[x]] == options[i].value[j]) ? true : false
                                                });
                                            }
                                            result.push({
                                                label: familyInfo[x],
                                                name: familyInfo[x],
                                                value: false,
                                                type: 'dropdown',
                                                options: opt
                                            });
                                        }
                                    }
                                }

                                output.data = result;
                                res.json(output);
                                res.end();
                            });

                        }
                    });
                    break;
                case 'contactDetails':
                    var select = {
                        email: 1,
                        mobile: 1,
                        currentAddress: 1,
                        permanentAddress: 1
                    };
                    db.getSelected('user', where, select, function (userDetails) {
                        if (!userDetails) {
                            res.json(output);
                            res.end();
                        } else {
                            output.responseCode = 200;
                            output.responseMsg = data.subType + ' data';
                            var result = [
                                {
                                    label: 'email',
                                    name: 'email',
                                    value: (userDetails.email) ? userDetails.email : '',
                                    type: 'email'
                                },
                                {
                                    label: 'mobile',
                                    name: 'mobile',
                                    value: (userDetails.mobile) ? userDetails.mobile : '',
                                    type: 'mobile'
                                },
                                {
                                    label: 'currentAddress',
                                    name: 'currentAddress',
                                    value: (userDetails.currentAddress) ? userDetails.currentAddress : '',
                                    type: 'textArea'
                                },
                                {
                                    label: 'permanentAddress',
                                    name: 'permanentAddress',
                                    value: (userDetails.permanentAddress) ? userDetails.permanentAddress : '',
                                    type: 'textArea'
                                }
                            ];

                            output.data = result;
                            res.json(output);
                            res.end();
                        }
                    });
                    break;
                case 'educationDetails':
                    var select = {
                        'preference.educationQualification': 1,
                        'education.degree': 1,
                        educationInstitute: 1,
                        schoolBoard: 1
                    };
                    db.getSelected('user', where, select, function (userDetails) {
                        if (!userDetails) {
                            res.json(output);
                            res.end();
                        } else {
                            output.responseCode = 200;
                            output.responseMsg = data.subType + ' data';

                            var result = [
                                {
                                    label: 'educationInstitute',
                                    name: 'educationInstitute',
                                    value: (userDetails.educationInstitute) ? userDetails.educationInstitute : '',
                                    type: 'text'
                                },
                                {
                                    label: 'schoolBoard',
                                    name: 'schoolBoard',
                                    value: (userDetails.schoolBoard) ? userDetails.schoolBoard : '',
                                    type: 'text'
                                }
                            ];

                            var optionWhere = {
                                key: {
                                    $in: ['educationQualification', 'degree']
                                }
                            };

                            db.getAll('options', optionWhere, {}, function (options) {
                                for (var i in options) {

                                    if ('educationQualification' == options[i].key) {
                                        var opts = [];
                                        for (var j in options[i].value) {
                                            opts.push({
                                                label: options[i].value[j],
                                                name: options[i].value[j],
                                                type: 'dropdown',
                                                value: (userDetails.preference && userDetails.preference.educationQualification
                                                && userDetails.preference.educationQualification.indexOf(options[i].value[j]) >= 0) ? true : false
                                            });
                                        }

                                        result.push({
                                            label: options[i].key,
                                            name: options[i].key,
                                            value: false,
                                            type: 'dropdown',
                                            options: opts
                                        });
                                    } else if ('degree' == options[i].key) {
                                        var opts = [];
                                        for (var j in options[i].value) {
                                            opts.push({
                                                label: options[i].value[j],
                                                name: options[i].value[j],
                                                type: 'dropdown',
                                                value: (userDetails.education && userDetails.education.degree && userDetails.education.degree == options[i].value[j]) ? true : false
                                            });

                                        }
                                        result.push({
                                            label: options[i].key,
                                            name: options[i].key,
                                            value: false,
                                            type: 'dropdown',
                                            options: opts
                                        });
                                    }
                                }

                                output.data = result;
                                res.json(output);
                                res.end();
                            });

                        }
                    });
                    break;
                case 'appearance':
                    var where = {
                        key: {
                            $in: ['bodyType', 'complexion', 'eyeColor', 'hairColor']
                        }
                    };

                    getData(where, 'profile');
                    break;
                case 'lifestyle':
                    var where = {
                        key: {
                            $in: ['smoking', 'drinking', 'diet', 'living']
                        }
                    };

                    getData(where, 'profile');

                    break;
                case 'interest':
                    var where = {
                        key: {
                            $in: ['interest']
                        }
                    };

                    getData(where, 'profile');

                    break;
                case 'horoscopeDetails':
                    var select = {
                        'preference.horoscope': 1,
                        'preference.sign': 1,
                        horoscopeDetail: 1
                    };
                    db.getSelected('user', where, select, function (userDetails) {
                        if (!userDetails) {
                            res.json(output);
                            res.end();
                        } else {
                            output.responseCode = 200;
                            output.responseMsg = data.subType + ' data';

                            var result = [
                                {
                                    label: 'birthTime',
                                    name: 'birthTime',
                                    value: (userDetails.horoscopeDetail && userDetails.horoscopeDetail.birthTime) ? userDetails.horoscopeDetail.birthTime : 0,
                                    type: 'time'
                                },
                                {
                                    label: 'country',
                                    name: 'country',
                                    value: (userDetails.horoscopeDetail && userDetails.horoscopeDetail.placeOfBirth
                                    && userDetails.horoscopeDetail.placeOfBirth.country) ? userDetails.horoscopeDetail.placeOfBirth.country : '',
                                    type: 'text'
                                },
                                {
                                    label: 'state',
                                    name: 'state',
                                    value: (userDetails.horoscopeDetail && userDetails.horoscopeDetail.placeOfBirth
                                    && userDetails.horoscopeDetail.placeOfBirth.state) ? userDetails.horoscopeDetail.placeOfBirth.state : '',
                                    type: 'text'
                                },
                                {
                                    label: 'city',
                                    name: 'city',
                                    value: (userDetails.horoscopeDetail && userDetails.horoscopeDetail.placeOfBirth
                                    && userDetails.horoscopeDetail.placeOfBirth.city) ? userDetails.horoscopeDetail.placeOfBirth.city : '',
                                    type: 'text'
                                },
                                {
                                    label: 'kundliUpload',
                                    name: 'kundliUpload',
                                    value: (userDetails.preference && userDetails.preference.horoscope
                                    && userDetails.preference.horoscope.kundliUpload) ? userDetails.preference.horoscope.kundliUpload : '',
                                    type: 'upload'
                                }
                            ];

                            db.getAll('options', {key: 'sign'}, {}, function (options) {
                                for (var i in options) {

                                    if ('sign' == options[i].key) {
                                        var opts = [];
                                        for (var j in options[i].value) {
                                            opts.push({
                                                label: options[i].value[j],
                                                name: options[i].value[j],
                                                type: 'radio',
                                                value: (userDetails.preference
                                                && userDetails.preference.sign.indexOf(options[i].value[j]) >= 0) ? true : false
                                            });
                                        }

                                        result.push({
                                            label: options[i].key,
                                            name: options[i].key,
                                            value: false,
                                            type: 'radio',
                                            options: opts
                                        });
                                    }
                                }

                                output.data = result;
                                res.json(output);
                                res.end();
                            });
                        }
                    });
                    break;
                case 'badges':

                    db.getSelected('user', where, select, function (userDetails) {
                        if (!userDetails) {
                            res.json(output);
                            res.end();
                        } else {
                            output.responseCode = 200;
                            output.responseMsg = data.subType + ' data';
                            output.data = {
                                passport: (userDetails.preference && userDetails.preference.badges.passport) ? userDetails.preference.badges.passport : '',
                                drivingLicence: (userDetails.preference && userDetails.preference.badges.drivingLicence) ? userDetails.preference.badges.drivingLicence : '',
                                panCard: (userDetails.preference && userDetails.preference.badges.panCard) ? userDetails.preference.badges.panCard : '',
                                adharCard: (userDetails.preference && userDetails.preference.badges.adharCard) ? userDetails.preference.badges.adharCard : ''
                            };
                            res.json(output);
                            res.end();
                        }
                    });

                    break;
                case 'social':

                    db.getSelected('user', where, select, function (userDetails) {
                        if (!userDetails) {
                            res.json(output);
                            res.end();
                        } else {
                            output.responseCode = 200;
                            output.responseMsg = data.subType + ' data';
                            output.data = {
                                facebook: (userDetails.preference.facebook) ? userDetails.preference.facebook : '',
                                twitter: (userDetails.preference.twitter) ? userDetails.preference.twitter : '',
                                linkedIn: (userDetails.preference.linkedIn) ? userDetails.preference.linkedIn : '',
                                instagram: (userDetails.preference.instagram) ? userDetails.preference.instagram : ''
                            };
                            res.json(output);
                            res.end();
                        }
                    });

                    break;
                case 'professionalDetails':
                    db.getSelected('user', where, select, function (userDetails) {
                        if (!userDetails) {
                            res.json(output);
                            res.end();
                        } else {
                            output.responseCode = 200;
                            output.responseMsg = data.subType + ' data';

                            var result = [
                                {
                                    label: 'companyName',
                                    name: 'companyName',
                                    value: (userDetails.companyName) ? userDetails.companyName : '',
                                    type: 'text'
                                },
                                {
                                    label: 'uploadCV',
                                    name: 'uploadCV',
                                    value: (userDetails.preference && userDetails.preference.professional && userDetails.preference.professional.uploadCV) ? userDetails.preference.professional.uploadCV : '',
                                    type: 'upload'
                                },
                                {
                                    label: 'experience',
                                    name: 'experience',
                                    value: (userDetails.preference && userDetails.preference.professional && userDetails.preference.professional.experience) ? userDetails.preference.professional.experience : 0,
                                    type: 'number'
                                },
                                {
                                    label: 'salary',
                                    name: 'salary',
                                    value: (userDetails.preference && userDetails.preference.professional && userDetails.preference.professional.salary) ? userDetails.preference.professional.salary : 0,
                                    type: 'seekbar'
                                }
                            ];

                            var optionWhere = {
                                key: {
                                    $in: ['occupation', 'industry', 'designation']
                                }
                            };

                            db.getAll('options', optionWhere, {}, function (options) {
                                for (var i in options) {

                                    if ('occupation' == options[i].key) {
                                        var opts = [];
                                        for (var j in options[i].value) {
                                            opts.push({
                                                label: options[i].value[j],
                                                name: options[i].value[j],
                                                type: 'dropdown',
                                                value: (userDetails.preference.professional.occupation.indexOf(options[i].value[j]) >= 0) ? true : false
                                            });
                                        }

                                        result.push({
                                            label: options[i].key,
                                            name: options[i].key,
                                            value: false,
                                            type: 'dropdown',
                                            options: opts
                                        });
                                    } else if ('industry' == options[i].key) {
                                        var opts = [];
                                        for (var j in options[i].value) {
                                            opts.push({
                                                label: options[i].value[j],
                                                name: options[i].value[j],
                                                type: 'dropdown',
                                                value: (userDetails.preference.professional.industry == options[i].value[j]) ? true : false
                                            });

                                        }
                                        result.push({
                                            label: options[i].key,
                                            name: options[i].key,
                                            value: false,
                                            type: 'dropdown',
                                            options: opts
                                        });
                                    } else if ('designation' == options[i].key) {
                                        var opts = [];
                                        for (var j in options[i].value) {
                                            opts.push({
                                                label: options[i].value[j],
                                                name: options[i].value[j],
                                                type: 'dropdown',
                                                value: (userDetails.preference.professional.designation == options[i].value[j]) ? true : false
                                            });

                                        }
                                        result.push({
                                            label: options[i].key,
                                            name: options[i].key,
                                            value: false,
                                            type: 'dropdown',
                                            options: opts
                                        });
                                    }
                                }

                                output.data = result;
                                res.json(output);
                                res.end();
                            });

                        }
                    });
                    break;
                default:
                    res.json(output);
                    res.end();
                    break;
            }
            break;
        case 'settings':
            if (data.subType == 'social' || data.subType == 'badges') {
                var glb = {};
                glb[data.subType] = [];
                db.get('user', {_id: new ObjectID(data.uid)}, function (user) {
                    if (data.subType == 'social') {
                        var social = ['facebook', 'twitter', 'linkedIn', 'instagram'];
                        for (var s = 0; s < social.length; s++) {
                            glb[data.subType].push({
                                    label: social[s],
                                    name: social[s],
                                    value: (user.partner[social[s]]) ? user.partner[social[s]] : false,
                                    type: 'switch',
                                    options: ''
                                }
                            )
                        }
                    }
                    else {
                        for (var badges in user.partner.badges) {
                            glb[data.subType].push({
                                    label: badges,
                                    name: badges,
                                    value: (user.partner.badges[badges]) ? user.partner.badges[badges] : false,
                                    type: 'switch',
                                    options: ''
                                }
                            )
                        }
                    }
                    output.responseCode = 200;
                    output.responseMsg = 'Result for subType - ' + data.subType;
                    output.data = glb[data.subType];
                    res.json(output);
                });
            }
            else {
                switch (data.subType) {
                    case 'partnerPersonalInfo':
                        var where = {
                            key: {
                                $in: ['gender', 'maritalStatus', 'bloodGroup', 'languages']
                            }
                        };
                        break;

                    case 'familyInfo':
                        var where = {
                            key: {
                                $in: ['familyStatus', 'familyType', 'familyValues', 'religion', 'cast']
                            }
                        };
                        break;

                    case 'educationAndProfessionalDetails':
                        var where = {
                            key: {
                                $in: ['occupation', 'industry', 'designation', 'educationQualification']
                            }
                        };
                        break;

                    case 'appearance':
                        var where = {
                            key: {
                                $in: ['bodyType', 'complexion', 'eyeColor', 'hairColor']
                            }
                        };
                        break;

                    case 'lifestyle':
                        var where = {
                            key: {
                                $in: ['smoking', 'drinking', 'diet', 'living']
                            }
                        };
                        break;

                    case 'interest':
                        var where = {
                            key: {
                                $in: ['interest']
                            }
                        };
                        break;

                    case 'horoscope':
                        var where = {
                            key: {
                                $in: ['sign']
                            }
                        };
                        break;

                    default:
                        break;
                }
                getData(where, 'settings');
            }
            break;
        case 'privacySettings':
            var privacy_table = 'user';
            var privacy_where = {
                _id: new ObjectID(data.uid)
            };

            var select = {};
            var optionSelect = {};

            // if user wants to set a privacy settings for particular user
            if (data.to) {
                privacy_table = 'privacySettings';
                privacy_where = {
                    from: new ObjectID(data.uid),
                    to: new ObjectID(data.to)
                };
            }

            switch (data.subType) {
                case 'personalInfo':
                    select = {
                        'privacySettings.isMyPhotoBlur': 1,
                        'privacySettings.healthInfo': 1,
                        'privacySettings.hasChild': 1,
                        'privacySettings.noOfChildren': 1,
                        'privacySettings.bloodGroup': 1,
                        'privacySettings.motherTongue': 1,
                        'privacySettings.knownLanguage': 1
                    };

                    optionSelect = {
                        'value.privacySettings.isMyPhotoBlur': 1,
                        'value.privacySettings.healthInfo': 1,
                        'value.privacySettings.hasChild': 1,
                        'value.privacySettings.noOfChildren': 1,
                        'value.privacySettings.bloodGroup': 1,
                        'value.privacySettings.motherTongue': 1,
                        'value.privacySettings.knownLanguage': 1
                    };

                    getPrivacy(privacy_table, privacy_where, select, optionSelect);
                    break;

                case 'familyInfo':
                    select = {
                        'privacySettings.religion': 1,
                        'privacySettings.cast': 1,
                        'privacySettings.native': 1,
                        'privacySettings.familyInfo': 1,
                        'privacySettings.familyDetail': 1
                    };

                    optionSelect = {
                        'value.privacySettings.religion': 1,
                        'value.privacySettings.cast': 1,
                        'value.privacySettings.native': 1,
                        'value.privacySettings.familyInfo': 1,
                        'value.privacySettings.familyDetail': 1
                    };

                    getPrivacy(privacy_table, privacy_where, select, optionSelect);
                    break;

                case 'educationDetails':
                    select = {
                        'privacySettings.educationQualification': 1,
                        'privacySettings.education': 1,
                        'privacySettings.educationInstitute': 1,
                        'privacySettings.schoolBoard': 1
                    };

                    optionSelect = {
                        'value.privacySettings.educationQualification': 1,
                        'value.privacySettings.education': 1,
                        'value.privacySettings.educationInstitute': 1,
                        'value.privacySettings.schoolBoard': 1
                    };

                    getPrivacy(privacy_table, privacy_where, select, optionSelect);
                    break;

                case 'professionalDetails':
                    select = {
                        'privacySettings.companyName': 1,
                        'privacySettings.professional': 1
                    };

                    optionSelect = {
                        'value.privacySettings.companyName': 1,
                        'value.privacySettings.professional': 1
                    };

                    getPrivacy(privacy_table, privacy_where, select, optionSelect);
                    break;

                case 'contactDetails':
                    select = {
                        'privacySettings.email': 1,
                        'privacySettings.mobile': 1,
                        'privacySettings.currentAddress': 1,
                        'privacySettings.permanentAddress': 1
                    };

                    optionSelect = {
                        'value.privacySettings.email': 1,
                        'value.privacySettings.mobile': 1,
                        'value.privacySettings.currentAddress': 1,
                        'value.privacySettings.permanentAddress': 1
                    };

                    getPrivacy(privacy_table, privacy_where, select, optionSelect);
                    break;

                case 'appearance':
                    select = {
                        'privacySettings.appearance': 1
                    };

                    optionSelect = {
                        'value.privacySettings.appearance': 1

                    };

                    getPrivacy(privacy_table, privacy_where, select, optionSelect);
                    break;

                case 'lifestyle':
                    select = {
                        'privacySettings.lifestyle': 1
                    };

                    optionSelect = {
                        'value.privacySettings.lifestyle': 1
                    };

                    getPrivacy(privacy_table, privacy_where, select, optionSelect);
                    break;

                case 'horoscopeDetails':
                    select = {
                        'privacySettings.sign': 1,
                        'privacySettings.horoscopeDetail': 1
                    };

                    optionSelect = {
                        'value.privacySettings.sign': 1,
                        'value.privacySettings.horoscopeDetail': 1
                    };

                    getPrivacy(privacy_table, privacy_where, select, optionSelect);
                    break;

                case 'social':
                    select = {
                        'privacySettings.facebook': 1,
                        'privacySettings.twitter': 1,
                        'privacySettings.linkedIn': 1,
                        'privacySettings.instagram': 1

                    };

                    optionSelect = {
                        'value.privacySettings.facebook': 1,
                        'value.privacySettings.twitter': 1,
                        'value.privacySettings.linkedIn': 1,
                        'value.privacySettings.instagram': 1
                    };

                    getPrivacy(privacy_table, privacy_where, select, optionSelect);
                    break;
                default:
                    res.json(output);
                    res.end();
                    break;
            }
            break;
        case 'gifts':
            db.get('user', {_id: new ObjectID(data.uid)}, function (result) {
                if (!result) {
                    // userId might be wrong or user not present. sent authentication wrong message and event
                    res.json({responseCode: 402, responseMsg: 'User not found.'});
                    return false;
                } else {
                    output.responseCode = 200;
                    output.responseMsg = '';
                    output.data = {
                        gifts: result.gifts
                    };
                    res.json(output);
                }
            });
            break;
        case 'dateOMeter':
            var select = {
                dateOMeter: 'dateOMeter'
            };
            var wh = {
                _id: new ObjectID(data.uid)
            };
            db.getAll('user', wh, select, function (row) {
                var output = {responseCode: 200, responseMsg: 'dateOMeter result.'};
                output.data = [];
                if (row) {
                    output.data = row;
                }
                res.json(output);
            });
            break;
        default:
            res.json(output);
            res.end();
            break;

    }

    function getData(where, caseType) {
        db.getAll('options', where, {}, function (obj) {
            if (!obj) {
                res.json({responseCode: 402, responseMsg: 'Options not found.'});
                return false;
            } else {
                db.get('user', {_id: new ObjectID(data.uid)}, function (user) {
                    output.responseCode = 200;
                    output.responseMsg = 'Result for subType - ' + data.subType;
                    if (caseType == "settings")
                        output.data = gl.getSettings(obj, user, data.subType);
                    else
                        output.data = gl.getProfile(obj, user, data.subType);
                    res.json(output);
                });
            }
        });
    }

    function getPrivacy(table, where, select, optionSelect) {
        db.getSelected('options', {key: 'defaultObjects'}, optionSelect, function (options) {
            if (!options) {
                res.json(output);
                res.end();
            } else {
                db.getSelected(table, where, select, function (selectedOptions) {
                    if (!selectedOptions) {
                        res.json(output);
                        res.end();
                    } else {
                        output.responseCode = 200;
                        output.responseMsg = 'Privacy Setting result.';
                        var result = [];

                        for (var i in options.value.privacySettings) {
                            if (typeof options.value.privacySettings[i] == "object") {
                                for (var j in options.value.privacySettings[i]) {
                                    if (typeof options.value.privacySettings[i][j] == "object") {
                                        for (var k in options.value.privacySettings[i][j]) {
                                            result.push({
                                                label: k,
                                                name: k,
                                                value: (selectedOptions.privacySettings[i][j].hasOwnProperty(k))
                                                    ? selectedOptions.privacySettings[i][j][k] : options.value.privacySettings[i][j][k],
                                                type: 'switch',
                                                options: ''
                                            });
                                        }
                                    } else {
                                        result.push({
                                            label: j,
                                            name: j,
                                            value: (selectedOptions.privacySettings[i].hasOwnProperty(j))
                                                ? selectedOptions.privacySettings[i][j] : options.value.privacySettings[i][j],
                                            type: 'switch',
                                            options: ''
                                        });

                                    }
                                }
                            } else {
                                result.push({
                                    label: i,
                                    name: i,
                                    value: (selectedOptions.privacySettings.hasOwnProperty(i))
                                        ? selectedOptions.privacySettings[i] : options.value.privacySettings[i],
                                    type: 'switch',
                                    options: ''
                                });
                            }
                        }

                        output.data = result;
                        res.json(output);
                        res.end();
                    }
                });
            }
        });
    }
};
