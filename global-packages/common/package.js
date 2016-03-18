Package.describe({
  name: 'coca:common',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: '',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.1');

  api.use('ecmascript');
  api.use('aldeed:collection2');
  api.use('aldeed:simple-schema');

  api.addFiles([
    'lib/schemas.js',
    'lib/collections/users.js',
    'lib/collections/trainings.js',
    'lib/collections/identifications.js',
    'lib/collections/meta_collection.js',
  ], ['client', 'server']);

  api.addFiles([
    'lib/startup.js'
  ], ['server']);

  api.export('Trainings', ['client', 'server']);
  api.export('Identifications', ['client', 'server']);
  api.export('MetaCollection', ['client', 'server']);
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('coca:common');
  api.addFiles('common-tests.js');
});
