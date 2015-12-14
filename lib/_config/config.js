AdminConfig = {
  name: "Cohesion Catalyst",
  dashboard: {
    homeUrl: '/admin'
  },
  logoutRedirect: "home",
  adminEmails: ["nadja.zollo@gmail.com", "hartmut@hartmut-schirmacher.de", "mail@stefanie-rathje.com"],
  collections: {
    Trainings: {
      icon: "calendar",
      omitFields: ["players"],
      tableColumns: [
        { label: "ID", name: "_id" },
        { label: "Title", name: "title" },
        { label: "Scheduled Date", name: "date"}
      ]
    }
  }
};
