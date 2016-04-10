/**
 * Global template helper functions to be used in multiple templates.
 */

Template.registerHelper("isAdmin", function(userId) {
  return Roles.userIsInRole(userId, "admin");
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
