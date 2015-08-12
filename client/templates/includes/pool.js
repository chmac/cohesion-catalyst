/**
 * pool.js
 *
 * TODO Provide overview description of this file.
 */

var ids, 
  cursorIndex, 
  baseBubbleSize, 
  layout;

/**
  * init code for the "ID Pool" screen
  */
Template.idPool.onCreated(function() {

  // array to store the pool of IDs for rendering  
  ids = [];

  // base size (radius in pixels) of a bubble
  baseBubbleSize = 40;

  // Testing
  addID("1","4","purple");
  addID("2","6","blue");
  addID("3","2");
  addID("4","3");
  addID("5","9","red");
  addID("6","2");
  addID("7","3");
  addID("8","6");
  addID("9","4");
  addID("10","5");

  // create new layout and init cursor within the layout
  layout = new LayoutSameNumPerRow(ids, {"baseBubbleSize": baseBubbleSize});
});

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
  * draw a single ID bubble at specified position with specified scale factor
  * drawingSurface: the SVG area's topmost group element
  * id: one entry from the ids array
  * pos: array containing X and Y coordinate of bubble to be drawn
  * scale: scale factor for bubble's size
  **/
var drawBubble = function(drawingSurface, id, x, y, size) {

console.log("draw bubble " + id.text + " at " + x + " / " + y + " size " + size);
  var bubbleGroup = drawingSurface.append("g")
    .attr("transform", "translate(" + x + "," + y + ")");

  bubbleGroup.append("circle")
    .attr("r", size)
    .style("fill", id.color);

  bubbleGroup.append("text")
    .attr("dy", ".3em")
    .style("text-anchor", "middle")
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

    // Testing
  for(var i=0; i<ids.length; i++) {
    var res = layout.getPositionAndSize(i);
    drawBubble(drawingSurface, ids[i], res.x, res.y, res.size);
  }

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
  this.opt.bubbleBaseSize = options.bubbleBaseSize || 40;
  this.opt.drawAreaWidth = options.drawAreaWidth || 800;
  this.opt.drawAreaHeight = options.drawAreaHeight || 600;
  this.opt.maxRows = options.maxRows || 5;
  this.opt.bubblesPerRow = options.bubblesPerRow || 5;
  this.opt.rowSpacing = 1.2;
  this.opt.colSpacing = 1.2;

  this.cursorIndex = Math.floor(ids.length / 2);

};

/**
  *  given the index of an ID within the ids array, 
  *  return position and size of bubble, or undefined 
  *  if bubble shall not be rendered at all
  */
LayoutSameNumPerRow.prototype.getPositionAndSize = function(bubbleIndex) {
 
  // how far is this bubble from the current cursor position?
  var diff = this.cursorIndex - bubbleIndex;

  // row and column number of bubble to be rendered
  var bubbleRow = Math.floor(bubbleIndex / this.opt.bubblesPerRow);
  var bubbleCol = bubbleIndex % this.opt.bubblesPerRow;

  // row and column number of cursor position
  var cursorRow = Math.floor(this.cursorIndex / this.opt.bubblesPerRow);
  var cursorCol = this.cursorIndex % this.opt.bubblesPerRow;

  // how many rows / columns away?
  var rowDiff = bubbleRow - cursorRow;
  var colDiff = bubbleCol - cursorCol;

  // start in center of drawing area
  var x = this.opt.drawAreaWidth / 2;
  var y = this.opt.drawAreaHeight / 2;

  // initial row size is that of the basic bubble size
  var size = this.opt.bubbleBaseSize;
  var sign = rowDiff<0? -1 : 1;
  var currentRowSpacing = this.opt.rowSpacing;
  var currentColSpacing = this.opt.colSpacing;

  // for each row away,change x and y 
  for(var i=0; i<Math.abs(rowDiff); i++) {

    // out of renderable area?
    if(i>this.opt.maxRows) 
      return undefined;

    // go away up/down from center, change spacing each time
    y -= sign * size*currentRowSpacing;
    currentRowSpacing *= 0.8;
    currentColSpacing *= 0.8;
    size *= 0.8;
  }

  // go left/right from center, using spacing dependent 
  // on which row we are in
  x += colDiff * currentColSpacing;

  // return x, y, and bubble size 
  return { "x": x, "y": y, "size": size};
 
};


