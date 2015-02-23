/**
* Domino Game
* Author Paul Allen http://paulallen.com.jm
* Copyright 2011, Paul Allen
* Licensed under the MIT or GPL Version 2 licenses.
* Date: November 15 2011
*
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software to deal in the Software without
* restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in
* all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
* THE SOFTWARE.
*/


(function (window, undefined) {

    var DominoGame = function () {
        this.gameid = this.newId();
        this.deck = [];
        this.players = [];
        this.currentPlayer = null;
        this.playstack = [];
        this.firstCardIndex = 0; //this index to keep tracking the first card 
        this.firstcard = null;
        this.remainingCards = [];
        this.playersLength = 0;
        //initialize the deck
        var d = 0;
        for (l = 0; l <= 6; l++) { //i love you
            for (r = l; r <= 6; r++, d++) {
                this.deck[d] = new DominoGame.Domino(l, r);
            }
        }
    };

    DominoGame.prototype.newId = function () {
        var i = Math.random() * (100 - 10) + 10;
        i = parseInt(i.toString().replace('.', ''));
        return i;
    }

    DominoGame.prototype.shuffle = function () {
        var temp = null;
        for (i = 0; i < 28; i++) {
            r = Math.floor(Math.random() * 28);
            temp = this.deck[r]; this.deck[r] = this.deck[i];
            this.deck[i] = temp;
        }
    }

    DominoGame.prototype.deal = function () {
        //first check if the number of players is more than 4
        // I think it is better to be handled in the controller
        console.log("Connected Player Length " + this.playersLength);

        // if(this.players.length != 4){
        for (i = 0; i < this.playersLength; i++) {
            this.players[i] = new Player(i + 1, null, this.deck.slice(i * 7, (i * 7) + 7));
        }
        // for length less than 4 , add the remaining cards in a new array
        if (this.playersLength < 4)
            this.remainingCards = this.deck.slice(length * 7, this.deck.length);
        // }
    }

    DominoGame.prototype.whichPlayer = function () {
        if (this.currentPlayer == null) {
            for (var i = 6 ; i >= 0 ; i--) //looking for the biggest number
            {
                this.firstcard = new DominoGame.Domino(i, i);
                for (var j = 0; j < this.playersLength; j++) {
                    if (this.players[j].has(this.firstcard)) {
                        this.currentPlayer = j;
                        return this.currentPlayer;
                    }
                }
                if (this.currentPlayer == null)
                    this.currentPlayer = 0;
            }
        }
        return this.currentPlayer;
    }
    //internal function: called with .call or .apply
    DominoGame.prototype.chooseNextPlayer = function () {
        if (this.playstack.length == 0) return this.whichPlayer();
        var startingPos = this.currentPlayer;
        for (var i = (this.currentPlayer + 1) % this.playersLength; i != startingPos ; i = (i + 1) % this.playersLength) {
            if (this.players[i].canPlay(this.playstack[0].left(), this.playstack[this.playstack.length - 1].right())) {
                this.currentPlayer = i;
                console.log("The next player Index is" + this.currentPlayer);
                break;
            }
        }
        return this.currentPlayer;
    }

    DominoGame.prototype.makePlay = function (player, cardz, side) {
        console.log("Domino Game makePlay Fn.");

        if (player !== this.currentPlayer) { return false; }
       var card = new DominoGame.Domino(cardz.l, cardz.r);

        console.log("Play Stack Length " + this.playstack.length);
        console.log("Card Side " + side);

        // quite confused ,may be the played card isn't the greatest one, why should i add it to the stack before checking???? 
        if (this.playstack.length === 0) {
            if (this.firstcard.equals(card.left(), card.right())) // have to check
                this.playstack.push(card);

            else
                //i need to send the firstcard
                return false;
        }
        else {
            if (side == "head") {
                c = this.playstack[0].left();
                if (c == card.left()) {
                    card.flip();
                    card.or = 'r90'
                    this.playstack.unshift(card);
                    this.firstCardIndex++;
                }
                else if (c == card.right()) {
                    card.or = 'r270'
                    this.playstack.unshift(card);
                    this.firstCardIndex++;
                }
                else {
                    alert("False Card");
                    return false;
                }
            }
            else if (side == "tail") {
                c = this.playstack[this.playstack.length - 1].right();
                if (c == card.left()) {
                    card.or = 'r270';
                    this.playstack.push(card);
                }
                else if (c == card.right()) {
                    card.flip();
                    card.or = 'r90';
                    this.playstack.push(card);
                }
                else {
                    alert("False Card");
                    return false;
                }

            }
        }

        this.players[player].makePlay(card.left(),card.right());

        if (this.whoWon() == -1)
            this.chooseNextPlayer();
        return true;
    }

    DominoGame.prototype.headsAndTails = function () {
        if (this.playstack.length === 0)
            return null;
        var r = {
            head: this.playstack[0].left(),
            tail: this.playstack[this.playstack.length - 1].right()
        };
        return r;
    }

    DominoGame.prototype.gameCanPlay = function () {
        console.log("Domino Game gameCanPlay Fn.");
        var canPlay = false;
        if (this.playstack.length === 0) { return true; }
        var startingPos = this.currentPlayer;
        for (var i = 0; i < this.playersLength; i++) {
            if (this.players[i].canPlay(this.playstack[0].left(), this.playstack[this.playstack.length - 1].right())) {
                canPlay = true;
                break;
            }
        }
        return canPlay;
    }

    DominoGame.prototype.whoWon = function () {
        var startingPos = this.currentPlayer;
        var length = this.players.length;
        for (var i = startingPos; (i + 1) % length != startingPos ; i = (i + 1) % length) {
            if (this.players[i].cards.length == 0) {
                return i;
            }
        }

        if (this.gameCanPlay() == false) {

            console.log("game blocked");
            _lowest = 0;
            _hands = [];
            _hands.push(this.players[0].countHand());
            _occurrences = 1;

            for (var i = 1, length = this.players.length; i < length; i++) {
                _hands.push(this.players[i].countHand());
                if (_hands[_lowest] > _hands[i]) {
                    _lowest = i;
                    _occurrences = 1;
                }

                if (_hands[_lowest] == _hands[i]) {
                    _occurrences += 1;
                }

            }

            if (_occurrences == 1)
                return _lowest;
        }

        return -1;
    }

    /*!
     * Domino 
     */
    DominoGame.Domino = function (le, ri) {

        if (le < 0 || le > 6 || ri < 0 || ri > 6) {
            throw new Error("Invalid arguments supplied for domino: (0 - 6)");
        }


        this.id = this.newId();
        this.l = le;
        this.r = ri;



    }
    DominoGame.Domino.prototype.left = function () { return this.l; }
    DominoGame.Domino.prototype.right = function () { return this.r; }
    DominoGame.Domino.prototype.orientation = function () { return 1; }
    DominoGame.Domino.prototype.flip = function () {
        or = this.orientation();
        if (or > 0) { //or > 0 is normal orientation so flip now
            this.left = function () { return this.r; }
            this.right = function () { return this.l; }
        } else {
            this.left = function () { return this.l; }
            this.right = function () { return this.r; }
        }

        this.orientation = function () { return or * -1; }
    }

    DominoGame.Domino.prototype.equals = function (left, right) {
        console.log("Domino Game equals() Function");
        if (right == null) {
            if (left.orientation() != this.orientation()) {
                if (this.left() == left.right() && this.right() == left.left())
                    return true;
            }
            else {
                if (this.left() == left.left() && this.right() == left.right())
                    return true;
            }
        }
        else
            if (this.left() == left && this.right() == right)
                return true;
        return false;
    }
    DominoGame.Domino.prototype.canMatch = function (left, right) {
        l = this.left();
        r = this.right();
        if (l == left) return 1;
        if (l == right) return 2;
        if (r == left) return 3;
        if (r == right) return 4;
        return 0;
    }

    DominoGame.Domino.prototype.newId = function () {
        var i = Math.random() * (100 - 10) + 10;
        i = ''.replace.apply(i, ['.', '']);
        return i;
    }


    /*!

    Player Object

    */
    function Player( id,  name,cards) {
        this.id = id;
        this.name = name || "Player " + this.id;
        this.cards = cards;
    }

    Player.prototype.canPlay = function (left, right) {
        alert("Player CanPlay() Fn.")
        var count = this.cards.length;
        for (i = 0; i < count; i++) {
            if (this.cards[i].canMatch(left, right)) {
                return true;
            }
        }

        //if we get here we didnt find a match
        return false;
    }

    Player.prototype.addDrawedCard = function (card) {
        this.cards.push(card);
    }

    Player.prototype.whatToPlay = function (left, right) {
        var count = this.cards.length;
        var canplay = [];

        for (i = 0; i < count; i++) {
            if (this.cards[i].canMatch(left, right) > 0) {
                canplay.push(this.cards[i]);
            }
        }
        return canplay;
    }

    Player.prototype.makePlay = function (left, right) {
        var length = this.cards.length;
        for (var i = 0; i < length; i++) {
            if (this.cards[i].equals(left, right)) {
                this.cards.splice(i, 1);
                console.log("Player " + this.id + " plays: " + left + " " + right);
                break;
            }
        }
    }

    Player.prototype.has = function (card) {
        var count = this.cards.length;
        for (i = 0; i < count; i++) {
            if (this.cards[i].equals(card.left(), card.right())) {
                return true;
            }
        }
        //if we get here we didnt find a match
        return false;
    }

    Player.prototype.countHand = function () {
        var length = this.cards.length;
        if (length == 0) return 0;
        var count = 0;
        for (i = 0; i < length; i++) {
            count += card.left() + card.right();
        }
        return count;
    }

    //expose game
    window.Game = DominoGame;

})(window);
