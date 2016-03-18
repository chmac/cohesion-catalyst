Trainings = new Mongo.Collection("trainings");

Schemas.Trainings = new SimpleSchema({
  title: {
    type: String,
    label: "Title"
  },
  description: {
    type: String,
    label: "Description",
    optional: true
  },
  date: {
    type: Date,
    label: "Scheduled Date",
    optional: true
  },
  players: {
    type: [String],
    label: "Attendees",
    optional: true
    // autoValue: function () {
    //   if (this.isInsert){
    //     return [];
    //   }
    // }
  },
  isCurrentTraining: {
    type: Boolean,
    label: "Mark as current training"
  }
});

Trainings.attachSchema(Schemas.Trainings);
