var XLSX = require('xlsx');

/**
 * Parse one excel file and return as object
 *
 * @TODO add suport for multiples sheets in same file
 *
 * @param  {string}   excel_file
 * @param  {Function} callback
 */
module.exports = function readExcel(excelFile, callback){

  var xlsx = XLSX.readFile(excelFile);
  var sheetCountIndex = xlsx.SheetNames.length - 1;

  xlsx.SheetNames.forEach(function(sheetName, i) {
    var sheetObj = XLSX.utils.sheet_to_row_object_array(xlsx.Sheets[sheetName]);

    if(sheetCountIndex >= i){
      afterGetData(null, sheetObj);
    }

  });

  // return only one data object
  function afterGetData (err, data) {
      callback(err, data);
  }
}
