TabularTables.Users = new Tabular.Table({
  name: "Users",
  collection: Meteor.users,
  columnDefs: [
    {
      targets: "",
      createdCell: function(td, cellData, rowData, row, col) {
      }
    },

  ],
  columns: [
    {
      data: "_id",
      title: "Admin",
      className: "one column wide center aligned",
      tmpl: Meteor.isClient && Template.userIsAdminCell
    },
    {
      data: "status.online",
      title: "Status",
      className: "one column wide center aligned",
      tmpl: Meteor.isClient && Template.userIsOnlineCell
    },
    {data: "profile.name", title: "Name"},
    {data: "_id", title: "User ID"},
    {data: "profile.currentTraining", title: "Training ID"},
    {
      data: "_id",
      title: "Edit",
      className: "one column wide center aligned",
      orderable: false,
      tmpl: Meteor.isClient && Template.userEditCell
    },
    {
      data: "_id",
      title: "Block",
      className: "one column wide center aligned",
      orderable: false,
      tmpl: Meteor.isClient && Template.userBlockCell
    },
    {
      data: "_id",
      title: "Delete",
      className: "one column wide center aligned",
      orderable: false,
      tmpl: Meteor.isClient && Template.userDeleteCell
    }
  ],
  createdRow: function(row, data, dataIndex) {
    // Is the user blocked?
    if (data.blocked) {
      $(row).addClass("negative");
    }
  },
  autoWidth: false
});
