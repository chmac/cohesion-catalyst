(function() {
MetaCollection = new Mongo.Collection("metaCollection");

Meteor.methods({
  /**
   * Gets called from inside the 'metaIdentifications' publish function.
   * Whenever we observe that a document was added to the 'Identifications' collection
   * we need to perform the respective operation on the 'MetaCollection' collection.
   */
  addMetaDoc : function(doc) {
    var metaDoc = MetaCollection.findOne({
      name: doc.name
    });
    // Is ID with such name already in collection?
    if (metaDoc && metaDoc !== undefined) {
      console.log("New creator for MetaID ", metaDoc.name);
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
      console.log("New MetaID ", doc.name);
    }
  },
  /**
   * Gets called from inside the 'metaIdentifications' publish function.
   * Whenever we observe that a document was deleted from the 'Identifications' collection
   * we need to perform the respective operation on the 'MetaCollection' collection.
   */
  deleteMetaDoc: function(doc) {
    // We find the MetaID of the associated 'Identification' doc.
    var metaDoc = MetaCollection.findOne({
      name: doc.name
    });

    if(!metaDoc) {
      return;
    }

    // Are there more than one creator of this MetaID?
    if (metaDoc.createdBy.length > 1) {
      // Then the creator who deleted the associated Identification is no longer a creator of this MetaID.
      MetaCollection.update(metaDoc._id, {
        $pull: {
          createdBy: doc.createdBy
        }
      }, errorFunc);
      console.log("Lost creator for MetaID ", metaDoc.name);
    } else {
      // We delete the MetaID of the associated 'Identification' doc.
      MetaCollection.remove(metaDoc._id, errorFunc);
      console.log("Remove MetaID ", metaDoc.name);
    }
  }
});
}()); // end function closure
