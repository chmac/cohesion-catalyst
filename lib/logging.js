
if (Meteor.isClient) {
  // We create a global client side logger object.
  // Approach borrowed from [as of 2016-02-09]:
  // https://www.loggly.com/blog/managing-a-meteor-application-in-production-three-real-log-management-use-cases/
  clientLogger =  {};

  // We define a client side log function which we use to call a Meteor method on the server.
  clientLogger.logInfo = function(data) {
    var timestamp = TimeSync.serverTime(moment());
    Meteor.call("writeLog", timestamp, data);
  };
} // Meteor.isClient



if (Meteor.isServer) {
  // console.log("Node.js Version: ", process.version);
  var homedir = (process.platform === "win32") ? process.env.HOMEPATH : process.env.HOME;

  // We use the 'meteorhacks:npm' package to use npm modules.
  // https://www.npmjs.com/package/fs-extra
  var fse = Meteor.npmRequire("fs-extra");

  // We use 'Npm.require' to use the Node.js core module 'path'.
  var filePath = Npm.require("path");

  var logDirectory = filePath.join(homedir, "ccat-log");

  fse.ensureDirSync(logDirectory);

  // We create a global server logger.
  // cf. [as of 2016-02-05] https://meteorhacks.com/logging-support-for-meteor.html
  // cf. [as of 2016-02-05] https://atmospherejs.com/meteorhacks/npm
  logger = Meteor.npmRequire("winston");


  // We prevent the Winston logger from exiting after logging an uncaughtException.
  logger.exitOnError = false;

  logger.handleExceptions(new logger.transports.File({
    filename: logDirectory + "/ccat_exception.log",
    humanReadableUnhandledException: true
    })
  );

  logger.add(logger.transports.File, {
    level: "info",
    filename: logDirectory + "/ccat_info.log",
    json: false,
    formatter: function(options) {
      // We use the 'formatter' option to return our customized string
      // which will be passed to logger.
      return  (undefined !== options.message ? options.message : "");
    }
  });

  // TODO remove winston console logger!!!!!!

  // We add the MongoDB transport, so that we can store logs to a collection
  // in our database (in addition to the 'File' core transport which lets us write
  // the logs to a log file).
  // cf. https://github.com/winstonjs/winston/blob/master/docs/transports.md#mongodb-transport
  // cf. https://github.com/winstonjs/winston-mongodb#usage
  var MongoDB = Meteor.npmRequire("winston-mongodb").MongoDB;
  // TODO uncomment below to include MongoDB transport 
  // logger.add(MongoDB, {
  //   db: process.env.MONGO_URL,
  //   capped: true,
  //   collection: "winstonLogs",
  //   handleExceptions: true,
  //   humanReadableUnhandledException: true,
  //   name: 'mongo.mainLogs'
  // });


  // We create a method that can be called from the client side in order to
  // send a log from the client to the server.
  Meteor.methods({
    writeLog: function(timestamp, data) {
      var logTime = (undefined !== timestamp) ? moment(timestamp).format("YYYY-MM-DD;HH:mm:ss") : "Date;Time";
      var logMessage = logTime  + ";";
      if (data) {
        logMessage += (data.trainingID || "") + ";";
        logMessage += (data.userID || "") + ";";
        logMessage += (data.username || "") + ";";
        logMessage += (data.view || "") + ";";
        logMessage += (data.action || "") + ";";
        logMessage += (data.target || "") + ";";
        logMessage += (data.tagID || "") + ";";
        logMessage += (data.tagName || "") + ";";
        logMessage += (data.tagLevel || "") + ";";
        logMessage += (data.matchedTag || "") + ";";
        logMessage += (data.metaTagID || "") + ";";
        logMessage += (data.metaTagName || "") + ";";
        logMessage += (data.metaTagCount || "") + ";";
      }
      logger.info(logMessage);
    }
  });

  //  Write column headers
  Meteor.call("writeLog", undefined, {
    trainingID: "TrainingID",
    userID: "UserID",
    username: "Username",
    view: "View",
    action: "Action",
    target: "ActionTarget",
    tagID: "TagID",
    tagName: "TagName",
    tagLevel: "Level",
    matchedTag: "Matched",
    metaTagID: "MetatagID",
    metaTagName: "MetatagName",
    metaTagCount: "Count"
  });
} // Meteor.isServer
