// On server startup, if some of the collections int database are empty,
// we create some initial data.
Meteor.startup(function() {

  if (Meteor.users.find().count() === 0) {
    // Define the users who have admin rights and adding those users to roles
    // Borrowed from the example at https://github.com/alanning/meteor-roles
    var users = [
      {name:"Nadja",email:"nadja.zollo@gmail.com",roles:["admin"]},
      {name:"Hartmut",email:"hartmut@hartmut-schirmacher.de",roles:["admin"]},
      {name:"Steffi",email:"mail@stefanie-rathje.com",roles:["admin"]}
    ];

    _.each(users, function (user) {
      var id;

      id = Accounts.createUser({
        username: user.name,
        password: "admin1",
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
    var someday;

    // Dummy date in the future
    someday = new Date(2016, 8, 30);
    Trainings.insert({
      title: "Master Training",
      description: "Team building master class.",
      date: someday,
      players: [],
      isCurrentTraining: true
    });
  } // end Trainings

}); // end startup()
