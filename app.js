require("dotenv").config();
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const ejs = require("ejs");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
require("./config/db.config.js");
const usermodel = require("./models/user.model.js");
const { log } = require("console");
const app = express();

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    function (accessToken, refreshToken, profile, done) {
      // Here you can save the user profile to your database
      return done(null, profile);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

app.get("/", (req, res) => {
  res.send('<h1>Home</h1><a href="/auth/google">Login with Google</a>');
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  async (req, res) => {
    const email = req.user.emails[0].value;
    const displayName = req.user.displayName;
    const image = req.user.photos[0].value;
    const user = await usermodel.findOne({ email });

    if (!user) {
      const newuser = new usermodel({
        email,
        displayName,
        image,
      });
      const saveduser = await newuser.save();
    }
    res.redirect("/profile");
  }
);

app.get("/profile", async (req, res) => {
  // console.log(req.user);

  const LoggedInUser = await usermodel.findOne({
    email: req.user.emails[0].value,
  });

  const onlineUser = await usermodel.find({
    socketId: {
      $ne: null,
    },
    _id: {
      $ne : LoggedInUser._id
    }
  });
  console.log(onlineUser)

  res.render("chat", { user: LoggedInUser,
    onlineUser
   });
   
});

const server = require("http").createServer(app);
const io = require("socket.io")(server);
io.on("connection", (socket) => {
  console.log("user connected");
  console.log(socket.id);
  socket.on("join", async (id) => {
    console.log("connet");
    await usermodel.findByIdAndUpdate(id, { socketId: socket.id });
  });

  socket.on('message', async (obj)=>{
    console.log(obj.id)
    const user = await usermodel.findOne({_id :
        obj.id});
    // guptaa raand
    socket.to(user.socketId).emit('msg', { msg : obj.message  })
   })


   //crypto lib .randomnbytes() method se random string genrate3
  socket.on("disconnect", async () => {
    await usermodel.findOneAndUpdate(
      { socketId: socket.id },
      { socketId: null }
    );
  });
});

