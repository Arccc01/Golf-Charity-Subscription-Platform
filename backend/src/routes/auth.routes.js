const express = require('express');
const router = express.Router();
const {userLoginController,userRegisterController,getme} =require('../controllers/auth.controller')
const { requireAuth } = require('../middleware/auth.middleware');

// REGISTER
router.post('/register',userRegisterController );

// LOGIN
router.post('/login', userLoginController);

router.get('/me' , requireAuth,getme);

module.exports = router;