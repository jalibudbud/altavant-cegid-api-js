'use strict'

const xml2js = require('xml2js');
const Cegid = require('./../../cegid');
const ReadableErrorHelper = require('../../helpers/readable-error/sales-readable-error');

class CancelSaleDocument extends Cegid {

  /**
   * 
   * @param {object} config - {environment: prod/dev, apikey: Emaar apikey}
   * @return void
   */
  constructor() {
    const options = {
      operation: 'ISaleDocumentService/Cancel',
      wsdlUrl: `${process.env.APP_CEGID_WSDL_BASE}/SaleDocumentService.svc`
    };
    super(options);
  }

  /**
   * 
   * @return {Promise<*>}
   */
  async run(orderNumber) {
    const payload = this.generateBody(orderNumber);
    try {
      const response = await this.send(payload);
      return ReadableErrorHelper(response, { orderNumber });
    } catch (error) {
      return error;
    }
  }

  /**
   * 
   * @param {object} object - Cegid keys based on
   * https://90397237-test-retail-ondemand.cegid.cloud/Y2/Doc/WebService/en/SaleDocumentService.html#op.ID1ESJAC
   * Below is the fields required:
   * orderNumber
   * @return {object} - JSON format of the body
   */
  generateBody(orderNumber) {
    const body = {
      'ns:Cancel': {
        'ns:cancelRequest': {
          'ns:Identifier': {
            'ns:Reference': {
              'ns:CustomerId': { _: process.env.APP_CEGID_CUSTOMER_ID },
              'ns:InternalReference': { _: orderNumber },
              'ns:Type': { _: process.env.APP_CEGID_ORDER_TYPE }
             },
          },
          'ns:ReasonId': { _: process.env.APP_CEGID_CANCELLATION_ID },
        },
        'ns:clientContext': {
          'ns:DatabaseId': { _: process.env.APP_CEGID_DATABASE_ID }
        }
      }
    };

    return body;
  }

  createErrorResponse(response) {
    try {
      let responseObj = [];
      xml2js.parseString(response, { trim: true }, (err, result) => {
        responseObj = result['s:Envelope']['s:Body'][0]['s:Fault'][0];
      });
      let message = '';
      if ('detail' in responseObj) {
        message =
          responseObj['detail'][0]['CbpExceptionDetail'][0]['InnerException'][0][
            'InnerException'
          ][0]['InnerException'][0]['Message'][0];
      } else {
        message = responseObj['faultstring'][0]['_'];
        console.log(80, message);
      }
      this._errorMessage = message;
    } catch (error) {
      this._errorMessage = response;
    }
  }
}

module.exports = CancelSaleDocument;