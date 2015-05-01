Template.loginForm.helpers({
  loginForm: function() {
    return Session.equals("formContainer", "loginForm");
  },
  createAccount: function() {
    return Session.equals("formContainer", "createAccountForm");
  }
});

Template.loginForm.events({
  // We want to listen for the 'submit' event of the <form> to enable a user
  // to submit the form via 'Enter' key besides using the 'Submit' button.
  "submit #login-form": function(event, template) {
    var username,
      password;

    event.preventDefault();

    username = trimInput(template.find("#login-username").value);
    password = template.find("#login-password").value;

    if (!isEmpty(username) && !isEmpty(password)) {
      // The Meteor.loginWithPassword() function is provided by the 'accounts-password' package.
      Meteor.loginWithPassword(username, password, function(error) {
        if (error) {
          // Let the user know that the login failed, e.g. if a user could
          // not be found or if the user entered an incorrect password.
          console.log(error.error);
        }
      });
    }
  },
  "click #create-account-link": function(event, template) {
    event.preventDefault();
    // Use the global Session object to specify the current form to display.
    Session.set("formContainer", "createAccountForm");

  }
});

Template.createAccountForm.events({
  // We want to listen for the 'submit' event of the <form> to enable a user
  // to submit the form via 'Enter' key besides using the 'Submit' button.
  "submit #create-account-form": function(event, template) {
    var username,
      password,
      passwordAgain;

    event.preventDefault();

    username = trimInput(template.find("#account-username").value);
    password = template.find("#account-password").value;

    if (!isEmpty(username) &&
      !isEmpty(password) &&
      isValidUsername(username) &&
      isValidPassword(password)) {
        // The Accounts.createUser() function is provided by the 'accounts-password' package.
        Accounts.createUser({
          username: username,
          password: password
        }, function(error) {
          if (error) {
            // Let the user know that the creation of an account failed.
            console.log(error.error);
          }
        });
    }
  }
});

// Helper function to check if the user entered a name of at least 3 characters.
function isValidUsername(input) {
  if (input.length >= 3) {
    return true;
  } else {
    console.log("Your name should be at least 3 characters long.");
    return false;
  }
}

// Helper function to check if the user entered a password of at least 6 characters.
function isValidPassword(input) {
  if (input.length >= 6) {
    return true;
  } else {
    console.log("Your password should be at least 6 characters long.");
    return false;
  }
}

// Helper function to check if the input value is empty.
function isEmpty(input) {
  if (!input || input === "") {
    console.log("Please do not leave any field empty.");
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
