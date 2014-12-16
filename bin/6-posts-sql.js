/**
 * Migração de posts utilizando consulta SQL no drupal
 */

var cwd = process.cwd();
var loadSails = require(cwd + '/bin/loadSails.js');

function createIfNotExistsOnePost(drupalPost, done) {

    // Verifica se o post existe com findOne
    DrupalMigrate
    .findOne({ uid_conteudo_drupal : drupalPost.nid })
    .exec( function(err, postCreated){

      if(postCreated){
        sails.log.info('Post '+drupalPost.post_titulo+' já está criado.'); 
        return done();
      }

      sails.log.info('Objeto post(drupalPost) (drupalPostado da consulta): ', drupalPost);
      
      // Verifica se o body nao esta vazio
      if(drupalPost.post_body){

        sails.log.info('Entrou no IF, proximo passo: CRIAR POST...');

        // Cria o post
        Post.create({
          'active': 1,
          'body': drupalPost.post_body,
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
            'uid_usuario_drupal': drupalPost.id_usuario_drupal,
            'id_creator': '',
            'uid_conteudo_drupal': drupalPost.post_nid_drupal,
            'id_conteudo_wejs': newPost.id,
            'type': 'post'
          }).exec(function(err, newMigrate){
            if(err){
              sails.log.error('Erro DrupalMigrate.create: ', err);
              return done(err);
            }
            sails.log.info('newMigrate: ', newMigrate);
            return done();
          });
        });

      } else { // end if drupalPost.post_body
        return done();
      }

    }); // end findOne User

}

function init() {
  return loadSails(function afterLoadSails(err, sails) {

    sails.log('Plugin migrate CdP...');
    sails.log('Path cwd: ',cwd);

    var sqlCountAll = "SELECT COUNT(title) FROM node WHERE type = 'post'";

    // Seleciona todos os registros da tabela
    Drupal.query(sqlCountAll,function(err, sqlResultCount ){

      if(err){
        sails.log.error('err: ', err);
        return doneAll(err);
      }
      sails.log.info('Valor toral dos registros na tabela de posts: ', sqlResultCount);

      // Calcula o total dividido por 50, para fazer o loop de 50 em 50 registros na tabela de usuários
      var sumTotalFor = Math.round(sqlResultCount.length / 50);
      sails.log.info('A inserção de 50 em 50 registros será feita '+sumTotalFor + ' vezes.');

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

            async.eachSeries(sqlResult, createIfNotExistsOnePost, doneAll);

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