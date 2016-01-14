/**
 * pool.js
 *
 * Template for the "ID Pool" screen, and methods to
 * query, update, render, and scroll the pool of IDs
 *
 */

// wrap code into a module
var pool = function() {

  /* IDs array for rendering scrollable ID bubbles */
  ids = [];

  /** layout to be used for positioning the bubbles in the pool */
  var layout;

  /** drawing surface to render into */
  var drawingSurface;

  /** (HACK) remember width and height of drawingSurface */
  var width,height;

  /**
    * init code for the "ID Pool" screen
    */
  Template.idPool.onCreated(function() {
    // initial dummy layout, do now draw anything until all bubbles in pool are known
    layout = new LayoutSameNumPerRow(function(){return 0;});
    ids = [];
  }); // onCreated()

  /**
    * Adds a callback to be called when an instance of this template is rendered and inserted
    * into the DOM.
    * All of the {@code D3} code goes inside this callback to allow for accessing the DOM elements and
    * interact with them.
    * (cf. <a href="http://docs.meteor.com/#/full/template_onRendered">Meteor onRendered()</a>)
    */
  Template.idPool.onRendered(function() {

    var currentUser,
      currentTrainingId,
      templateInstance,
      subscription,
      idsQuery,
      handle,
      idNames;

    currentUser = Meteor.user();
    currentTrainingId = currentUser.profile.currentTraining;

    // We access the template instance at 'this' and store it in a variable.
    templateInstance = this;

    // create the drawingSurface to render into
    drawingSurface = makeDrawingSurface();

    // set up mouse events
    touchMouseEvents(drawingSurface, // target
                     drawingSurface.node(), // container for position calculation
                     { "test": false,
                       "down": function(d) {
                         d3.event.preventDefault(); // prevent DOM element selection etc.
                       },
                       "dragMove": function(d, x,y,dx,dy) {
                         d3.event.preventDefault();
                         layout.scroll(dy); // use only Y component for scrolling the "wheel"
                         draw();            // update screen after scrolling
                       }
                     }
    );

    layout = new LayoutSameNumPerRow(function() {
      return ids.length;
    }, {
      "baseBubbleRadius": 65
    });
    // set width and height in layout
    layout.setDimensions(width, height);

    // set up autorunner (i.e. reactive computation) to observe MetaIDs that come, go, or change
    templateInstance.autorun(function() {
      MetaCollection.find({
        createdBy: {$nin: [currentUser._id]},
        createdAtTraining: currentTrainingId
      }).observe({
        added: function(doc) {
          addMetaID(doc);
          draw();
        },
        changed: function(newDoc,oldDoc) {
          // draw();
        },
        removed: function(doc) {
          deleteMetaID(doc);
        }
      });
    }); // autorun()

  }); // onRendered()

  /**
    *   add an ID, check if an ID with the same name is
    *   already in the pool or
    *   whether this is an entirely new ID
    */
  var addMetaID = function(doc) {

    for(var i=0; i<ids.length; i++) {
      if(ids[i] && ids[i].text == doc.name) {
        // already in, so just ignore this addMetaID call
        return console.log("already in array");
      }
    }
    // ID with such name not yet in array, so create new ID
    var id = {};
    id._id = doc._id;
    id.text = doc.name;
    id.standardizedText = doc.standardizedName;
    id.color = doc.color;
    id.index = ids.length;

    // insert it at the first free slot
    for(var k=0; k<ids.length; k++) {
      if(ids[k] === undefined) {
        ids[k] = id;
        return id;
      }
    }
    // no emtpy slot found, append to array
    ids.push(id);
    return id;
  };

  /**
    *   delete ID from screen, identified by text
    */
  var deleteMetaID = function(doc) {
    var durationTime = 750;
    var delayTime = 500;

    for(var i=0; i<ids.length; i++) {
      if(ids[i] && ids[i].text == doc.name) {
        if (i == ids.length - 1) {
          animate("OUT", delayTime, durationTime, draw, ids[i]);
          ids.pop();
        } else {
          animate("OUT-IN", delayTime, durationTime, draw, ids[i], ids[ids.length - 1]);
          ids[i] = ids[ids.length - 1];
          ids[i].index = i;
          ids.pop();
          // console.log("bubble "+doc.name+" replaced by " , ids[i] );
        }
        return;
      }
    }
    console.log("tried to delete " + doc.name + ", but could not find it!.");
  };

  /**
    * add the SVG container to draw into
    *
    */
  var makeDrawingSurface = function() {
   var margin,
      //width,
      //height,
      svgViewport,
      drawingSurface;

    // We create a margin object following the D3 margin convention.
    // cf. http://bl.ocks.org/mbostock/3019563
    margin = {
      top: 10,
      right: 10,
      bottom: 10,
      left: 10
    };

    // We define the inner dimensions of the drawing area.
    width = 788 - margin.left - margin.right;
    height = 1044 - margin.top - margin.bottom;

    // remove all existing children of the drawing area
    //d3.select("#ids-graph").selectAll("*").remove();
    d3.select("#ids-graph").select("svg").remove();
    // We create our outermost <svg> and append it to the existing <div id='ids-graph'>.
    svgViewport = d3.select("#ids-graph").append("svg")
      .attr("id", "ids-vis")
      .attr("viewBox", "0 0 " + (width + margin.left + margin.right) + " " + (height + margin
        .top + margin.bottom))
      // .attr("preserveAspectRatio", "xMidYMid meet");
      .attr("preserveAspectRatio", "xMidYMin meet");

    // We append a <g> element that translates the origin to the top-left
    // corner of the drawing area.
    drawingSurface = svgViewport.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // We append a <rect> as the 'canvas' to draw on and as target of 'pointer events'.
    drawingSurface.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("class", "drawing-surface");

    return drawingSurface;

  };

  /**
    * draw the current set of bubbles with some magic layouting
    */
  draw = function() {

    // do we know where to draw to?
    if(drawingSurface === undefined) {
      console.log("no drawing surface yet");
      return;
    }

    // remove all scene objects from last rendered frame
    drawingSurface.selectAll(".scene-obj").remove();

    // For each element in the array, we want to create a <g> element.
    // We follow the D3 pattern 'selectAll() - data() - enter() - append()'.
    // Therefore we create a D3 selection of elements with a class 'scene-obj' and bind
    // the 'ids' array to this selection using the 'data()' method.
    // With 'enter()' we store placeholder DOM nodes for the <g> elements to be created.
    // Using 'append()' we instantiate the desired <g> elements.
    // Finally, at the end of the chain, we use 'selection.call()' to call a function that is
    // responsible for the creation of the contents of each <g>.
    // That is, we draw a bubble (circle with text).
    drawingSurface.selectAll(".scene-obj").data(ids, function(d) {
      return d && d.text;
    })
    .enter()
    .append("g")
    .attr("id", function(d) {
      return "gid" + d._id;
    })
    .classed("scene-obj", true)
    .call(createBubble);
  }; // draw()

  /**
    * draw a single ID bubble centered around specified position
    * with specified radius and scale factor.
    * selection: the current D3 selection.
    **/
  var createBubble = function(selection) {
    // 'selection.each' invokes its own argument function, passing the bound data item to the
    // function. The 'this' context in the function is the current DOM element, here: the
    // recently created <g> element.
    selection.each(function(d) {
      // for some items in the array there is no ID/data/bubble to be drawn
      if(!d)
        return;

      var group = d3.select(this);
      var res = layout.getPositionAndSize(d.index);
      var radius = 65;

      if(!res)
        return group;

      // console.log("draw bubble " + d.text + " at " + res.x + " / " + res.y + " scale " + res.scale);

      // Move each <g> to its calculated position.
      group.attr("transform", "translate(" + (res.x) + "," + (res.y) + ")");

      // Append a <circle> to the <g>.
      // group.append("circle")
      //   .attr("r", radius)
      //   .attr("transform", "scale(" + res.scale + " " + res.scale + ")")
      //   .attr("class", d.color);

      // TODO See if other solution is possible for "entering" circles
      // This is a workaround experiment:
      // Only apply a transition if we are not dragging (We call draw() while dragging and we
      // remove all elements in draw() which makes all elements to entering elements again)
      // Also, only apply it to the circle in the last spot - but this will cause that circle
      // to be animated multiple times.
      if (touchMouseEvents.currentMode() !== "DRAG" && ids.length-1 == d.index) {
        group.append("circle")
          .attr("r", 0)
          .transition()
          .duration(500)
          .attr("r", radius)
          .attr("transform", "scale(" + res.scale + " " + res.scale + ")")
          .attr("class", d.color);
      } else {
        group.append("circle")
          .attr("r", radius)
          .attr("transform", "scale(" + res.scale + " " + res.scale + ")")
          .attr("class", d.color);
      }

      // Append a <foreignObject> to the <g>. The <foreignObject> contains a <p>.
      group.append("foreignObject")
        .attr({
          "class": "foreign-object",
          "width": radius * 2,
          "height": radius * 2,
          "transform": "scale(" + res.scale + " " + res.scale + ") translate(" + (-radius) + ", " + (-
            radius) + ")"
          })
        .append("xhtml:p")
        .classed("txt-inside-circle", true)
        .style({
            "width": radius *  2 + "px",
            "height": radius *  2 + "px",
            "max-width": radius *  2 + "px",
            "max-height": radius *  2  + "px"
            })
        .text(d.text);

        // Call the function to handle touch and mouse events, respectively.
        touchMouseEvents(group, drawingSurface.node(), {
          "test": false,
          "click": function(d, x, y) {
            addToCurrentIdsWithRandomPosition(d);
            // We prevent clicking/tapping the same element multiple times
            // by setting the pointer-events property to 'none'.
            // In doing so, the element won't respond to
            // mouse/touch events anymore
            d3.select(this).style("pointer-events", "none");
          },
          "dragMove": function(d, x, y, dx, dy) {
            d3.event.preventDefault();
            layout.scroll(dy); // use only Y component for scrolling the "wheel"
            draw();            // update screen after scrolling
          }
        }); // touchMouseEvents

    }); // selection.each()

  }; // createBubble()


/**
 * Makes an ID bubble appear/disappear from screen if the user clicks/tabs on it.
 * Instead of making the bubble instantly visible/invisible, a transition is applied which gives the
 * user a visual feedback.
 * @param {string} io The type of animation: "IN" or "OUT" or "OUT_IN".
 * @param {number} delay The time (in milliseconds)  specifying the begin of the transition animation.
 * @param {number} duration The time (in milliseconds) specyfiying how long the transition takes place.
 * @param {Object} endOfTransFunc A function to be executed at the end of a transition. The function
    may be an empty function, in which case nothing should happen.
 * @param {Object} idA The ID information.
 * @param {Object} idB Optional information of a second ID.
 */
var animate = function(io, delay, duration, endOfTransFunc, idA, idB) {
  var group,
    groupB,
    bubble,
    bubbleB,
    fo,
    foB,
    p,
    pB,
    currentRadius,
    currentRadiusB,
    currentScale,
    currentScaleB,
    currentFontSize;

  group = d3.select("#gid" + idA._id);
  bubble = group.select("circle");
  fo = group.select(".foreign-object");
  p = fo.select("p.txt-inside-circle");
  currentRadius = bubble.attr("r");
  currentScale = d3.transform(bubble.attr("transform")).scale[0];
  currentFontSize = p.style("font-size");

  if (idB) {
    groupB = d3.select("#gid" + idB._id);
    bubbleB = groupB.select("circle");
    currentRadiusB = bubbleB.attr("r");
    currentScaleB = d3.transform(bubbleB.attr("transform")).scale[0];
    foB = groupB.select(".foreign-object");
    pB = foB.select("p.txt-inside-circle");
  }

  if (io == "OUT-IN") {
    bubble
      .transition() // apply first transition ("OUT")
      .delay(0)
      .duration(duration)
      .attr("r", 0)
      .each("end", function() {
        d3.select(this)
          // at the end of transition #1, apply immediate change
          .attr("class", idB.color)
          // then apply second transition ("IN")
          .transition()
          .delay(0)
          .duration(duration)
          .attr("r", currentRadius)
          .each("end", endOfTransFunc);
      });

    fo
      .transition() // apply first transition ("OUT")
      .delay(0)
      .duration(duration)
      .attr("transform", "scale(0)")
      .each("end", function() {
        d3.select(this)
          // at the end of transition #1, apply immediate change
          .attr("transform", "scale(" + currentScale + ") translate(0,0)")
          // then apply second transition ("IN")
          .transition()
          .delay(0)
          .duration(duration)
          .attr("transform", "scale(" + currentScale + ") translate(" + (-currentRadius) + ", " +
            (-currentRadius) + ")");
      });

    p
      .transition() // apply first transition ("OUT")
      .delay(0)
      .duration(duration)
      .style("width", 0)
      .style("height", 0)
      .style("font-size", 0)
      .each("end", function() {
        d3.select(this)
          // at the end of transition #1, apply immediate change
          .text(idB.text)
          // then apply second transition ("IN")
          .transition()
          .delay(0)
          .duration(duration)
          .style("width", currentRadius * 2 + "px")
          .style("height", currentRadius * 2 + "px")
          .style("font-size", currentFontSize);
      });

    // We only apply "OUT" transitions for the bubble which will
    // switch positions from the last spot to the newly empty spot.
    bubbleB
      .transition()
      .delay(delay)
      .duration(duration)
      .attr("r", 0);

    foB
      .transition()
      .delay(delay)
      .duration(duration)
      .attr("transform", "scale(0)");

    pB
      .transition()
      .delay(delay)
      .duration(duration)
      .style("font-size", 0);

  } // "OUT-IN"

  // This transition only affects one bubble, namely the one in the last spot,
  // which will be transitioned "OUT".
  if (io == "OUT") {
    bubble
      .transition()
      .delay(0)
      .duration(duration)
      .attr("r", 0)
      .each("end", endOfTransFunc);

    fo
      .transition()
      .delay(0)
      .duration(duration)
      .attr("transform", "scale(0)");

    fo.select("p.txt-inside-circle")
      .transition()
      .delay(0)
      .duration(duration)
      .style("font-size", 0);

  } // "OUT"



};

  /**
   * Calls the Meteor methods to insert the clicked-on ID bubble into the users 'Identifications' collection.
   * The document which will be inserted into the DB has an additional 'matched' field
   * to indicate this item as one the user selected from the pool of other users' identifications.
   *
   * Inside the 'my IDs' template we want the matched ID to be rendered as an immediate child of
   * the root node, so we find the root node and get its '_id'. The root node is also needed to
   * to perform the 'detectCollision' calculation.
   * @param {Object} d An object containing the information of this ID bubble.
   */
  var addToCurrentIdsWithRandomPosition = function(d) {
    var currentUser = Meteor.user(); // At this point, a user must exist.
    var currentTrainingId = currentUser.profile.currentTraining;
    var root = Identifications.findRoot(currentUser._id, currentTrainingId).fetch()[0];

    // Just in case....
    if (Identifications.findOneByName(d.text)) {
      console.log("Id with such name already in Identifications collection");
      return throwError("Hey! You already identified with this one!");
    }

    // HEADS UP: After a page reload or if we navigate to the 'ID pool' route
    // before visiting the 'my IDs' route, the Session variable will be undefined,
    // resulting in a NaN error.
    // Therefore we need to assign a default value - for now this is solved with
    // hardcoded values and is kind of a HACK!
    var width = Session.get("myIdsDrawingWidth") ? Session.get("myIdsDrawingWidth") : 768;
    var radius = Session.get("myIdsCurrentRadius") ? Session.get("myIdsCurrentRadius") : 35;

    // Determine a random value for positioning the match in the 'my IDs' template
    var randomPos = [Math.random() * width, Math.random() * root.y];

    // Create the document to be inserted into the collection.
    var myMatch = {
      level: 1,
      x: randomPos[0],
      y: randomPos[1],
      parentId: root._id,
      name: d.text,
      standardizedName: d.standardizedText,
      editCompleted: true
    };

    // We call the method 'insertIdentification' defined at {@see identifications.js}
    // and we pass the 'myMatch' object to be inserted into the 'Identifications' collection.
    Meteor.call("insertIdentification", myMatch, function(error, result) {
      if (error) {
        return throwError("Error: " + error.reason);
      }
      // on success
      var myMatchId = result._id;
      // We use the newly inserted identification to detect collisions with already existing
      // identifications and we call the 'updatePosition' method defined at {@see identifications.js}.
      var position = detectCollision(myMatchId, randomPos, root, radius, width);
      Meteor.call("updatePosition", myMatchId, position, function(error, result) {
        if (error) {
          return throwError("Error: " + error.reason);
        }
      });
    });
  }; //end addToMyIds()

}(); // module
