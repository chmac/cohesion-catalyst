Template.home.onRendered(function() {

  // We prevent the screen scrolling on touch devices
  d3.select("#main").on("touchmove", function() {
    if (d3.event) {
      d3.event.preventDefault();
    }
  });

  var svg,
    circleAndTextGroup,
    radius,
    strokeWidth,
    spacer,
    circleData,
    groupBBox,
    w,
    h;

  radius = 36;
  strokeWidth = 8;
  spacer = 20;

  circleData = [
    {label: "c", color: "#d62728"}, // red
    {label: "o", color: "#ffeb0c"}, // yellow
    {label: "h", color: "#1f77b4"}, // blue
    {label: "e", color: "#9467bd"}, // purple
    {label: "s", color: "#2ca02c"}, // green
    {label: "i", color: "#e377c2"}, // pink
    {label: "o", color: "#60bce9"}, // lightblue
    {label: "n", color: "#ff7f0e"}, // orange
    {label: "machine", color: "#fff"} // white
  ];

  // We want the welcome circles to be arranged in a 3x3 grid.
  // To accomplish this we use the index 'i' of the element within the selection to
  // sequentially position the elements (i.e. each svg group containing a circle and text element).
  // cf. http://bl.ocks.org/mbostock/1345853 [as of 2015-04-22]
  function translate(d, i) {
    return "translate(" + (i % 3) * (2 * radius + strokeWidth + spacer ) +
      "," + Math.floor(i / 3) * (2 * radius + strokeWidth + spacer ) + ")";
  }

  svg = d3.select("#welcome-vis")
    .append("g")
    .attr("id", "welcome-circles")
    .attr("transform", "translate(" + (radius + strokeWidth) + "," + (radius + strokeWidth) + ")");

  circleAndTextGroup = svg.selectAll("g").data(circleData, function(d, i) {
    return d.color;
  })
  .enter()
  .append("g")
  .attr("transform", translate);

  circleAndTextGroup.append("circle")
  .attr({
    cx: 0,
    cy: 0,
    r: function(d) {
      if (d.label.length > 1) {
        return radius + (strokeWidth / 2);
      }
      return radius;
    },
    "stroke-width": strokeWidth,
    stroke: function(d) {
      if (d.label.length > 1) {
        return "none";
      }
      return d.color;
    },
    fill: function(d) {
      if (d.label.length > 1) {
        return d.color;
      }
      return "#000";
    }
  });

  circleAndTextGroup.append("text")
    .attr({
      x: 0,
      y: 7,
      "text-anchor": "middle",
      fill: function(d) {
        if (d.label.length > 1) {
          return "#000";
        }
        return "#fff";
      },
      "font-size": function(d) {
        if (d.label.length > 1) {
          return 18;
        }
        return 26;
      }
    })
    .text(function(d) {
      return d.label;
    });

    w = svg.node().getBBox().width;
    h = svg.node().getBBox().height;
    groupBBox = svg.append("rect")
      .attr("id", "b-box")
      .attr({
        x: - radius,
        y: - radius,
        width: w,
        height: h
      });

});


Template.home.events({
  "click #b-box": function(event, template) {
    event.preventDefault();
    if (Meteor.user()) {
      return;
    }
    // Use the global Session object to specify the current form to display.
    Session.set("formContainer", "loginForm");
  }
});
