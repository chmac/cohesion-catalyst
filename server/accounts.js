Accounts.onCreateUser(function(options, user) {
  user.trainings = options.trainings;

  if (options.profile) {
    user.profile = options.profile;
  }

  return user;
});
