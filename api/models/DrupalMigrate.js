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

    node_id: {
      type: 'string',
      required: true
    },
    relato_id: {
    	model: 'relato'
    }

  }
};
