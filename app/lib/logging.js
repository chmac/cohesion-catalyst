
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
     * @param {string} id - The _id of the first active user who triggered the autolog.
     */
    autoLog: function(timestamp, id) {
      var activeUser = Meteor.users.findOne({_id:id});
      var currentTrainingId = activeUser.profile.currentTraining;

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

      // We find all the users of the current training.
      var networkUsers = Meteor.users.find({"profile.currentTraining": currentTrainingId}, {
        fields: {
          "profile.name": 1
        }
      });

      // We use Meteor's <cursor>.map() function here to retrieve
      // the information about memberships and cohesion level
      // for every user document
      var networkMemberships = networkUsers.map(function(doc) {
        // For each user document we create an object with basic information
        var cohesionInfo = {
          logDate: moment(timestamp).format("YYYY-MM-DD"),
          logTime: moment(timestamp).format("HH:mm:ss"),
          trainingID: currentTrainingId,
          userID: doc._id,
          username: doc.profile.name
        };

        // We use underscore.js to filter out the user-specific network data
        // to retrieve each user's memberships.
        var memberships = _.filter(networkCursor.fetch(), function(item){
          return _.contains(item.createdBy, doc._id);
        });

        // Doing some underscore.js magic:
        // - First we group each of the user's memberships by their
        //   numbers of creators. These values indicate the level of cohesion
        //   and will the keys of the returned object.
        // - Then we map those objects to get the values we want.
        cohesionInfo.groupedMemberships = _.chain(memberships)
          .groupBy(function(item) {
            return item.createdBy.length;
          })
          .map(function(value, key) {
            return {
              cohesion: key,
              count: _.pluck(value, "_id").length,
              metaTag: {
                ids: _.pluck(value, "_id"),
                names: _.pluck(value, "name"),
                creators: _.pluck(value, "createdBy")
              }
            };
          })
          .value();

        return cohesionInfo;
      });

      periodicLogger.info("Cohesion level", networkMemberships);
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

  var statusCount = UserStatus.connections.find({userId: {$exists: true}, idle: false}).count();

  UserStatus.events.on("connectionLogout", function(fields) {
    statusCount = UserStatus.connections.find({userId: {$exists: true}, idle: false}).count();
    // When a user logs out, we need to check if there is
    // no other user left who is active (there may be
    // other logged-in users but they are idle, i.e. they are not active)
    if (statusCount < 1 && intervalHandle) {
      Meteor.clearInterval(intervalHandle);
      intervalHandle = null;
    }
  });

  UserStatus.events.on("connectionIdle", function(fields) {
    statusCount = UserStatus.connections.find({userId: {$exists: true}, idle: false}).count();
    // When a user goes idle we need to check if there is
    // no other user left who is active
    if (statusCount < 1 && intervalHandle) {
      console.log("clearing Interval");
      Meteor.clearInterval(intervalHandle);
      intervalHandle = null;
    }
  });

  UserStatus.events.on("connectionActive", function(fields) {
    // The 'connectionActive' event may also be called when there is
    // no userId (e.g. right after a user has logged out) in which
    // case we are not interested and can return.
    if (!fields.userId) {
      return;
    }

    statusCount = UserStatus.connections.find({userId: {$exists: true}, idle: false}).count();

    if (intervalHandle) {
      // At this point, there is at least one client active and an interval
      // is already scheduled, so we can return here.
      return;
    }

    // We set the interval to call the autoLog method.
    // This will be executed as soon as there is an active user.
    intervalHandle = Meteor.setInterval(function() {
      var timestamp = Date.now();
      Meteor.call("autoLog", timestamp, fields.userId);
    }, 5 * 1000);
  });
} // Meteor.isServer
