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
      render: function (val, type, doc) {
        if (val instanceof Date) {
          return moment(val).format("MMM D YYYY, HH:mm");
        } else {
          return "Not listed";
        }
      }
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
  autoWidth: false,
  "lengthMenu": [ [10, 25, 50, 100, -1], [10, 25, 50, 100, "All"] ]
});
