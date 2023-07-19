const passport = require("passport");
const validator = require("validator");
const User = require("../models/User");

exports.getLogin = (req, res) => {
  console.log(`login screen attempt`)
  if (req.user) {
    console.log()
    return res.redirect("/");
  }
  res.render("login", {
    title: "Login",
  });
};

exports.postLogin = (req, res, next) => {
  const validationErrors = [];
  console.log('login request heard')
  console.log(req.body)
  if (!validator.isEmail(req.body.email)){
    console.log('please enter valid email')
    validationErrors.push({ msg: "Please enter a valid email address." });
    
  }
  if (validator.isEmpty(req.body.password)){
    console.log(`password cant be blank`)
    validationErrors.push({ msg: "Password cannot be blank." });

  }

  if (validationErrors.length) {
    let msgs = '' 
    validationErrors.forEach((e, i) => {
      msgs += `${i + 1}: ${e.msg} `
    })
    console.log(`there are ${validationErrors.length} errors: ${msgs}`)
    req.flash("errors", validationErrors);
    return res.redirect("http://localhost:3000/login");
  }
  req.body.email = validator.normalizeEmail(req.body.email, {
    gmail_remove_dots: false,
  });

  console.log(req.body.email)

  passport.authenticate("local",  (err, user, info) => {
    console.log(req.body.email)
    console.log(`authenticating...`)
    console.log(`user: ${user}`)
    if (err) {
      console.log(`an error has occurred`)
      return next(err);
    }
    if (!user) {
      console.log('no user')
      req.flash("errors", info);
      return res.redirect("http://localhost:3000/login");
    }
    req.logIn(user, (err) => {
      console.log(`maybe success??`)
      if (err) {
        return next(err);
      }
      console.log(`success`)
      req.flash("success", { msg: "Success! You are logged in." });
      res.redirect(req.session.returnTo || "http://localhost:3000/");
    });
  })(req, res, next);
};

exports.logout = (req, res) => {
  console.log(`logout attempt`)
  req.logout(() => {
    console.log('User has logged out.')
  })
  req.session.destroy((err) => {
    if (err){
      console.log("Error : Failed to destroy the session during logout.", err);
    req.user = null;
    res.redirect("/");
    }

  });
};

exports.getSignup = (req, res) => {
  if (req.user) {
    return res.redirect("/");
  }

};

exports.postSignup = async (req, res, next) => {
  
  console.log(`running signup`, req.body)
  const validationErrors = [];
  if (!validator.isEmail(req.body.email)){
    console.log('bad email')
    validationErrors.push({ msg: "Please enter a valid email address." });
  }
   
  if (!validator.isLength(req.body.password, { min: 8 })){
    console.log('password not long enough')
    validationErrors.push({
      msg: "Password must be at least 8 characters long",
    });
  }
  
  if (req.body.password !== req.body.confirmPassword){
    console.log('passwords dont match')
    validationErrors.push({ msg: "Passwords do not match" });
  }
  

  if (validationErrors.length) {
    let msgs = '' 
    validationErrors.forEach((e, i) => {
      msgs += `${i + 1}: ${e.msg} `
    })
    console.log(`there are ${validationErrors.length} errors: ${msgs}`)
    req.flash("errors", validationErrors);
  }
  req.body.email = validator.normalizeEmail(req.body.email, {
    gmail_remove_dots: false,
  });

  const user = new User({
    // userName: req.body.userName,
    email: req.body.email,
    password: req.body.password,
  });


  try {

    console.log('checking for existing user')
    const existingUser = await User.findOne({ email: req.body.email }).exec()
    console.log(`exitingUser: `, existingUser)

    if (existingUser) {
      console.log(`user already exists, please sign in. `)
      req.flash("errors", {
        msg: "Account with that email address or username already exists.",
      });
      return res.redirect("http://localhost:3000/login");
    }

    try {
      console.log(`attempting save`)
      console.log(`user: ${user}`)
      await user.save()
    } catch(err) {
      return next(err)
    }
    console.log(`user saved, attempting login...`)
      req.logIn(user, async (err) => {
        if (err) {
          return await next(err);
        }
        console.log('account creation successful')
        res.redirect("/");
      });
     
  } catch(err) {
    console.log(`test error`)
    return next(err)
  }
};

exports.updateLocations = async (req, res) => {
  const newTrackedLocations = req.body.trackedLocations
  try {
    const update = await User.findOneAndUpdate(
      { email: req.user.email },
      {trackedLocations: newTrackedLocations},
      {new: true}
    );
    console.log(update)
    console.log("updated tracked locations.");
    res.redirect(`/`);
  } catch (err) {
    console.log(err);
  }

}

exports.getUser = async (req, res) => {
  console.log(`hitting getUser`)
  console.log(`isAuthenticated: ${req.isAuthenticated()}`)
  if(req.isAuthenticated()){
    console.log('you are in fact authenticated')
    res.json({user: req.user})
  } else {
    console.log('not authenticated :(')
    res.status(401).json({error: 'user not authenticated'})
  }
}

exports.getFlashMessages = async (req, res) => {
  const flashMessages = req.flash("errors"); // Assuming flash messages are stored using req.flash("messages", messages)
  console.log(flashMessages)
console.log(`gitting flash-messages`)
return res.json(flashMessages);
}

