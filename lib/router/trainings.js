Router.route("/trainings", {
  name: "trainingsList",
  waitOn: function() {
    return Meteor.subscribe("trainings");
  }
});
