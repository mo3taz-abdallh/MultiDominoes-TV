﻿//This Controller will wait until we have minumim no. of players required to start game & then the start button will be appeared.
app.controller('gameController', ['$scope', 'FocusHandlerFactory', 'Utils', '$rootScope', function ($scope, FocusHandlerFactory, Utils, $rootScope) {
    var TAG = "Game View";
    var _THIS = this;
    $scope.leftStackPos = 605;
    Utils.log("Intializing", TAG);
    $rootScope.setControllerFocus(_THIS);

    $scope.firstPlayer = $rootScope.DominoGame.whichPlayer();
    Utils.log($scope.firstPlayer, "First Player Index");
    $scope.clients[$scope.firstPlayer].send(JSON.stringify({ type: "message", content: "It's your Turn" }), true);
    $.each($scope.clients, function (i, client) {
        if ($scope.firstPlayer != i)
            client.send(JSON.stringify({ type: "cardStatus", content: false }));
    });
    //intializing left and right stack
    $scope.leftStack = [];
    $scope.rightStack = [];
    $scope.channel.on("message", function (msg, client) {
        $scope.data = JSON.parse(msg);
        //In case the message from client is playedcard
        if ($scope.data.type == "playedcard") {
            $scope.playedcard = $scope.data.card;
            $scope.side = $scope.data.side;
            Utils.log("played card left " + $scope.data.card.l + "Right: " + $scope.data.card.r, TAG);
            _.filter($rootScope.DominoGame.players, function (player, id) {
                if (player.name == client.attributes.name) {
                    $scope.idx = id;
                    return true;
                }
            });
            Utils.log("Player Turn ID " + $scope.idx, TAG);

            //In case the player can't make playe with the sent card.
            if (!$rootScope.DominoGame.makePlay($scope.idx, $scope.playedcard, $scope.side)) {
                if ($rootScope.DominoGame.players[$rootScope.DominoGame.currentPlayer].canPlay($rootScope.DominoGame.playstack[0].left(), $rootScope.DominoGame.playstack[$rootScope.DominoGame.playstack.length - 1].right())) //if player esta3bat we rama false card
                    client.send(JSON.stringify({ type: "cardFailed", content: "Please Choose another Card!", card: $scope.playedcard }), true);
                else if ($rootScope.DominoGame.remaningCards.length > 0) { //if player hasn't cards to play
                    Utils.log("sending drawcard event to mobile ", TAG);
                    client.send(JSON.stringify({ type: "drawCard", flag: true }), true);
                }
                else { //he draw until vanish remaningCards Arr.
                    $rootScope.DominoGame.chooseNextPlayer();
                    $scope.clients[$rootScope.DominoGame.currentPlayer].send(JSON.stringify({ type: "message", content: "It's your Turn" }), true);
                }
            }
                //In case the card sent is valid for ground.
            else {
                if ($scope.leftStack && $scope.leftStack.length == 4 && !$scope.leftFirstRow && $scope.side == "head") { //we reached max. cards on 1st left stack row so we create the left stack edge card
                    $scope.leftStackEdge = $rootScope.DominoGame.playstack[0];
                    $rootScope.DominoGame.leftStackEdgeIndex = 0;
                    $rootScope.DominoGame.leftStackEdgeFlag = true;
                    $scope.leftFirstRow = true;
                    $scope.leftStackRow = [];
                    $rootScope.safeApply($scope);
                }
                else if ($scope.rightStack && $scope.rightStack.length == 4 && !$scope.rightFirstRow && $scope.side == "tail") {
                    $scope.rightStackEdge = $rootScope.DominoGame.playstack[$rootScope.DominoGame.playstack.length - 1];
                    $rootScope.DominoGame.rightStackEdgeIndex = $rootScope.DominoGame.playstack.length;
                    $rootScope.DominoGame.rightStackEdgeFlag = true;
                    $scope.rightFirstRow = true;
                    $scope.rightStackRow = [];
                    $rootScope.safeApply($scope);
                }
                else if ($scope.leftStackEdge && $scope.side == "head") {
                    Utils.log("Left Stack 2nd row", TAG);
                    $scope.leftStack1 = _.initial($rootScope.DominoGame.playstack, $rootScope.DominoGame.playstack.length - $rootScope.DominoGame.leftStackEdgeIndex - 1);
                    $scope.leftStack1.splice($scope.leftStack1.length - 1, 1);
                    $scope.leftStackRow.push($scope.leftStack1[0]);
                    $rootScope.safeApply($scope);
                }
                else if ($scope.rightStackEdge && $scope.side == "tail") {
                    Utils.log("Right Stack 2nd row", TAG);
                    $scope.rightStackRow = _.rest($rootScope.DominoGame.playstack, $rootScope.DominoGame.rightStackEdgeIndex);
                    alert(JSON.stringify($scope.rightStackRow))
                   // $scope.rightStackRow.splice(0, 1);
                    alert(JSON.stringify($scope.rightStackRow))
                    $rootScope.safeApply($scope);
                }
                else {
                    if ($scope.leftStack.length < 4) {
                        $scope.leftStack = _.initial($rootScope.DominoGame.playstack, $rootScope.DominoGame.playstack.length - $rootScope.DominoGame.firstCardIndex - 1);
                        $scope.leftStack.splice($scope.leftStack.length - 1, 1);
                        $scope.leftStackPos = $scope.leftStackPosition(); //handling position of leftStack cards
                    }
                    
                    if ($scope.rightStack.length < 4) {
                        $scope.rightStack = _.rest($rootScope.DominoGame.playstack, $rootScope.DominoGame.firstCardIndex);
                        $scope.rightStack.splice(0, 1);
                    }
                   

                    //if ($scope.leftFirstRow) {  //in Case we have leftStack another row so get the rest after the index of left stack edge
                    //    $scope.leftStack = _.rest($scope.leftStack, $rootScope.DominoGame.leftStackEdgeIndex);
                    //    $scope.leftStack.splice(0, 1);
                    //}
                    //if ($scope.rightFirstRow) {
                    //    $scope.rightStack = _.initial($scope.rightStack,$scope.rightStack.length- 3)
                    //}
                    Utils.log("Left Stack Count" + $scope.leftStack.length, TAG);
                    Utils.log("Right Stack Count" + $scope.rightStack.length, TAG);

                    Utils.log("Right Stack " + JSON.stringify($scope.rightStack), TAG);
                    Utils.log("Left Stack " + JSON.stringify($scope.leftStack), TAG);
                    $rootScope.safeApply($scope);
                }
                client.send(JSON.stringify({ type: "cardsuccessed", card: $scope.playedcard }), true);

                //count remaining cards for the player
                //case no cards or the remaining card and no one can play -> calculate score
                if ($rootScope.DominoGame.players[$rootScope.DominoGame.currentPlayer].countHand() == 0 || ($rootScope.DominoGame.remainingCards.length == 0 && !$rootScope.DominoGame.gameCanPlay())) {

                    //cal score
                    $scope.playerScore = $rootScope.DominoGame.calScore();
                    //update score sheet
                    $scope.scoreSheet[$scope.playerScore.player].score += $scope.playerScore.score;
                    $scope.clients[$scope.playerScore.player].send(JSON.stringify({ type: "message", content: "You are the winner" }), true);
                    //show dialog for the score
                }
                else {
                    $rootScope.DominoGame.chooseNextPlayer();
                    $scope.clients[$rootScope.DominoGame.currentPlayer].send(JSON.stringify({ type: "message", content: "It's your Turn" }), true);
                }

            }
        }
    });
    $scope.leftStackPosition = function () {
        $scope.position = 597;
        $.each($scope.leftStack, function (i, card) {
            if (card.l != card.r)
                $scope.position -= 142;
            else
                $scope.position -= 73;
        });
        Utils.log("LeftStack Position: " + $scope.position, TAG)
        return $scope.position;
    }
    //This will maintain the style of Left Stack Edge Card according to previous card
    $scope.StackEdgeStyle = function (type) {
        Utils.log("Stack Edge Style: " + type, TAG);
        var style = {};
        var leftwidth = 0;
        var rightwidth = 595;
        if (type && type == 'left' && $scope.leftStack) {
            $.each($scope.leftStack, function (i, card) {
                if (card.l != card.r)
                    leftwidth += 142;
                else
                    leftwidth += 73;
            });
            if ($scope.leftStack[0] && $scope.leftStack[0].l != $scope.leftStack[0].r){
                style["top"] = '405px';
                style["left"] = (600 - leftwidth).toString() + 'px';
                $scope.secondRowLeftStack = 600 - leftwidth + 67; //last position of leftStack 1st row + with of the Edge Stack Card
            } 
            else {
                style["top"] = '443px';
                style["left"] = (604 - leftwidth).toString() + 'px';
                $scope.secondRowLeftStack = 604 - leftwidth + 67; //last position of leftStack 1st row + with of the Edge Stack Card
            }
        }

        else if (type && type == 'right' && $scope.rightStack) {
            $.each($scope.rightStack, function (i, card) {
                if (card.l != card.r)
                    rightwidth += 142;
                else
                    rightwidth += 73;
            });
            style["left"] = rightwidth.toString() + 'px';
            $scope.secondRowRightStack = 1285-rightwidth; //last position of rightStack 1st row + with of the Edge Stack Card

            if ($scope.rightStack[$scope.rightStack.length - 1] && $scope.rightStack[$scope.rightStack.length - 1].l != $scope.rightStack[$scope.rightStack.length - 1].r)
                style["top"] = '195px'
            else
                style["top"] = '158px'
        }
        return style;
    }
    //this will maintain 2nd leftStack row style
    $scope.stackRowStyle = function (type) {
        var style = {};
        if (type && type == 'left') {
            if ($scope.secondRowLeftStack)
                style["left"] = $scope.secondRowLeftStack.toString() + 'px';
            if ($scope.leftStack[0] && $scope.leftStack[0].l != $scope.leftStack[0].r)
                style["top"] = '440px'
            else
                style["top"] = '475px'
        }
        else if (type && type == 'right') {
            if ($scope.secondRowRightStack)
                style["right"] = $scope.secondRowRightStack.toString() + 'px';
            if ($scope.rightStack[$scope.rightStack.length - 1] && $scope.rightStack[$scope.rightStack.length - 1].l != $scope.rightStack[$scope.rightStack.length - 1].r)
                style["top"] = '158px'
            else
                style["top"] = '100px'
        }
        return style;
    }
    $scope.cardOrientation = function (card, type, index) {
        if (card) {
            Utils.log("Card Or is:" + card.or, TAG);
            if (type == 'leftStack' ) {

                if (card.l != card.r) {
                    if ($scope.leftStack[index - 1] && $scope.leftStack[index - 1].l == $scope.leftStack[index - 1].r)
                        return card.or + " mgleft180";
                    else
                        return card.or + " margingleft";
                }
                else
                        return "r180 pdright180";
            }
            if ( type == 'rightStack') {
                if (card.l != card.r)
                    if ($scope.rightStack[index - 1] && $scope.rightStack[index - 1].l == $scope.rightStack[index - 1].r)
                        return card.or + " mgleft180";
                    else
                        return card.or + " margingleft";
                else
                    return "r180 margingleft180"
            }
            else if (type == 'leftStack1') {
                if (card.l != card.r) {
                    switch (card.or) {
                        case "r90":
                            if ($scope.leftStackRow[index - 1] && $scope.leftStackRow[index - 1].l == $scope.leftStackRow[index - 1].r)
                                return "r270 mgleft180";
                            else
                                return "r270 margingleft";
                            break;
                        case "r270":
                            if ($scope.leftStackRow[index - 1] && $scope.leftStackRow[index - 1].l == $scope.leftStackRow[index - 1].r)
                                return "r90 mgleft180";
                            else
                                return "r90 margingleft";
                            break;
                    }
                }
                else
                    if (index == 0)//in case if the 1st card in the 2nd row is r180
                        return "r90 margingleft";
                    else
                        return "r180 pdright180";
            }
            else if (type == 'rightStack1') {
                if (card.l != card.r) {
                    switch (card.or) {
                        case "r90":
                            if ($scope.rightStackRow[index - 1] && $scope.rightStackRow[index - 1].l == $scope.rightStackRow[index - 1].r)
                                return "r270 mgleft180";
                            else
                                return "r270 margingleft";
                            break;
                        case "r270":
                            if ($scope.rightStackRow[index - 1] && $scope.rightStackRow[index - 1].l == $scope.rightStackRow[index - 1].r)
                                return "r90 mgleft180";
                            else
                                return "r90 margingleft";
                            break;
                    }
                }
                else
                    if (index == 0)//in case if the 1st card in the 2nd row is r180
                        return "r90 margingleft";
                    else
                        return "r180 pdright180";
            }
        }
    }
    $scope.EdgeOrientation = function (card) {
        if (card) {
            Utils.log("Left Edge Orientation: " + card.or, TAG)
            if (card.or != "r270") {
                var or = card.or.slice(0);
                var finalOr = parseInt(or) + 90;
                return 'r' + finalOr;
            }
            else
                return "r180";
        }

    }
    this.handleKeyDown = function (keyCode) {
        Utils.log("handleKeyDown(" + keyCode + ")", TAG);
        switch (keyCode) {
            case tvKey.KEY_UP:
                break;
            case tvKey.KEY_DOWN:
                break;
            case tvKey.KEY_ENTER:
            case tvKey.KEY_PANEL_ENTER:
                break;

            case tvKey.KEY_RETURN:
            case tvKey.KEY_PANEL_RETURN:
                break;
        }
    };

}]);