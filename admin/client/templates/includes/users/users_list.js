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
    console.log("this._id ", this._id);
    console.log("this.profile.name ", this.profile.name);
    $(".ui.basic.modal").modal("show");
  }
});



// ------------------------------------------------------------------------ //
// userDeleteApproveModal
// A subtemplate to be included within 'usersList' template.
// ------------------------------------------------------------------------ //

Template.userDeleteApproveModal.onRendered(function() {
  $(".ui.basic.modal").modal({
    closable: false,
    onDeny: function() {
      console.log("Cancelled!");
    },
    onHidden: function() {
      Session.set("userToDeleteName", null);
      Session.set("userToDeleteID", null);
    },
    onApprove: function() {
      // TODO call method to delete document
      console.log("Approved!");
    }
  });
});

Template.userDeleteApproveModal.helpers({
  username: function() {
    return Session.get("userToDeleteName");
  }
});
