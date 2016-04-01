
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

  // Based on the user status (i.e. logged-in or logged-out)
  // we start or stop monitoring their activity, respectively.
  Tracker.autorun(function(computation) {
    if (Meteor.userId()) {
      try {
        // 'UserStatus' is provided by 'mizzao:user-status' package.
        // We want automatic monitoring of the client's idle state
        // so we can use this information to schedule our periodic logging.
        UserStatus.startMonitor({
          threshold: 60000,
          interval: 5000,
          idleOnBlur: false
        });
        // computation.stop();
      }
      catch(exception) {
        // ignore
      }
    } else {
      // We want to stop the running monitor if a user logs out.
      if (UserStatus.isMonitoring()) {
        UserStatus.stopMonitor();
      }
    }
  });
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

  // We remove the Console transport which is set by default.
  logger.remove(logger.transports.Console);

  // We prevent the Winston logger from exiting after logging an uncaughtException.
  logger.exitOnError = false;

  logger.handleExceptions(new logger.transports.File({
    filename: logDirectory + "/exception.log",
    humanReadableUnhandledException: true
    })
  );

  logger.add(Meteor.npmRequire('winston-daily-rotate-file'), {
    level: "info",
    filename: logDirectory + "/info.log",
    maxsize: 1024 * 1024 * 10, // 10MB
    datePattern: ".yyyy-MM",
    json: false,
    formatter: function(options) {
      // We use the 'formatter' option to return our customized string
      // which will be passed to logger.
      return  (undefined !== options.message ? options.message : "");
    }
  });


  // We add the MongoDB transport, so that we can store logs to a collection
  // in our database (in addition to the 'File' core transport which lets us write
  // the logs to a log file).
  // cf. https://github.com/winstonjs/winston/blob/master/docs/transports.md#mongodb-transport
  // cf. https://github.com/winstonjs/winston-mongodb#usage
  var MongoDB = Meteor.npmRequire("winston-mongodb").MongoDB;
  // #### Uncomment below to include MongoDB transport! ####
  // logger.add(MongoDB, {
  //   db: process.env.MONGO_URL,
  //   capped: true,
  //   collection: "winstonLogs",
  //   handleExceptions: true,
  //   humanReadableUnhandledException: true,
  //   name: 'mongo.mainLogs'
  // });


  // We create a new logger instance which will handle the logging
  // that will automatically repeat to put information in a file.
  // This logger instance is scheduled via 'Meteor.setInterval'.
  var periodicLogger = new (logger.Logger)();
  periodicLogger.add(Meteor.npmRequire('winston-daily-rotate-file'), {
    level: "info",
    filename: logDirectory + "/periodic.log",
    maxsize: 1024 * 1024 * 10, // 10MB
    datePattern: ".yyyy-MM",
    timestamp: false,
    json: false,
    formatter: function(options) {
      // We use the 'formatter' option to return our customized string
      // which will be passed to logger.
      return (undefined !== options.message ? options.message.toUpperCase() : "") +
        (options.meta && Object.keys(options.meta).length ? " " +
        JSON.stringify(options.meta, null, 2) : "") + "\n" ;
    }
  });

  // We create methods that can be called from the client side in order to
  // send logs from the client to the server.
  Meteor.methods({
    /**
     * Composes the message string that will be written to a log file.
     * The log message will then be passed to the Winston logger instance
     * to handle the logging of user actions.
     * @param {Object} timestamp - The current date/time. When captured on the client
     * it is synced with server time. It is undefined when the method is called
     * to write the column header.
     * @param {Object} data - The information to put in the log message.
     */
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
    },

    /**
     * Retrieves the current cohesion level for each connected user/client and writes the
     * information to a log file.
     * This method is called repeatedly using Meteor.setInterval()
     * @param {Object} timestamp - The current time captured on the server.
     * @param {string} id - The current user's id.
     */
    autoLog: function(timestamp, id) {
      var currentUser = Meteor.users.findOne({_id:id});
      var currentTrainingId = currentUser.profile.currentTraining;

      var networkCursor = MetaCollection.find({
        $nor: [
          {
            createdBy: {
              $exists: false
            }
          }, {
            createdBy: {
              $size: 0
            }
          }, {
            createdBy: {
              $size: 1
            }
          }
        ],
        createdAtTraining: currentTrainingId
      });

      var memberships = _.filter(networkCursor.fetch(), function(a){
        return _.contains(a.createdBy, currentUser._id);
      });

      var groupedMembershipsMap = _.chain(memberships)
        .groupBy(function(a) {
          return a.createdBy.length;
        })
        .map(function(value, key){
          return {
            logDate: moment(timestamp).format("YYYY-MM-DD"),
            logTime: moment(timestamp).format("HH:mm:ss"),
            trainingID: currentTrainingId,
            userID:currentUser._id,
            username:currentUser.profile.name,
            cohesion : key,
            count: _.pluck(value, "_id").length,
            metaTagIds: _.pluck(value, "_id"),
            metaTagNames: _.pluck(value, "name"),
            creators: _.pluck(value, "createdBy")
          };
        })
        .value();

      periodicLogger.info("Cohesion level", groupedMembershipsMap );
    }
  }); // methods

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

  // Initialize the handle to use with 'Meteor.clearInterval()' in order
  // to cancel the repeating function call.
  // HEADS UP: Since we are using 'Meteor.setInterval()' on the server
  // the return value will be of type 'object' (in contrast to a type of
  // 'number' when used on the client).
  var intervalHandle = null;

  UserStatus.events.on("connectionLogin", function(fields) {
    console.log("login");
    if (!fields.userId) {
      return;
    }
    if (intervalHandle) {
      Meteor.clearInterval(intervalHandle);
    }
    intervalHandle = Meteor.setInterval(function() {
      var timestamp = Date.now();
      Meteor.call("autoLog", timestamp. fields.userId);
    }, 5 * 1000);
  });

  UserStatus.events.on("connectionLogout", function(fields) {
    console.log("logout");
    if (intervalHandle) {
      Meteor.clearInterval(intervalHandle);
    }
  });

  UserStatus.events.on("connectionIdle", function(fields) {
        console.log("idle");
    if (intervalHandle) {
      Meteor.clearInterval(intervalHandle);
    }
  });

  UserStatus.events.on("connectionActive", function(fields) {
    console.log("active");
    if (!fields.userId) {
      return;
    }
    if (intervalHandle) {
      Meteor.clearInterval(intervalHandle);
    }
    intervalHandle = Meteor.setInterval(function() {
      var timestamp = Date.now();
      Meteor.call("autoLog", timestamp, fields.userId);
    }, 5 * 1000);
  });
} // Meteor.isServer
