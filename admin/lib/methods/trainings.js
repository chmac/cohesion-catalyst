Meteor.methods({

  "trainings.remove": function(id) {

    // Make sure id is a string.
    check(id, String);

    // Only admins have the right to remove a training.
    if (!Roles.userIsInRole(this.userId, "admin")) {
      throw new Meteor.Error("trainings.remove.not-authorized",
        "Must be admin to remove a training.");
    }

    // If this training is the currently avtive one, we cancel the operation. 
    var training = Trainings.findOne({_id: id});
    if (training && training.isCurrentTraining) {
      throw new Meteor.Error("trainings.remove.not-allowed",
        "Cannot delete current active training.");
    }

    return Trainings.remove(id);
  }

});
