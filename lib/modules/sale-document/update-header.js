'use strict'


const Cegid = require('../../cegid');

class UpdateHeaderSaleDocument extends Cegid {

  /**
   * 
   * @param {object} config - {environment: prod/dev, apikey: Emaar apikey}
   * @return void
   */
  constructor() {
    const options = {
      operation: 'ISaleDocumentService/UpdateHeader',
      wsdlUrl: `${process.env.APP_CEGID_WSDL_BASE}/SaleDocumentService.svc`
    };
    super(options);
  }

  /**
   * 
   * @return {Promise<*>}
   */
  async run(body) {
    const payload = this.generateBody(body);
    try {
      const { data, status } = await this.send(payload);
      return {
        error: status == 200 ? false : data,
        payload: data,
        status: status,
      };
    } catch (error) {
      return { error: error.message, status: 500 };
    }
  }

  /**
   * 
   * @param {object} object - Cegid keys based on
   * https://90397237-test-retail-ondemand.cegid.cloud/Y2/Doc/WebService/en/SaleDocumentService.html#op.ID1E1LAC
   * Below is the fields required:
   * orderNumber
   * @return {object} - JSON format of the body
   */
  generateBody({internalReference, comment, customerId}) {
    const body = {
      'ns:UpdateHeader': {
        'ns:updateHeaderRequest':{
          'ns:Comment': { _: comment },
          'ns:Identifier': {
            'ns:Reference': {
              'ns:CustomerId': { _: customerId ? customerId : process.env.APP_CEGID_CUSTOMER_ID},
              'ns:InternalReference': { _: internalReference},
              'ns:Type': { _: 'Receipt'}
            }
          }
        },
        'ns:clientContext': {
          'ns:DatabaseId': { _: process.env.APP_CEGID_DATABASE_ID }
        }
      }
    };

    if(comment === undefined) {
      delete body['ns:UpdateHeader']['ns:updateHeaderRequest']['ns:Comment'];
    }

    return body;
  }
}

module.exports = UpdateHeaderSaleDocument;