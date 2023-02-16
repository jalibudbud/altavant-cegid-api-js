'use strict'

module.exports = {
  PAYMENT_STATUS_ENUM: {
    Pending: 'Pending',
    Totally: 'Totally'
  },
  SHIPPING_STATUS_ENUM: {
    Pending: 'Pending',
    Totally: 'Totally',
    Partially: 'Partially',
    InProgress: 'InProgress'
  },
  SALE_DOCUMENT_TYPE_ENUM: {
    ReturnNotice: 'ReturnNotice',
    CustomerDelivery: 'CustomerDelivery',
    CustomerOrder: 'CustomerOrder',
    AvailableOrder: 'AvailableOrder',
    CustomerReservationRequest: 'CustomerReservationRequest',
    ReceiptOnHold: 'ReceiptOnHold',
    Receipt: 'Receipt',
    DeliveryPreparation: 'DeliveryPreparation',
    CustomersReservation: 'CustomersReservation'
  },
  SALE_OMNICHANNEL_FOLLOWUP_STATUS: {
    ToBeProcessed: 'ToBeProcessed',
    Validated: 'Validated',
    ToSupplyInCentral: 'ToSupplyInCentral',
    ToSupplyInStore: 'ToSupplyInStore',
    ToBeDeliveredByStore: 'ToBeDeliveredByStore',
    InPreparation: 'InPreparation',
    Prepared: 'Prepared',
    ShipByCentral: 'ShipByCentral',
    ShipByLogistic: 'ShipByLogistic',
    ShipByStore: 'ShipByStore',
    RequestedStoreBooking: 'RequestedStoreBooking',
    BookedInStore: 'BookedInStore',
    PickedUpInStore: 'PickedUpInStore',
    Closed: 'Closed',
    TransferedInStore: 'TransferedInStore',
    AvailableInStore: 'AvailableInStore',
    BookingRefused: 'BookingRefused',
    Ordered: 'Ordered',
    GoodTakenOut: 'GoodTakenOut',
    RecievedByCustomer: 'RecievedByCustomer',
    Booked: 'Booked',
    AvailableInWarehouse: 'AvailableInWarehouse',
    WaitingForReturn: 'WaitingForReturn',
    AcceptedOrder: 'AcceptedOrder',
    WaitingCommodity: 'WaitingCommodity'
  },
  SALE_OMNICHANNEL_SHIPPING_STATUS: {
    Pending : 'Pending',
    Totally: 'Totally',
    Partially: 'Partially',
    InProgress: 'InProgress'
  }
};