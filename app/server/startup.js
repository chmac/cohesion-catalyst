// On server startup, if some of the collections int database are empty,
// we create some initial data.
Meteor.startup(function() {

  // if (Meteor.users.find().count() === 0) {
  //   // Define the users who have admin rights and adding those users to roles
  //   // Borrowed from the example at https://github.com/alanning/meteor-roles
  //   var users = [
  //     {name:"nadeschda",email:"nadja.zollo@gmail.com",roles:["admin"]},
  //     {name:"haschi",email:"hartmut@hartmut-schirmacher.de",roles:["admin"]},
  //     {name:"steff",email:"mail@stefanie-rathje.com",roles:["admin"]}
  //   ];
  //
  //   _.each(users, function (user) {
  //     var id;
  //
  //     id = Accounts.createUser({
  //       username: user.name,
  //       // email: user.email,
  //       password: "cocacoma",
  //       profile: { name: user.name }
  //     });
  //
  //     if (user.roles.length > 0) {
  //       // Need _id of existing user record so this call must come
  //       // after `Accounts.createUser` or `Accounts.onCreate`
  //       Roles.addUsersToRoles(id, user.roles);
  //     }
  //
  //     // Add the email address for each admin user and mark it as verified.
  //     Accounts.addEmail(id, user.email, true);
  //
  //   });
  // }
  //
  //
  // // Fixture training data
  // if (Trainings.find().count() === 0) {
  //   var someday;
  //
  //   // Dummy date in the future
  //   someday = new Date(2016, 8, 30);
  //   Trainings.insert({
  //     title: "Master Training",
  //     description: "Team building master class.",
  //     date: someday,
  //     players: [],
  //     isCurrentTraining: true
  //   });
  // } // end Trainings


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