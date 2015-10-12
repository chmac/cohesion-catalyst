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
        createdBy: {$nin: [currentUser._id]}
      }).observe({
        added: function(doc) {
          console.log("Observe added");
          addMetaID(doc);
          draw();
        },
        changed: function(newDoc,oldDoc) {
          console.log("Observe changed: from ", oldDoc, " to ", newDoc);
        },
        removed: function(doc) {
          deleteID(doc);
          console.log("Observed remove");
          draw();
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
    id.text = doc.name;
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
  var deleteID = function(doc) {
    for(var i=0; i<ids.length; i++) {
      if(ids[i] && ids[i].text == doc.name) {
        ids[i] = undefined;
        console.log("bubble "+doc.name+" removed");
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

      //console.log("draw bubble " + id.text + " at " + x + " / " + y + " scale " + scale);

      // Move each <g> to its calculated position.
      group.attr("transform", "translate(" + (res.x) + "," + (res.y) + ")");

      // Append a <circle> to the <g>.
      group.append("circle")
        .attr("r", radius)
        .attr("transform", "scale(" + res.scale + " " + res.scale + ")")
        .attr("class", d.color);

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
          .classed("txt-pool", true)
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
          "click": function(d,x,y) {
            // // We animate this bubble out of sight.
            animateOut(d, d3.select(this));
          }
        });
    }); // selection.each()

  }; // createBubble()

/**
 * Makes an ID bubble disappear from screen if the user clicks/tabs on it.
 * Instead of making the bubble instantly invisible, a transition is applied which gives the
 * user a visual feedback: we apply a random color before the bubble decreases in size and Finally
 * disappears. The randomly picked color sticks to this matched ID across templates.
 * Once the transition/animation has ended, we call the functions 'deleteID()' and 'draw()'.
 * @param {Object} d The ID information.
 * @param {Array} selection The current D3 selection.
 *
 */
var animateOut = function(d, selection) {
  var group = selection,
    bubble,
    fo;

  bubble = group.select("circle");
  fo = group.select(".foreign-object");

  bubble
    .transition()
    .duration(750)
    .attr("r", 0)
    .each("end", function(){
      addToMyIdsWithRandomPosition(d);
    });

  fo
    .transition()
    .duration(750)
    .attr("transform", "scale(0)");

  fo.select("p.txt-pool")
    .transition()
    .duration(750)
    .style("font-size", 0);
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
  var addToMyIdsWithRandomPosition = function(d) {
    var currentUser = Meteor.user();
    var currentTrainingId = currentUser.profile.currentTraining;
    var root = Identifications.findRoot(currentUser._id, currentTrainingId).fetch()[0];
    var width = Session.get("myIdsDrawingWidth");
    var radius = Session.get("myIdsCurrentRadius");

    // Determine a random value for positioning the match in the 'my IDs' template
    var randomPos = [Math.random() * width, Math.random() * root.y];

    // Create the document to be inserted into the collection.
    var myMatch = {
      level: 1,
      x: randomPos[0],
      y: randomPos[1],
      parentId: root._id,
      name: d.text,
      editCompleted: true,
      matched: true,
      matchColor: d.color
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

    // Call the method 'addIdMatch()' - @see identifications.js.
    // We pass in the text of the matched ID to sync each ID of other users with the same text.
    Meteor.call("addIdMatch", d.text, function(error, result) {
      if (error) {
        throwError(error.reason);
      }
    });

  }; //end addToMyIds()

}(); // module
