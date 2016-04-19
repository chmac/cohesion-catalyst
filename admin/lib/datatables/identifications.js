TabularTables.Identifications = new Tabular.Table({
  name: "Identifications",
  collection: Identifications,
  selector: function() {
    return {
      level: {
        $gt: 0
      },
      editCompleted: true
    };
  },
  extraFields: ["blacklisted"],
  autoWidth: false,
  columns: [
    {
      data: "_id",
      title: "Match",
      className: "one column wide center aligned",
      tmpl: Meteor.isClient && Template.idIsMatchedCell
    },
    {
      data: "name",
      title: "Name"
    },
    {
      data: "_id",
      title: "Flag",
      className: "one column wide center aligned",
      tmpl: Meteor.isClient && Template.idBlacklistCell
    },
    {
      data: "createdBy",
      title: "Created By User",
      tmpl: Meteor.isClient && Template.idCreatedByNameCell
    },
    {
      data: "createdBy",
      title: "Block User",
      className: "one column wide center aligned",
      orderable: false,
      tmpl: Meteor.isClient && Template.idCreatedByBlockCell
    },
    {
      data: "trainingId",
      title: "Training ID"
    }
  ],
  createdRow: function(row, data, dataIndex) {
    // Is the identification blacklisted?
    if (data.blacklisted) {
      $(row).addClass("negative");
    }
  },
});
