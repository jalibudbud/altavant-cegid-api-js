'use strict'

const { base64encode } = require('nodejs-base64');
const fetch = require('node-fetch');
const xml2js = require('xml2js');
const builder = new xml2js.Builder();
const errorMsg = require('./error-messages');

class Cegid {
  /**
   * 
   * @param {object} config - {environment: prod/dev, apikey: Emaar apikey}
   * @return void
   */
  constructor(config) {
    const iConfig = {
      userId: process.env.APP_CEGID_USER,
      password: process.env.APP_CEGID_PASSWORD,
      databaseId: process.env.APP_CEGID_DATABASE_ID,
      domain: process.env.APP_CEGID_DOMAIN,
      clientUrl: process.env.APP_CEGID_CLIENT_URL
    }
    config = {...config, ...iConfig};

    if (typeof config !== 'object') {
      throw new Error('Cegid config is null');
    }
    if (typeof config.userId !== 'string') {
      throw new Error('Cegid userId missing!');
    }
    if (typeof config.password !== 'string') {
      throw new Error('Cegid password missing!');
    }
    if (typeof config.databaseId !== 'string') {
      throw new Error('Cegid databaseId missing!');
    }
    if (typeof config.domain !== 'string') {
      throw new Error('Cegid domain missing!');
    }
    if (typeof config.clientUrl !== 'string') {
      throw new Error('Cegid clientUrl missing!');
    }

    // Dynamic config
    if (typeof config.operation !== 'string') {
      throw new Error('Sub Class operation missing!');
    }

    if (typeof config.wsdlUrl !== 'string') {
      throw new Error('Sub Class wsdlUrl missing!');
    }

    this.wsdlUrl = config.wsdlUrl;
    this.databaseId = config.databaseId;

    this.requestObject = {
      'soapenv:Envelope': {
        $: {
          'xmlns:soapenv': 'http://schemas.xmlsoap.org/soap/envelope/',
          'xmlns:ns': config.clientUrl
        },
        'soapenv:Header': {},
        'soapenv:Body': {}
      }
    };

    const auth = base64encode(`${config.domain}\\${config.userId}:${config.password}`);
    this.requestHeader = {
      'Content-Type': 'text/xml; charset=utf-8',
      'Authorization': `Basic  ${auth}`,
      'SOAPAction': `${config.clientUrl}/${config.operation}`
    }
  }

  formatObj(body) {
    this.requestObject['soapenv:Envelope']['soapenv:Body'] = body;
    return this.buildObject(this.requestObject);
  }

  /**
   * 
   * @param {object} config 
   * @return {Promise}
   */
  async send(body) {
    this.requestObject['soapenv:Envelope']['soapenv:Body'] = body;
    const xml = builder.buildObject(this.requestObject);
    return fetch(this.wsdlUrl, {
      method: 'POST',
      headers: this.requestHeader,
      body: xml
    }).then(response => {
      return response.text().then(data => ({
        data: data,
        status: response.status
      }));
    });
  }

  /**
   * 
   * @param {object} config 
   * @return {Promise}
   */
  getConfig() {
    return this;
  }

  /**
   * 
   * @param {string} key 
   * @return {Promise}
   */
   getError(key) {
    if (errorMsg.hasOwnProperty(key)) {
      return errorMsg[key]; 
    }

    return '';
  }
}

module.exports = Cegid;
