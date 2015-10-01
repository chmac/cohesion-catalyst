errorFunc = function(error, result) {
  if (error) {
    if (Meteor.isClient) {
      return console.log("What is wrong? ", error.reason);
    }
    if (Meteor.isServer) {
      throw new Meteor.Error(error);
    }
  }
};
