require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const User = require('./models/Users');
const Item = require('./models/Items');
const authMiddleware = require('./middleware/auth');
const listRoutes = require('./routes/lists');
const userRoutes = require('./routes/user');
const cookieParser = require('cookie-parser');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET;

const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  console.log('Request Origin:', req.headers.origin);
  next();
});

const allowedOrigins = ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000', 'http://127.0.0.1:5501','http://localhost:5501', 'http://localhost:8080', 'http://127.0.0.1:8080'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error('CORS Rejected Origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(cookieParser());

// Test route to debug 404 issues
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!', timestamp: new Date() });
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

const isProduction = process.env.NODE_ENV === 'production';

// Signup route
app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ message: 'Please fill all fields.' });

  const existingUser = await User.findOne({ email });
  if (existingUser)
    return res.status(400).json({ message: 'User already exists.' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = new User({ name, email, passwordHash });
  await user.save();

  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });

  res.cookie('token', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 3600000, // 1 hour
  });

  res.json({ name: user.name, email: user.email });
});

// Login route
app.post('/login', async (req, res) => {
    console.log('Login request body:', req.body);
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Please fill all fields.' });

  const user = await User.findOne({ email });
  if (!user)
    return res.status(400).json({ message: 'Invalid email or password.' });

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch)
    return res.status(400).json({ message: 'Invalid email or password.' });

  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });

    // Send JWT token as HttpOnly cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: false,      // cookie sent only over HTTPS in production
    sameSite: 'lax',
    maxAge: 3600000,           // 1 hour
  });

  res.json({ token, name: user.name, email: user.email });
});

app.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});


// Use your lists routes under /api prefix
app.use('/api/user', userRoutes);

app.use('/api/lists', listRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
