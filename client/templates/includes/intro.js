Template.intro.events({
  "mouseenter .avatar": function(event) {
    // var avatar = d3.select(event.target).select("use");
    scaleElement(event.target, 1.3);
  },
  "mouseleave .avatar": function(event) {
    // var avatar = d3.select(event.target).select("use");
    scaleElement(event.target, 1);
  }
});

function scaleElement(target, factor){
  var avatar,
    dimensions,
    x,
    y,
    transformOriginX,
    transformOriginY;

  avatar = d3.select(target).select("use");
  dimensions = avatar.node().getBoundingClientRect();
  // Here D3's 'attr()' function returns the value of as 'string'
  // so we need to type-convert string to number using the '+' operator.
  x = +avatar.attr("x");
  y = +avatar.attr("y");
  transformOriginX = x + dimensions.width / 2;
  transformOriginY = y + dimensions.height / 2;
  avatar.transition()
    .attr("transform",
    "translate(" + (transformOriginX) + "," + (transformOriginY) +
    ") scale(" + factor +
    ") translate(" + (-transformOriginX) + "," + (-transformOriginY) + ")" );
}
