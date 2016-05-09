/**
 * Creates an SVG container to draw in.
 * @param {Array} wrapper - The D3 selection we want the SVG to reside in.
 * @param {Object} margin - An object that holds values to margin the drawing area.
 */
makeCanvas  = function(wrapper, margin) {

  var containerHeight = wrapper.node().clientHeight;
  var containerWidth = wrapper.node().clientWidth;
  var height = containerHeight - margin.left - margin.right;
  var width = containerWidth - margin.top - margin.bottom;

  wrapper.select("svg").remove();

  var svgViewport = wrapper.append("svg")
    .attr("class", "svg-canvas")
    .attr("viewBox", "0 0 " + (width + margin.left + margin.right) + " " +
      (height + margin.top + margin.bottom));

  var canvas = svgViewport.append("g")
    .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

  // // We append a <rect> as the 'canvas' to draw on and as target of 'pointer events'.
  // canvas.append("rect")
  //   .attr("width", width)
  //   .attr("height", height);

  // =======================================
  // FOR DEBUGGING: big circle in the center
  // =======================================
  // canvas.append("circle").attr({
  //   cx: containerWidth * 0.5 - margin.left,
  //   cy: containerHeight * 0.5,
  //   r: 5
  // }).style("fill", "white");

  return canvas;
};
