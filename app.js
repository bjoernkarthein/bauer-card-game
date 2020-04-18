let express = require('express');
let app = express();
let serv = require('http').Server(app);
let PORT = process.env.PORT || 2000;    //retrieving the PORT for the heroku application

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

serv.listen(PORT);
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

class Team {
    constructor() {
        this.members = {};
        this.memberCount = 0;
    }

    add(player) {
        this.members[this.memberCount] = player;
        this.memberCount++;
    }

    remove(index) {
        delete this.members[index];
        this.memberCount--;
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
        let rank = ['10', 'Q', 'K', 'A', 'B'];
        let values = [1, 2, 3, 4, 5];

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

// class that represents a Card
class Card {
    constructor(suit, rank, value) {
        this.suit = suit;
        this.rank = rank;
        this.value = value;
    }
}

// actual game controller
class Board {

    constructor() {
        this.deck = new Deck();
        this.cardsInTheMiddle = [];
        this.firstCardPlayed;
        this.round = 0;
        this.turn = 0;
        this.trumpf = "";
        this.trumpfChosen = false;
        this.currentHighestCard;
        this.currentBestPlayer;
    }

    startGame() {
        this.deck.create();
        this.deck.shuffle();
        console.log("deck was created");
        this.handCards(3);
        console.log("first three cards handed out");
    }

    handCards(amount) {
        for (let j in PLAYER_LIST) {
            let player = PLAYER_LIST[j];
            for (let i = 0; i < amount; i++) {
                let card = this.deck.cards.pop()
                player.cards.push(card);
            }
        }
    }

    checkWhoWins(playedCard) {

        // Fall für erste gespielte Karte
        if (playedCard == this.firstCardPlayed) {
            this.currentHighestCard = playedCard;
            this.currentBestPlayer = PLAYER_LIST[this.turn];
            return;
        }

        // Fall für bedienen mit höherem Wert
        if (playedCard.suit == this.currentHighestCard.suit && playedCard.value > this.currentHighestCard.value) {
            this.currentHighestCard = playedCard;
            this.currentBestPlayer = PLAYER_LIST[this.turn];
            return;
        }

        // Fall für abtrumpfen
        if (playedCard.suit == this.trumpf && this.currentHighestCard.suit != this.trumpf) {
            this.currentHighestCard = playedCard;
            this.currentBestPlayer = PLAYER_LIST[this.turn];
            return;
        }
    }

    checkIfPossible(playedCard) {
        if (this.firstCardPlayed == null) {
            return true;
        }

        //theoretisch müsste man noch schauen ob man nur einen der Bauern auf der Hand hat der müsste dann gepielt werden
        if (this.checkForSameSuit(this.firstCardPlayed.suit) && this.firstCardPlayed.suit !== playedCard.suit) {
            switch (this.trumpf) {
                case "Herz":
                    return playedCard.suit == "Karo" && playedCard.rank == "B";
                case "Karo":
                    return playedCard.suit == "Herz" && playedCard.rank == "B";
                case "Pik":
                    return playedCard.suit == "Kreuz" && playedCard.rank == "B";
                case "Kreuz":
                    return playedCard.suit == "Pik" && playedCard.rank == "B";
                default:
                    return false;
            }
        }
        return true;
    }

    checkForSameSuit(suit) {
        let sameSuit = false;

        for (let i = 0; i < PLAYER_LIST[this.turn].cards.length; i++) {
            if (PLAYER_LIST[this.turn].cards[i] == null) {
                continue;
            }
            sameSuit = sameSuit || (PLAYER_LIST[this.turn].cards[i].suit === suit);
        }
        return sameSuit;
    }

    nextStich() {
        this.turn = parseInt(this.currentBestPlayer.id);
        totalTurns = currentPlayers;

        this.cardsInTheMiddle = [];
        this.firstCardPlayed = null;
        this.currentBestPlayer = null;
        this.currentHighestCard = null;
    }
}

// sends DATA to all clients via the specified CHANNEL
function messageAll(channel, data) {
    for (let i in SOCKET_LIST) {
        let socketC = SOCKET_LIST[i];
        socketC.emit(channel, data);
    }
}

// searches for next available index and returns it
function findNextID() {
    for (i in ids) {
        let available = ids[i];
        if (available) {
            ids[i] = false;
            return i;
        }
    }
    return -1;
}

//used for little delays
function wait(ms) {
    let d = new Date();
    let d2 = null;
    do { d2 = new Date(); }
    while (d2 - d < ms);
}

function determineTeam(playerId) {
    if (teamOne.members[0].id == playerId || teamOne.members[1].id == playerId) {
        return [teamOne.members[0].id, teamOne.members[1].id];
    }

    if (teamTwo.members[0].id == playerId || teamTwo.members[1].id == playerId) {
        return [teamTwo.members[0].id, teamTwo.members[1].id];
    }
}

// handles the display of stossen, retour and hoch for the appropriate teams
function determineAction(action) {
    let ids = [];
    switch (action) {
        case 'stossen':
            ids = determineTeam((startingPlayer + 1) % currentPlayers);
            return ids;
        case 'retour':
            ids = determineTeam(startingPlayer);
            return ids;
        case 'hoch':
            ids = determineTeam((startingPlayer + 1) % currentPlayers);
            return ids;
        default: return -1;
    }
}

let io = require('socket.io')(serv, {});
let currentPlayers = 0;
let totalTurns = 0;
let totalCardsPlayed = 0;
let startingPlayer = 0;
let ids = [true, true, true, true];
let pack = [];
let gameBoard;
let teamOne = new Team();
let teamTwo = new Team();
let stossen;
let retour;
let hoch;
let hochIds;
let stossenIds;
let retourIds;

io.sockets.on('connection', function (socket) {

    // adding the new socket to the socket list and using the player count as an id
    socket.id = findNextID();
    if (socket.id === -1) {
        console.log("Maximum number of players reached");
        return;
    }
    SOCKET_LIST[socket.id] = socket;

    // creating a new player with the socket.id, adding it to the playerList and increasing player count
    let player = new Player(socket.id, "Player" + socket.id);
    PLAYER_LIST[socket.id] = player;
    currentPlayers++;
    totalTurns++;
    console.log(player.name + " connected");

    // adding players to the corresponding teams
    if (currentPlayers % 2 != 0) {
        teamOne.add(player);
        console.log(player.name + " joined Team 1");
    } else {
        teamTwo.add(player);
        console.log(player.name + " joined Team 2");
    }

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
    messageAll('playerConnected', pack);

    socket.emit('playerConnectedS', {
        id: player.id,
        name: player.name,
        score: player.score,
        cards: player.cards
    });

    // handling the disconnect of a client
    // TODO: disconnect and reconnect issues need to be resolved
    socket.on('disconnect', function () {
        let player = PLAYER_LIST[socket.id];
        console.log("\n --------------------- \n");
        console.log(player.name + " disconnected");

        delete SOCKET_LIST[socket.id];
        delete PLAYER_LIST[socket.id];
        ids[socket.id] = true;

        messageAll('playerDisconnected', socket.id);
        currentPlayers--;
        totalTurns--;
    });

    // handles the name change of a player
    socket.on('changeName', function (newName) {
        let player = PLAYER_LIST[socket.id];
        let oldName = player.name;
        player.name = newName;
        console.log(oldName + " changed his name to " + newName);
        messageAll('changeName', {
            id: socket.id,
            name: newName
        });
    });

    // starts the game
    socket.on('gameStarted', function () {

        if (currentPlayers != 4) {
            messageAll('dialogueMessage', {
                duration: 4000,
                title: "Fehler",
                text: "Spiel kann nicht gestartet werden, da nicht genügend Spieler vorhanden sind (" + currentPlayers + "/4)."
            });

            return;
        }

        stossen = 0;
        retour = 0;
        hoch = 0;
        hochIds = [];
        stossenIds = [];
        retourIds = [];

        console.log("\n --------------------- \n");
        messageAll('dialogueMessage', {
            duration: 3000,
            title: "Spiel Information",
            text: "Spiel wurde von " + PLAYER_LIST[socket.id].name + " gestartet."
        });

        for (let i in PLAYER_LIST) {
            let player = PLAYER_LIST[i];
            player.cards = [];
        }

        gameBoard = new Board();
        gameBoard.startGame();

        for (let i in SOCKET_LIST) {
            let socketC = SOCKET_LIST[i];
            socketC.emit('gameStarted', PLAYER_LIST[socketC.id]);
        }
        
        let socketTrumpf = SOCKET_LIST[startingPlayer];
        socketTrumpf.emit('chooseTrumpf');
    });

    // handles the choosing of trumpf
    socket.on('chooseTrumpf', function (suit) {
        gameBoard.trumpf = suit;
        gameBoard.trumpfChosen = true;
        console.log("trumpf is " + suit);

        gameBoard.handCards(2);
        console.log("last 2 cards handed out");
        for (let i in SOCKET_LIST) {
            let socketC = SOCKET_LIST[i];
            socketC.emit('trumpfChosen', PLAYER_LIST[socketC.id]);
        }

        messageAll('blockPlayers', {
            turn: -1,
            name: PLAYER_LIST[startingPlayer].name
        });

        messageAll('dialogueMessage', {
            duration: 2000,
            title: "Spiel Information",
            text: "Trumpf ist " + suit + "."
        });

        stossenIds = determineAction('stossen');
        if (stossenIds == -1) {
            return;
        }

        for (let i = 0; i < stossenIds.length; i++) {
            let socketX = SOCKET_LIST[stossenIds[i]];
            socketX.emit('stossen');
        }
    });

    socket.on('stossen', function (value) {
        if (value) {
            for (let i = 0; i < stossenIds.length; i++) {
                let socketX = SOCKET_LIST[stossenIds[i]];
                socketX.emit('hide', 'stossen');
            }

            messageAll('dialogueMessage', {
                duration: 3000,
                title: "Spiel Information",
                text: PLAYER_LIST[socket.id].name + " hat gestoßen."
            });

            retourIds = determineAction('retour');
            if (retourIds == -1) {
                return;
            }

            for (let i = 0; i < retourIds.length; i++) {
                let socketX = SOCKET_LIST[retourIds[i]];
                socketX.emit('retour');
            }
        }

        stossen++;
        if (stossen >= 2) {
            messageAll('blockPlayers', {
                turn: startingPlayer,
                name: PLAYER_LIST[startingPlayer].name
            });
        }
    });

    socket.on('retour', function (value) {
        if (value) {
            for (let i = 0; i < retourIds.length; i++) {
                let socketX = SOCKET_LIST[retourIds[i]];
                socketX.emit('hide', 'retour');
            }

            messageAll('dialogueMessage', {
                duration: 3000,
                title: "Spiel Information",
                text: PLAYER_LIST[socket.id].name + " hat retour gegeben."
            });

            hochIds = determineAction('hoch');
            if (hochIds == -1) {
                return;
            }

            for (let i = 0; i < hochIds.length; i++) {
                let socketX = SOCKET_LIST[hochIds[i]];
                socketX.emit('hoch');
            }
        }

        retour++;
        if (retour >= 2) {
            messageAll('blockPlayers', {
                turn: startingPlayer,
                name: PLAYER_LIST[startingPlayer].name
            });
        }
    });

    socket.on('hoch', function (value) {
        if (value) {
            for (let i = 0; i < hochIds.length; i++) {
                let socketX = SOCKET_LIST[hochIds[i]];
                socketX.emit('hide', 'hoch');
            }

            messageAll('dialogueMessage', {
                duration: 3000,
                title: "Spiel Information",
                text: PLAYER_LIST[socket.id].name + " hat hoch gesagt."
            });

            messageAll('blockPlayers', {
                turn: startingPlayer,
                name: PLAYER_LIST[startingPlayer].name
            });
        }

        hoch++;
        if (hoch >= 2) {
            messageAll('blockPlayers', {
                turn: startingPlayer,
                name: PLAYER_LIST[startingPlayer].name
            });
        }
    });

    socket.on('playCard', function (id) {
        if (gameBoard.trumpf == "") {
            return;
        }

        let currentPlayer = PLAYER_LIST[socket.id];
        let playedCard = currentPlayer.cards[id];

        if (gameBoard.checkIfPossible(playedCard)) {
            if (gameBoard.cardsInTheMiddle[0] == null) {
                gameBoard.firstCardPlayed = playedCard;
            }

            gameBoard.cardsInTheMiddle.push(playedCard);
            messageAll('updateStack', {
                card: playedCard,
                index: currentPlayers - totalTurns
            });
            gameBoard.checkWhoWins(playedCard);
            currentPlayer.cards[id] = null;
            socket.emit('playCard', {
                cP: currentPlayer,
                pC: playedCard,
                id: id
            });
            totalTurns--;
            totalCardsPlayed++;

            if (totalCardsPlayed == currentPlayers * 5) {
                wait(3000);
                messageAll('clearStack', null);
                socket.emit('nextRound');
                startingPlayer = (startingPlayer + 1) % currentPlayers;
                return;
            }

            if (totalTurns == 0) {
                wait(3000);
                gameBoard.nextStich();
                messageAll('clearStack', null);
            } else {
                gameBoard.turn = (gameBoard.turn + 1) % currentPlayers;
            }
            messageAll('blockPlayers', {
                turn: gameBoard.turn,
                name: PLAYER_LIST[gameBoard.turn].name
            });
        } else {
            socket.emit('falseCard');
        }
    });
});