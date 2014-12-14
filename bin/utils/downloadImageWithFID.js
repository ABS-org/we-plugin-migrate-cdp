
var downloadImage = require('./downloadImages.js');

module.exports = function downloadImageWithFID(fid, nodeCreatorId, cb) {
	if(!fid) return cb();

	var sql = "SELECT * FROM `file_managed` WHERE fid=" + fid;
	Drupal.query(sql, function (err, drupalImages) {
		sails.log.info('image data to download', drupalImages);
		if(err) return cb(err);
		var drupalImage = drupalImages[0];
		if(!drupalImage) return cb(null, null);

		var url = getImageUrlFromImageRecord(drupalImage);

		downloadImage(url, nodeCreatorId, cb);
	});
}

function getImageUrlFromImageRecord(drupalImage) {
	return drupalImage.uri.replace('public://', 'https://cursos.atencaobasica.org.br/sites/default/files/');
}