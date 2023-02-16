'use strict'

const xml2js = require('xml2js');
const Cegid = require('../../cegid');
const ReadableErrorHelper = require('../../helpers/readable-error/transfers-readable-error');

class CreateTransferItemsDeliveryManagement extends Cegid {

  /**
   * 
   * @param {object} config - {environment: prod/dev, apikey: Emaar apikey}
   * @return void
   */
  constructor() {
    const options = {
      operation: 'IItemsDeliveryManagementWebService/Create',
      wsdlUrl: `${process.env.APP_CEGID_WSDL_BASE}/TransferItemsDeliveryManagementService.svc`
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
      return ReadableErrorHelper(response, {...body, headerInternalReference: body.orderNumber });
    } catch (error) {
      return error;
    }
  }

  /**
   * 
   * @param {string} date - Transfer date
   * @param {string} orderNumber - Used for 'InternalReference'
   * @param {object} recipient - Fields of storeCode and warehouseCode
   * @param {object} sender - Fields of storeCode and warehouseCode
   * @param {object} items - Array of line items
   * @return {Promise<*>}
   */
  generateBody({date, orderNumber, recipient, sender, items}) {
    const body = {
      'ns:Create': {
        'ns:Request': {
          'ns:Header': {
            'ns:CurrencyId': process.env.APP_CEGID_CURRENCY_ID,
            'ns:Date': date,
            'ns:DocumentTypeToCreate': 'SentTransfer',
            'ns:ExternalReference': orderNumber,
            'ns:InternalReference': orderNumber,
            'ns:Recipient': {
              'ns:StoreId': typeof recipient == 'object' ? recipient.storeCode : '',
              'ns:WarehouseId': typeof recipient == 'object' ? recipient.warehouseCode : ''
            },
            'ns:Sender': {
              'ns:StoreId': typeof sender == 'object' ? sender.storeCode : '',
              'ns:WarehouseId': typeof sender == 'object' ? sender.warehouseCode : ''
            }
          },
          'ns:Lines': {'ns:Line': this.generateLines(items, sender.warehouseCode)}
        },
        'ns:Context': {
          'ns:DatabaseId': process.env.APP_CEGID_DATABASE_ID
        }
      }
    };

    return body;
  }

  generateLines(items, senderWarehouse) {
    let lineItems = [];
    for(let item of items){
      const lineItem = {
        'ns:ItemIdentifier': {
          'ns:Reference': item.sku
        },
        'ns:Quantity': item.quantity,
        'ns:SenderWarehouseId': senderWarehouse,
        'ns:SerialNumberId': item.codentifier,
        'ns:UnitPriceBase': item.price ? item.price : 0
      }
      lineItems.push(lineItem);
    }
    return lineItems;
  }

  parseSuccessResponse = (xml) => {
    return new Promise((resolve) => {
      xml2js.parseString(xml, { trim: true }, function(err, result) {
        if(err) {
          resolve({error: err, xml: xml});
        } else {
          try {
            let documents = result['s:Envelope']['s:Body'][0]['CreateResponse'][0]['CreateResult'][0]['Documents'][0]['Document'];
            let parsedDocs = [];
  
            for (let i = 0; i < documents.length; i++) {
              const item = documents[i]['Key'][0];
              const object = {
                number: item['Number'][0],
                stub: item['Stub'][0],
                type: item['Type'][0],
              }
              parsedDocs.push(object);
            }
  
            resolve({error: false, documents: parsedDocs});
          } catch (error) {
            resolve({error: error, xml: xml});
          }
        }
      });
    });
  }

  parseErrorResponse = (xml) => {
    return new Promise((resolve) => {
      xml2js.parseString(xml, { trim: true }, function(err, result) {
        if(err) {
          resolve({error: err, xml: xml});
        } else {
          try {
            let responseObj = result['s:Envelope']['s:Body'][0]['s:Fault'][0];
            let message = '';
            if ('detail' in responseObj) {
              message =
                responseObj['detail'][0]['CbpExceptionDetail'][0]['InnerException'][0]['InnerException'][0]['InnerException'][0]['InnerException'][0]['Message'][0];
            } else {
              message = responseObj['faultstring'][0]['_'];
            }
            resolve({error: message});
          } catch (error) {
            resolve({xml: xml, error: error.message});
          }
        }
      });
    });
  }
}

module.exports = CreateTransferItemsDeliveryManagement;