import express from "express";



import mongoose from "mongoose";



import dotenv from "dotenv";



import bcrypt from "bcryptjs";



import jwt from "jsonwebtoken";



import nodemailer from "nodemailer";



import cors from "cors";



import session from "express-session";



import cookieParser from "cookie-parser";



import MongoStore from "connect-mongo";



import Groq from "groq-sdk";







// Load environment variables


dotenv.config();




// Environment variables
const groqApiKey = process.env.GROQ_API_KEY;




// Debug: Verify API key is loaded
console.log("GROQ KEY:", process.env.GROQ_API_KEY);







// Verify .env is loaded



console.log("📋 Environment Check:");



console.log(`  - .env file loaded: ${process.env.GROQ_API_KEY ? '✅ Yes' : '❌ No'}`);



console.log(`  - MONGO_URI: ${process.env.MONGO_URI ? '✅ Set' : '❌ Missing'}`);



console.log(`  - JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Set' : '❌ Missing'}`);







const app = express();







// ====================== Middleware Setup ======================



app.use(express.json());



app.use(cookieParser());







// CORS configuration with credentials



app.use(cors({



  origin: process.env.FRONTEND_URL || "http://localhost:5173",



  credentials: true,



  methods: ['GET', 'POST', 'PUT', 'DELETE'],



  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']



}));







// Session configuration



app.use(session({



  secret: process.env.SESSION_SECRET || "kittuai_session_secret_key_2024",



  resave: false,



  saveUninitialized: false,



  store: MongoStore.create({



    mongoUrl: process.env.MONGO_URI,



    touchAfter: 24 * 3600, // lazy session update



    ttl: 14 * 24 * 60 * 60 // 14 days



  }),



  cookie: {



    secure: process.env.NODE_ENV === 'production', // HTTPS in production



    httpOnly: true, // Prevents XSS attacks



    maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days



    sameSite: 'lax' // CSRF protection



  },



  name: 'kittuai.sid' // Custom session name



}));







// ====================== AI Client ======================



// Safe client initialization
let groqClient = null;

if (groqApiKey) {
  groqClient = new Groq({ apiKey: groqApiKey });
  console.log("✅ Groq Ready");
} else {
  console.log("⚠️ Groq Disabled");
}


// Log AI provider status



console.log("🤖 AI Providers Status:");
console.log(`  - Groq API Key: ${groqApiKey ? `✅ Found` : "❌ Missing"}`);
console.log(`  - Groq Client: ${groqClient ? "✅ Initialized" : "❌ Not initialized"}`);
if (!groqClient) {
  console.log("  ⚠️  WARNING: No AI providers configured! Using echo mode.");
  console.log("  💡 To enable AI responses, add GROQ_API_KEY to your .env file");
}




// ====================== MongoDB ======================



mongoose.connect(process.env.MONGO_URI)



  .then(() => console.log("✅ MongoDB Connected"))



  .catch(err => console.log("❌ MongoDB Error:", err));







// ====================== User Schema ======================



const userSchema = new mongoose.Schema({



  username: String,



  email: { type: String, unique: true },



  password: String,



  lastLogin: { type: Date, default: Date.now },



  loginCount: { type: Number, default: 0 },



  isActive: { type: Boolean, default: true }



});



const User = mongoose.model("User", userSchema);







// ====================== Session Middleware ======================



const requireAuth = (req, res, next) => {



  if (req.session && req.session.userId) {



    return next();



  } else {



    return res.status(401).json({ msg: "Authentication required" });



  }



};







const requireAuthOrToken = (req, res, next) => {



  // Debug logging



  console.log('🔐 Auth Debug:');



  console.log('  - Session exists:', !!req.session);



  console.log('  - Session userId:', req.session?.userId);



  console.log('  - Authorization header:', req.headers.authorization ? 'Present' : 'Missing');



  



  // Check session first



  if (req.session && req.session.userId) {



    console.log('  ✅ Session authentication successful');



    req.userId = req.session.userId;



    return next();



  }



  



  // Fallback to token authentication



  const authHeader = req.headers.authorization;



  if (authHeader && authHeader.startsWith('Bearer ')) {



    const token = authHeader.substring(7);



    console.log('  - Token found:', token.substring(0, 20) + '...');



    try {



      const decoded = jwt.verify(token, process.env.JWT_SECRET);



      req.userId = decoded.id;



      console.log('  ✅ Token authentication successful');



      return next();



    } catch (err) {



      console.log('  ❌ Token verification failed:', err.message);



      return res.status(401).json({ msg: "Invalid token" });



    }



  }



  



  console.log('  ❌ No authentication method succeeded');



  return res.status(401).json({ msg: "Authentication required" });



};







// ====================== OTP Schema ======================



const otpSchema = new mongoose.Schema({



  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },



  otpHash: { type: String, required: true },



  expiresAt: { type: Date, required: true },



  attempts: { type: Number, default: 0 }



});



const Otp = mongoose.model("Otp", otpSchema);







// ====================== Helper ======================



function generateOtp() {



  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP



}







// ====================== Auth APIs ======================







// Signup



app.post("/api/signup", async (req, res) => {



  try {



    const { username, email, password } = req.body;



    if (!username || !email || !password) return res.status(400).json({ msg: "All fields required" });







    const exist = await User.findOne({ email });



    if (exist) return res.status(400).json({ msg: "User already exists" });







    const hashed = await bcrypt.hash(password, 10);



    await User.create({ username, email, password: hashed });







    res.json({ msg: "Signup successful!" });



  } catch (err) {



    res.status(500).json({ msg: "Server error", error: err.message });



  }



});

app.post("/", (req, res) => {
  res.send("KittuAI Backend is Running 🚀");
}); 





// Login with Session Management



app.post("/api/login", async (req, res) => {



  try {



    const { email, password } = req.body;



    if (!email || !password) return res.status(400).json({ msg: "All fields required" });







    const user = await User.findOne({ email });



    if (!user) return res.status(400).json({ msg: "User not found" });







    if (!user.isActive) return res.status(403).json({ msg: "Account is deactivated" });







    const match = await bcrypt.compare(password, user.password);



    if (!match) return res.status(400).json({ msg: "Invalid credentials" });







    // Update user login information



    user.lastLogin = new Date();



    user.loginCount += 1;



    await user.save();







    // Create session



    req.session.userId = user._id;



    req.session.userEmail = user.email;



    req.session.username = user.username;



    req.session.loginTime = new Date();







    // Also provide JWT token for API compatibility



    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });







    // Set additional cookies



    res.cookie('userInfo', JSON.stringify({



      id: user._id,



      username: user.username,



      email: user.email,



      loginTime: new Date()



    }), {



      maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days



      httpOnly: false, // Allow frontend access



      secure: process.env.NODE_ENV === 'production',



      sameSite: 'lax'



    });







    res.json({ 



      msg: "Login successful!", 



      token,



      user: {



        id: user._id,



        username: user.username,



        email: user.email,



        lastLogin: user.lastLogin,



        loginCount: user.loginCount



      }



    });



  } catch (err) {



    res.status(500).json({ msg: "Server error", error: err.message });



  }



});







// ====================== Logout with Session Management ======================



app.post("/api/logout", (req, res) => {



  req.session.destroy((err) => {



    if (err) {



      return res.status(500).json({ msg: "Logout failed" });



    }



    



    // Clear cookies



    res.clearCookie('kittuai.sid');



    res.clearCookie('userInfo');



    



    res.json({ msg: "Logout successful" });



  });



});







// ====================== Session Status Check ======================



app.get("/api/session-status", requireAuth, async (req, res) => {



  try {



    const user = await User.findById(req.session.userId);



    if (!user || !user.isActive) {



      req.session.destroy();



      return res.status(401).json({ msg: "Session invalid" });



    }







    res.json({



      authenticated: true,



      user: {



        id: user._id,



        username: user.username,



        email: user.email,



        lastLogin: user.lastLogin,



        loginCount: user.loginCount



      },



      sessionInfo: {



        loginTime: req.session.loginTime,



        sessionId: req.sessionID



      }



    });



  } catch (err) {



    res.status(500).json({ msg: "Server error", error: err.message });



  }



});







// ====================== Refresh Session ======================



app.post("/api/refresh-session", requireAuth, (req, res) => {



  // Touch the session to extend its lifetime



  req.session.touch();



  



  res.json({



    msg: "Session refreshed",



    sessionId: req.sessionID,



    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)



  });



});







// ====================== OTP Send API ======================



app.post("/api/send-otp", async (req, res) => {



  const { email } = req.body;



  if (!email) return res.status(400).json({ msg: "Email required" });







  try {



    const user = await User.findOne({ email });



    if (!user) return res.status(404).json({ msg: "User not found" });







    await Otp.deleteMany({ userId: user._id }); // remove old OTPs







    const otp = generateOtp();



    const otpHash = await bcrypt.hash(otp, 10);



    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min







    await Otp.create({ userId: user._id, otpHash, expiresAt });







    const transporter = nodemailer.createTransport({



      service: "gmail",



      auth: {



        user: process.env.EMAIL_FROM,



        pass: process.env.EMAIL_PASSWORD



      }



    });







    const mailOptions = {



      from: process.env.EMAIL_FROM,



      to: email,



      subject: "OTP for password reset",



      text: `Your OTP is ${otp}. It is valid for 10 minutes.`,



      html: `<p>Your OTP is <strong>${otp}</strong>. Valid for 10 minutes.</p>`



    };







    await transporter.sendMail(mailOptions);







    res.json({ msg: "OTP sent to your email" });



  } catch (err) {



    console.error(err);



    res.status(500).json({ msg: "Server error", error: err.message });



  }



});







// ====================== OTP Verify API ======================



app.post("/api/verify-otp", async (req, res) => {



  const { email, otp } = req.body;



  if (!email || !otp) return res.status(400).json({ msg: "Email and OTP required" });







  try {



    const user = await User.findOne({ email });



    if (!user) return res.status(404).json({ msg: "User not found" });







    const otpDoc = await Otp.findOne({ userId: user._id });



    if (!otpDoc) return res.status(400).json({ msg: "No OTP found. Request new OTP." });







    if (otpDoc.expiresAt < new Date()) {



      await Otp.deleteMany({ userId: user._id });



      return res.status(400).json({ msg: "OTP expired. Request new OTP." });



    }







    if (otpDoc.attempts >= 5) {



      await Otp.deleteMany({ userId: user._id });



      return res.status(429).json({ msg: "Too many wrong attempts. Request new OTP." });



    }







    const match = await bcrypt.compare(otp, otpDoc.otpHash);



    if (!match) {



      otpDoc.attempts += 1;



      await otpDoc.save();



      return res.status(400).json({ msg: "Invalid OTP" });



    }







    await Otp.deleteMany({ userId: user._id });



    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "15m" });







    res.json({ msg: "OTP verified", resetToken });



  } catch (err) {



    console.error(err);



    res.status(500).json({ msg: "Server error", error: err.message });



  }



});







// ====================== Reset Password API (Legacy - Token-based) ======================



app.post("/api/reset-password-token", async (req, res) => {



  const { resetToken, newPassword } = req.body;



  if (!resetToken || !newPassword) return res.status(400).json({ msg: "Reset token and new password required" });







  try {



    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);



    const user = await User.findById(decoded.id);



    if (!user) return res.status(400).json({ msg: "Invalid token" });







    const hashed = await bcrypt.hash(newPassword, 10);



    user.password = hashed;



    await user.save();







    res.json({ msg: "Password reset successful!" });



  } catch (err) {



    console.error(err);



    res.status(500).json({ msg: "Server error", error: err.message });



  }



});







// ====================== Verify Email API ======================



app.post("/api/verify-email", async (req, res) => {



  try {



    const { email } = req.body;



    



    // Validate input



    if (!email || !email.trim()) {



      return res.status(400).json({ msg: "Email is required" });



    }







    // Email format validation



    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;



    if (!emailRegex.test(email.trim())) {



      return res.status(400).json({ msg: "Please enter a valid email address" });



    }







    // Check if email exists in database



    const user = await User.findOne({ email: email.trim().toLowerCase() });



    



    if (!user) {



      return res.status(404).json({ msg: "Email not found in our records" });



    }







    res.json({ 



      msg: "Email verified successfully", 



      email: user.email,



      username: user.username 



    });



  } catch (err) {



    console.error("Email verification error:", err);



    res.status(500).json({ msg: "Server error during email verification" });



  }



});







// ====================== Reset Password API (Simplified) ======================



app.post("/api/reset-password", async (req, res) => {



  try {



    const { email, newPassword } = req.body;



    



    // Validate inputs



    if (!email || !email.trim()) {



      return res.status(400).json({ msg: "Email is required" });



    }



    



    if (!newPassword || newPassword.length < 6) {



      return res.status(400).json({ msg: "Password must be at least 6 characters long" });



    }







    // Email format validation



    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;



    if (!emailRegex.test(email.trim())) {



      return res.status(400).json({ msg: "Please enter a valid email address" });



    }







    // Find user by email



    const user = await User.findOne({ email: email.trim().toLowerCase() });



    



    if (!user) {



      return res.status(404).json({ msg: "Email not registered" });



    }







    // Hash the new password



    const hashedPassword = await bcrypt.hash(newPassword, 10);



    



    // Update user's password



    user.password = hashedPassword;



    await user.save();







    res.json({ msg: "Password updated successfully!" });



  } catch (err) {



    console.error("Password reset error:", err);



    res.status(500).json({ msg: "Server error during password reset" });



  }



});







// ====================== Update Password API (Legacy) ======================



app.post("/api/update-password", async (req, res) => {



  try {



    const { email, newPassword } = req.body;



    



    // Validate inputs



    if (!email || !email.trim()) {



      return res.status(400).json({ msg: "Email is required" });



    }



    



    if (!newPassword || newPassword.length < 6) {



      return res.status(400).json({ msg: "Password must be at least 6 characters long" });



    }







    // Email format validation



    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;



    if (!emailRegex.test(email.trim())) {



      return res.status(400).json({ msg: "Please enter a valid email address" });



    }







    // Find user by email



    const user = await User.findOne({ email: email.trim().toLowerCase() });



    



    if (!user) {



      return res.status(404).json({ msg: "User not found" });



    }







    // Hash the new password



    const hashedPassword = await bcrypt.hash(newPassword, 10);



    



    // Update user's password



    user.password = hashedPassword;



    await user.save();







    res.json({ msg: "Password updated successfully!" });



  } catch (err) {



    console.error("Password update error:", err);



    res.status(500).json({ msg: "Server error during password update" });



  }



});



// ====================== Chat API ======================



app.post("/api/chat", requireAuthOrToken, async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ msg: "Prompt required" });
    }

    console.log("📨 Prompt:", prompt);

    if (groqClient) {
      try {
        const completion = await groqClient.chat.completions.create({
          model: "openai/gpt-oss-20b",
          messages: [
            { role: "system", content: "You are Kittu AI assistant." },
            { role: "user", content: prompt }
          ]
        });

        return res.json({
          result: completion.choices[0].message.content,
          provider: "groq"
        });

      } catch (err) {
        console.log("❌ Groq Error:", err.message);
      }
    }

    return res.json({
      result: "Hello 👋, main Kittu AI hu. Aapki sahayata ke liye hazir hu.",
      provider: "fallback"
    });

  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
});







// ====================== Start Server ======================



const PORT = process.env.PORT || 5000;



app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));







// ====================== Chat History API ======================



app.get("/api/chat/history", requireAuthOrToken, (req, res) => {



  try {



    res.json({



      chats: [



        { role: "user", message: "Hello 👋" },



        { role: "assistant", message: "Hi, I am Kittu AI 🤖" }



      ]



    });



  } catch (err) {



    res.status(500).json({ msg: "Error loading history" });



  }



});







// ====================== Image Generation API ======================



app.post("/api/generate-image", requireAuthOrToken, async (req, res) => {



  try {



    const { prompt } = req.body;



    if (typeof prompt !== "string" || !prompt.trim()) {



      return res.status(400).json({ msg: "Prompt is required for image generation" });



    }







    console.log(`🎨 Image generation request: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"`);







    // Use OpenAI DALL-E for image generation



    if (openaiClient) {



      try {



        const response = await openaiClient.images.generate({



          model: "dall-e-3",



          prompt: prompt,



          n: 1,



          size: "1024x1024",



          quality: "standard",



        });



        



        const imageUrl = response.data[0].url;



        console.log("✅ Image generated successfully");



        return res.json({ imageUrl });



      } catch (err) {



        console.error("❌ DALL-E generation failed:", err.message);



        return res.status(500).json({ 



          msg: "Image generation failed", 



          error: err.message 



        });



      }



    }







    // Fallback when no image generation API is available



    console.error("❌ No image generation provider available");



    return res.status(503).json({ 



      msg: "Image generation not available. Please add OPENAI_API_KEY to your .env file." 



    });



  } catch (err) {



    console.error("Image generation error:", err);



    res.status(500).json({ msg: "Server error", error: err.message });



  }



});











