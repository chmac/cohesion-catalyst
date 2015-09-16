
Template.idNetwork.onCreated(function() {
  console.log("created template idNetwork");
  Meteor.call("testCall", "p1");
  console.log("continuing in client template after testCall...");
});
