Template.trainingEdit.events({
  "click .training-edit-change-current": function(event, template) {
    var targetTrainingId = event.target.dataset.trainingId;
    var targetCurrentTraining = event.target.dataset.currentTraining;

    Meteor.call("training.edit.change.current", targetTrainingId, targetCurrentTraining,
      function(error, result) {
        if (error) {
          if (error.error === "training.edit.change.current.not-authorized") {
            sAlert.error("You need to have admin rights to change the current training.");
          } else {
            sAlert.error("An error occured: ", error.reason);
          }
        } else {
          sAlert.success("Training successfully changed.", {onRouteClose: false});
          Router.go("/trainings");
        }
    });
  }
 });
