var request = require('request');
var fs = require('fs');
var uuid = require('uuid');
var path = require('path');

module.exports = function downloadImage(url, creatorId, callback){
  try {
    request.head(url, function(err, res){
      if(err){
        sails.log.error('Error on download image:',url,err,res);
        return callback(err);
      }

      var image = {};
      image.mime = res.headers['content-type'];
      image.size = res.headers['content-length'];
      image.originalFilename = url;
      image.filename = uuid.v1();
      image.newName = image.filename;

      image.active = true;
      image.creator = creatorId;

      image.extension = image.originalFilename.split('.').pop();

      image.extension = 'jpg';

      image.filename += '.' + image.extension;
      image.name = image.filename;
      // fix drupal crazy filename
      image.name = image.name.replace('/', '_');

      var newFilePath = path.resolve(sails.config.imageUploadPath + '/' + 'original' + '/' + image.name);

      request(url)
      .pipe(fs.createWriteStream(newFilePath))
      .on('close', function() {
        Images.create(image).exec(function(error, salvedFile) {
          if (err) {
            sails.log.error('Error on create image', err);
            return callback(err);
          }
          sails.log.warn('salvedFile file', salvedFile)
          callback(null, salvedFile);
        });

      });
    });
  } catch (e) {
    sails.log.error('>> error on download image', e, url);
    callback();
  }
}