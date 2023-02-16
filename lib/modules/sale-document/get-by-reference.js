'use strict'

const xml2js = require('xml2js');
const Cegid = require('../../cegid');

class GetByReferenceSaleDocument extends Cegid {
  /**
   *
   * @param {object} config - {environment: prod/dev, apikey: Emaar apikey}
   * @return void
   */
  constructor() {
    const options = {
      operation: "ISaleDocumentService/GetByReference",
      wsdlUrl: `${process.env.APP_CEGID_WSDL_BASE}/SaleDocumentService.svc`,
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
      const status = response.status;
      let responseMeta;
      if (status == 200) {
        responseMeta = await this.parseSuccessResponse(response.data);
      } else {
        responseMeta = await this.parseErrorResponse(response.data);
      }

      return {
        error: status == 200 ? false : responseMeta,
        payload: responseMeta,
        status: status,
      };
    } catch (error) {
      return { error: error.message, status: 500 };
    }
  }

  /**
   *
   * @param {internalReference} internalReference - Cegid keys based on
   * https://90397237-test-retail-ondemand.cegid.cloud/Y2/Doc/WebService/en/SaleDocumentService.html#op.ID1ECIAC
   * @return {object} - JSON format of the body
   */
  generateBody({ internalReference, type, customerId }) {
    const body = {
      "ns:GetByReference": {
        "ns:searchRequest": {
          "ns:Reference": {
            "ns:CustomerId": customerId ? customerId : process.env.APP_CEGID_CUSTOMER_ID,
            "ns:InternalReference": internalReference,
            "ns:Type": type,
          },
        },
        "ns:clientContext": {
          "ns:DatabaseId": process.env.APP_CEGID_DATABASE_ID,
        },
      },
    };

    return body;
  }

  parseSuccessResponse(xml) {
    return new Promise((resolve) => {
      xml2js.parseString(xml, { trim: true }, (err, result) => {
        if (err) {
          resolve({ success: false, error: err });
        } else {
          try {
            const getByReferenceResult = result["s:Envelope"]["s:Body"][0]["GetByReferenceResponse"][0]["GetByReferenceResult"][0];

            if (getByReferenceResult.hasOwnProperty("Header")) {
              resolve(getByReferenceResult);
            } else {
              resolve(result);
            }
          } catch (err) {
            console.error(err);
            resolve(xml);
          }
        }
      });
    });
  }

  parseErrorResponse(xml) {
    return new Promise((resolve) => {
      xml2js.parseString(xml, { trim: true }, function (err, result) {
        if (err) {
          resolve({ success: false, error: err });
        } else {
          try {
            let responseObj = result["s:Envelope"]["s:Body"][0]["s:Fault"][0];
            let message = "";
            if ("detail" in responseObj) {
              message = responseObj["detail"][0]["CbpExceptionDetail"][0]["Message"][0];
            } else {
              message = responseObj["faultstring"][0]["_"];
            }
            resolve(message);
          } catch (err) {
            console.error(err);
            resolve(xml);
          }
        }
      });
    });
  }
}

module.exports = GetByReferenceSaleDocument;
