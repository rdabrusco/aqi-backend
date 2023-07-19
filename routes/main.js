const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth");
const homeController = require("../controllers/home");
const { ensureAuth, ensureGuest } = require("../middleware/auth");


//Main Routes - simplified for now
router.get("/", homeController.getIndex);
// router.get("/profile", ensureAuth, postsController.getProfile);
// router.get("/feed", ensureAuth, postsController.getFeed);
router.get("/login", authController.getLogin);
router.post("/login", authController.postLogin);
router.get("/logout", authController.logout);
router.get("/signup", authController.getSignup);
router.post("/signup", authController.postSignup);
router.get("/user", authController.getUser);

router.put("/addLocation", authController.updateLocations)
router.get("/flash-messages", (req, res) => {
    const flashMessages = req.flash("errors"); // Assuming flash messages are stored using req.flash("messages", messages)
    console.log(`gitting flash-messages`)
    res.json(flashMessages);
  });

module.exports = router;
