(function() {
  var drawingSurface;
  var canvas, context;
  var size;
  var bubbleList = [];
  var bubbles;
  var bubbleGroup;
  var stopTimer;

  Template.bullseyeReflect.onRendered(function() {
    stopTimer = false;
    var templateInstance = this;
    var currentTrainingId = Session.get("bullseyeCurrentTraining");
    size = Session.get("canvasSize") ? Session.get("canvasSize") : document.documentElement.clientHeight;

    drawingSurface = d3.select("#player-canvas");
    // ====== DEBUGGING =======
    // drawingSurface.append("circle")
    //   .attr("cx", 0)
    //   .attr("cy", size/2)
    //   .attr("r", "60")
    //   .style("fill", "purple");
    //
    // drawingSurface.append("circle")
    //  .attr("cx", size)
    //  .attr("cy", size/2)
    //  .attr("r", "60")
    //  .style("fill", "orange");
    //
    // drawingSurface.append("circle")
    //  .attr("cy", 0)
    //  .attr("cx", size/2)
    //  .attr("r", "60")
    //  .style("fill", "cyan");
    //
    // drawingSurface.append("circle")
    //  .attr("cy", size)
    //  .attr("cx", size/2)
    //  .attr("r", "60")
    //  .style("fill", "blue");
    //
    bubbles = drawingSurface.selectAll(".bubble");

    // We use the MetaCollection to exclude multi-occuring identifications.
    var metaIdsCursor = MetaCollection.find({
      createdAtTraining: currentTrainingId
    });

    // We use a flag to indicate the initial query results that
    // should not affect the 'added()' callback.
    var initializing = true;

    templateInstance.networkHandle = metaIdsCursor.observe({
      added: function(doc) {
        addToBubbles(doc, size);

        // We want to prevent multiple calls of 'createBubbleCloud()'
        // while the 'added()' callback delivers the initial result of the query.
        if (!initializing) {
          // createBubbleCloud(playersConfig, clientWidth, clientHeight, dataset, drawingSurface);
          // makeBubbleBath();
        }
      },
      removed: function(doc) {
        removeFromBubbles(doc);
        // makeBubbleBath();
        // createBubbleCloud(playersConfig, clientWidth, clientHeight, dataset, drawingSurface);
      },
      changed: function(newDoc, oldDoc) {
        var bubble = d3.select("#gid" + newDoc._id +" circle").node();
        if (newDoc.createdBy.length < 2) {
          bubble.classList.remove(newDoc.color);
          bubble.classList.add("c-white");
        }
        if (oldDoc.createdBy.length == 1) {
          bubble.classList.remove("c-white");
          bubble.classList.add(newDoc.color);
        }
      }
    });

    // At this point, 'observe' has returned and the initial query results are delivered.
    // So we call 'createBubbleCloud()' with the initial dataset.
    initializing = false;
    // createBubbleCloud(playersConfig, clientWidth, clientHeight, dataset, drawingSurface);
    makeBubbleBath();

    d3.select("#stop-button")
      .on("click", function() {
        stopTimer = true;
      });

    d3.timer(move);

    // d3.timer(function(elapsed) {
    //
    //   d3.selectAll(".bubble")
    //     .attr("transform", function(d) {
    //
    //       // if (d.x >= size || d.x <= 0) {
    //       //   d.vx *= -1;
    //       // }
    //       // if (d.y >= size || d.y >= 0) {
    //       //   d.vy *= -1;
    //       // }
    //
    //       if (d.x > size) {
    //         d.x = 0;
    //       } else if (d.x < 0) {
    //         d.x = size;
    //       }
    //
    //       if (d.y > size) {
    //         d.y = 0;
    //       } else if (d.y < 0) {
    //         d.y = size;
    //       }
    //
    //       d.x += d.vx;
    //       d.y += d.vy;
    //
    //       // rotation cf. http://bl.ocks.org/mbostock/1353700
    //       return "translate(" + d.x + ", " + d.y + ") rotate(" + elapsed/d.radius * d.vAngle + ")";
    //     });
    //
    //   return stopTimer;
    // });



  }); // onRendered()



  function addToBubbles(doc, size) {
    var sign = Math.round(Math.random()) * 2 - 1;
    var newBubble = doc;
    newBubble.x = Math.round(size * Math.random());
    newBubble.y = Math.round(size * Math.random());
    newBubble.vx = 30.5 * (Math.random() - 0.5);
    newBubble.vy = 40 * (Math.random() - 0.5);
    newBubble.radius = 35;
    newBubble.vAngle = (Math.random()*2*Math.PI + 0.15) * sign;
    bubbleList.push(newBubble);
  } // addToBubbles



  function removeFromBubbles(doc) {
    bubbleList.forEach(function(bubble, i, list) {
      if (list[i] && list[i]._id === doc._id) {
        bubbleList.splice(i, 1);
      }
    });
  } // removeFromBubbles


  function makeBubbleBath() {
    bubbles = bubbles.data(bubbleList, function(d) {
      return d && d._id;
    });

    bubbles.exit().remove();

    bubbleGroup = bubbles.enter().insert("g", "#bullseye-mask")
      .attr("id", function(d) {
        return "gid" + d._id;
      })
      .attr("class", "bubble")
      // We translate to the initial random position within the drawing area.
      .attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";
      });

    bubbleGroup.append("circle")
      .attr("r", function(d) {
        return d.radius;
      })
      .attr("class", function(d) {
        return d.createdBy.length > 1 ? d.color : "c-white";
      });


    // bubbleGroup.append("text")
    //   .text(function(d) {
    //     return d.name;
    //   })
    //   .style("text-rendering", "optimizeSpeed");

    bubbleGroup.append("foreignObject")
      .attr({
        "class": "foreign-object",
        "width": function(d) {
          return d.radius * 2 + "px";
        },
        "height": function(d) {
          return d.radius * 2 + "px";
        },
        "transform": function(d) {
          return "scale(1.0) translate(" + (-d.radius) + ", " + (-d.radius) + ")";
        }
      })
      .append("xhtml:p")
      .attr("class", "bullseye-circle-label")
      .text(function(d) {
        return d.name;
      })
      .style({
        "width": function(d) {
          return d.radius *  2 + "px";
        },
        "height": function(d) {
          return d.radius *  2 + "px";
        },
        // We set the 'font-size' based on the width of the parent element
        // (here: the <foreignObject> element, the 'width' of which matches the <circle> diameter)
        // and the length of the text inside the <p> element.
        // We get the needed value by calculating the size of the <p> element.
        "font-size": function(d) {
          var textBox = this.getBoundingClientRect();
          // We store the calculated values on the data object.
          d.textLen = textBox.width || textBox.right - textBox.left;
          d.fontSize = (d.radius * 2 - 5) / d.textLen;
          return d.fontSize + "em";
        }
      });
  } // makeBubbleBath


  function move(elapsed) {
    for (var i = 0; i < bubbleList.length; i++) {
      var bubble = bubbleList[i];
        if (bubble.x > size) {
          bubble.x = 0;
        } else if (bubble.x < 0) {
          bubble.x = size;
        }

        if (bubble.y > size) {
          bubble.y = 0;
        } else if (bubble.y < 0) {
          bubble.y = size;
        }

        bubble.x += bubble.vx;
        bubble.y += bubble.vy;
      }

    if (Session.equals("moveBubbles", true)) {
      bubbles.attr("transform", function(d) {
        // rotation cf. http://bl.ocks.org/mbostock/1353700
        return "translate(" + d.x + ", " + d.y + ") rotate(" + elapsed/d.radius * d.vAngle + ")";
      });
    }

    return stopTimer;
  } // move


  Template.bullseyeReflect.onDestroyed(function() {
    stopTimer = true;
    d3.selectAll(".bubble").remove();
  });

}()); // end function closure
