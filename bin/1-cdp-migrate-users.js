/**
 * How to use
 * 1.: enter in project folder
 * 2.: run in terminal:
 *    node node_modules/we-plugin-migrate-cdp/bin/cdp-migrate-users.js
 */

var cwd = process.cwd();

var crypto = require('crypto');
var loadSails = require(cwd + '/bin/loadSails.js');
var uuid = require('node-uuid');
//Converter Class
var CSVConverter = require('csvtojson').core.Converter;
var fs = require('fs');
var async = require('async');

var parseState = require('./utils/parseState.js');
var readExcel = require('./utils/readExcelFile.js');
var validUsername = require('./utils/validUsername.js');
var generateRandonUserName = require('./utils/validUsername.js');
var usernameRegex = new RegExp(/^[a-z0-9_-]{4,30}$/);


function createIfNotExistsOneUser(drupalUser, done) {

  var username;
  if (validUsername(drupalUser.Nome)) {
    username = drupalUser.Nome;
  } else {
    username = generateRandonUserName(drupalUser.Nome);
  }

  var date = null;
  if(drupalUser['Data de nascimento']) {
    var dateSplit = drupalUser['Data de nascimento'].split('/');
    date = new Date(dateSplit[2], dateSplit[1], dateSplit[1]);
  }

  var userToSave = {
    'displayName': drupalUser['Nome real'],
    'username' : username,
    'biography' : drupalUser.Bio,
    'email' : drupalUser.Email,
    //'cpf': fix0CPF(drupalUser.CPF, 11), // cdp dont have cpf
    birthDate: date,
    active: true,
    language: 'pt-br',
    gender: drupalUser['Sexo'],
    locationState: parseState(drupalUser['Local da experiência'])
  }

  if(!userToSave.email || !userToSave.cpf) return done();

  User.findOne({
    email: userToSave.email
  }).exec( function(err, existsUser) {
    if(err) return done(err);
    if(existsUser) {
      // skip if exists
      sails.log.info('user exists in db: ', userToSave, existsUser);
      return done();
    }

    User.create(userToSave).exec(function(err, newRecord) {
      if(err) {
        if(err.invalidAttributes.username) {
          userToSave.username = userToSave.username + crypto.randomBytes(3).toString('hex');
          return User.create(userToSave)
          .exec(function(err, newRecord) {
            if(err) {
              sails.log.warn('>>>Error-on-import-user>>', err, userToSave);
              return done();
            }
            afterCreateUser(drupalUser, newRecord, done);
          });

        }
        sails.log.error('Error on migrate user:', userToSave, drupalUser);
        return done(err);
      } else {
        afterCreateUser(drupalUser, newRecord, done);
      }
    });
  });
}

function afterCreateUser(drupalUser, newRecord, done) {
  DrupalMigrate.create({
    'uid_usuario_drupal': drupalUser.Uid,
    modelId: newRecord.id,
    modelName: 'user'
  }).exec(function(err, migrateRecord) {
    if (err) return done(err);

    sails.log.info('Done import user:',drupalUser.Email , drupalUser.Uid, migrateRecord.id);
    done();
  })
}

function init() {
  return loadSails(function afterLoadSails(err, sails) {

    sails.log.warn('Plugin migrate CdP...');
    sails.log.debug('Path cwd: ',cwd);

    var filePath = cwd + '/files/migration/migracao_users.xlsx';

    readExcel(filePath, function(err, data){
      if(err) return doneAll(err);

      async.eachSeries(data, createIfNotExistsOneUser, doneAll);
    })
  })
}

function doneAll(err) {
  if ( err ) {
    sails.log.error('Error migrate users in cdp', err);
  }
  //sails.load();
  // end / exit
  process.exit();
}

init();

