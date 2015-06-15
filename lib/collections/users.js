Meteor.users.allow({
  update: function (userId, doc, fields, modifier) {
    // TODO Maybe define more stringent permission rules
    return userId;
  }
});
