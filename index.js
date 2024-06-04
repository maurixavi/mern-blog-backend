const express = require('express');
const cors = require('cors');
require('dotenv').config(); 
const mongoose = require('mongoose');
const User = require('./models/User');
const Post = require('./models/Post');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const app = express();
const multer = require('multer')
const uploadMiddleware = multer({dest: 'uploads/'})
const fs = require('fs')


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
app.use('/uploads', express.static(__dirname + '/uploads'))

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

app.post('/post', uploadMiddleware.single('file'), async (req, res) => {
  const {originalname, path} = req.file
  const parts = originalname.split('.')
  const ext = parts[parts.length - 1]
  const newPath = path+'.'+ext
  fs.renameSync(path, newPath)

  const {token} = req.cookies;
  jwt.verify(token, jwtSecret, {}, async (err, info) => {
    if (err) {
      console.error('Token verification FALLO:', err);
      return res.status(401).json({ error: 'Invalid token' });
    }
    const {title, summary, content } = req.body
    const postDoc = await Post.create({ 
      title, 
      summary,
      content, 
      cover:newPath, 
      author:info.id,
    });
    res.json(postDoc)
  });
})

app.put('/post', uploadMiddleware.single('file'), async (req, res) => {
  let newPath = null;
  if (req.file) {
    const { originalname, path } = req.file;
    const parts = originalname.split('.');
    const ext = parts[parts.length - 1];
    newPath = path + '.' + ext;
    fs.renameSync(path, newPath);
  }

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

    const updatedPost = await Post.findByIdAndUpdate(
      id,
      {
        title,
        summary,
        content,
        cover: newPath ? newPath : postDoc.cover,
      },
      { new: true }
    );

    res.json(updatedPost);
  });
});


app.get('/post', async (req, res) => {
  const posts = await Post.find().populate('author').sort({createdAt:-1}).limit(12)
  // console.log(posts)
  res.json(posts)
})

app.get('/post/:id', async (req, res) => {
  const {id} = req.params
  const postDoc = await Post.findById(id).populate('author', ['username'])
  res.json(postDoc)
})

app.get('/', (req, res) => {
  res.send('MERN Blog API');
});

app.listen(port, () => console.log(`Server running on PORT ${port}`));
