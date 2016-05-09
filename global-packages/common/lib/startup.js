// On server startup, if some of the collections int database are empty,
// we create some initial data.
Meteor.startup(function() {

  if (Meteor.users.find().count() === 0) {
    // Define the users who have admin rights and adding those users to roles
    // Borrowed from the example at https://github.com/alanning/meteor-roles
    var users = [
      {name:"Nadja", email:"nadja.zollo@gmail.com", roles:["admin"]},
      {name:"Hartmut", email:"hartmut@hartmut-schirmacher.de", roles:["admin"]},
      {name:"Steffi", email:"mail@stefanie-rathje.com", roles:["admin"]},
      {name:"Diana", email:"Diana.Krieg@htw-berlin.de", roles:["admin"]},
      {name:"BullsEye", currentView: "splash", roles: ["view-bullseye"]}
    ];

    _.each(users, function (user) {
      var id;
      var profile = {
        name: user.name
      };

      if (user.currentView) {
        profile.currentView = user.currentView;
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
