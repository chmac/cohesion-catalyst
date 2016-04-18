Router.route("/trainings", {
  name: "trainingsList",
  waitOn: function() {
    return Meteor.subscribe("listOfTrainings");
  }
});

Router.route("/trainings/new", {
  name: "trainingNew",
  waitOn: function() {
    return Meteor.subscribe("listOfTrainings");
  }
});

Router.route("/trainings/:_id/edit", {
  name: "trainingEdit",
  waitOn: function() {
    return Meteor.subscribe("singleTraining", this.params._id);
  },
  data: function() {
    return {
      training: Trainings.findOne({_id: this.params._id})
    };
  }
});
