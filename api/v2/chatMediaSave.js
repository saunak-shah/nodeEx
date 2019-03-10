/**
 * Lovecoy Bootstrap file.
 * @author Infyzo Websol Pvt. Ltd.
 * @copyright 2016 Infyzo Websol Pvt. Ltd.
 * @licence
 * @version 1.0.0
 */

module.exports = function (req, res) {
    var generalLib = require('./generalLib');
    var data = (req.file) ? JSON.parse(req.body.data) : req.body.data;

    var output = {responseCode: 500, responseMsg: 'Invalid file uploaded.', msgType: 'msg'};
    var extension = req.file.originalname.split('.').pop();

    if (req.file) {
        if (req.file.mimetype) {
            var mime = req.file.mimetype;
            var filetype = mime.substr(0, 5);

            if (filetype == 'image' || filetype == 'audio' || filetype == 'video') {
                var uploadPath = 'uploads/chatmedia/' + filetype + '/';
                var type = filetype + '/' + extension;
                output.msgType = filetype;
            } else {
                res.json(output);
                return false;
            }
        }

        var timestamp = new Date().getTime().toString();
        generalLib.uploadFile(req, res, uploadPath, timestamp, function (path) {
            var appConfig = require('./../../app/config');
            var size = generalLib.formatBytes(req.file.size, 1);
            var timestamp = new Date();
            var ts = timestamp.getHours() + ':' + timestamp.getMinutes();

            output.responseCode = 200;
            output.responseMsg = "File uploaded successfully.";
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
    } else {
        res.json({responseCode: 402, responseMsg: 'No file in attached'});
        return false;
    }
};