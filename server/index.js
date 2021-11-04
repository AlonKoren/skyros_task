const http = require("http");
const express = require("express");
const app = express();
const socketIo = require("socket.io");
const fs = require("fs");

const server = http.Server(app).listen(8080);
const io = socketIo(server);
const clients = {};

app.use(express.static(__dirname + "/../client/"));
app.use(express.static(__dirname + "/../node_modules/"));

app.get("/", (req, res) => {
    fs.createReadStream(__dirname + "/../client/index.html").pipe(res);
});

//Defines a function called addClient which receives a socket and inserts it into the array of players.
const addClient = socket => {
    console.log("New client connected", socket.id);
    clients[socket.id] = socket;
};

//Defines a function called removeClient which receives a socket and deletes it from the array of players.
const removeClient = socket => {
    console.log("Client disconnected", socket.id);
    delete clients[socket.id];
};

//This function will be called when a connection is established.
io.sockets.on("connection", socket => {
    //Adding a new player.
    addClient(socket);

    // This function will be called when a player disconnect.
    socket.on("disconnect", () => {
        // remove the client socket (player socket)
        removeClient(socket);
    });
});

// dictionary of players that contain for each player his rival, symbol and his socket
var players = {};
var unmatched = undefined;

function enterTheGame(socket) {
    // Add the player to our object of players
    players[socket.id] = {
        // Your Rival player will either be the socket that is currently unmatched, or it will be 'undefined' if no players are unmatched
        rivalPlayer: unmatched,

        // The symbol will become 'O' if the player is unmatched
        symbol: "X",

        // The socket that is associated with this player
        socket: socket
    };

    // if there is any player waiting to play
    if (unmatched) {
        // connect player to his rival and give him his game symbol
        players[socket.id].symbol = "O";
        players[unmatched].rivalPlayer = socket.id;
        // say that is there no waiting player to play
        unmatched = undefined;
    } else {
        // if there is no player waiting to play, say that there is a player waiting to play
        unmatched = socket.id;
    }
}

// Returns the Rival Player socket
function getRivalPlayer(socket) {
    let rivalPlayerID = players[socket.id].rivalPlayer;
    if (!rivalPlayerID) {
        return;
    }
    return players[rivalPlayerID].socket;
}

// This function will be called when a connection is established.
io.on("connection", function(socket) {
    // connect socket player to the game
    enterTheGame(socket);

    // Once the socket has an Rival Player, we begin.
    // else let the socket player "wait"
    var socket_rival = getRivalPlayer(socket)
    if (socket_rival) {
        // let the game begin between players
        socket.emit("game.begin", {
            symbol: players[socket.id].symbol
        });

        socket_rival.emit("game.begin", {
            symbol: players[socket_rival.id].symbol
        });
    }

    // Waits for a move to be made and emits an event to the players after the move is completed.
    socket.on("make.move", function(data) {
        var socket_rival = getRivalPlayer(socket)
        if (!socket_rival) { // if there is no rival, do nothing (should not happened EVER!)
            return;
        }
        socket.emit("move.made", data);
        socket_rival.emit("move.made", data);
    });

    // Emit an event to the Rival Player when the player leaves the game.
    socket.on("disconnect", function() {
        var socket_rival = getRivalPlayer(socket)
        if (socket_rival) {
            socket_rival.emit("partner.left");
        }
    });
});
