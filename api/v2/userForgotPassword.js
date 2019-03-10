/**
 * Created by infyzo on 24/11/16.
 */
var db = require('./../../app/db');
var gl = require('./generalLib');

module.exports = function (req, res) {
    var data = req.body.data;
    // check if user email is exist
    db.get('user', {'email.self': data.email}, function (result) {
        if (!result) {
            res.json({
                responseCode: 402,
                responseMsg: 'Sorry there is no account with this E-Mail address.'
            });
            return false;
        } else {
            //Generate OTP Process
            gl.randomOtp(function (otp) {
                var emailSubject = 'Your one time password for your forgot password request';
                var emailTemplate = 'Hello,<br><br> <Message> <Value> This is your one-time password. <br>'+ otp + ' <br><br>Thank you,<br> Lovecoy </Value></Message></a>';

                //Save Otp Process
                //Send Mail Process
                gl.sendMail(data.email, otp, req, emailSubject, emailTemplate, function (result) {
                    if (!result) {
                        res.json({responseCode: 500, responseMsg: 'There is some error to send mail.'});
                        return false;
                    } else {
                        db.saveUser('user', {'email.self': data.email}, {$set: {otp: otp}}, function (row) {
                            var uid = row._id.toString();
                            if (!row) {
                                res.json({responseCode: 500, responseMsg: 'There is some error to update data.'});
                                return false;
                            } else {
                                var output = {responseCode: 200, responseMsg: "User found with this E-Mail address."};
                                output.data = {_id:uid};
                                res.json(output);
                            }
                        });
                    }
                });
            });
        }
    });
};