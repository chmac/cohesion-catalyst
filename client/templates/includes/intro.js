Template.intro.onRendered(function() {

  if (!d3.select(".selected-avatar").empty()) {
    Meteor.defer(function () {
      scaleElement(d3.select(".selected-avatar").node(), 1.5, 0);
    });
  }

  d3.selectAll(".avatar")
    .on("mouseover", function() {
      d3.event.stopPropagation();
      if (!d3.select(this).classed("selected-avatar")) {
        scaleElement(d3.select(this).node(), 1.5, 250);
      }
    })
    .on("mouseout", function() {
      if (!d3.select(this).classed("selected-avatar")) {
        scaleElement(d3.select(this).node(), 1, 250);
      }
    })
    .on("click", function() {
      var self,
        userId,
        avatarId;

      self = this;
      d3.event.preventDefault();
      d3.event.stopPropagation();

      // Get the current user id.
      userId = Meteor.userId();
      // Extract the id attribute of the clicked smiley icon.
      avatarId = selectAvatar(self);
      if (avatarId) {
        // Update the user profile with the currently selected smiley avatar.
        Meteor.users.update({_id:userId},
          {$set:{"profile.avatar": avatarId}},
          function(error, i) {
            if (error) {
              return throwError("Error: " + error.reason);
            }
            // On success:
            // Scale-up the selected smiley while re-scaling the deselected one.
            d3.select(self).classed("selectable", false);
            d3.selectAll(".selectable").each(function() {
              scaleElement(d3.select(this).node(), 1, 250);
            });
            scaleElement(d3.select(self).node(), 1.5, 250);
            // Router.go("myIds");
        });
      }
      return false;
    });

    /**
     * Selects the avatar icon the user clicks on.
     * We use this function to find and extract the 'id' of the icon
     * to allow for setting this value in the 'profile.avatar' field
     * of the user collection.
     * @param {object} target The clicked avatar icon (a DOM node).
     * @returns {string} The extracted 'id' value .
     */
    function selectAvatar(target) {
      return matchText(d3.select(target).select("use").attr("href"));
    }

    /**
     * Scales an SVG element up or back to the default size, respectively.
     * The scaling is initiated from user interaction.
     * @param {object} target The target DOM node of the user interaction.
     * @param {number} factor The specified factor to scale the SVG element.
     * @param {number} time The duration of the scaling transition.
     */
    function scaleElement(target, factor, time) {
      var avatar,
        boundingBox,
        x,
        y,
        transformOriginX,
        transformOriginY;

      avatar = d3.select(target).select("use");

      // Retrieve the bounding box object of the SVG <use> element
      // referencing the avatar symbol.
      boundingBox = avatar.node().getBBox();

      // Here D3's 'attr()' function returns the value of as 'string'
      // so we need to type-convert string to number using the '+' operator.
      x = +avatar.attr("x");
      y = +avatar.attr("y");

      // Calculate the desired transform origin.
      transformOriginX = boundingBox.x + x + boundingBox.width / 2;
      transformOriginY = boundingBox.y + y + boundingBox.height / 2;
      // console.log("x: " + x + ", y: "  + y );
      // console.log("boundingBox: ", boundingBox);
      // console.log("transXx " + transformOriginX + ", transYy: "  + transformOriginY );
      avatar.transition()
        .duration(time)
        .attr("transform",
        "translate(" + (transformOriginX) + "," + (transformOriginY) +
        ") scale(" + factor +
        ") translate(" + (-transformOriginX) + "," + (-transformOriginY) + ")" );
    }
});


Template.intro.helpers({
  avatars: function() {
    return Avatars.find();
  },
  selectedAvatarClass: function() {
    var avatarId,
      avatarSelected;

    avatarId = matchText(this.url);
    avatarSelected = Meteor.user().profile.avatar === avatarId;
    if (avatarSelected) {
      return "selected-avatar";
    } else {
     return "selectable";
   }
  }
});


/**
 * Matches a text against a RegExp pattern starting with '#' character.
 * This function is used to extract the 'id' of the SVG symbol.
 * We use the String.match() function to find regular-expression matches.
 * The 0th element of the result array contains the matched text.
 * @param {string} text The text to match against the RegExp.
 * @returns {string} The matched text.
 */
function matchText(text) {
  var pattern,
    result;
  pattern = /#[a-z\d][\w-]*/ig;
  result = text.match(pattern);
  if (result !== null) {
    return result[0];
  }
}
