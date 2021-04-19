// Enums
const PieceE = Object.freeze({
    NONE: 0,
    ROOK: 1,
    KING: 2,
    HORS: 3,
});

const ColorE = Object.freeze({
    WHITE: false,
    BLACK: true,
});

// Make chess piece
function makePiece(col, piece) {
    return {color: col, piece: piece};
}

class ChessBoard1D {

    static STARTCOLOR = ColorE.WHITE;

    // Make the default board
    constructor() {
        // Board
        this.board;

        // Current order color
        this.order;

        // Possible moves for the current order
        this.possibleMoves = {};
    }

    // Initialize default board
    initBoard() {
        // Fill empty board
        var board = [];
        for (var i = 0; i < 8; i++) {
            board.push(makePiece(ColorE.WHITE, PieceE.NONE));
        }
        

        // Fill up the board with default layout
        board[7] = makePiece(ColorE.WHITE, PieceE.KING);
        board[6] = makePiece(ColorE.WHITE, PieceE.HORS);
        board[5] = makePiece(ColorE.WHITE, PieceE.ROOK);

        board[0] = makePiece(ColorE.BLACK, PieceE.KING);
        board[1] = makePiece(ColorE.BLACK, PieceE.HORS);
        board[2] = makePiece(ColorE.BLACK, PieceE.ROOK);

        this.board = board;
    }

    // Begin the game with a color
    beginGame() {
        this.order = ChessBoard1D.STARTCOLOR;
        this.refreshMoves();
    }

    // Reconstructs all the move currently.
    refreshMoves() {
        // Reset possible moves
        this.possibleMoves = {};

        var pos = 0;
        for (let cell of this.board) {
            // Choose the current pieces, and reconstruct possible moves.
            if (cell.color == this.order && cell.piece != PieceE.NONE) {
                // Move set depending on piece
                var moveSet;

                // Add the moves according to the piece type
                switch (cell.piece) {
                    case PieceE.HORS:
                    moveSet = [2, -2];
                    break;

                    case PieceE.ROOK:
                    moveSet = [];
                    const board = this.board;
                    for (var i = 1;; i++) {
                        if (board[pos+i] === undefined) break;
                        if (board[pos+i].piece != PieceE.NONE) {
                            if (board[pos+i].color != cell.color) moveSet.push(i);
                            break;
                        }
                        moveSet.push(i);
                    }
                    for (var i = -1;; i--) {
                        if (board[pos+i] === undefined) break;
                        if (board[pos+i].piece != PieceE.NONE) {
                            if (board[pos+i].color != cell.color) moveSet.push(i);
                            break;
                        }
                        moveSet.push(i);
                    }
                    break;

                    case PieceE.KING:
                    moveSet = [1, -1];
                    break;

                    default:
                    break;
                }

                this.possibleMoves[pos] = this.getValidMoves(pos, moveSet);
            }

            pos++;
        }
    }

    // Simple function to check whether the pos is inside the board
    withinBounds(pos) {
        return (pos > -1 && pos < 8);
    }

    getValidMoves(pos, moveArray) {
        let board =  this.board;
        var validMoves = [];

        // Iterate movearray
        for (let move of moveArray) {
            const target = pos + move;
            if (
                this.withinBounds(target) &&
                this.checkKingSafety(pos, target) &&
                (board[target].piece == PieceE.NONE || board[target].color == !board[pos].color)
            ) {
                validMoves.push(target);
            }
        }

        return validMoves;
    }

    // Basically tries a move, and check whether the move compromises the king.
    checkKingSafety(pos, target) {
        const board = this.board;
        const tarP = board[target].piece;
        const tarC = board[target].color;
        // Get current color
        const kingColor = board[pos].color;

        // Get king location
        var kingPos = -1;
        kingPos = board.find((val) => { kingPos++; return val.color == kingColor && val.piece == PieceE.KING }) && kingPos;
        // Try move
        this.replacePiece(pos, target);

        // Check rook here
        // If danger is true, then move is not possible.
        var danger = false;
        for (var i = 1;; i++) {
            if (board[kingPos+i] === undefined) break;
            if (board[kingPos+i].piece != PieceE.NONE) {
                if (board[kingPos+i].color != board[kingPos].color) danger=true;
                break;
            }
        }
        for (var i = -1;; i--) {
            if (board[kingPos+i] === undefined) break;
            if (board[kingPos+i].piece != PieceE.NONE) {
                if (board[kingPos+i].color != board[kingPos].color) danger=true;
                break;
            }
        }

        // Redo move
        this.replacePiece(target, pos);
        board[target].piece = tarP;
        board[target].color = tarC;
        return !danger;
    }

    // Move while also checking whether the move is possible and refresh
    movePiece(pos, target) {
        // Check if there is a piece there
        // And the move is in its moveset
        if (this.possibleMoves[pos] !== undefined &&
            this.possibleMoves[pos].find((val) => val == target) !== undefined) {
            this.replacePiece(pos, target);
            // Switch moves
            this.order = !this.order;
            this.refreshMoves();
            return true;
        }
        return false;
    }

    // Move piece without checking
    replacePiece(pos, target) {
        // Move the piece
        const board = this.board;
        board[target].color = board[pos].color;
        board[target].piece = board[pos].piece;

        // Set current as none
        board[pos].piece = PieceE.NONE;
    }

    // Get board data to be sent
    getBoardData() {
        return {board: this.board, order: this.order};
    }

    // Apply board data from getBoardData
    applyBoardData(data) {
        this.board = data.board;
        this.order = data.order;
    }
}

module.exports = ChessBoard1D;