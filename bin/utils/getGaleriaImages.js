
module.exports = function getGaleriaImages(nid, nodeCreatorId, cb) {
  if(!nid) return cb();

  var sql = "SELECT field.`entity_id` AS nid, field.`field_imagem_fid` AS fid, file.`uri` AS uri FROM `field_data_field_imagem` AS field LEFT JOIN `file_managed` AS file ON file.fid = field.`field_imagem_fid` WHERE field.`entity_id`=" + nid + " AND field.`entity_type`='node'";

  Drupal.query(sql, function(err, recordFiles) {
    if (err) return cb(err);
    if (_.isEmpty(recordFiles)) return cb();
    var images = [];
    async.each(recordFiles, function(drupalFile, next) {
      downloadImageWithFID(drupalFile.fid, nodeCreatorId, function(err, image) {
        if (err) {
          sails.log.error('Error on download image for relato_de_curadoria');
          return next();
        }
        images.push(image);
        next();
      });
    }, function(err) {
      if(err) {
        sails.log.error('Error on get galeria files', err);
        return cb(err);
      }
      cb(null, images);
    });
  })
}