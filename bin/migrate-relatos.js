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
    // aqui vc pode acessar o sails com sails e os models pode sails.models[modelname]

    sails.log.warn('Rodo! isso é um debug');
    sails.log('path cwd: ',cwd);

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
    csvConverter.fromString(data,function(err,jsonObj){
        if (err){
          //err handle
        }
        console.log(jsonObj);
    });

    var usersToSave = [];

    // ao terminar rode o doneAll();
    //doneAll();
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


