// On server startup, if some of the collections int database are empty,
// we create some initial data.
Meteor.startup(function() {

  if (Meteor.users.find().count() === 0) {
    // Define the users who have admin rights and adding those users to roles
    // Borrowed from the example at https://github.com/alanning/meteor-roles
    var users = [
      {name:"admin", email:"admin@example.com", roles:["admin"]},
      {name:"bullseye",
        bullseyeDefaults: {
          currentView: "splash",
          autoMode: true,
          reflectTrigger: 12,
          matchTrigger: 6,
          bubbleSpeed: 5
        },
        roles: ["view-bullseye"]
      }
    ];

    _.each(users, function (user) {
      var id;
      var profile = {
        name: user.name
      };

      if (user.bullseyeDefaults) {
        profile.currentView = user.bullseyeDefaults.currentView;
        profile.autoMode = user.bullseyeDefaults.autoMode;
        profile.reflectTrigger = user.bullseyeDefaults.reflectTrigger;
        profile.matchTrigger = user.bullseyeDefaults.matchTrigger;
        profile.bubbleSpeed = user.bullseyeDefaults.bubbleSpeed;
      }

      id = Accounts.createUser({
        username: user.name,
        password: "password",
        profile: profile
      });

      if (user.roles.length > 0) {
        // Need _id of existing user record so this call must come
        // after `Accounts.createUser` or `Accounts.onCreate`
        Roles.addUsersToRoles(id, user.roles);
      }

      // Add the email address for each admin user and mark it as verified.
      if (user.email) {
        Accounts.addEmail(id, user.email, true);
      }

    });
  }


  // Fixture training data
  if (Trainings.find().count() === 0) {
    var id = Trainings.insert({
      title: "Master Training",
      description: "Team building master class.",
      date: new Date(),
      players: [],
      isCurrentTraining: true
    });
  } // end Trainings

}); // end startup()
