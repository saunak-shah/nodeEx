/**
 * Created by INFYZO\saunak.shah on 19/8/16.
 */
var db = require('./../../app/db'),
    ObjectID = require('mongodb').ObjectID,
    generalLib = require('./generalLib'),
    config = require('./../../app/config');

module.exports = function (req, res) {
    var data = req.body.data;
    if (req.file) {
        var data = JSON.parse(data);
    }
    var output = {};
    data.updatedOn = new Date();
    var where = {
        _id: new ObjectID(data.uid)
    };

    // function to update user data
    function updateUser(table, where, data, result, res) {
        db.updateUser(table, where, data, function (row) {
            if (!row) {
                res.json({responseCode: 0, responseMsg: 'There is some error to update data.'});
                return false;
            } else {
                output.responseCode = 200;
                output.responseMsg = "Profile updated successfully.";
                delete result.lastLoginIP;
                delete result.createdOn;
                delete result.updatedOn;
                result.profilePics = data.profilePics;
                output.data = result;
                res.json(output);
            }
        });
    }

    // get function to check if user is exist
    db.get('user', where, function (result) {
        if (!result) {
            res.json({responseCode: 0, responseMsg: 'There is some error to get data.'});
            return false;
        }
        if (!data.profilePics && req.file) {
            var uploadPath = 'uploads/profile/' + data.uid + '/';
            var timestamp = new Date().getTime().toString();
            var ext = req.file.originalname.split('.').pop();
            var type = req.file.mimetype.split('/');

            if (type[0] == 'image') {
                generalLib.uploadFile(req, res, uploadPath, timestamp, function (path) {
                    if (!path) {
                        res.json({responseCode: 0, responseMsg: 'There is some error to upload file.'});
                        return false;
                    } else {
                        var sharp = require('sharp');
                        var image = sharp(path);
                        image
                            .metadata()
                            .then(function(metadata) {
                                // check image dimension
                                if (metadata.height < 512 && metadata.width < 512) {
                                    // function to remove Image
                                    generalLib.removeImage(path,res);
                                    res.json({responseCode: 0, responseMsg: 'Please upload another image.'});
                                    return false;
                                } else {
                                    generalLib.resizeImage(ext, path, uploadPath, timestamp,function(clb) {
                                        if (!clb) {
                                            res.json({
                                                responseCode: 500,
                                                responseMsg: 'There is some error to upload image.'
                                            });
                                            return false;
                                        } else {
                                            // function to remove Image
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

                                            if (result.profilePics.original.large.length <= 0) {
                                                profilePics.original.large.push(req.protocol + "://" + config.host + ':' +config.port+'/' + uploadPath + timestamp + '.' + ext);
                                                profilePics.original.medium.push(req.protocol + "://" + config.host + ':' +config.port+'/' + uploadPath + 'medium_' + timestamp + '.' + ext);
                                                profilePics.original.thumb.push(req.protocol + "://" + config.host + ':' +config.port+'/' + uploadPath + 'thumb_' + timestamp + '.' + ext);

                                                profilePics.blur.large.push(req.protocol + "://" + config.host + ':' +config.port+'/' + uploadPath + 'blur_' + timestamp + '.' + ext);
                                                profilePics.blur.medium.push(req.protocol + "://" + config.host + ':' +config.port+'/' + uploadPath + 'blur_medium_' + timestamp + '.' + ext);
                                                profilePics.blur.thumb.push(req.protocol + "://" + config.host + ':' +config.port+'/' + uploadPath + 'blur_thumb_' + timestamp + '.' + ext);

                                                data.profilePics = profilePics;

                                                updateUser('user', where, data, result, res);
                                            } else {
                                                var index = result.profilePics.original.large.length;

                                                result.profilePics.original.large[index] = req.protocol + "://" + config.host + ':' +config.port+'/' + uploadPath + timestamp + '.' + ext;
                                                result.profilePics.original.medium[index] = req.protocol + "://" + config.host + ':' +config.port+'/' + uploadPath + 'medium_' + timestamp + '.' + ext;
                                                result.profilePics.original.thumb[index] = req.protocol + "://" + config.host + ':' +config.port+'/' + uploadPath + 'thumb_' + timestamp + '.' + ext;

                                                result.profilePics.blur.large[index] = req.protocol + "://" + config.host + ':' +config.port+'/' + uploadPath + 'blur_' + timestamp + '.' + ext;
                                                result.profilePics.blur.medium[index] = req.protocol + "://" + config.host + ':' +config.port+'/' + uploadPath + 'blur_medium_' + timestamp + '.' + ext;
                                                result.profilePics.blur.thumb[index] = req.protocol + "://" + config.host + ':' +config.port+'/' + uploadPath + 'blur_thumb_' + timestamp + '.' + ext;

                                                updateUser('user', where, result, result, res);
                                            }
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
        } else if (data.num >= 0 && data.isDelete == 1) {
            var imgArr = ["original", "blur"];
            var len1 = imgArr.length;
            for (a = 0; a < len1; a++) {
                var imgSize = ['large', 'medium', 'thumb'];
                var len2 = imgSize.length;
                for (b = 0; b < len2; b++) {
                    var checkS3 = 'lovecoy.s3.';
                    // check if s3 url
                    var n = result.profilePics[imgArr[a]][imgSize[b]][data.num].indexOf(checkS3);
                    if (n < 0) {
                        // return position of uploads string
                        var p = result.profilePics[imgArr[a]][imgSize[b]][data.num].indexOf('uploads');
                        // relative path of image
                        var newPath = result.profilePics[imgArr[a]][imgSize[b]][data.num].substring(p);
                        // remove image
                        result.profilePics[imgArr[a]][imgSize[b]].splice(data.num, 1);
                        generalLib.removeImage(newPath,res);
                    } else {
                        result.profilePics[imgArr[a]][imgSize[b]].splice(data.num, 1);
                    }
                }
            }
            delete data.num;
            delete data.isDelete;
            data.profilePics = result.profilePics;
            updateUser('user', where, data, result, res);
        } else {
            var imgArr = ["original", "blur"];
            var len1 = imgArr.length;
            for (a = 0; a < len1; a++) {
                var imgSize = ['large', 'medium', 'thumb'];
                var len2 = imgSize.length;
                for (b = 0; b < len2; b++) {
                    var first = result.profilePics[imgArr[a]][imgSize[b]][0];
                    var second = result.profilePics[imgArr[a]][imgSize[b]][data.num];

                    result.profilePics[imgArr[a]][imgSize[b]][data.num] = first;
                    result.profilePics[imgArr[a]][imgSize[b]][0] = second;
                }
            }
            data.profilePics = result.profilePics;
            updateUser('user', where, data, result, res);
        }
    });
};
