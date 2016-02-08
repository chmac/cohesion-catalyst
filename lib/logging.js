if (Meteor.isServer) {

  // We create a global server logger.
  // cf. [as of 2016-02-05] https://meteorhacks.com/logging-support-for-meteor.html
  // cf. [as of 2016-02-05] https://atmospherejs.com/meteorhacks/npm
  logger = Meteor.npmRequire("winston");

  // We prevent the Winston logger from exiting after logging an uncaughtException.
  logger.exitOnError = false;

  logger.handleExceptions(new logger.transports.File({
    filename: "exceptions.log",
    humanReadableUnhandledException: true
    })
  );

  logger.add(logger.transports.File, {
    filename: "logs.log", // path to file will be .meteor/local/build/programs/server
    level: "info"
  });

  // We add the MongoDB transport, so that we can store logs to a collection
  // in our database (in addition to the 'File' core transport which lets us write
  // the logs to a log file).
  // cf. https://github.com/winstonjs/winston/blob/master/docs/transports.md#mongodb-transport
  // cf. https://github.com/winstonjs/winston-mongodb#usage
  var MongoDB = Meteor.npmRequire("winston-mongodb").MongoDB;

  logger.add(MongoDB, {
    db: process.env.MONGO_URL,
    capped: true,
    collection: "winstonLogs",
    handleExceptions: true,
    humanReadableUnhandledException: true,
    name: 'mongo.mainLogs'
  });


}
