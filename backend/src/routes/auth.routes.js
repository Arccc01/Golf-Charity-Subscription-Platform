const express = require('express');
const router = express.Router();
const {userLoginController,userRegisterController} =require('../controllers/auth.controller')

// REGISTER
router.post('/register',userRegisterController );

// LOGIN
router.post('/login', userLoginController);

module.exports = router;