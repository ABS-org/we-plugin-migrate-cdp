

var cwd = process.cwd();
var loadSails = require(cwd + '/bin/loadSails.js');
var CSVConverter = require('csvtojson').core.Converter;
var fs = require('fs');
var async = require('async');

var user;

function createIfNotExistsOneTag(tagCsv, done) {
  var text = tagCsv.tag;
  if(!text) return done();

  Tag.validateAndCreateTags([text], user.id, done);
}

function init() {
  return loadSails(function afterLoadSails(err, sails) {
    User.findOne({email: 'contato@albertosouza.net'})
    .exec(function(err, u) {
      if(err) return done(err);
      if(!u) return done('User not found');
      user = u;

      sails.log.warn('Plugin migrate CdP...');
      sails.log.debug('Path cwd: ',cwd);

      var testData = cwd + '/files/migration/tags.csv';
      var data = fs.readFileSync(testData).toString();
      var csvConverter = new CSVConverter();

      csvConverter.on('end_parsed', function(jsonObj) {});

      csvConverter.fromString(data , function(err, jsonObjs){
        if(err) return doneAll(err);
        async.each(jsonObjs, createIfNotExistsOneTag, doneAll);
      });

    })
  })
}


function doneAll(err) {
  if ( err ) {
    sails.log.error('Error on create stub data', err);
  }
  //sails.load();
  // end / exit
  process.exit();
}

init();