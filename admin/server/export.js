const MAXIMUM_INTERVAL_FROM_REQUEST = Meteor.isProduction ? 60 * 1e3 : 1e9; // 1 minute

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
        "content-type": "text/csv"
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

    res.write(
        `"trainingId","name","userId1","userId2","userId3","userId4","userId5","userId6"\n`
    );

    MetaCollection.find().forEach(row => {
        res.write(
            `"${row.createdAtTraining}","${row.name.replace('"', '\\"')}","${row
                .createdBy[0] || ""},"${row.createdBy[1] || ""}","${row
                .createdBy[2] || ""}","${row.createdBy[3] || ""}","${row
                .createdBy[4] || ""},"${row.createdBy[5] || ""}","${row
                .createdBy[6] || ""}\n`
        );
    });

    res.end();
    // res.end(`Booya we got you! Key was ${key}`);
});
