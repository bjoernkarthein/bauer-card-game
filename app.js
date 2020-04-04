let express = require('express');
let app = express();
let serv = require('http').Server(app);

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

serv.listen(2000);
console.log("Server started");

let SOCKET_LIST = {};
let PLAYER_LIST = {};

// Player class where ID is an unique identifier for each player and NAME is the displayed name in game
class Player {
    constructor(id, name) {
        this.name = name;
        this.cards = [];
        this.score = 0;
        this.id = id;
    }
}


// Deck class to represent the card deck
class Deck {
    constructor() {
        this.cards = [];
    }

    // creates a deck with the desired cards
    create() {
        let suits = ["Karo", "Herz", "Pik", "Kreuz"];
        let rank = ['10','Q','K','A','B'];
        let values = [1,2,3,4,5];

        for (let i = 0; i < suits.length; i++) {
            for (let j = 0; j < rank.length; j++) {
                this.cards.push(new Card(suits[i], rank[j], values[j]));
            }
        }
    }

    // shuffles the created deck
    shuffle() {
        let j, x, i;
        for (i = this.cards.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            x = this.cards[i];
            this.cards[i] = this.cards[j];
            this.cards[j] = x;
        }
    }
}

function messageAll (channel, data) {
    for (let i in SOCKET_LIST) {
        let socketC = SOCKET_LIST[i];
        socketC.emit(channel, data);
    }
}

let io = require('socket.io') (serv, {});
let maxPlayers = 4;
let currentPlayers = 0;
let pack = [];

io.sockets.on('connection', function (socket) {

    if (currentPlayers >= maxPlayers) {
        console.log("Maximum Number of Players");
        return;
    }

    // adding the new socket to the socket list and using the player count as an id
    // it must be searched for available ids not just incremented to avoid problems on reconnection
    socket.id = currentPlayers;
    SOCKET_LIST[socket.id] = socket;

    // creating a new player with the socket.id, adding it to the playerList and increasing player count
    let player = new Player(socket.id, "Player" + socket.id);
    PLAYER_LIST[socket.id] = player;
    currentPlayers++;
    console.log(player.name + " connected");

    // adding the newly connected player to the pack that is sent
    for (let i in PLAYER_LIST) {
        let player = PLAYER_LIST[i];
        pack[player.id] = {
            id: player.id,
            name: player.name,
            score: player.score,
            cards: player.cards
        };
    }

    //sending the pack to all existing sockets
    for (let i in SOCKET_LIST) {
        let socket = SOCKET_LIST[i];
        socket.emit('playerConnected', pack);
    }

    socket.emit('playerConnectedS', {
        id: player.id,
        name: player.name,
        score: player.score,
        cards: player.cards
    });

    // handling the disconnect of a client
    socket.on('disconnect', function () {
        let player = PLAYER_LIST[socket.id];
        console.log(player.name +" disconnected");

        delete SOCKET_LIST[socket.id];
        delete PLAYER_LIST[socket.id];

        for (let i in SOCKET_LIST) {
            let socketC = SOCKET_LIST[i];
            socketC.emit('playerDisconnected', socket.id);
        }
        currentPlayers--;
    });

    socket.on('changeName', function (newName) {
        let player = PLAYER_LIST[socket.id];
        let oldName = player.name;
        player.name = newName;
        console.log(oldName + " changed his name to " + newName);
        messageAll('changeName', {
            id: socket.id,
            name: newName
        });
    })

    socket.on('gameStarted', function () {
        let deck = new Deck();
        deck.shuffle();
    })
});