Template.intro.events({
  "mouseenter .avatar": function(event) {
    scaleElement(event.target, 1.3);
  },
  "mouseleave .avatar": function(event) {
    scaleElement(event.target, 1);
  },
  "click .avatar": function(event) {
    var userId,
      avatar;

    event.preventDefault();

    userId = Meteor.userId();
    avatar = selectAvatar(event.target);
    if (avatar) {
      Meteor.users.update({_id:userId},
        {$set:{"profile.avatar": avatar}},
        function(error, i) {
          if (error) {
            return throwError("Error: " + error.reason);
          }
          // TODO: go to myIDs page and show the selected avatar
        });
    }
    return false;
  }
});

function selectAvatar(target) {
  var pattern;

  // RegExp to match text against a pattern starting with '#' character
  // in order to extract the 'id' of the SVG symbol.
  pattern = /#[a-z\d][\w-]*/ig;
  return d3.select(target).attr("href").match(pattern)[0];
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
