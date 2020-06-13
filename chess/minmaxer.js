// this file is responsible for getting a suggesting for the next move.

// It will have a function that moves on a given search as a tree,
// getting all next possibilities, then their heuristics,
// and based off of that, it will decide which possibilities to explore further

function getBestMove(game){ // get the best move to do from a given state
    var bestFuture = minMax(game);  // get the best future state from the given state
    //window.alert(bestFuture.score);
    var lastMove = bestFuture.state.history[bestFuture.state.history.length-1]; // get the move that led to it.
    return lastMove;
}


function minMax(game, depth=2, maxPrune=30, score=null){
    //This function searches for the best move in a given game state. depth is how many recursion steps this function can do.


    //we need to find the best move for the current side.

    var possibilities = game.getFuturesAtTurn();    // get all child nodes in tree
    if(possibilities.length == 0){  // if no moves available, it's a leaf: return it's own state, with it's corresponding score.
        if(score == null){
            score = getHeuristic(game);
        }

        return {state:game, score:score};
    }
    /*
    This section is responsible for getting the heuristics for all the members in possibilities
    */    
    var baseHeuristics = getHeuristics(possibilities);   // get heuristics on given
    //window.alert(baseHeuristics);


    var paired = new Array();
    for(var i =0;i<possibilities.length; i++){
        paired.push({state:possibilities[i], score: -baseHeuristics[i]});    // also, flip sign of heuristics because it's of the next turn
    }

    paired.sort(function(a, b){return b.score - a.score;}); // sort the next game states based on their matching score: higher scores first



    var minMaxScores = new Array();
    for(var i=0;i<paired.length;i++){   // iterate over all options sorted based on their scores
        var currState = paired[i];
        if(depth > 0 && i < maxPrune){  // if hasn't reached recoursion limit, and one of the best options
            var currPrediction = {state: currState.state, score: minMax(currState.state, depth-1, maxPrune - 1, currState.score).score};
            currPrediction.score *= -1; // flip the score because it's relative towards the next turn's player    
            minMaxScores.push(currPrediction);
        }
        else{   // if reached recursion limit, or not worth checking, just use the base heuristics as a score
            minMaxScores.push(currState);   // no need to flip score because the prediction is from this turn.
        }
    }

    /*
    End of section
    */


    // get the node with the highest score, in the following format: {state: the state, score: the state's score}.
    var chosen = minMaxScores[argMax(minMaxScores, function(a, b){return a.score - b.score;})];
    return chosen;


    

}

function argMax(arr, comp){ // get the index of the maximum value in a given array, based on a given comparison function
    var best = -1;
    for(var i = 0; i< arr.length; i++){
        if(best == -1){
            best = i;
        }
        else if(comp(arr[i], arr[best]) > 0){
            best = i;
        }
    }
    return best;
}


function getHeuristic(state){
    // Get a score for a given state
    return pieceCountHeuristics(state);
}

function getHeuristics(states){
    // get scores for all given states
    var heuristics = new Array();
    for(var i = 0; i <states.length; i++){
        heuristics.push(getHeuristic(states[i]));
    }
    return heuristics;
}


function pieceCountHeuristics(state){
    // Get a score for a given state based on the remaining pieces on the board (positive is towards the current turn's player)
    var scores = {"rook": 5, "knight": 3, "bishop": 3.25, "queen": 9, "king": 100, "pawn":1};   // a score table for each piece
    var total_score = 0;
    for(var y = 0; y<state.board.length; y++){
        for(var x = 0; x< state.board[y].length; x++){
            var piece = state.board[y][x];
            if(piece != null){
                total_score += scores[piece.type.name] * piece.side.direction;
            }
        }
    }
    total_score *= state.turn.direction;  // flip based on the current turn's side

    if(state.isMate()){
        return -1000;
    }
    if(state.isPat()){
        if(total_score > 0){
            return -200;
        }
        return 0;
    }
    return total_score
}