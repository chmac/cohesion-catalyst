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

  /**
    * init code for the "ID Pool" screen
    */
  Template.idPool.onCreated(function() {

    // init database subscription
    var currentUser,
      currentTrainingId,
      templateInstance,
      subscription;

    currentUser = Meteor.user();
    currentTrainingId = currentUser.profile.currentTraining;

    templateInstance = this;

    // initial dummy layout, until all bubbles in pool are known
    layout = new LayoutSameNumPerRow(function(){return 0;});

    subscription = templateInstance.subscribe("otherIdentifications", currentTrainingId,
      function() {
        // initial query to populate pool with current set of IDs 
        Identifications.find({
          createdBy: {$ne: currentUser._id},
          trainingId: currentTrainingId,
          editCompleted: true
        }).forEach(function(d) { addID(d); });
        layout = new LayoutSameNumPerRow( function(){return ids.length;}, 
                                          {"baseBubbleRadius": 40});
        draw();
    });

    // set up autorunner to observe IDs that come, go, or change
  //  templateInstance.autorun(function() {
  //  }); // autorun()

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

    // set up autorunner to observe IDs that come, go, or change
    templateInstance.autorun(function() {

      // initial query to populate pool with current set of IDs 
      handle = Identifications.find({
        createdBy: {$ne: currentUser._id},
        trainingId: currentTrainingId,
        editCompleted: true
      }).observe({
        added: function(doc) {
          addID(doc);
          draw();
        },
        /*changed: function(newDoc, oldDoc) {
          updateID(oldDoc.name, newDoc.name);
          draw();
        },*/
        removed: function(oldDoc) {
          deleteID(oldDoc);
          draw();
        }
      }); // observe

    }); // end autorun()

    // initially render the ID pool 
    draw();

  });  // onRendered()

  /**
    *   add an ID, check if an ID with the same name is 
    *   already in the pool (and update its count), or
    *   whether this is an entierly new ID
    */
  var addID = function(doc) {

    for(var i=0; i<ids.length; i++) {
      if(ids[i] && ids[i].text == doc.name) {
        // ID with such name already in array, check who created it
        for(var j=0; j<ids[i].createdBy.length; j++) {
          if(ids[i].createdBy[j] == doc.createdBy) {
            // already in, so just ignore this addID call
            return "already in array";
          };
        };
        // this creator is new, so add it to this ID
        ids[i].count++;
        ids[i].createdBy.push[doc.createdBy];
        return;
      }
    }
    // ID with such name not yet in array, so create new ID
    var id = {};
    id.text = doc.name;
    id.count = 1;
    id.color = "purple";
    id.createdBy = [doc.createdBy];

    // insert it at the first free slot
    for(var i=0; i<ids.length; i++) {
      if(ids[i] == undefined) {
        ids[i] = id;
        return id;
      }
    }
    // no emtpy slot found, append to array
    ids.push(id);
    return id;
  };

  /**
    *   delete ID, identified by text
    */
  var deleteID = function(doc) {
    for(var i=0; i<ids.length; i++) {
      if(ids[i] && ids[i].text == doc.name) {
        for(var j=0; j<ids[i].createdBy.length; j++) {
          if(ids[i].createdBy[j] == doc.createdBy) {

            // found it, reduce count etc.
            ids[i].createdBy.slice(j,1);
            ids[i].count--;
            if(ids[i].count == 0) {
              // nobody has this ID any more, remove it from screen/array
              ids[i] = undefined;
              console.log("bubble "+doc.name+" removed");
              return;
            }
            console.log("removed one instance from bubble "+doc.name+", count="+ids[i].count);
            return;
          }
        }
      }
    }
    console.log("tried to delete " + doc.name + ", but could not find it!.");
  };

  var XXX = function () {
  /**
    *   update information for an ID, identified by text
    */
  var updateID = function(text, newText, newCount, newColor) {
    for(var i=0; i<ids.length; i++) {
      var id = ids[i];
      if(id.text == text) {
        id = {"text": newText || id.text, 
              "count": newCount || id.count,
              "color": newColor || id.color};
        return;
      }
    }
  };

  }; // XXX

  /** 
    * draw a single ID bubble centered around specified position 
    * with specified radius and scale factor
    * drawingSurface: the SVG area's topmost group element
    * id: one entry from the ids array
    * pos: array containing X and Y coordinate of bubble to be drawn
    * radius: unscaled (base) radius of the bubble
    * scale: scale factor for bubble size and text size
    **/
  var drawBubble = function(drawingSurface, id, x, y, radius, scale) {

    //console.log("draw bubble " + id.text + " at " + x + " / " + y + " scale " + scale);
    var bubbleGroup = drawingSurface.append("g")
      .attr("transform", "translate(" + (x) + "," + (y) + ")");

    bubbleGroup.append("circle")
      .attr("r", radius)
      .attr("transform", "scale(" + scale + " " + scale + ")")
      .style("fill", id.color);

    /*
    bubbleGroup.append("text")
      .attr("dy", ".3em")
      .style("text-anchor", "middle")    
      .attr("transform", "scale(" + scale + " " + scale + ")")
      .style("fill", "white")
      .text(id.text);
      */

    bubbleGroup.append("foreignObject")
      .attr({
        "width": radius * 2,
        "height": radius * 2,
        "transform": "scale(" + scale + " " + scale + ") translate(" + (-radius) + ", " + (-
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
        .text(id.text);

  }; // drawBubble()

  /**
    * draw the current set of bubbles with some magic layouting
    */
  draw = function() {

    var margin,
      width,
      height,
      svgViewport,
      drawingSurface;

    // We create a margin object following the D3 margin convention.
    // cf. http://bl.ocks.org/mbostock/3019563
    margin = {
      top: 20,
      right: 10,
      bottom: 20,
      left: 10
    };

    // We define the inner dimensions of the drawing area.
    width = 768 - margin.left - margin.right;
    height = 1024 - margin.top - margin.bottom;

    // remove all existing children of the drawing area
    //d3.select("#ids-graph").selectAll("*").remove();
    d3.select("#ids-graph").select("svg").remove();
    // We create our outermost <svg> and append it to the existing <div id='ids-graph'>.
    svgViewport = d3.select("#ids-graph").append("svg")
      .attr("id", "ids-vis")
      .attr("viewBox", "0 0 " + (width + margin.left + margin.right) + " " + (height + margin
        .top +
        margin.bottom))
      .attr("preserveAspectRatio", "xMidYMid meet");

    // We append a <g> element that translates the origin to the top-left
    // corner of the drawing area.
    drawingSurface = svgViewport.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // We append a <rect> as the 'canvas' to draw on and as target of 'pointer events'.
    drawingSurface.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("class", "drawing-surface");

    // set width and height in layout
    layout.setDimensions(width,height);

      // for each bubbles, let the layout determine if/where to draw it, and do so  
    for(var i=0; i<ids.length; i++) {
      // is there something in this slot in the IDs array? 
      if(ids[i] != undefined) {
        // let layout compute position and scale factor
        var res = layout.getPositionAndSize(i);
        // draw it at all?
        if(res != undefined) {
          // draw single bubble
          drawBubble(drawingSurface, ids[i], res.x, res.y, 40, res.scale);
        }
      }
    }

    // debugging: scroll on click/shift-click
    d3.select("#ids-vis").on("mousedown", function(d) {
      // console.log("move!");
        if(d3.event.shiftKey) {
          layout.scroll(-10);
        } else {
          layout.scroll(10);
        }
        draw();
    }); // d3.select()

    return "yes, I have drawn the pool!";

  }; // draw()


  // Test adding and removing ids
  Template.idPool.events({
    "click #add-id": function(event, instance) {
      event.preventDefault();
      var fakeID = "fake1149"+Math.trunc(Math.random()*10000);
      Identifications.insert({
        createdBy: fakeID,
        name: "Berlin"+Math.trunc(Math.random()*10000),
        editCompleted: true,
        trainingId: Meteor.user().profile.currentTraining
      });
    } ,
    "click #remove-id": function(event, instance) {
      event.preventDefault();
      var randomIdx = Math.floor(Math.random() * (ids.length-1));
      var i=0;
      while(i<1000 && ids[randomIdx] == undefined) {
        i++;
        randomIdx = Math.floor(Math.random() * (ids.length-1));
      };
      if(i>=1000) {
        console.log("found nothing to remove");
        return;
      } 
      var name = ids[randomIdx].text;
      var createdBy = ids[randomIdx].createdBy[0];
      console.log("remove idx="+randomIdx+" name="+name+" createdBy="+createdBy);
      deleteID({"name": name, "createdBy": createdBy});
      draw();
    }   

  }); // events()

}(); // module
