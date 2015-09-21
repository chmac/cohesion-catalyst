MetaCollection = new Mongo.Collection("metaCollection");

Meteor.methods({
  testCall: function(dummy) {
    function pausecomp(millis) {
      var date = new Date();
      var curDate = null;
      do { curDate = new Date(); }
      while(curDate-date < millis);
    }
    console.log("in testCall, isClient=" + Meteor.isClient);
    if (Meteor.isServer) {
      pausecomp(5000);
      console.log("server done counting!");
    } else {
      console.log("client simulation done without waiting");
    }
  },
  addMetaInfo : function(doc) {
    // MetaCollection.find().forEach(function(d) {
    //   if (d.name == doc.name) {
    //     // ID with such name already in collection, check who created it
    //     for (var j = 0; j < d.createdBy.length; j++) {
    //       if (d.createdBy[j] == doc.createdBy) {
    //         // already in, so just ignore this addID call
    //         console.log("Already in collection - ignore and return!");
    //         return;
    //       }
    //     }
    //
    //     // this creator is new, so add it to this ID
    //     MetaCollection.update(d._id, {
    //       $inc: {
    //         count: 1
    //       }
    //     }, {
    //       $addToSet: {
    //         createdBy: doc.createdBy
    //       }
    //     }, function(error, result) {
    //       if (error) {
    //         return throwError(error.reason);
    //       }
    //       console.log("New creator for MetaID ", d.name);
    //     });
    //     return;
    //   }
    // });

    var metaDoc = MetaCollection.findOne({
      name: doc.name
    });
    // Is ID with such name already in collection?
    if (metaDoc) {
      // then add its creator to this ID
      MetaCollection.update(metaDoc._id, {
        $inc: {
          count: 1
        },
        $addToSet: {
          createdBy: doc.createdBy
        }
      }, function(error, result) {
        if (error) {
          return throwError(error.reason);
        }
        console.log("New creator for MetaID ", metaDoc.name);
      });
    } else {
      // ID with such name not yet in collection, so create new ID
      var id = {};
      id.name = doc.name;
      id.count = 1;
      id.color = "white";
      id.createdBy = [doc.createdBy];

      var newDocId = MetaCollection.insert(id, function(error, result) {
        if (error) {
          return throwError(error.reason);
        }
      });
      console.log("New MetaID ", doc.name);

      // return newDocId;
    }
  },
  deleteMetaInfo: function(doc) {
    var metaDoc = MetaCollection.findOne({
      name: doc.name
    });

    if (metaDoc.createdBy.length > 1) {
      MetaCollection.update(metaDoc._id, {
        $inc: {
          count: -1
        },
        $pull: {
          createdBy: doc.createdBy
        }
      }, function(error, result) {
        if (error) {
          return throwError(error.reason);
        }
        console.log("Lost creator for MetaID ", metaDoc.name);
      });
    } else {
      MetaCollection.remove(metaDoc._id, function(error, result) {
        if (error) {
          return throwError(error.reason);
        }
        console.log("Remove MetaID ", metaDoc.name);
      });
    }
  }
});
