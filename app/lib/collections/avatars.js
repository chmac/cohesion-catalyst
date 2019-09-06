Avatars = new Mongo.Collection("avatars");

function createOuterG() {
  const outerG = document.createElementNS(d3.ns.prefix.svg, "g");
  outerG.setAttribute("transform", "translate(-42, -42)");

  var topG = document.createElementNS(d3.ns.prefix.svg, "g");

  var rect = document.createElementNS(d3.ns.prefix.svg, "rect");
  rect.setAttribute("x", "42");
  rect.setAttribute("y", "42");
  rect.setAttribute("width", "42");
  rect.setAttribute("height", "42");
  rect.setAttribute("fill", "currentColor");
  rect.setAttribute("transform", "rotate(45 42 42)");
  topG.appendChild(rect);

  var circleOuter = document.createElementNS(d3.ns.prefix.svg, "circle");
  circleOuter.setAttribute("cx", "42");
  circleOuter.setAttribute("cy", "42");
  circleOuter.setAttribute("r", "42");
  circleOuter.setAttribute("fill", "currentColor");
  topG.appendChild(circleOuter);

  var circleInner = document.createElementNS(d3.ns.prefix.svg, "circle");
  circleInner.setAttribute("cx", "42");
  circleInner.setAttribute("cy", "42");
  circleInner.setAttribute("r", "36");
  circleInner.setAttribute("fill", "#000");
  topG.appendChild(circleInner);

  outerG.appendChild(topG);

  return outerG;
}

function appendEyes(outerG) {
  var circle = document.createElementNS(d3.ns.prefix.svg, "circle");
  circle.setAttribute("cx", "27");
  circle.setAttribute("cy", "35");
  circle.setAttribute("r", "4");
  circle.setAttribute("fill", "currentColor");
  outerG.appendChild(circle);

  var eye2 = document.createElementNS(d3.ns.prefix.svg, "circle");
  eye2.setAttribute("cx", "57");
  eye2.setAttribute("cy", "35");
  eye2.setAttribute("r", "4");
  eye2.setAttribute("fill", "currentColor");
  outerG.appendChild(eye2);

  return outerG;
}

function appendSmile(outerG) {
  var path = document.createElementNS(d3.ns.prefix.svg, "path");
  path.setAttribute("d", "M22 52 A 26 30, 0, 0, 0, 62 52");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-width", "3");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("fill", "none");
  outerG.appendChild(path);

  return outerG;
}

cohesionAvatars = {
  wink: function() {
    var outerG = createOuterG();

    var line = document.createElementNS(d3.ns.prefix.svg, "line");
    line.setAttribute("x1", "20");
    line.setAttribute("y1", "35");
    line.setAttribute("x2", "32");
    line.setAttribute("y2", "32");
    line.setAttribute("stroke", "currentColor");
    line.setAttribute("stroke-width", "4");
    line.setAttribute("stroke-linecap", "round");
    line.setAttribute("fill", "none");
    outerG.appendChild(line);

    var circle = document.createElementNS(d3.ns.prefix.svg, "circle");
    circle.setAttribute("cx", "57");
    circle.setAttribute("cy", "35");
    circle.setAttribute("r", "4");
    circle.setAttribute("fill", "currentColor");
    outerG.appendChild(circle);

    var path = document.createElementNS(d3.ns.prefix.svg, "path");
    path.setAttribute("d", "M22 52 A 26 30, 0, 0, 0, 62 52");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "3");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("fill", "none");
    outerG.appendChild(path);

    return outerG;
  },
  chuckle: function() {
    var outerG = createOuterG();

    var path = document.createElementNS(d3.ns.prefix.svg, "path");
    path.setAttribute("d", "M39 62 A 27 31, 0, 0, 0, 63 51");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "3");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("fill", "none");
    outerG.appendChild(path);

    appendEyes(outerG);

    return outerG;
  },
  smirk: function() {
    var outerG = createOuterG();

    appendEyes(outerG);

    var path = document.createElementNS(d3.ns.prefix.svg, "path");
    path.setAttribute("d", "M42 64 Q 51 75 56 59 Z");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "3");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("fill", "currentColor");
    outerG.appendChild(path);

    appendSmile(outerG);

    return outerG;
  },
  lol: function() {
    var outerG = createOuterG();

    appendEyes(outerG);

    var path = document.createElementNS(d3.ns.prefix.svg, "path");
    path.setAttribute("d", "M22 49 A 18 18, 0, 0, 0, 62 49 Z");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("fill", "currentColor");
    outerG.appendChild(path);

    return outerG;
  },
  smile: function() {
    var outerG = createOuterG();

    appendEyes(outerG);

    var path = document.createElementNS(d3.ns.prefix.svg, "path");
    path.setAttribute("d", "M22 52 A 26 30, 0, 0, 0, 62 52");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "3");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("fill", "none");
    outerG.appendChild(path);

    return outerG;
  },
  nerd: function() {
    var outerG = createOuterG();

    appendEyes(outerG);

    var circle = document.createElementNS(d3.ns.prefix.svg, "circle");
    circle.setAttribute("cx", "27");
    circle.setAttribute("cy", "35");
    circle.setAttribute("r", "9");
    circle.setAttribute("stroke", "currentColor");
    circle.setAttribute("stroke-width", "3");
    circle.setAttribute("fill", "none");
    outerG.appendChild(circle);

    var circle2 = document.createElementNS(d3.ns.prefix.svg, "circle");
    circle2.setAttribute("cx", "57");
    circle2.setAttribute("cy", "35");
    circle2.setAttribute("r", "9");
    circle2.setAttribute("stroke", "currentColor");
    circle2.setAttribute("stroke-width", "3");
    circle2.setAttribute("fill", "none");
    outerG.appendChild(circle2);

    var line = document.createElementNS(d3.ns.prefix.svg, "line");
    line.setAttribute("x1", "36");
    line.setAttribute("y1", "35");
    line.setAttribute("x2", "48");
    line.setAttribute("y2", "35");
    line.setAttribute("stroke", "currentColor");
    line.setAttribute("stroke-width", "3");
    line.setAttribute("fill", "none");
    outerG.appendChild(line);

    appendSmile(outerG);

    return outerG;
  },
  star: function() {
    var outerG = createOuterG();

    var g = document.createElementNS(d3.ns.prefix.svg, "g");
    g.setAttribute("transform", "translate(27, 35) scale(1.2)");

    var poly = document.createElementNS(d3.ns.prefix.svg, "polygon");
    poly.setAttribute("fill", "currentColor");
    poly.setAttribute("stroke-width", "2");
    poly.setAttribute(
      "points",
      "7,0 2.4270509831248424,1.7633557568774194 2.163118960624632,6.657395614066075 -0.927050983124842,2.853169548885461 -5.663118960624632,4.114496766047313 -3,3.6739403974420594e-16 -5.663118960624632,-4.114496766047311 -0.9270509831248427,-2.8531695488854605 2.1631189606246304,-6.6573956140660755 2.4270509831248415,-1.76335575687742"
    );
    g.appendChild(poly);

    outerG.appendChild(g);

    var g2 = document.createElementNS(d3.ns.prefix.svg, "g");
    g2.setAttribute("transform", "translate(57, 35) scale(1.2)");

    var poly2 = document.createElementNS(d3.ns.prefix.svg, "polygon");
    poly2.setAttribute("fill", "currentColor");
    poly2.setAttribute("stroke-width", "2");
    poly2.setAttribute(
      "points",
      "7,0 2.4270509831248424,1.7633557568774194 2.163118960624632,6.657395614066075 -0.927050983124842,2.853169548885461 -5.663118960624632,4.114496766047313 -3,3.6739403974420594e-16 -5.663118960624632,-4.114496766047311 -0.9270509831248427,-2.8531695488854605 2.1631189606246304,-6.6573956140660755 2.4270509831248415,-1.76335575687742"
    );
    g2.appendChild(poly2);

    outerG.append(g2);

    appendSmile(outerG);

    return outerG;
  },
  heart: function() {
    var outerG = createOuterG();

    var g = document.createElementNS(d3.ns.prefix.svg, "g");
    g.setAttribute("transform", "translate(28, 39) scale(0.5)");

    var path = document.createElementNS(d3.ns.prefix.svg, "path");
    path.setAttribute("fill", "currentColor");
    path.setAttribute(
      "d",
      "M0,0 c0,0-14-7.926-14-17.046 c0-9.356,13.159-10.399,14-0.454 c1.011-9.938,14-8.903,14,0.454 C14,-7.926,0,0,0,0"
    );
    g.appendChild(path);

    outerG.appendChild(g);

    var g2 = document.createElementNS(d3.ns.prefix.svg, "g");
    g2.setAttribute("transform", "translate(58, 39) scale(0.5)");

    var path2 = document.createElementNS(d3.ns.prefix.svg, "path");
    path2.setAttribute("fill", "currentColor");
    path2.setAttribute(
      "d",
      "M0,0 c0,0-14-7.926-14-17.046 c0-9.356,13.159-10.399,14-0.454 c1.011-9.938,14-8.903,14,0.454 C14,-7.926,0,0,0,0"
    );
    g2.appendChild(path2);

    outerG.append(g2);

    appendSmile(outerG);

    return outerG;
  },
  cool: function() {
    var outerG = createOuterG();

    var g = document.createElementNS(d3.ns.prefix.svg, "g");
    g.setAttribute("transform", "translate(27, 35) scale(0.9)");

    var path = document.createElementNS(d3.ns.prefix.svg, "path");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "1");
    path.setAttribute("stroke-linejoin", "round");
    path.setAttribute("fill", "currentColor");
    path.setAttribute(
      "d",
      "M10,0 q3,-9 2,-9 a9,2 0 0 0 -20,0 Q-14,7  -11,7 Q14,7 12,-9 Z"
    );
    g.appendChild(path);

    var path2 = document.createElementNS(d3.ns.prefix.svg, "path");
    path2.setAttribute("stroke", "currentColor");
    path2.setAttribute("stroke-width", "1");
    path2.setAttribute("stroke-linejoin", "round");
    path2.setAttribute("fill", "currentColor");
    path2.setAttribute("transform", "translate(35, 0) scale(-1, 1)");
    path2.setAttribute(
      "d",
      "M10,0 q3,-9 2,-9 a9,2 0 0 0 -20,0 Q-14,7  -11,7 Q14,7 12,-9 Z"
    );
    g.appendChild(path2);

    var line = document.createElementNS(d3.ns.prefix.svg, "line");
    line.setAttribute("x1", "12");
    line.setAttribute("y1", "-8");
    line.setAttribute("x2", "23");
    line.setAttribute("y2", "-8");
    line.setAttribute("stroke", "currentColor");
    line.setAttribute("stroke-width", "1");
    line.setAttribute("fill", "none");
    g.appendChild(line);

    var line2 = document.createElementNS(d3.ns.prefix.svg, "line");
    line2.setAttribute("x1", "11");
    line2.setAttribute("y1", "-2");
    line2.setAttribute("x2", "24");
    line2.setAttribute("y2", "-2");
    line2.setAttribute("stroke", "currentColor");
    line2.setAttribute("stroke-width", "4");
    line2.setAttribute("fill", "none");
    g.appendChild(line2);

    outerG.appendChild(g);

    appendSmile(outerG);

    return outerG;
  }
};
