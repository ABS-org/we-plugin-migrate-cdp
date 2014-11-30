/**
 * How to use
 * 1.: enter in project folder
 * 2.: run in terminal:
 *    node node_modules/we-plugin-migrate-cdp/bin/migrate-relatos.js
 */

var cwd = process.cwd();
var async = require('async');

var loadSails = require(cwd + '/bin/loadSails.js');

function init() {
  return loadSails(function afterLoadSails(err, sails) {

    sails.log('Plugin migrate CdP...');
    sails.log('Path cwd: ',cwd);

    var sqlCountAll = "SELECT name FROM users";

    // Seleciona todos os registros da tabela
    Drupal.query(sqlCountAll,function(err, sqlResultCount ){

      if(err){
        sails.log.error('Total de linhas encontradas para usuários: ', sqlResultCount.length);
        return doneAll(err);
      }

      sails.log.info('Valor toral dos registros na tabela de usuários: ', sqlResultCount.length);

      // Calcula o total dividido por 50, para fazer o loop de 50 em 50 registros na tabela de usuários
      var sumTotalFor = Math.round(sqlResultCount.length / 50);
      sails.log.info('A inserção de 50 em 50 registros será feita '+sumTotalFor+' vezes.');

      for (iReg = 0; iReg < sumTotalFor; iReg++) {
          var iniConsulta = iReg * 50;
          var fimConsulta = (iniConsulta + 50) - 1;
          sails.log.info('Migrando os registros... iniciando no registro '+iniConsulta+' até '+fimConsulta+'.');

          var sql = "SELECT "
                    +"users.name AS users_name, "
                    +"users.uid AS uid, "
                    +"users.mail AS users_mail, "
                    +"users.created AS users_created, "
                    +"field_data_field_bio.field_bio_value AS biography, "
                    +"field_data_field_data_de_nascimento.field_data_de_nascimento_day AS birthDate_day, "
                    +"field_data_field_data_de_nascimento.field_data_de_nascimento_month AS birthDate_month, "
                    +"field_data_field_data_de_nascimento.field_data_de_nascimento_year AS birthDate_year, "
                    +"field_data_field_name_first.field_name_first_value AS displayName "
                    +"FROM "
                      +"users, "
                      +"field_data_field_bio, "
                      +"field_data_field_data_de_nascimento, "
                      +"field_data_field_name_first "
                    +"WHERE "
                      +"users.status <> '0' "
                      +"AND users.uid = field_data_field_bio.entity_id "
                      +"AND users.uid = field_data_field_data_de_nascimento.entity_id "
                      +"AND users.uid = field_data_field_name_first.entity_id "
                    +"ORDER BY "
                      +"users_created DESC "
                    +"LIMIT "+iniConsulta+","+fimConsulta+"";
        
        var usersToSave =  [];

        Drupal.query(sql,function(err, sqlResult ){

          if(err){
            sails.log.error('Erro Drupal.query: ', err);
            return doneAll(err);
          } 

          var objUser = [];
          var arrayUser = {};

          // assuming openFiles is an array of file names 
          async.each(sqlResult, function( result, done) {
            // Perform operation on file here.
            User
            .findOne({ uid_drupal : result.uid })
            .exec( function(err, userCreated){

              if(userCreated){
                sails.log.info('Usuário '+result.users_name+' já está criado.'); 
                return done();
              }

              User.create({
                'password' : 123456,
                'uid_drupal' : result.uid,
                'username' : result.users_name.toString(),
                'biography' : result.biography,
                'email' : result.users_mail.toString(),
                'displayName' : result.displayName,
                'birthDate' : result.birthDate_year+'-'+result.birthDate_month+'-'+result.birthDate_day
              }).exec(function(err, newUser) {
                if(err){
                  sails.log.error('Erro User.create: ', err);
                  return done(err);
                }
                sails.log.info('newUser: ', newUser);
                DrupalMigrate.create({
                  'uid_usuario_drupal': newUser.uid_drupal,
                  'id_creator': newUser.id,
                  'uid_conteudo_drupal': '',
                  'id_conteudo_wejs': '',
                  'type': 'user'
                }).exec(function(err, newMigrate){
                  if(err){
                    sails.log.error('Erro DrupalMigrate.create: ', err);
                    return done(err);
                  }
                  sails.log.info('newMigrate: ', newMigrate);
                  done();
                });
              });

            });

          }, function(err){
              // if any of the file processing produced an error, err would equal that error
              sails.log.error('async.each: ', err);
          });

        }); // End Drupal.query

      } // end for

    });

  })
}

function registerMultipleRecordsMigrated(records) {

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


