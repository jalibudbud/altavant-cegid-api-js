'use strict'


const Cegid = require('../../cegid');

class UpdatePaymentsSaleDocument extends Cegid {

  /**
   * 
   * @param {object} config - {environment: prod/dev, apikey: Emaar apikey}
   * @return void
   */
  constructor() {
    const options = {
      operation: 'ISaleDocumentService/UpdatePayments',
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
      const response = await this.send(payload);
      return response;
    } catch (error) {
      return error;
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
  generateBody({orderType, orderNumber, totalAmount, isReceivedPayment, paymentType, dueDate}) {
    const body = {
      'ns:UpdatePayments': {
          'ns:updatePaymentsRequest':{
            'ns:Identifier': {
              'ns:Reference': {
                'ns:CustomerId': { _: process.env.APP_CEGID_CUSTOMER_ID},
                'ns:InternalReference': { _: orderNumber},
                'ns:Type': { _: orderType}, // This might change
              }
            },
            'ns:Payments': {
              'ns:Update_Payment': {
                'ns:Amount': { _: totalAmount },
                'ns:CurrencyId': { _: process.env.APP_CEGID_CURRENCY_ID },
                'ns:DueDate': { _: dueDate },
                'ns:Id': { _: 1 },
                'ns:MethodId': { _: paymentType },
                'ns:IsReceivedPayment': { _: isReceivedPayment }
              }
            },
            'ns:clientContext': {
              'ns:DatabaseId': { _: process.env.APP_CEGID_DATABASE_ID }
            },
          }
        }
    };

    return body;
  }
}

module.exports = UpdatePaymentsSaleDocument;