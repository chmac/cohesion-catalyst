Template.errors.helpers({
  errors: function() {
    return Errors.find();
  }
});

// The 'rendered' callback triggers once the template has been rendered in the browser.
// Inside the callback, 'this' refers to the current template instance. To access the data
// of the object that is currently being rendered (here: an error) we use 'this.data'.
// cf. Greif S., Coleman T.: Discover Meteor. Page 154.
Template.error.rendered = function() {
  var error = this.data;
  Meteor.setTimeout(function() {
    Errors.remove(error._id);
  }, 4000);
};
