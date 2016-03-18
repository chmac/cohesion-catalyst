// Since we want the "Trainings" collection to be available to the whole app, we omit the variable
// declaration using the "var" keyword. In so doing "Trainings" will be a global variable.
// Trainings = new Mongo.Collection("trainings");
//
// Schemas.Trainings = new SimpleSchema({
//   title: {
//     type: String,
//     label: "Title"
//   },
//   description: {
//     type: String,
//     label: "Description",
//     optional: true
//   },
//   date: {
//     type: Date,
//     label: "Scheduled Date",
//     optional: true
//   },
//   players: {
//     type: [String],
//     label: "Attendees",
//     optional: true
//     // autoValue: function () {
//     //   if (this.isInsert){
//     //     return [];
//     //   }
//     // }
//   },
//   isCurrentTraining: {
//     type: Boolean,
//     label: "Mark as current training"
//   }
// });
//
// Trainings.attachSchema(Schemas.Trainings);
