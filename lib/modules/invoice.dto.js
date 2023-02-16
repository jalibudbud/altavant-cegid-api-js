'use strict'

const Fatoora = require(`${GLOBAL_SERVICE_PATH}/fatoora.service`);
const ProductJSONReader = require(`${GLOBAL_SERVICE_PATH}/product-json-reader.service`);
const { COMPANY_DETAILS: {VAT_ID, COMPANY_NAME} } = require(`${GLOBAL_HELPERS_PATH}/constants.helper`);
const _ = require('lodash');
const moment = require('moment-timezone');
moment.tz.setDefault(process.env.APP_TIMEZONE);
const Util = require('../util');
const TAX = 1.15; // 15% VAT
const REPLACEMENT = 'replacement';
const SALE = 'sale';
const RETURN = 'return';
const documentTypes = [REPLACEMENT, SALE, RETURN];

class InvoiceDTO {
  
  constructor(payload, type) {
    this.products = [];
    this.payload = payload;

    if(documentTypes.indexOf(type) >= 0) {
      this.type = type;
    }
  }

  async init() {
    await this.getProductList();
    this.generateInvoiceData(this.payload);
  }

  generateInvoiceData(payload) {
    const {DeliveryAddress, Lines, Header, Payments} = this.mapPayload(payload);
    let paymentData = {'paymentMethod': '', 'paymentAmount': ''};

    if('Get_Payment' in Payments) {
      paymentData = {
        'paymentMethod': Util.getPaymentMethod(Payments['Get_Payment']['Code'][0]),
        'paymentAmount': parseFloat(Payments['Get_Payment']['Amount'][0]).toFixed(2)
      };
    }

    const invoice = {
      customerName: `${DeliveryAddress['FirstName']} ${DeliveryAddress['LastName']}`,
      receiptNumber: Header['Key']['Number'][0],
      date: moment(Header['Date']).format('MMM DD, YYYY'),
      time: moment().format('h:mm A'),
      items: [],
      internalReference: Header['InternalReference'],
      taxExcludedTotalAmount: parseFloat(Header['TaxExcludedTotalAmount']).toFixed(2),
      taxIncludedTotalAmount: parseFloat(Header['TaxIncludedTotalAmount']).toFixed(2),
      vat: parseFloat(Header['TaxIncludedTotalAmount'] - Header['TaxExcludedTotalAmount']).toFixed(2),
      currency: Header['CurrencyId'],
      comment: Header.comment || SALE,
      ...paymentData
    };

    // Generate file meta
    invoice['pdfFileMeta'] = {
      date: moment(invoice.date, 'MMM DD, YYYY').format('YYYYMMDD'), invoiceNumber: invoice.receiptNumber, storeCode: Header['StoreId'], origin: Header['Origin']
    }

    // Parsed line items
    invoice['items'] = this.parseLines(Lines);

    // Generate document type. Enums = [sales, replacement, return]
    if(!this.type) {
      invoice['type'] = this.identifyType(invoice);
    }

    // Identify if replacement once type is identified
    invoice['isReplacement'] = this.type == REPLACEMENT;

    // Generate header title once type is identified
    invoice['headerTitle'] = this.generateInvoiceTitle();

    // Populate custom fields
    invoice['totalQuantity'] = _.sumBy(invoice.items, (o) => { return parseFloat(o.Quantity); });
    invoice['totalOriginalAmount'] = invoice.items.reduce((sum, item) => {
      return sum + parseFloat(item.totalOriginalAmount);
    }, 0).toFixed(2);
    invoice['totalDiscount'] = parseFloat(invoice['totalOriginalAmount'] - Header['TaxIncludedTotalAmount']).toFixed(2);
    invoice['VAT'] = parseFloat(Header['TaxIncludedTotalAmount'] - Header['TaxExcludedTotalAmount']).toFixed(2);

    // Format number for display
    invoice['totalOriginalAmount'] = this.formatNumberDisplay(invoice['totalOriginalAmount']);
    invoice['totalDiscount'] = this.formatNumberDisplay(invoice['totalDiscount']);
    invoice['taxIncludedTotalAmount'] = this.formatNumberDisplay(invoice['taxIncludedTotalAmount']);
    invoice['taxExcludedTotalAmount'] = this.formatNumberDisplay(invoice['taxExcludedTotalAmount']);
    invoice['VAT'] = this.formatNumberDisplay(invoice['VAT']);
    invoice['qrcodeData'] = this.generateQRdata(invoice);
  
    this.invoice = invoice;
  }

  parseLines(lines) {
    const items = lines['Get_Line'].map(x => {
      x = this.mapItem(x);

      if(typeof x['SerialNumberId'] != 'string') {
        x['SerialNumberId'] = '';
      }

      // Add default values
      x['withDiscount'] = false;

      // Generate total unit price and taxable price of the row
      let qty = x['Quantity'];
      x['totalTaxIncludedNetUnitPrice'] = parseFloat(x['TaxIncludedNetUnitPrice'] * qty).toFixed(2);
      x['totalTaxExcludedNetUnitPrice'] = parseFloat(x['totalTaxIncludedNetUnitPrice'] / TAX).toFixed(2);
      x['totalVat'] = parseFloat(x['totalTaxIncludedNetUnitPrice'] - x['totalTaxExcludedNetUnitPrice']).toFixed(2);
      x['totalOriginalAmount'] = parseFloat(x['TaxIncludedUnitPrice'] * x['Quantity']).toFixed(2);

      // Get product meta
      x['meta'] = this.getProductMeta(x['ItemReference']);

      // Check if has discount
      if(x['TaxIncludedNetUnitPrice'] !== x['TaxIncludedUnitPrice']) {
        let totalDiscount = parseFloat(x['TaxIncludedUnitPrice'] - x['TaxIncludedNetUnitPrice']).toFixed(2);
        x['withDiscount'] = true;
        x['discount'] = {
          percentage: parseFloat((totalDiscount / x['TaxIncludedUnitPrice']) * 100).toFixed(2),
          totalDiscount: totalDiscount
        };
      }

      // Format number for display
      x['totalTaxExcludedNetUnitPrice'] = this.formatNumberDisplay(x['totalTaxExcludedNetUnitPrice']);
      x['totalVat'] = this.formatNumberDisplay(x['totalVat']);
      x['totalTaxIncludedNetUnitPrice'] = this.formatNumberDisplay(x['totalTaxIncludedNetUnitPrice']);

      return x;
    });
    return items;
  }

  formatNumberDisplay(number) {
    return new Intl.NumberFormat('en-US', {maximumFractionDigits: 2, minimumFractionDigits: 2}).format(number);
  }

  mapItem(object) {
    for (const key in object) {
      object[key] = object[key][0];

      if(key == 'Quantity') {
        object[key] = parseInt(object[key]);
      }
    }

    return object;
  }

  generateInvoiceTitle() {
    let label = 'TAX INVOICE';
    switch (this.type) {
      case REPLACEMENT:
        label = 'WARRANTY PRODUCT REPLACEMENT NOTE';
        break;
  
      case RETURN:
        label = 'TAX CREDIT NOTE';
        break;
    
      default:
        break;
    }
  
    return label;
  }

  mapItem(object) {
    for (const key in object) {
      object[key] = object[key][0];

      if(key == 'Quantity') {
        object[key] = parseInt(object[key]);
      }
    }

    return object;
  }

  mapPayload(payload) {
    try {
      payload['DeliveryAddress'] = {
        ...this.mapItem(payload['DeliveryAddress'][0]),
      };
      payload['Header'] = { ...this.mapItem(payload['Header'][0]) };
      payload['InvoicingAddress'] = {
        ...this.mapItem(payload['InvoicingAddress'][0]),
      };
      payload['Lines'] = { ...payload['Lines'][0] };
      payload['Payments'] = { ...this.mapItem(payload['Payments'][0]) };
      payload['ShippingTaxes'] = {
        ...this.mapItem(payload['ShippingTaxes'][0]),
      };

      return payload;
    } catch (err) {
      console.log(err);
      throw `Unable to generate PDF for invoice. ${err.message}`
    }
  }

  identifyType(invoice) {
    this.type = SALE;
    if(invoice.internalReference.includes('REP', 0)) {
      this.type = REPLACEMENT;
    } else if(this.isReturnOrder(invoice.comment, invoice.items)) {
      this.type = RETURN;
    }
    return this.type;
  }

  isReturnOrder(comment, items) {
    if(comment === SALE){
      let isReturn = true;
  
      _.forEach(items, (item) => {
        if(item.Quantity > 0){
          isReturn = false;
          return false;
        }
      });
      return isReturn;
    }
    return false
  };

  async getProductList() {
    const reader = new ProductJSONReader();
    this.products = await reader.read();
  }

  getProductMeta(sku) {
    const result = _.find(this.products, {sku: sku});
    const meta = {};
  
    meta['description'] = result ? result.description : '';
    meta['arabic_desc'] = result ? result.arabic_desc || '' : '';
    meta['sku'] = result ? result.sku : '';
    meta['valid'] = result || false;
  
    return meta;
  }

  generateQRdata({date, taxIncludedTotalAmount, taxExcludedTotalAmount, VAT, currency}) {
    const companyName = COMPANY_NAME || 'n/a';
    const vatId = VAT_ID || 'n/a';
    // const dateTime = `${moment(date, 'MMM DD, YYYY').format('YYYYMMDD')} ${moment().format('HH:mm:ss')}`;
    // const readable = `Company Name: ${companyName}\n\nCompany VAT No.: ${VAT_ID}\n\nDate and Time: ${dateTime}\n\nTotal Inc VAT: ${currency} ${taxIncludedTotalAmount}\n\nTotal Exc VAT: ${currency} ${taxExcludedTotalAmount}\n\nVAT Amount: ${currency} ${VAT}`;
  
    const data = {
      company: companyName,
      vatId: vatId,
      timestamp: moment(date, 'MMM DD, YYYY').format(),
      invoiceTotal: taxIncludedTotalAmount.toString(),
      vat: VAT.toString()
    };

    const fatoora = new Fatoora(data);
    const {error, base64} = fatoora.base64();
    if(error) return '';
    return base64;
  }
}

module.exports = InvoiceDTO;