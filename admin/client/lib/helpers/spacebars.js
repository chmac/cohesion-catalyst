/**
 * Global template helper functions to be used in multiple templates.
 */

Template.registerHelper("isAdmin", function(userId) {
  return Roles.userIsInRole(userId, "admin");
});

Template.registerHelper("isBullseyeViewer", function(userId) {
  return Roles.userIsInRole(userId, "view-bullseye");
});

Template.registerHelper("avatarOptions", function() {
  return [
    {label: "Wink", value: "#smiley-wink"},
    {label: "Chuckle", value: "#smiley-chuckle"},
    {label: "Smirk", value: "#smiley-smirk"},
    {label: "LOL", value: "#smiley-lol"},
    {label: "Smile", value: "#smiley-smile"},
    {label: "Nerd", value: "#smiley-nerd"},
    {label: "Star", value: "#smiley-star"},
    {label: "Heart", value: "#smiley-heart"},
    {label: "Cool", value: "#smiley-cool"}
  ];
});

Template.registerHelper("trainingOptions", function() {
  return Trainings.find().map(function(training) {
    return {
      label: training.title + " - " + moment(training.date).format("MMMM Do YYYY") + " (ID: " + training._id + ")",
      value: training._id
    };
  });
});

Template.registerHelper("currentTraining", function() {
  var currentTraining = Trainings.findOne({isCurrentTraining: true});
  return currentTraining && currentTraining._id;
});

Template.registerHelper("isCurrentTraining", function(id) {
  var training = Trainings.findOne({_id: id});
  return training && training.isCurrentTraining;
});

Template.registerHelper("userIsBlocked", function(id) {
  var user = Meteor.users.findOne({_id: id});
  return user && user.blocked;
});
