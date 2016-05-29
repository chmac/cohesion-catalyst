Template.intro.onRendered(function() {

  // We prevent the screen scrolling on touch devices
  d3.select(".avatar-container").on("touchmove", function() {
    if (d3.event) {
      d3.event.preventDefault();
    }
  });

  d3.selectAll(".avatar")
    // .on("mouseover", function() {
    //   d3.event.stopPropagation();
    //   if (!d3.select(this).classed("selected-avatar")) {
    //     scaleElement(d3.select(this).node(), 1.5, 250);
    //   }
    // })
    // .on("mouseout", function() {
    //   if (!d3.select(this).classed("selected-avatar")) {
    //     scaleElement(d3.select(this).node(), 1, 250);
    //   }
    // })
    .on("click", function() {
      d3.event.preventDefault();
      var self,
        userId,
        avatarId;

      self = this;

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
            // After successful smiley selection, redirect to the 'my IDs' view.
            // TODO Improve redirection and make it a smooth and nicely animated view transition
            // Router.go("myIds");
        });
      }
      d3.event.stopPropagation();
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

}); // onRendered


Template.intro.helpers({
  avatars: function() {
    return Avatars.find();
  },
  alignAvatar: function(pos) {
    if (pos > 0 && pos < 400) {
      return pos - 40;
    } else if (pos > 200 ){
      return pos - 80;
    } else {
      return pos;
    }
  },
  selectedAvatarClass: function(avatar) {
    var avatarId,
      avatarSelected;

    avatarId = matchText(avatar.url);
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
