/**
 * How to use
 * 1.: enter in project folder
 * 2.: run in terminal:
 *    node node_modules/we-plugin-migrate-cdp/bin/11-set-relato-autor-as-follower.js
 */

var cwd = process.cwd();

var loadSails = require(cwd + '/bin/loadSails.js');

var async = require('async');

function init() {
  return loadSails(function afterLoadSails(err, sails) {

    sails.log.warn('Plugin migrate CdP starting ser relato authors as follower...');
    sails.log.debug('Path cwd: ', cwd);

    Relato.find()
    .limit(10000)
    .exec(function(err, relatos) {
      if(err) return doneAll(err);
      async.eachSeries(relatos, function (relato, next) {
		    Follow.create({
		      userId: relato.creator,
		      model: 'relato',
		      modelId: relato.id
		    })
		    .exec(function(err) {
		      if (err) {
		        sails.log.error('Error on create flag for relato', relato.id, err);
		      }

		      next();
		    });
      }, doneAll);
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
