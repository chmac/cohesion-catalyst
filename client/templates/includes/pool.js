/**
 * pool.js
 *
 * TODO Provide overview description of this file.
 */


/**
  * init code for the "ID Pool" screen
  */
Template.idPool.onCreated(function() {

  // array to store the pool of IDs for rendering  
  Template.idPool.ids = [];

  // Testing
  var id = Template.idPool.addID("Hello World!","4","purple");

});

/**
  *   add an ID to the pool of IDs to be rendered
  */
Template.idPool.addID = function(text,count,color) {

  var id = {};
  id.text = text || "wat?";
  id.count = count || 1;
  id.color = color || "purple";
  Template.idPool.ids.push(id);

  // Testing
  var debug = Template.idPool.getID(id.text);
  console.log(debug);

};

/**
  *   search ID by text and return full ID information, or undefined
  */
Template.idPool.getID = function(text) {
  for(var i=0; i<Template.idPool.ids.length; i++) {
    if(Template.idPool.ids[i].text == text) {
      return Template.idPool.ids[i];
    }
  }
  return undefined;
};

/**
  *   delete ID, identified by text
  */
Template.idPool.deleteID = function(text) {
  for(var i=0; i<Template.idPool.ids.length; i++) {
    if(Template.idPool.ids[i].text == text) {
      Template.idPool.ids.slice(i,1);
      return;
    }
  }
};

/**
  *   update information for an ID, identified by text
  */
Template.idPool.updateID = function(text, newText, newCount, newColor) {
  for(var i=0; i<Template.idPool.ids.length; i++) {
    var id = Template.idPool.ids[i];
    if(id.text == text) {
      id = {"text": newText || id.text, 
            "count": newCount || id.count,
            "color": newColor || id.color};
      return;
    }
  }
};


/** 
  * draw ID bubble at specified position with specified scale factor
  * drawingSurface: the SVG area's topmost group element
  * id: one entry from the ids array
  * pos: array containing X and Y coordinate of bubble to be drawn
  * scale: scale factor for bubble's size
  **/
Template.idPool.drawBubble = function(drawingSurface, id, pos, scale) {

  var bubbleGroup = drawingSurface.append("g")
    .attr("transform", "translate(" + pos[0] + "," + pos[1] + ")");

  bubbleGroup.append("circle")
    .attr("r", 40*scale)
    .style("fill", id.color);

  bubbleGroup.append("text")
    .attr("dy", ".3em")
    .style("text-anchor", "middle")
    .style("fill", "white")
    .text(id.text);

};


 /**
  * Adds a callback to be called when an instance of this template is rendered and inserted
  * into the DOM.
  * All of the {@code D3} code goes inside this callback to allow for accessing the DOM elements and
  * interact with them.
  * (cf. <a href="http://docs.meteor.com/#/full/template_onRendered">Meteor onRendered()</a>)
  */
 Template.idPool.onRendered(function() {
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
  Template.idPool.drawBubble(drawingSurface, Template.idPool.ids[0], [width/2, height/3], 1.2);


}); // end Template.idPool.onRendered()
