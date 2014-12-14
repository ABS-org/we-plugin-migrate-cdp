/**
 * How to use
 * 1.: enter in project folder
 * 2.: run in terminal:
 *    node node_modules/we-plugin-migrate-cdp/bin/7-experiencia-fix-data-creator-sql.js
 */

var cwd = process.cwd();

var moment = require('moment');
var crypto = require('crypto');
var loadSails = require(cwd + '/bin/loadSails.js');
var fs = require('fs');
var async = require('async');


function updateRelatoExperienciaRecord(record, done) {
  
	var creator;
	var relato_migrate;

	async.parallel([
		function getDbUser(cb) {
			DrupalMigrate.findOne({
				uid_usuario_drupal: record.uid,
				modelName: 'user'
			}).exec(function(err, u) {
				if(err) return cb(err);
				creator = u;
				cb();
			})

		},
		function getDbRelato(cb) {
			DrupalMigrate.findOne({
				uid_conteudo_drupal: record.nid,
				modelName: 'relato'
			}).exec(function(err, r) {
				if(err) return cb(err);
				relato_migrate = r;
				cb();
			})
		}		

	], function(err) {
		if(err) return doneAll(err);
		if(!creator || !relato_migrate) {
			sails.log.warn('Creator or relato not found: ', record.uid, record.nid, creator, relato_migrate);
			return done();
		}

		Relato.findOneById(relato_migrate.modelId)
		.exec(function (err, relato) {
			if(err) return done(err);
			if(!relato) {
				return done('Relato not found: ' + relato_migrate.modelId);
			}

			relato.descricao = formatBody(record);
			relato.creator = creator.modelId;
			relato.updatedAt = moment.unix(record.changed).toDate();
			relato.createdAt = moment.unix(record.created).toDate();
			relato.save(function(err){
				if( err ) sails.log.error('Error on save relato', record, relato);

				//sails.log.warn('will save',relato, record )

		    done();	
			})
		});

	})

 };

function formatBody(record) {
	var body = '';
  if (record.field_descricao) {
    body += record.field_descricao;
  }

  if (record.field_experiencia_desenvolvida) {
    body += formatBodyTitle('Qual foi a experiência desenvolvida? Sobre o que Foi?');
    body += record.field_experiencia_desenvolvida ;
  }

  if (record.field_experiencia_funcionamento) {
    body += formatBodyTitle('Como funciona(ou) a experiência?');
    body += record.field_experiencia_funcionamento;
  }

  if (record.field_experiencia_desafios) {
    body += formatBodyTitle('Desafios para o desenvolvimento?');
    body += record.field_experiencia_desafios;
  }

  if (record.field_experiencia_novidades) {
    body += formatBodyTitle('Quais as novidades?');
    body += record.field_experiencia_novidades;
  }

  if (record.field_experiencia_observacoes) {
    body += formatBodyTitle('Outras observações/campo livre');
    body += record.field_experiencia_observacoes;
  }

  return body;
}

function formatBodyTitle(text) {
  return '<h3>' + text + '</h3>';
}


function init() {
  return loadSails(function afterLoadSails(err, sails) {

    sails.log.warn('Plugin migrate CdP...');
    sails.log.debug('Path cwd: ',cwd);

    var sql = "SELECT n.`nid`, n.`type`, n.`uid`, n.`status`, n.`created`,  n.`changed`, n.`tnid`, field_descricao.`field_descricao_value` AS field_descricao, 	field_experiencia_desenvolvida.`field_experiencia_desenvolvida_value` AS field_experiencia_desenvolvida, field_experiencia_funcionamento.`field_experiencia_funcionamento_value` AS field_experiencia_funcionamento, 	field_experiencia_desafios.`field_experiencia_desafios_value` AS field_experiencia_desafios, 	field_experiencia_novidades.`field_experiencia_novidades_value` AS field_experiencia_novidades, 	field_experiencia_observacoes.`field_experiencia_observacoes_value` AS field_experiencia_observacoes FROM `node` AS n	LEFT JOIN `field_data_field_descricao` AS field_descricao ON field_descricao.entity_id=n.nid	LEFT JOIN `field_data_field_experiencia_desenvolvida` AS field_experiencia_desenvolvida ON field_experiencia_desenvolvida.entity_id=n.nid	LEFT JOIN `field_data_field_experiencia_funcionamento` AS field_experiencia_funcionamento ON field_experiencia_funcionamento.entity_id=n.nid	LEFT JOIN `field_data_field_experiencia_desafios` AS field_experiencia_desafios ON field_experiencia_desafios.entity_id=n.nid	LEFT JOIN `field_data_field_experiencia_novidades` AS field_experiencia_novidades ON field_experiencia_novidades.entity_id=n.nid LEFT JOIN `field_data_field_experiencia_observacoes` AS field_experiencia_observacoes ON field_experiencia_observacoes.entity_id=n.nid WHERE `status`=1 AND `type`='experiencia'";

    Drupal.query(sql, function (err, records) {
      if(err) return doneAll(err);
      async.eachSeries(records, updateRelatoExperienciaRecord, doneAll);
    })

  })
}

function doneAll(err) {
  if ( err ) {
    sails.log.error('Error migrate users in cdp', err);
  }

  sails.log.info('DONE ALL');
  //sails.load();
  // end / exit
  process.exit();
}

init();