Template.registerHelper("showDebugHelper", function() {
    return Session.get("debugHelperVisible");
});

Template.registerHelper("username", function() {
  return Meteor.user() && Meteor.user().profile.name;
});

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


Template.registerHelper("isAutoMode", function() {
  var bullseyeUser = Meteor.users.findOne({
    roles: {
      $in: ["view-bullseye"]
    }
  });
  return bullseyeUser && bullseyeUser.profile.autoMode;
});

// Helper to switch away from 'splash' view if in 'automode'.
Template.registerHelper("trigger", function() {
  var bullseyeUser = Meteor.users.findOne({
    roles: {
      $in: ["view-bullseye"]
    }
  });

  var reflectTrigger = bullseyeUser && bullseyeUser.profile.reflectTrigger;
  var matchTrigger = bullseyeUser && bullseyeUser.profile.matchTrigger;

  return Session.get("countMatches") >= matchTrigger || Session.get("countIds") >= reflectTrigger;
});

// Helper to detect which indicator to show if in 'automode'.
Template.registerHelper("triggerIs", function(trigger) {
  var bullseyeUser = Meteor.users.findOne({
    roles: {
      $in: ["view-bullseye"]
    }
  });

  var reflectTrigger = bullseyeUser && bullseyeUser.profile.reflectTrigger;
  var matchTrigger = bullseyeUser && bullseyeUser.profile.matchTrigger;

  if (Session.get("countMatches") >= matchTrigger) {
    return trigger === "match" && "match";
  }

  if (Session.get("countIds") >= reflectTrigger) {
    return trigger === "reflect" && "reflect";
  }

  return;

});
