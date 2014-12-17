var async = require('async');
var cwd = process.cwd();
var loadSails = require(cwd + '/bin/loadSails.js');
var drupalUsers;
var _ = require('lodash');

function init() {
  return loadSails(function afterLoadSails(err, sails) {
  	if(err) return doneAll(err);

  	async.series([
  		createOauthTableIfNotExists,
			getAllDrupalUsers,
			registerAssocIfNotExists
  	],doneAll);
   });
}

function registerAssocIfNotExists(cb) {
	async.eachSeries(drupalUsers, function (drupalUser, next) {
		checkIfHasAssoc(drupalUser.uid, function (err, exists) {
			if(err) {
				sails.log.error('Error on checkIfHasAssoc:', err);
				return next();
			}
			if(exists) {
				sails.log.info('Assoc already exists:', drupalUser.uid)
				return next();
			}

			findIdInProvider(drupalUser, function(err, idInProvider) {
				if(err) {
					sails.log.error('Error on findIdInProvider:', err);
					return next();
				}

				if ( _.isEmpty(idInProvider) ) return next();

				registerIdInProvider(drupalUser.uid, idInProvider, function(err) {
					if(err) {
						sails.log.error('Error on registerIdInProvider:', err);
						return next();						
					}

					sails.log.info('Done save idInProvider to: ', drupalUser.uid, ' idInprovider:',  idInProvider);
					next();
				})
			});
		})
	}, function(err) {
		if(err) sails.log.error('Error on registerAssocIfNotExists:', err);
		cb();
	})
}

function registerIdInProvider(uid, idInProvider, cb) {
	var sql = 'INSERT INTO weoauth (uid, idInProvider) VALUES ('+uid+', '+idInProvider+')';
	Drupal.query(sql, cb);
}

function findIdInProvider(drupalUser, cb) {
	// first try to fint by uid
  DrupalMigrate.findOne({
    'uid_usuario_drupal': drupalUser.uid,
    modelName: 'user'
  }).exec(function(err, migrateRecord) {
    if (err) return cb(err);
    // found
    if(migrateRecord) return cb(null, migrateRecord.modelId);

    User.findOne({
    	email: drupalUser.mail
    }).exec(function(err, user) {
   	  if (err) return cb(err);
	    // found
	    if(migrateRecord) return cb(null, user.id);

	    sails.log.warn('idInProvider not found for user with uid:', drupalUser.uid, ' and email:', drupalUser.mail);
	    return cb();
   	});
  });
}


function checkIfHasAssoc(uid, cb) {
	var sql = 'SELECT uid FROM `weoauth` WHERE uid=' + uid;
	Drupal.query(sql, function(err, exists) {
		if(err) return cb(err);
		if ( _.isEmpty(exists) ) return cb(null, false);
		cb(null, true);
	})
}


function getAllDrupalUsers(cb) {
	var sql = 'SELECT uid, name, mail FROM `users`';
	Drupal.query(sql, function(err, users) {
		if(err) return cb(err);
		drupalUsers = users;
		sails.log.info('Users get:', drupalUsers.length);
		cb();
	})
}

function createOauthTableIfNotExists(cb) {
	var sql = 'CREATE TABLE IF NOT EXISTS weoauth ( uid int NOT NULL, idInProvider int NOT NULL, PRIMARY KEY(uid), UNIQUE(idInProvider))';
	Drupal.query(sql, function(err) {
		if(err) return cb(err);
		sails.log.info('Table weoauth ready');
		return cb();
	});
}

function doneAll(err){
  if ( err ) {
    sails.log.error('Error:', err);
  }

  // end / exit
  process.exit();
}

init();
