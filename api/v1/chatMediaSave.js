/**
 * Lovecoy Bootstrap file.
 * @author Infyzo Websol Pvt. Ltd.
 * @copyright 2016 Infyzo Websol Pvt. Ltd.
 * @licence
 * @version 1.0.0
 */
var db = require('./../../app/db');

module.exports = function (req, res) {
    var generalLib = require('./generalLib'),
        ObjectID = require('mongodb').ObjectID;
    var data = req.body.data;

    if (req.file) {
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

    var output = {responseCode: 500, responseMsg: 'Invalid file uploaded.', msgType: 'msg'};
    var extension = req.file.originalname.split('.').pop();

    if (req.file) {
        if (req.file.mimetype) {
            var mime = req.file.mimetype;
            var filetype = mime.substr(0, 5);

            if (filetype == 'image' || filetype == 'audio') {
                var uploadPath = 'uploads/chatmedia/' + filetype + '/';
                var type = filetype + '/' + extension;
                output.msgType = filetype;

                db.get('privacySettings', {from: new ObjectID(data.uid),to:new ObjectID(data.to)}, function (result) {

                    if (!result) {
                        res.json({responseCode: 0, responseMsg: 'There is some error to get privacy data.'});
                        return false;
                    } else {
                        var timestamp = new Date().getTime().toString();
                        var size = generalLib.formatBytes(req.file.size, 1);
                        var appConfig = require('./../../app/config');

                        if(result.privacySettings.isMyPhotoBlur && filetype == 'image'){
                            var sharp = require('sharp');
                            sharp(req.file.buffer)
                                .blur(10)
                                .toFile(uploadPath + 'blur_' + timestamp + '.' + extension)
                                .then(function() {
                                    var dt = new Date();
                                    var ts = dt.getHours() + ':' + dt.getMinutes();
                                    output.responseCode = 200;
                                    output.responseMsg = "File uploaded successfully.";
                                    output.ts = ts;
                                    output.data = {
                                        msg: data.caption,
                                        file: {
                                            url: 'http://' + appConfig.host + '/Lovecoy-Webservice/' + uploadPath + 'blur_' + timestamp + '.' + extension,
                                            type: type,
                                            size: size
                                        }
                                    };
                                    res.json(output);
                                });
                        } else {
                            generalLib.uploadFile(req, res, uploadPath, timestamp, function (path) {
                                output.responseCode = 200;
                                output.responseMsg = "File uploaded successfully.";
                                var dt = new Date();
                                var ts = dt.getHours() + ':' + dt.getMinutes();
                                output.ts = ts;
                                output.data = {
                                    msg: data.caption,
                                    file: {
                                        url: 'http://' + appConfig.host + '/Lovecoy-Webservice/' + path,
                                        type: type,
                                        size: size
                                    }
                                };
                                res.json(output);
                            });
                        }
                    }
                });
            } else {
                res.json(output);
                return false;
            }
        }
    } else {
        res.json({responseCode: 402, responseMsg: 'No file in attached'});
        return false;
    }
};