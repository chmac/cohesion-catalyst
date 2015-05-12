Template.intro.helpers({
  avatars: function() {
    return Avatars.find();
  },
  selectedAvatarClass: function() {
    var avatarId = matchText(this.url);
    return Meteor.user().profile.avatar === avatarId ? "selectedAvatar" : "";
  }
});

Template.intro.events({
  "mouseenter .avatar": function(event) {
    if (!d3.select(event.currentTarget).classed("selectedAvatar")) {
      scaleElement(event.target, 1.3);
    }
  },
  "mouseleave .avatar": function(event) {
    if (!d3.select(event.currentTarget).classed("selectedAvatar")) {
      scaleElement(event.target, 1);
    }
  },
  "click .avatar": function(event) {
    var userId,
      avatarId;

    event.preventDefault();

    userId = Meteor.userId();
    avatarId = selectAvatar(event.target);
    if (avatarId) {
      Meteor.users.update({_id:userId},
        {$set:{"profile.avatar": avatarId}},
        function(error, i) {
          if (error) {
            return throwError("Error: " + error.reason);
          }
          // d3.select(event.currentTarget).classed("selectedAvatar", true);
          scaleElement(event.currentTarget, 1.3);
          // Router.go("myIds");
        });
    }
    return false;
  }
});

function matchText(text) {
  var pattern;

  // RegExp to match text against a pattern starting with '#' character
  // in order to extract the 'id' of the SVG symbol.
  pattern = /#[a-z\d][\w-]*/ig;
  return text.match(pattern)[0];
}

function selectAvatar(target) {
  return matchText( d3.select(target).attr("href"));
}

function scaleElement(target, factor) {
  var avatar,
    dimensions,
    x,
    y,
    transformOriginX,
    transformOriginY;

  avatar = d3.select(target).select("use");
  dimensions = avatar.node().getBoundingClientRect();
  // Here D3's 'attr()' function returns the value of as 'string'
  // so we need to type-convert string to number using the '+' operator.
  x = +avatar.attr("x");
  y = +avatar.attr("y");
  transformOriginX = x + dimensions.width / 2;
  transformOriginY = y + dimensions.height / 2;
  avatar.transition()
    .attr("transform",
    "translate(" + (transformOriginX) + "," + (transformOriginY) +
    ") scale(" + factor +
    ") translate(" + (-transformOriginX) + "," + (-transformOriginY) + ")" );
}
