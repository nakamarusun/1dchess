const newConnection = require('./room');

module.exports = function(io) {
    const main = io.of('/main');
    main.on('connection', newConnection);
}