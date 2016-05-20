// https://forums.meteor.com/t/adding-google-fonts/1095
//
// async loader for fonts
// https://github.com/typekit/webfontloader

Meteor.startup(function() {

  WebFontConfig = {
    google: { families: [ 'Short+Stack::latin' ] }
  };
  (function() {
    var wf = document.createElement('script');
    wf.src = 'https://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
    wf.type = 'text/javascript';
    wf.async = 'true';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(wf, s);
    // console.log("async fonts loaded", WebFontConfig);
  })();

});
