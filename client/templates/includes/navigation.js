Template.navigation.events({
  "click .logout": function(event) {
    event.preventDefault();
    // The Meteor.logout() function is provided by the 'accounts-password' package.
    Meteor.logout();
  }

});
