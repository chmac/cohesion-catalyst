/**
 * network.js
 *
 */


var network = function() {

  /** drawing surface to render into */
  var drawingSurface,
    force;

  Template.idNetwork.onCreated(function() {

  }); // onCreated()



  Template.idNetwork.onRendered(function() {
    var templateInstance = this;

    var avatarSize = 150;
    var clientWidth = document.documentElement.clientWidth;
    var clientHeight = document.documentElement.clientHeight;
    var outerRadius = Math.min(clientWidth, clientHeight-avatarSize/2) / 2 - avatarSize / 2;
    var bubbleRadius = Math.floor(outerRadius * 0.1);

    templateInstance.autorun(function() {
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

    var currentNetworkIds = MetaCollection.find({
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
    }).fetch();

    var dataset = arrangeData(currentPlayers, currentNetworkIds);

    // create the drawingSurface to render into
    drawingSurface = makeDrawingSurface(clientWidth, clientHeight);

    createPlayersCircle(currentPlayers, playersConfig);

    createBubbleCloud(bubbleRadius, clientWidth, clientHeight, playersConfig, dataset, drawingSurface);
  });
    // set up mouse events
    touchMouseEvents(drawingSurface, // target
                     drawingSurface.node(), // container for position calculation
                     { "test": false,
                       "down": function(d) {
                         d3.event.preventDefault(); // prevent DOM element selection etc.
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


  var arrangeData = function(playerData, networkData) {
    var data = {
      nodes: networkData,
      links: []
    };

    for (var i = 0; i < networkData.length; i++) {
      for (var j = 0; j < networkData[i].createdBy.length; j++) {
        var creatorId = networkData[i].createdBy[j];
        var creator = _.findWhere(playerData, {_id: creatorId});
        data.links.push({source:networkData[i], target: creator});
      }
    }

    return data;
  }; // arrangeData()

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

    playerGroup.append("text")
      .attr("text-anchor", "middle")
      .attr("transform", "translate(0," + (config.size / 2 + 5) + ")")
      .text(function(d) {
        return d.profile.name;
      });
  }; // createPlayersCircle()


  var createBubbleCloud = function(radius, width, height, config, dataset, canvas) {

    var bubbles = canvas.selectAll(".id-circle").data(dataset.nodes, function(d) {
      return d._id;
    });

    var connections = canvas.selectAll("line").data(dataset.links, function(d) {
      return d.source._id + "-" + d.target._id;
    });

    connections.enter().insert("line", "g")
      .attr("class", "link")
      .style("opacity", 0)
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

    bubbles.enter().append("g")
      .attr("class", "id-circle")
      .attr("transform", function(d) {
        d.x = Math.random() * (width - config.size);
        d.y = Math.random() * (height - config.size);
        return "translate(" + d.x + "," + d.y + ")";
      })
      .on("mouseover", function(d,x,y) {
        d3.selectAll("line").filter(function(link) {
          return link.source._id !== d._id;
        }).style("opacity", 0);
        d3.selectAll("line").filter(function(link) {
          return link.source._id === d._id;
        }).style("opacity", 1);
        d3.selectAll(".id-circle circle").filter(function(circle) {
          return circle._id !== d._id;
        }).style("opacity", 0.4);
        d3.selectAll(".id-circle circle").filter(function(circle) {
          return circle._id === d._id;
        }).style("opacity", 1);
      });

    bubbles.append("circle")
      .attr("r", 0)
      .attr("class", function(d) {
        return d.color;
      })
      .transition().duration(2000).attr("r", radius);

    // Append a <foreignObject> to the <g>. The <foreignObject> contains a <p>.
    bubbles.append("foreignObject")
      .attr({
        "class": "foreign-object",
        "width": radius * 2,
        "height": radius * 2,
        "transform": "scale(0.9) translate(" + (-radius) + ", " + (-radius) + ")"
      })
      .append("xhtml:p")
      .classed("txt-pool", true)
      .style({
        "width": radius *  2 + "px",
        "height": radius *  2 + "px",
        "max-width": radius *  2 + "px",
        "max-height": radius *  2  + "px",
        "font-size": "1em" // making it inline to override CSS rules
      })
      .text(function(d) {
        return d.name;
      });

    // Call the function to handle touch and mouse events, respectively.
    touchMouseEvents(bubbles, canvas.node(), {
      "test": false,
      "down": function(d,x,y) {
        d3.selectAll("line").filter(function(link) {
          return link.source._id !== d._id;
        }).style("opacity", 0);
        d3.selectAll("line").filter(function(link) {
          return link.source._id === d._id;
        }).style("opacity", 1);
      }
    });

    function assembleAroundCenter(event) {
      var damping = 0.1;

      dataset.nodes.forEach(function(datum, i) {
        datum.x = datum.x + (config.centerX - datum.x) * (damping + 0.02) * event.alpha;
        datum.y = datum.y + (config.centerY - datum.y) * (damping + 0.02) * event.alpha;
      });

      bubbles.attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";
      });

      connections.attr("x1", function(d) {
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

    force = d3.layout.force()
      .nodes(dataset.nodes)
      .links([])
      .size([width, height])
      .gravity(0.08)
      .charge(function(d) {
        return -Math.pow(radius, 2);
      })
      .friction(0.7)
      .on("tick", assembleAroundCenter)
      .start();
  }; // createBubbleCloud()

  Template.idNetwork.helpers({
    ids: function() {
      // MetaCollection.find( {createdBy : {$exists:true}, $where:"this.createdBy.length>1"} )
      return MetaCollection.find({
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
    }
  });


  Template.idNetwork.onDestroyed(function() {
    d3.select(window).on("resize",  null);
  });

}(); // 'network' module
