/**
 * Created by INFYZO\rachana.thakkar on 11/8/16.
 */

var express = require('express');
var router = express.Router();
var multer = require('multer'),
    validatorMW = require('../../app/validatorMW');

router.post('/signUp', multer().single('profilePics'), validatorMW('v2'), function (req, res) {
    require("./signUp")(req, res);
});

router.post('/login', validatorMW('v2'), function (req, res) {
    require("./login")(req, res);
});

router.post('/verifyOtp', validatorMW('v2'), function (req, res) {
    require("./verifyOtp")(req, res);
});

//API for myMatch search result
router.post('/match', validatorMW('v2'), function (req, res) {
    require("./match")(req, res);
});

//API for meMatch search result
router.post('/matchReverse', validatorMW('v2'), function (req, res) {
    require("./matchReverse")(req, res);
});

//API for common search result
router.post('/matchBi', validatorMW('v2'), function (req, res) {
    require("./matchBi")(req, res);
});

//API for delete User
router.post('/user/delete', validatorMW('v2'), function (req, res) {
    require("./userDelete")(req, res);
});

router.post('/user/action', multer().single('chatmedia'), validatorMW('v2'), function (req, res) {
    require("./userActions")(req, res);
});

router.post('/user/edit', validatorMW('v2'), function (req, res) {
    require("./userEdit")(req, res);
});


router.post('/user/save', multer().fields([{name: 'kundli', maxCount: 1},
    {name: 'uploadCV', maxCount: 1}, {name: 'passport', maxCount: 1}]), validatorMW('v2'), function (req, res) {
    require("./userSave")(req, res);
});

router.post('/user/view', validatorMW('v2'), function (req, res) {
    require("./userView")(req, res);
});

// User list according to flag
router.post('/user/list', validatorMW('v2'), function (req, res) {
    require("./userList")(req, res);
});

router.post('/user/profilePic', multer().single('profilePics'), validatorMW('v2'), function (req, res) {
    require("./userProfilePic")(req, res);
});

// Hold List : Category wise list for users
router.post('/user/holdList', validatorMW('v2'), function (req, res) {
    require("./holdList")(req, res);
});


router.post('/chat/saveMedia', multer().single('chatmedia'), validatorMW('v2'), function (req, res) {
    require("./chatMediaSave")(req, res);
});

// Chat List : All user list which from user either send or received request from
router.post('/chat/list', validatorMW('v2'), function (req, res) {
    require("./chatList")(req, res);
});

// Join chat user intro so it update socket id to database
router.post('/chat/join', validatorMW('v2'), function (req, res) {
    require("./chatJoin_srv")(req, res);
});

// Join chat user intro so it update socket id to database
router.post('/chat/save', validatorMW('v2'), function (req, res) {
    require("./chatSave_srv")(req, res);
});

// Join chat user intro so it update socket id to database
router.post('/chat/updateFlag', validatorMW('v2'), function (req, res) {
    require("./chatUpdateFlag_srv")(req, res);
});

// Fetch remaining chat data from database using last time stamp
router.post('/chat/get', validatorMW('v2'), function (req, res) {
    require("./chatGet")(req, res);
});

// Fetch canChat for real time user
router.post('/chat/getCanChat', validatorMW('v2'), function (req, res) {
    require("./getCanChat")(req, res);
});

//Fetch question randomly
router.post('/questions/get', validatorMW('v2'), function (req, res) {
    require("./questionsGet")(req, res);
});

//get payment slabs
router.post('/slabs/get', validatorMW('v2'), function (req, res) {
    require("./slabsGet")(req, res);
});

//save user payment history
router.post('/user/payment', validatorMW('v2'), function (req, res) {
    require("./userPayment")(req, res);
});

// Sign out user
router.post('/user/signout', validatorMW('v2'), function (req, res) {
    require("./signout")(req, res);
});

//splash screen for exclusive chat
router.post('/user/splash', validatorMW('v2'), function (req, res) {
    require("./splash")(req, res);
});

// ForgotPassword
router.post('/user/forgotPassword', validatorMW('v2'), function (req, res) {
    require("./userForgotPassword")(req, res);
});

// setPassword
router.post('/user/setPassword', validatorMW('v2'), function (req, res) {
    require("./userSetPassword")(req, res);
});

// privacyUsers
router.post('/privacy/users', function (req, res) {
    require("./privacyUsers")(req, res);
});

// Compulsory Field
router.post('/compulsory/field', function (req, res) {
    require("./compulsoryField")(req, res);
});

module.exports = router;
