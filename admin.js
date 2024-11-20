const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();


mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});


const User = mongoose.model(
  "User",
  new mongoose.Schema({ chatId: String, subscribed: Boolean })
);

const app = express();
app.use(express.json());


app.get("/users", async (req, res) => {
  const users = await User.find();
  res.json(users);
});


app.delete("/users/:chatId", async (req, res) => {
  const { chatId } = req.params;
  await User.findOneAndDelete({ chatId });
  res.send(`User ${chatId} deleted`);
});


app.post("/update-api-keys", (req, res) => {
  const { WEATHER_API_KEY } = req.body;

  if (WEATHER_API_KEY) {
    process.env.WEATHER_API_KEY = WEATHER_API_KEY;
    res.send("API Key updated successfully");
  } else {
    res.status(400).send("API Key missing");
  }
});

app.listen(3000, () => console.log("Admin Panel running on port 3000"));
