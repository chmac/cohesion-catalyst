/**
 * network.js
 *
 */


var network = function() {

  /** drawing surface to render into */
  var drawingSurface;

  Template.idNetwork.onCreated(function() {
    // var currentUser,
    //   currentTrainingId;
    //
    // currentUser = Meteor.user();
    // currentTrainingId = currentUser.profile.currentTraining;

    // Meteor.subscribe("networkIdentifications", currentTrainingId);
    // Meteor.subscribe("currentPlayers", currentTrainingId);
  }); // onCreated()



  Template.idNetwork.onRendered(function() {

    var currentUser = Meteor.user();
    var currentTrainingId = currentUser.profile.currentTraining;

    var clientWidth = document.documentElement.clientWidth;
    var clientHeight = document.documentElement.clientHeight;

    var avatarSize = 150;

    var playersConfig =  {
      radius: Math.min(clientWidth, clientHeight) / 2 - avatarSize / 2,
      centerX: clientWidth / 2,
      centerY: clientHeight / 2,
      size: avatarSize
    };

    // create the drawingSurface to render into
    drawingSurface = makeDrawingSurface(clientWidth, clientHeight);

    // var currentPlayers = Meteor.users.find({"profile.currentTraining": currentTrainingId}).fetch();
    var currentPlayers = Meteor.users.find().fetch();
    var radialPlayers = calculateRadialPlayers(currentPlayers, playersConfig);
    createPlayersCircle(radialPlayers, playersConfig);

    var currentIdBubbles = MetaCollection.find({
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


    console.log("radialPlayers ", radialPlayers);
    console.log("currentIdBubbles ", currentIdBubbles);

    var links = [];
    for (var i=0; i<currentIdBubbles.length; i++) {
      for (var j=0; j<currentIdBubbles[i].createdBy.length; j++) {
        var creatorId = currentIdBubbles[i].createdBy[j];
        var creator = _.findWhere(radialPlayers, {_id: creatorId});
        // links.push({source:currentIdBubbles[i]._id, target: currentIdBubbles[i].createdBy[j]});
        links.push({source:currentIdBubbles[i], target: creator});
      }
    }

    createBubbleCloud(clientWidth, clientHeight, playersConfig, currentIdBubbles, drawingSurface);

    // set up mouse events
    touchMouseEvents(drawingSurface, // target
                     drawingSurface.node(), // container for position calculation
                     { "test": false,
                       "down": function(d) {
                         d3.event.preventDefault(); // prevent DOM element selection etc.
                       }
                     }
    );
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
    drawingSurface.append("circle").attr({
      cx: width/2,
      cy: height/2,
      r: 5
    }).style("fill", "white");

    return drawingSurface;

  };

  // http://stackoverflow.com/questions/14790702/d3-js-plot-elements-using-polar-coordinates
  var calculateRadialPlayers = function(players, config) {
    var theta = 2 * Math.PI / players.length;
    var radialPlayers = [];
    players.forEach(function(p, i, players) {
      var radialPlayer, x, y;
      x = config.centerX + config.radius * Math.cos(i * theta);
      y = config.centerY + config.radius * Math.sin(i * theta);
      radialPlayer = _.extend(p, {x:x}, {y:y});
      radialPlayers.push(radialPlayer);
    });
    return radialPlayers;
  };


  var createPlayersCircle = function(players, config) {
    // console.log(players);
    // var theta = 2 * Math.PI / players.length;
    var playerElements = drawingSurface.selectAll(".player").data(players, function(d, i) {
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
        // d.x = config.centerX + config.radius * Math.cos(i * theta);
        // d.y = config.centerY + config.radius * Math.sin(i * theta);
        // return "translate(" + (config.centerX + config.radius * Math.cos(i * theta)) + "," +
        //   (config.centerY + config.radius * Math.sin(i * theta)) + ")";
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


  var createBubbleCloud = function(width, height, config, dataset, canvas) {
    var bubbleRadius = 40;
    var force = d3.layout.force()
      .nodes(dataset)
      .size([width - config.size, height - config.size])
      .gravity(-0.01)
      .charge(function(d) {
        return -Math.pow(bubbleRadius, 2);
      })
      .friction(0.7)
      .on("tick", assembleAroundCenter)
      .start();

    var bubbles = canvas.selectAll(".id-circle").data(dataset, function(d) {
      return d._id;
    });

    bubbles.enter().append("g")
      .attr("class", "id-circle")
      .attr("transform", function(d) {
        d.x = Math.random() * (width - config.size);
        d.y = Math.random() * (height - config.size);
        return "translate(" + d.x + "," + d.y + ")";
      });

    bubbles.append("title")
      .text(function(d) {
        return d.name;
      });

    bubbles.append("circle")
      .attr("r", 0)
      .attr("class", function(d) {
        return d.color;
      })
      .transition().duration(2000).attr("r", bubbleRadius);

    // Append a <foreignObject> to the <g>. The <foreignObject> contains a <p>.
    bubbles.append("foreignObject")
      .attr({
        "class": "foreign-object",
        "width": bubbleRadius * 2,
        "height": bubbleRadius * 2,
        "transform": "scale(0.9) translate(" + (-bubbleRadius) + ", " + (-bubbleRadius) + ")"
      })
      .append("xhtml:p")
      .classed("txt-pool", true)
      .style({
        "width": bubbleRadius *  2 + "px",
        "height": bubbleRadius *  2 + "px",
        "max-width": bubbleRadius *  2 + "px",
        "max-height": bubbleRadius *  2  + "px",
        "font-size": "1em" // making it inline to override CSS rules
      })
      .text(function(d) {
        return d.name;
      });

    // Call the function to handle touch and mouse events, respectively.
    touchMouseEvents(bubbles, canvas.node(), {
      "test": false,
      "click": function(d,x,y) {
        console.log(d, d3.select(this));
      }
    });

    function assembleAroundCenter(event) {
      dataset.forEach(function(datum, i) {
        datum.x = datum.x + (config.centerX - datum.x) * (0.1 + 0.02) * event.alpha;
        datum.y = datum.y + (config.centerY - datum.y) * (0.1 + 0.02) * event.alpha;
      });

      bubbles.attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";
      });
    }
  };

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

}(); // 'network' module
