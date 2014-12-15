module.exports = function getAltorEAtor(nid, cb) {
  var autores = [];
  var atores = [];

  async.parallel([
    function getAutores(done) {
      var sqlAutor = "SELECT field_experiencia_autornome.field_experiencia_autornome_value AS nome FROM `field_data_field_experiencia_autornome` as field_experiencia_autornome where entity_type='node' and entity_id=" + nid;

      Drupal.query(sqlAutor, function(err, results) {
        if(err) return done(err);
        if(!results || !results.map) return done();
        autores = results.map(function(r){
          return r.nome;
        })
        done();
      })
    },
    function getAtores(done) {
      var sqlAtor = "SELECT field_experiencia_ator_nome.field_experiencia_ator_nome_value FROM `field_data_field_experiencia_ator_nome` as field_experiencia_ator_nome where entity_type='node' and entity_id=" + nid;

      Drupal.query(sqlAtor, function(err, results) {
        if(err) return done(err);
        if(!results || !results.map) return done();
        atores = results.map(function(r){
          return r.nome;
        })
        done();
      })
    }
  ], function(err) {
    if(err) return cb(err);
    return cb(null, autores, atores);
  })
} 
