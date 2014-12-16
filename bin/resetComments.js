

var cwd = process.cwd();

var loadSails = require(cwd + '/bin/loadSails.js');

function init() {
  return loadSails(function afterLoadSails(err, sails) {

    sails.log.warn('Plugin migrate CdP starting migrate comments...');
    sails.log.debug('Path cwd: ', cwd);

    DrupalMigrate.destroy({
      modelName: 'comment'
    })
    .exec(function(err) {
      if(err) return doneAll(err);
      // delete all relato comments
      Comment.destroy({
      	modelName: 'relato'
      }).exec(doneAll);
    })
  })
}

function doneAll(err) {
  if ( err ) {
    sails.log.error('Todos os comentários migrados e dos relatos forma deletados', err);
  }

  sails.log.info('DONE ALL');
  //sails.load();
  // end / exit
  process.exit();
}

init();