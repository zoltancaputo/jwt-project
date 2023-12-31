/* imports */
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();

//config JSON response
app.use(express.json());

//Models
const User = require("./models/User");

// 1 - open Route - public route
app.get("/", (req, res) => {
  res.status(200).json({ msg: "Welcome to our api!" });
});

// 5 - privite Route

app.get("/user/:id", checkToken, async (req, res) => {
  const id = req.params.id;

  //check if user exists
  const user = await User.findById(id, "-password");

  if (!user) {
    return res.status(404).json({ msg: "User not found!!" });
  }

  res.status(200).json({ user})
});

//midleware 
function checkToken(req, res, next) {
   const authHeader = req.headers['autorization']
   const token = authHeader && authHeader.split(" ")[1]

   if(!token) {
    res.status(401).json({ msg: 'Access denied!'})
   }

   try {

    const secret = process.env.SECRET

    jwt.verify(token, secret)

   } catch(error) {
     res.status(400).json({ msg: "Invalid Token"})
   }

}

// 2 - register User
app.post("/auth/register", async (req, res) => {
  const { name, email, password, confirmpassword } = req.body;

  // 3 - validations
  if (!name) {
    return res.status(422).json({ msg: "Name is required!" });
  }

  if (!email) {
    return res.status(422).json({ msg: "Email is required!" });
  }

  if (!password) {
    return res.status(422).json({ msg: "Password is required!" });
  }

  if (password !== confirmpassword) {
    return res.status(422).json({ msg: "Passwords do not match!!!" });
  }

  //check if user exists
  const userExists = await User.findOne({ email: email });

  if (userExists) {
    return res.status(422).json({ msg: "Please, use another email!" });
  }

  //create password
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  //crate user
  const user = new User({
    name,
    email,
    password: passwordHash,
  });

  try {
    await user.save();

    res.status(201).json({ msg: "User created successfully!" });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      msg: "Server error, try again later!",
    });
  }
});

// 4 - login User

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  // 3 - validations

  if (!email) {
    return res.status(422).json({ msg: "Email is required!" });
  }

  if (!password) {
    return res.status(422).json({ msg: "Password is required!" });
  }

  // check if user exists

  const user = await User.findOne({ email: email });

  if (!user) {
    return res.status(404).json({ msg: "User not found!" });
  }

  //check if password match
  const checkPassword = await bcrypt.compare(password, user.password);

  if (!checkPassword) {
    return res.status(422).json({ msg: "Invalid password!" });
  }

  try {
    const secret = process.env.SECRET;

    const token = jwt.sign(
      {
        id: user._id,
      },
      secret
    );

    res.status(200).json({ msg: "Authentication successful!", token });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      msg: "Server error, try later",
    });
  }
});

//credentials
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASS;

mongoose
  .connect(
    `mongodb+srv://${dbUser}:${dbPassword}@cluster0.asr0shc.mongodb.net/?retryWrites=true&w=majority`
  )
  .then(() => {
    app.listen(3000);
    console.log(`Connected!`);
  })
  .catch((err) => console.log(err));
