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
