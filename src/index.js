// Load environment variables
require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const onedchess = require('./engine/chessengine');

// Create the express app
const app =  express();

// Static directory
const publicDir = path.join(__dirname, './../public');

// Serve static files
app.use(express.static(publicDir));

// Load certificates, if exists
const sslFileAvailable = process.env.KEY && process.env.CERT;
const serverOpt = sslFileAvailable ? {
    key: fs.readFileSync(process.env.KEY),
    cert: fs.readFileSync(process.env.CERT)
} : undefined;

// Load either HTTP / HTTPS module
const serverModule = sslFileAvailable == undefined ? require('http') : require('https');

// Create HTTP server and listen
const port = process.env.PORT || 8080;
const server = serverModule.createServer(serverOpt, app).listen(port, () => {console.log(`Listening to ${port}`)});

// Listen to WS connections
const io = require('socket.io')().listen(server);
onedchess(io);