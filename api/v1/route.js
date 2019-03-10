/**
 * Created by INFYZO\rachana.thakkar on 11/8/16.
 */

var express = require('express');
var router = express.Router();
var multer = require('multer'),
    upload = multer();

router.post('/login', function (req, res) {
    require("./login")(req, res);
});

//API for myMatch search result
router.post('/match', function (req, res) {
    require("./match")(req, res);
});

//API for meMatch search result
router.post('/matchReverse', function (req, res) {
    require("./matchReverse")(req, res);
});

//API for common search result
router.post('/matchBi', function (req, res) {
    require("./matchBi")(req, res);
});

//API for delete User
router.post('/user/delete', function (req, res) {
    require("./userDelete")(req, res);
});

router.post('/user/action', upload.single('chatmedia'), function (req, res) {
    require("./userActions")(req, res);
});

router.post('/user/edit', function (req, res) {
    require("./userEdit")(req, res);
});

var cpUpload = upload.fields([{ name: 'passport', maxCount: 1 }, { name: 'drivingLicence', maxCount: 1 },
    { name: 'panCard', maxCount: 1 }, { name: 'adharCard', maxCount: 1 }, { name: 'kundliUpload', maxCount: 1 },
    { name: 'uploadCV', maxCount: 1 }, { name: 'divorceCertificate', maxCount: 1 }]);
router.post('/user/save', cpUpload, function (req, res) {
    require("./userSave")(req, res);
});

router.post('/user/view', function (req, res) {
    require("./userView")(req, res);
});

// User list according to flag
router.post('/user/list', function (req, res) {
    require("./userList")(req, res);
});

router.post('/user/profilePic', upload.single('profilePics'), function (req, res) {
    require("./userProfilePic")(req, res);
});

router.post('/chat/saveMedia', upload.single('chatmedia'), function (req, res) {
    require("./chatMediaSave")(req, res);
});

// Chat List : All user list which from user either send or received request from
router.post('/chat/list', function (req, res) {
    require("./chatList")(req, res);
});

// Join chat user intro so it update socket id to database
router.post('/chat/join', function (req, res) {
    require("./chatJoin_srv")(req, res);
});

// Join chat user intro so it update socket id to database
router.post('/chat/save', function (req, res) {
    require("./chatSave_srv")(req, res);
});

// Join chat user intro so it update socket id to database
router.post('/chat/updateFlag', function (req, res) {
    require("./chatUpdateFlag")(req, res);
});

// Fetch remaining chat data from database using last time stamp
router.post('/chat/get', function (req, res) {
    require("./chatGet")(req, res);
});

// Fetch canChat for real time user
router.post('/chat/getCanChat', function (req, res) {
    require("./getCanChat")(req, res);
});

//Fetch question randomly
router.post('/questions/get', function (req, res) {
    require("./questionsGet")(req, res);
});

//get payment slabs
router.post('/slabs/get', function (req, res) {
    require("./slabsGet")(req, res);
});

//save user payment history
router.post('/user/payment', function (req, res) {
    require("./userPayment")(req, res);
});

// Sign out user
router.post('/user/signout', function (req, res) {
    require("./signout")(req, res);
});
module.exports = router;
