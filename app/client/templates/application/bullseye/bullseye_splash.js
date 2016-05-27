Template.bullseyeSplash.onRendered(function() {

  var svg,
    circleAndTextGroup,
    radius,
    strokeWidth,
    spacer,
    circleData,
    w,h,
    label,
    stopTimer;

  radius = 36;
  strokeWidth = 8;
  spacer = 20;
  stopTimer = false;


  circleData = [
    {label: "c", color: "#d62728"}, // red
    {label: "o", color: "#ffeb0c"}, // yellow
    {label: "h", color: "#1f77b4"}, // blue
    {label: "e", color: "#9467bd"}, // purple
    {label: "s", color: "#2ca02c"}, // green
    {label: "i", color: "#e377c2"}, // pink
    {label: "o", color: "#60bce9"}, // lightblue
    {label: "n", color: "#ff7f0e"}, // orange
    {label: "catalyst", color: "#fff"} // white
  ];

  // Add some random values used for animating the characters.
  circleData.forEach(function(datum) {
    var sign = Math.round(Math.random()) * 2 - 1;
    datum.vAngle = (Math.random()*2*Math.PI + 0.15) * sign;
  });


  // We want the welcome circles to be arranged in a 3x3 grid.
  // To accomplish this we use the index 'i' of the element within the selection to
  // sequentially position the elements (i.e. each svg group containing a circle and text element).
  // cf. http://bl.ocks.org/mbostock/1345853 [as of 2015-04-22]
  function translate(d, i) {
    return "translate(" + (i % 3) * (2 * radius + strokeWidth + spacer ) +
      "," + Math.floor(i / 3) * (2 * radius + strokeWidth + spacer ) + ")";
  }

  var wrapper = d3.select("#splash-wrapper");

  svg = wrapper
    .append("svg")
    .attr("id", "splash-svg")
    .attr("viewBox", "0 0 470 470")
    // .attr("preserveAspectRatio", "xMidYMid meet")
    .append("g")
    .attr("id", "splash-group");


  circleAndTextGroup = svg.selectAll("g").data(circleData, function(d, i) {
    return d.color;
  })
  .enter()
  .append("g")
  .attr("class", "circle-text-group")
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
      class: function(d) {
        if (d.label.length > 1) {
          return "circle-label word-label";
        }
        return "circle-label char-label";
       },
      x: 0,
      y: function(d) {
        if (d.label.length > 1) {
          return 6;
        }
        return 10;
      },
      "text-anchor": "middle"
    })
    .style({
      fill: function(d) {
        if (d.label.length > 1) {
          return "#000";
        }
        return "#fff";
      }
    })
    .text(function(d) {
      return d.label;
    });

  w = svg.node().getBBox().width;
  h = svg.node().getBBox().height;
  svg.attr("transform", "translate(" + ((w - strokeWidth * 0.5) * 0.5) + "," + ((h - strokeWidth * 0.5) * 0.5) + ")");


  // DEBUGGING
  // svg.append("rect")
  //   .attr({
  //     x: - (radius + strokeWidth/2),
  //     y: - (radius + strokeWidth/2),
  //     width: w + strokeWidth/2,
  //     height: h + strokeWidth/2,
  //     fill: "rgba(255,0,0,0.3)"
  //   });

  label = d3.selectAll(".circle-label");
  // label = d3.selectAll(".word-label");

  function animate(elapsed) {
    label
      .attr("transform", function(d, i) {
        return "rotate(" + elapsed/radius * d.vAngle + ", 0, 0)";
      });

    return stopTimer;
  }

  d3.timer(animate);
}); // onRendered


Template.bullseyeSplash.onDestroyed(function() {
  stopTimer = true;
}); // onDestroyed
