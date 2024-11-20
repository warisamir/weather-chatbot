const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const Admin = require("../models/admin");

const router = express.Router();

// Middleware for authenticating admin
const authenticate = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.redirect("/admin/login");
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    res.redirect("/admin/login");
  }
};

// Admin Login Page
router.get("/login", (req, res) => res.render("login"));

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const admin = await Admin.findOne({ username });

  if (admin && (await bcrypt.compare(password, admin.password))) {
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    res.cookie("token", token, { httpOnly: true });
    return res.redirect("/admin");
  }
  res.send("Invalid credentials");
});

// Admin Dashboard
router.get("/", authenticate, async (req, res) => {
  const users = await User.find();
  res.render("index", { users });
});

// Block User
router.post("/block/:id", authenticate, async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { blocked: true });
  res.redirect("/admin");
});

// Unblock User
router.post("/unblock/:id", authenticate, async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { blocked: false });
  res.redirect("/admin");
});

// Delete User
router.post("/delete/:id", authenticate, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.redirect("/admin");
});

// Update API Keys
router.post("/update-api-keys", authenticate, (req, res) => {
  const { WEATHER_API_KEY } = req.body;
  if (WEATHER_API_KEY) {
    process.env.WEATHER_API_KEY = WEATHER_API_KEY;
    res.send("API key updated successfully");
  } else {
    res.status(400).send("Invalid input");
  }
});

module.exports = router;
