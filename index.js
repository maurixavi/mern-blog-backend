const express = require('express');
const cors = require('cors');
require('dotenv').config(); 
const mongoose = require('mongoose');
const User = require('./models/User');
const Post = require('./models/Post');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 4000;
const jwtSecret = 'asdaf4554asd45asdxdggdsfk1';

const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const whitelist = ['http://localhost:3000', 'https://mern-blog-client-nn6u.vercel.app', 'https://mern-blog-client-torr.onrender.com'];
app.use(cors({
  credentials: true,
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Access-Control-Allow-Origin']
}));
app.set("trust proxy", 1);
app.use(express.json());
app.use(cookieParser());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp',
  limits: { fileSize: 50 * 1024 * 1024 } 
}));
// app.use('/tmp', express.static(path.join(__dirname, 'tmp')));


const saltRounds = 10;

mongoose.connect(process.env.MONGODB_URI, {
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
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'None'
    }).json({
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

app.post('/post', async (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  const { token } = req.cookies;
  jwt.verify(token, jwtSecret, {}, async (err, info) => {
    if (err) {
      console.error('Token verification failed:', err);
      return res.status(401).json({ error: 'Invalid token' });
    }

    const image = req.files.file;
    if (image.size > 50 * 1024 * 1024) { 
      return res.status(400).json({ error: 'File size exceeds the limit of 50MB' });
    }

    console.log('Image to upload:', image);

    cloudinary.uploader.upload(image.tempFilePath, async (error, result) => {
      if (error) {
        console.error('Error uploading to Cloudinary:', error); 
        return res.status(500).send(error);
      }

      console.log('Cloudinary upload result:', result);
      
      const { title, summary, content } = req.body;
      const postDoc = await Post.create({
        title,
        summary,
        content,
        cover: result.secure_url, 
        author: info.id,
      });
      res.json(postDoc);
    });
  });
});

app.put('/post', async (req, res) => {
  const { token } = req.cookies;
  jwt.verify(token, jwtSecret, {}, async (err, info) => {
    if (err) {
      console.error('Token verification failed:', err);
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { id, title, summary, content } = req.body;
    const postDoc = await Post.findById(id);
    const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);

    if (!isAuthor) {
      return res.status(400).json('You are not the author of the post');
    }

    if (req.files && Object.keys(req.files).length > 0) {
      const image = req.files.file;

      cloudinary.uploader.upload(image.tempFilePath, async (error, result) => {
        if (error) {
          console.error('Error uploading to Cloudinary:', error);
          return res.status(500).send(error);
        }

        const updatedPost = await Post.findByIdAndUpdate(
          id,
          {
            title,
            summary,
            content,
            cover: result.secure_url,
          },
          { new: true }
        );

        res.json(updatedPost);
      });
    } else {
      const updatedPost = await Post.findByIdAndUpdate(
        id,
        {
          title,
          summary,
          content,
        },
        { new: true }
      );

      res.json(updatedPost);
    }
  });
});

app.get('/post', async (req, res) => {
  const posts = await Post.find().populate('author').sort({ createdAt: -1 }).limit(12);
  res.json(posts);
});

app.get('/post/:id', async (req, res) => {
  const { id } = req.params;
  const postDoc = await Post.findById(id).populate('author', ['username']);
  res.json(postDoc);
});

app.get('/', (req, res) => {
  res.send('MERN Blog API');
});

app.listen(port, () => console.log(`Server running on PORT ${port}`));
