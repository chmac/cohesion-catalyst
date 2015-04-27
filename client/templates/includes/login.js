Template.loginForm.helpers({
  loginForm: function() {
    return true;
  },
  createAccount: function() {
    return false;
  }
});

Template.loginForm.events({
  // We want to listen for the 'submit' event of the <form> to enable a user
  // to submit the form via 'Enter' key besides using the 'Submit' button.
  "submit #login-form": function(event, template) {
    var username,
      password;

    event.preventDefault();

    username = template.find("#login-username").value;
    password = template.find("#login-password").value;


  },
  "click #create-account-link": function(event, template) {

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

    username = template.find("#account-username").value;
    password = template.find("#account-password").value;
    passwordAgain = template.find("#account-password-again").value;

  }

});
