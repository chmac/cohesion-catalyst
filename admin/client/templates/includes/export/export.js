Template.export.events({
    "click #start_export"(event, tmpl) {
        Meteor.call("getExportUrl", (error, response) => {
            if (error) {
                alert(`Error fetching export URL. ${error.message}`);
            } else {
                window.location = response;
            }
        });
    }
});
