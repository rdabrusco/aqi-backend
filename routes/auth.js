const { Signup, Login, EditTrackedLocations } = require('../controllers/auth')
const {userVerification} = require('../middleware/authentication')
const router = require('express').Router()

router.post('/signup', Signup)
router.post('/login', Login)
router.post('/', userVerification)
router.put('/editTrackedLocations', EditTrackedLocations)



module.exports = router