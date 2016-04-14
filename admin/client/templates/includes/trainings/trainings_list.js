Template.trainingsList.events({
  "click .training-delete-button": function(event, template) {
    event.preventDefault();
    Session.set("trainingToDeleteTitle", this.title);
    Session.set("trainingToDeleteDate", this.date.toDateString());
    Session.set("trainingToDeleteID", this._id);
    $(".ui.modal").modal("show");
  }
});

// ------------------------------------------------------------------------ //
// trainingDeleteApproveModal
// A subtemplate to be included within 'trainingsList' template.
// ------------------------------------------------------------------------ //

Template.trainingDeleteApproveModal.onRendered(function() {
  // Initialize Semantic UI modal behavior with settings.
  $(".ui.modal").modal({
    duration: 250,
    closable: false,
    onHidden: function() {
      Session.set("trainingToDeleteTitle", null);
      Session.set("trainingToDeleteDate", null);
      Session.set("trainingToDeleteID", null);
    },
    onApprove: function() {
      Meteor.call("trainings.remove", Session.get("trainingToDeleteID"), function(error, result) {
        // error identification
        if (error) {
          switch(error.error) {
            case "trainings.remove.not-authorized":
              sAlert.error("You need to have admin rights to delete a training.");
              break;
            case "trainings.remove.not-allowed":
              sAlert.error("You are not allowed to delete an active training.");
              break;
            default:
              sAlert.error("An unexpected error occured: ", error.reason);
          }
        } else {
          // successfully removed training
          sAlert.success("Training has successully been removed.");
        }
      });
    }
  });
});

Template.trainingDeleteApproveModal.helpers({
  training: function() {
    return {
      title: Session.get("trainingToDeleteTitle"),
      date: Session.get("trainingToDeleteDate")
    };
  }
});
