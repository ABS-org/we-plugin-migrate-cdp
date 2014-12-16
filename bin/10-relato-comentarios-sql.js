
/**
 * How to use
 * 1.: enter in project folder
 * 2.: run in terminal:
 *    node node_modules/we-plugin-migrate-cdp/bin/10-relato-comentarios-sql.js
 */

var cwd = process.cwd();

var moment = require('moment');
var loadSails = require(cwd + '/bin/loadSails.js');

var async = require('async');
var _ = require('lodash');

function createIfNotExistsOneRecord(migrateRecord, done) {
  var nid = migrateRecord.uid_conteudo_drupal;

  var sql = "SELECT c.cid, c.uid, c.nid, c.created, c.changed ,comment_body.comment_body_value as comment_body FROM `comment` as c LEFT JOIN field_data_comment_body AS comment_body ON entity_type='comment' AND entity_id=c.cid where nid=" + nid + " AND status=1 ORDER BY c.created ASC";
  Drupal.query(sql, function(err, records) {
    if(err) {
      sails.log.error('Error on get comment from drupal db:', err);
      done();
    }

    if( _.isEmpty(records) ) {
      sails.log.info('O Relato com id :', nid, ' não tem comentários');
      return done();
    }

    async.each(records, function(drupalComment, next) {
      DrupalMigrate.findOne({
        'uid_usuario_drupal': drupalComment.uid,
        modelName: 'user'
      }).exec(function (err, userMigrate){
        if(err) {
          sails.log.error('Error on find user to:',drupalComment.uid , err);
          return next();
        }

        if(!userMigrate) {
          sails.log.warn('Comment creator not found in we-cdp', drupalComment.uid);
          return next();
        }

        DrupalMigrate.findOne({
          'uid_conteudo_drupal': drupalComment.cid,
           modelName: 'comment'
        }).exec(function (err, isSalved){
          if(err) {
            sails.log.error('Error on find user to:',drupalComment.uid , err);
            return next();
          }

          if (isSalved) {
            sails.log.info('O comentário já existe', drupalComment.cid);
            return next();
          }

          Comment.create({
            creator: userMigrate.modelId,
            body: drupalComment.comment_body,
            modelName: 'relato',
            modelId: migrateRecord.modelId,
            createdAt: moment.unix(drupalComment.created).toDate(),
            updatedAt: moment.unix(drupalComment.changed).toDate()
          }).exec(function(err, comment) {
            if(err) {
              sails.log.error('Error on create comment', err);
              return next();
            }

            afterCreateOneComment(drupalComment, comment, next);
          });
        });
      })
    }, function (err) {
      if (err) {
        sails.log.error('Erro ao salvar os comentários', err);
      }
      done();
    });
  });

}

function afterCreateOneComment(drupalComment, comment, done) {
  DrupalMigrate.create({
    'uid_usuario_drupal': drupalComment.uid,
    'id_creator': comment.creator,
    'uid_conteudo_drupal': drupalComment.cid,
    modelId: comment.id,
    modelName: 'comment'
  }).exec(function(err, migrateRecord) {
    if (err) {
      sails.log.error('Error on register DrupalMigrate for comment', err);
      return done();
    }
    sails.log.info('Done import on comment:',drupalComment.cid , comment.id, migrateRecord.id);
    done();
  })
}

function init() {
  return loadSails(function afterLoadSails(err, sails) {

    sails.log.warn('Plugin migrate CdP starting migrate comments...');
    sails.log.debug('Path cwd: ', cwd);

    DrupalMigrate.find({
      modelName: 'relato'
    })
    .limit(10000)
    .exec(function(err, migrateRecords) {
      sails.log.warn('conunt', migrateRecords.length);
      if(err) return doneAll(err);
      async.eachSeries(migrateRecords, createIfNotExistsOneRecord, doneAll);
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
