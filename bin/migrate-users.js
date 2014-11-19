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

    var sql = 'select name from users limit 0,10';
    Drupal.query(sql,function(err, result ){
      console.warn('err: ', err);
      console.info('result: ', result);
    });

    /*
    sails.log.warn('Plugin migrate CdP...');
    sails.log('Path cwd: ',cwd);

    //Converter Class
    var CSVConverter = require("csvtojson").core.Converter;
    var fs = require("fs");

    var testData = cwd + "/files/migration/migracao_users.csv";
    var data = fs.readFileSync(testData).toString();
    var csvConverter = new CSVConverter();

    //end_parsed will be emitted once parsing finished
    csvConverter.on("end_parsed", function(jsonObj) {
        //final result poped here as normal.
    });

    var usersToSave =  [];

    csvConverter.fromString(data,function(err,jsonObjs){
      var jsonObj = null;
      // Loop in objCsv for construct user array
      for (var i = 0; i < jsonObjs.length; i++) {

        jsonObj =  jsonObjs[i];

        sails.log.info('jsonObj: ', jsonObj);

        var username = String(jsonObj.Nome);
        var userNomeNew = username.toString().toLowerCase();
        userNomeNew = userNomeNew.replace(/[^a-zA-Z ]/g, "");
        userNomeNew = userNomeNew.replace(/\s/g, '');

        var arrayUser = {
          'username' : userNomeNew,
          'password' : 123456,
          'biography' : jsonObj.Bio,
          'email' : jsonObj.Email,
          'displayName' : jsonObj
          /*'birthDate' : jsonObj['Data de nascimento']
        }
        //user.image = jsonObj.Nome;
        //user.password -> Mysql Drupal
        usersToSave.push(arrayUser);
      }


      User.create(usersToSave).exec(function(err, newRecord) {
        console.log('err: ', err);
        console.log('newRecord: ', newRecord);
      });
      // ao terminar rode o doneAll();
      //doneAll();      
    });
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


