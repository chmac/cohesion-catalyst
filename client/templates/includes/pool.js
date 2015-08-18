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
  // TODO get the size info from CSS?
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
  id.text = text===undefined? "wat?" : text;
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
      // ids.slice(i,1);
      ids[i] = undefined;
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

}; // drawBubble()

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

    // for each bubbles, let the layout determine if/where to draw it, and do so  
  for(var i=0; i<ids.length; i++) {
    // is there something in this slot in the IDs array? 
    if(ids[i] != undefined) {
      // let layout compute position and scale factor
      var res = layout.getPositionAndSize(i);
      // draw it at all?
      if(res != undefined) {
        // draw single bubble
        drawBubble(drawingSurface, ids[i], res.x, res.y, 40, res.scale);
      }
    }
  }

  // debugging: scroll on click/shift-click
  d3.select("#ids-vis").on("mousedown", function(d) {
    // console.log("move!");
      if(d3.event.shiftKey) {
        layout.scroll(-10);
      } else {
        layout.scroll(10);
      }
      draw();
  }); // d3.select()

}; // draw()
