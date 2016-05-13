Template.registerHelper("currentViewIs", function(currentView) {
  var bullseyeUser = Meteor.users.findOne({
    roles: {
      $in: ["view-bullseye"]
    }
  });
  return bullseyeUser && bullseyeUser.profile.currentView === currentView;
});
