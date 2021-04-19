const express = require('express');
const path = require('path');
const { PORT } = require('./env');
const onedchess = require('./engine/chessengine');

// Create the express app
const app =  express();

// Static directory
const publicDir = path.join(__dirname, './../public');

// Serve static files
app.use(express.static(publicDir));

// Create HTTP server and listen
const server = require('http').createServer(app).listen(PORT);

// Listen to WS connections
const io = require('socket.io')().listen(server);
onedchess(io);