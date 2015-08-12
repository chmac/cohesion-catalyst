/**
 * my_ids.js
 *
 * TODO provide overview description of this file
 */

var PLACEHOLDER_TXT = "I identify with...";

/**
 * Adds a callback to be called when an instance of this template is created.
 * We use this callback for removing empty nodes when the user navigates to another
 * page and navigates back or when the users does a 'Refresh'.
 */
Template.myIds.onCreated(function() {
  var emptyIds = Identifications.find({
    name: {
      $in: [PLACEHOLDER_TXT, ""]
    }
  });
  if (emptyIds.count() > 0) {
    emptyIds.forEach(function(empty) {
      deleteNodeAndLink(empty._id);
    });
  }
});

/**
 * Adds a callback to this template so that it is called when an instance of this template
 * is rendered and inserted into the DOM.
 * All of the {@code D3} code goes inside this callback to allow for accessing the DOM elements and
 * interact with them.
 * (cf. <a href="http://docs.meteor.com/#/full/template_onRendered">Meteor onRendered()</a>)
 */
Template.myIds.onRendered(function() {

  var margin,
    width,
    height,
    xPos,
    yPos,
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
    drawLineToMousePosition,
    createNodeAtMousePosition,
    dragNodeToMousePosition,
    deselectCurrentNode,
    updateLayout,
    updateDOM,
    currentUser,
    currentTrainingId,
    currentAvatar;

  margin = {
    top: 20,
    right: 10,
    bottom: 20,
    left: 10
  };

  width = 768 - margin.left - margin.right;
  height = 1024 - margin.top - margin.bottom;
  xPos = width / 2;
  yPos = height / 3 * 1.5;
  radius = 35;
  placeHolderTxt = PLACEHOLDER_TXT;
  isFixed = true;
  selectedNode = null;
  mousedownNode = null;
  mouseupNode = null;

  currentUser = Meteor.user();
  currentTrainingId = currentUser.profile.currentTraining;
  currentAvatar = Avatars.findOne({
    type: currentUser.profile.avatar
  });

  if (currentTrainingId && Identifications.find().count() === 0) {
    console.log("find count");
    rootNode = {
      level: 0,
      fixed: true,
      x: xPos,
      y: yPos,
      px: xPos,
      py: yPos,
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

  /**
   * Handles the dragging (i.e. re-positioning) of an existing node element (an identification bubble).
   * It is called from a {@code mousedown} event if the {@code Shift} key was active and registers
   * the handlers for the {@mousemove} and {@mouseup} events that follow the {@mousedown} event.
   * These handlers are defined within the function.
   *
   * @param {Object} nodeDataObject The joined data of the HTML/SVG element that received
   * the {@code mousedown} event.
   */
  dragNodeToMousePosition = function(nodeDataObject) {
    var mousePos,
      dragX,
      dragY,
      rootNodeData;

    // We get the bound data of our root node for accessing its position since
    // we want to prevent the user from dragging nodes beneath the root node's position.
    rootNodeData = d3.select(".root").datum();

    // We register the event handlers that will respond to the mousemove events
    // and to the mouseup events subsequent to this mousedown event.
    // Note that we are registering to both the individual node <g> elements and
    // the encompassing <g> element (i.e. the drawing surface).
    d3.select("#gid" + nodeDataObject._id)
      //.on("mousemove", moveNode)
      .on("mouseup", dragend);

    d3.select("#ids-vis g")
      .on("mousemove", moveNode)
      .on("mouseup", dragend);

    /**
     * Manages the moving of the element by responding to the {@code mousemove} event.
     * Uses {@code d3.mouse} to retrieve the current mouse coordinates on the drawing surface
     * and updates the values of the {@code x} and {@code y} positions in the regarding database
     * collections which will automatically update the HTML/SVG.
     */
    function moveNode() {
      mousePos = d3.mouse(d3.select("#ids-vis g").node());
      dragX = detectBoundaries(mousePos, rootNodeData, radius, width)[0];
      dragY = detectBoundaries(mousePos, rootNodeData, radius, width)[1];

      Identifications.update(nodeDataObject._id, {
        $set: {
          x: dragX,
          y: dragY
        }
      });

      Links.find({
        "source._id": nodeDataObject._id
      }).forEach(function(link) {
        Links.update(link._id, {
          $set: {
            "source.x": dragX,
            "source.y": dragY
          }
        }, {
          multi: true
        });
      });

      Links.find({
        "target._id": nodeDataObject._id
      }).forEach(function(link) {
        Links.update(link._id, {
          $set: {
            "target.x": dragX,
            "target.y": dragY
          }
        }, {
          multi: true
        });
      });
    } // end moveNode()

    /**
     * Handles the {@code mouseup} event subsequent to moving an element.
     * Terminates the dragging.
     */
    function dragend() {
      // We remove the CSS class indicating an element being dragged.
      d3.select(this)
        //.on("mousemove", null)
        .classed("dragging", false);

      // We deregister the {@code mousemove} event
      d3.select("#ids-vis g").on("mousemove", null);
      // We deselect the current element and reset our variables.
      selectNodeElement(null);
      resetMouseVars();
    } // end dragend()
  }; // end dragNodeToMousePosition()

  /**
   * Handles the {@code tick} event of the {@code d3.layout.force()}.
   * {@code tick} events are dispatched for each tick of the force layout simulation, so listening
   * to these events allows for updating the displayed DOM positions of nodes and links.
   * (cf. <a href="https://github.com/mbostock/d3/wiki/Force-Layout#on">Force-Layout#on</a>)
   */
  updateDOM = function() {
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

  /**
   * Sets the data objects referencing the previously processed nodes to null.
   */
  resetMouseVars = function() {
    mousedownNode = null;
    mouseupNode = null;
  };

  /**
   * Handles the {@code mousedown} event received by the encompassing SVG <g> element when
   * no {@code Shift} key is being pressed.
   * It simply deselects the HTML/SVG element and sets the data objects referencing the previously
   * processed nodes to null.
   */
  deselectCurrentNode = function() {
    if (!mousedownNode) {
      selectNodeElement(null);
      resetMouseVars();
      // TODO(nz): Implement Zoom+Pan behavior
      return;
    }
  };


  /**
   * Responds to the {@code mousemove} event when no {@code Shift} key is being pressed, i.e. when
   * a user wants to create a new node.
   * Draws a temporary line between the current mouse position and to the position of the node
   * element that received the {@code mousedown} event
   * This handler is registered on the encompassing SVG <g> element representing the drawing surface.
   */
  drawLineToMousePosition = function() {
    var rootNodeData;

    // We get the bound data of our root node for accessing its position.
    rootNodeData = d3.select(".root").datum();

    // We do not want the dragLine to be drawn arbitrarily within the drawing surface.
    if (!mousedownNode) {
      return;
    }

    // We do not want the dragLine to be drawn when we drag a node.
    if (d3.event.shiftKey) {
      return;
    }

    if (Session.equals("selectedElement", mousedownNode._id)) {
      selectNodeElement(null);
    }

    // We update the coordinates of the dragLine during mousemove to draw a line
    // from the mousedownNode to the current mouse position.
    dragLine
      .attr("class", "drag-line")
      .attr("x1", mousedownNode.x)
      .attr("y1", mousedownNode.y)
      .attr("x2", detectBoundaries(d3.mouse(this), rootNodeData, radius, width)[0])
      .attr("y2", detectBoundaries(d3.mouse(this), rootNodeData, radius, width)[1]);
  }; // end drawLineToMousePosition()



  /**
   * Handles the {@code mouseup} event without a pressed {@code Shift} key that occurs at the end
   * of a {@code mousemove} event.
   * This function is responsible for creating a new data object of an 'Identification' node bubble
   * and adding it to the regarding collections in our database.
   * Makes use of the reactivity provided by {@code Meteor} to arrange the data driven
   * update of the DOM by {@code D3}.
   *
   * This handler is registered on the encompassing SVG <g> element representing the drawing surface.
   */
  createNodeAtMousePosition = function() {
    var rootNodeData,
      newNodePos,
      newX,
      newY,
      node,
      newNodeId,
      link,
      newEditableElem;

    // We are not on a node but on the drawing-surface so we want to
    // deselect the currently selected node and reset.
    if (!mousedownNode) {
      selectNodeElement(null);
      resetMouseVars();
      return;
    }

    if (d3.event.shiftKey) {
      return;
    }

    // We get the bound data of our root node for accessing its position since
    // we want to prevent the user from creating nodes beneath the root node's position.
    rootNodeData = d3.select(".root").datum();

    // Since moving the mouse has finished, we hide the line drawn during dragging.
    // It will be replaced with a newly created 'linkElement', i.e. an SVG <line> which
    // represents the link between nodes.
    dragLine.attr("class", "drag-line-hidden");

    // Get the current mouse position coordinates.
    newNodePos = d3.mouse(this);
    newX = detectBoundaries(newNodePos, rootNodeData, radius, width)[0];
    newY = detectBoundaries(newNodePos, rootNodeData, radius, width)[1];

    // Create a new node object with the current mouse position coordinates.
    node = {
      level: mousedownNode.level + 1,
      fixed: isFixed,
      x: newX,
      y: newY,
      px: newX,
      py: newY,
      parentId: mousedownNode._id,
      children: [],
      name: placeHolderTxt,
      createdBy: currentUser._id,
      trainingId: currentTrainingId,
      editCompleted: false
    };

    // Add the new node to our 'Identifications' collection and
    // push the returned '_id' to its parent 'children' array.
    newNodeId = Identifications.insert(node, function(error, result) {
      if (error) {
        return throwError(error.reason);
      }
    });

    Identifications.update(node.parentId, {
      $push: {
        children: newNodeId
      }
    }, function(error, result) {
      if (error) {
        return throwError(error.reason);
      }
    });

    // Create a new link object for the edge between the mousedownNode and
    // the newly created node and add it to our 'Links' collection.
    link = {
      source: mousedownNode,
      target: Identifications.findOne({
        "_id": newNodeId
      })
    };
    Links.insert(link, function(error, result) {
      if (error) {
        return throwError(error.reason);
      }
    });

    // Set the new node as selectedNode.
    selectedNode = Identifications.findOne({
      "_id": newNodeId
    });
    selectNodeElement(selectedNode._id);

    resetMouseVars();

    updateLayout(Identifications.find().fetch(), Links.find().fetch());

    // Select the editable <p> element.
    newEditableElem = d3.selectAll(".node.child").filter(function(d) {
      return d && d._id === selectedNode._id;
    }).select("p.txt-input").node();

    // Give the <p> element instant focus.
    newEditableElem.focus();

    // We want to select all of the text content within the currently active editable element
    // to allow for instant text entering. The default text selection color is customized
    // via CSS pseudo-element ::selection (@see CSS file)
    // cf. https://developer.mozilla.org/en-US/docs/Web/API/document/execCommand [as of 2015-02-25]
    document.execCommand("selectAll", false, null);
  }; // end createNodeAtMousePosition()

  /**
   * Manages the data binding and establishing of the {@code D3} {@code update}, {@code enter} and
   * {@code exit} selection. It is responsible for creating and rendering the visualization depending
   * on the resulting selections and according to the applied attributes. It also manages the event
   * registration.
   * Besides the initial call, this function will automatically be called again from within
   * a {@code Tracker.autorun} function every time the underlying reactive data sources change.
   *
   * @param {Array} idsCollection The queried documents of the 'Identifications' collection.
   * @param {Array} linksCollection The queried documents of the 'Links' collection.
   */
  updateLayout = function(idsCollection, linksCollection) {
    var nodeEnterGroup,
      avatarSize,
      nodeControls,
      deleteIcon,
      iconRadius,
      dashedRadius;

    iconRadius = 15;
    dashedRadius = 40;
    avatarSize = 150;

    nodes = idsCollection;
    links = linksCollection;

    // We produce our D3 'update selection' (i.e. the result of the 'data()' operator).
    // 'linkElements' represents all the selected DOM elements (here: <g.link>) bound to the
    // specified data elements (i.e. the 'links' array).
    linkElements = linkElements.data(links, function(d) {
      return d.source._id + "-" + d.target._id;
    });

    // We operate on our 'update selection' to determine the exiting elements, i.e. all the
    // present DOM elements (here: <g.link>) for which no new data point was found in our
    // 'links' array.
    linkElements.exit().remove();

    // We operate on our 'update selection' to determine the entering elements, i.e. the
    // elements that we want to insert into the DOM according to each data point in our
    // 'links' array for which no corresponding DOM element was found in our current selection.
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

    // We produce our D3 'update selection' (i.e. the result of the 'data()' operator).
    // 'nodeElements' represents all the selected DOM elements (here: <g.node>) bound to the
    // specified data elements (i.e. the 'nodes' array).
    nodeElements = nodeElements.data(nodes, function(d, i) {
      return d._id;
    });

    // We operate on our 'update selection' to determine the exiting elements, i.e. all the
    // present DOM elements (here: <g.node>) for which no new data point was found in our
    // 'nodes' array.
    nodeElements.exit().remove();

    // We produce our D3 'enter selection'.
    // 'nodeEnterGroup' represents the entering elements, i.e. the elements that we want to
    // append to the DOM according to each data point in our 'nodes' array for which no
    // corresponding DOM element was found in our current selection.
    nodeEnterGroup = nodeElements.enter().append("g")
      .attr("id", function(d) {
        // We need to prefix the value that is assigned to the 'id' attribute
        // in order to prevent an invalid 'querySelector' which will be the case
        // if the value happens to start with a numeric character.
        // So we use the prefix 'gid' ('gid' as in 'group identifier').
        return "gid" + d._id;
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
          return Session.equals("selectedElement", d._id);
        },
        "node-empty": function(d) {
          return Session.equals("emptyNode", d._id);
        }
      });


    nodeEnterGroup.append(function(d) {
      var avatarIcon,
        filledCircle;

      if (d.level === 0) {
        avatarIcon = document.createElementNS(d3.ns.prefix.svg, "use");
        avatarIcon.setAttributeNS(d3.ns.prefix.xlink, "xlink:href", currentAvatar.url);
        avatarIcon.setAttribute("width", avatarSize);
        avatarIcon.setAttribute("height", avatarSize);
        avatarIcon.setAttribute("transform", "translate(" + (-avatarSize / 2) + "," + (-
          avatarSize / 2) + ")");
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
        htmlParagraph;

      if (d.level === 0) {
        svgText = document.createElementNS(d3.ns.prefix.svg, "text");
        svgText.setAttribute("text-anchor", "middle");
        svgText.textContent = currentUser.profile.name;
        svgText.setAttribute("transform", "translate(0," + (avatarSize / 2 + 5) + ")");
        return svgText;
      }

      // HEADS UP: Chrome will ignore the camelCase naming of SVG <foreignObject> elements
      // and instead renders a lower case tagname <foreignobject>.
      // So we apply a class "foreign-object" to be used as selector if needed.
      // cf. http://bl.ocks.org/jebeck/10699411 [as of 2015-02-23]
      svgForeignObject = document.createElementNS(d3.ns.prefix.svg, "foreignObject");
      svgForeignObject.setAttribute("class", "foreign-object");
      svgForeignObject.setAttribute("width", radius * 2);
      svgForeignObject.setAttribute("height", radius * 2);
      svgForeignObject.setAttribute("transform", "translate(" + (-radius) + ", " + (-
        radius) + ")");
      htmlParagraph = document.createElementNS(d3.ns.prefix.xhtml, "p");
      htmlParagraph.setAttribute("class", "txt-input");
      htmlParagraph.setAttribute("contentEditable", true);
      htmlParagraph.textContent = d.name;
      svgForeignObject.appendChild(htmlParagraph);

      return svgForeignObject;
    });

    nodeEnterGroup
      .on("mousedown", function(d) {
        // We select the current DOM element, i.e. the <g> element containing <circle> and <p>
        var domNode = d3.select(this);
        d3.event.stopPropagation();
        mousedownNode = d;

        // We enable the dragging of a node when the holds down the 'SHIFT' key.
        if (d3.event.shiftKey) {
          if (d.level > 0) {
            domNode.classed("dragging", true);
            dragNodeToMousePosition(mousedownNode);
          }

        } else {

          // We need to ensure that the user enters some text before he or she may
          // continue to create other identification bubbles.
          if (mousedownNode.name === placeHolderTxt || mousedownNode.name === "") {
            d3.select("#ids-vis g")
              .on("mousemove", null)
              .on("mouseup", null);
            domNode.classed("node-empty", true);
            // Session.set("emptyNode", mousedownNode._id);
            // We select the placeholder text to allow for instant text input.
            // HEADS UP: We call the 'focus()' function from the 'mouseup' event handler because calling
            // it from the 'mousedown' event handler requires 'event.preventDefault()' in order to keep
            // the focus from leaving the <p> element.
            domNode.on("mouseup", function() {
              d3.event.stopPropagation();
              domNode.select("p.txt-input").node().focus();
              document.execCommand("selectAll", false, null);
            });
            return;
          } else {
            d3.select("#ids-vis g")
              .on("mousemove", drawLineToMousePosition)
              .on("mouseup", createNodeAtMousePosition);

            domNode
              .on("mouseup", function(d) {
                d3.event.stopPropagation();
                mouseupNode = d;

                if (!mousedownNode || mouseupNode._id === mousedownNode._id) {
                  resetMouseVars();
                  return;
                }
              });
          }
        }
        selectNodeElement(mousedownNode._id);
      })
      .on("keydown", function(d) {
        // For the 'keydown' event we need to prevent that the return character is
        // appended to the input text.
        if (d3.event.keyCode === 13) {
          d3.event.preventDefault();
        }
      })
      .on("keyup", function(d) {
        // Here, we process the user input:
        // Using "keyup" instead of 'keydown' is necessary because 'keydown' event is fired
        // before the editable content inside the <p> element has changed and is processed, respectively.
        d3.event.stopPropagation();

        if (d.level > 0) {
          var newName,
            inputTxt;

          inputTxt = d3.select(this).select("p.txt-input");
          newName = inputTxt.text();

          // When the user hits 'ENTER' (i.e. keycode 13) we update the 'name' field and the
          // 'editCompleted' field of the current document in the 'Identifications'
          // collection and deselect the node element.
          // The 'editCompleted' field allows for database queries only for documents
          // that a user has finished editing. Therefore, on 'ENTER' it will be set to 'true'.
          // In any other case, i.e. all along while the user is still typing, the 'editCompleted'
          // field remains 'false'.
          // NOTE: We also have to update the 'Links' collection due to the somewhat inconvenient
          // data model.
          if (d3.event.keyCode === 13) {
            Identifications.update(d._id, {
              $set: {
                name: newName,
                editCompleted: true
              }
            });
            Links.find({
              "source._id": d._id
            }).forEach(function(link) {
              Links.update(link._id, {
                $set: {
                  "source.name": newName,
                  "source.editCompleted": true
                }
              }, {
                multi: true
              });
            });
            Links.find({
              "target._id": d._id
            }).forEach(function(link) {
              Links.update(link._id, {
                $set: {
                  "target.name": newName,
                  "target.editCompleted": true
                }
              }, {
                multi: true
              });
            });

            inputTxt.node().blur();
            selectNodeElement(null);

          } else {
            Identifications.update(d._id, {
              $set: {
                name: newName,
                editCompleted: false
              }
            });
            Links.find({
              "source._id": d._id
            }).forEach(function(link) {
              Links.update(link._id, {
                $set: {
                  "source.name": newName,
                  "source.editCompleted": false
                }
              }, {
                multi: true
              });
            });
            Links.find({
              "target._id": d._id
            }).forEach(function(link) {
              Links.update(link._id, {
                $set: {
                  "target.name": newName,
                  "target.editCompleted": false
                }
              }, {
                multi: true
              });
            });
          }

          // We need to ensure that the placeholder text gets replaced by user input or that user
          // does not leave the input empty, respectively.
          // Therefore, we show whether the input text is valid or not.
          if (newName === placeHolderTxt || newName === "") {
            d3.select(this).classed("node-empty", true);
            Session.set("emptyNode", d._id);
          } else {
            d3.select(this).classed("node-empty", false);
            Session.set("emptyNode", null);
          }

        }
        // We use 'return' here to abort listening to this event on root level
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

    deleteIcon = nodeControls.append("g")
      .attr("transform", "translate(" + (dashedRadius) + "," + (-dashedRadius) + ")")
      .attr("class", "delete-icon")
      .on("mousedown", function(d) {
        d3.event.stopPropagation();
        deleteNodeAndLink(d._id);
      });

    deleteIcon.append("use")
      .attr("xlink:href", "svg/icons.svg#delete-icon");

    if (d3.event) {
      // Prevent browser's default behavior
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

  // Create the SVG element
  svgViewport = d3.select("#ids-graph").append("svg")
    .attr("id", "ids-vis")
    .attr("viewBox", "0 0 " + (width + margin.left + margin.right) + " " + (height + margin
      .top +
      margin.bottom))
    .attr("preserveAspectRatio", "xMidYMid meet");

  svgGroup = svgViewport.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .on("mousedown", deselectCurrentNode);

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


  // We declare a 'this.autorun' block to monitor the reactive data sources
  // represented by the cursors resulting from querying our Mongo collections.
  // If the result of our collection query changes, the function will re-run.
  // 'this.autorun' is a version of 'Tracker.autorun' with 'this' being the current
  // template instance. Using 'this.autorun' (i.e. 'template.autorun') instead of
  // 'Tracker.autorun' allows for stopping the monitoring automatically when the template is
  // destroyed.
  this.autorun(function() {
    var identifications,
      fromTo;

    identifications = Identifications.find({
      createdBy: currentUser._id,
      trainingId: currentTrainingId
    }).fetch();
    fromTo = Links.find({
      "source.createdBy": currentUser._id,
      "source.trainingId": currentTrainingId,
      "target.createdBy": currentUser._id,
      "target.trainingId": currentTrainingId
    }).fetch();
    nodeElements = svgGroup.selectAll(".node");
    linkElements = svgGroup.selectAll(".link");
    updateLayout(identifications, fromTo);
  });

}); // end Template.myIds.onRendered()


/**
 * Adds a callback to be called when an instance of this template is removed from the DOM
 * and destroyed. We use this callback for cleaning up and removing empty nodes.
 */
Template.myIds.onDestroyed(function() {
  var emptyIds = Identifications.find({
    name: {
      $in: [PLACEHOLDER_TXT, ""]
    }
  });
  if (emptyIds.count() > 0) {
    emptyIds.forEach(function(empty) {
      deleteNodeAndLink(empty._id);
    });
  }
});



/**
 * Constrains the dragging of nodes to the SVG viewport, i.e. the drawing surface.
 * For example, if the user is about to drag a node outside of the SVG canvas, the
 * coordinate is set to the bounding value, taking the node's radius into account.
 * At the bottom, the specified boundary is the position of the avatar icon.
 * @param {Array} mouseCoords The current {@code x} and {@code y} coordinates as two-element array.
 * @param {Object} root The root node data object.
 * @param {number} radius The specified radius of the node (i.e. {@code <circle>}).
 * @param {number} width The specified width of the drawing surface.
 * @return {Array}
 */
function detectBoundaries(mouseCoords, root, radius, width) {
  var dragCoords = mouseCoords;

  if (mouseCoords[0] < radius) {
    dragCoords[0] = radius;
  }

  if (mouseCoords[0] > width - (radius * 2)) {
    dragCoords[0] = width - (radius * 2);
  }

  if (mouseCoords[1] < radius) {
    dragCoords[1] = radius;
  }

  if (mouseCoords[1] > root.y) {
    dragCoords[1] = root.y;
  }

  return dragCoords;
} // end checkBoundaries()

/**
 * Selects (or deselects) a node element (i.e. an identification circle).
 * If the node is a newly created identification circle it gets selected immediately.
 * All the other nodes are selectable by user interaction.
 * We use a Session variable to detect selected or deselected state, respectively.
 * Depending on that, we update the current document's 'editCompleted' field and we
 * also apply a CSS class, which in turn toggles the control handle for deleting a circle.
 * @param {string} elementId The (database document) id of the node.
 */
function selectNodeElement(elementId) {
  var selectedElement = Session.get("selectedElement"),
    nodeName;

  // We check if there exists currently already a selected element.
  if (selectedElement) {
    // In case the user clicked on the already selected element, we do nothing and stop
    // executing the function by using 'return'.
    if (selectedElement === elementId) {
      return;
    }
    // In any other case we need to check if the currently selected element is already filled with words other
    // than the placeholder text or the empty string.
    nodeName = Identifications.findOne(selectedElement).name;
    if (nodeName === PLACEHOLDER_TXT || nodeName === "") {
      d3.select("#ids-vis g")
        .on("mousemove", null)
        .on("mouseup", null);
      d3.select("#gid" + selectedElement).classed("node-empty", true);
      Session.set("emptyNode", selectedElement);
      return;
    }
    Identifications.update(selectedElement, {
      $set: {
        editCompleted: true
      }
    });
    d3.select("#gid" + selectedElement).classed({
      "node-selected": false,
      "node-empty": false,
      "dragging": false
    });
    Session.set("emptyNode", null);
  }

  if (elementId) {
    Identifications.update(elementId, {
      $set: {
        editCompleted: false
      }
    });
    d3.select("#gid" + elementId).classed("node-selected", true);
  }
  Session.set("selectedElement", elementId);
}

/**
 * Deletes a node document (i.e. an identification document) and its associated
 * link documents from the respective collection.
 * @param {string} id The current datum of the '_id' field bound to the current element.
 */
function deleteNodeAndLink(id) {
  var nodeId,
    nodeDoc;

  nodeId = id;

  if (nodeId) {
    nodeDoc = Identifications.findOne(nodeId);
    if (nodeDoc.children.length) {
      return throwError(
        "You can not remove an identification bubble with attached child-bubbles.");
    }
    Links.remove(Links.findOne({
      "target._id": nodeId
    })._id, function(error, result) {
      if (error) {
        return throwError(error.reason);
      }
    });
    Identifications.remove(nodeId, function(error, result) {
      if (error) {
        return throwError(error.reason);
      }
    });
    Identifications.update(nodeDoc.parentId, {
      $pull: {
        children: nodeId
      }
    }, function(error, result) {
      if (error) {
        return throwError(error.reason);
      }
    });

    if (Session.equals("emptyNode", nodeId)) {
      Session.set("emptyNode", null);
    }

    if (Session.equals("selectedElement", nodeId)) {
      Session.set("selectedElement", null);
    }
  }
}
