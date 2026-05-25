const router = require('express').Router();
const { register, login, getProfile, registerValidators, loginValidators } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/register', registerValidators, register);
router.post('/login', loginValidators, login);
router.get('/profile', authenticate, getProfile);

module.exports = router;
