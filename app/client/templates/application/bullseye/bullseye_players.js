(function() {

  var drawingSurface;

  Template.bullseyePlayers.onCreated(function() {
    var templateInstance = this;

    templateInstance.autorun(function() {
      var currentTraining = Trainings.find({
        isCurrentTraining: true
      }, {
        fields: {
          isCurrentTraining: 1
        }
      }).fetch()[0];

      if (currentTraining) {
        Session.set("bullseyeCurrentTraining", currentTraining._id);
      }
    });

  }); // onCreated()

  Template.bullseyePlayers.onRendered(function() {

    var avatarSize = 105;

    var margin = {
      top: 10,
      right: 10,
      bottom: 10,
      left: 10
    };

    // We call the helper function to create the drawing area.
    drawingSurface = makeCanvas(d3.select(".bullseye-view"), margin);

    var containerHeight = d3.select(".bullseye-view").node().clientHeight;
    var containerWidth = d3.select(".bullseye-view").node().clientWidth;

    var bullseyePlayers = Meteor.users.find({
      "profile.currentTraining": Session.get("bullseyeCurrentTraining")
    }, {
      fields: {
        profile: 1
      }
    }).fetch();

    var playersConfig =  {
      radius: (containerHeight - avatarSize * 0.25) * 0.5 - avatarSize * 0.5,
      centerX: containerWidth * 0.5 - margin.left, // We need to adjust the translation of the drawing surface
      centerY: containerHeight * 0.5 - margin.top,
      size: avatarSize,
      count: bullseyePlayers.length
    };

    createPlayersCircle(bullseyePlayers, playersConfig);


  }); // onRendered()

  // Template.bullseyePlayers.helpers({
  //   players: function() {
  //     return Meteor.users.find({
  //       "profile.currentTraining": Session.get("bullseyeCurrentTraining")
  //     }, {
  //       fields: {
  //         profile: 1
  //       }
  //     });
  //   }
  // });


  var createPlayersCircle = function(players, config) {
    var spacing = 15;
    var theta = 2 * Math.PI / players.length;

    var radialPlayers = [];
    players.forEach(function(p, i, players) {
      var radialPlayer, x, y, rotation;
      x = config.centerX + config.radius * Math.cos(i * theta);
      y = config.centerY + config.radius * Math.sin(i * theta);
      rotation = 30 + i * 60;
      radialPlayer = _.extend(p, {x:x}, {y:y}, {rotation: rotation});
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

    var playerElements = drawingSurface.selectAll(".bullseye-player")
      .data(radialPlayers, function(d, i) {
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
      .attr("class", "bullseye-player")
      .attr("transform", function(d, i) {
        // We translate each player to the center, then rotate each by
        // its specific rotation angle, then translate by the radius it along the y-axis.
        return "translate(" + (config.centerX ) + "," + (config.centerY) + ")" +
          "rotate(" + d.rotation + ")" +
          "translate(0," + (-config.radius) + ")";

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
      .attr("transform", "translate(" + (-config.size * 0.5) + "," + (-config.size * 0.5) + ")");


    playerGroup.append("text")
      .attr("text-anchor", "middle")
      // We position the text above the player avatar
      .attr("transform", function(d) {
        return "translate(0," + (-config.size * 0.5 + spacing) + ")";
      })
      .style("fill", "currentColor")
      .text(function(d) {
        return d.profile.name;
      });
    };

}()); // end function closure
