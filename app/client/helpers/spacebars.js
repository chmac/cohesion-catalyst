Template.registerHelper("currentViewIs", function(currentView) {
  var bullseyeUser = Meteor.users.findOne({
    roles: {
      $in: ["view-bullseye"]
    }
  });
  return bullseyeUser && bullseyeUser.profile.currentView === currentView;
});

Template.registerHelper("viewportSize", function() {
  return Session.get("canvasSize") ? Session.get("canvasSize") : document.documentElement.clientHeight;
});
