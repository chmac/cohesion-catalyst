TabularTables.Trainings = new Tabular.Table({
  name: "Trainings",
  collection: Trainings,
  //Initial order based on latest date of 'Scheduled Date' column (i.e. index 3)
  order: [[3, "desc"]],
  columns: [
    {
      data: "_id",
      title: "Active",
      className: "one column wide center aligned",
      // Since the underlying data is '_id', there is
      // no point to make this column oderable.
      orderable: false,
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
