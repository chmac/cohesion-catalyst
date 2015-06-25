// Since we want the "Trainings" collection to be available to the whole app, we omit the variable
// declaration using the "var" keyword. In so doing "Trainings" will be a global variable.
Trainings = new Mongo.Collection("trainings");
