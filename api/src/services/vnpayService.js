const crypto = require('crypto');
const querystring = require('querystring');
const moment = require('moment');

class VNPayService {
  constructor() {
    this.vnpUrl = process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    this.vnpTmnCode = process.env.VNPAY_TMN_CODE || 'YOUR_TMN_CODE';
    this.vnpHashSecret = process.env.VNPAY_HASH_SECRET || 'YOUR_HASH_SECRET';
    this.vnpReturnUrl = process.env.VNPAY_RETURN_URL || 'http://localhost:4200/payment/vnpay-return';
  }

  /**
   * Tạo URL thanh toán VNPay
   */
  createPaymentUrl(orderId, amount, orderInfo, ipAddr, locale = 'vn') {
    const date = new Date();
    const createDate = moment(date).format('YYYYMMDDHHmmss');
    const expireDate = moment(date).add(15, 'minutes').format('YYYYMMDDHHmmss');

    let vnpParams = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.vnpTmnCode,
      vnp_Locale: locale,
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: 'other',
      vnp_Amount: amount * 100, // VNPay yêu cầu số tiền nhân 100
      vnp_ReturnUrl: this.vnpReturnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate
    };

    // Sắp xếp params theo thứ tự alphabet
    vnpParams = this.sortObject(vnpParams);

    // Tạo secure hash
    const signData = querystring.stringify(vnpParams, { encode: false });
    const hmac = crypto.createHmac('sha512', this.vnpHashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    vnpParams['vnp_SecureHash'] = signed;

    // Tạo URL
    const paymentUrl = this.vnpUrl + '?' + querystring.stringify(vnpParams, { encode: false });
    
    return paymentUrl;
  }

  /**
   * Xác thực callback từ VNPay
   */
  verifyReturnUrl(vnpParams) {
    const secureHash = vnpParams['vnp_SecureHash'];
    delete vnpParams['vnp_SecureHash'];
    delete vnpParams['vnp_SecureHashType'];

    // Sắp xếp params
    vnpParams = this.sortObject(vnpParams);

    // Tạo secure hash để so sánh
    const signData = querystring.stringify(vnpParams, { encode: false });
    const hmac = crypto.createHmac('sha512', this.vnpHashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    return secureHash === signed;
  }

  /**
   * Xử lý kết quả trả về từ VNPay
   */
  processReturn(vnpParams) {
    const isValid = this.verifyReturnUrl(vnpParams);
    
    if (!isValid) {
      return {
        success: false,
        message: 'Chữ ký không hợp lệ'
      };
    }

    const responseCode = vnpParams['vnp_ResponseCode'];
    const transactionNo = vnpParams['vnp_TransactionNo'];
    const orderId = vnpParams['vnp_TxnRef'];
    const amount = vnpParams['vnp_Amount'] / 100;
    const bankCode = vnpParams['vnp_BankCode'];
    const payDate = vnpParams['vnp_PayDate'];

    if (responseCode === '00') {
      return {
        success: true,
        message: 'Giao dịch thành công',
        data: {
          orderId,
          transactionNo,
          amount,
          bankCode,
          payDate
        }
      };
    } else {
      return {
        success: false,
        message: this.getResponseMessage(responseCode),
        responseCode
      };
    }
  }

  /**
   * Lấy thông báo lỗi từ response code
   */
  getResponseMessage(code) {
    const messages = {
      '00': 'Giao dịch thành công',
      '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
      '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
      '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
      '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.',
      '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.',
      '13': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP).',
      '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
      '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.',
      '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.',
      '75': 'Ngân hàng thanh toán đang bảo trì.',
      '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định.',
      '99': 'Các lỗi khác'
    };

    return messages[code] || 'Lỗi không xác định';
  }

  /**
   * Sắp xếp object theo key
   */
  sortObject(obj) {
    const sorted = {};
    const keys = Object.keys(obj).sort();
    keys.forEach(key => {
      sorted[key] = obj[key];
    });
    return sorted;
  }

  /**
   * Query transaction status từ VNPay
   */
  async queryTransaction(orderId, transDate) {
    // Implement query API nếu cần
    // Tham khảo: https://sandbox.vnpayment.vn/apis/docs/truy-van-hoan-tien/
    throw new Error('Query transaction not implemented yet');
  }
}

module.exports = new VNPayService();
