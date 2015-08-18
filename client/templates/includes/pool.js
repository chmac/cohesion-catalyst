/**
 * pool.js
 *
 * TODO Provide overview description of this file.
 */

var ids, 
  layout;

/**
  * init code for the "ID Pool" screen
  */
Template.idPool.onCreated(function() {

  // array to store the pool of IDs for rendering  
  ids = [];

  // Testing
  for(var i=0; i<50; i++) {
    addID(i,Math.random(10));
  };

  // create new layout and init cursor within the layout
  layout = new LayoutSameNumPerRow(ids, {"baseBubbleRadius": 40});

}); // onCreated()

/**
  * Adds a callback to be called when an instance of this template is rendered and inserted
  * into the DOM.
  * All of the {@code D3} code goes inside this callback to allow for accessing the DOM elements and
  * interact with them.
  * (cf. <a href="http://docs.meteor.com/#/full/template_onRendered">Meteor onRendered()</a>)
  */
Template.idPool.onRendered(function() {
  draw();
}); 

/**
  *   add an ID to the pool of IDs to be rendered
  */
var addID = function(text,count,color) {

  var id = {};
  id.text = text || "wat?";
  id.count = count || 1;
  id.color = color || "purple";
  ids.push(id);
  return id;
};

/**
  *   search ID by text and return full ID information, or undefined
  */
 var getID = function(text) {
  for(var i=0; i<ids.length; i++) {
    if(ids[i].text == text) {
      return ids[i];
    }
  }
  return undefined;
};

/**
  *   delete ID, identified by text
  */
var deleteID = function(text) {
  for(var i=0; i<ids.length; i++) {
    if(ids[i].text == text) {
      ids.slice(i,1);
      return;
    }
  }
};

/**
  *   update information for an ID, identified by text
  */
var updateID = function(text, newText, newCount, newColor) {
  for(var i=0; i<ids.length; i++) {
    var id = ids[i];
    if(id.text == text) {
      id = {"text": newText || id.text, 
            "count": newCount || id.count,
            "color": newColor || id.color};
      return;
    }
  }
};


/** 
  * draw a single ID bubble centered around specified position 
  * with specified radius and scale factor
  * drawingSurface: the SVG area's topmost group element
  * id: one entry from the ids array
  * pos: array containing X and Y coordinate of bubble to be drawn
  * radius: unscaled (base) radius of the bubble
  * scale: scale factor for bubble size and text size
  **/
var drawBubble = function(drawingSurface, id, x, y, radius, scale) {

  //console.log("draw bubble " + id.text + " at " + x + " / " + y + " scale " + scale);
  var bubbleGroup = drawingSurface.append("g")
    .attr("transform", "translate(" + (x) + "," + (y) + ")");

  bubbleGroup.append("circle")
    .attr("r", radius)
    .attr("transform", "scale(" + scale + " " + scale + ")")
    .style("fill", id.color);

  bubbleGroup.append("text")
    .attr("dy", ".3em")
    .style("text-anchor", "middle")    
    .attr("transform", "scale(" + scale + " " + scale + ")")
    .style("fill", "white")
    .text(id.text);

};

/**
  * draw the current set of bubbles with some magic layouting
  */
var draw = function() {

  var margin,
    width,
    height,
    svgViewport,
    drawingSurface;

  // We create a margin object following the D3 margin convention.
  // cf. http://bl.ocks.org/mbostock/3019563
  margin = {
    top: 20,
    right: 10,
    bottom: 20,
    left: 10
  };

  // We define the inner dimensions of the drawing area.
  width = 768 - margin.left - margin.right;
  height = 1024 - margin.top - margin.bottom;

  // remove all existing children of the drawing area
  //d3.select("#ids-graph").selectAll("*").remove();
  d3.select("#ids-graph").select("svg").remove();
  // We create our outermost <svg> and append it to the existing <div id='ids-graph'>.
  svgViewport = d3.select("#ids-graph").append("svg")
    .attr("id", "ids-vis")
    .attr("viewBox", "0 0 " + (width + margin.left + margin.right) + " " + (height + margin
      .top +
      margin.bottom))
    .attr("preserveAspectRatio", "xMidYMid meet");

  // We append a <g> element that translates the origin to the top-left
  // corner of the drawing area.
  drawingSurface = svgViewport.append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // We append a <rect> as the 'canvas' to draw on and as target of 'pointer events'.
  drawingSurface.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("class", "drawing-surface");

  // set width and height in layout
  layout.setDimensions(width,height);

    // for each bubbles, determine if/where to draw it, and do so  
  for(var i=0; i<ids.length; i++) {
    // emtpy slot in array?
    if(ids[i] != undefined) {
      var res = layout.getPositionAndSize(i);
      // does the layout tell me to draw it at all?
      if(res != undefined) {
        drawBubble(drawingSurface, ids[i], res.x, res.y, 40, res.scale);
      }
    }
  }

  // debugging: capture keys to scroll
  d3.select("#ids-vis").on("mousedown", function(d) {
      if(d3.event.shiftKey) {
        layout.scroll(-10);
      } else {
        layout.scroll(10);
      }
      draw();
  }); // d3.select()

}


/***************************************************************************/

/**
 * layout to render the same numer of bubbles per row
 *
 * TODO Provide overview description of this file.
 */


/**
  *  constructor initializes cursor etc. and returns a new layout object
  */
var LayoutSameNumPerRow = function(ids, options) {

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

  // console.log("x="+res.x+" y="+res.y+" scale="+res.scale);

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

  //console.log("bubble #" + bubbleIndex + " row=" + bubbleRow + " col=" + bubbleCol + " diff=" + diff + " dx=" + colDiff + " dy=" + rowDiff);

  // go left/right from center, using spacing dependent 
  // on which row we are in
  x += colDiff  * currentColSpacing * this.opt.baseBubbleRadius*2;

  // return x, y, and bubble size 
  return { "x": x, "y": y, "scale": scale};
 
};


