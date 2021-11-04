const url = window.location.origin;
let socket = io.connect(url);

var myTurn = true;
var symbol;
var isTie = false;

// A function that returns the current game board mode.
function getBoardState() {
    // An object consisting of all the Xs and circles on the board.
    var obj = {};

    // For each button on the board, pull out what is displayed on it and insert it into the object.
    $(".board button").each(function() {
        obj[$(this).attr("id")] = $(this).text() || "";
    });
    return obj;
}

// A function that checks if the game is over.
function isGameOver() {
    var state = getBoardState();

    // The only options in the tic tac toe game to win.
    var matches = ["XXX", "OOO"];

    // All the possible combinations that will win the game.
    var rows = [
            state.a0 + state.a1 + state.a2,
            state.b0 + state.b1 + state.b2,
            state.c0 + state.c1 + state.c2,
            state.a0 + state.b1 + state.c2,
            state.a2 + state.b1 + state.c0,
            state.a0 + state.b0 + state.c0,
            state.a1 + state.b1 + state.c1,
            state.a2 + state.b2 + state.c2
        ];

    // Loop over all the possible combinations to win and check if any of them won.
    for (var i = 0; i < rows.length; i++) {
        if (rows[i] === matches[0] || rows[i] === matches[1]) {
            return true;
        }
    }

    // Check if the board is still not full.
    if (state.a0 === "" || state.a1 === "" || state.a2 === "" ||
        state.b0 === "" || state.b1 === "" || state.b2 === "" ||
        state.c0 === "" || state.c1 === "" || state.c2 === "" ){
        return false;
    }

    // The board is full and no one has won, so it's a tie.
    isTie = true;
    return true;
}

function renderTurnMessage() {
    // Disable the board if it is the Rival player turn
    if (!myTurn) {
        $("#messages").text("It's not your turn ...");
        $(".board button").attr("disabled", true);

        // Enable the board if it is your turn
    } else {
        $("#messages").text("It's your turn.");
        $(".board button").removeAttr("disabled");
    }
}

function makeMove(e) {
    e.preventDefault();

    // It's not your turn
    if (!myTurn) {
        return;
    }

    // If the button is already selected.
    if ($(this).text().length) {
        return;
    }

    // Sends the move to the server.
    socket.emit("make.move", {
        symbol: symbol,
        position: $(this).attr("id")
    });
}
// A function which colors the background of the winning line.
function colorWinRow() {
    var state = getBoardState();

    // The only options in the tic tac toe game to win.
    var matches = ["XXX", "OOO"];

    // All the possible combinations that will win the game.
    // And the ID'S of the board buttons.
    var rows = [
        {str : state.a0 + state.a1 + state.a2, arr: ['a0' , 'a1' , 'a2'] },
        {str : state.b0 + state.b1 + state.b2, arr: ['b0' , 'b1' , 'b2'] },
        {str : state.c0 + state.c1 + state.c2, arr: ['c0' , 'c1' , 'c2'] },
        {str : state.a0 + state.b1 + state.c2, arr: ['a0' , 'b1' , 'c2'] },
        {str : state.a2 + state.b1 + state.c0, arr: ['a2' , 'b1' , 'c0'] },
        {str : state.a0 + state.b0 + state.c0, arr: ['a0' , 'b0' , 'c0'] },
        {str : state.a1 + state.b1 + state.c1, arr: ['a1' , 'b1' , 'c1'] },
        {str : state.a2 + state.b2 + state.c2, arr: ['a2' , 'b2' , 'c2'] }
    ];

    // Loop over all the possible combinations to win and color the winning line.
    for (var i = 0; i < rows.length; i++) {
        if (rows[i].str === matches[0] || rows[i].str === matches[1]) {
            //color win row
            rows[i].arr.forEach(id => {
                document.getElementById(id).style.backgroundColor = ("#66ff66");
            })

        }
    }
}

// Event is called when either player makes a move
socket.on("move.made", function(data) {
    // Displays the symbol on the selected button.
    $("#" + data.position).text(data.symbol);

    // If the symbol is equal to my symbol then it means that the turn is that of the Rival player.
    myTurn = data.symbol !== symbol;

    // If the game is not over yet, display whose turn to play.
    if (!isGameOver()) {
        renderTurnMessage();

        // If the game is over.
    } else {
        // A message will be displayed that the game is over in a tie.
        if (isTie){
            $("#messages").text("Game over. It's a Tie.");
        }
        else {
            // A message will be displayed to the losing player.
            if (myTurn) {
                $("#messages").text("Game over. You lost.");

                // A message will be displayed to the winning player.
            } else {
                $("#messages").text("Game over. You won!");
            }
            colorWinRow();
        }

        // Disable the game board.
        $(".board button").attr("disabled", true);
    }
});

// Initialize the initial state of the board, when the game start.
socket.on("game.begin", function(data) {
    isTie = false;

    // The server will asign "X" or "O" to the player.
    symbol = data.symbol;

    // Let the player with the "X" symbol start the game.
    myTurn = symbol === "X";
    renderTurnMessage();
});

// Disable the board if the game partner leaves.
socket.on("partner.left", function() {
    $("#messages").text("Your partner has left the game.");
    $(".board button").attr("disabled", true);
});

$(function() {
    $(".board button").attr("disabled", true);
    $(".board button").on("click", makeMove);
});
