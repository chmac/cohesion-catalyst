Identifications = new Mongo.Collection("identifications");

// ------------------------------------------------------------------------------------------- //
// -------------------------------------- Schema ---------------------------------------- //
// ------------------------------------------------------------------------------------------- //

Schemas.Identifications = new SimpleSchema({
  createdBy: {
    type: String,
    label: "Creator ID"
  },
  trainingId: {
    type: String,
    label: "Trainning ID"
  },
  fixed: {
    type: Boolean
  },
  children: {
    type: [String]
  },
  level: {
    type: Number
  },
  x: {
    type: Number,
    decimal: true
  },
  y: {
    type: Number,
    decimal: true
  },
  name: {
    type: String,
    label: "Name of ID"
  },
  standardizedName: {
    type: String,
    defaultValue: ""
  },
  editCompleted: {
    type: Boolean
  },
  parentId: {
    type: String,
    optional: true
  },
  matchColor: {
    type: String,
    optional: true
  }
});

Identifications.attachSchema(Schemas.Identifications);

// ------------------------------------------------------------------------------------------- //
// -------------------------------------- Permissions ---------------------------------------- //
// ------------------------------------------------------------------------------------------- //

// We set up the rules to allow client write operations to our collection.
Identifications.allow({
  insert: function (userId, doc) {
    // The user must be logged in to add a the document to the collection.
    return userId;
  },
  update: function (userId, doc, fields, modifier) {
    // The user may only change own documents.
    return doc.createdBy === userId;
  },
  remove: function (userId, doc) {
    // The user may only remove own documents.
    return doc.createdBy === userId;
  },
  // We want to fetch only the fields that are actually used.
  fetch: ['createdBy']
});


// ------------------------------------------------------------------------------------------- //
// ---------------------------------------- Queries ------------------------------------------ //
// ------------------------------------------------------------------------------------------- //

Identifications.findRoot = function(currentUserId, currentTrainingId) {
  return Identifications.find({
    createdBy: currentUserId,
    trainingId: currentTrainingId,
    level: 0
  });
};

Identifications.findCurrentIdentifications = function(currentUserId, currentTrainingId) {
  return Identifications.find({
    createdBy: currentUserId,
    trainingId: currentTrainingId
  });
};

Identifications.findOneById = function(id) {
  return Identifications.findOne({_id: id});
};

Identifications.findOneByName = function(name) {
  return Identifications.findOne({name: name});
};


// ------------------------------------------------------------------------------------------- //
// ----------------------------------------- Methods ----------------------------------------- //
// ------------------------------------------------------------------------------------------- //

Meteor.methods({

  /**
   * Meteor method for inserting the user's root 'identification' in the
   * 'Identifications' collection in the database.
   * @param {Object} rootProperties - The fields and values that are specific for the root ID.
   */
  insertRoot: function(rootProperties) {
    var currentUser = Meteor.user();
    var currentTrainingId = currentUser.profile.currentTraining;

    var defaultProperties = {
      createdBy: currentUser._id,
      trainingId: currentTrainingId,
      fixed: true,
      children: [],
      name: currentUser.profile.name,
      standardizedName: "",
      editCompleted: true
    };

    var root = _.extend(defaultProperties, rootProperties);
    var rootId = Identifications.insert(root);

    return {
      _id: rootId
    };
  },


  /**
   * Meteor method for inserting a created ID in the 'Identifications'
   * collection in the database. The 'identification' being inserted may be
   * 'self-made' by the user or chosen from the pool of other users' identifications.
   *
   * Along with inserting an identification document in the 'Identifications'
   * collection goes inserting the associated link in the 'Links' collection.
   * We store information of 'source' identifications and 'target' identifications
   * so that this data can be used in our {@code D3} visualization, e.g. drawing an
   * identification as SVG {@code <circle/>} and a link between a 'source' identification
   * and a 'target' identification as SVG {@code <line/>}.
   * @param {Object} idProperties - The identification being inserted.
   */
  insertIdentification: function(idProperties) {
    var currentUser = Meteor.user();
    var currentTrainingId = currentUser.profile.currentTraining;

    var defaultProperties = {
      createdBy: currentUser._id,
      trainingId: currentTrainingId,
      fixed: true,
      children: []
    };

    var identification = _.extend(defaultProperties, idProperties);
    var identificationId = Identifications.insert(identification);

    var source = Identifications.findOneById(identification.parentId);
    var target = Identifications.findOneById(identificationId);

    // We push the newly inserted identification to its parent 'children' array.
    Identifications.update(source._id, {
      $addToSet: {
        children: identificationId
      }
    }, errorFunc);

    // We create a new link object to connect the 'source' and 'target'
    // identificatios and add it to our 'Links' collection.
    var link = {
      source: source,
      target: target
    };
    Links.insert(link, errorFunc);

    // We find all the links which have the parent node as 'source' and update each of which
    // to contain the correct children values.
    Links.find({
      "source._id": identification.parentId
    }).forEach(function(link) {
      Links.update(link._id, {
        $addToSet: {
          "source.children": identificationId,
        }
      }, errorFunc);
    });

    return {
      _id: identificationId
    };
  }, // insertIdentification()

  /**
   * Meteor method for updating the {@code x} and {@code y} coordinates
   * of an identification. We also update the associated link.
   * @param {string} id - The document id of the identification being updated.
   * @param {Array} coordinates - The {@code x} and {@code y} coordinates as two-element array.
   */
  updatePosition: function(id, coordinates) {
    // We use the package 'danimal:checkvalidnumber' for pattern checking
    // to catch 'NaN' values.
    check(coordinates, [validNumber]);

    Identifications.update(id, {
      $set: {
        x: coordinates[0],
        y: coordinates[1]
      }
    });

    Links.find({
      "source._id": id
    }).forEach(function(link) {
      Links.update(link._id, {
        $set: {
          "source.x": coordinates[0],
          "source.y": coordinates[1]
        }
      }, {
        multi: true
      });
    });

    Links.find({
      "target._id": id
    }).forEach(function(link) {
      Links.update(link._id, {
        $set: {
          "target.x": coordinates[0],
          "target.y": coordinates[1]
        }
      }, {
        multi: true
      });
    });

    // return updated document
    return Identifications.findOneById(id);
  }, // updatePosition()

  /**
   * Meteor method for updating an identification document in the database
   * which is being edited by the user.
   * @param {string} id - The document id of the identification being edited.
   * @param {string} nameValue - The user's text input.
   * @param {boolean} isComplete - True if the user has finished editing, unless the
   * input is not empty. False otherwise.
   */
  editIdentification: function(id, nameValue, isComplete) {
    Identifications.update(id, {
      $set: {
        name: nameValue,
        standardizedName: standardizeInput(nameValue),
        editCompleted: isComplete
      },
      // While editing, unset the assigned color, if any.
      // Color assignment will be handled by checking 'MetaCollection'.
      $unset: {matchColor: ""}
    }, {
      // To handle empty strings we use our customized check in 'my_ids.js'.
      // Since we use the 'aldeed:collection2' package, we need to set the option
      // 'removeEmptyStrings' to 'false' in order to allow an empty string while users
      // are editing their identifications input.
      // Otherwise, the 'name' key would be removed resulting in an validation error because
      // 'Schemas.Identifications' defines 'name' as required.
      // cf. https://github.com/aldeed/meteor-collection2#skip-removing-empty-strings
      removeEmptyStrings: false
    });

    Links.find({
      "source._id": id
    }).forEach(function(link) {
      Links.update(link._id, {
        $set: {
          "source.name": nameValue,
          "source.standardizedName": standardizeInput(nameValue),
          "source.editCompleted": isComplete
        },
        $unset: {"source.matchColor": ""}
      }, {
        multi: true
      });
    });

    Links.find({
      "target._id": id
    }).forEach(function(link) {
      Links.update(link._id, {
        $set: {
          "target.name": nameValue,
          "target.standardizedName": standardizeInput(nameValue),
          "target.editCompleted": isComplete
        },
        $unset: {"target.matchColor": ""}
      }, {
        multi: true
      });
    });
  }, // editIdentification()

  /**
   * Meteor method for deleting an identification document and its associated
   * link documents from the respective collection.
   * @param {Object} doc - The identification to delete.
   */
  removeIdentificationAndLink: function(doc) {

    Links.remove(Links.findOne({
      "target._id": doc._id
    })._id, errorFunc);

    Links.find({
      "source._id": doc.parentId
    }).forEach(function(link) {
      Links.update(link._id, {
        $pull: {
          "source.children": doc._id,
        }
      }, errorFunc);
    });

    Identifications.update(doc.parentId, {
      $pull: {
        children: doc._id
      }
    }, errorFunc);

    Identifications.remove(doc._id, errorFunc);
  }, // removeIdentificationAndLink

}); // Meteor.methods()
