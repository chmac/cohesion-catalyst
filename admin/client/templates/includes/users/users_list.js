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
