Template.export.events({
    "click #start_export"(event, tmpl) {
        debugger;
        Meteor.call("getExportUrl", (error, response) => {
            debugger;
            if (error) {
                alert(`Error fetching export URL. ${error.message}`);
            } else {
                window.location = response;
            }
        });
    }
});
