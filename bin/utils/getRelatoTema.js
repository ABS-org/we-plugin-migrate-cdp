  /*
  *   Verifica o eixo temático e categoriza o relato
  */
module.exports = function getRelatoTema (record, temas) {

  if(!record.field_experiencia_catespecificas) {
    return null;
  }

  switch( Number(record.field_experiencia_catespecificas) ) {
    case 53:
    case 45:
    case 57:
    case 38:
      return temas['Redes de Atenção à Saúde e Gestão do Cuidado'].id;
    case 35:
    case 51:
      return temas['Monitoramento e Avaliação em Saúde'].id;
    case 50:
    case 36:
      return temas['Humanização no Sistema Único de Saúde'].id;
    case 54:
    case 43:
    case 39:
      return temas['Intersetorialidade e Promoção da Saúde'].id;
    case 42:
      return temas['Controle social e participação política'].id;
    case 44:
    case 46:
      return temas['Gestão do Trabalho e Educação Permanente em Saúde'].id;
    case 58:
      return temas['Tecnologias de Informação na Saúde e Cibercultura'].id;
    case 41:
      return temas['Práticas de Vigilância em Saúde'].id;
    case 59:
      return temas['Equidade e Populações Específicas'].id;
      break;
  }
}
