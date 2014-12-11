/**
 * Migração de posts utilizando consulta SQL no drupal
 */

var cwd = process.cwd();
var loadSails = require(cwd + '/bin/loadSails.js');

function init() {
  return loadSails(function afterLoadSails(err, sails) {

    sails.log('Plugin migrate CdP...');
    sails.log('Path cwd: ',cwd);

    var sqlCountAll = "SELECT title FROM node WHERE type = 'post'";

    // Seleciona todos os registros da tabela
    Drupal.query(sqlCountAll,function(err, sqlResultCount ){

      if(err){
        sails.log.error('err: ', err);
        return doneAll(err);
      }
      sails.log.info('Valor toral dos registros na tabela de posts: ', sqlResultCount.length);

      // Calcula o total dividido por 50, para fazer o loop de 50 em 50 registros na tabela de usuários
      var sumTotalFor = Math.round(sqlResultCount.length / 50);
      sails.log.info('A inserção de 50 em 50 registros será feita '+sumTotalFor+' vezes.');

      // Faz um loop para migrar de 50 em 50 itens
      for (iReg = 0; iReg < sumTotalFor; iReg++) {

          // Faz os calculos para pegar o inicio e final da consulta atual
          var iniConsulta = iReg * 50;
          var fimConsulta = (iniConsulta + 50) - 1;
          sails.log.info('Migrando os registros... iniciando no registro '+iniConsulta+' até '+fimConsulta+'.');

          // Monta a consulta para buscar os posts
          var sql = "SELECT "
                    +"node.nid AS post_nid_drupal, "
                    +"node.title AS post_titulo, "
                    +"node.uid AS id_usuario_drupal, "
                    +"node.created AS data_criacao, "
                    +"field_data_body.body_value AS post_body "
                    +"FROM "
                      +"node, "
                      +"field_data_body "
                    +"WHERE "
                      +"node.status <> '0' "
                      +"AND field_data_body.entity_id = node.nid "
                    +"ORDER BY "
                      +"created DESC "
                    +"LIMIT "+iniConsulta+","+fimConsulta;
        
          Drupal.query(sql,function(err, sqlResult ){

            // Caso tenha erros, printa erros
            if(err){
              sails.log.error('Erro Drupal.query: ', err);
              return doneAll(err);
            }

            // Loop nos resultados da consulta atual
            async.each(sqlResult, function( result, done) {
              
              // Verifica se o post existe com findOne
              DrupalMigrate
              .findOne({ uid_conteudo_drupal : result.nid })
              .exec( function(err, postCreated){

                if(postCreated){
                  sails.log.info('Post '+result.post_titulo+' já está criado.'); 
                  return done();
                }

                sails.log.info('Objeto post(result) (resultado da consulta): ', result);

                // Seleciona o id do usuario no wejs para salvar junto ao Post
                /*
                User
                .findOne({ uid_usuario_drupal : result.id_usuario_drupal })
                .exec( function(err, userWejs){
                

                  if(err){
                    sails.log.error('Erro ao selecionar usuario: .'+err); 
                    return done();
                  }


                  sails.log.info('Usuario seleciona para pegar o id no wejs: ', userWejs);
                  return done();
                */
                
                // Verifica se o body nao esta vazio
                if(result.post_body){

                  sails.log.info('Entrou no IF, proximo passo: CRIAR POST...');

                  // Cria o post
                  Post.create({
                    'active': 1,
                    'body': result.post_body,
                    'creator': 1
                  }).exec(function(err, newPost) {
                    if(err){
                      sails.log.error('Erro Post.create: ', err);
                      return done(err);
                    }

                    // Mostra novo post criado
                    sails.log.info('newPost: ', newPost);

                    // Registra migraçao no model DrupalMigrate
                    DrupalMigrate.create({
                      'uid_usuario_drupal': result.id_usuario_drupal,
                      'id_creator': '',
                      'uid_conteudo_drupal': result.post_nid_drupal,
                      'id_conteudo_wejs': newPost.id,
                      'type': 'post'
                    }).exec(function(err, newMigrate){
                      if(err){
                        sails.log.error('Erro DrupalMigrate.create: ', err);
                        return done(err);
                      }
                      sails.log.info('newMigrate: ', newMigrate);
                      done();
                    });
                  });

                } else { // end if result.post_body
                  done();
                }

                }); // end findOne User
              
              /*
              }); // end findOne DrupalMigrate
              */
  
            }, function(err){
                // if any of the file processing produced an error, err would equal that error
                sails.log.error('async.each: ', err);
            });
          }); // End Drupal.query
         
        } // end for

    }); // end Drupal.query sqlCountAll

  });
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