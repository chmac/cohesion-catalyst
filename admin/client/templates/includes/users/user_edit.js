Template.userEdit.helpers({
  userEditIsInRole: function(userId, roleName) {
    return Roles.userIsInRole(userId, roleName);
  },
  currentTrainingInfo: function(trainingId) {
    var training = Trainings.findOne(trainingId);
    return training.title + " - " +
      moment(training.date).format("MMMM Do YYYY") + " - " +
      training._id;
  }
});

Template.userEdit.events({
  "click .user-edit-reset": function(event, template) {
    var targetUserId = event.target.dataset.userId;
    Meteor.call("user.edit.reset", targetUserId, function(error, result) {
      if (error) {
        if (error.error === "user.edit.reset.not-authorized") {
          sAlert.error("You need to have admin rights to reset.");
        } else {
          sAlert.error("An unexpected error occured: ", error.reason);
        }
      } else {
        sAlert.success("Identifications successfully reset.");
      }
    });
  },
  "click .user-edit-add-role": function(event, template) {
    var roleName = event.target.dataset.roleName;
    var targetUserId = event.target.dataset.userId;
    Meteor.call("user.edit.add.role", targetUserId, roleName, function(error, result) {
      if (error) {
        if (error.error === "user.edit.add.role.not-authorized") {
          sAlert.error("You need to have admin rights to add a role to a user.");
        } else {
          sAlert.error("An unexpected error occured: ", error.reason);
        }
      } else {
        sAlert.success("User role successfully added.");
      }
    });
  },
  "click .user-edit-remove-role": function(event, template) {
    var roleName = event.target.dataset.roleName;
    var targetUserId = event.target.dataset.userId;
    Meteor.call("user.edit.remove.role", targetUserId, roleName, function(error, result) {
      if (error) {
        if (error.error === "user.edit.remove.role.not-authorized") {
          sAlert.error("You need to have admin rights to remove a role from a user.");
        } else {
          sAlert.error("An unexpected error occured: ", error.reason);
        }
      } else {
        sAlert.success("User role successfully removed");
      }
    });
  }
});
