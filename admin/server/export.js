Meteor.methods({
    getExportUrl() {
        const key = Mongo._CollectionPrototype._makeNewID();
        return Meteor.absoluteUrl(`files/${key}`);
    }
});

WebApp.connectHandlers.use("/files", (req, res, next) => {
    res.writeHead(200, {
        "content-type": "text/plain"
    });
    const key = req.url.substr(1);
    res.end(`Booya we got you! Key was ${key}`);
});
