/**
 * Created by INFYZO\saunak.shah on 19/8/16.
 */
var db = require('./../../app/db'),
    ObjectID = require('mongodb').ObjectID,
    generalLib = require('./generalLib'),
    config = require('./../../app/config');

module.exports = function (req, res) {
    var output = {};
    var data = (req.file) ? JSON.parse(req.body.data) : req.body.data;
    data.updatedOn = new Date();
    var where = {
        _id: new ObjectID(data.uid)
    };

    // function to update user data
    function updateUser(table, where, updateData, result, res) {
        db.updateUser(table, where, updateData, function (row) {
            if (!row) {
                res.json({responseCode: 0, responseMsg: 'There is some error to update data.'});
                return false;
            } else {
                output.responseCode = 200;
                output.responseMsg = "Profile updated successfully.";
                delete result.lastLoginIP;
                delete result.createdOn;
                delete result.updatedOn;
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
        if (req.file) {
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
                            .then(function (metadata) {
                                // check image dimension
                                if (metadata.height < 512 && metadata.width < 512) {
                                    // function to remove Image
                                    generalLib.removeImage(path, res);
                                    res.json({responseCode: 0, responseMsg: 'Please upload another image.'});
                                    return false;
                                } else {
                                    generalLib.resizeImage(ext, path, uploadPath, timestamp, function (clb) {
                                        if (!clb) {
                                            res.json({
                                                responseCode: 500,
                                                responseMsg: 'There is some error to upload image.'
                                            });
                                            return false;
                                        } else {
                                            result.profilePics.push(
                                                {
                                                    large: req.protocol + "://" + config.host + ':' + config.port + '/' + uploadPath + timestamp + '.' + ext,
                                                    largeBlur: req.protocol + "://" + config.host + ':' + config.port + '/' + uploadPath + 'blur_' + timestamp + '.' + ext,
                                                    medium: req.protocol + "://" + config.host + ':' + config.port + '/' + uploadPath + 'medium_' + timestamp + '.' + ext,
                                                    mediumBlur: req.protocol + "://" + config.host + ':' + config.port + '/' + uploadPath + 'blur_medium_' + timestamp + '.' + ext,
                                                    thumb: req.protocol + "://" + config.host + ':' + config.port + '/' + uploadPath + 'thumb_' + timestamp + '.' + ext,
                                                    thumbBlur: req.protocol + "://" + config.host + ':' + config.port + '/' + uploadPath + 'blur_thumb_' + timestamp + '.' + ext,
                                                    privacy: true,
                                                    isBlur: false
                                                }
                                            );

                                            var updateData = {
                                                profilePics: result.profilePics
                                            };
                                            updateUser('user', where, updateData, result, res);
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
            var checkS3 = 'lovecoy.s3.';
            var imgArr = ["large", "largeBlur", "medium", "mediumBlur", "thumb", "thumbBlur"];
            var len1 = imgArr.length;

            for (a = 0; a < len1; a++) {
                // check if s3 url
                var n = result.profilePics[data.num][imgArr[a]].indexOf(checkS3);
                if (n < 0) {
                    // return position of uploads string
                    var p = result.profilePics[data.num][imgArr[a]].indexOf('uploads');
                    // relative path of image
                    var newPath = result.profilePics[data.num][imgArr[a]].substring(p);
                    // remove image
                    delete result.profilePics[data.num][imgArr[a]];
                    // unlink image
                    generalLib.removeImage(newPath,res);
                } else {
                    // remove image
                    delete result.profilePics[data.num][imgArr[a]];
                }
            }

            // Delete isBlur and privacy for 2nd array
            // because it made profile pic if user delete profile pic
            if(data.num == 0)
                delete result.profilePics[1].privacy;
                delete result.profilePics[1].isBlur;

            // Delete isBlur and privacy for requested image
            if (result.profilePics[data.num].hasOwnProperty("privacy"))
                delete result.profilePics[data.num].privacy;
                delete result.profilePics[data.num].isBlur;

            // Delete array if no key found for requested image
            if(Object.keys(result.profilePics[data.num]).length <=0)
                result.profilePics.splice(data.num, 1);

            var updateData = {
                profilePics: result.profilePics
            };
            updateUser('user', where, updateData, result, res);
        } else if(data.num && data.hasOwnProperty("isBlur")){
            result.profilePics[data.num].isBlur = data.isBlur;
            var updateData = {
                profilePics: result.profilePics
            };
            updateUser('user', where, updateData, result, res);
        } else {
            delete result.profilePics[data.num].privacy;
            delete result.profilePics[data.num].isBlur;

            result.profilePics[0].privacy = false;
            result.profilePics[0].isBlur = false;

            var first = result.profilePics[data.num];
            var second = result.profilePics[0];

            result.profilePics[0] = first;
            result.profilePics[data.num] = second;

            var updateData = {
                profilePics: result.profilePics
            };
            updateUser('user', where, updateData, result, res);
        }
    });
};
