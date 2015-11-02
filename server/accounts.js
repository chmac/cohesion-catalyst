Accounts.onCreateUser(function(options, user) {
  user.trainings = options.trainings;

  if (options.profile) {
    user.profile = options.profile;
  }

  // Add the new user to the 'players' field (an array) of the current training document.
  if (options.profile.currentTraining) {
    Trainings.update(options.profile.currentTraining, {
      $push: {players: user._id}
    }, function(error, result) {
      if (error) {
        // TODO Improve error handling.
        console.log("Error while updating document. Reason: ", error.reason);
      }
    });
  }

  return user;
});
