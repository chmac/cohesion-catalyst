// On server startup, if some of the collections int database are empty,
// we create some initial data.
Meteor.startup(function() {

  if (Meteor.users.find().count() === 0) {
    // Define the users who have admin rights and adding those users to roles
    // Borrowed from the example at https://github.com/alanning/meteor-roles
    var users = [
      {name:"nadeschda",email:"nadja.zollo@gmail.com",roles:["admin"]},
      {name:"haschi",email:"hartmut@hartmut-schirmacher.de",roles:["admin"]},
      {name:"steff",email:"mail@stefanie-rathje.com",roles:["admin"]}
    ];

    _.each(users, function (user) {
      var id;

      id = Accounts.createUser({
        username: user.name,
        // email: user.email,
        password: "cocacoma",
        profile: { name: user.name }
      });

      if (user.roles.length > 0) {
        // Need _id of existing user record so this call must come
        // after `Accounts.createUser` or `Accounts.onCreate`
        Roles.addUsersToRoles(id, user.roles);
      }

      // Add the email address for each admin user and mark it as verified.
      Accounts.addEmail(id, user.email, true);

    });
  }


  // Fixture training data
  if (Trainings.find().count() === 0) {
    var someday,
      daimlerId;

    // Dummy date in the future
    someday = new Date(2016, 9, 30);
    daimlerId = Trainings.insert({
      title: "Training Daimler",
      description: "Team building master class.",
      date: someday,
      players: [],
      isCurrentTraining: true
    });
  } // end Trainings

// if (Identifications.find().count() === 0) {
//   // We create 5 users
//   var georgId,
//     hannesId,
//     laraId,
//     yasminId,
//     markusId,
//     georg,
//     hannes,
//     lara,
//     yasmin,
//     markus;
//
//   georgId = Meteor.users.insert({
//     username: "Georg_" + daimlerId,
//     profile: {
//       name: "Georg",
//       currentTraining: daimlerId
//     }
//   });
//   georg = Meteor.users.findOne(georgId);
//
//   hannesId = Meteor.users.insert({
//     username: "Hannes_" + daimlerId,
//     profile: {
//       name: "Hannes",
//       currentTraining: daimlerId
//     }
//   });
//   hannes = Meteor.users.findOne(hannesId);
//
//   laraId = Meteor.users.insert({
//     username: "Lara_" + daimlerId,
//     profile: {
//       name: "Lara",
//       currentTraining: daimlerId
//     }
//   });
//   lara = Meteor.users.findOne(laraId);
//
//   yasminId = Meteor.users.insert({
//     username: "Yasmin_" + daimlerId,
//     profile: {
//       name: "Yasmin",
//       currentTraining: daimlerId
//     }
//   });
//   yasmin = Meteor.users.findOne(yasminId);
//
//   markusId = Meteor.users.insert({
//     username: "Markus_" + daimlerId,
//     profile: {
//       name: "Markus",
//       currentTraining: daimlerId
//     }
//   });
//   markus = Meteor.users.findOne(markusId);
//
//   var georgIds = ["Tierfreund", "Morgenmuffel", "Norwegen-Fan", "Essensliebhaber", "Kreuzberg"];
//   var hannesIds = ["Berliner", "Sportler", "30er", "Informatiker", "Akademiker", "Müller", "Pragmatiker"];
//   var laraIds = ["Gesang", "Chor", "Musik", "Bach", "Evan. Kirche", "Südafrika", "Joggen", "Kreuzberg"];
//   var yasminIds = ["Reisen", "Berliner", "Australien", "Take That", "Homeland (TV)", "Apple-Fan", "Prenzlauer Berg"];
//   var markusIds = ["New York", "Depeche Mode", "SPD", "Fotografie", "Tschechien", "Berliner", "Politik", "Apple-Fan"];
//
//   for (var i = 0; i < georgIds.length; i++) {
//     Identifications.insert( {
//       name: georgIds[i],
//       createdBy: georgId,
//       trainingId: daimlerId,
//       editCompleted: true,
//       level: 1
//     });
//   }
//
//   for (var j = 0; j < hannesIds.length; j++) {
//     Identifications.insert( {
//       name: hannesIds[j],
//       createdBy: hannesId,
//       trainingId: daimlerId,
//       editCompleted: true,
//       level: 1
//     });
//   }
//
//   for (var k = 0; k < laraIds.length; k++) {
//     Identifications.insert( {
//       name: laraIds[k],
//       createdBy: laraId,
//       trainingId: daimlerId,
//       editCompleted: true,
//       level: 1
//     });
//   }
//
//   for (var l = 0; l < yasminIds.length; l++) {
//     Identifications.insert( {
//       name: yasminIds[l],
//       createdBy: yasminId,
//       trainingId: daimlerId,
//       editCompleted: true,
//       level: 1
//     });
//   }
//
//   for (var m = 0; m < markusIds.length; m++) {
//     Identifications.insert( {
//       name: markusIds[m],
//       createdBy: markusId,
//       trainingId: daimlerId,
//       editCompleted: true,
//       level: 1
//     });
//   }
//
// } // end Identifications


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
