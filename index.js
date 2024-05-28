const express = require('express');
const cors = require('cors');
require('dotenv').config(); 
const mongoose = require('mongoose');
const User = require('./models/User');
const app = express();

app.use(cors());
app.use(express.json());

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

    const userDoc = await User.create({ username, password });
    res.json(userDoc);
  } catch (err) {
    res.status(500).json({ error: 'An error occurred while creating the user' });
  }
});

app.listen(4000, () => {
  console.log('Servidor corriendo en el puerto 4000');
});
