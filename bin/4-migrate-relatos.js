/**
 * How to use
 * 1.: enter in project folder
 * 2.: run in terminal:
 *    node node_modules/we-plugin-migrate-cdp/bin/4-migrate-relatos.js
 */

var cwd = process.cwd();

var crypto = require('crypto');
var loadSails = require(cwd + '/bin/loadSails.js');
//Converter Class
var CSVConverter = require('csvtojson').core.Converter;
var fs = require('fs');
var async = require('async');

var parseState = require('./utils/parseState.js');
var readExcel = require('./utils/readExcelFile.js');
var downloadImage = require('./utils/downloadImages.js');

var temas = {};

function createIfNotExistsOneRelato(drupalRelato, done) {
	var uid = drupalRelato.uid_usuario;
  var newRelato = {
    published: true,
    titulo: drupalRelato.titulo,
    descricao: ''
  };

  if (drupalRelato.venda_seu_peixe) {
    newRelato.descricao += drupalRelato.venda_seu_peixe + '<br>';
  }

  if (drupalRelato.sobre_experiencia) {
    newRelato.descricao += '<br><strong>Qual foi a experiência desenvolvida? Sobre o que Foi?</strong><br>';
    newRelato.descricao += drupalRelato.sobre_experiencia + '<br>';
  }

  if (drupalRelato.como_funcionou) {
    newRelato.descricao += '<br><strong>Como funciona(ou) a experiência?</strong><br>';
    newRelato.descricao += drupalRelato.como_funcionou + '<br>';
  }

  if (drupalRelato.novidades) {
    newRelato.descricao += '<br><strong>Quais as novidades?</strong><br>';
    newRelato.descricao += drupalRelato.novidades + '<br>';
  }

  if (drupalRelato.campo_livre) {
    newRelato.descricao += '<br><strong>Outras observações/campo livre</strong><br>';
    newRelato.descricao += drupalRelato.campo_livre + '<br>';
  }

  setRelatoTags(newRelato, drupalRelato);


	// DrupalMigrate.findOne({
	// 	uid_usuario_drupal: uid,
	// 	modelName: 'user'
	// })
	// .exec(function(err, migrateUserRecord) {
	// 	if(err) return done(err);
	// 	if(!migrateUserRecord) {
	// 		sails.log.warn('Drupal creator not found for migrate the relato', uid, drupalRelato.id );
	// 		return done();
	// 	}

    //newRelato.creator = migrateUserRecord.id;
    newRelato.creator = 1;

		if (drupalRelato.local) {
			newRelato.estado = parseState(drupalRelato.local);
		}

		DrupalMigrate.findOne({
			'uid_conteudo_drupal': drupalRelato.id,
			modelName: 'relato'
		})
		.exec(function(err, salved) {
			if(err) return done(err);
			if(salved) return done();

			Relato.create(newRelato)
			.exec(function(err, newRecord) {
        async.parallel([
          function salvarImagemDestaque(cb) {
            if (!drupalRelato['Para começar, uma imagem']) return cb();
            var url = drupalRelato['Para começar, uma imagem'];
            downloadImage(url, newRelato.creator, function(err, image) {
              if (err) return cb(err);
              if(image) {
                newRecord.imagemDestaque = image.id;
              }
              cb();
            })
          },
          function salvarGaleriaDestaque(cb) {
            if(!drupalRelato['Galeria de imagens']) return cb();

            if(!newRecord.images) newRecord.images = [];
            var urls = drupalRelato['Galeria de imagens'].split('||');

            async.each(urls, function (url, nextFile) {
              if(!url) return nextFile(); // skip if url are undefined, bug?
              downloadImage(url, newRelato.creator, function(err, image) {
                if (err) sails.log.error('Error on upload galeria imagem', url);
                if(image) {
                  newRecord.images.push(image.id);
                }
                nextFile();
              })
            }, function(err) {
              if(err) sails.log.error('Error on get relato imagems galeria', err);
              cb();
            })
          },
          function registerMigration(cb) {
            DrupalMigrate.create({
              'uid_conteudo_drupal': drupalRelato.id,
              'id_creator': uid,
              modelId: newRecord.id,
              modelName: 'relato'
            }).exec(cb);
          }
        ], function(err) {
          if (err) sails.log.error('>>>', newRelato.id, 'DrupalID:',drupalRelato.id);
          newRecord.save(function(err) {
            if(err) sails.log.error('Migration: Error on update relato:', err);
            done();
          });
        })
			})
		})
	// })

}

function init() {
	return loadSails(function afterLoadSails(err, sails) {
		sails.log.warn('Plugin migrate CdP...');
		sails.log.debug('Path cwd: ',cwd);

    Term.find().exec(function(err, terms) {
      if(err) return doneAll(err);

      terms.forEach(function(t){
        temas[t.text] = t;
      });

      //var testData = cwd + '/files/migration/migracao_relatos.csv';
      //var testData = cwd + '/files/migration/migracao_relatos_small.csv';
      var filePath = cwd + '/files/migration/migracao_relatos.xlsx';

      readExcel(filePath, function(err, data){
        if(err) return doneAll(err);
        async.eachSeries(data, createIfNotExistsOneRelato, doneAll);
      });
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

  /*
  *   Verifica o eixo temático e categoriza o relato
  */
function setRelatoTags (newRelato, drupalRelato) {
  var tid;
  if (drupalRelato.eixo) {
    switch(drupalRelato.eixo) {
      case '14) Práticas Integrativas e Complementares (PIC) na Atenção Básica':
      case '9) Gestão do cuidado e processo de trabalho':
      case '17) Redes de Atenção à Saúde (RAS)':
      case '3) Ampliação e qualificação da Saúde Bucal na Atenção Básica':
        tid = temas['Redes de Atenção à Saúde e Gestão do Cuidado'].id;
        newRelato.categorias = [tid];
        break;
      case '1) O Programa Nacional de Melhoria do Acesso e da Qualidade (PMAQ-AB) e a mobilização pela melhoria do cuidado na Atenção Básica':
      case '12) Monitoramento e Avaliação em Atenção Básica':
          tid = temas['Monitoramento e Avaliação em Saúde'].id;
          newRelato.categorias = [tid];
          break;
      case '11) Humanização na Atenção Básica':
      case '2) Ambiência e estrutura: acesso, qualidade e resolutividade':
          tid = temas['Humanização no Sistema Único de Saúde'].id;
          newRelato.categorias = [tid];
          break;
      case '15) Promoção da Saúde e Intersetorialidade':
      case '7) Educação em Saúde e Educação Popular em Saúde':
      case '4) Arte, saúde e cuidado':
          tid = temas['Intersetorialidade e Promoção da Saúde'].id;
          newRelato.categorias = [tid];
          break;
      case '6) Controle social e participação política':
          tid = temas['Controle social e participação política'].id;
          newRelato.categorias = [tid];
          break;
      case '8) Educação Permanente em Saúde e a interface ensino-serviço na Atenção Básica':
      case '10) Gestão do Trabalho: provimento, vínculo, fixação, carreira e remuneração por desempenho':
          tid = temas['Gestão do Trabalho e Educação Permanente em Saúde'].id;
          newRelato.categorias = [tid];
          break;
      case '18) Processo de implantação do e-SUS AB e Tecnologias/Sistemas de informação na Atenção Básica':
          tid = temas['Tecnologias de Informação na Saúde e Cibercultura'].id;
          newRelato.categorias = [tid];
          break;
      case '5) As práticas de Vigilância em Saúde no território da Atenção Básica':
          tid = temas['Práticas de Vigilância em Saúde'].id;
          newRelato.categorias = [tid];
          break;
      case '19) Trabalho das equipes de Atenção Básica junto a populações específicas e povos indígenas ':
          tid = temas['Equidade e Populações Específicas'].id;
          newRelato.categorias = [tid];
          break;
    }

  }
}
