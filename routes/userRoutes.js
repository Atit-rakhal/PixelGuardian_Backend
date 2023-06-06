const express = require('express');
const router = express.Router();
const { signup ,login, changePassword} = require('../controllers/authController');
const { getUserDetails } = require('../controllers/userController');
const { authenticate } = require('../middlewares/authMiddleware');
const {validate}= require('../middlewares/userValidation');
const multerUtil = require('../utils/multerUtil');

// Specify the destination folder for storing the uploaded photos
const upload = multerUtil('./uploads/images');



router.post('/signup',upload.single('photo') , validate,signup);
// router.post('/signup',upload.single('photo') , signup);
// User details route (protected)
router.get('/details', authenticate, getUserDetails);
router.post("/changePassword",authenticate,changePassword)

router.post("/login", validate,login);

module.exports = router;
