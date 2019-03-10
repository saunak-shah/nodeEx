
/**
 * Lovecoy Bootstrap file.
 * @author Infyzo Websol Pvt. Ltd.
 * @copyright 2016 Infyzo Websol Pvt. Ltd.
 * @licence
 * @version 1.0.0
 */

module.exports = function (version) {

    return function (req, res, next) {
        var url = req.url.substring(0, 8);
        // if request is not for favicon
        if (url !== '/favicon' && url !== '/uploads') {
            // split path to get version number and route
            var path = req.url.split('/');
            var route = (path[2]) ? path[1] + '/' + path[2] : path[1];

            if(version == '' || version.length > 3 || version[0] !== 'v' || req.method !== 'POST'){
                res.setHeader('content-type', 'text/html');
                res.end('Bad Request');
                return false;
            }
            // get validate file based on version number
            fields = require('./../api/' + version + '/validate');
            fields = fields[route];
            var data = (req.files || req.file) ? JSON.parse(req.body.data) : req.body.data;

            for (var x in fields) {
                var key = fields[x].field;

                // if key not found in request body return with 402
                if (!data[key]) {
                    var message = fields[x].message;
                    res.json({responseCode: 402, responseMsg: message});
                    return false;
                }
            }
            var db = require('./db');
            var ObjectID = require('mongodb').ObjectID;

            if (route !== 'login' && route !== 'signUp' && route !== 'user/forgotPassword') {
                db.get('user', {_id: new ObjectID(data.uid)}, function (user) {
                    if (!user) {
                        res.json({
                            responseCode: 401,
                            responseMsg: "This user has been deleted from server side.Please login again."
                        });
                        return false;
                    } else{
                        next();
                    }
                });
            } else{
                next();
            }
        }
    }
};

