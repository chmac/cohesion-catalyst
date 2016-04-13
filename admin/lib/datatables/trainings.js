TabularTables.Trainings = new Tabular.Table({
  name: "Trainings",
  collection: Trainings,
  columns: [
    {
      data: "_id",
      title: "Active",
      className: "one column wide center aligned",
      tmpl: Meteor.isClient && Template.trainingIsCurrentCell
    },
    {
      data: "_id",
      title: "ID"
    },
    {
      data: "title",
      title: "Title"
    },
    {
      data: "date",
      title: "Scheduled Date",
    },
    {
      data: "_id",
      title: "Edit",
      className: "one column wide center aligned",
      orderable: false,
      tmpl: Meteor.isClient && Template.trainingEditCell
    },
    {
      data: "_id",
      title: "Delete",
      className: "one column wide center aligned",
      orderable: false,
      tmpl: Meteor.isClient && Template.trainingDeleteCell
    }
  ],
  autoWidth: false
});
