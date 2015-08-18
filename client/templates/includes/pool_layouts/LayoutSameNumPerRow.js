
/**
 * layout to render the same numer of bubbles per row
 *
 * Use the constructor to init the cursor position and 
 * remember a reference to the (dynamically changing) 
 * array of IDs to be rendered.
 * 
 * Use scroll() to specify any scrolling by the users, 
 * and specify the deltaY in pixels.
 * 
 * For drawing a single ID bubble, query its current 
 * position and scale factor (for scaling bubble and text)
 * using getPositionAndSize().
 *
 */

/**
  *  constructor initializes cursor etc. and returns a new layout object
  *  NOTE that this definition purposefully omits the "var" since 
  *  only globally declared functions will be readable in other JS files!
  *  see: http://stackoverflow.com/questions/16166509/in-which-order-meteor-include-my-js-files
  */
LayoutSameNumPerRow = function(ids, options) {

  // read options and provide default values
  if(!options) 
    options = {};
  this.opt = {};
  this.opt.baseBubbleRadius = options.baseBubbleRadius || 40;
  this.opt.drawAreaWidth = options.drawAreaWidth || 600;
  this.opt.drawAreaHeight = options.drawAreaHeight || 400;
  this.opt.maxRows = options.maxRows || 8;
  this.opt.bubblesPerRow = options.bubblesPerRow || 5;
  this.opt.rowSpacing = 1.0;
  this.opt.colSpacing = 1.2;

  // remember the ids array to query its length lateron (HACK???)
  this.ids = ids;

  // which bubble is in the center
  this.cursorIndex = Math.floor(ids.length / 2)-1;

  // index of the first (min) id to be shown in the center
  this.minIndex = this.cursorIndex % this.opt.bubblesPerRow;

  // cursorPixelPos describes how many pixels the central
  // bubble is off-center, vertically 
  this.cursorPixelPos = 0;

  // console.log("INIT idx="+this.cursorIndex + " min="+this.cursorOffset);

};

/** 
  *  set width and height of drawing area for subsequent calculations
  */ 
LayoutSameNumPerRow.prototype.setDimensions = function(width,height) {
  this.opt.drawAreaWidth = width || 600;
  this.opt.drawAreaHeight = height || 400;
};

/** 
  * scroll down by a number of pixels. This only recalculates 
  * the positions in the layout; you need to redraw afterwards
  */
LayoutSameNumPerRow.prototype.scroll = function(numPixels) {

  // min / max allowed central index
  var maxIndex = Math.floor(this.ids.length/this.opt.bubblesPerRow-1)*this.opt.bubblesPerRow + 
                 this.minIndex;

  // how many pixels for advancing from one bubble row to the next?
  var pixelsPerRow = Math.floor(this.opt.baseBubbleRadius * 2 * this.opt.rowSpacing);

  // current pixel pos + pixels to be scrolled by
  var pixelPos = this.cursorPixelPos + numPixels;
  
  // scroll by how many rows?
  var rows = Math.trunc(pixelPos/pixelsPerRow);

  // new index of central bubble, new pixel pos
  var idx = this.cursorIndex - rows*this.opt.bubblesPerRow;
  pixelPos = pixelPos - rows*pixelsPerRow;

  // clamp
  if(idx <= this.minIndex) {
    idx = this.minIndex;
    if(pixelPos>0)
      pixelPos = 0;
  } else if(idx >= maxIndex) {
    idx = maxIndex;
    if(pixelPos<0)
      pixelPos = 0; 
  } 

  // set cursor to resulting values
  this.cursorPixelPos = pixelPos;
  this.cursorIndex = idx;

  console.log("idx="+idx + " pixPos = "+pixelPos);
};

/**
  *  given the index of an ID within the ids array, 
  *  return position and size of bubble, or undefined 
  *  if bubble shall not be rendered at all
  */
LayoutSameNumPerRow.prototype.getPositionAndSize = function(bubbleIndex) {

  // return this.getPosForFullRow(bubbleIndex);

  // how many pixels for advancing from one bubble row to the next?
  var pixelsPerRow = this.opt.baseBubbleRadius * 2 * this.opt.rowSpacing;

  // calculate the two positions to interpolate in-between, and the interpol weight
  var res1,res2,w;
  if(this.cursorPixelPos < 0) {
    res1 = this.getPosForFullRow(bubbleIndex);
    res2 = this.getPosForFullRow(bubbleIndex-this.opt.bubblesPerRow);
    w = -this.cursorPixelPos/pixelsPerRow;
  } else {
    res1 = this.getPosForFullRow(bubbleIndex);
    res2 = this.getPosForFullRow(bubbleIndex+this.opt.bubblesPerRow);
    w = this.cursorPixelPos/pixelsPerRow;
  }

  // check for non-renderable bubbles 
  if(res1 == undefined || res2 == undefined) {
    return undefined;
  }

  // interpolate between the two positions
  var res = {};
  res.x = Math.round(res1.x*(1-w) + res2.x*w);
  res.y = Math.round(res1.y*(1-w) + res2.y*w);
  res.scale = res1.scale*(1-w) + res2.scale*w;

  return res;
};
 
/**
  *  internal calculation of bubble position and size for full rows only
  *  (without in-between cursor positions several pixels off a full row)
  */
LayoutSameNumPerRow.prototype.getPosForFullRow = function(bubbleIndex) {
  // how many bubbles are there left from the center?
  var offset = Math.floor(this.opt.bubblesPerRow/2);

  // which "line" is the cursor in?
  var cursorRow = Math.floor((this.cursorIndex - offset) / this.opt.bubblesPerRow);

  // which "line" is the bubble to be rendered in?
  var bubbleRow = Math.floor((bubbleIndex - offset) / this.opt.bubblesPerRow);

  // which column?
  var bubbleCol = bubbleIndex - offset - bubbleRow*this.opt.bubblesPerRow;
  var cursorCol = this.cursorIndex - offset - cursorRow*this.opt.bubblesPerRow;;

  // how far is this bubble from the current cursor position?
  var diff = bubbleIndex - this.cursorIndex;

  // how many rows / columns away?
  var colDiff = bubbleCol - cursorCol;
  var rowDiff = bubbleRow - cursorRow;

  // start in center of drawing area
  var x = Math.floor(this.opt.drawAreaWidth / 2);
  var y = Math.floor(this.opt.drawAreaHeight / 2);

  // initial row size is that of the basic bubble size
  var scale = 1.0;
  var sign = rowDiff<0? -1 : 1;
  var currentRowSpacing = this.opt.rowSpacing;
  var currentColSpacing = this.opt.colSpacing;

  // for each row away,change x and y 
  for(var i=0; i<Math.abs(rowDiff); i++) {

    // out of renderable area?
    if(i>this.opt.maxRows) 
      return undefined;

    // go away up/down from center, change spacing each time
    y += Math.floor(sign * currentRowSpacing * this.opt.baseBubbleRadius*2);

    // make rows and columns denser using some heuristic ratios :-)
    currentRowSpacing = 0.70*currentRowSpacing;
    currentColSpacing = 0.80*currentColSpacing;

    // make bubbles smaller, row by row. Allow 20% overlap max.
    scale = Math.min(currentRowSpacing*1.2, currentColSpacing*1.2);
    
  }

  // go left/right from center, using spacing dependent 
  // on which row we are in
  x += colDiff  * currentColSpacing * this.opt.baseBubbleRadius*2;

  // return x, y, and bubble size 
  return { "x": x, "y": y, "scale": scale};
 
};


