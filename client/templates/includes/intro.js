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
    x,
    y;

  avatar = d3.select(target).select("use");
  x = avatar.attr("x");
  y = avatar.attr("y");
  avatar.transition()
    .attr("transform",
    "matrix(" + factor + ", 0, 0, " + factor + ", " +
      (x - factor * x) + ", " + (y - factor * y) +")");
}
