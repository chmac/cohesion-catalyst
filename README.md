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
    For example, given that the private package is located in the directory `/global-packages` and assuming that locally the project exists in a `Code` folder `PACKAGE_DIRS` would point to:  
    `Users/nadja/Code/coca-project/global-packages`


2. Whenever you start the apps locally, run the main app first, then set the `MONGO_URL` environment variable for the admin app right before you start it:  

    1. From the command line, inside the main   `/app` directory, start the app and the MongoDB driver with the usual command:

    <pre>
      <code>$ meteor</code>
    </pre>

    2. Since MongoDB is listening on port `3001` we can then specify the `MONGO_URL` environment variable for the admin app and set a different `port` on start. So, in another shell, from inside your `/admin` app directory use the following commands:

    <pre>
      <code>$ MONGO_URL=mongodb://:localhost:3001/meteor meteor --port 3100</code>
    </pre>


## MUPX deploy configuration

### ToDo
