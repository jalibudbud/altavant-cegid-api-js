'use strict'

const Cegid = require('../../cegid');
const Constants = require('../../constants');
const ReadableErrorHelper = require('../../helpers/readable-error/sales-readable-error');

class CreateSaleDocument extends Cegid {

  /**
   * 
   * @param {object} config - {environment: prod/dev, apikey: Emaar apikey}
   * @return void
   */
  constructor() {
    const options = {
      operation: 'ISaleDocumentService/Create',
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
      return ReadableErrorHelper(response, body);
    } catch (error) {
      return error;
    }
  }

  /**
   * 
   * @param {object} object - Cegid keys based on
   * https://90397237-test-retail-ondemand.cegid.cloud/Y2/Doc/WebService/en/SaleDocumentService.html#op.ID1E1IAC
   * Below is the fields required:
   * firstName,
   * lastName,
   * items,
   * headerComment,
   * headerExternalReference,
   * headerInternalReference,
   * headerDate,
   * documentOrigin,
   * documentStore,
   * saleDocumentType,
   * documentWarehouseId,
   * omniChannelDeliveryStoreId,
   * omniChannelPaymentMethodId,
   * paymentsTotalAmount,
   * paymentsOrderDate,
   * paymentsPaymentType
   * @return {object} - JSON format of the body
   */
  generateBody(
    { firstName, lastName, items,
      headerComment, headerExternalReference, headerInternalReference, headerDate,
      documentOrigin, documentStore, saleDocumentType, documentWarehouseId,
      omniChannelDeliveryStoreId, omniChannelPaymentMethodId, omniChannelPaymentStatus,
      paymentsTotalAmount, paymentsOrderDate, paymentsPaymentType, shippingStatus
    }
  ) {
    const body = {
      'ns:Create': {
        'ns:createRequest': {
          'ns:DeliveryAddress': {
            'ns:FirstName': { _: firstName || '' },
            'ns:LastName': { _: lastName || '' }
          },
          'ns:Header': {
            'ns:Active': { _: 1 },
            'ns:Comment': { _: headerComment },
            'ns:CurrencyId': { _: process.env.APP_CEGID_CURRENCY_ID },
            'ns:CustomerId': { _: process.env.APP_CEGID_CUSTOMER_ID },
            'ns:Date': { _: headerDate },
            'ns:ExternalReference': { _: headerExternalReference },
            'ns:InternalReference': { _: headerInternalReference },
            'ns:OmniChannel': {
                'ns:BillingStatus': { _: 'Totally' },
                'ns:DeliveryStoreId': { _: omniChannelDeliveryStoreId },
                'ns:DeliveryType': { _: 'ShipByCentral' },
                'ns:FollowUpStatus': { _: 'Validated' },
                'ns:PaymentMethodId': { _: omniChannelPaymentMethodId },
                'ns:PaymentStatus': { _: omniChannelPaymentStatus || Constants.PAYMENT_STATUS_ENUM.Pending },
                'ns:ReturnStatus': { _: 'NotReturned' },
                'ns:ShippingStatus': { _: shippingStatus || Constants.SHIPPING_STATUS_ENUM.Totally }
            },
            'ns:Origin': { _: documentOrigin },
            'ns:StoreId': { _: documentStore },
            'ns:Type': { _: saleDocumentType },
            'ns:WarehouseId': { _: documentWarehouseId }

          },
          'ns:Lines': {
            'ns:Create_Line':[]
          },
          'ns:Payments': {
            'ns:Create_Payment': {
              'ns:Amount': { _: paymentsTotalAmount || 0 },
              'ns:CurrencyId': { _: process.env.APP_CEGID_CURRENCY_ID },
              'ns:DueDate': { _: paymentsOrderDate },
              'ns:Id': { _: 1 },
              'ns:MethodId': { _: paymentsPaymentType }
            }
          }
        },
        'ns:clientContext': {
          'ns:DatabaseId': { _: process.env.APP_CEGID_DATABASE_ID }
        }
      }
    };

    let lineItems = [];
    for(let item of items){
      lineItems.push({
        'ns:Comment': { _: item.promotionId || '' },
        'ns:ItemIdentifier': {
          'ns:Reference': { _: item.sku || '' } //sku
        },
        'ns:NetUnitPrice': { _: item.finalPrice || 0 },
        'ns:Origin': { _: documentOrigin || '' },
        'ns:Quantity': { _: item.quantity || 0 },
        'ns:SerialNumberId': { _: item.codentifier || '' },
        'ns:UnitPrice': { _: item.originalPrice || 0 }
      });
    }
    body['ns:Create']['ns:createRequest']['ns:Lines']['ns:Create_Line'] = lineItems;

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
        'ns:SerialNumberId': item.codentifier ? item.codentifier : '',
        'ns:UnitPriceBase': item.price ? item.price : 0
      }
      lineItems.push(lineItem);
    }
    return lineItems;
  }
}

module.exports = CreateSaleDocument;