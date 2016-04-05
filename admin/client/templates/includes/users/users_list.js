Template.usersList.helpers({
  users: function() {
    return Meteor.users.find();
  }
});



// ------------------------------------------------------------------------ //
// userBlockCell
// A subtemplate to be included within 'usersList' template.
// ------------------------------------------------------------------------ //

Template.userBlockCell.onRendered(function() {
  // Initialize Semantic UI checkbox behavior
  $(".ui.checkbox").checkbox();
});

Template.userBlockCell.events({
  "change .ui.checkbox": function(event, template) {
    if (template.$(event.currentTarget).hasClass("checked")) {
      console.log("********* Block user");
      console.log("this._id ", this._id);
      console.log("this.profile.name ", this.profile.name);
    } else {
      console.log("********* Unblock user");
      console.log("this._id ", this._id);
      console.log("this.profile.name ", this.profile.name);
    }
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
          // successully removed user
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
