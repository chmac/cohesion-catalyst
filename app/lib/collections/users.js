/**
 * The schema for the 'Meteor.users' collection is defined
 * within the private package coca:common which is shared between
 * this project and the admin app project.
 */

Meteor.users.allow({
  update: function (userId, doc, fields, modifier) {
    // TODO Maybe define more stringent permission rules
    return userId;
  }
});
