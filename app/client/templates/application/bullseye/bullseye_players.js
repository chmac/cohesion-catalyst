(function() {

  var drawingSurface;
  var playerList;

  Template.bullseyePlayers.onCreated(function() {
    Session.setDefault("presentationMode", "projector");
  });

  Template.bullseyePlayers.onRendered(function() {
    var templateInstance = this;
    playerList = [];

    Session.set("canvasSize", document.documentElement.clientHeight);

    var avatarSize = 105;

    var margin = {
      top: 10,
      right: 10,
      bottom: 10,
      left: 10
    };

    var containerSize = Session.get("canvasSize");
    Session.set("playerRadius", (containerSize  * 0.5) - (avatarSize * 0.8));
    Session.set("centerX", containerSize * 0.5);
    Session.set("centerY", containerSize * 0.5);

    drawingSurface = d3.select("#player-canvas").append("g")
      .attr("id", "players-group")
      .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

    var playersConfig = configPlayers(avatarSize, margin);

    var bullseyePlayersCursor = Meteor.users.find({
      "profile.currentTraining": Session.get("bullseyeCurrentTraining")
    }, {
      fields: {
        profile: 1,
        status: 1
      }
    });

    templateInstance.avatarHandle = bullseyePlayersCursor.observeChanges({
      changed: function(id, fields) {
        if (fields.profile) {
          d3.select("#gid" + id + " use")
            .attr("xlink:href", "/svg/avatars.svg" + fields.profile.avatar);
          // HEADS UP: We need to call 'createPlayersCircle()' here
          // to fix error in Microsoft Edge which resulted in incorrect position
          // and wrong smiley; simply updating 'attr()' does not work.
          createPlayersCircle(configPlayers(avatarSize, margin));
        }
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
          createPlayersCircle(configPlayers(avatarSize, margin));
        }
      },
      removed: function(doc) {
        removeFromPlayers(doc);
        createPlayersCircle(configPlayers(avatarSize, margin));
      }
    });

    // At this point, 'observe' has returned and the initial query results are delivered.
    // So we call '()' with the initial dataset.
    initializing = false;
    createPlayersCircle(configPlayers(avatarSize, margin));

    $(window).resize(function () {
      Session.set("canvasSize", document.documentElement.clientHeight);
      Session.set("playerRadius", (Session.get("canvasSize") * 0.5) - (avatarSize * 0.8));
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
    }); // resize()

    // We need to re-run `createPlayersCircle` if the `presentationMode`
    // field of the bullseye user is changed.
    templateInstance.autorun(function() {
      var bullseyeUser = Meteor.users.find({
        roles: {
          $in: ["view-bullseye"]
        }
      }, {
        fields: {
          "profile.presentationMode": 1
        }
      }).fetch()[0];

      if (bullseyeUser && bullseyeUser.profile) {
        Session.set("presentationMode", bullseyeUser.profile.presentationMode);
        createPlayersCircle(configPlayers(avatarSize, margin));
      }
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
    if (newPlayer.status && newPlayer.status.lastLogin) {
      switch(newPlayer.status.lastLogin.ipAddr) {
        // iPad#1
        case "192.168.1.101":
        case "192.168.1.201":
          newPlayer.fixedRotation = 30;
          break;
        // iPad#2
        case "192.168.1.102":
        case "192.168.1.202":
          newPlayer.fixedRotation = 90;
          break;
        // iPad#3
        case "192.168.1.103":
        case "192.168.1.203":
          newPlayer.fixedRotation = 150;
          break;
        // iPad#4
        case "192.168.1.104":
        case "192.168.1.204":
          newPlayer.fixedRotation = 210;
          break;
        // iPad#5
        case "192.168.1.105":
        case "192.168.1.205":
          newPlayer.fixedRotation = 270;
          break;
        // iPad#6
        case "192.168.1.106":
        case "192.168.1.206":
          newPlayer.fixedRotation = 330;
          break;
        default:
          // ignore
          break;
      }
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
      var diameter = Session.get("canvasSize") ? Session.get("canvasSize") : document.documentElement.clientHeight;
      return diameter * 0.5 - 5;
    },
    cx: function() {
      return Session.get("centerX");
    },
    cy: function() {
      return Session.get("centerY");
    }
  });


  function createPlayersCircle(config) {
    var spacing = 15;
    var players = [];

    // We check for the current presentation mode to differentiate between
    // player positions that are fixed on the Cohesion Table
    // before we populate the players array, which is used for data joins.
    if (Session.equals("presentationMode", "table")) {
      // We filter for players that have a fixed position around the cohesion table.
      var tablePlayers = _.filter(playerList, function(p) {
        return p.fixedRotation;
      });
      tablePlayers.forEach(function(p) {
        p.rotation = p.fixedRotation;
        players.push(p);
      });
    } else if (Session.equals("presentationMode", "projector")) {
      // Depending on the number of players, we calculate a rotation
      // angle to allow for correct radial positioning of each player.
      var theta = 360 / playerList.length;
      playerList.forEach(function(p, i, list) {
        p.rotation = i * theta;
        players.push(p);
      });
    }

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
      .attr("class", "bullseye-player");

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
      .attr("class", "player-label")
      .attr("text-anchor", "middle")
      // We position the text above the player avatar
      .attr("transform", function(d) {
        return "translate(0," + (-config.size * 0.5 + spacing) + ")";
      })
      .style("fill", "currentColor")
      .text(function(d) {
        return d.profile.name;
      });

    // Finally, we take the selection of all elements (i.e. entering and
    // already existing elements) to set the `transform` attribute in order
    // to move the elements to their intended position.
    playerElements.attr("transform", function(d, i) {
      // We translate each player to the center, then rotate each by
      // its specific rotation value, then translate by the radius it along the y-axis.
      return "translate(" + (config.centerX ) + "," + (config.centerY) + ")" +
        "rotate(" + d.rotation + ")" +
        "translate(0," + (-config.radius) + ")";
    });
  } // createPlayersCircle


  // We need to stop observing our live queries when this template is
  // removed from the DOM.
  Template.bullseyePlayers.onDestroyed(function() {
    var templateInstance = this;
    if (templateInstance.playerHandle) {
      templateInstance.playerHandle.stop();
    }
    if (templateInstance.avatarHandle) {
      templateInstance.avatarHandle.stop();
    }
  }); // onDestroyed

}()); // end function closure
