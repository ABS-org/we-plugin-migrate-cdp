/**
 * How to use
 * 1.: enter in project folder
 * 2.: run in terminal:
 *    node node_modules/we-plugin-migrate-cdp/bin/cdp-migrate-users.js
 */

var cwd = process.cwd();

var crypto = require('crypto');
var loadSails = require(cwd + '/bin/loadSails.js');
//Converter Class
var CSVConverter = require('csvtojson').core.Converter;
var fs = require('fs');
var async = require('async');

var parseState = require('./utils/parseState.js');


function createIfNotExistsOneRelato(drupalRelato, done) {
  var uid = drupalRelato.uid_usuario;

  if(drupalRelato) sails.log.debug('para_comecar_imagem', drupalRelato)

  DrupalMigrate.findOne({
    uid_usuario_drupal: uid,
    modelName: 'user'
  })
  .exec(function(err, migrateUserRecord) {
    if(err) return done(err);
    if(!migrateUserRecord) {
      //sails.log.warn('Drupal creator not found for migrate the relato', uid, drupalRelato.id );
      return done();
    }

    var newRelato = {
      published: true,
      creator: migrateUserRecord.modelId,
      titulo: drupalRelato.titulo,
      descricao: drupalRelato.venda_seu_peixe
    };

    if (drupalRelato.local) {
      newRelato.estado = parseState(drupalRelato.local);
    }

    DrupalMigrate.findOne({
      uid_conteudo_drupal: drupalRelato.id,
      modelName: 'relato'
    })
    .exec(function(err, salved) {
      if(err) return done(err);
      if(salved) return done();

      Relato.create(newRelato)
      .exec(function(err, newRecord) {
        if(err) return done(err);
        DrupalMigrate.create({
          uid_conteudo_drupal: drupalRelato.id,
          'id_creator': uid,
          modelId: newRecord.id,
          modelName: 'relato'
        }).exec(function(err, migrateRecord) {
          if (err) return done(err);

          done();
        })
      })
    })
  })

}

function init() {
  return loadSails(function afterLoadSails(err, sails) {

    sails.log.warn('Plugin migrate CdP...');
    sails.log.debug('Path cwd: ',cwd);

    var testData = cwd + '/files/migration/migracao_relatos.csv';
    //var testData = cwd + '/files/migration/migracao_relatos_small.csv';

    var data = fs.readFileSync(testData).toString();
    var csvConverter = new CSVConverter();

    csvConverter.on("end_parsed", function(jsonObj) {
        //final result poped here as normal.
    });

    csvConverter.fromString(data , function(err, jsonObjs){
      if(err) return doneAll(err);
      async.each(jsonObjs, createIfNotExistsOneRelato, doneAll);
    });
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
