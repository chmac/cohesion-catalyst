Template.myIds.onRendered(function() {

  var margin,
    width,
    height,
    radius,
    placeHolderTxt,
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
    currentTrainingId,
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
  isFixed = false;
  selectedNode = null;
  mousedownNode = null;
  mouseupNode = null;

  currentUser = Meteor.user();
  currentTrainingId = currentUser.profile.currentTraining;
  console.log("Template onRendered - current trainingId is: " + currentTrainingId);
  currentAvatar = Avatars.findOne({type: currentUser.profile.avatar});

  if (currentTrainingId && Identifications.find().count() === 0) {
    console.log("find count");
    rootNode = {
      level: 0,
      fixed: true,
      x: width / 2,
      y: height / 3 * 1.5,
      children: [],
      createdBy: currentUser._id,
      trainingId: currentTrainingId
    };

    Identifications.insert(rootNode, function(error, result) {
      if (error) {
        return throwError("Error: " + error.reason);
      }
    });
  }

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

  // Handle the mousedown event for the outer svgGroup.
  mousedown = function() {
    console.log("svg mousedown");
    if (!mousedownNode) {
      // TODO(nz): Implement Zoom+Pan behavior
      return;
    }
  };

  // Handle the mousemove event for the outer svgGroup.
  mousemove = function() {
    // We do not want the dragLine to be drawn arbitrarily within the drawing surface.
    if (!mousedownNode) {
      return;
    }

    // We update the coordinates of the dragLine during mousemove to draw a line
    // from the mousedownNode to the current mouse position.
    dragLine
      .attr("class", "drag-line")
      .attr("x1", mousedownNode.x)
      .attr("y1", mousedownNode.y)
      .attr("x2", d3.mouse(this)[0])
      .attr("y2", d3.mouse(this)[1]);
  }; // end mousemove()

  // Handle the mouseup event for the outer svgGroup.
  mouseup = function() {
    console.log("svg mouseup");
    var newNodePos,
      node,
      newNodeId,
      link,
      newEditableElem
      ;

    // Hide the drag line when mousemove has finished.
    dragLine.attr("class", "drag-line-hidden");

    if (!mousedownNode || mouseupNode === mousedownNode) {
      console.log("up == down");
      selectedNode = null;
      resetMouseVars();
      //updateLayout();
      return;
    }

    // Create a new node object with the current mouse position coordinates.
    newNodePos = d3.mouse(this);
    node = {
      level: mousedownNode.level + 1,
      fixed: isFixed,
      x: newNodePos[0],
      y: newNodePos[1],
      parentId: mousedownNode._id,
      children: [],
      name: placeHolderTxt,
      createdBy: currentUser._id,
      trainingId: currentTrainingId
    };

    // Add the new node to our 'Identifications' collection and
    // push the returned '_id' to its parent 'children' array.
    newNodeId = Identifications.insert(node, function(error, result) {
      if (error) {
        return throwError("Error: " + error.reason);
      }
    });

    Identifications.update(node.parentId, {
      $push: {children: newNodeId}
    }, function(error, result) {
      if (error) {
        return throwError("Error: " + error.reason);
      }
    });

    // Create a new link object for the edge between the mousedownNode and
    // the newly created node and add it to our 'Links' collection.
    link = {
      source: mousedownNode,
      target: Identifications.findOne({"_id": newNodeId})
    };
    Links.insert(link, function(error, result) {
      if (error) {
        return throwError("Error: " + error.reason);
      }
    });

    // Set the new node as selectedNode.
    selectedNode = Identifications.findOne({"_id": newNodeId});

    console.log("mousedownNode, ", mousedownNode);
    console.log("selectedNode, ", selectedNode);

    resetMouseVars();

    updateLayout(Identifications.find().fetch(), Links.find().fetch());

    // Select the editable <p> element.
    newEditableElem = d3.selectAll(".node.child").filter(function(d) {
      return d && d._id === selectedNode._id;
    }).select("p.txt-input").node();

    // Give the <p> element instant focus.
    newEditableElem.focus();

    /**
     * We want to select all of the text content within the currently active editable element
     * to allow for instant text entering. The default text selection color is customized
     * via CSS pseudo-element ::selection (@see CSS file)
     * cf. https://developer.mozilla.org/en-US/docs/Web/API/document/execCommand [as of 2015-02-25]
     */
    document.execCommand("selectAll", false, null);
  }; // end mouseup()


  updateLayout = function(idsCollection, linksCollection) {
    console.log("updateLayout");
    var nodeEnterGroup,
        nodeControls,
        dragIcon,
        deleteIcon,
        iconRadius,
        dashedRadius;

    iconRadius = 15;
    dashedRadius = 40;

    nodes = idsCollection;
    links = linksCollection;

    linkElements = linkElements.data(links, function(d) {
      return d.source._id + "-" + d.target._id;
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

    // Bind the data to the nodeElements selection and also returns the update selection.
    nodeElements = nodeElements.data(nodes, function(d, i) {
      return d._id;
    });

    nodeElements.classed("node-selected", function(d) {
      return selectedNode && d._id === selectedNode._id;
    });

    // Remove any deleted elements
    nodeElements.exit().remove();

    nodeEnterGroup = nodeElements.enter().append("g")
      .attr("data-id", function(d) {
        return d._id;
      })
      .attr("class", "node")
      .attr("transform", function(d) {
        return "translate(" + d.x + ", " + d.y + ")";
      })
      .classed({
        "root": function(d) {
          return d._id && d.level === 0;
        },
        "child": function(d) {
          return d._id && d.level > 0;
        },
        "node-selected": function(d) {
          return selectedNode && d._id === selectedNode._id;
        }
      });

    // TEST circle for checking transfoms
    // nodeEnterGroup.append("circle")
    //   .attr("r", 10)
    //   .style("fill", "green");

    nodeEnterGroup.append(function(d) {
      var avatarIcon,
        filledCircle
        ;

      if (d.level === 0) {
        avatarIcon = document.createElementNS(d3.ns.prefix.svg, "use");
        avatarIcon.setAttributeNS(d3.ns.prefix.xlink, "xlink:href", currentAvatar.url);
        avatarIcon.setAttribute("width", 150);
        avatarIcon.setAttribute("height", 150);
        avatarIcon.setAttribute("transform", "translate(-75, -75)");
        //     // Meteor.defer(function() {
        //     //   iconBBox = avatarIcon.node().getBBox();
        //     //   avatarIcon.attr({
        //     //     x: -iconBBox.x - iconBBox.width/2,
        //     //     y: -iconBBox.y - iconBBox.height/2
        //     //   });
        //     // });
        return avatarIcon;
      }

      filledCircle = document.createElementNS(d3.ns.prefix.svg, "circle");
      filledCircle.setAttribute("r", radius);
      filledCircle.setAttribute("class", "filled");
      return filledCircle;
    });


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
        svgText.textContent = currentUser.username;
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
        d3.event.stopPropagation();
        mousedownNode = d;
        if (mousedownNode === selectedNode) {
          console.log("mousedownNode === selectedNode");
          selectedNode = null;
        } else {
          selectedNode = mousedownNode;
        }
        // Position the drag line coordinates
        dragLine
          .attr("class", "drag-line")
          .attr("x1", mousedownNode.x)
          .attr("y1", mousedownNode.y)
          .attr("x2", mousedownNode.x)
          .attr("y2", mousedownNode.y);

        //updateLayout();
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

        //updateLayout();
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
          var newName,
            inputTxt = d3.select(this).select("p.txt-input");

          newName = inputTxt.text();
          if (newName === placeHolderTxt || newName === "") {
            Session.set("emptyNodeWarning", d._id);
          }
          Identifications.update(d._id, {
            $set: {name: newName}
          });

          if (d === selectedNode) {
            selectedNode = null;
          }
          //updateLayout();
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
        .attr("transform", "translate(" + (-dashedRadius - 30) + "," + (-dashedRadius) + ")")
        .attr("class", "drag-icon")
        .call(drag);

      dragIcon.append("use")
        .attr("xlink:href", "svg/icons.svg#drag-icon");

      deleteIcon = nodeControls.append("g")
        .attr("transform", "translate(" + (dashedRadius) + "," + (-dashedRadius) + ")")
        .attr("class", "delete-icon");

      deleteIcon.append("use")
        .attr("xlink:href", "svg/icons.svg#delete-icon");

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
    .nodes(Identifications.find().fetch())
    .links(Links.find().fetch())
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

  // nodeElements = svgGroup.selectAll(".node");
  // linkElements = svgGroup.selectAll(".link");

  // We declare a 'Tracker.autorun' block to monitor the reactive data sources
  // represented by the cursors resulting from querying our Mongo collections.
  // If the result of our collection query changes, the function will re-run.
  Tracker.autorun(function() {
    var identifications,
      fromTo;

    identifications = Identifications.find().fetch();
    fromTo = Links.find().fetch();
    nodeElements = svgGroup.selectAll(".node");
    linkElements = svgGroup.selectAll(".link");
    updateLayout(identifications, fromTo);
  });

});

Template.myIds.onDestroyed(function() {
  // TODO stop autorun
});

Template.myIds.helpers({
  warningDialog: function() {
    return Session.get("emptyNodeWarning");
  }
});

Template.warning.events({
  "click #remove -btn": function(event, template) {
    event.preventDefault();
    var targetId = Session.get("emptyNodeWarning");
    Identifications.remove(targetId);
    Links.remove(Links.findOne({"target._id": targetId})._id, function(error, result){
      if (error) {
        return throwError("Error: " + error.reason);
      }
      Session.set("emptyNodeWarning", null);
    });
  },
  "click #enter-btn, close.bs.alert #info-dialog": function(event, template) {
    event.preventDefault();
    var targetId = Session.get("emptyNodeWarning");
    d3.select("[data-id=" + targetId + "]").select("p.txt-input").node().focus();
    document.execCommand("selectAll", false, null);
    Session.set("emptyNodeWarning", null);
  }
});
