Template.myIds.helpers({
  avatarId: function() {
    return Meteor.user().profile.avatar;
  }
});
