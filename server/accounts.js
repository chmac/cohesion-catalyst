Accounts.onCreateUser(function(options, user) {
  user.trainings = options.trainings;

  if (options.profile) {
    user.profile = options.profile;
  }

  // Add the new user to the 'attendees' field (an array) of the current training document.
  if (options.profile.currentTraining) {
    Trainings.update(options.profile.currentTraining, {
      $push: {attendees: user._id}
    }, function(error, result) {
      if (error) {
        // TODO Improve error handling.
        console.log("Error while updating document. Reason: ", error.reason);
      }
    });
  }

  return user;
});
