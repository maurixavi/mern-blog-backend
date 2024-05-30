const express = require('express');
const cors = require('cors');
require('dotenv').config(); 
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const app = express();

const port = process.env.PORT || 4000

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(cookieParser())

const salt = bcrypt.genSaltSync(10);
const secret = 'asdaf4554asd45asdxdggdsfk1'

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

    const userDoc = await User.create({ 
			username, 
			password:bcrypt.hashSync(password, salt) });
    res.json(userDoc);
  } catch (err) {
    res.status(500).json({ error: 'An error occurred while creating the user' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
	const existingUser = await User.findOne({ username });
	const passOk = bcrypt.compareSync(password, existingUser.password); 

  if (passOk) {
		jwt.sign({username, id:existingUser._id}, secret, {}, (err,token) => {
			if (err) throw err;
			res.cookie('token', token).json('ok');
		})
	} else {
		res.status(400).json('Wrong credentials')
	}

});

app.get('/profile', (req, res) => {
  const {token} = req.cookies
  jwt.verify(token, secret, {}, (err,info) => {
    if (err) throw err
    res.json(info)
  })
  
});


app.get('/', (req, res) => {
  res.send('MERN Blog API');
});

app.listen(port, () => console.log(`server running on PORT ${port}`));