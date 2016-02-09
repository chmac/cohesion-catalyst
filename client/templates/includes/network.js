/**
 * network.js
 *
 */


var network = function() {

  /** drawing surface to render into */
  var drawingSurface,
    force,
    bubbles,
    links,
    bubbleGroup,
    currentNetworkIds = [],
    dataset = [],
    bubbleGravity;


  Template.idNetwork.onRendered(function() {
    currentNetworkIds = [];
    var templateInstance = this;

    // We create a margin object following the D3 margin convention.
    // cf. http://bl.ocks.org/mbostock/3019563
    var margin = {
      top: 10,
      right: 10,
      bottom: 10,
      left: 10
    };

    var avatarSize = 115;
    // We retrieve the current browser viewport size.
    var clientWidth = document.documentElement.clientWidth;
    var clientHeight = document.documentElement.clientHeight - avatarSize/2;
    var outerRadius = Math.min(clientWidth, clientHeight - avatarSize / 2) / 2 - avatarSize / 2;

    // Create the force layout and specify some settings.
    // Don't start yet
    force = d3.layout.force()
      .nodes(currentNetworkIds)
      .size([clientWidth-margin.left, clientHeight])
      .gravity(0.7) // NOTE: value of 0.7 is quite good when w/o bubbleGravity()
      .on("tick", updatePositions)
      .friction(0.6);

    // create the drawingSurface to render into
    drawingSurface = makeDrawingSurface(clientWidth, clientHeight, margin);
    bubbles = drawingSurface.selectAll(".id-circle");
    links = drawingSurface.selectAll("line");

    var currentUser = Meteor.user();
    var currentTrainingId = currentUser.profile.currentTraining;

    clientLogger.logInfo("Template <idNetwork> rendered.", {
      userID: currentUser._id,
      trainingID: currentTrainingId
    });

    var currentPlayers = Meteor.users.find({"profile.currentTraining": currentTrainingId}).fetch();

    var playersConfig =  {
      radius: outerRadius,
      radiusX: clientWidth / 2,
      radiusY: (clientHeight - avatarSize/2) / 2,
      centerX: clientWidth / 2 - margin.left, // We need to adjust the translation of the drawing surface
      centerY: clientHeight / 2 - margin.top,
      size: avatarSize,
      count: currentPlayers.length
    };

    createPlayersCircle(currentPlayers, playersConfig);

    // We want to observe if a user changes his or her avatar
    // in order to reactively update the SVG icon.
    var playersCursor = Meteor.users.find({
      "profile.currentTraining": currentTrainingId
    }, {
      fields: {
        "profile.avatar": 1
      }
    });
    templateInstance.playerHandle = playersCursor.observeChanges({
      changed: function(id, profileAvatar) {
        var player = Meteor.users.findOne({_id: id});
        d3.select("#gid" + id + " use")
          .attr("xlink:href", "/svg/avatars.svg" + player.profile.avatar);
        // console.log(player.profile.name, " changed avatar to ", player.profile.avatar);
      }
    });

    var currentNetworkCursor = MetaCollection.find({
      $nor: [
        {
          createdBy: {
            $exists: false
          }
        }, {
          createdBy: {
            $size: 0
          }
        }, {
          createdBy: {
            $size: 1
          }
        }
      ],
      createdAtTraining: currentTrainingId
    });

    // We use a flag to indicate the initial query results that
    // should not affect the 'added()' callback.
    var initializing = true;

    templateInstance.networkHandle = currentNetworkCursor.observe({
      added: function(doc) {
        addToNetworkIds(doc);
        dataset = setupLinksData(currentPlayers, currentNetworkIds);
        // We want to prevent multiple calls of 'createBubbleCloud()'
        // while the 'added()' callback delivers the initial result of the query.
        if (!initializing) {
          createBubbleCloud(playersConfig, clientWidth, clientHeight, dataset, drawingSurface);
        }
        // We check if the current player is inspecting own ids when a new network-ID
        // is added and if the newly added ID was also created by the current
        // player. If both of those conditions are true, we call the function to show
        // the links to all of the IDs of the current player.
        // We wait until the transition of the entering element is halfway through
        // in order to prevent flickering of the link.
        var player = d3.select("#gid" + Meteor.userId());
        if (player.classed("self-highlighted") && _.contains(doc.createdBy, Meteor.userId())) {
          Meteor.setTimeout(function() {
            showLinksToCurrentPlayerIds(Meteor.userId());
          }, 500);
        }
      },
      changed: function(newDoc,oldDoc) {
        var changedId = updateNetworkId(newDoc);
        dataset = setupLinksData(currentPlayers, currentNetworkIds);
        createBubbleCloud(playersConfig, clientWidth, clientHeight, dataset, drawingSurface);
        // We look for the ID bubble this changed document is associated with
        // and first, we need to update its attributes that are based on changed data.
        // Then, if it is currently highlighted, we want to highlight new members or de-highlight
        // lost members.
        var idBubble = drawingSurface.select("#gid" + changedId._id);
        updateSelection(idBubble);
        if (idBubble.classed("highlighted")) {
          makeReset();
          fadeNonMemberships(changedId);
          showCommonMemberships(changedId);
        }
      },
      removed: function(doc) {
        // We look for the common players of this network ID and if they are
        // currently highlighted, we need to reset the applied style.
        // Otherwise, the ID is removed from the canvas but the players remain highlighted.
        var commonPlayers = drawingSurface.selectAll(".player").filter(function(player) {
          return _.contains(doc.createdBy, player._id);
        });
        if (commonPlayers && commonPlayers.classed("highlighted")) {
          makeReset();
        }
        removeFromNetworkIds(doc);
        dataset = setupLinksData(currentPlayers, currentNetworkIds);
        createBubbleCloud(playersConfig, clientWidth, clientHeight, dataset, drawingSurface);
      }
    });

    // At this point, 'observe' has returned and the initial query results are delivered.
    // So we call 'createBubbleCloud()' with the initial dataset.
    initializing = false;
    createBubbleCloud(playersConfig, clientWidth, clientHeight, dataset, drawingSurface);
    // calculateArea(playersConfig);

    // set up mouse events
    touchMouseEvents(drawingSurface, // target
                     drawingSurface.node(), // container for position calculation
                     { "test": false,
                       "down": function(d) {
                         d3.event.preventDefault(); // prevent DOM element selection etc.
                         makeReset();
                       }
                     }
    );

    /**
     * Adds a non-symmetrical custom gravity to the layout.
     * The 'gravity' force gets applied to each bubble to push and pull
     * the vertical and horizontal positions depending on the available
     * width and height, respectively. This is especially useful if
     * the width and height of the visualization space are different.
     * @param {Number} alpha - The built-in cooling temperature of the force simulation
     * which starts at 0.1 and decreases steadily until the simulation stops.
     * cf. [as of 2016-02-02] http://vallandingham.me/building_a_bubble_cloud.html
     */
    bubbleGravity = function(alpha) {
      // We start at the center.
      var cx = clientWidth / 2;
      var cy = clientHeight / 2;

      // We use the alpha parameter of the force layout to affect how much we
      // want to push horizontally or vertically.
      // We reduce the alpha value if width or height is greater, which results in a
      // weaker pull towards the center, allowing the bubbles to spread along
      // that particular axis.
      var ax = playersConfig.radiusX > playersConfig.radiusY ? alpha / 4 : alpha;
      // var ay = playersConfig.radiusY > playersConfig.radiusX ? alpha/1.5 : alpha;
      var ay = alpha;

      // We return a function that will modify the x and y values of the bubble elements.
      return function(d) {
        d.x += (cx - d.x) * ax;
        d.y += (cy - d.y) * ay;
      };
    };
  }); // onRendered()


  // We need to stop observing our live queries when this template is
  // removed from the DOM.
  Template.idNetwork.onDestroyed(function() {
    var templateInstance = this;
    templateInstance.networkHandle.stop();
    templateInstance.playerHandle.stop();

    clientLogger.logInfo("Template <idNetwork> destroyed.", {
      userID: Meteor.userId(),
      trainingID: Meteor.user().profile.currentTraining
    });
  });

  /**
   * Updates the displayed positions of the rendered elements.
   * Listens to the 'tick' events, i.e. the positions are
   * set on each tick of the force simulation.
   */
  function updatePositions(event) {
    // bubbleGroup.attr("transform", function(d) {
    bubbles
      // .each(bubbleGravity(event.alpha))
      .attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";
      });

    links.attr("x1", function(d) {
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
  } // updatePositions()

  /**
   * Adds an incoming MetaId to the network data array.
   * @param {Object} metaId - The document newly inserted to the MetaCollection.
   */
  var addToNetworkIds = function(metaId) {
    var newNetworkId = metaId;
    newNetworkId.matchCount = metaId.createdBy.length;
    currentNetworkIds.push(newNetworkId);
  };

  /**
   * Updates an existing item in the network data array to
   * bring the value of 'matchCount' up to date which is used
   * to change the radii of the id circles if needed.
   * @param {Object} metaId - The document from the MetaCollection that changed.
   */
  var updateNetworkId = function(metaId) {
    var networkId = _.findWhere(currentNetworkIds, {_id: metaId._id});
    if (networkId) {
      networkId.createdBy = metaId.createdBy;
      networkId.matchCount = metaId.createdBy.length;
      return networkId;
    }
  };


  /**
   * Removes a deleted MetaId from the network data array.
   * @param {Object} metaId - The document removed from the MetaCollection.
   */
  var removeFromNetworkIds = function(metaId) {
    currentNetworkIds.forEach(function(networkId, i, network) {
      if (network[i] && network[i]._id === metaId._id) {
        currentNetworkIds.splice(i, 1);
      }
    });
  };

  /**
   * Creates the SVG drawing container
   * @param {Number} currentWidth - The calculated width of the browser viewport.
   * @param {Number} currentHeight - The calculated height of the browser viewport.
   * @param {Object} margin - An object that holds values to margin the drawing area.
   */
  var makeDrawingSurface = function(currentWidth, currentHeight, margin) {
    var width,
      height,
      svgViewport,
      drawingSurface;

    // We define the inner dimensions of the drawing area.
    width = currentWidth - margin.left - margin.right;
    height = currentHeight - margin.top - margin.bottom;

    // remove all existing children of the drawing area
    d3.select("#ids-graph").select("svg").remove();
    // We create our outermost <svg> and append it to the existing <div id='ids-graph'>.
    svgViewport = d3.select("#ids-graph").append("svg")
      .attr("id", "network-vis")
      .attr("viewBox", "0 0 " + (width + margin.left + margin.right) + " " +
        (height + margin.top + margin.bottom))
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

    // =======================================
    // FOR DEBUGGING: big circle in the center
    // =======================================
    // drawingSurface.append("circle").attr({
    //   cx: currentWidth/2 - margin.left,
    //   cy: currentHeight/2,
    //   r: 5
    // }).style("fill", "white");
    return drawingSurface;
  };

  /**
   * Matches the data of the players and the identifications to
   * create objects with {@code source} and {@code target} attributes
   * which serves as the data for the force layout's associated links.
   *
   * @param {Array} playerData The user documents of the current training.
   * @param {Array} networkData The metaIds documents of the current training.
   * @return {Array} An array of objects to be used to link source and target nodes.
   */
  var setupLinksData = function(playerData, networkData) {
    var linksData = [];

    for (var i = 0; i < networkData.length; i++) {
      for (var j = 0; j < networkData[i].createdBy.length; j++) {
        var creatorId = networkData[i].createdBy[j];
        var creator = _.findWhere(playerData, {_id: creatorId});
        if (!creator) {
          continue; // We skip null, undefined, and nonexisting elements.
        }
        linksData.push({source:networkData[i], target: creator});
      }
    }

    return linksData;
  }; // setupLinksData()

  /**
   * Creates the outer circle of the player avatars.
   *
   * We want the players to form a circular ring around the center of our canvas,
   * so we convert polar coordinates to cartesian (x,y) coordinates.
   * We base the polar coordinates on the desired radius of the circular ring and an
   * angle value retrieved by dividing the size of a full circle by the number of players.
   * cf. [as of 2015-11-3] http://stackoverflow.com/questions/14790702/d3-js-plot-elements-using-polar-coordinates
   */
  var createPlayersCircle = function(players, config) {
    var spacing = 10;
    var theta = 2 * Math.PI / players.length;
    var radialPlayers = [];
    players.forEach(function(p, i, players) {
      var radialPlayer, x, y;
      x = config.centerX + config.radius * Math.cos(i * theta);
      y = config.centerY + config.radius * Math.sin(i * theta);
      // The radii values are calculated from the available width and height, respectively.
      // This allows to arrange the players elliptically, thus making more room for the bubbles.
      // x = config.centerX + (config.radiusX - (config.size/2)) * Math.cos(i * theta);
      // y = (config.centerY - spacing) + (config.radiusY - (config.size/3)) * Math.sin(i * theta);
      radialPlayer = _.extend(p, {x:x}, {y:y});
      radialPlayers.push(radialPlayer);
    });

    // =======================================
    // FOR DEBUGGING: big circle in the center
    // =======================================
    // drawingSurface.append("circle")
    //   .attr({
    //     r: config.radius,
    //     cx: config.centerX,
    //     cy: config.centerY
    //   })
    //   .style("fill", "rgba(206, 206, 206, 0.5)");

    var playerElements = drawingSurface.selectAll(".player").data(radialPlayers, function(d, i) {
      return d._id;
    });

    playerElements.exit().remove();

    var playerGroup = playerElements.enter()
      .append("g")
      .attr("id", function(d) {
        // We need to prefix the value that is assigned to the 'id' attribute
        // in order to prevent an invalid 'querySelector' which will be the case
        // if the value happens to start with a numeric character.
        // So we use the prefix 'gid' ('gid' as in 'group identifier').
        return "gid" + d._id;
      })
      .attr("class", "player")
      .attr("transform", function(d, i) {
        return "translate(" + d.x + "," + d.y + ")";
      });

    playerGroup.append("use")
      .attr("xlink:href", function(d) {
        var defaultAvatarURL = "/svg/avatars.svg#smiley-smile";
        var currentAvatar = Avatars.findOne({
          type: d.profile.avatar
        });
        return currentAvatar && currentAvatar.url || defaultAvatarURL;
      })
      .attr("width", config.size)
      .attr("height", config.size)
      .attr("transform", "translate(" + (-config.size / 2) + "," + (-config.size / 2) + ")");

    // We append a SVG <rect> in order to serve as a background for the SVG <text>.
    // For now, we only apply the 'transform' attribute so the <rect> has no
    // dimensions yet. We will apply these missing attributes right after we
    // calculated the dimensions of each <text> so that each <rect> will
    // perfectly match the 'width' and 'height' of the respecting <text> area.
    playerGroup.append("rect")
      .attr("class", "txt-background")
      // We position the rect below or above the player avatar
      // depending on its vertical position, i.e. above or below the vertical center.
      .attr("transform", function(d) {
        if (d.y < config.centerY) {
          return "translate(0," + (-config.size / 2 + spacing) + ")";
        }
        return "translate(0," + (config.size / 2 + spacing) + ")";
      })
      .style({
        fill: "#000",
        "fill-opacity": 0.6
      });

    playerGroup.append("text")
      .attr("text-anchor", "middle")
      // We position the text below or above the player avatar
      // depending on its vertical position, i.e. above or below the vertical center.
      .attr("transform", function(d) {
        if (d.y < config.centerY) {
          return "translate(0," + (-config.size / 2 + spacing) + ")";
        }
        return "translate(0," + (config.size / 2 + spacing) + ")";
      })
      .style("fill", "currentColor")
      .text(function(d) {
        return d.profile.name;
      });

    // We calculate the dimension values of the <text> element and
    // add them to the player's data.
    drawingSurface.selectAll("text").each(function(d,i) {
      var dimensions = this.getBBox();
      d.textX = dimensions.x;
      d.textY = dimensions.y;
      d.textWidth = dimensions.width;
      d.textHeight = dimensions.height;
    });

    // Accessing the previously calculated values we can now
    // apply the missing <rect> attributes.
    drawingSurface.selectAll("rect.txt-background")
      .attr({
        x: function(d) {
          return d.textX;
        },
        y: function(d) {
          return d.textY;
        },
        width: function(d) {
          return d.textWidth;
        },
        height: function(d) {
          return d.textHeight;
        }
      });

    // Call the function to handle touch and mouse events, respectively.
    touchMouseEvents(playerGroup, drawingSurface.node(), {
      "test": false,
      "down": function(d,x,y) {
        d3.event.preventDefault();
        d3.event.stopPropagation();
        var currentUserId = Meteor.userId();
        if (d && d._id == currentUserId) {
          makeReset();
          showLinksToCurrentPlayerIds(d._id);
        } else {
          makeReset();
        }
      }
    });
  }; // createPlayersCircle()


  /**
   * Creates the cloud of Id-Bubbles.
   * We use D3's force directed layout to create the visualization of the ID network.
   * The bubble cloud will be arranged inside the the outer ring formed by the players.
   * @param {Object} config - Properties of the player circle to be used for calculations.
   * @param {Number} width - The current width of the browser viewport.
   * @param {Number} height - The current height of the browser viewport.
   * @param {Array} dataset - The data to be applied to the links of the force layout.
   * @param {Object} canvas - The drawing area.
   */
  var createBubbleCloud = function(config, width, height, dataset, canvas) {
    // We map input data values (or domain) to output data values (or range).
    // Hence, we specify a minimum value of '0' and the value of 'config.count'
    // (i.e. the number of players) as the maximum value to be mapped
    // to output values used to draw circles, ranging from smaller circles to bigger ones.
    // It is important to use the square roots scale here in order to
    // use radius values to create circles with areas that correctly
    // corresponds to the data values.
    var mapRadius = d3.scale.sqrt()
      .domain([0, config.count])
      .range([10, 45]);

    bubbles = bubbles.data(currentNetworkIds, function(d) {
      return d && d._id;
    });

    // Variables we will use to check the available space for the bubble cloud.
    // var maxBubblesArea =  0.60 * Math.trunc(Math.PI * config.radiusX * config.radiusY);
    var maxBubblesArea =  0.60 * Math.trunc(Math.PI * config.radius * config.radius);
    var sumOfBubbleAreas = 0;


    // UPDATE selection
    // We update existing elements as needed.
    bubbles.each(function(d) {
      d.bubbleR = Math.floor(mapRadius(d.matchCount));
      // We add each of the bubbles area value.
      sumOfBubbleAreas += Math.PI * d.bubbleR * d.bubbleR;
    });

    // Is the maximum available space exceeded?
    if (sumOfBubbleAreas > maxBubblesArea) {
      reduceBubbleRadius(bubbles, sumOfBubbleAreas, maxBubblesArea);
    }

    bubbles.exit().remove();

    // ENTER selection
    // We create new elements as needed.
    bubbleGroup = bubbles.enter().append("g")
      .attr("id", function(d) {
        return "gid" + d._id;
      })
      .attr("class", "id-circle")
      // We specify an initial random position within the drawing area
      // in order to tame the force layout.
      .attr("transform", function(d) {
        d.x = Math.floor(Math.random() * (width - config.size));
        d.y = Math.floor(Math.random() * (height - config.size));
        return "translate(" + d.x + "," + d.y + ")";
      });

    // 'bubbleGroup' now holds both D3 'enter' and 'update' selection.
    // So, we calculate the radius for each element in the selection and
    // add it to each element's bound data for later use.
    bubbleGroup.each(function(d) {
      d.bubbleR = Math.floor(mapRadius(d.matchCount));
      sumOfBubbleAreas += Math.PI * d.bubbleR * d.bubbleR;
    });

    if (sumOfBubbleAreas > maxBubblesArea) {
      reduceBubbleRadius(bubbleGroup, sumOfBubbleAreas, maxBubblesArea);
    }

    bubbleGroup.append("circle")
      .attr("r", 0)
      .attr("class", function(d) {
        return d.color;
      });

    // Append a <foreignObject> to the <g>. The <foreignObject> contains a <p>.
    // Note the CSS style property 'opacity' and its value of '0', which we
    // transition to a value of '1' to give the text inside the circles the effect of 'fading in'.
    // We apply the 'opacity' property to the <foreignObject> since it is the
    // parent of <p> and the 'opacity' will then also apply to child elements.
    // It is not possible to make a child less transparent than its parent.
    // cf. [as of 2015-12-07] https://css-tricks.com/almanac/properties/o/opacity/
    bubbleGroup.append("foreignObject")
      .style("opacity", 0)
      .attr({
        "class": "foreign-object",
        "width": function(d) {
          return d.bubbleR * 2 + "px";
        },
        "height": function(d) {
          return d.bubbleR * 2 + "px";
        },
        "transform": function(d) {
          return "scale(1.0) translate(" + (-d.bubbleR) + ", " + (-d.bubbleR) + ")";
        }
      })
      .append("xhtml:p")
      .attr("class", "txt-inside-circle")
      .text(function(d) {
        return d.name;
      })
      .style({
        "width": function(d) {
          return d.bubbleR *  2 + "px";
        },
        "height": function(d) {
          return d.bubbleR *  2 + "px";
        },
        // We set the 'font-size' based on the width of the parent element
        // (here: the <foreignObject> element, the 'width' of which matches the <circle> diameter)
        // and the length of the text inside the <p> element.
        // We get the needed value by calculating the size of the <p> element.
        "font-size": function(d) {
          var textBox = this.getBoundingClientRect();
          // We store the calculated values on the data object.
          d.textLen = textBox.width || textBox.right - textBox.left;
          d.fontSize = (d.bubbleR * 2 - 5) / d.textLen;
          return d.fontSize + "em";
        }
      });

      // We create the transition to smoothly change each of the circles' radii from
      // '0' to its specific calculated value.
      bubbleGroup.selectAll("circle")
        .transition()
        .duration(1000)
        .attr("r", function(d) {
          return d.bubbleR;
        });


    // We create the transition to make the text inside the circle appear smoothly
    // with a slight delay.
    bubbleGroup.selectAll(".foreign-object")
      .transition()
      .delay(500)
      .duration(500)
      .style("opacity", "1");


    // We bind the links data and
    // UPDATE the selection as needed.
    links = links.data(dataset, function(d) {
      if (d && d.source && d.target) {
        return d.source._id + "-" + d.target._id;
      }
    });

    // EXIT selection
    // We remove those elements that are no longer bound to our dataset.
    links.exit().remove();

    // ENTER selection
    // We create new link elements as needed.
    links.enter().insert("line", "g")
      .style({
        "opacity": 0,
        "stroke": "currentColor",
        "stroke-width": 3
      })
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


    // Call the function to handle touch and mouse events, respectively.
    // touchMouseEvents(bubbles, canvas.node(), {
    touchMouseEvents(bubbleGroup, canvas.node(), {
      "test": false,
      "down": function(d,x,y) {
        d3.event.stopPropagation();
        makeReset();
        fadeNonMemberships(d);
        showCommonMemberships(d);
      }
    });

    // Specify the charge strength for each node based on its radius
    // and then start the force layout
    force
      .charge(function(d) {
        return -Math.pow(d.bubbleR * 1.2, 2.0);
      }).start();

  }; // createBubbleCloud()

  /**
   * Handles the event when a user taps/clicks on an Id bubble
   * by highlighting the selected bubble, the links and all the linked
   * players in the color of the Id. In addition, the size of the bubble
   * will be sligthly increased.
   * @param {Object} d - The data object bound to the selected element.
   */
  var showCommonMemberships = function(d) {
    clientLogger.logInfo("Memberships in network explored.", {
      userID: Meteor.userId(),
      trainingID: Meteor.user().profile.currentTraining,
      idName: d.name,
      memberList: d.createdBy
    });

    var membershipLinks,
      membershipPlayers,
      idBubble;

    membershipPlayers = drawingSurface.selectAll(".player").filter(function(player) {
      return _.contains(d.createdBy, player._id);
    });
    membershipPlayers.classed("highlighted", true);

    membershipLinks = drawingSurface.selectAll("line").filter(function(link) {
      return link.source._id === d._id;
    });

    // 1. Drawing layer
    // Bring the associated <line> elements to the front
    // so that they will be drawn on top of the surrounding Id bubbles.
    membershipLinks.each(function(d,i) {
      bringToFront(d3.select(this));
    });

    membershipPlayers.selectAll("use")
      .attr("class", d.color);

    membershipPlayers.selectAll("text")
      .attr("class", d.color);

    membershipLinks
      .attr("class", d.color)
      .transition()
      .style("opacity", 1);

    // 2. Drawing layer
    // Bring the clicked on Id bubble, i.e. <g> element to the front
    // so that it overlapps each connected <line> element.
    idBubble = drawingSurface.select("#gid" + d._id);
    idBubble.classed("highlighted", true);
    bringToFront(idBubble);

    idBubble.select("circle")
      .attr("class", d.color)
      .transition()
      .attr("r", function(d) {
        return d.bubbleR * 1.5;
      });

    idBubble.select(".foreign-object")
      .transition()
      .attr("transform", function(d) {
        return "scale(1.5) translate(" + (-d.bubbleR) + ", " + (-d.bubbleR) + ")";
      });

    // 3. Drawing layer
    // Bring the player elements in question to the front - must be the last to be
    // appended to the DOM in order to be drawn on top of the <line> elements.
    membershipPlayers.each(function(d,i) {
      bringToFront(d3.select(this));
    });

  }; // showCommonMemberships()


  /**
   * Fades all of the surrounding bubbles when a user taps/clicks on an Id bubble.
   * @param {Object} d - The data object bound to the clicked on element.
   */
  var fadeNonMemberships = function(d) {
    var nonmembershipPlayers,
      idBubbles;

    nonmembershipPlayers = drawingSurface.selectAll(".player").filter(function(player) {
      return !_.contains(d.createdBy, player._id);
    });
    nonmembershipPlayers.classed("highlighted", false);

    nonmembershipPlayers.selectAll("use")
      .attr("class", "c-white");

    nonmembershipPlayers.selectAll("text")
      .attr("class", "c-white");

    idBubbles = drawingSurface.selectAll(".id-circle").filter(function(group) {
      return group._id !== d._id;
    });
    idBubbles.classed("highlighted", false);

    idBubbles.selectAll("circle")
      .attr("class", "c-white");
  }; // fadeNonMemberships()


  /**
   * Resets all of the applied styles to the default.
   */
  var makeReset = function() {
    drawingSurface.selectAll(".player").classed({
      "highlighted": false,
      "self-highlighted": false
    });
    drawingSurface.selectAll(".player").selectAll("use").attr("class", null);
    drawingSurface.selectAll(".player").selectAll("text").attr("class", null);

    drawingSurface.selectAll("line")
      .style("opacity", 0)
      .attr("class", null);

    drawingSurface.selectAll(".id-circle").classed("highlighted", false);
    drawingSurface.selectAll(".id-circle circle")
      .style("opacity", 1)
      .attr("class", function(d) {
        return d.color;
      })
      .transition()
      .attr("r", function(d) {
        return d.bubbleR;
      });

    drawingSurface.selectAll(".foreign-object")
      .transition()
      .attr("transform", function(d) {
          return "scale(1.0) translate(" + (-d.bubbleR) + ", " + (-d.bubbleR) + ")";
      });
  }; // makeReset()


  /**
   * Handles the event when a user taps/clicks on the owned player avatar.
   * Highlights the links drawn to the player's Ids.
   * @param {String} playerId - The user '_id' value bound to this player.
   */
  var showLinksToCurrentPlayerIds = function(playerId) {
    clientLogger.logInfo("Own ids in network explored.", {
      userID: Meteor.userId(),
      trainingID: Meteor.user().profile.currentTraining
    });

    var currentLinks,
      currentPlayer,
      currentIdBubbles,
      otherIds;

    currentLinks = drawingSurface.selectAll("line").filter(function(link) {
      return link.target._id === playerId;
    });
    currentLinks.each(function(d, i) {
      bringToFront(d3.select(this));
      d3.select(this).style("opacity", 1);
    });

    currentIdBubbles = drawingSurface.selectAll(".id-circle").filter(function(circle) {
      return _.contains(circle.createdBy, playerId);
    });
    currentIdBubbles.each(function(d, i) {
      bringToFront(d3.select(this));
    });

    currentPlayer = drawingSurface.select("#gid" + playerId);
    currentPlayer.classed("self-highlighted", true);
    bringToFront(currentPlayer);

    otherIds = drawingSurface.selectAll(".id-circle circle").filter(function(circle) {
      return !_.contains(circle.createdBy, playerId);
    });
    otherIds.style("opacity", 0.4);
  }; // showLinksToCurrentPlayerIds

}(); // 'network' module

/**
 * Updates the attributes of a D3 selection when data has changed.
 * @param {Array} bubble - The D3 selection of the bubble the data
 * of which has changed (i.e. the selection contains only one element).
 */
var updateSelection = function(bubble) {
  bubble.select("circle")
    .transition()
    .duration(1000)
    .attr("r", function(d) {
      return d.bubbleR;
    });

  bubble.select(".foreign-object")
    .attr({
      "width": function(d) {
        return d.bubbleR * 2 + "px";
      },
      "height": function(d) {
        return d.bubbleR * 2 + "px";
      },
      "transform": function(d) {
        return "scale(1.0) translate(" + (-d.bubbleR) + ", " + (-d.bubbleR) + ")";
      }
    })
    .select(".txt-inside-circle")
      .style({
        "width": function(d) {
          return d.bubbleR * 2 + "px";
        },
        "height": function(d) {
          return d.bubbleR * 2 + "px";
        },
        // We update the font-size based on the calculated text length
        "font-size": function(d) {
          d.fontSize = (d.bubbleR * 2 - 5) / d.textLen;
          return d.fontSize + "em";
        }
      });
};


/**
 * Reduces the radius for each element in the selection.
 * First, we calculate the ratio between the total of bubble areas
 * and the maximum area available within the players circle.
 * Then, we take the square root of its reciprocal and muliply it with
 * each element's radius and we also set this new value
 * making it available for getting/setting attribute values and style
 * properties.
 * @param {Object} selection - A D3 selection (update or enter).
 * @param {Number} areaSum - The total area of all bubbles currently displayed.
 * @param {Number} maxArea - The maximum available area for the bubbles. Specified in relation
 * to the area spanned by the player ring.
 */
var reduceBubbleRadius = function(selection, areaSum, maxArea) {
  var zoomFactor = areaSum / maxArea; // e.g.  a value of 1.2 means 20% too big
  selection.each(function(d) {
    d.bubbleR *= Math.sqrt(1.0 / zoomFactor);
  });
};

// var getCurrentAvatar = function() {
//
//     var defaultAvatarURL = "/svg/avatars.svg#smiley-smile";
//     var currentAvatar = Avatars.findOne({
//       type: d.profile.avatar
//     });
//     return currentAvatar && currentAvatar.url || defaultAvatarURL;
//
// };
