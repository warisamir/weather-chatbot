const { Telegraf, Markup } = require("telegraf");
const mongoose = require("mongoose");
require("dotenv").config();

// Initialize bot and database
const bot = new Telegraf(process.env.BOT_TOKEN);
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define schemas
const User = mongoose.model(
  "User",
  new mongoose.Schema({ chatId: String, subscribed: Boolean })
);

let weatherApiKey = process.env.WEATHER_API_KEY; // Default Weather API key

// Admin authentication
const ADMINS = [1062676709]; 
// Start Command
bot.start(async (ctx) => {
  const chatId = ctx.chat.id;
  let user = await User.findOne({ chatId });

  if (!user) {
    user = new User({ chatId, subscribed: false });
    await user.save();
  }

  ctx.reply(
    "Welcome! Use /subscribe or /unsubscribe to manage weather updates."
  );
});

// Subscribe Command
bot.command("subscribe", async (ctx) => {
  const chatId = ctx.chat.id;
  await User.findOneAndUpdate(
    { chatId },
    { subscribed: true },
    { upsert: true }
  );
  ctx.reply("You are now subscribed to weather updates!");
});

// Unsubscribe Command
bot.command("unsubscribe", async (ctx) => {
  const chatId = ctx.chat.id;
  await User.findOneAndUpdate({ chatId }, { subscribed: false });
  ctx.reply("You have unsubscribed from weather updates.");
});

// Admin Panel
bot.command("admin", (ctx) => {
  if (!ADMINS.includes(ctx.from.id)) {
    return ctx.reply("Unauthorized access!");
  }

  ctx.reply(
    "Welcome to the Admin Panel! Choose an option:",
    Markup.inlineKeyboard([
      [Markup.button.callback("Update API Key", "update_api_key")],
      [Markup.button.callback("View Users", "view_users")],
      [Markup.button.callback("Block User", "block_user")],
    ])
  );
});

// Handle Admin Actions
bot.action("update_api_key", (ctx) => {
  ctx.reply("Send the new Weather API key:");
  bot.on("text", async (ctx) => {
    weatherApiKey = ctx.message.text;
    ctx.reply(`API Key updated successfully: ${weatherApiKey}`);
  });
});

bot.action("view_users", async (ctx) => {
  const users = await User.find();
  const userList = users
    .map((user) => `Chat ID: ${user.chatId}, Subscribed: ${user.subscribed}`)
    .join("\n");
  ctx.reply(`Registered Users:\n${userList}`);
});

bot.action("block_user", (ctx) => {
  ctx.reply("Send the Chat ID of the user to block:");
  bot.on("text", async (ctx) => {
    const chatId = ctx.message.text;
    await User.findOneAndDelete({ chatId });
    ctx.reply(`User with Chat ID ${chatId} has been blocked and removed.`);
  });
});

// Weather Update Command (Optional)
bot.command("weather", async (ctx) => {
  const city = "New York"; // Example: Replace with user input for city
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${weatherApiKey}&units=metric`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.cod === 200) {
      ctx.reply(
        `Weather in ${data.name}: ${data.weather[0].description}, Temp: ${data.main.temp}°C`
      );
    } else {
      ctx.reply("Failed to fetch weather data. Please try again.");
    }
  } catch (error) {
    ctx.reply("An error occurred while fetching weather data.");
  }
});

// Launch Bot
bot.launch();
console.log("Bot is running...");
