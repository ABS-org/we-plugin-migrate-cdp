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
var readExcel = require('./utils/readExcelFile.js');

function createIfNotExistsOneRelato(drupalRelato, done) {
	var uid = drupalRelato.uid_usuario;

	if(drupalRelato) sails.log.debug('objeto relato: ', drupalRelato)

	DrupalMigrate.findOne({
		uid_usuario_drupal: uid,
		modelName: 'user'
	})
	.exec(function(err, migrateUserRecord) {
		if(err) return done(err);
		if(!migrateUserRecord) {
			sails.log.warn('Drupal creator not found for migrate the relato', uid, drupalRelato.id );
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

		/*
		*   Verifica o eixo temático e categoriza o relato
		*/
		if (drupalRelato.eixo) {

			switch(drupalRelato.eixo) {
					case '14) Práticas Integrativas e Complementares (PIC) na Atenção Básica':
					case '9) Gestão do cuidado e processo de trabalho':
					case '17) Redes de Atenção à Saúde (RAS)':
					case '3) Ampliação e qualificação da Saúde Bucal na Atenção Básica':
							Term.findOne({text: 'Redes de Atenção à Saúde e Gestão do Cuidado'})
							.exec(function(err, termFind) {
								sails.log.debug('termFind: ', termFind.id);
								newRelato.categorias = [termFind.id];
							});
							break;
					case '1) O Programa Nacional de Melhoria do Acesso e da Qualidade (PMAQ-AB) e a mobilização pela melhoria do cuidado na Atenção Básica':
					case '12) Monitoramento e Avaliação em Atenção Básica':
							Term.findOne({text: 'Monitoramento e Avaliação em Saúde'})
							.exec(function(err, termFind) {
								sails.log.debug('termFind: ', termFind.id);
								newRelato.categorias = [termFind.id];
							});
							break;
					case '11) Humanização na Atenção Básica':
					case '2) Ambiência e estrutura: acesso, qualidade e resolutividade':
							Term.findOne({text: 'Humanização no Sistema Único de Saúde'})
							.exec(function(err, termFind) {
								sails.log.debug('termFind: ', termFind.id);
								newRelato.categorias = [termFind.id];
							});
							break;
					case '15) Promoção da Saúde e Intersetorialidade':
					case '7) Educação em Saúde e Educação Popular em Saúde':
					case '4) Arte, saúde e cuidado':
							Term.findOne({text: 'Intersetorialidade e Promoção da Saúde'})
							.exec(function(err, termFind) {
								sails.log.debug('termFind: ', termFind.id);
								newRelato.categorias = [termFind.id];
							});
							break;
					case '6) Controle social e participação política':
							Term.findOne({text: 'Controle social e participação política'})
							.exec(function(err, termFind) {
								sails.log.debug('termFind: ', termFind.id);
								newRelato.categorias = [termFind.id];
							});
							break;
					case '8) Educação Permanente em Saúde e a interface ensino-serviço na Atenção Básica':
					case '10) Gestão do Trabalho: provimento, vínculo, fixação, carreira e remuneração por desempenho':
							Term.findOne({text: 'Gestão do Trabalho e Educação Permanente em Saúde'})
							.exec(function(err, termFind) {
								sails.log.debug('termFind: ', termFind.id);
								newRelato.categorias = [termFind.id];
							});
							break;
					case '18) Processo de implantação do e-SUS AB e Tecnologias/Sistemas de informação na Atenção Básica':
							Term.findOne({text: 'Tecnologias de Informação na Saúde e Cibercultura'})
							.exec(function(err, termFind) {
								sails.log.debug('termFind: ', termFind.id);
								newRelato.categorias = [termFind.id];
							});
							break;
					case '5) As práticas de Vigilância em Saúde no território da Atenção Básica':
							Term.findOne({text: 'Práticas de Vigilância em Saúde'})
							.exec(function(err, termFind) {
								sails.log.debug('termFind: ', termFind.id);
								newRelato.categorias = [termFind.id];
							});
							break;
					case '19) Trabalho das equipes de Atenção Básica junto a populações específicas e povos indígenas ':
							Term.findOne({text: 'Equidade e Populações Específicas'})
							.exec(function(err, termFind) {
								sails.log.debug('termFind: ', termFind.id);
								newRelato.categorias = [termFind.id];
							});
							break;
			}

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

				sails.log.debug('--------------------------');
				sails.log.debug('salvou relato: ', newRecord);

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

		//var testData = cwd + '/files/migration/migracao_relatos.csv';
		//var testData = cwd + '/files/migration/migracao_relatos_small.csv';
		var filePath = cwd + '/files/migration/migracao_relatos.xlsx';

		readExcel(filePath, function(err, data){
			if(err) return doneAll(err);

			async.each(data, createIfNotExistsOneRelato, doneAll);
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
