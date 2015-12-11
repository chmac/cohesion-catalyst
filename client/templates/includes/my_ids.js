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
  var currentUser = Meteor.user();
  var currentTrainingId = currentUser.profile.currentTraining;
  var emptyIds = Identifications.find({
    createdBy: currentUser._id,
    trainingId: currentTrainingId,
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
    drawLineToMousePosition,
    createNodeAtMousePosition,
    dragNodeToMousePosition,
    deselectCurrentNode,
    updateLayout,
    updateDOM,
    currentUser,
    currentTrainingId,
    currentAvatar;

  // We create the force layout object.
  force = d3.layout.force();

  margin = {
    top: 10,
    right: 10,
    bottom: 10,
    left: 10
  };

  width = 788 - margin.left - margin.right;
  height = 1044 - margin.top - margin.bottom;
  xPos = width / 2;
  yPos = height / 3 * 1.5; // HACK Needs to be more RWD-ish!!!
  radius = 37;
  placeHolderTxt = PLACEHOLDER_TXT;
  isFixed = true;
  selectedNode = null;

  // We set the global Session variables to make them accessible across templates.
  Session.set("myIdsDrawingWidth", width);
  Session.set("myIdsCurrentRadius", radius);


  currentUser = Meteor.user();
  currentTrainingId = currentUser.profile.currentTraining;
  currentAvatar = Avatars.findOne({
    type: currentUser.profile.avatar
  });

  if (currentTrainingId && Identifications.findCurrentIdentifications(currentUser._id, currentTrainingId).count() === 0) {
    console.log("No IDs yet, inserting the rootNode...");
    rootNode = {
      level: 0,
      x: xPos,
      y: yPos
    };

    Meteor.call("insertRoot", rootNode, errorFunc);
  }

  /**
   * Handles the dragging (i.e. re-positioning) of an existing node element (an identification bubble).
   */
  dragNodeToMousePosition = function(d, x, y, dx, dy) {
    d3.event.preventDefault();
    var rootNodeData,
      mousePos,
      currentActiveNode;

    currentActiveNode = Session.get("selectedElement");

    if (isEmptyNode(currentActiveNode)) {
      promptEmptyNode(currentActiveNode);
      return;
    }

    var nodeDataObject = currentActiveNode;

    if (nodeDataObject && nodeDataObject.level === 0) {
      return;
    }

    // We get the bound data of our root node for accessing its position since
    // we want to prevent the user from dragging nodes beneath the root node's position.
    rootNodeData = d3.select(".root").datum();

    mousePos = [x,y];
    dragPos = detectCollision(nodeDataObject._id, mousePos, rootNodeData, radius, width);

    Meteor.call("updatePosition", nodeDataObject._id, dragPos, function(error, result) {
      if (error) {
        return throwError("Error: " + error.reason);
      }
    });

  }; // end dragNodeToMousePosition()

  function longDragEnd() {
    var currentActiveNode = Session.get("selectedElement");
    if (isEmptyNode(currentActiveNode)) {
      return;
    }

    toggleDragIndicator(d3.select("#gid" + currentActiveNode._id));
    selectNodeElement(null);
  } // end longDragend()


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
  }; // end updateDOM()


  /**
   * Handles the {@code mousedown} event received by the encompassing SVG <g> element when
   * no {@code Shift} key is being pressed.
   * It simply deselects the HTML/SVG element and sets the data objects referencing the previously
   * processed nodes to null.
   */
  deselectCurrentNode = function() {
    d3.event.preventDefault();
    var currentActiveNode = Session.get("selectedElement");
    if (isEmptyNode(currentActiveNode)) {
      promptEmptyNode(currentActiveNode);
      return;
    }

    selectNodeElement(null);
  };


  /**
   * Responds to a {@code mousemove} event or {@code touchmove} event, respectively (i.e. when
   * a user wants to create a new node).
   * Draws a temporary line between the current mouse/touch position and to the position of the node
   * element that received the event
   * This handler is registered on the encompassing SVG <g> element representing the drawing surface.
   * @param {Object} d
   * @param {number} x
   * @param {number} y
   * @param {number} dx
   * @param {number} dy
   */
  drawLineToMousePosition = function(d, x, y, dx, dy) {
    d3.event.preventDefault();
    var rootNodeData,
      currentActiveNode = Session.get("selectedElement");

    // We do not want the dragLine to be drawn arbitrarily within the drawing surface.
    if (!currentActiveNode) {
      return;
    }

    if (isEmptyNode(currentActiveNode)) {
      promptEmptyNode(currentActiveNode);
      return;
    }

    // We get the bound data of our root node for accessing its position.
    rootNodeData = d3.select(".root").datum();


    // We update the coordinates of the dragLine during mousemove to draw a line
    // from the currentActiveNode to the current mouse position.
    dragLine
      .attr("class", "drag-line")
      .attr("x1", currentActiveNode.x)
      .attr("y1", currentActiveNode.y)
      .attr("x2", detectCollision(undefined, [x,y], rootNodeData, radius, width)[0])
      .attr("y2", detectCollision(undefined, [x,y], rootNodeData, radius, width)[1]);

  }; // end drawLineToMousePosition()



  /**
   * Handles the {@code dragEnd} event that occurs on the 'drawingSurface" at the end of a {@code mousemove} event or
   * {@code touchmove} event, respectively.
   * This function is responsible for creating a new data object of an 'Identification' node bubble
   * and adding it to the regarding collections in our database.
   * Makes use of the reactivity provided by {@code Meteor} to arrange the data driven
   * update of the DOM by {@code D3}.
   *
   * This handler is registered on the encompassing SVG <g> element representing the drawing surface.
   */
  createNodeAtMousePosition = function(d, x, y, dx, dy) {
    var rootNodeData,
      newNodePos,
      newX,
      newY,
      node,
      newNodeId,
      newNodeElem;

    var currentActiveNode = Session.get("selectedElement");
    if (isEmptyNode(currentActiveNode)) {
      promptEmptyNode(currentActiveNode);
      return;
    }

    // We are not on a node but on the drawing-surface so we want to
    // deselect the currently selected node and reset.
    if (!currentActiveNode) {
      selectNodeElement(null);
      return;
    }

    // HEADS UP: Although dealing with the CSS style of the current element
    // (i.e. the node which was the starting point of the drag move)
    // is handled by the 'selectNodeElement()' function, we need to
    // remove the 'node-selected' class here to avoid flickering in
    // mobile browser Safari iOS (iPad device).
    d3.select("#gid" + currentActiveNode._id).classed("node-selected", false);

    // We get the bound data of our root node for accessing its position since
    // we want to prevent the user from creating nodes beneath the root node's position.
    rootNodeData = d3.select(".root").datum();

    // Since moving the mouse has finished, we hide the line drawn during dragging.
    // It will be replaced with a newly created 'linkElement', i.e. an SVG <line> which
    // represents the link between nodes.
    dragLine.attr("class", "drag-line-hidden");

    // Get the current mouse position coordinates.
    newNodePos = detectCollision(undefined, [x,y], rootNodeData, radius, width);

    // Create a new node object with the current mouse position coordinates.
    node = {
      level: currentActiveNode.level + 1,
      x: newNodePos[0],
      y: newNodePos[1],
      parentId: currentActiveNode._id,
      name: placeHolderTxt,
      editCompleted: false
    };

    Meteor.call("insertIdentification", node, function(error, result) {
      if (error) {
        return throwError("Error: " + error.reason);
      }
      // On success of the 'insertIdentification' method, we'll use the result value
      if (result) {
        newNodeId = result._id;
        // Set the new node as selectedNode.
        selectedNode = Identifications.findOneById(newNodeId);
        selectNodeElement(selectedNode);

        // TODO Is this call of 'updateLayout()' still necessary???????
        // updateLayout(Identifications.find().fetch(), Links.find().fetch());

        newNodeElem = d3.select("#gid" + selectedNode._id);
        newNodeElem.classed("node-selected", true);
        newNodeElem.select("p.txt-input").node().focus();

        // We want to select all of the text content within the currently active editable element
        // to allow for instant text entering. The default text selection color is customized
        // via CSS pseudo-element ::selection (@see CSS file)
        // cf. https://developer.mozilla.org/en-US/docs/Web/API/document/execCommand [as of 2015-02-25]
        document.execCommand("selectAll", false, null);

      }
    }); // end Meteor.call("insertIdentification")
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
    dashedRadius = 42;
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
        }
        // },
        // "node-selected": function(d) {
        //   var nodeSelected = Session.get("selectedElement");
        //   console.log(nodeSelected, ", ", d._id);
        //   return nodeSelected && (nodeSelected._id === d._id);
        // }
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
      filledCircle.classList.add("c-white");
      if (d.matched && d.matchColor) {
        filledCircle.classList.remove("c-white");
        filledCircle.classList.add(d.matchColor);
      }
      if (d.matchedBy && d.matchedBy.length > 0) {
        filledCircle.classList.remove("c-white");
        // TODO maybe no random color?
        filledCircle.classList.add(pickRandomColorClass());
      }
      return filledCircle;
    });


    nodeEnterGroup.insert("circle", ".filled")
      .attr("r", dashedRadius)
      .attr("class", "dashed");


    nodeEnterGroup.append(function(d) {
      var svgText,
        svgForeignObject,
        htmlDiv,
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
      htmlDiv = document.createElementNS(d3.ns.prefix.xhtml, "div");
      htmlParagraph = document.createElementNS(d3.ns.prefix.xhtml, "p");
      htmlParagraph.setAttribute("class", "txt-input");
      htmlParagraph.setAttribute("contenteditable", "true");
      htmlParagraph.textContent = d.name;
      // svgForeignObject.appendChild(htmlParagraph);
      svgForeignObject.appendChild(htmlDiv);
      htmlDiv.appendChild(htmlParagraph);

      return svgForeignObject;
    });


    var drawingSurface = d3.select("#ids-vis g");

    // events on background
    touchMouseEvents(drawingSurface, drawingSurface.node(), {
      "test": false,
      "down": deselectCurrentNode,
      "dragMove": drawLineToMousePosition,
      // TODO
      // Inspect why the event 'dragEnd' is needed both on this target 'drawingSurface'
      // and on the target 'nodeEnterGroup' (see below).
      // Removing in from target 'drawingSurface' crashes functionality on desktop browser.
      // Removing in from target 'nodeEnterGroup', crashes functionality on mobile browser.
      "dragEnd": createNodeAtMousePosition
      // TODO
      // Inspect why the events 'longDragMove' and 'longDragEnd' are also
      // working when only on target 'nodeEnterGroup' or vice versa
      // "longDragMove": dragNodeToMousePosition,
      // "longDragEnd": longDragEnd,
    });

    // touch/mouse events on IDs
    touchMouseEvents(nodeEnterGroup, drawingSurface.node(), {
      "test": false,
      "down": function(d) {
        // 'down' event is associated with 'touchstart' event on touch devices
        // and we want to prevent the default browser action.
        // Thus, a double-tap does not zoom in or out, and a
        // 'longDown'/'touchhold' won't trigger the magnifier.
        d3.event.preventDefault();
        var currentActiveNode = Session.get("selectedElement");

        if (isEmptyNode(currentActiveNode) && d._id != currentActiveNode._id) {
          promptEmptyNode(currentActiveNode);
          return;
        }

        selectNodeElement(d);
        // HEADS UP: It is important to stop the event propagation here.
        // We took care of the event, so we don't want anyone else to notice it.
        d3.event.stopPropagation();
      },
      // HEADS UP: We need to add 'dragEnd' also to the 'nodeEnterGroup' target.
      // Otherwise it does not work on mobile devices.
      // TODO Check why!!
      "dragEnd": createNodeAtMousePosition,
      "longDown": function(d) {
        var currentActiveNode = Session.get("selectedElement");

        if (isEmptyNode(currentActiveNode) && d._id != currentActiveNode._id) {
          promptEmptyNode(currentActiveNode);
          return;
        }

        var domNode = d3.select(this);

        if (d.level > 0) {
          // domNode.classed("dragging", true);
          toggleDragIndicator(domNode);
        } else {
          return;
        }
        return false;
      },
      "longDragMove": dragNodeToMousePosition,
      "longDragEnd": longDragEnd,
      "longClick": function(d) {
        var currentActiveNode = Session.get("selectedElement");

        if (!currentActiveNode) {
          return;
        }

        if (isEmptyNode(currentActiveNode) && d._id != currentActiveNode._id) {
          promptEmptyNode(currentActiveNode);
          return;
        }

        var domNode = d3.select("#gid" + currentActiveNode._id);
        toggleDragIndicator(domNode);
        selectNodeElement(null);

        // stop propagation and prevent default behavior
        d3.event.stopPropagation();
        return false;
      },
      "up": function(d) {
        var currentActiveNode = Session.get("selectedElement");

        if (!currentActiveNode) {
          return;
        }

        if (isEmptyNode(currentActiveNode) && d._id != currentActiveNode._id) {
          promptEmptyNode(currentActiveNode);
          return;
        }
        // We apply CSS class to the selected element.
        // We also re-set the 'contenteditable' attribute of the
        // <p> element to 'true' in case of a falsy value due to
        // previously editing.
        // Additionally, we need to give the element focus to
        // activate the virtual keyboard on touch device, since
        // we prevented the default action on 'touchstart'.
        var domNode = d3.select("#gid" + currentActiveNode._id);
        domNode.classed("node-selected", true);

        if (currentActiveNode.level > 0) {
          domNode.select("p.txt-input")
            .attr("contenteditable", "true")
            .node().focus();
          document.execCommand("selectAll", false, null);
        }

        d3.event.stopPropagation();
        return false;
      }
    }); // touchMouseEvents()


    // Since 'dblclick' is not yet implement in touchMouseEvents()
    // we apply it separately.
    nodeEnterGroup
      .on("dblclick ", function(d) {
        if (d.level > 0) {
          d3.select(this).select("p.txt-input").node().focus();
          document.execCommand("selectAll", false, null);
        }
        return false;
      });


    // keyboard events on IDs
    nodeEnterGroup
      .on("keydown", function(d) {
        // For the 'keydown' event we need to prevent that the return character is
        // appended to the input text.
        if (d3.event.keyCode == 13) {
          d3.event.preventDefault();
        }
      })
      .on("keyup", function(d) {
        // Here, we process the user input:
        // Using "keyup" instead of 'keydown' is necessary because 'keydown' event is fired
        // before the editable content inside the <p> element has changed and is processed, respectively.
        if (d.level > 0) {
          var newName,
            inputTxt;

          inputTxt = d3.select(this).select("p.txt-input");
          newName = inputTxt.text();

          // When the user hits 'ENTER' (i.e. keycode 13) we call the 'editIdentification' method
          // defined at {@see identifications.js} to update the fields 'name' and
          // 'editCompleted' of the current document in the 'Identifications'
          // collection. The value of 'editCompleted' is set to the value that is returned
          // from the check
          if (d3.event.keyCode == 13) {

            Meteor.call("editIdentification", d._id, newName, !isEmptyNode(d));

            // We remove focus from the text input.
            // We also set the 'contenteditable' attribute to 'false'
            // to ensure that further keypressing is not possible.
            inputTxt.node().blur();
            inputTxt.attr("contenteditable", "false");
            deselectCurrentNode();
            return;

          // User is still editing, so the 'editCompleted' field is 'false'
          } else {

            Meteor.call("editIdentification", d._id, newName, false);

            // We need to manually update the node data and the selection to make sure
            // the check for empty nodes operates on up-to-date data.
            d.name = newName;
            Session.set("selectedElement", d);
            selectNodeElement(d);
          }
        }
        // We use 'return' here to abort listening to this event on root level
        return;
      }); // keyboard events

    nodeControls = nodeEnterGroup.append("g")
      .attr("class", "selected-controls");

    deleteIcon = nodeControls.append("g")
      .attr("transform", "translate(" + (dashedRadius + 20) + "," + (10) + ")")
      .attr("class", "delete-icon");

    deleteIcon.append("use")
      .attr("xlink:href", "svg/icons.svg#delete-icon");

    nodeControls.append("rect")
      .attr("transform", "translate(" + (dashedRadius +10) + "," + (0) + ")")
      .attr({
        x: 0,
        y: 0,
        width: dashedRadius + 12,
        height: dashedRadius + 10
      });

    // Events on the delete button
    touchMouseEvents(nodeControls, drawingSurface.node(), {
      "test": false,
      "click": function(d) {
        deleteNodeAndLink(d._id);
        d3.event.stopPropagation();
        return false;
      }
    });

    if (d3.event) {
      // Prevent browser's default behavior
      d3.event.preventDefault();
    }

    force.start();
  }; // end updateLayout() function


  /**
   * We set some configuration properties of the force layout object.
   * On initialization the layout's associated nodes will be set to the rood node while
   * the layout's associated links will be initialized with an empty array.
   */
   force.size([width, height])
    .nodes(Identifications.find({
      createdBy: currentUser._id,
      trainingId: currentTrainingId
    }).fetch())
    .links(Links.find({
      "source.createdBy": currentUser._id,
      "source.trainingId": currentTrainingId,
      "target.createdBy": currentUser._id,
      "target.trainingId": currentTrainingId
    }).fetch())
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
    .attr("preserveAspectRatio", "xMidYMin meet");

  svgGroup = svgViewport.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

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

    identifications = Identifications.findCurrentIdentifications(currentUser._id, currentTrainingId).fetch();
    fromTo = Links.find({
      "source.createdBy": currentUser._id,
      "source.trainingId": currentTrainingId,
      "target.createdBy": currentUser._id,
      "target.trainingId": currentTrainingId
    }).fetch();
    nodeElements = svgGroup.selectAll(".node");
    linkElements = svgGroup.selectAll(".link");
    updateLayout(identifications, fromTo);

    // var colorQuery = Identifications.find({
    //   createdBy: currentUser._id,
    //   trainingId: currentTrainingId
    // }, {
    //   fields: {
    //     matchedBy: 1
    //   }
    // });
    // colorQuery.observeChanges({
    //   added: function() {
    //
    //   },
    //   changed: function() {
    //
    //   },
    //   removed: function() {
    //
    //   }
    // });
  });
}); // end Template.myIds.onRendered()


/**
 * Adds a callback to be called when an instance of this template is removed from the DOM
 * and destroyed. We use this callback for cleaning up and removing empty nodes.
 */
Template.myIds.onDestroyed(function() {
  var emptyIds = Identifications.find({
    createdBy: Meteor.userId(),
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
 * Checks the text content of the current node.
 * @param {Object} currentNode The value of the 'selectedElement' Session variable.
 * @return {boolean} True if the content of the element is the placeholder text or an empty
 *    string. False otherwise.
 */
function isEmptyNode(currentNode) {
  if (!currentNode) {
    return false;
  }
  return currentNode.name === PLACEHOLDER_TXT || currentNode.name === "";
}

/**
 * Marks the current node as an empty node.
 * A CSS class gets applied to color the node red.
 * The editable <p> element receives focus and its content is selected to allow for instant input.
 * @param {Object} currentNode The value of the 'selectedElement' Session variable.
 */
function promptEmptyNode(currentNode) {
  if (!currentNode) {
    return;
  }
  if (d3.event) {
    d3.event.preventDefault();
  }
  var domNode = d3.select("#gid" + currentNode._id);
  domNode.select("p.txt-input").node().focus();
  document.execCommand("selectAll", false, null);
  domNode.classed({
    "node-selected": true,
    "node-empty": true,
  });
}

/**
 * Selects (or deselects) a node element (i.e. an identification circle).
 * If the node is a newly created identification circle it gets selected immediately.
 * All the other nodes are selectable by user interaction.
 * We use a Session variable to detect selected or deselected state, respectively.
 * Depending on that, we update the current document's 'editCompleted' field and we
 * also apply a CSS class, which in turn toggles the control handle for deleting a circle.
 * @param {object} element The db node document or {@code null}.
 */
function selectNodeElement(element) {
  var selectedElement = Session.get("selectedElement");

  // deal with previously selected element
  if (selectedElement) {
    // do we want to switch away from a selected empty node?
    if (isEmptyNode(selectedElement) && element && element._id != selectedElement._id) {
      promptEmptyNode(selectedElement);
      return;
    }
    // we are already on the selected node which indicates we are editing
    if (element && element._id === selectedElement._id) {
      d3.select("#gid" + selectedElement._id).classed({
        "node-selected": true,
        "node-empty": false,
      });
    } else {
      // the selected element is not empty so editing is done
      Identifications.update(selectedElement._id, {
        $set: {
          editCompleted: true
        }
      });

      // deselect previously selected element
      var domGroupElement = d3.select("#gid" + selectedElement._id);
      domGroupElement
        .classed({
          "node-selected": false,
          "node-empty": false,
          "dragging": false
        });

      if (selectedElement.level > 0) {
        var textElem = domGroupElement.select("p.txt-input");
        textElem.node().blur();
        // HEADS UP: 'blur()' does not remove the text selection, so if a user
        // (accidentally) keeps on typing, the editing would continue.
        // This can not happen on touch devices (iOS - iPad), since the
        // virtual keyboard slides down when the <p> element loses focus.
        textElem.attr("contenteditable", "false");
      }
    }
  }

  // select new element
  // The passed in value may be null in which case we do nothing (We simply use the null value
  // later to reset the Session variable).
  if (!element) {
    // nada
  } else {
    // Always bring the selected <g> element to the front in case of overlapping elements.
    var domSelection = d3.select("#gid" + element._id);
    bringToFront(domSelection);
  }

  // Set the Session variable to the passed in value (which may be null).
  Session.set("selectedElement", element);

} // end selectNodeElement()

/**
 * Calls the respective Meteor methods to delete a node document (i.e. an identification document)
 * and its associated link documents from the respective collection.
 * @param {string} id The current datum of the '_id' field bound to the current element.
 */
function deleteNodeAndLink(id) {
  var nodeId,
    nodeDoc;

  nodeId = id;

  if (nodeId) {

    nodeDoc = Identifications.findOneById(nodeId);

    // Is this an ID node with children?
    // Then we do not allow deletion of this node.
    if (nodeDoc.children.length) {
      return throwError(
        "You can not remove an identification bubble with attached child-bubbles.");
    }

    // Is this an ID node that was matched from the 'ID pool'?
    // Then we delete this ID node from its associates.
    if (nodeDoc.matched) {

      // We create the modifier object for the update operation.
      // NOTE This seems somewhat dumb but other approaches for
      // dynamically passing a modifier did not do the trick :(
      var removeModifier = {
          general: {
            $pull: {"matchedBy":  Meteor.userId()}
          },
          source: {
            $pull: {"source.matchedBy":  Meteor.userId()}
          },
          target: {
            $pull: {"target.matchedBy":  Meteor.userId()}
          }
      };

      Meteor.call("updateIdMatches", nodeDoc.name, removeModifier, function(error, result) {
        if (error) {
          return throwError(error.reason);
        }
      });
    }

    Meteor.call("removeIdentificationAndLink", nodeDoc, function(error, result) {
      if (error) {
        return throwError("Error: " + error.reason);
      }
    });

    var selectedNode = Session.get("selectedElement");
    if (selectedNode && (selectedNode._id === nodeId)) {
      Session.set("selectedElement", null);
    }
  }
} // end deleteNodeAndLink()

/**
 * Indicates if an element is draggable.
 * The dragging state is activated by a long mousedown/touchhold
 * and will deactivated either by releasing the mouse/touch, i.e. the element wasn't
 * dragged around, or by ending the dragmovement.
 * In order to give a visual feedback to the user, we increase the
 * the radius of the circle on dragstart, and decrease the radius
 * on dragend, respectively.
 * @param {Object} groupSelection - The current D3 selection of the <g> element holding the
 * id circle and text.
 */
function toggleDragIndicator(groupSelection) {
  var currentR = Session.get("myIdsCurrentRadius");
  var idCircle = groupSelection.select("circle.filled");

  if (!groupSelection) {
    return;
  }

  if (groupSelection.classed("dragging")) {
    groupSelection.classed("dragging", false);
    groupSelection.classed("node-selected", false);
    idCircle
      .transition()
      .style("opacity", "1")
      .attr("r", currentR);
  } else {
    groupSelection.classed("dragging", true);
    groupSelection.classed("node-selected", false);
    idCircle
      .transition()
      .style("opacity", 0.6)
      .attr("r", currentR * 1.5);
  }
}
