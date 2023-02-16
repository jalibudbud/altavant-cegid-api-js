'use strict';

module.exports = {
  TransferItemsDeliveryManagement: {
    CreateTransfer: require('./modules/transfer-items-delivery-management/create')
  },
  SaleDocument: {
    CreateSaleDocument: require('./modules/sale-document/create'),
    GetByReferenceSaleDocument: require('./modules/sale-document/get-by-reference'),
    UpdatePaymentsSaleDocument: require('./modules/sale-document/update-payments'),
    UpdateHeaderSaleDocument: require('./modules/sale-document/update-header'),
    CancelSaleDocument: require('./modules/sale-document/cancel'),
  },
  // Util: require('./util'),
  // InvoiceDTO: require('./modules/invoice.dto'),
  HelloWorld: require('./modules/ping'),
  // InventorySerialNumbers: require('./modules/inventory-serial-numbers'),
  // Constants: require('./constants'),
  // Helpers: require('./helpers')
};