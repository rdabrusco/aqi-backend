const LocalStrategy = require("passport-local").Strategy;
const mongoose = require("mongoose");
const User = require("../models/User");

module.exports =  async (passport) => {
  console.log('attempting thingum')
  
  passport.use(
    new LocalStrategy({
      usernameField: "email",
      passwordField: "password"
    }, async (email, password, done) => {


      try{
        console.log(`passport hit`)
        const user = await User.findOne({ email: email.toLowerCase() }).exec()
        // console.log(user)
        if (!user) {
          console.log(`email ${email} not found`)
          return done(null, false, { msg: `Email ${email} not found.` });
        }
        if (!user.password) {
            return done(null, false, {
              msg:
                "Your account was registered using a sign-in provider. To enable password login, sign in using a provider, and then set a password under your user profile.",
            });
          }
          user.comparePassword(password, (err, isMatch) => {
          console.log(`testing password`)

            if (err) {
              console.log(`error`)
              return done(err);
            }
            if (isMatch) {
              console.log(`match`)
              return done(null, user);
            }
            console.log(`time to backtrack`)
            return done(null, false, { msg: "Invalid email or password." });
          });
      } catch(err) {
        console.log(`oopsies`)
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    console.log(`id: `, id)
    const u = await User.findById(id);
    return done(u)
  });
};
