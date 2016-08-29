/**
 * The 'MetaCollection' collection and its schema are defined
 * within the private package coca:common which is shared between
 * this project and the admin app project.
 */


(function() {
// ------------------------------------------------------------------------------------------- //
// ----------------------------------------- Methods ----------------------------------------- //
// ------------------------------------------------------------------------------------------- //

Meteor.methods({

  /**
   * Meteor method that gets called from inside the 'poolIdentifications' publish function.
   * Whenever we observe that a document was added to the 'Identifications' collection
   * we need to perform the respective operation on the 'MetaCollection' collection
   * (i.e. updating the 'createdBy' array or inserting a new document, respectively).
   * @param {Object} doc - The document added to the 'Identifications' collection.
   */
  addMetaDoc : function(doc) {
    // console.log("addMetaDoc() called for ", doc.name);

    // We find the MetaID of the associated 'Identification' doc.
    var metaDoc = MetaCollection.findOne({
      standardizedName: doc.standardizedName,
      createdAtTraining: doc.trainingId
    });

    // Is ID with such name already in collection?
    if (metaDoc) {
      // then add its creator to this ID
      MetaCollection.update(metaDoc._id, {
        $addToSet: {
          createdBy: doc.createdBy
        }
      });

      var creators = MetaCollection.findOne(metaDoc._id).createdBy;
      // Is this MetaID shared by multiple users?
      // Then we update the associated doc in each of these users 'Identification' collection
      // by assigning the 'matchColor'.
      if (creators.length > 1) {
        Identifications.update({
          createdBy: {
            $in: creators
          },
          standardizedName: metaDoc.standardizedName
        }, {
          $set: {
            matchColor: metaDoc.color
          }
        }, {
          multi: true
        });
      }
    } else {
      // ID with such name not yet in collection, so create new ID
      var id = {};
      id.name = doc.name;
      id.standardizedName = doc.standardizedName;
      id.color = pickRandomColorClass();
      id.createdBy = [doc.createdBy];
      id.createdAtTraining = doc.trainingId;

      var newDocId = MetaCollection.insert(id, errorFunc);
      return newDocId;
    }
  },

  /**
   * Meteor method that gets called from inside the 'poolIdentifications' publish function.
   * Whenever we observe that a document was deleted from the 'Identifications' collection
   * we need to perform the respective operation on the 'MetaCollection' collection.
   * (i.e. removing the document or updating the 'createdBy' array, respectively).
   * @param {Object} - The document removed from the 'Identifications' collection.
   */
  deleteMetaDoc: function(doc) {
    // console.log("deleteMetaDoc() called for ", doc.name);

    // We find the MetaID of the associated 'Identification' doc.
    var metaDoc = MetaCollection.findOne({
      standardizedName: doc.standardizedName,
      createdAtTraining: doc.trainingId
    });

    if(!metaDoc) {
      return;
    }

    // The creator who deleted the associated Identification is no longer a creator of this MetaID.
    MetaCollection.update(metaDoc._id, {
      $pull: {
        createdBy: doc.createdBy
      }
    });

    var creators = MetaCollection.findOne(metaDoc._id).createdBy;

    // Is there no creator left of this MetaID?
    if (creators.length < 1) {
      // then we delete the MetaID of the associated 'Identification' doc.
      MetaCollection.remove(metaDoc._id, errorFunc);
      // console.log("Remove MetaID ", metaDoc.name);
      return;
    }

    // Is there only one creator left of this MetaID?
    // Then we remove any assigned 'matchColor'.
    if (creators.length === 1){
      Identifications.update({
        createdBy:creators[0],
        standardizedName: metaDoc.standardizedName
      }, {
        $unset: {
          matchColor: ""
        }
      },  function(error, result) {
        // TODO: Improve error handling
        if (error) console.log(error);
      });
    }
    // console.log("Lost creator for MetaID ", metaDoc.name);
  }
});
}()); // end function closure
