Template.userEdit.helpers({
  userEditIsInRole: function(userId, roleName) {
    return Roles.userIsInRole(userId, roleName);
  }
});

Template.userEdit.events({
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
