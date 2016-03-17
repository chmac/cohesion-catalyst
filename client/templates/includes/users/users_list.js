Template.usersList.helpers({
  users: function() {
    return Meteor.users.find();
  }
});





Template.userBlockCell.onRendered(function() {
  var templateInstance = this;
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
