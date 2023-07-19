module.exports = {
  ensureAuth: function (req, res, next) {
    console.log(`ensuring authentication`)
    if (req.isAuthenticated()) {
      console.log(`authenticated`)
      return next();
    } else {
      console.log(`not authenticated`)
      res.redirect("/");
    }
  },
  ensureGuest: function (req, res, next) {
    if (!req.isAuthenticated()) {
      return next();
    } else {
      res.redirect("/dashboard");
    }
  },
};
