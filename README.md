# cohesion-catalyst

Cohesion Catalyst is a web application aimed at visualizing multicollectivity.  
Developed as part of the [IFAF](http://www.ifaf-berlin.de/projekte/c.cat/)-funded research project [C.Cat - Cohesion Catalyst](http://cohesion-lab.com/).  
For more information about the project and the application 👉 [zollillo.github.io/cohesion-catalyst](https://zollillo.github.io/cohesion-catalyst/)  


Requirements:  __[Meteor](http://guide.meteor.com/#what-is-meteor) version 1.2.1__.  
## Deployment 2019

This has been updated for deployment via docker in 2019. On an Ubuntu (or
probably other linux flavour) machine with docker installed, the following
should be enough to start the app:

```bash
curl https://install.meteor.com/ | sh
./run_docker.sh
```

This will install meteor, build both the `app/` and `admin/` folders and run
them inside a docker container. The various scripts are reasonably self
explanatory. The running apps will be:

- app: http://localhost:3000
- admin: http://localhost:3100

### License
This work is released under the [GNU General Publice License, version 3](http://www.gnu.org/licenses/gpl-3.0.txt).

## Table of Contents

1. [Project structure](#project-structure) :memo:
2. [Local configuration](#local-configuration) :wrench:
3. [Initial data](#initial-data) :baby:
4. [Some notes on deployment](#some-notes-on-deployment) :rocket:
5. [Working with Docker](#working-with-docker) :whale:



## Project structure

The __cohesion-catalyst__ project consists of two [Meteor](http://guide.meteor.com/#what-is-meteor) apps that share the same [MongoDB](https://docs.mongodb.org/manual/introduction/) database. Furthermore, the two applications use the same private (i.e. unpublished) Meteor package that provides common collections and schema definitions. We use [Meteor Up X](https://github.com/arunoda/meteor-up/tree/mupx) to deploy both apps to our own server.

The project structure is as follows:
* `/app` - the _main_ application for regular users
* `/admin` - an admin app for users with admin rights who can control the content in the database.  
* `/global-packages` - location of private Meteor packages  


## Local configuration

In order to let the two applications share the same database and private packages, you need to configure the environment. Since the private packages are located outside of the two application contexts, you need to make it available to Meteor's package manager via the environment variable `PACKAGE_DIRS`. For the admin app the environment variable `MONGO_URL` needs to be set such that it points to the main application database instance. Additionally, it is required to change the `port` the admin app listens on.


#### Setting `PACKAGE_DIRS`

You need to export (i.e. add) the environment variable `PACKAGE_DIRS` to your shell and set it to point to the location of the shared packages.

To accomplish this, add the following to the `.bashrc` file in your home directory:  
```
# Set environment variable to locate shared private packages used with Meteor
export PACKAGE_DIRS="~/path/to/coca-project/global-packages"
```

#### Setting `MONGO_URL`

When you are developing on your local machine and whenever you start the apps locally, run the main app first, then set the `MONGO_URL` environment variable for the admin app right before you start it:  

1. From the command line, inside the main `/app` directory, start the app and the MongoDB driver with the usual command:
<pre>
  <code>$ meteor</code>
</pre>

2. Since MongoDB is listening on port `3001` you can then specify the `MONGO_URL` environment variable for the admin app and set a different port on start using the `--port` flag.  
So, in another shell, from inside your `/admin` app directory use the following commands:
<pre>
  <code>$ MONGO_URL=mongodb://localhost:3001/meteor meteor --port 3100</code>
</pre>


## Initial data
On first-time run of the app (or after a reset), the collections in the database are empty, and we create some initial data.
For example, to access the admin app an admin user is created and stored in the database. Their username is  `admin@example.com`, and the password is `password`.

# Outdated

These notes on deployment are out of date. They're left here only as a pointer in case they're helpful in the future.

> ## Some notes on deployment
> 
> In order to use [Meteor Up X](https://github.com/arunoda/meteor-up/tree/mupx) to deploy both apps you have to create two separate Meteor Up projects in separate directories, each of which containing the specific `mup.json` file for each app.  
> 
> As is the case locally configuring the environment applies for deployment as well.
> 
> Required environment variables for the _main_ app:
> * `PORT`
> * `ROOT_URL`
> * `PACKAGE_DIRS`
> 
> Required environment variables for the admin app:
> * `PORT`
> * `ROOT_URL`
> * `PACKAGE_DIRS`
> * `MONGO_URL`
> 
> #### Note:
> 
> * The admin app should not install MongoDB, so you set `"setupMongo": false` in the `mup.json` file associated with the admin app.
> * `PACKAGE_DIRS` also needs to be exported in `~/.bashrc` on the server. Otherwise, the following error occurs:  
> `error: unknown package in top-level dependencies: coca:common`  
> 
> 
> #### Meteor UP X issue
> 
> Although setting `MONGO_URL` in the admin app's `mup.json` to point to the main application database, the deployment of the admin app fails because connecting to `mongodb:27017` fails.  
> 
> It seems to be a known [issue](https://github.com/arunoda/meteor-up/issues/758) and a workaround fix can be found in [this comment](https://github.com/arunoda/meteor-up/issues/758#issuecomment-164343450).  
> 
> 
> ## Working with Docker
> 
> 
> To get access to the deployed apps you need to work with the [Docker CLI](https://docs.docker.com/engine/reference/commandline/cli/). Therefore, you need to login as root user.  
> 
> E.g., for inspecting the running containers use:
> 
> ```
> $ docker ps
> ```
> 
> 
> To get access to the `log` files of the main application that are written to the `$HOME` directory run the following command (logged in as root)
> 
> ```
> docker exec -it ccat-app bash
> ```
> 
> where `ccat-app` is the name of the running application container (use `docker ps` if you don't know the name). After that, `cd` into the home directory where you will find the `ccat-log` directory.
> 
> See also the information given on the [MUP X project page](https://github.com/arunoda/meteor-up/tree/mupx#accessing-the-database) about accessing  MongoDB.
> 