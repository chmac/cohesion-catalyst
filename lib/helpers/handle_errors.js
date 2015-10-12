errorFunc = function(error, result) {
  if (error) {
    if (Meteor.isClient) {
      return throwError("Error: ", error.reason);
    }
    if (Meteor.isServer) {
      throw new Meteor.Error(error);
    }
  }
};
