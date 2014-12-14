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
var _ = require('lodash');
var getRelatoTema = require('./utils/getRelatoTema.js');
var downloadImageWithFID = require('./utils/downloadImageWithFID.js');
var temas = {};

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
    .populate('images')
		.exec(function (err, relato) {
			if(err) return done(err);
			if(!relato) {
				return done('Relato not found: ' + relato_migrate.modelId);
			}

      var fid = record.field_escolher_fotografia_imagem;
      if (relato.imagemDestaque) {
        fid = null; // set to null for skip image download if already has this image
      }

      downloadImageWithFID(fid, creator.modelId, function(err, image) {
        if (err) {
          sails.log.error('Error on download image for relato_de_curadoria');
          return done();
        }

        if (image && image.id) {
          relato.imagemDestaque = image.id;  
        }

        var nid = record.nid;
        if ( !_.isEmpty(relato.images) ) {
          nid = null; // skip if already has images 
        }

        getGaleriaImages(nid, creator.modelId, function(err, images) {
          if(err) sails.log.error('Error on get geleria images', record);

          relato.images = images.map(function(i) {
            return i.id;
          });

          if (record.title_field_value) relato.titulo = record.title_field_value;

          if ( record.field_experiencia_catespecificas ) {
            relato.categorias = [getRelatoTema(record, temas)];  
          }

          relato.descricao = formatBody(record);
          relato.creator = creator.modelId;
          relato.updatedAt = moment.unix(record.changed).toDate();
          relato.createdAt = moment.unix(record.created).toDate();
          relato.save(function(err){
            if( err ) sails.log.error('Error on save relato_de_curadoria', record, relato);
            sails.log.warn('will save',relato, record);
            //done(); 
          })
        })
      })
		});
	})
 };

function getGaleriaImages(nid, nodeCreatorId, cb) {
  if(!nid) return cb();

  var sql = "SELECT field.`entity_id` AS nid, field.`field_imagem_curadoria_fid` AS fid, file.`uri` AS uri FROM `field_data_field_imagem_curadoria` AS field LEFT JOIN `file_managed` AS file ON file.fid = field.`field_imagem_curadoria_fid` WHERE field.`entity_id`=" + nid + " AND field.`bundle`='relato_de_curadoria'";

  Drupal.query(sql, function(err, recordFiles) {
    if (err) return cb(err);
    if (_.isEmpty(err)) return cb();
    var images = [];
    async.each(recordFiles, function(drupalFile, next) {
      downloadImageWithFID(drupalFile.fid, nodeCreatorId, function(err, image) {
        if (err) {
          sails.log.error('Error on download image for relato_de_curadoria');
          return done();
        }
        images.push(images);
        next();
      });
    }, function(err) {
      if(err) {
        sails.log.error('Error on get galeria files', err);
        return cb(err);
      }
      cb(null, images);
    });
  })
}

function formatBody(record) {
	var body = '';
  if (record.field_resumo_do_relato) {
    body += record.field_resumo_do_relato;
  }

  if (record.field_2_conte_a_sua_hist_ria_500) {
    body += formatBodyTitle('Conte a sua história');
    body += record.field_2_conte_a_sua_hist_ria_500 ;
  }

  if (record.field_como_funcionou_a_experi_nc) {
    body += formatBodyTitle('Tem alguma música, cordel, objeto ou poesia que você poderia compartilhar e que seja importante nessa sua experiência?');
    body += record.field_como_funcionou_a_experi_nc;
  }

  if (record.field_4_tem_alguma_musica_objeto) {
    body += formatBodyTitle('Efeitos da Curadoria: O que você aprendeu com essa experiência?');
    body += record.field_4_tem_alguma_musica_objeto;
  }

  if (record.field_5_o_que_voc_acha_que_apren) {
    body += formatBodyTitle('Das Fragilidades às Potencialidades do Processo de Curadoria');
    body += record.field_5_o_que_voc_acha_que_apren;
  }

  if (record.field_6_outras_observa_es_campo_) {
    body += formatBodyTitle('Outras Observações/Campo Livre');
    body += record.field_6_outras_observa_es_campo_;
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

    // preload terms
    Term.find().exec(function(err, terms) {
      if(err) return doneAll(err);
      if( _.isEmpty(terms) ) return doneAll('Nenhum tema encontrado');

      terms.forEach(function(t){
        temas[t.text] = t;
      });

    var sql = "SELECT n.`nid`, n.`type`, n.`uid`, n.`status`,  n.`created`,  n.`changed`, n.`tnid`,  title_field.`title_field_value` AS title, field_resumo_do_relato.`field_resumo_do_relato_value` AS field_resumo_do_relato, field_2_conte_a_sua_hist_ria_500.`field_2_conte_a_sua_hist_ria_500_value` AS field_2_conte_a_sua_hist_ria_500, field_como_funcionou_a_experi_nc.`field_como_funcionou_a_experi_nc_value` AS field_como_funcionou_a_experi_nc, field_4_tem_alguma_musica_objeto.`field_4_tem_alguma_musica_objeto_value` AS field_4_tem_alguma_musica_objeto, field_5_o_que_voc_acha_que_apren.`field_5_o_que_voc_acha_que_apren_value` AS field_5_o_que_voc_acha_que_apren, field_6_outras_observa_es_campo_.`field_6_outras_observa_es_campo__value` AS field_6_outras_observa_es_campo_, field_premiado_na_v_mostra.`field_premiado_na_v_mostra_value` AS field_premiado_na_v_mostra, field_experiencia_catespecificas.`field_experiencia_catespecificas_tid` AS  field_experiencia_catespecificas, field_escolher_fotografia_imagem.`field_escolher_fotografia_imagem_fid` AS field_escolher_fotografia_imagem FROM `node` AS n LEFT JOIN `field_data_field_escolher_fotografia_imagem` AS field_escolher_fotografia_imagem ON field_escolher_fotografia_imagem.entity_id=n.nid LEFT JOIN `field_data_field_experiencia_catespecificas` AS field_experiencia_catespecificas ON field_experiencia_catespecificas.entity_id=n.nid LEFT JOIN `field_data_title_field` AS title_field ON title_field.entity_id=n.nid         LEFT JOIN `field_data_field_resumo_do_relato` AS field_resumo_do_relato ON field_resumo_do_relato.entity_id=n.nid        LEFT JOIN `field_data_field_2_conte_a_sua_hist_ria_500` AS field_2_conte_a_sua_hist_ria_500 ON field_2_conte_a_sua_hist_ria_500.entity_id=n.nid LEFT JOIN `field_data_field_como_funcionou_a_experi_nc` AS field_como_funcionou_a_experi_nc ON field_como_funcionou_a_experi_nc.entity_id=n.nid LEFT JOIN `field_data_field_4_tem_alguma_musica_objeto` AS field_4_tem_alguma_musica_objeto ON field_4_tem_alguma_musica_objeto.entity_id=n.nid LEFT JOIN `field_data_field_5_o_que_voc_acha_que_apren` AS field_5_o_que_voc_acha_que_apren ON field_5_o_que_voc_acha_que_apren.entity_id=n.nid LEFT JOIN `field_data_field_6_outras_observa_es_campo_` AS field_6_outras_observa_es_campo_ ON field_6_outras_observa_es_campo_.entity_id=n.nid LEFT JOIN `field_data_field_premiado_na_v_mostra` AS field_premiado_na_v_mostra ON field_premiado_na_v_mostra.entity_id=n.nid WHERE `status`=1 AND `type`='relato_de_curadoria'";

    Drupal.query(sql, function (err, records) {
      if(err) return doneAll(err);
      async.eachSeries(records, updateRelatoExperienciaRecord, doneAll);
    })
    
    }) // end preload terms

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
