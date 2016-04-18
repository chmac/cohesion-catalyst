Template.trainingNew.events({
  "click .training-create-default": function(event,template) {
    var targetCurrentTrainingId = event.target.dataset.currentTraining;
    Meteor.call("training.create.default", targetCurrentTrainingId,
      function(error, result) {
        if (error) {
          if (error.error === "training.create.default.not-authorized") {
            sAlert.error("You need to have admin rights to create a new training.");
          } else {
            sAlert.error("An error occured: ", error.reason);
          }
        } else {
          sAlert.success("New training successfully created", {onRouteClose:false});
          Router.go("/trainings");
        }
    });
  }
});
