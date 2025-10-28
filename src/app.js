const express = require('express');
const app = express();

app.use(express.json());

// routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/professors', require('./routes/professors'));
app.use('/api/appointments', require('./routes/appointments'));

// health
app.get('/', (req, res) => res.send('college system API'));

module.exports = app;
