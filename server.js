// server.js
const express = require('express');
const { initializeApp } = require('./src/app.js');

const app = express();
app.use(express.json());

initializeApp(app);

const PORT = 3001;
app.listen(PORT, () => console.log("Servidor online"));
