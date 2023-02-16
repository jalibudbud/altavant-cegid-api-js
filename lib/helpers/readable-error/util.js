const withRedableError = ({ foundKeywords, cegidResponse, requestBody }) => {
  const keywordMeta = foundKeywords[0];

  try {
    cegidResponse['data'] = keywordMeta.readableError(requestBody, cegidResponse.data);
  } catch (e) {
    // 
  }

  return cegidResponse;
}

const scan = ({ cegidResponse, requestBody, keywords }) => {
  if(cegidResponse.status == 200) return cegidResponse;

  const { data, status } = cegidResponse;
  const foundKeywords = keywords.concat(MAIN_KEYWORDS).filter(({ keyword }) => data.includes(keyword));

  if(foundKeywords.length) {
    return withRedableError({ foundKeywords, cegidResponse, requestBody });
  }

  return cegidResponse;
}

const MAIN_KEYWORDS = [
  {
    'keyword': 'This document already exists and cannot be re-integrated',
    'readableError': ({ headerInternalReference }) => {
      return `Unable to create order. Reference ${headerInternalReference} already exist in Cegid. Please use a unique reference for new orders.`;
    }
  },
  {
    'keyword': 'Serial number is not available in inventory',
    'readableError': ({ items }, cegidXmlResponse) => {
      try {
        const unavailableSerial = Object.values(items)
        .filter(({ codentifier }) => cegidXmlResponse.includes(codentifier))
        .map(({ codentifier }) => codentifier)[0];

        return `Unable to create order. Serial number ${unavailableSerial} is not available in the inventory.`;
      } catch (error) {
        return cegidXmlResponse;
      }
    }
  }
];

module.exports = { scan };