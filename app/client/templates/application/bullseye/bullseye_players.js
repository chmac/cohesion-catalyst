(function() {

  var drawingSurface;
  var playerList = [];

  Template.bullseyePlayers.onRendered(function() {
    var templateInstance = this;
    Session.set("canvasSize", document.documentElement.clientHeight);

    var avatarSize = 105;

    var margin = {
      top: 10,
      right: 10,
      bottom: 10,
      left: 10
    };

    var containerSize = Session.get("canvasSize");
    Session.set("playerRadius", (containerSize - avatarSize * 0.25) * 0.5 - avatarSize * 0.5);
    Session.set("centerX", containerSize * 0.5);
    Session.set("centerY", containerSize * 0.5);

    drawingSurface = d3.select("#player-canvas").append("g")
      .attr("id", "players-group")
      .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

    // var bullseyePlayers = Meteor.users.find({
    //   "profile.currentTraining": Session.get("bullseyeCurrentTraining")
    // }, {
    //   fields: {
    //     profile: 1,
    //     status: 1
    //   }
    // }).fetch();
    // console.log(bullseyePlayers);

    var playersConfig = configPlayers(avatarSize, margin);

    var bullseyePlayersCursor = Meteor.users.find({
      "profile.currentTraining": Session.get("bullseyeCurrentTraining")
    }, {
      fields: {
        profile: 1,
        status: 1
      }
    });

    // We use a flag to indicate the initial query results that
    // should not affect the 'added()' callback.
    var initializing = true;

    templateInstance.playerHandle = bullseyePlayersCursor.observe({
      added: function(doc) {
        addToPlayers(doc);

        // We want to prevent multiple calls of '()'
        // while the 'added()' callback delivers the initial result of the query.
        if (!initializing) {
          createPlayersCircle(playerList, configPlayers(avatarSize, margin));
        }
      },
      removed: function(doc) {
        removeFromPlayers(doc);
        createPlayersCircle(playerList, playersConfig);
      },
      changed: function(newDoc, oldDoc) {
        // TODO change avatar
      }
    });

    // At this point, 'observe' has returned and the initial query results are delivered.
    // So we call '()' with the initial dataset.
    initializing = false;
    createPlayersCircle(playerList, playersConfig);

    // var playersConfig =  {
    //   radius: (containerSize - avatarSize * 0.25) * 0.5 - avatarSize * 0.5,
    //   centerX: containerSize * 0.5 - margin.left, // We need to adjust the translation of the drawing surface
    //   centerY: containerSize * 0.5 - margin.top,
    //   size: avatarSize,
    //   count: bullseyePlayers.length
    // };

    $(window).resize(function () {
      Session.set("canvasSize", document.documentElement.clientHeight);
      Session.set("playerRadius", (Session.get("canvasSize") - avatarSize * 0.25) * 0.5 - avatarSize * 0.5);
      Session.set("centerX", Session.get("canvasSize") * 0.5);
      Session.set("centerY", Session.get("canvasSize") * 0.5);
      var config = configPlayers(avatarSize, margin);
      d3.selectAll(".bullseye-player")
      .attr("transform", function(d, i) {
        // We translate each player to the center, then rotate each by
        // its specific rotation angle, then translate by the radius along the y-axis.
        return "translate(" + (config.centerX ) + "," + (config.centerY) + ")" +
          "rotate(" + d.rotation + ")" +
          "translate(0," + (-config.radius) + ")";
      });
    });



  }); // onRendered()


  function configPlayers(avatar, margin) {
    return {
      radius: Session.get("playerRadius"),
      centerX: Session.get("centerX") - margin.left,
      centerY: Session.get("centerY") - margin.top,
      size: avatar
    };
  }

  function addToPlayers(doc) {
    var newPlayer = doc;
    switch(newPlayer.profile.name) {
      // #1
      case "Tester":
        newPlayer.rotation = 30;
        break;
      // #2
      case "Willy":
        newPlayer.rotation = 90;
        break;
      // #3
      case "Otto":
        newPlayer.rotation = 150;
        break;
      // #4
      case "Fred":
        newPlayer.rotation = 210;
        break;
      // #5
      case "Jenny":
        newPlayer.rotation = 270;
        break;
      // #6
      case "Kimmy":
        newPlayer.rotation = 330;
        break;
      default:
        // ignore
        break;
    }
    playerList.push(newPlayer);
  } // addToPlayers


  function removeFromPlayers(doc) {
    playerList.forEach(function(player, i, list) {
      if (list[i] && list[i]._id === doc._id) {
        playerList.splice(i, 1);
      }
    });
  } // removeFromPlayers


  Template.bullseyePlayers.helpers({
    radius: function() {
      return Session.get("playerRadius");
    },
    cx: function() {
      return Session.get("centerX");
    },
    cy: function() {
      return Session.get("centerY");
    }
  });


  var createPlayersCircle = function(players, config) {
    var spacing = 15;
    // var theta = 2 * Math.PI / players.length;

    // var radialPlayers = [];
    // players.forEach(function(p, i, players) {
    // // players.forEach(function(p, i, players) {
    //   var radialPlayer, x, y, rotation;
    //   x = config.centerX + config.radius * Math.cos(i * theta);
    //   y = config.centerY + config.radius * Math.sin(i * theta);
    //   // rotation = 30 + i * 60;
    //   radialPlayer = _.extend(p, {x:i}, {y:y}, {rotation: p.rotation});
    //   radialPlayers.push(radialPlayer);
    // });

    // =======================================
    // FOR DEBUGGING: big circle in the center
    // =======================================
    // drawingSurface.append("circle")
    //   .attr({
    //     r: config.radius,
    //     cx: config.centerX,
    //     cy: config.centerY
    //   })
    //   .style("fill", "rgba(55, 55, 55, 0.3)");

    var playerElements = drawingSurface.selectAll(".bullseye-player")
      // .data(radialPlayers, function(d, i) {
      .data(players, function(d, i) {
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

  // We need to stop observing our live queries when this template is
  // removed from the DOM.
  Template.bullseyePlayers.onDestroyed(function() {
    var templateInstance = this;
    templateInstance.playerHandle.stop();
  }); // onDestroyed

}()); // end function closure
