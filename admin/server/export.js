const MAXIMUM_INTERVAL_FROM_REQUEST = 60 * 1e3; // 1 minute

const Exports = new Mongo.Collection("exports");

Meteor.methods({
    getExportUrl() {
        const exportId = Exports.insert({
            userId: this.userId,
            createdAt: Date.now()
        });
        return Meteor.absoluteUrl(`files/${exportId}`);
    }
});

WebApp.connectHandlers.use("/files", (req, res, next) => {
    res.writeHead(200, {
        "content-type": "text/plain"
    });
    const key = req.url.substr(1);

    const { userId, createdAt } = Exports.findOne(key) || {};
    if (
        !userId ||
        !createdAt ||
        Date.now() - createdAt > MAXIMUM_INTERVAL_FROM_REQUEST
    ) {
        throw new Error("Fail");
    }

    res.end(`Booya we got you! Key was ${key}`);
});
