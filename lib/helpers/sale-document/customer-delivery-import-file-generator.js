'use strict'

const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const moment = require('moment-timezone');
moment.tz.setDefault(process.env.APP_TIMEZONE); 

 module.exports = async (requestDTO) => {
  try {
    const FILE_NAME = `${process.env.APP_GET_PATH}/BLC_${moment().format('YYYYMMDD')}_${Date.now()}.csv`;
    const csvWriter = createCsvWriter({
      fieldDelimiter:';',
      path: FILE_NAME,
      header: [
        { id: 'identifier', title: 'CEGIDCODE' },
        { id: 'documentWarehouseId', title: 'GP_SOUCHE' },
        { id: 'headerInternalReference', title: 'GP_REFINTERNE' },
        { id: 'date', title: 'GL_DATEPIECE' },
        { id: 'sku', title: 'TESTBARCODER' },
        { id: 'quantity', title: 'GL_QTEFACT' },
        { id: 'originalPrice', title: 'GL_PUTTC' },
        { id: 'documentType', title: 'GL_NATUREPIECEG' },
        { id: 'customer_code', title: 'customer_code' }
      ]
    });

    const headerObj = {
      identifier: 'BLCC1_',
      ...requestDTO,
      date: moment(requestDTO.headerDate, 'YYYY-MM-DD').format('DD/MM/YYYY')
    };

    const data = [];
    for (let item of requestDTO.items) {
      data.push({
        ...headerObj,
        ...item,
        price: item.codentifier,
        documentType: 'BLC',
        customer_code: process.env.APP_CEGID_CUSTOMER_ID
      });
    }

    await csvWriter.writeRecords(data);
    return {};
  } catch (error) {
    return {error};
  }
};