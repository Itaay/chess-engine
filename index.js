// A class of a tool
class Figure {
    constructor(side, type, location) {
      this.side = side;     // side is an object of type {direction:1/-1, name:"white"/"black"}
      this.type = type;     // type of figure
      this.location = location; // the location on the board {y:ycoord, x:xcoord}
      this.hasMoved = false;    // a boolean whether the figure had moved yet
      this.previousLocation = null;
      
    }

    getPossibleMoves(){
        return this.type.movementRules(this);
    }
    
  }
  

class Player{
    constructor(side, figures){
        this.side = side;
        this.figures = figures;
    }

}

class FigureType{
    constructor(name, src, movementRules){
        this.name = name;   // name of type of piece
        this.src = src; // source of the piece's image
        this.img = new Image(); // the image
        this.img.src = this.src;    // load from the source
        this.movementRules = movementRules; // a function that gets the possible moves for the piece type.
    }
}

  


  function validLocation(location){ // return whether a location is a valid location on the board
      return location.y < board.length && location.y >= 0 && location.x < board[0].length && location.x >= 0;
  }

  

  function getKnightMoves(knight){
        // Get an array of all the possible places the knight can go to
        // location is an object of type {y:yloc, x:xloc}
        var moves = [{y:-1, x:-2}, {y:-2, x:-1}, {y:-2, x:1}, {y:-1, x:2}, {y:1, x:2}, {y:2, x:1}, {y:2, x:-1}, {y:1, x:-2}]; 
        return getMovesInDirections(knight, moves, 1);        
  }

  function getBishopMoves(bishop){
      return getDiagonalMoves(bishop);
  }

  function getRookMoves(rook){
      return getStraightMoves(rook);
  }

  function getQueenMoves(queen){
      return getDiagonalMoves(queen).concat(getStraightMoves(queen));
  }

  function getKingMoves(king){
      var normalMoves = getDiagonalMoves(king, distance=1).concat(getStraightMoves(king, distance=1));
      // get castling moves
      // remove blocked locations
      return normalMoves;
  }

  function getPawnMoves(pawn){
      // a pawn has four types of moves it can do:
      var possibleMoves = new Array();
      distance = 1; // if only normal move possible
      if(!pawn.hasMoved){   // if hasn't moved yet, then 
            distance = 2;
        }
      possibleMoves = possibleMoves.concat(getMovesInDirection(pawn, {y:pawn.side.direction, x:0}, distance));

      // diagonal forward: 1 forward and 1 to one of the sides, only if there is an enemy there
      var diagonals = [{y:pawn.side.direction, x:1}, {y:pawn.side.direction, x:-1}];
      for(var i=0;i<diagonals.length;i++){
        var diagonal = diagonals[i];
        
        var toSide = {y:pawn.location.y, x:pawn.location.x + diagonal.x};
        var target = {y:pawn.location.y + diagonal.y, x:pawn.location.x+diagonal.x};

        if(validLocation(target)){
            var lookAhead = board[target.y][target.x];  
            var lookAside = board[toSide.y][toSide.x];
            
            if(lookAhead != null){
                if(lookAhead.side != pawn.side){
                    possibleMoves.push(target);
                }
            }
            // else, if to the side, there is an ENEMY PAWN that it's previous move was a double move (Cour the la something)
            else if(lookAside != null){
                if(lookAside.type.name==pawn.type.name && lookAside.side != pawn.side && lookAside.previousLocation == {y:target.y+pawn.side.direction,x:target.x}){
                    possibleMoves.push(target);
                }
            }
        }
      }
      return possibleMoves; 

  }




  function getDiagonalMoves(soldier, distance=board.length){
      // get an array of all diagonal moves possible
      var moves = [{y:-1,x:-1},{y:-1,x:1},{y:1,x:-1},{y:1,x:1}];
      return getMovesInDirections(soldier, moves, distance);
  }

  function getStraightMoves(soldier, distance=board.length){
    // get an array of all straight moves possible
    var moves = [{y:0, x:-1}, {y:0, x:1}, {y:-1, x:0}, {y:1,x:0}];
    return getMovesInDirections(soldier, moves, distance);
  }

  function getMovesInDirection(figure, direction, distance){
      // Get all possible moves of a given figure, in a given direction, for a maximum distance
      // distance is how many steps of the direction could be taken
      var locations = new Array();
      var canContinue = true;
      var i = 0;
      while(i<distance && canContinue){
          var currentMove = {y:figure.location.y+(direction.y*(i+1)), x:figure.location.x+(direction.x*(i+1))};
          var valid = false;
          canContinue = false;    // assume cannot continue, but if an empty spot, you can continue
          if(validLocation(currentMove)){
            var previous = board[currentMove.y][currentMove.x]
            
            if(previous == null){ // if empty, it's a valid spot
                valid = true;      
                canContinue = true;
            }
            else if(previous.side != figure.side){ // if enemy, it's a valid spot
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

  function getMovesInDirections(figure, directions, distance){
      var locations = new Array();
      for(var i = 0;i<directions.length;i++){
          locations = locations.concat(getMovesInDirection(figure, directions[i], distance));
      }
      return locations;
  }

function drawBoard(table){
    var canvasDimensions = {y:canvas.height, x: canvas.width};
    var tileDimensions = {y:canvasDimensions.y / boardHeight, x: canvasDimensions.x / boardWidth};
    ctx.drawImage(backgroundImage, 0, 0);   // draw background

    // draw pieces
    for(var y=0;y<table.length;y++){
        for(var x=0;x<table[y].length;x++){
            
            if(table[y][x] != null){
                ctx.drawImage(table[y][x].type.img, tileDimensions.x*(x), canvasDimensions.y-(tileDimensions.y*(y+1)), tileDimensions.x, tileDimensions.y);
            }
        }
    }
    
    ctx.fillStyle = "#ff0000";
    for(var i=0;i<possibleMoves.length;i++){
        var currentLoc = possibleMoves[i];
        var center = {x:Math.floor(tileDimensions.x*(currentLoc.x+0.5)), y:Math.floor(canvasDimensions.y-(tileDimensions.y*(currentLoc.y+0.5)))}
        ctx.beginPath();
        ctx.arc(center.x, center.y, Math.floor(tileDimensions.x/2), 0, 2*Math.PI, true);
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
    
    return table;
}

function placePiece(board, side, type, location){
    // create the piece
    var figure = new Figure(side, type, location);
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
    return {x:Math.floor(x/tileSizes.x), y:Math.floor(y/tileSizes.y)};
}


function pressOnBoard(e) {
    var tile = getSelectedTile(e);
    tile.y = boardHeight-1-tile.y;

    var selectedFigure = board[tile.y][tile.x];
    if(selectedFigure != null){
        possibleMoves = selectedFigure.getPossibleMoves();
    }
    drawBoard(board);
}


var backgroundImage = loadImage("assets/board.png");

// Create an object containing all types of figures (type name, and their image source)
var figureTypes = {
    black: {
        pawn: new FigureType("pawn", "assets/figures/black/pawn.png", getPawnMoves),
        knight: new FigureType("knight", "assets/figures/black/knight.png", getKnightMoves),
        bishop: new FigureType("bishop", "assets/figures/black/bishop.png", getBishopMoves),
        rook: new FigureType("rook", "assets/figures/black/rook.png", getRookMoves),
        queen: new FigureType("queen", "assets/figures/black/queen.png", getQueenMoves),
        king: new FigureType("king", "assets/figures/black/king.png", getKingMoves)
    },
    white: {
        pawn: new FigureType("pawn", "assets/figures/white/pawn.png", getPawnMoves),
        knight: new FigureType("knight", "assets/figures/white/knight.png", getKnightMoves),
        bishop: new FigureType("bishop", "assets/figures/white/bishop.png", getBishopMoves),
        rook: new FigureType("rook", "assets/figures/white/rook.png", getRookMoves),
        queen: new FigureType("queen", "assets/figures/white/queen.png", getQueenMoves),
        king: new FigureType("king", "assets/figures/white/king.png", getKingMoves)
    },
};

var sides = {white:{direction:1, name:"white"}, black:{direction:-1, name:"black"}};
var boardWidth = 8;	
var boardHeight = 8;

var canvas = document.getElementById("board");
var ctx = canvas.getContext("2d");
var board;
var possibleMoves = new Array();


canvas.addEventListener('mousedown', function(e) {
    pressOnBoard(e);
})

window.onload = function(e){
    board = setupBoard();
    drawBoard(board);
};

  