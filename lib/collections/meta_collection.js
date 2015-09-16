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
  }
});
