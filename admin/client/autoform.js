// We define our client-side hooks and callbacks.
// cf. [as of 2016-04-08] https://github.com/aldeed/meteor-autoform/#callbackshooks
AutoForm.addHooks([
  "user-update",
  "user-change-password",
  "user-create-normal",
  "user-create-admin"
], {
  beginSubmit: function() {
    $(".ui.button").addClass("disabled");
  },
  endSubmit: function() {
    $(".ui.button").removeClass("disabled");
  },
  onError: function(formType, error) {
    sAlert.error(error.message);
  }
});

AutoForm.addHooks([
  "user-create-normal",
  "user-create-admin"
], {
  onSuccess: function() {
    sAlert.success("New user successfully created.", {onRouteClose:false});
    Router.go("/users");
  }
});

AutoForm.hooks({
  "user-change-password": {
    onSuccess: function(formType, result) {
      sAlert.success("Password successfully changed.");
    }
  },
  "user-update": {
    onSuccess: function(formType, result) {
      sAlert.success("User data successfully upddated.", {onRouteClose: false});
      Router.go("/users");
    }
  }
});
