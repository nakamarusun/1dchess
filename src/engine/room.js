// Check room id regex
const idRegex = /^[a-z1-9]{5}$/i;

// Contains all room data
/*
{room_id: {
    board: Board, // Board data
    isFull: bool, // If the room is already full
    ids: { // Ids of all connected clients (Max 2)
        player1: bool // Color of the player (white || black)
        player2: bool // Color of the player (white || black)
    }, 
}, ...}
*/
const roomData = {};
// TODO: Id check color please and thank you
// Socket room dictionary
// {socket_id: room_id, ...}
const sockRoom = {};

const Chess = require('./../../public/js/board');

module.exports = function (sock) {
    // When new socket connection is made to the room
    console.log("Connected new: " + sock.id);
    bindEvents(sock);
}

function bindEvents(sock) {
    sock.on('createRoom', createRoom);
    sock.on('joinRoom', joinRoom);
    sock.on('movePiece', movePiece);

    sock.on('disconnect', disconnect);
}

/*
    Event functions
*/

function createRoom() {
    // Safety so that the user can't join twice
    if (isInRoom(this)) return;

    // Join room
    const room = Math.random().toString(36).slice(2).substr(0, 5);
    this.join(room);

    console.log("create room: " + room);
    
    // Create chessboard and room data
    const chess = new Chess();
    chess.initBoard();
    chess.beginGame();
    var data = {
        board: chess,
        isFull: false,
        ids: {},
    };

    data.ids[this.id] = undefined;

    // Create references
    roomData[room] = data;
    sockRoom[this.id] = room;

    // Send room code
    this.emit('createRoom', room);
}

function joinRoom(id) {
    if (isInRoom(this) || id.length < 1) return;

    // Check regex
    if (!idRegex.test(id) && roomData[id] == undefined && !roomData[id].isFull) {
        console.log(`Room join request with length ${id} denied`);
        sendInfo(this, "Room invalid", "error");
        return;
    }

    roomData[id].ids[this.id] = undefined;

    // Send room code
    this.emit('createRoom', id);

    // Store reference
    sockRoom[this.id] = id;
    
    console.log(`${this.id} Joined room ${id}`);
    roomData[id].isFull = true;
    this.join(id);

    // Start the game
    startGame(this.nsp, id);
}

function movePiece(data) {
    const room = sockRoom[this.id];
    const roomRef = roomData[room];
    
    const boardRef = roomRef.board;
    // Check correctness of the data
    if (roomRef.ids[this.id] == boardRef.order && // Check if correct turn 
        boardRef.movePiece(data.pos, data.tgt) // Try to move the piece
        ) {
        sendBoardData(this.nsp, room);
    } else {
        // Send error message
        sendInfo(this, "Move not valid", "error");
    }
}

function disconnect() {
    console.log("Client disconnect: " + this.id + " deleting room data references");

    const room = sockRoom[this.id];

    // Delete data
    delete roomData[room];
    delete sockRoom[this.id];

    // Broadcast room is closed
    sendInfo(this.to(room), "A player disconnected, game is stopped.", "error");
}

/*
    Utility functions
*/

function sendInfo(sock, msg, type="info") {
    sock.emit('notif', {
        type: type,
        msg: msg
    });
}

// Function to check if a client is already in a room
function isInRoom(sock) {
    return (sockRoom[sock.id] !== undefined);
}

// Start game for the room
function startGame(sock, id) {
    console.log("Starting game at room: " + id);
    const room = roomData[id];

    const payload = {
        board: room.board.getBoardData(),
    }

    // Randomize color
    payload.color = (Math.random() >= 0.5);

    // Send to all the clients
    for (let id in room.ids) {
        console.log(`Sent to ${id}`);
        sock.to(id).emit('startGame', payload);

        // Register colors to object
        room.ids[id] = payload.color;

        payload.color = !payload.color;
    }
}

// Send board data
function sendBoardData(sock, id) {
    sock.emit('updateBoard', roomData[id].board.getBoardData());
}