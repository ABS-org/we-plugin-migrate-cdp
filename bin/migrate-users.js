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

    var testData = cwd + "/files/migration/migracao_users.csv";
    var data = fs.readFileSync(testData).toString();
    var csvConverter = new CSVConverter();

    //end_parsed will be emitted once parsing finished
    csvConverter.on("end_parsed", function(jsonObj) {
        //final result poped here as normal.
    });

    var usersToSave =  [];

    csvConverter.fromString(data,function(err,jsonObj){
        // Loop in objCsv for construct user array
        jsonObj.forEach(function(objCsv) {

            var username = String(objCsv.Nome);
            var userNomeNew = username.toString().toLowerCase();
            userNomeNew = userNomeNew.replace(/[^a-zA-Z ]/g, "");
            userNomeNew = userNomeNew.replace(/\s/g, '');

            var arrayUser = {   'username' : userNomeNew,
                                'biography' : objCsv.Bio,
                                'email' : objCsv.Email,
                                'displayName' : objCsv['User Trusted Contacts']
                                /*'birthDate' : objCsv['Data de nascimento']*/ }
            //user.image = objCsv.Nome;
            //user.password -> Mysql Drupal
            
            // Array push with user info's
            //usersToSave.push(arrayUser);
            console.log("Add user ",arrayUser,"...");
            User.create(arrayUser).exec(function(err, newRecord) {
              console.log('err: ', err);
              console.log('newRecord: ', newRecord);
              //res.log('newRecord: ', newRecord);
              //return newRecord;
            });    
        });
        /*
        User.create(usersToSave).exec(function(err, newRecord) {
          console.log('err: ', err);
          console.log('newRecord: ', newRecord);
          //res.log('newRecord: ', newRecord);
          return newRecord;
        });
        */
        // ao terminar rode o doneAll();
        //doneAll();
    });
    
  })
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


