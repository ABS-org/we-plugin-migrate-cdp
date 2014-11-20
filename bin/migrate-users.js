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

    sails.log('Plugin migrate CdP...');
    sails.log('Path cwd: ',cwd);

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
                +"LIMIT 50 OFFSET 0";
    
    Drupal.query(sql,function(err, result ){

      if(err){
        sails.log.warn('err: ', err);
      } else { 
        // Array to push users
        var usersToSave =  [];

        // Loop in result for take users info
        result.forEach(function(objUser) {

            sails.log("User object: ", objUser);

            var arrayUser = {
                'username' : objUser.users_name.toString(),
                'password' : '',
                'biography' : objUser.biography,
                'email' : objUser.users_mail.toString(),
                'displayName' : objUser.displayName,
                'birthDate' : objUser.birthDate_year+'-'+objUser.birthDate_month+'-'+objUser.birthDate_day
              }
            sails.log("arrayUser: ", arrayUser);

            //usersToSave.push(arrayUser);

            User.findOrCreate(arrayUser)
            .exec(function createFindCB(err, record){
              if(err){
                sails.log.warn('findOrCreate err: '+err);
              } else {
                sails.log("record: ", record);
              }
            });

        });
        
      }
      
    });

    /*
    View migracao_user fields:
    'user' AS field_data_field_name_first_user_entity_type, "
    'user' AS field_data_field_name_last_user_entity_type, "
    'user' AS field_data_field_cpf_user_entity_type, "
    'user' AS field_data_field_sexo_user_entity_type, "
    'user' AS field_data_field_data_de_nascimento_user_entity_type, "
    'user' AS field_data_field_bio_user_entity_type, "
    'user' AS field_data_field_facebook_url_user_entity_type, "
    'user' AS field_data_field_linkedin_url_user_entity_type, "
    'user' AS field_data_field_twitter_url_user_entity_type, "
    'user' AS field_data_field_cidade_user_entity_type, "
    'user' AS field_data_field_curriculo_lattes_url_user_entity_type,"
    'user' AS field_data_field_formacao_profissional_user_entity_type,"
    'user' AS field_data_field__maior_grau_da_formacao_user_entity_type, "
    'user' AS field_data_field_perfil_tipo_de_curso_user_entity_type, "
    'user' AS field_data_field_perfil_nome_do_curso_user_entity_type, "
    'user' AS field_data_field_perfil_instituicao_user_entity_type, "
    'user' AS field_data_field_ano_da_conclusao_user_entity_type, "
    'user' AS field_data_field_posso_oferecer_ajuda_em_user_entity_type, "
    'user' AS field_data_field_gostaria_de_aprender_sobre_user_entity_type"
     */

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


