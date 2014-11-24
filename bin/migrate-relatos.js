/**
 * How to use
 * 1.: enter in project folder
 * 2.: run in terminal:
 *    node node_modules/we-plugin-migrate-cdp/bin/migrate-relatos.js
 */

var cwd = process.cwd();

var loadSails = require(cwd + '/bin/loadSails.js');

function init() {
  return loadSails(function afterLoadSails(err, sails) {
    sails.log.warn('Plugin migrate CdP...');
    sails.log('Path cwd: ',cwd);

    //Converter Class
    var CSVConverter = require("csvtojson").core.Converter;
    var fs = require("fs");

    var testData = cwd + "/files/migration/migracao_relatos.csv";
    var data = fs.readFileSync(testData).toString();
    var csvConverter = new CSVConverter();

    //end_parsed will be emitted once parsing finished
    csvConverter.on("end_parsed", function(jsonObj) {
        //final result poped here as normal.
    });

    var relatosToSave =  [];

    csvConverter.fromString(data,function(err, relatoObjs){
      
      var jsonObj = null;

      // Loop in objCsv for construct relato array
      for (var i = 0; i < relatoObjs.length; i++) {

        //sails.log.info('jsonObj: ', relatoObjs[i]);
        //sails.log.info('relatoObjs keys:', Object.keys(relatoObjs[i]));

        User.find()
        .where({ uid_drupal: relatoObjs[i].uid_usuario })
        .exec(function (err, response) {
            sails.log('response find uid_drupal: ', response);

            var arrayRelatoAll = {
              'creator' : relatoObjs[i].uid_usuario,
              'uid_usuario' : relatoObjs[i].uid_usuario,
              'titulo' : relatoObjs[i].titulo,
              'venda_seu_peixe' : relatoObjs[i].venda_seu_peixe,
              'para_comecar_imagem' : relatoObjs[i].para_comecar_imagem,
              'ambito_experiencia' : relatoObjs[i].ambito_experiencia,
              'topicos' : relatoObjs[i].topicos,
              'sobre_experiencia' : relatoObjs[i].sobre_experiencia,
              'como_funcionou' : relatoObjs[i].como_funcionou,
              'desafios' : relatoObjs[i].desafios,
              'novidades' : relatoObjs[i].novidades,
              'campo_livre' : relatoObjs[i].campo_livre,
              'galeria_imagens' : relatoObjs[i].galeria_imagens,
              'nome_pessoas' : relatoObjs[i].nome_pessoas,
              'categorias_relato' : relatoObjs[i].categorias_relato,
              'nome_pessoas' : relatoObjs[i].nome_pessoas,
              'categoria_profissao' : relatoObjs[i].categoria_profissao,
              'pontos_envolvidos' : relatoObjs[i].pontos_envolvidos,
              'local' : relatoObjs[i].local,
              'estado' : relatoObjs[i].estado,
              'comunidades' : relatoObjs[i].comunidades
            };

        });        

        var arrayRelatoWe = {
              'uid_usuario' : relatoObjs[i].uid_usuario,
              'titulo' : relatoObjs[i].titulo,
              'descricao' : relatoObjs[i].sobre_experiencia,
              'local' : relatoObjs[i].local
            };
        
        //sails.log.info('arrayRelato:', arrayRelatoWe);

        relatosToSave.push(arrayRelatoWe);

      } // end for

      
      Relato.create(relatosToSave).exec(function(err, newRecord) {
        console.log('err: ', err);
        console.log('newRecord: ', newRecord);
      });
      
      // ao terminar rode o doneAll();
      //doneAll();
    });
  });
}

function doneAll(err){
  if ( err ) {
    sails.log.error('Error on create stub data', err);
  }
  //sails.load();
  // end / exit
  process.exit();
}

init();


