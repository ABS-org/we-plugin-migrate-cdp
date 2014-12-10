var cwd = process.cwd();

var crypto = require('crypto');
var loadSails = require(cwd + '/bin/loadSails.js');
var fs = require('fs');
var async = require('async');

var readExcel = require('./utils/readExcelFile.js');


function createIfNotExistsOneRecord(drupalComment, done) {

  sails.log.debug('drupalComment: ', drupalComment);
  return '';
  /*
  var recordToSave = {

  }
  */

}


// function afterCreate(dataRecord, newRecord, done) {
//   DrupalMigrate.create({
//     'uid_usuario_drupal': drupalUser.Uid,
//     modelId: newRecord.id,
//     modelName: 'user'
//   }).exec(function(err, migrateRecord) {
//     if (err) return done(err);
//     sails.log.info('Done import user:',drupalUser.Email , drupalUser.Uid, migrateRecord.id);
//     done();
//   })
// }


function init() {
  return loadSails(function afterLoadSails(err, sails) {

    sails.log.warn('Plugin migrate CdP...');
    sails.log.debug('Path cwd: ',cwd);

    var filePath = cwd + '/files/migration/migracao_relatos_comentarios.xlsx';

    readExcel(filePath, function(err, data){
      if(err) return doneAll(err);
      async.eachSeries(data, createIfNotExistsOneRecord, doneAll);
    })
  })
}

function doneAll(err) {
  if ( err ) {
    sails.log.error('Error migrate comentarios dos relatos na cdp', err);
  }

  sails.log.info('DONE ALL');
  //sails.load();
  // end / exit
  process.exit();
}

init();
