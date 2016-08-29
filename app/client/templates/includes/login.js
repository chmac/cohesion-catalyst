/**
 * Forms for logging into or creating an account for the application.
 *
 * Helper functions and application logic to be executed within the templates.
 *
 * Adapted and modified from the following examples:
 * - http://blog.benmcmahen.com/post/41741539120/building-a-customized-accounts-ui-for-meteor [as of 2015-05-04]
 * - Greif S., Coleman T.: Discover Meteor.
 */


Template.loginForm.onCreated(function() {
  Session.set("displayErrorMessage", {});
});

Template.loginForm.helpers({
  errorMessage: function(field) {
    return Session.get("displayErrorMessage")[field];
  },
  errorClass: function(field) {
    return !!Session.get("displayErrorMessage")[field] ? "has-error" : "";
  },
  trainings: function() {
    return Trainings.find({
      isCurrentTraining: true
    });
  },
  trainingDate: function() {
    return moment(this.date).format("MMM D YYYY, HH:mm");

  }
});

Template.loginForm.events({
  // We want to listen for the 'submit' event of the <form> to enable a user
  // to submit the form via 'Enter' key besides using the 'Submit' button.
  "submit #login-form": function(event, template) {
    var username,
      password,
      trainingId;

    event.preventDefault();

    username = trimInput(template.find("#login-username").value);
    password = template.find("#login-password").value;
    trainingId = template.find("#login-training-select option:selected").id;

    if (!isEmpty(username) && !isEmpty(password)) {
      // For normal users, we append the ID of the current training to their username.
      //
      // The Meteor.loginWithPassword() function is provided by the 'accounts-password' package.
      Meteor.loginWithPassword(username + "_" + trainingId, password, function(error) {
        if (error) {
          // Let the user know that the login failed, e.g. if a user could
          // not be found or if the user entered an incorrect password.
          return throwError("Login Error: " + error.reason);
        }
        // Update the user's profile with the currently selected training.
        // We will use that field to define publications and subscriptions, respectively.
        var userId = Meteor.userId();
        Meteor.users.update({_id:userId},
          {$set:{"profile.currentTraining": trainingId}},
          function(error, i) {
            if (error) {
              return throwError("Error: " + error.reason);
            }
        });

        // Hide the modal dialog after successful login.
        Modal.hide();

        if (Meteor.user().profile.avatar) {
          Router.go("myIds");
        } else {
          Router.go("intro");
        }
      });
    }
  }
});


Template.createAccountForm.onCreated(function() {
  Session.set("displayErrorMessage", {});
});

Template.createAccountForm.helpers({
  errorMessage: function(field) {
    return Session.get("displayErrorMessage")[field];
  },
  errorClass: function(field) {
    return !!Session.get("displayErrorMessage")[field] ? "has-error" : "";
  },
  trainings: function() {
    return Trainings.find({
      isCurrentTraining: true
    });
  },
  trainingDate: function() {
    // 'trainingDate' is used within the {{#each traingings}} block
    // so 'this' is the currently evaluated training.
    return moment(this.date).format("MMM D YYYY, HH:mm");

  }
});

Template.createAccountForm.events({
  // We want to listen for the 'submit' event of the <form> to enable a user
  // to submit the form via 'Enter' key besides using the 'Submit' button.
  "submit #create-account-form": function(event, template) {
    var username,
      password,
      training,
      trainingId
      ;

    event.preventDefault();

    username = trimInput(template.find("#account-username").value);
    password = template.find("#account-password").value;
    training = template.find("#account-training-select option").value;
    trainingId = template.find("#account-training-select option:selected").id;

    if (!isEmpty(username) &&
      !isEmpty(password) &&
      isValidUsername(username) &&
      isValidPassword(password)) {
        var newUser = {
          username: username + "_" + trainingId,
          password: password,
          profile: {
            name: username,
            avatar: "#smiley-smile", // default avatar
            currentTraining: trainingId
          }
        };

        // Debug helper
        var m1 = {};
        m1.date = new Date();
        m1.locus = "CLIENT: submitting create account form.";
        m1.info = "Calling makeNewUser: " + newUser.username;
        var t1 = performance.now();
        DebugMessages.insert(m1);

        var handleUserWasCreated = function(error, result) {
          DBG_wasCalled = true;

          if (error) {

            // Debug helper
            var m = {};
            m.date = new Date();
            m.locus = "CLIENT: submitting create account form.";
            m.info = "Error " + error.reason + "while creating account for " + newUser.username;
            DebugMessages.insert(m);

            return throwError("Error while creating account: " + error.reason);
          }


          // Debug helper
          var t2 = performance.now();
          var m2 = {};
          m2.date = new Date();
          m2.locus = "CLIENT: submitting create account form.";
          m2.info = "Calling Meteor.loginWithPassword: " + newUser.username + " after ms " + (t2-t1);
          DebugMessages.insert(m2);

          // On success, log the user in with their credentials.
          Meteor.loginWithPassword(newUser.username, newUser.password, function(error) {
            if (error) {
              // Let the user know that the login failed, e.g. if a user could
              // not be found or if the user entered an incorrect password.
              return throwError("Login Error: " + error.reason);
            }

            // Debug helper
            var t3 = performance.now();
            var m3 = {};
            m3.date = new Date();
            m3.locus = "CLIENT: submitting create account form.";
            m3.info = "Login done: " + newUser.username + " after ms " + (t3-t2);
            DebugMessages.insert(m3);

            // Hide the modal dialog after successful sign up.
            Modal.hide();
            Router.go("intro");
          });
        };

        var DBG_wasCalled = false;
        var DBG_checkCall = function() {
          var m = {};
          if(DBG_wasCalled) {
            m = {};
            m.date = new Date();
            m.locus = "CLIENT: DBG_checkCall";
            m.info = "callback was called, no bug here :-)";
            DebugMessages.insert(m);
          } else {
            m = {};
            m.date = new Date();
            m.locus = "CLIENT: DBG_checkCall";
            m.info = " callback handleUserWasCreated not called atfer 1s.";
            DebugMessages.insert(m);
            // try to call callback manually
            chkUser = Meteor.users.findOne({username: newUser.username});
            if(chkUser) {
              m = {};
              m.date = new Date();
              m.locus = "CLIENT: DBG_checkCall";
              m.info = " user " + chkUser.username + " was created, calling handleUserWasCreated manually";
              DebugMessages.insert(m);
              // try manually
              handleUserWasCreated(null,null);
            } else {
              m = {};
              m.date = new Date();
              m.locus = "CLIENT: DBG_checkCall";
              m.info = " user " + chkUser.username + " was not created - giving up?";
              DebugMessages.insert(m);
            }
          }
        };

        // chasing the mythical "func not always called" problem
        Meteor.setTimeout(DBG_checkCall, 2000);

        // Call method to create user on the server
        // cf. https://gist.github.com/themeteorchef/b8b30db0f08c5b818448
        Meteor.call("makeNewUser", newUser, handleUserWasCreated);

    }
  }
});

// Helper function to check if the user entered a name of at least 3 characters.
function isValidUsername(input) {
  if (input.length >= 3) {
    return true;
  } else {
    Session.set("displayErrorMessage", {
      username: "Your name should be at least 3 characters long."
    });
    return false;
  }
}

// Helper function to check if the user entered a password of at least 6 characters.
function isValidPassword(input) {
  if (input.length >= 6) {
    return true;
  } else {
    Session.set("displayErrorMessage", {
      password: "Your password should be at least 6 characters long."
    });
    return false;
  }
}

// Helper function to check if the input value is empty.
function isEmpty(input) {
  if (!input || input === "") {
    Session.set("displayErrorMessage", {
      username: "Please do not leave this field empty.",
      password: "Please do not leave this field empty."
    });
    return true;
  } else {
    return false;
  }
}
