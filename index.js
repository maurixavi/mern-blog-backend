const express = require('express');
const cors = require('cors');
require('dotenv').config(); 
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const app = express();

const port = process.env.PORT || 4000;
const jwtSecret = 'asdaf4554asd45asdxdggdsfk1'

const whitelist = ['http://localhost:3000', 'https://mern-blog-client-nn6u.vercel.app/', 'https://mern-blog-client-torr.onrender.com'];
app.use(cors({
  credentials: true,
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
app.use(express.json());
app.use(cookieParser());

const saltRounds = 10; // Número de rondas de hashing para bcrypt

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Conectado a MongoDB'))
.catch((err) => console.error('Error al conectar a MongoDB', err));

app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const userDoc = await User.create({ 
      username, 
      password: hashedPassword 
    });
    res.json(userDoc);
  } catch (err) {
    res.status(500).json({ error: 'An error occurred while creating the user' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const existingUser = await User.findOne({ username });

  if (!existingUser) {
    return res.status(400).json({ error: 'Username does not exist' });
  }

  const passOk = await bcrypt.compare(password, existingUser.password);
  if (!passOk) {
    return res.status(400).json({ error: 'Wrong credentials' });
  }

  jwt.sign({ username, id: existingUser._id }, jwtSecret, {}, (err, token) => {
    if (err) {
      console.error('Error during token generation:', err);
      return res.status(500).json({ error: 'Token generation failed' });
    }
    console.log('Login successful for:', username);
    res.cookie('token', token).json({
      token: token,
      id: existingUser._id,
      username,
    });
  });
});

app.get('/profile', (req, res) => {
  const { token } = req.cookies;
  jwt.verify(token, jwtSecret, {}, (err, info) => {
    if (err) {
      console.error('Token verification failed:', err);
      return res.status(401).json({ error: 'Invalid token' });
    }
    res.json(info);
  });
});

app.post('/logout', (req, res) => {
  res.clearCookie('token').json({ message: 'Logged out' });
});

app.get('/', (req, res) => {
  res.send('MERN Blog API');
});

app.listen(port, () => console.log(`Server running on PORT ${port}`));
