const express = require('express');
const router = express.Router();
const { signup ,login} = require('../controllers/authController');
const { getUserDetails } = require('../controllers/userController');
const { authenticate } = require('../middlewares/authMiddleware');
const path = require('path')
const {validate}= require('../middlewares/userValidation');

// Multer configuration
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/images'); // Specify the destination folder for storing the uploaded photos
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 50, // 50MB file size limit
  },
});




router.post('/signup',upload.single('photo') , validate,signup);
// router.post('/signup',upload.single('photo') , signup);
// User details route (protected)
router.get('/details', authenticate, getUserDetails);

router.post("/login", validate,login);

module.exports = router;
