/**
 * We-plugin-migrate-cdpModel
 *
 * @module      :: Model
 * @description :: [Add info about you model here]
 *
 */

module.exports = {

  schema: true,

  attributes: {

    uid_usuario_drupal: {
      type: 'text'
    },
    id_creator: {
      type: 'text'
    },
    uid_conteudo_drupal: {
      type: 'text'
    },
    id_conteudo_wejs: {
      type: 'text'
    },
    type: {
      type: 'text'
    }

  }
};
