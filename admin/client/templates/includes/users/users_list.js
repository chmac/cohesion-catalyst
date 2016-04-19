Template.usersList.helpers({
  users: function() {
    return Meteor.users.find();
  }
});



// ------------------------------------------------------------------------ //
// userBlockCell
// A subtemplate to be included within 'usersList' template.
// ------------------------------------------------------------------------ //

Template.userBlockCell.events({
  "click .user-block-button": function(event, template) {
    Meteor.call("users.toggle.blocked", this._id, function(error, result) {
      // error identification
      if (error) {
        switch(error.error) {
          case "users.toggle.blocked.not-authorized":
            sAlert.error("You need to have admin rights to block or unblock a user.");
            break;
          case "users.toggle.blocked.not-found":
            sAlert.error("This user record does not exist.");
            break;
          default:
            sAlert.error("An unexpected error occured: ", error.reason);
        }
      } else {
        // successfully blocked user
        sAlert.success("User record has successfully been updated.");
      }
    });
  }
});



// ------------------------------------------------------------------------ //
// userDeleteCell
// A subtemplate to be included within 'usersList' template.
// ------------------------------------------------------------------------ //

Template.userDeleteCell.events({
  "click .user-delete-button": function(event, template) {
    event.preventDefault();
    Session.set("userToDeleteName", this.profile.name);
    Session.set("userToDeleteID", this._id);
    $(".ui.modal").modal("show");
  }
});



// ------------------------------------------------------------------------ //
// userDeleteApproveModal
// A subtemplate to be included within 'usersList' template.
// ------------------------------------------------------------------------ //

Template.userDeleteApproveModal.onRendered(function() {
  // Initialize Semantic UI modal behavior with settings.
  $(".ui.modal").modal({
    duration: 250,
    closable: false,
    onHidden: function() {
      Session.set("userToDeleteName", null);
      Session.set("userToDeleteID", null);
    },
    onApprove: function() {
      Meteor.call("users.remove", Session.get("userToDeleteID"), function(error, result) {
        // error identification
        if (error) {
          switch(error.error) {
            case "users.remove.not-authorized":
              sAlert.error("You need to have admin rights to delete a user.");
              break;
            case "users.remove.not-allowed":
              sAlert.error("You are not allowed to delete your own account.");
              break;
            default:
              sAlert.error("Unauthorized action.");
          }
        } else {
          // successfully removed user
          sAlert.success("User has successully been removed.");
        }
      });
    }
  });
});

Template.userDeleteApproveModal.helpers({
  username: function() {
    return Session.get("userToDeleteName");
  }
});
