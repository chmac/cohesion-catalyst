Template.myIds.onRendered(function() {
  var margin,
    width,
    height,
    radius,
    placeHolderTxt,
    uniqueNodeId,
    selectedNode,
    mousedownNode,
    mouseupNode,
    rootNode,
    force,
    drag,
    nodes,
    links,
    nodeElements,
    linkElements,
    svgViewport,
    svgCheckbox,
    isFixed,
    svgGroup,
    dragLine,
    resetMouseVars,
    mousemove,
    mouseup,
    mousedown,
    updateLayout,
    updateDOM,
    dragstart,
    dragmove,
    dragend,
    currentUser,
    currentAvatar
    ;

  margin = {
    top: 20,
    right: 10,
    bottom: 20,
    left: 10
  };

  width = 768 - margin.left - margin.right;
  height = 1024 - margin.top - margin.bottom;
  radius = 35;
  placeHolderTxt = "I identify with...";
  uniqueNodeId=333;
  isFixed = false;
  selectedNode = null;
  mousedownNode = null;
  mouseupNode = null;

  currentUser = Meteor.user();
  currentAvatar = Avatars.findOne({type: currentUser.profile.avatar});

  rootNode = {
    name: currentUser.username,
    id: currentUser._id,
    avatarUrl: currentAvatar.url,
    identifications: [],
    level: 0,
    fixed: true,
    x: width / 2,
    y: height / 3 * 1.5
  };

  dragstart = function(d) {
    console.log("dragstart event ", d3.event);
    d3.event.sourceEvent.stopPropagation();
    d3.event.sourceEvent.preventDefault();
    force.stop();
  };

  dragmove = function(d) {
    console.log("dragmove event ", d3.event);
    d.px += d3.event.dx;
    d.py += d3.event.dy;
    d.x += d3.event.dx;
    d.y += d3.event.dy;
    updateDOM();
  };

  dragend = function(d) {
    console.log("dragend event ", d3.event);
    d.fixed = true;
    updateDOM();
    force.resume();
  };

  updateDOM = function () {
    linkElements.attr("x1", function(d) {
        return d.source.x;
      })
      .attr("y1", function(d) {
        return d.source.y;
      })
      .attr("x2", function(d) {
        return d.target.x;
      })
      .attr("y2", function(d) {
        return d.target.y;
      });

    nodeElements.attr("transform", function(d) {
      return "translate(" + d.x + "," + d.y + ")";
    });

  };

  resetMouseVars = function() {
    mousedownNode = null;
    mouseupNode = null;
  };

  // Handles the mousedown event for the outer svgGroup.
  mousedown = function() {
    console.log("svg mousedown");
    if (!mousedownNode) {
      // TODO(nz): Implement Zoom+Pan behavior
      return;
    }
  };

  // Handles the mousemove event for the outer svgGroup.
  mousemove = function() {
    // We do not want the dragLine to be drawn arbitrarily within the drawing surface.
    if (!mousedownNode) {
      return;
    }

    // We update the coordinates of the dragLine during mousemove to draw a line
    // from the mousedownNode to the current mouse position.
    dragLine
      .attr("class", "link")
      .attr("x1", mousedownNode.x)
      .attr("y1", mousedownNode.y)
      .attr("x2", d3.mouse(this)[0])
      .attr("y2", d3.mouse(this)[1]);
  }; // end mousemove()

  // Handles the mouseup event for the outer svgGroup.
  mouseup = function() {
    console.log("svg mouseup");
    var newNodePos,
      node,
      newNodeId,
      newLink,
      newEditableElem
      ;

    // Hides the drag line when mousemove has finished.
    dragLine.attr("class", "drag-line-hidden");

    if (!mousedownNode || mouseupNode === mousedownNode) {
      console.log("up == down");
      selectedNode = null;
      resetMouseVars();
      updateLayout();
      return;
    }

    // Adds a new node object with the current mouse position coordinates.
    newNodePos = d3.mouse(this);
    newNodeId = uniqueNodeId;
    uniqueNodeId++;
    node = {
      x: newNodePos[0],
      y: newNodePos[1],
      name: placeHolderTxt,
      id: newNodeId,
      fixed: isFixed,
      level: mousedownNode.level + 1
    };

    if (mousedownNode.identifications) {
      mousedownNode.identifications.push(node);
    } else {
      mousedownNode.identifications = [node];
    }
    console.log("mousedownNode, ", mousedownNode);

    // Adds a link object for the edge between mousedownNode and the newly created node.
    links.push({
      source: mousedownNode,
      target: node
    });

    nodes.push(node);

    // Sets the new node as selectedNode.
    selectedNode = node;
    console.log("selectedNode, ", selectedNode);

    resetMouseVars();

    updateLayout();

    // Selects the editable <p> element.
    newEditableElem = d3.selectAll(".node.child").filter(function(d) {
      return d && d.id === newNodeId;
    }).selectAll("p.txt-input").node();

    // Gives the <p> element instant focus.
    newEditableElem.focus();

    /**
     * Selects all of the text content within the currently active editable element
     * to allow for instant text entering. The default text selection color is customized
     * via CSS pseudo-element ::selection (@see CSS file)
     * cf. https://developer.mozilla.org/en-US/docs/Web/API/document/execCommand [as of 2015-02-25]
     */
    document.execCommand("selectAll", false, null);
  }; // end mouseup()


  updateLayout = function() {
    console.log("updateLayout");
    var nodeEnterGroup,
        nodeControls,
        dragIcon,
        deleteIcon,
        iconRadius,
        dashedRadius;

    iconRadius = 15;
    dashedRadius = 40;

    nodes = force.nodes();
    links = force.links();


    linkElements = linkElements.data(links, function(d) {
      return d.source.id + "-" + d.target.id;
    });

    linkElements.exit().remove();

    linkElements.enter().insert("line", ".node")
      .attr("class", "link")
      .attr("x1", function(d) {
        return d.source.x;
      })
      .attr("y1", function(d) {
        return d.source.y;
      })
      .attr("x2", function(d) {
        return d.target.x;
      })
      .attr("y2", function(d) {
        return d.target.y;
      });

    // Binds the data to the nodeElements selection and also returns the update selection.
    nodeElements = nodeElements.data(nodes, function(d, i) {
      return d.id;
    });

    nodeElements.classed("node-selected", function(d) {
      return d === selectedNode;
    });

    // Removes any deleted elements
    nodeElements.exit().remove();

    nodeEnterGroup = nodeElements.enter().append("g")
      .attr("class", "node")
      .attr("transform", function(d) {
        return "translate(" + d.x + ", " + d.y + ")";
      })
      .classed({
        "root": function(d) {
          return d.level === 0;
        },
        "child": function(d) {
          return d.level > 0;
        },
        "node-selected": function(d) {
          return d === selectedNode;
        }
      });

    // TEST circle for checking transfoms
    // nodeEnterGroup.append("circle")
    //   .attr("r", 10)
    //   .style("fill", "green");

    if (!nodeEnterGroup.empty() && nodeEnterGroup.classed("root")) {
      var avatarIcon,
        iconBBox;

      avatarIcon = nodeEnterGroup.append("use");
      avatarIcon.attr({
        "xlink:href": function(d) {
          return d.avatarUrl;
        }
      });
      Meteor.defer(function() {
        iconBBox = avatarIcon.node().getBBox();
        avatarIcon.attr({
          x: -iconBBox.x - iconBBox.width/2,
          y: -iconBBox.y - iconBBox.height/2
        });
      });
    }

    nodeEnterGroup.append("circle")
      .attr("r", radius)
      .attr("class", "filled");


    nodeEnterGroup.insert("circle", ".filled")
      .attr("r", dashedRadius)
      .attr("class", "dashed");



    nodeEnterGroup.append(function(d) {
      var svgText,
        svgForeignObject,
        htmlParagraph
        ;

      if (d.level === 0) {
        svgText = document.createElementNS(d3.ns.prefix.svg, "text");
        svgText.setAttribute("text-anchor", "middle");
        svgText.textContent = d.name;
        Meteor.defer(function() {
        svgText.setAttribute("transform", "translate(0, " + (d3.select("use").node().getBBox().height/2 + 22.5) + ")");
      });
        return svgText;
      }
      /**
       * HEADS UP: Chrome will ignore the camelCase naming of SVG <foreignObject> elements
       * and instead renders an lower case tagname <foreignobject>.
       * So we apply a class "foreign-object" to be used as selector if needed.
       * cf. http://bl.ocks.org/jebeck/10699411 [as of 2015-02-23]
       */
      svgForeignObject = document.createElementNS(d3.ns.prefix.svg, "foreignObject");
      svgForeignObject.setAttribute("class", "foreign-object");
      svgForeignObject.setAttribute("width", radius * 2);
      svgForeignObject.setAttribute("height", radius * 2);
      svgForeignObject.setAttribute("transform", "translate(" + (-radius) + ", " + (-radius) + ")");
      htmlParagraph = document.createElementNS(d3.ns.prefix.xhtml, "p");
      htmlParagraph.setAttribute("class", "txt-input");
      htmlParagraph.setAttribute("contentEditable", true);
      htmlParagraph.textContent = d.name;
      svgForeignObject.appendChild(htmlParagraph);

      return svgForeignObject;
    });

    nodeEnterGroup
      .on("mousedown", function(d) {
        // if (d3.event.defaultPrevented) {
        //   return;
        // }
        // console.log("g mousedown mit d: ", d);
        d3.event.stopPropagation();
        mousedownNode = d;
        // console.log(mousedownNode.id + ", " + mousedownNode.name);
        if (mousedownNode === selectedNode) {
          console.log("mousedownNode === selectedNode");
          selectedNode = null;
        } else {
          selectedNode = mousedownNode;
        }
        // Positions the drag line coordinates
        dragLine.attr("class", "link")
          .attr("x1", mousedownNode.x)
          .attr("y1", mousedownNode.y)
          .attr("x2", mousedownNode.x)
          .attr("y2", mousedownNode.y);

        updateLayout();
      })
      .on("mouseup", function(d) {
        // if (d3.event.defaultPrevented) {
        //   return;
        // }
        d3.event.stopPropagation();
        mouseupNode = d;
        if (mouseupNode === mousedownNode) {
          resetMouseVars();
          return;
        }

        updateLayout();
      })
      .on("keydown", function(d) {
        d3.event.stopPropagation();
        if (d3.event.keyCode === 13) {
          d3.event.preventDefault();
          d3.select(this).select("p.txt-input").node().blur();
        }
      })
      .on("focusout", function(d) {
        if (d.level > 0) {
          var inputTxt = d3.select(this).select("p.txt-input");
          d.name = inputTxt.text() === placeHolderTxt ? "" : inputTxt.text();
          inputTxt.text(d.name);
          if (d === selectedNode) {
            selectedNode = null;
          }
          updateLayout();
        }
        return;
      })
      .on("dblclick", function(d) {
        if (d.level > 0) {
          d3.select(this).select("p.txt-input").node().focus();
          document.execCommand("selectAll", false, null);
        }
      });

      nodeControls = nodeEnterGroup.append("g")
        .attr("class", "selected-controls");

      dragIcon = nodeControls.append("g")
        .attr("transform", "translate(" + (-dashedRadius - 12.5) + "," + (-dashedRadius + 10) + ")")
        .attr("class", "drag-icon")
        .call(drag);

      dragIcon.append("circle")
        .attr("r", iconRadius);

      dragIcon.append("path")
        .attr("d", function(d) {
          return "M0 12" +
                 "l4-4 h-4 v-16 h4 l-4-4 l-4 4 h4 v16 h-4 z" +
                 "M-12 0" +
                 "l4-4 v4 h16 v-4 l4 4 l-4 4 v-4 h-16 v4 z";
        });

      deleteIcon = nodeControls.append("g")
        .attr("transform", "translate(" + (dashedRadius + 12.5) + "," + (-dashedRadius + 10) + ")")
        .attr("class", "delete-icon");

      deleteIcon.append("circle")
        .attr("r", iconRadius);

      deleteIcon.append("line")
        .attr({
          x1: 0,
          y1: -10,
          x2: 0,
          y2: 10,
          transform: "rotate(45 0 0)"
        });

      deleteIcon.append("line")
        .attr({
          x1: 0,
          y1: -10,
          x2: 0,
          y2: 10,
          transform: "rotate(-45 0 0)"
        });

    if (d3.event) {
      // Prevent browser's default behavior
      console.log("d3 event ", d3.event);
      d3.event.preventDefault();
    }

    force.start();
  }; // end updateLayout() function


  /**
   * Creates the force layout object and sets some configuration properties.
   * On initialization the layout's associated nodes will be set to the rood node while
   * the layout's associated links will be initialized with an empty array.
   */
  force = d3.layout.force()
    .size([width, height])
    .nodes([rootNode]) // Initializes the layout's nodes with the root node.
    .links([]) // Initializes the layout's links with an empty array.
    .linkDistance(function(d) {
      return 250 / (d.source.level + 1) + radius;
    })
    .linkStrength(0.2)
    .charge(-6000)
    .gravity(0) // A value of 0 disables gravity.
    .friction(0.01) // Slows the layout down at eacht iteration.
    .on("tick", updateDOM); // Calls the updateDOM() function on each iteration step.

  drag = d3.behavior.drag()
    .on("dragstart", dragstart)
    .on("drag", dragmove)
    .on("dragend", dragend);

  // Create the SVG element
  svgViewport = d3.select("#ids-graph").append("svg")
    .attr("id", "ids-vis")
    .attr("viewBox", "0 0 " + (width + margin.left + margin.right) + " " + (height + margin.top + margin.bottom))
    .attr("preserveAspectRatio", "xMidYMid meet");

  // svgCheckbox = svgViewport.append("g")
  //   .attr("transform", "translate(" + (margin.left) + ", 0)")
  //   .attr("class", "sticky-checkbox")
  //   .on("click", function() {
  //     var that = d3.select(this);
  //     if (that.classed("checked")) {
  //       isFixed = false;
  //       that.classed("checked", false);
  //     } else {
  //       isFixed = true;
  //       that.classed("checked", true);
  //     }
  //     nodes.forEach(function(n) {
  //       if (n.level && n.level !== 0) {
  //         n.fixed = isFixed;
  //       }
  //     });
  //     updateLayout();
  //   });

  // svgCheckbox.append("text")
  //   .attr("x", margin.left + 15)
  //   .attr("y", 18)
  //   .attr("text-anchor", "start")
  //   .text("Sticky");
  //
  // svgCheckbox.append("circle")
  //   .attr("r", 6)
  //   .attr("cx", margin.left + 5)
  //   .attr("cy", 12);
  //
  // svgCheckbox.append("path")
  //   .attr("d", "M 13 12 L 15 15 L 18 9");


  svgGroup = svgViewport.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .on("mousemove", mousemove)
    .on("mousedown", mousedown)
    .on("mouseup", mouseup);

  svgGroup.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("class", "drawing-surface");

  // Line displayed when dragging new nodes
  dragLine = svgGroup.append("line")
    .attr("class", "drag-line")
    .attr("x1", 0)
    .attr("y1", 0)
    .attr("x2", 0)
    .attr("y2", 0);

  nodeElements = svgGroup.selectAll(".node");
  linkElements = svgGroup.selectAll(".link");

  updateLayout();
});