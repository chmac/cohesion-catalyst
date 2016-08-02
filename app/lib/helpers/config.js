// We customize the AccountsTemplates to specify some of its
// appearance and behavior to our liking.
// cf. https://github.com/meteor-useraccounts/core/blob/master/Guide.md#configuration-api
// NOTE It is important to access this both from client and server! Hence, it is
// located in the 'lib' folder.
AccountsTemplates.configure({
  // Behavior
  overrideLoginErrors: false,
  // Redirects
  homeRoutePath: '/bullseye',
  // Appearance
  hideSignUpLink: true,
  texts: {
    title: {
      signIn: "Hello! Please sign in."
    }
  }
});
