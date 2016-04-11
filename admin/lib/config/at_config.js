// We customize the useraccounts:semantic-ui 'AccountsTemplates'
// cf. https://github.com/meteor-useraccounts/core/blob/master/Guide.md#advanced-customization

var adminLogout = function() {
  Router.go("home");
};

AccountsTemplates.configure({
  homeRoutePath: '/',

  //Appearance
  hideSignUpLink: true,
  texts: {
    title: {
      signIn: "Hello C.Cat admin! Sign In."
    }
  },

  // Hooks
  onLogoutHook: adminLogout
});
