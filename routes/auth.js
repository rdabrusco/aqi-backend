const { Signup, Login, EditTrackedLocations, UpdateSendEmail, SendEmail } = require('../controllers/auth')
const {userVerification} = require('../middleware/authentication')
const router = require('express').Router()

router.post('/signup', Signup)
router.post('/login', Login)
router.post('/', userVerification)
router.post('/sendEmail', SendEmail)
router.put('/editTrackedLocations', EditTrackedLocations)
router.put('/updateSendEmail', UpdateSendEmail)



module.exports = router