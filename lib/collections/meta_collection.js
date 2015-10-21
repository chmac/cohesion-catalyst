(function() {
MetaCollection = new Mongo.Collection("metaCollection");

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
    console.log("addMetaDoc() called for ", doc.name);

    // We find the MetaID of the associated 'Identification' doc.
    var metaDoc = MetaCollection.findOne({
      name: doc.name
    });

    // Is ID with such name already in collection?
    if (metaDoc && metaDoc !== undefined) {
      // then add its creator to this ID
      MetaCollection.update(metaDoc._id, {
        $addToSet: {
          createdBy: doc.createdBy
        }
      }, errorFunc);
    } else {
      // ID with such name not yet in collection, so create new ID
      var id = {};
      id.name = doc.name;
      id.color = pickRandomColorClass();
      id.createdBy = [doc.createdBy];

      var newDocId = MetaCollection.insert(id, errorFunc);
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
    console.log("deleteMetaDoc() called for ", doc.name);

    // We find the MetaID of the associated 'Identification' doc.
    var metaDoc = MetaCollection.findOne({
      name: doc.name
    });

    if(!metaDoc) {
      return;
    }

    // Is there no creator left of this MetaID?
    if (metaDoc.createdBy.length < 1) {
      // then we delete the MetaID of the associated 'Identification' doc.
      MetaCollection.remove(metaDoc._id, errorFunc);
      console.log("Remove MetaID ", metaDoc.name);
      return;
    }

    // The creator who deleted the associated Identification is no longer a creator of this MetaID.
    MetaCollection.update(metaDoc._id, {
      $pull: {
        createdBy: doc.createdBy
      }
    }, errorFunc);
    console.log("Lost creator for MetaID ", metaDoc.name);
  }
});
}()); // end function closure
