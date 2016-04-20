// On server startup, we create some initial data for the
// 'Avatars' collection if there isn't any data yet.
Meteor.startup(function() {
  // Fixture avatars data
  if (Avatars.find().count() === 0) {
    var width = 150,
      height = 150;

    Avatars.insert({
      type: "#smiley-wink",
      url: "/svg/avatars.svg#smiley-wink",
      xPos: 0,
      yPos: 0,
      width: width,
      height: height
    });

    Avatars.insert({
      type: "#smiley-chuckle",
      url: "/svg/avatars.svg#smiley-chuckle",
      xPos: 200,
      yPos: 0,
      width: width,
      height: height
    });

    Avatars.insert({
      type: "#smiley-smirk",
      url: "/svg/avatars.svg#smiley-smirk",
      xPos: 400,
      yPos: 0,
      width: width,
      height: height
    });

    Avatars.insert({
      type: "#smiley-lol",
      url: "/svg/avatars.svg#smiley-lol",
      xPos: 0,
      yPos: 200,
      width: width,
      height: height
    });

    Avatars.insert({
      type: "#smiley-smile",
      url: "/svg/avatars.svg#smiley-smile",
      xPos: 200,
      yPos: 200,
      width: width,
      height: height
    });

    Avatars.insert({
      type: "#smiley-nerd",
      url: "/svg/avatars.svg#smiley-nerd",
      xPos: 400,
      yPos: 200,
      width: width,
      height: height
    });

    Avatars.insert({
      type: "#smiley-star",
      url: "/svg/avatars.svg#smiley-star",
      xPos: 0,
      yPos: 400,
      width: width,
      height: height
    });

    Avatars.insert({
      type: "#smiley-heart",
      url: "/svg/avatars.svg#smiley-heart",
      xPos: 200,
      yPos: 400,
      width: width,
      height: height
    });

    Avatars.insert({
      type: "#smiley-cool",
      url: "/svg/avatars.svg#smiley-cool",
      xPos: 400,
      yPos: 400,
      width: width,
      height: height
    });
  }
}); // Meteor.startup()
