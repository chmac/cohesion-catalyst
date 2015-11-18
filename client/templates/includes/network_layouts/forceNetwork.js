/**
 * forceNetwork.js
 *
 *
 */

function forceLayoutNetwork() {
  // We create a margin object following the D3 margin convention.
  // cf. http://bl.ocks.org/mbostock/3019563
  var margin = {
    top: 10,
    right: 10,
    bottom: 10,
    left: 10
  };

  var width = 788,
    height = 1044,
    avatarSize = 150,
    outerRadius = Math.min(width, height-avatarSize/2) / 2 - avatarSize / 2,
    svg,
    allData,
    linksData = [],
    nodesData = [],
    force = d3.layout.force()
    ;

  function networkVis(selection, data) {
    // selection.each(function(data) {
    //
    // });
    var drawingSurface = makeDrawingSurface(selection);


  }

  networkVis.margin = function(m) {
    if (!arguments.length) {
      return margin;
    }
    margin = m;
    return networkVis;
  };

  networkVis.width = function(w) {
    if (!arguments.length) {
      return width;
    }
    width = w;
    return networkVis;
  };

  networkVis.height = function(h) {
    if (!arguments.length) {
      return height;
    }
    height = h;
    return networkVis;
  };

  networkVis.outerRadius = function(r) {
    if (!arguments.length) {
      return outerRadius;
    }
    outerRadius = r;
    return networkVis;
  };

  /**
    * Create the SVG drawing area
    *
    * @param {} container - A D3 selection of the DOM element the visualization will live in.
    *   e.g. d3.select("#ids-graph")
    */
  function makeDrawingSurface(container) {
    var margin,
      width,
      height,
      svgViewport,
      drawingSurface;

    margin = networkVis.margin;

    // We define the inner dimensions of the drawing area.
    width = networkVis.width - margin.left - margin.right;
    height = networkVis.height - margin.top - margin.bottom;

    // remove all existing children of the drawing area
    container.select("svg").remove();
    // We create our outermost <svg> and append it to the existing <div id='ids-graph'>.
    svgViewport = container.append("svg")
      .attr("id", "network-vis")
      .attr("viewBox", "0 0 " + (width + margin.left + margin.right) + " " + (height + margin
        .top + margin.bottom))
      .attr("preserveAspectRatio", "xMidYMin meet");

    // We append a <g> element that translates the origin to the top-left
    // corner of the drawing area.
    drawingSurface = svgViewport.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // We append a <rect> as the 'canvas' to draw on and as target of 'pointer events'.
    drawingSurface.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("class", "drawing-surface");

    // FOR DEBUGGING: circle in the center
    // drawingSurface.append("circle").attr({
    //   cx: currentWidth/2,
    //   cy: currentHeight/2,
    //   r: 5
    // }).style("fill", "white");

    // events on background
    touchMouseEvents(drawingSurface, drawingSurface.node(), {
      "test": false,
      "down": function(d,x,y) {
        d3.selectAll("line").style("opacity", 0);
      }
    });


    return drawingSurface;

  }


  return networkVis;
}
