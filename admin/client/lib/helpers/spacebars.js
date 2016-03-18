/**
 * Global template helper functions to be used in multiple templates.
 */

Template.registerHelper("isAdmin", function(userId) {
  return Roles.userIsInRole(userId, "admin");
});
