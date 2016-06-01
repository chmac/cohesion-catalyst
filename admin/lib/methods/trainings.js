Meteor.methods({

  /**
   * Removes the selected training from the collection.
   * @param {String} id - The _id of the training document being removed.
   */
  "trainings.remove": function(id) {

    // Check arguments from client
    check(id, String);

    // Only admins have the right to remove a training.
    if (!Roles.userIsInRole(this.userId, "admin")) {
      throw new Meteor.Error("trainings.remove.not-authorized",
        "Must be admin to remove a training.");
    }

    // If this training is the currently active one, we cancel the operation.
    var training = Trainings.findOne({_id: id});
    if (training && training.isCurrentTraining) {
      throw new Meteor.Error("trainings.remove.not-allowed",
        "Cannot delete current active training.");
    }

    return Trainings.remove(id);
  },

  /**
   * Updates the training document as needed.
   * @param {Object} modifier - The modifier object generated from the
   * form values (using 'autoForm').
   * @param {String} id - The _id of the training object being updated.
   */
  "training.edit.update.data": function(modifier, id) {

    // Check arguments
    check(id, String);
    check(modifier, Object);
    check(modifier.$set, Object);
    check(modifier.$set.title, String);
    check(modifier.$set.date, Match.Optional(Date));
    check(modifier.$set.description, Match.Optional(String));

    // Only admins have the right to remove a training.
    if (!Roles.userIsInRole(this.userId, "admin")) {
      throw new Meteor.Error("training.edit.update.data",
        "Must be admin to edit training data.");
    }

    return Trainings.update({_id: id}, modifier);
  },

  /**
   * Changes the training's 'current' state.
   * Makes sure, that there is at least one training marked as 'current'.
   * @param {String} id - The _id of the training document being updated.
   * @param {String} isCurrent - A string representation of the boolean value
   * "true" or "false", respectively, retrieved from the data-attribute of the
   * clicked button where we stored the documents 'isCurrentTraining' value.
   */
  "training.edit.change.current": function(id, isCurrent) {

    // Check arguments from client
    check(id, String);
    check(isCurrent, String);

    // Only admins have the right to change the training.
    if (!Roles.userIsInRole(this.userId, "admin")) {
      throw new Meteor.Error("training.edit.change.current.not-authorized",
        "Must be admin to change current training.");
    }

    // We need to convert the string value received
    // from the client to boolean
    var isCurrentTraining = (isCurrent === "true");

    var otherTraining;

    // Is the selected training marked as current?
    if (isCurrentTraining) {
      // We find the first other training in the collection
      // that is not marked as current.
      otherTraining = Trainings.findOne({
        isCurrentTraining: false
      });

      // Is there no other training in the collection?
      // Then we call the methode to create a new default training
      // which becomes the current one and the previously current
      // training is set to false.
      if (!otherTraining) {
        // Call the method and return (i.e. we are done here).
        return Meteor.call("training.create.default", id);
      }

      // Otherwise, we found another training and make it current one.
      Trainings.update({_id: otherTraining._id}, {
        $set: {
          isCurrentTraining: true
        }
      });

    // Is the selected training NOT the current one?
    } else {
      // We find the training in the collection
      // that is marked as current.
      otherTraining = Trainings.findOne({
        isCurrentTraining: true
      });

      // We only need to update if we found a current training.
      if (otherTraining) {
        // We set the found current training to false
        Trainings.update({_id: otherTraining._id}, {
          $set: {
            isCurrentTraining: false
          }
        });
      }
    }

    // Finally, we change the target training current state.
    Trainings.update({_id: id}, {
      $set: {
        isCurrentTraining: !isCurrentTraining
      }
    });

    return "OK";
  },

  /**
   * Creates a default training which becomes the current one.
   * This function is used to create a new training per one-click, or
   * to make sure that there is always at least one training marked as
   * current, respectively.
   * @param {String} currentTrainingId - The _id of the training document
   * marked as current and which will be changed.
   */
  "training.create.default": function(currentTrainingId) {

    // Check arguments received from client
    check(currentTrainingId, String);

    // Only admins have the right to change the training.
    if (!Roles.userIsInRole(this.userId, "admin")) {
      throw new Meteor.Error("training.create.default.not-authorized",
        "Must be admin to create default training.");
    }

    var newDefaultTraining = {
      title: "Training",
      date: new Date(),
      isCurrentTraining: true
    };

    // We change the training marked as current training so that
    // there can only be one current training, i.e. the new default training.
    Trainings.update({_id: currentTrainingId}, {
      $set: {
        isCurrentTraining: false
      }
    });

    // We log out all users currently logged in to the training we changed.
    // NOTE This is an intrusive operation! However, it is convenient for quickly
    // starting a fresh session, particularly when working at the Cohesion Table.
    Meteor.users.update({
      "profile.currentTraining": currentTrainingId
    }, {
      $set: {
        "services.resume.loginTokens": []
      }
    }, {
      multi: true
    });

    // We switch the bullseye current view to the splash screen.
    Meteor.users.update({
      username: "BullsEye"
    }, {
      $set: {
        "profile.currentView": "splash",
        "profile.autoMode": true
      }
    });

    // Finally, we create the new default training
    return Trainings.insert(newDefaultTraining);
  },

  /**
   * Creates a new training based on the submitted form data.
   * @param {Object} doc - The new training document to be inserted in the collection.
   */
  "training.create": function(doc) {

    // Check arguments received from client
    check(doc, Object);
    check(doc.title, String);
    check(doc.date, Match.Optional(Date));
    check(doc.description, Match.Optional(String));
    check(doc.isCurrentTraining, Boolean);

    // Is the new training intended to be the current training?
    if (doc.isCurrentTraining) {
      // We look for the training in the collection
      // that is marked as current.
      var currentTraining = Trainings.findOne({
        isCurrentTraining: true
      });

      // We only need to update if we found a current training.
      if (currentTraining) {
        // We set the found current training to false
        Trainings.update({_id: currentTraining._id}, {
          $set: {
            isCurrentTraining: false
          }
        });
      }
    }

    return Trainings.insert(doc);
  }

});
