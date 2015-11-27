/**
 * network.js
 *
 */


var network = function() {

  /** drawing surface to render into */
  var drawingSurface,
    linksContainer,
    bubblesContainer,
    playersContainer,
    force,
    bubbles,
    links,
    bubbleGroup,
    currentNetworkIds = [],
    dataset = [];

  Template.idNetwork.onCreated(function() {
  //  force  = d3.layout.force();
  }); // onCreated()



  Template.idNetwork.onRendered(function() {
    var templateInstance = this;

    var avatarSize = 150;
    // We retrieve the current browser viewport size.
    var clientWidth = document.documentElement.clientWidth;
    var clientHeight = document.documentElement.clientHeight - avatarSize;
    var outerRadius = Math.min(clientWidth, clientHeight - avatarSize / 2) / 2 - avatarSize / 2;
    // var bubbleRadius = Math.floor(outerRadius * 0.1);



    // create the drawingSurface to render into
    drawingSurface = makeDrawingSurface(clientWidth, clientHeight);
    linksContainer = drawingSurface.append("g").attr("id", "links-group");
    bubblesContainer = drawingSurface.append("g").attr("id", "bubbles-group");
    playersContainer = drawingSurface.append("g").attr("id", "players-group");
    bubbles = bubblesContainer.selectAll(".id-circle");
    links = linksContainer.selectAll("line");

    var currentUser = Meteor.user();
    var currentTrainingId = currentUser.profile.currentTraining;
    var currentPlayers = Meteor.users.find({"profile.currentTraining": currentTrainingId}).fetch();

    var playersConfig =  {
      radius: outerRadius,
      centerX: clientWidth / 2,
      centerY: clientHeight / 2,
      size: avatarSize
    };

    console.log(playersConfig.radius);
    createPlayersCircle(currentPlayers, playersConfig);

    templateInstance.autorun(function() {

    // var currentNetworkIds = MetaCollection.find({
    //   $nor: [
    //     {
    //       createdBy: {
    //         $exists: false
    //       }
    //     }, {
    //       createdBy: {
    //         $size: 0
    //       }
    //     }, {
    //       createdBy: {
    //         $size: 1
    //       }
    //     }
    //   ]
    // }).fetch();

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
      ]
    });

    currentNetworkCursor.observe({
      added: function(doc) {
        addToNetworkIds(doc);
        dataset = setupLinksData(currentPlayers, currentNetworkIds);
        createBubbleCloud(outerRadius, clientWidth, clientHeight, playersConfig, dataset, drawingSurface);
      },
      changed: function(newDoc,oldDoc) {

      },
      removed: function(doc) {
        removeFromNetworkIds(doc);
        dataset = setupLinksData(currentPlayers, currentNetworkIds);
        createBubbleCloud(outerRadius, clientWidth, clientHeight, playersConfig, dataset, drawingSurface);
      }
    });


    console.log(currentNetworkIds);


    // createBubbleCloud(bubbleRadius, clientWidth, clientHeight, playersConfig, dataset, drawingSurface);

  });
    // set up mouse events
    touchMouseEvents(drawingSurface, // target
                     drawingSurface.node(), // container for position calculation
                     { "test": false,
                       "down": function(d) {
                         d3.event.preventDefault(); // prevent DOM element selection etc.
                         makeReset();
                        //  bubblesContainer.selectAll(".id-circle circle")
                        //    .attr("class", function(d) {
                        //      return d.color;
                        //    });
                       }
                     }
    );

    // d3.select(window).on("resize", function() {
    //   clientWidth = document.documentElement.clientWidth;
    //   clientHeight = document.documentElement.clientHeight;
    //
    //   playersConfig.radius = Math.min(clientWidth, clientHeight-avatarSize/2) / 2 - avatarSize / 2;
    //   playersConfig.centerX = clientWidth / 2;
    //   playersConfig.centerY= clientHeight / 2;
    //
    //   drawingSurface = makeDrawingSurface(clientWidth, clientHeight);
    //   createPlayersCircle(currentPlayers, playersConfig);
    //   createBubbleCloud(clientWidth, clientHeight, playersConfig, dataset, drawingSurface);
    // });
  }); // onRendered()


  function assembleAroundCenter(event) {
    var damping = 0.1;

    // currentNetworkIds.forEach(function(datum, i) {
    //   datum.x = datum.x + (config.centerX - datum.x) * (damping + 0.02) * event.alpha;
    //   datum.y = datum.y + (config.centerY - datum.y) * (damping + 0.02) * event.alpha;
    // });

    // bubbleGroup.attr("transform", function(d) {
    bubbles.attr("transform", function(d) {
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
  } // assembleAroundCenter()


  var addToNetworkIds = function(metaId) {
        // console.log(metaId);
    for (var i = 0; i < currentNetworkIds.length; i++) {
        // console.log(currentNetworkIds[i]);
        // console.log(metaId);
      if (currentNetworkIds[i].name == metaId.name) {
        return console.log("already in");
      }

    }
        var newNetworkId = _.extend(metaId, {matchCount: metaId.createdBy.length});
        // console.log(newNetworkId);
        currentNetworkIds.push(newNetworkId);
        return currentNetworkIds;
  };

  var removeFromNetworkIds = function(metaId) {
    currentNetworkIds.forEach(function(networkId, i, network) {
      if (network[i] && network[i]._id === metaId._id) {
        currentNetworkIds.splice(i, 1);
      }
    });
  };

  /**
    * Create the SVG drawing container
    */
  var makeDrawingSurface = function(currentWidth, currentHeight) {
    var margin,
      width,
      height,
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
    width = currentWidth - margin.left - margin.right;
    height = currentHeight - margin.top - margin.bottom;

    // remove all existing children of the drawing area
    d3.select("#ids-graph").select("svg").remove();
    // We create our outermost <svg> and append it to the existing <div id='ids-graph'>.
    svgViewport = d3.select("#ids-graph").append("svg")
      .attr("id", "network-vis")
      .attr("viewBox", "0 0 " + (width + margin.left + margin.right) + " " + (height + margin
        .top + margin.bottom))
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

    // FOR DEBUGGING: circle in the center
    // drawingSurface.append("circle").attr({
    //   cx: currentWidth/2,
    //   cy: currentHeight/2,
    //   r: 5
    // }).style("fill", "white");


    return drawingSurface;

  };


  var setupLinksData = function(playerData, networkData) {
    var linksData = [];

    for (var i = 0; i < networkData.length; i++) {
      for (var j = 0; j < networkData[i].createdBy.length; j++) {
        var creatorId = networkData[i].createdBy[j];
        var creator = _.findWhere(playerData, {_id: creatorId});
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
    var theta = 2 * Math.PI / players.length;
    var radialPlayers = [];
    players.forEach(function(p, i, players) {
      var radialPlayer, x, y;
      x = config.centerX + config.radius * Math.cos(i * theta);
      y = config.centerY + config.radius * Math.sin(i * theta);
      radialPlayer = _.extend(p, {x:x}, {y:y});
      radialPlayers.push(radialPlayer);
    });

    // FOR DEBUGGING: big circle in the center
    // drawingSurface.append("circle")
    //   .attr({
    //     r: config.radius,
    //     cx: config.centerX,
    //     cy: config.centerY
    //   })
    //   .style("fill", "rgba(206, 206, 206, 0.5)");

    var playerElements = playersContainer.selectAll(".player").data(radialPlayers, function(d, i) {
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
      .attr("transform", "translate(0," + (config.size / 2 + 5) + ")");

    playerGroup.append("text")
      .attr("text-anchor", "middle")
      .attr("transform", "translate(0," + (config.size / 2 + 5) + ")")
      .style("fill", "currentColor")
      .text(function(d) {
        return d.profile.name;
      });

    // We calculate the dimension values of the <text> element and
    // add them to the player's data.
    playersContainer.selectAll("text").each(function(d,i) {
      var dimensions = this.getBBox();
      d.textX = dimensions.x;
      d.textY = dimensions.y;
      d.textWidth = dimensions.width;
      d.textHeight = dimensions.height;
    });

    // Accessing the previously calculated values we can now
    // apply the missing <rect> attributes.
    playersContainer.selectAll("rect")
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
      })
      .style({
        fill: "#000",
        "fill-opacity": 0.6
      });
  }; // createPlayersCircle()


  var createBubbleCloud = function(radius, width, height, config, dataset, canvas) {
    var count = _.pluck(currentNetworkIds, "matchCount");
    var bubbleRadius = d3.scale.sqrt()
      .domain([d3.min(count), d3.max(count)])
      .range([radius * 0.1, radius * 0.2]);

      if(!force) {
        force = d3.layout.force()
          .nodes(currentNetworkIds)
          // .links([])
          .size([width, height])
          .gravity(0.8)
          .charge(function(d) {
            return -Math.pow(bubbleRadius(d.matchCount) * 2, 2.0);
          })
      .on("tick", assembleAroundCenter)
          .friction(0.7);
      }
      force
        .start();

    bubbles = bubbles.data(currentNetworkIds, function(d) {
      return d._id;
    });

    bubbles.exit().remove();

    links = links.data(dataset, function(d) {
      return d.source._id + "-" + d.target._id;
    });

    links.exit().remove();

    links.enter().insert("line", "g.id-circle")
      .style({
        "opacity": 0,
        "stroke": "currentColor"
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

    bubbleGroup = bubbles.enter().append("g")
      .attr("id", function(d) {
        return "gid" + d._id;
      })
      .attr("class", "id-circle")
      .attr("transform", function(d) {
        d.x = Math.random() * (width - config.size);
        d.y = Math.random() * (height - config.size);
        return "translate(" + d.x + "," + d.y + ")";
      })
      .on("mouseover", function(d,x,y) {
        makeReset();
        focusAffiliates(d);
        fadeContext(d);
      })
      .on("mouseout", function(d) {
        makeReset();
      });

    // 'bubbleGroup' now holds both D3 'enter' and 'update' selection.
    // So, we calculate the radius for each element in the selection and
    // add it to each element's bound data for later use.
    bubbleGroup.each(function(d) {
      d.bubbleR = bubbleRadius(d.matchCount);
    });

    bubbleGroup.append("circle")
      .attr("r", 0)
      .attr("class", function(d) {
        return d.color;
      })
      .transition().duration(2000).attr("r", function(d) {
        return d.bubbleR;
      });

    // Append a <foreignObject> to the <g>. The <foreignObject> contains a <p>.
    bubbleGroup.append("foreignObject")
      .attr({
        "class": "foreign-object",
        "width": function(d) {
          return d.bubbleR * 2 + "px";
        },
        "height": function(d) {
          return d.bubbleR * 2 + "px";
        },
        "transform": function(d) {
          return "scale(0.9) translate(" + (-d.bubbleR) + ", " + (-d.bubbleR) + ")";
        }
      })
      .append("xhtml:p")
      .classed("txt-inside-circle", true)
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
          var textLen = textBox.width || textBox.right - textBox.left;
          return (d.bubbleR * 2 - 10) / textLen + "em";
        }
      });

      // // EXPERIMENT:
      // // Using an SVG <text> element it is possible to automatically
      // // size the text to occupy all of the available space inside the <circle>
      // bubbleGroup.append("text")
      //   .text(function(d) {
      //     return d.name;
      //   })
      //   .style({
      //     "dominant-baseline": "middle",
      //     "text-anchor": "middle",
      //     "pointer-events": "none",
      //     "font-size": function(d) {
      //       var textLen = this.getComputedTextLength();
      //       return Math.min(d.bubbleR * 2, (d.bubbleR * 2 - 8) / textLen) + "em";
      //     }
      //   });

    // Call the function to handle touch and mouse events, respectively.
    touchMouseEvents(bubbleGroup, canvas.node(), {
      "test": false,
      "down": function(d,x,y) {
        d3.event.stopPropagation();
        makeReset();
        focusAffiliates(d);
        fadeContext(d);
      }
    });

  }; // createBubbleCloud()

  var focusAffiliates = function(d) {
    var affiliatedLinks,
      affiliatedPlayers,
      idBubble;

    affiliatedPlayers = playersContainer.selectAll(".player").filter(function(player) {
      return _.contains(d.createdBy, player._id);
    });

    affiliatedLinks = linksContainer.selectAll("line").filter(function(link) {
      return link.source._id === d._id;
    });

    affiliatedPlayers.selectAll("use")
      .attr("class", d.color);

    affiliatedPlayers.selectAll("text")
      .attr("class", d.color);

    affiliatedLinks
      .attr("class", d.color)
      .style("opacity", 1);

    // Always bring the selected <g> element to the front in case of overlapping elements.
    // We can accomplish that by reordering the element in the DOM tree.
    // Hence, we append the current selected <g> at the end of its parent because
    // with SVG, the last element in the document tree is drawn on top
    // cf. [as of 2015-10-05] http://bl.ocks.org/alignedleft/9612839
    // cf. [as of 2015-10-05] http://www.adamwadeharris.com/how-to-bring-svg-elements-to-the-front/
    idBubble = bubblesContainer.select("#gid" + d._id);
    if (idBubble && idBubble.node()) {
      idBubble.node().parentNode.appendChild(idBubble.node());
    }
    idBubble.select("circle")
      .attr("class", d.color)
      .transition()
      .attr("r", function(d) {
        return d.bubbleR * 1.5;
      });
  }; // focusAffiliates()

  var fadeContext = function(d) {
    var nonAffiliatedPlayers,
      idBubbles;

    nonAffiliatedPlayers = playersContainer.selectAll(".player").filter(function(player) {
      return !_.contains(d.createdBy, player._id);
    });

    nonAffiliatedPlayers.selectAll("use")
      .attr("class", "c00");

    nonAffiliatedPlayers.selectAll("text")
      .attr("class", "c00");

    bubblesContainer.selectAll(".id-circle circle").filter(function(circle) {
      return circle._id !== d._id;
    }).attr("class", "c00");
  };

  var makeReset = function() {
    playersContainer.selectAll(".player").selectAll("use").attr("class", null);
    playersContainer.selectAll(".player").selectAll("text").attr("class", null);

    linksContainer.selectAll("line")
      .style("opacity", 0)
      .attr("class", null);

    bubblesContainer.selectAll(".id-circle circle")
      .attr("class", function(d) {
        return d.color;
      })
      .transition()
      .attr("r", function(d) {
        return d.bubbleR;
      });
  };

}(); // 'network' module
