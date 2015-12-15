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
  loginForm: function() {
    return Session.equals("formContainer", "loginForm");
  },
  createAccount: function() {
    return Session.equals("formContainer", "createAccountForm");
  },
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
    return this.date.toDateString();

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
      // If users are admins, they will log in with their email addresses. This allows
      // to distinguish between admin users and normal users.
      //
      // The Meteor.loginWithPassword() function is provided by the 'accounts-password' package.
      if (testForEmail(username)) {
        Meteor.loginWithPassword(username, password, function(error) {
          if (error) {
            // Let the user know that the login failed, e.g. if a user could
            // not be found or if the user entered an incorrect password.
            return throwError("Login Error: " + error.reason);
          }
          // Update the user's profile with the currently selected training.
          // We will use that field to define publications and subscriptions, respectively.
          var userId = Meteor.userId();
          if (Roles.userIsInRole(userId, "admin")) {
            console.log("User is admin");
            Session.set("formContainer", null);
            Router.go("/admin");
          }
        });
      } else {
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
          Session.set("formContainer", null);
          if (Meteor.user().profile.avatar) {
            Router.go("myIds");
          } else {
            Router.go("intro");
          }
        });
      }
    }
  },
  "click #create-account-link": function(event, template) {
    event.preventDefault();
    // Use the global Session object to specify the current form to display.
    Session.set("formContainer", "createAccountForm");

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
    return this.date.toDateString();

  }
});

Template.createAccountForm.events({
  // We want to listen for the 'submit' event of the <form> to enable a user
  // to submit the form via 'Enter' key besides using the 'Submit' button.
  "submit #create-account-form": function(event, template) {
    var username,
      password,
      training,
      trainingId,
      trainings = []
      ;

    event.preventDefault();

    username = trimInput(template.find("#account-username").value);
    password = template.find("#account-password").value;
    training = template.find("#account-training-select option").value;
    trainingId = template.find("#account-training-select option:selected").id;
    trainings.push({
      trainingId: trainingId,
      titleDate: training
    });

    if (!isEmpty(username) &&
      !isEmpty(password) &&
      isValidUsername(username) &&
      isValidPassword(password)) {
        // The Accounts.createUser() function is provided by the 'accounts-password' package.
        Accounts.createUser({
          username: username + "_" + trainingId,
          password: password,
          profile: {
            name: username,
            avatar: null,
            currentTraining: trainingId
          },
          trainings: trainings
        }, function(error) {
          if (error) {
            // Let the user know that the creation of an account failed.
            return throwError("Error while creating account: " + error.reason);
          }
          Session.set("formContainer", null);
          Router.go("intro");
        });
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

// Helper function to remove whitespace before and after the input value.
// cf. http://blog.benmcmahen.com/post/41741539120/building-a-customized-accounts-ui-for-meteor
function trimInput(input) {
  return input.replace(/^\s*|\s*$/g, "");
}


// Simple helper function to check for an email address.
// Note that this does not serve as real validation.
// Borrowed from this SO discussion:
// [as of 2015-12-14] http://stackoverflow.com/questions/46155/validate-email-address-in-javascript
function testForEmail(input) {
  var pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(input);
}
