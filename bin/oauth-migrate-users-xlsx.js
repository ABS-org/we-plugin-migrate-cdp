/**
 * How to use
 * 1.: enter in project folder
 * 2.: run in terminal:
 *    node node_modules/we-plugin-migrate-cdp/bin/oauth-migrate-users-csv.js
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

var usernameRegex = new RegExp(/^[a-z-9_-]{4,30}$/);

function generateRandonUserName(username) {
  if(!username || typeof username !== 'string') {
    return crypto.randomBytes(8).toString('hex');
  }

  var userNomeNew = username.toString().split('@')[0];
  userNomeNew += crypto.randomBytes(3).toString('hex');
  return userNomeNew;
}





function fix0CPF(cpf, places) {
  if(!cpf) return cpf;
  var zero = places - cpf.toString().length + 1;
  return new Array(+(zero > 0 && zero)).join('0') + cpf;
}

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

    var  cpf = fix0CPF(drupalUser.CPF, 11);

    if(!cpf) cpf = null;

    var userToSave = {
      'displayName': drupalUser['Nome real'],
      'username' : username,
      'biography' : drupalUser.Bio,
      'email' : drupalUser.Email,
      'cpf': fix0CPF(drupalUser.CPF, 11),
      birthDate: date,
      active: true,
      language: 'pt-br',
      gender: drupalUser['Sexo'],
      locationState: parseState(drupalUser['Local da experiência'])
    }

    if(!userToSave.email || !userToSave.cpf) return done();

    User.findOne({
      where: {
        or: [
          { email: userToSave.email,
            cpf: userToSave.cpf
          }
        ]
      }
    }).exec( function(err, existsUser) {
      if(err) return done(err);
      if(existsUser) {
        // skip if exists
        sails.log.info('user exists in db: ', userToSave, existsUser);
        return done();
      }

      User.findOne({ 'username': username})
      .exec( function(err, usernameExists) {
        if(err) return doneAll(err);
        if(usernameExists) userToSave.username += crypto.randomBytes(3).toString('hex');

        User.create(userToSave).exec(function(err, newRecord) {
          if(err) {
            sails.log.error('Error on migrate user:', userToSave, drupalUser);
            return done(err);
          }

          DrupalMigrate.create({
            'uid_usuario_drupal': drupalUser.Uid,
            modelId: newRecord.id,
            modelName: 'user'
          }).exec(function(err, migrateRecord) {
            if (err) return done(err);
            done();
          })
        });
      });
    });

}

function init() {
  return loadSails(function afterLoadSails(err, sails) {

    sails.log.warn('Plugin migrate CdP...');
    sails.log.debug('Path cwd: ',cwd);

    var filePath = cwd + '/files/migration/migracao_users.xlsx';

    readExcel(filePath, function(err, data){
      if(err) return doneAll(err);

      async.each(data, createIfNotExistsOneUser, doneAll);
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

