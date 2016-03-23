# C.Cat - Cohesion Catalyst <small>(coca-project)</small>

Cohesion Catalyst is a web application built with [Meteor](http://guide.meteor.com/#what-is-meteor), a full-stack JavaScript platform for modern web and mobile applications.  

The __coca-project__ consists of two Meteor apps that share the same [MongoDB](https://docs.mongodb.org/manual/introduction/) database:
1. a _main_ application for regular users
2. an admin app for special users with admin rights who can control the content in the database.  

In order to let these two applications share the same data, we need to set the environment variable `MONGO_URL` of the admin app such that it points to the main application database instance. Additionally, it is required to change the `port` the admin app listens on (defaults to `3000`).  

Furthermore, the two applications use the same (private) package that provides common collections and schema definitions. Since this package is located outside of the two application contexts we need to make it available for Meteor via the environment variable `PACKAGE_DIRS`.

## Local configuration
(i.e. for developing on your local machine)  

1. Export the environment variable `PACKAGE_DIRS` to your shell and set it to point to the location of the shared packages.  

    To accomplish this, add the following to your `~/.bash_profile` file:  
    ```
    # Set environment variable to locate shared private packages used with Meteor
    export PACKAGE_DIRS="$HOME/path/to/shared-packages-directory"
    ```
    For example, given that the private package is located in the directory `/global-packages` and assuming that locally the project exists in a `Code` folder `PACKAGE_DIRS` would point to     `Users/nadja/Code/coca-project/global-packages`  

2. Whenever you start the apps locally, run the main app first, then set the `MONGO_URL` environment variable for the admin app right before you start it:  

    1. From the command line, inside the main   `/app` directory, start the app and the MongoDB driver with the usual command:
    <pre>
      <code>$ meteor</code>
    </pre>

    2. Since MongoDB is listening on port `3001` we can then specify the `MONGO_URL` environment variable for the admin app and set a different `port` on start. So, in another shell, from inside your `/admin` app directory use the following commands:
    <pre>
      <code>$ MONGO_URL=mongodb://localhost:3001/meteor meteor --port 3100</code>
    </pre>


## Deployment configuration
We use [Meteor Up X](https://github.com/arunoda/meteor-up/tree/mupx) to deploy both apps to our own server. In order to do so we have to create two separate Meteor Up projects in separate directories, each of which containing the specific configuration for each app.

Required environment variables for the _main_ app:
* `PORT`
* `ROOT_URL`
* `PACKAGE_DIRS`

Required environment variables for the admin app:
* `PORT`
* `ROOT_URL`
* `PACKAGE_DIRS`
* `MONGO_URL`

The admin app doesn't need to install MongoDB so we set `"setupMongo": false`.

### Example mup.json for the admin app
```javascript
{
  // Server authentication info
  "servers": [
    {
      "host": "<hostname>",
      "username": "root",
      //"password": "password",
      // prefer pem file (ssh based authentication)
      "pem": "~/.ssh/id_rsa"
    }
  ],

  // Install MongoDB on the server. Does not destroy the local MongoDB on future setups
  "setupMongo": false,

  // WARNING: Node.js is required! Only skip if you already have Node.js installed on server.
  "setupNode": true,

  // WARNING: If nodeVersion omitted will setup 0.10.36 by default. Do not use v, only version number.
  "nodeVersion": "0.10.40",

  // Install PhantomJS in the server
  "setupPhantom": true,

  // Application name (no spaces).
  "appName": "ccat_admin",

  // Location of app (local directory).
  "app": "../../admin",

  // Configure environment
  "env": {
    "PORT": 8000,
    "ROOT_URL": "<url>",
    "PACKAGE_DIRS": "../../global-packages",
    "MONGO_URL": "mongodb://127.0.0.1/meteor"
  },

  // Meteor Up checks if the app comes online just after the deployment.
  // Before mup checks that, it will wait for the number of seconds configured below.
  "deployCheckWaitTime": 15,

  // show a progress bar while uploading.
  // Make it false when you deploy using a CI box.
  "enableUploadProgressBar": true,

  "buildOptions": {
    // build with the debug mode on
    "debug": true
  }
}
```
