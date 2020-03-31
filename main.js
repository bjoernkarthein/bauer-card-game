class Card {
    constructor(suit, rank, value) {
        this.suit = suit;
        this.rank = rank;
        this.value = value;
    }
}

class Deck {
    constructor() {
        this.cards = [];
    }

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

    shuffle() {
        var j, x, i;
        for (i = this.cards.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            x = this.cards[i];
            this.cards[i] = this.cards[j];
            this.cards[j] = x;
        }
    }
}

//class representing a player
class Player {
    constructor(name, aiFlag) {
        this.name = name;
        this.isAi = aiFlag;
        this.cards = [];
        this.score = 0;
    }
}

//actual game controller
class Board {

    constructor() {
        this.players = [];
        this.deck = new Deck();
        this.cardInTheMiddle;
        this.firstCardPlayed;
        this.round = 0;
        this.turn = 0;
        this.trumpf = "";
        this.trumpfChosen = false;
        this.currentHighestCard;
        this.currentBestPlayer;
    }

    startGame(playerOne, playerTwo, playerThree, playerFour) {
        this.players.push(new Player(playerOne,false));
        this.players.push(new Player(playerTwo,false));
        this.players.push(new Player(playerThree,false));
        this.players.push(new Player(playerFour,false));
        document.getElementById('playerName').innerHTML = this.players[this.turn].name;

        this.deck.create();
        this.deck.shuffle();
        console.log(this.deck.cards);

        this.hideAllOtherHands(this.turn+1);
        this.handCards(3);
    }

    handCards(amount) {
        this.players.forEach(player => {
            for (let i  = 0; i < amount; i++) {
                player.cards.push(this.deck.cards.pop());
                this.updateCards(i);
            }
        });
        console.log(this.players);
    }

    updateCards(index) {

        if (this.players[this.turn].cards[index] == null) {
            document.getElementById('' + (this.turn+1) + index).innerHTML = "";
            return;
        }

        let suit = "";

        let playbutton = document.createElement("INPUT");
        playbutton.setAttribute("type", "button");
        playbutton.setAttribute("value", "play");
        playbutton.setAttribute("class", "playButton");

        if (this.trumpfChosen) {
            playbutton.setAttribute("onClick", "playCard(" + (this.turn+1).toString() + (index+3) + ")");
        } else {
            playbutton.setAttribute("onClick", "playCard(" + (this.turn+1).toString() + index + ")");
        }

        if (!this.trumpfChosen) {
            if (this.players[this.turn].cards[index].suit == "Karo" || this.players[this.turn].cards[index].suit == "Herz") {
                document.getElementById((this.turn+1).toString() + index.toString()).className = "red-card";
            } else {
                document.getElementById((this.turn+1).toString() + index.toString()).className = "card";
            }
            suit = this.determineSymbol(this.players[this.turn].cards[index].suit);
            document.getElementById((this.turn+1).toString() + index.toString()).innerHTML = this.players[this.turn].cards[index].rank + "<br />" + suit + '<p class="upside-down">' + this.players[this.turn].cards[index].rank + '<br/>' + suit + '</p>';
            document.getElementById((this.turn+1).toString() + index.toString()).appendChild(playbutton);
            return;
        }

        if (this.players[this.turn].cards[index+3].suit == "Karo" || this.players[this.turn].cards[index+3].suit == "Herz") {
            document.getElementById((this.turn+1).toString() + (index + 3).toString()).className = "red-card";
        } else {
            document.getElementById((this.turn+1).toString() + (index + 3).toString()).className = "card";
        }
        suit = this.determineSymbol(this.players[this.turn].cards[index+3].suit);
        document.getElementById((this.turn+1).toString() + (index+3).toString()).innerHTML = this.players[this.turn].cards[index+3].rank + "<br />" + suit + '<p class="upside-down">' + this.players[this.turn].cards[index+3].rank + '<br/>' + suit + '</p>';
        document.getElementById((this.turn+1).toString() + (index+3).toString()).appendChild(playbutton);

    }

    determineSymbol(suit) {
        switch (suit) {
            case "Karo":
                 return '♦';
            case "Herz":
                 return '♥';
            case "Kreuz":
                 return '♣';
            case "Pik":
                 return '♠';
            default:
                return "Error";
        }
    }

    checkIfPossible(playedCard) {
    
        if (this.firstCardPlayed == null) {
            return true;
        }

        //theoretisch müsste man noch schauen ob man nur einen der Bauern auf der Hand hat der müsste dann gepielt werden

        if (this.checkForSameSuit(this.firstCardPlayed.suit) && this.firstCardPlayed.suit !== playedCard.suit) {
            switch(this.trumpf) {
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

        console.log(this.players[this.turn].cards);

        for (let i = 0; i < this.players[this.turn].cards.length; i++) {
            if (this.players[this.turn].cards[i] == null) {
                continue;
            }
            sameSuit = sameSuit || (this.players[this.turn].cards[i].suit === suit);
        }
        return sameSuit;
    }

    nextPlayer() {
        this.turn = (this.turn + 1) % 4;
        this.trumpfChosen = false;                          //ACHTUNG! könnte mir nochmal in den Arsch beißen

        for (let i = 0; i < 5; i++) {
            gameBoard.updateCards(i);
        }
        this.hideAllOtherHands(this.turn+1);
        document.getElementById('playerName').innerHTML = this.players[this.turn].name;
    }

    hideAllOtherHands(turn) {

        let currentZ = 4;

        for (let i = 1; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                if (i == turn) {
                    document.getElementById('' + i + j).style.visibility = "visible";
                    document.getElementById('' + i + j).style.pointerEvents = "all";
                    document.getElementById('' + i + j).style.zIndex = 5;
                    continue;
                }
                document.getElementById('' + i + j).style.visibility = "hidden";
                document.getElementById('' + i + j).style.pointerEvents = "none";
                document.getElementById('' + i + j).style.zIndex = currentZ;
            }
            currentZ--;
        }
    }

    nextRound() {
        // Punkte vergeben
        console.log(this.currentBestPlayer.name + " wins!");
        this.currentBestPlayer.score += 4;

        // Muss dann der spieler dran sein der den stich gemacht hat
        this.turn = this.players.indexOf(this.currentBestPlayer);

        // Zurück auf Anfang
        this.cardInTheMiddle = null;
        this.firstCardPlayed = null;
        this.currentBestPlayer = null;
        this.currentHighestCard = null;
        document.getElementById('stack').innerHTML = "";
        document.getElementById("stack").className = "stack-empty"; 
    }

    checkWhoWins(playedCard) {
        
        // Fall für erste gespielte Karte
        if (playedCard == this.firstCardPlayed) {
            this.currentHighestCard = playedCard;
            this.currentBestPlayer = this.players[this.turn];
            return;
        }

        // Fall für bedienen mit höherem Wert
        if (playedCard.suit == this.currentHighestCard.suit && playedCard.value > this.currentHighestCard.value) {
            this.currentHighestCard = playedCard;
            this.currentBestPlayer = this.players[this.turn];
            return;
        }

        // Fall für abtrumpfen
        if (playedCard.suit == this.trumpf && this.currentHighestCard.suit != this.trumpf) {
            this.currentHighestCard = playedCard;
            this.currentBestPlayer = this.players[this.turn];
            return;
        }


    }
}

let gameBoard = new Board();
gameBoard.startGame("PlayerOne","PlayerTwo","PlayerThree","PlayerFour");


function chooseTrumpf(value) {
    gameBoard.trumpf = value;
    gameBoard.trumpfChosen = true;
    gameBoard.handCards(2);
}

function playCard(id) {

    if (gameBoard.trumpf == "") {
        return;
    }

    let index = id % 10;
    let currentPlayer = gameBoard.players[gameBoard.turn];
    let playedCard = currentPlayer.cards[index];

    if (gameBoard.checkIfPossible(playedCard)) {

        document.getElementById('' + id).innerHTML = "";
        if (gameBoard.cardInTheMiddle == null) {
            document.getElementById("stack").className = "stack-full";
            gameBoard.firstCardPlayed = playedCard;
        }
        gameBoard.cardInTheMiddle = playedCard;
        gameBoard.checkWhoWins(playedCard);
        currentPlayer.cards[index] = null;

        if (playedCard.suit == "Karo" || playedCard.suit == "Herz") {
            document.getElementById('stack').className = "stack-full-red";
        } else {
            document.getElementById('stack').className = "stack-full";
        }

        let suit = gameBoard.determineSymbol(playedCard.suit);

        document.getElementById('stack').innerHTML = playedCard.rank + "<br />" + suit + '<p class="upside-down-stack">' + playedCard.rank + '<br/>' + suit + '</p>';
        gameBoard.nextPlayer();
        if (gameBoard.turn == 0) {
            gameBoard.nextRound();
        }

    }
}