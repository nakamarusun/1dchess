const CONSTANTS = {
    B_BOARD_COL: "#60ba59",
    W_BOARD_COL: "#f9fae8",
};

var IO = {

    // Main socket to the server
    socket: undefined,
    $notif: $("#notif"),

    init: function() {
        if (IO.socket !== undefined) return;

        IO.socket = io(window.location + "/main");
        IO.bindEvents();
    },

    bindEvents: function() {
        IO.socket.on('notif', IO.handleNotif);
        IO.socket.once('createRoom', IO.createdRoom);
        IO.socket.once('startGame', IO.startGame);
        IO.socket.on('updateBoard', IO.updateBoard);

        IO.socket.on('disconnect', IO.disconnect);
    },

    handleNotif: function(data) {
        // Display notification on the browser
        IO.$notif.text(data.msg);
        var color;
        switch (data.type) {
            case "error":
                color = "#f04f3a";
                break;
            case "info":
                color = "#489ff0";
                break;
            default:
                color = "#489ff0";
                break;
        }
        IO.$notif.css('background-color', color);
        IO.$notif.fadeIn(200);
        setTimeout(() => {IO.$notif.fadeOut(500)}, 5000);
    },

    createdRoom: function(id) {
        $("#gameid").text(id);
        app.displayGame();
    },

    startGame: function(data) {
        app.board.applyBoardData(data.board);
        // Change color
        app.selfColor = data.color;
        app.createBoard();
    },

    updateBoard: function(data) {
        app.board.applyBoardData(data);
        app.board.refreshMoves();
        app.rebuildBoard();
    },

    disconnect: function() {
        console.log("Disconnect");
    },

}

var app = {

    /*
        App buttons and DOM controllers
    */

    $doc: $(document),
    $boardArr: [],
    $roombox: $("#joinroom"),

    board: undefined,
    selfColor: ColorE.WHITE,

    init: function() {
        app.bindEvents();
        app.board = new ChessBoard1D();
        // this.startGame();
    },

    bindEvents: function() {
        app.$doc.on('click', '#createroom', app.createRoom);
        app.$doc.on('click', '#joinbtn', app.joinRoom);
    },

    createRoom: function() {
        IO.init();

        // Send a request to create a room to the server
        IO.socket.emit('createRoom');
    },

    joinRoom: function() {
        IO.init();
        IO.socket.emit('joinRoom', app.$roombox.val());
    },

    displayGame: function() {
        $("#roomidbox").hide();
        const boardRef = $("#mainboard");
        boardRef.css("display", "flex");
        $("#uibar").css('display', 'flex');
    },

    createBoard: function() {
        const boardRef = $("#mainboard");
        // create board
        for (var i=0; i<app.board.board.length; i++) {
            var button = $("<button></button>");
            button.css("background-color", i%2==0 ? CONSTANTS.W_BOARD_COL : CONSTANTS.B_BOARD_COL);
            app.$boardArr.push(button);
            boardRef.append(button);
        }

        // Begins the game
        app.board.beginGame();
        
        // Rebuild the board draw
        app.rebuildBoard();
    },

    // Reset board marker and delete all "click.move" events
    // "click.move" events are button events that allow movement of piece,
    // visible in blue circle
    resetMarker: function() {
        for (let cell of app.$boardArr) {
            cell.empty(); // Empty the marker
            cell.off("click.move"); // Empty the move events
        }
    },

    // Wrapper for moving a piece and metadatas
    movePiece: function(pos, target) {
        console.log(`Move from ${pos} to ${target}`);
        app.board.movePiece(pos, target);
        app.board.order = !app.board.order;
        app.rebuildBoard();
    },

    // Redraw the chess pieces in the board
    // newBoard: Replaces the current board with the board specified
    rebuildBoard: function() {
        console.log(app.selfColor);
        console.log(app.board.order);
        // Decide whether the code should display hints and triggers for user color
        const calcMove = app.board.order == app.selfColor;

        // change text on current turn
        const curTurn = (app.board.order == ColorE.WHITE ? "White " : "Black ") + (calcMove ? "(You!)" : "(Enemy)");
        $("#currentturn").text(curTurn);

        const board = app.board.board
        for (let i in board) {
            // This section redraws the board pices by css background-image
            var img = "url('./assets/" + (board[i].color == ColorE.WHITE ? "W" : "B");
            switch(board[i].piece) {
                case PieceE.ROOK:
                    img += "R";
                    break;
                case PieceE.HORS:
                    img += "N";
                    break;
                case PieceE.KING:
                    img += "K";
                    break;
            }
            img += ".png')";
            if (board[i].piece == PieceE.NONE) img = "";
            app.$boardArr[i].css("background-image", img);


            // This section add button events
            // Reset function for every button
            app.$boardArr[i].off("click");
            app.$boardArr[i].on("click", this.resetMarker.bind(this));

            // Register click event to each piece we own.
            if (calcMove && board[i].color==app.selfColor && board[i].piece!=PieceE.NONE) {
                app.$boardArr[i].on("click", () => {
                    // Add markers and move click event to every possible move in the current piece
                    for (let pos of this.board.possibleMoves[i]) {
                        this.$boardArr[pos].append($("<div class='movemarker'></div>"));
                        this.$boardArr[pos].on("click.move", () => {
                            IO.socket.emit('movePiece', {
                                pos: i,
                                tgt: pos,
                            });
                        });
                    }
                });
            }
        }
    }

}

app.init();
