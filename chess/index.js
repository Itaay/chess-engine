// A class of a tool
class Figure {
    constructor(side, type) {
      this.side = side;     // side is an object of type {direction:1/-1, name:"white"/"black"}
      this.type = type;     // type of figure
    }

    getPossibleMoves(){
        return this.type.movementRules(this);
    }
    
    getString(){
        return this.type.stringName;
    }
  }
  

class Player{
    constructor(side, figures){
        this.side = side;
        this.figures = figures;
    }

}

class FigureType{
    constructor(name, src, movementRules, stringName, side){
        this.side = side;
        this.stringName = stringName;
        this.name = name;   // name of type of piece
        this.img = document.getElementById(src);
        this.movementRules = movementRules; // a function that gets the possible moves for the piece type.
    }
}


class State{
    constructor(previous, board, history){
        this.previous = previous;   // a link to the previous state
        this.board = board; // a matrix of pieces representing the current state of the board
        this.history = history; // an array of moves from the beggining of the game: [{from:{y:1,x:0}, to:{y:3, x:0}}, {from:{y:6,x:7}, to:{y:4, x:7}}]
        this.turn = this.getCurrentTurn();
    }

    getString(depth=20){
        var turnSep = "%%%";
        var metaSep = ":";
        var result = this.turn.name + metaSep;
        if(depth > 0 && this.previous != null){
            result += this.previous.getString(depth-1);
        }
        result += turnSep + this.getBoardString();
        return result;
    }

    getBoardString(){
        // Get a stringified version of the current board
        var colSep = " ";
        var rowSep = "\n";

        var result = "";
        var row;
        var rowLength;
        var rowCount = this.board.length;
        
        var piece;
        for(var y = 0; y < rowCount; y++){
            row = "";
            rowLength = this.board[y].length;
            for(var x = 0; x < rowLength; x++){
                piece = this.board[y][x];
                if(piece != null){
                    row += piece.getString();
                }
                else{
                    row += "__";
                }
                if(x < rowLength-1){
                    row += colSep;
                }
            }
            if(y < rowCount - 1){
                row += rowSep;
            }
            result += row;
        }
        return result;
    }

    getCurrentTurn(){
        if(this.history.length % 2 == 0){
            return sides.white;
        }
        return sides.black;
    }
    isCheck(){  // check if current turn is a check
        var checkedLocation = this.getKingOfSide(this.turn);  // then, get the location of this side's king
        var check = this.getNextState(checkedLocation, checkedLocation).isThreatened(checkedLocation, this.turn);
        return check;
    }
    isMate(){   // check if current state is mate
        return this.isCheck() && this.isGameOver();
    }

    isPat(){    // check whether the game is a tie
        return this.isGameOver() && (!this.isCheck());
    }

    isGameOver(){   // check if there are any moves that can be played this turn (return true if no left)
        var moves;
        for(var y=0;y<this.board.length;y++){
            for(var x=0;x<this.board[y].length;x++){
                if(this.board[y][x]!= null){
                    if(this.board[y][x].side == this.turn){
                        moves = this.getPossibleMovesAt({y:y, x:x});
                        if(moves.length > 0){
                            return false;
                        }
                    }
                }
                
            }
        }
        return true;
    }

    getPossibleMovesAt(location, ignoreCheck=false){   // get all the possible moves for the piece in the given tile location.
        var piece = this.board[location.y][location.x];
        if(piece == null){
            return new Array();
        }
        if(piece.side != this.turn){
            return new Array();
        }

        // get all possible moves for the piece in the given location
        var possibleMoves = piece.type.movementRules(this, location);
        
        var nextState;
        var checkedLocation;
        if(!ignoreCheck){
            // filter out all of the moves that make the moving side come into check(because that's a mate next move).
            var actuallyPossibleMoves = new Array();
            for(var i=0;i<possibleMoves.length;i++){    // for each possible move
                nextState = this.getNextState(location, possibleMoves[i]);  // get the next board state
                checkedLocation = nextState.getKingOfSide(piece.side);  // then, get the location of this side's king
                if(!nextState.isThreatened(checkedLocation, piece.side)){   // check if the king is threatened in this state
                    actuallyPossibleMoves.push(possibleMoves[i]);   // if it's safe, the move is valid (if it's not, the move isn't valid).
                }
            }
        return actuallyPossibleMoves;

        }
        return possibleMoves;        
    }

    getNextState(startPos, endPos){
        // get the state created by moving a piece from startPos to endPos
        var nextState = new State(this, this.copyBoard(), this.history);
        nextState.makeAMoveOnBoard(nextState.board, startPos, endPos);
        return nextState;
    }

    copyBoard(){    // copy this board's current state and return the copy (detatch the reference)
        var copy = new Array();
        for(var y=0;y<this.board.length;y++){
            copy.push(new Array());
            for(var x=0;x<this.board[y].length;x++){
                copy[y].push(this.board[y][x]);
            }
        }
        return copy;
    }

    makeAMoveOnBoard(board, startPos, endPos){
        // change the given instance of a board to it's state after moving the piece in the start position to the end position.

        // usually, just move the piece from start pos to end pos.

        // but if a castle move, you need to also handle the rook
        if(isCastleMove(board, startPos, endPos)){
            // get location of the corresponding rook
            var rookLocation = {y:startPos.y, x:0}; // default at queen side castle
            if(endPos.x >= 4){  // if to the right side
                rookLocation.x = boardWidth-1;    // then it's king side castle
            }
            // and move it to it's designated spot
            board[rookLocation.y][Math.floor((startPos.x+endPos.x)/2)] = board[rookLocation.y][rookLocation.x];
            board[rookLocation.y][rookLocation.x] = null;
        }
        // or if it's an en passant, you need to take care of the attacked pawn.
        else if(isEnPassant(board, startPos, endPos)){
            // find the attacked pawn
            // remove it
            board[startPos.y][endPos.x] = null;
        }
        if(isQuinning(board, startPos, endPos)){
            var side = board[startPos.y][startPos.x].side;
            placePiece(board, side, figureTypes[side.name].queen, endPos);
        }
        else{
            board[endPos.y][endPos.x] = board[startPos.y][startPos.x];
        }
        board[startPos.y][startPos.x] = null;

        this.history = this.history.concat([{from:startPos, to:endPos}]);
        this.turn = this.getCurrentTurn();
    }

    isThreatened(location, side){   // this function checks whether a given square is threatened by a enemy piece 
        var exploredPiece;
        // go over every tile on the board
        for(var y = 0; y < this.board.length;y++){
            for(var x= 0;x<this.board[y].length;x++){

                // if the tile contains an enemy piece
                // get all of it's possible moves and check if it can reach the queried tile.
                exploredPiece = this.board[y][x];
                if(exploredPiece != null){  // if not empty tile
                    if(exploredPiece.side != side){ // if an enemy piece in the tile
                        // you can ignore checks because they don't matter from a threat point of view(because they come only in next stage)
                        var possibleMoves = this.getPossibleMovesAt({y:y,x:x}, true);
                        if(locationIncluded(possibleMoves, location)){
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    getKingOfSide(side){
        var piece;
        for(var y=0;y<this.board.length;y++){
            for(var x=0;x<this.board[y].length;x++){
                piece = this.board[y][x];
                if(piece != null){
                    if(piece.type.name == "king" && piece.side == side){
                        return {y:y, x:x}
                    }
                }
            }
        }
        return null;
    }

    getSoldierAt(location){
        return this.board[location.y][location.x];
    }

    fixYPos(location){ // fix the y position of a location on the board (used for flipping the board correctly and universally)
        if(!flipMode){
            location.y = boardHeight - 1 - location.y;
        }   
    }

    getFuturesAtTurn(){
        // Get all possible states for this state
        var states = new Array();
        for(var y=0;y<this.board.length;y++){
            for(var x=0;x<this.board[y].length;x++){
                var piece = this.board[y][x];
                if(piece != null){
                    if(piece.side == this.turn){
                        var destinations = this.getPossibleMovesAt({y:y, x:x});
                        for(var i=0;i<destinations.length;i++){
                            states.push(this.getNextState({y:y, x:x}, destinations[i]));
                        }
                    }
                }
            }
        }
        return states;
    }
}

  function isQuinning(board, start, end){
      //check whether a pawn is going to become a queen.
      var piece = board[start.y][start.x];
      if(piece == null){
          return false;
      }
      if(piece.type.name !="pawn"){
          return false;
      }
      if(piece.side.direction==1){
          return end.y == board.length - 1;
      }
      return end.y == 0;
  }

  function isCastleMove(board, start, end){
      // check whether a given move on a board is a castling move:
      // characterised by a king moving more than one square horizontally
      var piece = board[start.y][start.x];
      if(piece == null){
          return false;
      }
      return piece.type.name == "king" && Math.abs(end.x-start.x) > 1;
          
  }

  function isEnPassant(board, start, end){
      // Assuming the movement from position start to position end is a valid move(that had already been checked to be legal).
      // return whether it's an en passant:
      // a pawn moving diagonally to an empty square can only happen with an en passant so that's a way to recognize it.
      var piece = board[start.y][start.x];
      if(piece == null){
          return false;
      }
      if(piece.type.name != "pawn"){
          return false;
      }
      if(end.x != start.x){    // if diagonal
        if(board[end.y][end.x] == null){    // and going to an empty spot
            return true;    // then it means it has to be an en passant
        }
      }
      return false;
    }
  


  function validLocation(board, location){ // return whether a location is a valid location on the board
      return location.y < board.length && location.y >= 0 && location.x < board[0].length && location.x >= 0;
  }

  

  function getKnightMoves(state, location){
        var board = state.board;
        // Get an array of all the possible places the knight can go to
        // location is an object of type {y:yloc, x:xloc}
        var moves = [{y:-1, x:-2}, {y:-2, x:-1}, {y:-2, x:1}, {y:-1, x:2}, {y:1, x:2}, {y:2, x:1}, {y:2, x:-1}, {y:1, x:-2}]; 
        var possibleMoves = getMovesInDirections(board, location, moves, 1);
        return possibleMoves;
  }

  function getBishopMoves(state, location){
    var board = state.board;
    return getDiagonalMoves(board, location);
  }

  function getRookMoves(state, location){
    var board = state.board;
    return getStraightMoves(board, location);
  }

  function getQueenMoves(state, location){
      var board = state.board;
      return getDiagonalMoves(board, location).concat(getStraightMoves(board, location));
  }

  function getKingMoves(state, location){
      var kingSide = state.getSoldierAt(location).side; // the side to which the king belongs (do not confuse with the short castle)
      var board = state.board;
      var normalMoves = getDiagonalMoves(board, location, distance=1).concat(getStraightMoves(board, location, distance=1));
      // get castling moves

      // to check if can castle:
      // check if king has moved (go through state history and check if moved).
      var canMoveLeft = true;
      var canMoveRight = true;
      for(var i=0;i<state.history.length;i++){
          if(locationsEqual(state.history[i].to, location)){  // if something had moved into this location, then it's not the original piece here(meaning the king has moved).
                return normalMoves;
          }   
          if(locationsEqual(state.history[i].to, {y:location.y, x:0})){ // if something had moved into the left rook location, then the left rook moved
              canMoveLeft = false;
          }
          if(locationsEqual(state.history[i].to, {y:location.y, x:state.board[0].length-1})){   // if something had moved into the right rook location, then the right rook moved
              canMoveRight = false;
          }
      }
      // check if king is currently threatened
      if(state.isThreatened(location, kingSide)){
          return normalMoves;
      }
      // for each side
      if(canMoveLeft){
          // if left path is clear
        var pathClear = true;
        for(var i = 1;i<location.x;i++){
            if(state.getSoldierAt({y:location.y, x:i}) != null){
                pathClear = false;
            }
        }
        if(pathClear && (!state.isThreatened({y:location.y, x:location.x-1}, kingSide)) && (!state.isThreatened({y:location.y, x:location.x-2}, kingSide))){
            normalMoves.push({y:location.y, x:location.x-2});
        }
      }
      if(canMoveRight){
        // if right path is clear from dangers
        var pathClear = true;
        for(var i = 6;i>location.x;i--){
            if(state.getSoldierAt({y:location.y, x:i}) != null){
                pathClear = false;
            }
        }
        if(pathClear && (!state.isThreatened({y:location.y, x:location.x+1}, kingSide)) && (!state.isThreatened({y:location.y, x:location.x+2}, kingSide))){
            normalMoves.push({y:location.y, x:location.x+2});
      }
    }
      // check if the path the king will have to move is threatened
      return normalMoves;
  }

  function getPawnMoves(state, location){
    var board = state.board;
    var pawn = state.getSoldierAt(location);
    // a pawn has four types of moves it can do:
    var possibleMoves = new Array();
    var distance = 1; // if only normal move possible
    if((pawn.side.direction == 1 && location.y == 1) || (pawn.side.direction == -1 && location.y == board.length-2)){   // if in starting possition
         distance = 2;
        }
    
    if(pawn == null){
        return possibleMoves;
    }
    var direction = {y:pawn.side.direction, x:0};
    possibleMoves = possibleMoves.concat(getMovesInDirection(board, location, direction, distance, false));

    // diagonal forward: 1 forward and 1 to one of the sides, only if there is an enemy there
    var diagonals = [{y:pawn.side.direction, x:1}, {y:pawn.side.direction, x:-1}];
    for(var i=0;i<diagonals.length;i++){
      var diagonal = diagonals[i];
        
       var toSide = {y:location.y, x:location.x + diagonal.x};
      var target = {y:location.y + diagonal.y, x:location.x+diagonal.x};

      if(validLocation(board, target)){
          var lookAhead = board[target.y][target.x];  
          var lookAside = board[toSide.y][toSide.x];
          
        if(lookAhead != null){
            if(lookAhead.side != pawn.side){
                possibleMoves.push(target);
            }
        }
            // else, if to the side, there is an ENEMY PAWN that it's previous move was a double move (en passant)
        else if(lookAside != null){
            if(lookAside.type.name == "pawn"){
                // look if the previous move was to move a PAWN a double move to the lookaside
                if(lookAside.side != pawn.side){    // if enemies
                    var lastMove = state.history[state.history.length-1];
                    if(locationsEqual(lastMove.to, toSide) && Math.abs(lastMove.from.y-lastMove.to.y) > 1){   // and the last move played was a double move by the looked aside enemy pawn
                        possibleMoves.push(target);
                    }
                }
            }
            
        }
    }
  }
  return possibleMoves;

  }




  function getDiagonalMoves(board, location, distance=board.length){
      // get an array of all diagonal moves possible
      var moves = [{y:-1,x:-1},{y:-1,x:1},{y:1,x:-1},{y:1,x:1}];
      return getMovesInDirections(board, location, moves, distance);
  }

  function getStraightMoves(board, location, distance=board.length){
    // get an array of all straight moves possible
    var moves = [{y:0, x:-1}, {y:0, x:1}, {y:-1, x:0}, {y:1,x:0}];
    return getMovesInDirections(board, location, moves, distance);
  }

  function getMovesInDirection(board, location, direction, distance, canEat=true){
      // Get all possible moves of a given figure, in a given direction, for a maximum distance
      // distance is how many steps of the direction could be taken
      var locations = new Array();
      var canContinue = true;
      var i = 0;
      var figure = getSoldierAt(board, location);
      while(i<distance && canContinue){
          var currentMove = {y:location.y+(direction.y*(i+1)), x:location.x+(direction.x*(i+1))};
          var valid = false;
          canContinue = false;    // assume cannot continue, but if an empty spot, you can continue
          if(validLocation(board, currentMove)){
            var previous = board[currentMove.y][currentMove.x]
            
            if(previous == null){ // if empty, it's a valid spot
                valid = true;      
                canContinue = true;
            }
            else if(previous.side != figure.side && canEat){ // if enemy and can kill enemies in this direction, it's a valid spot
                valid = true;
            }
          }
          if(valid){
              locations.push(currentMove);
          }
          i++;
          
      }
      return locations;
  }

  function getMovesInDirections(board, location, directions, distance){
      var locations = new Array();
      for(var i = 0;i<directions.length;i++){
          locations = locations.concat(getMovesInDirection(board, location, directions[i], distance));
      }
      return locations;
  }

function getSoldierAt(board, location){
    return board[location.y][location.x];
}

function drawBoard(game){
    updateIndicators(game);
    var table = game.board;
    var canvasDimensions = {y:canvas.height, x: canvas.width};
    var tileDimensions = {y:canvasDimensions.y / boardHeight, x: canvasDimensions.x / boardWidth};
    ctx.drawImage(backgroundImage, 0, 0, canvasDimensions.x, canvasDimensions.y);   // draw background
    var current;
    // draw pieces
    for(var y=0;y<table.length;y++){
        for(var x=0;x<table[y].length;x++){
            current = {y:y, x:x};
            game.fixYPos(current);
            if(table[y][x] != null){
                ctx.drawImage(table[y][x].type.img, tileDimensions.x*(current.x), (tileDimensions.y*(current.y)), tileDimensions.x, tileDimensions.y);
            }
        }
    }
    
    ctx.fillStyle = "#ff0000";
    for(var i=0;i<possibleMoves.length;i++){
        var currentLoc = possibleMoves[i];
        current = {y:currentLoc.y, x:currentLoc.x};
        game.fixYPos(current);
        var center = {x:Math.floor(tileDimensions.x*(current.x+0.5)), y:Math.floor((tileDimensions.y*(current.y+0.5)))}
        ctx.beginPath();
        ctx.arc(center.x, center.y, Math.floor(tileDimensions.x/8), 0, 2*Math.PI, true);
        ctx.fill();
    }
}

function loadImage(src){
    var img = new Image();
    img.src = src;
    return img;
}

function setupBoard(){
    // Array of arrays of Figures (all null except for the cells)
    
    var table = new Array();
    for(var i=0;i<boardHeight;i++){
        table[i] = new Array();
        for(var j=0;j<boardWidth;j++){
            table[i].push(null);
        }
    }
    
    // Create the figures and place them on the board
    for(var i =0;i<boardWidth;i++){
        placePiece(table, sides.white, figureTypes.white.pawn, {y:1, x:i});
        placePiece(table, sides.black, figureTypes.black.pawn, {y:6, x:i});
    }
    placePiece(table, sides.white, figureTypes.white.rook, {y:0, x:0});
    placePiece(table, sides.white, figureTypes.white.rook, {y:0, x:7});
    placePiece(table, sides.white, figureTypes.white.knight, {y:0, x:1});
    placePiece(table, sides.white, figureTypes.white.knight, {y:0, x:6});
    placePiece(table, sides.white, figureTypes.white.bishop, {y:0, x:2});
    placePiece(table, sides.white, figureTypes.white.bishop, {y:0, x:5});
    placePiece(table, sides.white, figureTypes.white.queen, {y:0, x:3});
    placePiece(table, sides.white, figureTypes.white.king, {y:0, x:4});

    placePiece(table, sides.black, figureTypes.black.rook, {y:7, x:0});
    placePiece(table, sides.black, figureTypes.black.rook, {y:7, x:7});
    placePiece(table, sides.black, figureTypes.black.knight, {y:7, x:1});
    placePiece(table, sides.black, figureTypes.black.knight, {y:7, x:6});
    placePiece(table, sides.black, figureTypes.black.bishop, {y:7, x:2});
    placePiece(table, sides.black, figureTypes.black.bishop, {y:7, x:5});
    placePiece(table, sides.black, figureTypes.black.queen, {y:7, x:3});
    placePiece(table, sides.black, figureTypes.black.king, {y:7, x:4});
    
    var state = new State(null, table, new Array());
    return state;
}

function placePiece(board, side, type, location){
    // create the piece
    var figure = new Figure(side, type);
    // place it in the right place on the board
    board[location.y][location.x] = figure;
}


function getSelectedTile(e){
    var x;
    var y;
    if (e.pageX || e.pageY) { 
      x = e.pageX;
      y = e.pageY;
    }
    else { 
      x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft; 
      y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop; 
    } 
    x -= canvas.offsetLeft;
    y -= canvas.offsetTop;
    var tileSizes = {x:canvas.width/boardWidth, y:canvas.height/boardHeight};
    return {y:Math.floor(y/tileSizes.y), x:Math.floor(x/tileSizes.x)};
}

function locationsEqual(loca, locb){
    return loca.x == locb.x && loca.y == locb.y;
}

function locationIncluded(locations, loc){
    for(var i =0;i<locations.length;i++){
        if(locations[i].x == loc.x && locations[i].y == loc.y){
            return true;
        }
    }
    return false
}


function pressOnBoard(e) {
    var tile = getSelectedTile(e);
    game.fixYPos(tile);
    if(selectedTile != null && locationIncluded(possibleMoves, tile)){   // if there is already a selected tile, and the new selected tile is a possible move
        if(makeAMove(selectedTile, tile)){  // make the players move, and if the game continues:
            if(againstBot){
                setTimeout(function(){
                    var move = getBestMove(game);
                    makeAMove(move.from, move.to);
                }, 30);
                
            }
            
        }

    }
    else{
        possibleMoves = game.getPossibleMovesAt(tile);
        selectedTile = tile;
        drawBoard(game);
    }
}


function makeAMove(from, to){
    game = game.getNextState(from, to);   // update the game state
    selectedTile = null;    // and unselect the selected tile
    possibleMoves = new Array();
    drawBoard(game);
    if(game.isGameOver()){
        setTimeout(function(){
            if(game.isCheck()){
                window.alert("It's a Mate. " + game.previous.turn.name + " has won.");
            }
            else{
                window.alert("It's a Stalemate. no one wins.");
            }  
        }, 500);
            
        return false;
    }
    return true;
}


function undo(){
    if(game.previous != null){
        game = game.previous;
    }
    drawBoard(game);
    selectedTile = null;
    possibleMoves = new Array();
}

function toggleFlipMode(){
    flipMode = !flipMode;
    drawBoard(game);
}

function updateIndicators(game){
    var src = "assets/figures/" + game.turn.name + "/king.png";
    ind1.src = src;
    ind2.src = src;
    if(game.isCheck()){
        ind1.style.backgroundColor = "#DD0101";
        ind2.style.backgroundColor = "#DD0101";
    }
    else{
        ind1.style.backgroundColor = "";
        ind2.style.backgroundColor = "";
    }
}


function startGame(){
    game = setupBoard();
    possibleMoves = new Array();
    drawBoard(game);
}

function displayState(){
    window.alert(game.getString().length);
}

function toggleBot(){
    againstBot = !againstBot;
}

var backgroundImage = loadImage("assets/board.png");

// Create an object containing all types of figures (type name, and their image source)
var figureTypes;

var sides = {white:{direction:1, name:"white"}, black:{direction:-1, name:"black"}};
var boardWidth = 8;	
var boardHeight = 8;

var canvas = document.getElementById("board");
var ctx = canvas.getContext("2d");
var game;
var possibleMoves = new Array();
var selectedTile = null;

var flipMode = false;
var againstBot = true;

var ind1 = document.getElementById("indicator1");
var ind2 = document.getElementById("indicator2");


canvas.addEventListener('mousedown', function(e) {
    pressOnBoard(e);
});

window.onload = function(){
    figureTypes = {
        black: {
            pawn: new FigureType("pawn", "black-pawn", getPawnMoves, "bp", sides.black),
            knight: new FigureType("knight", "black-knight", getKnightMoves, "bh", sides.black),
            bishop: new FigureType("bishop", "black-bishop", getBishopMoves, "bb", sides.black),
            rook: new FigureType("rook", "black-rook", getRookMoves, "br", sides.black),
            queen: new FigureType("queen", "black-queen", getQueenMoves, "bq", sides.black),
            king: new FigureType("king", "black-king", getKingMoves, "bk", sides.black)
        },
        white: {
            pawn: new FigureType("pawn", "white-pawn", getPawnMoves, "wp", sides.white),
            knight: new FigureType("knight", "white-knight", getKnightMoves, "wh", sides.white),
            bishop: new FigureType("bishop", "white-bishop", getBishopMoves, "wb", sides.white),
            rook: new FigureType("rook", "white-rook", getRookMoves, "wr", sides.white),
            queen: new FigureType("queen", "white-queen", getQueenMoves, "wq", sides.white),
            king: new FigureType("king", "white-king", getKingMoves, "wk", sides.white)
        },
    };
    startGame();
};