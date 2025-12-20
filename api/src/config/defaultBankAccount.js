/**
 * Cấu hình tài khoản ngân hàng mặc định
 * Sử dụng khi creator chưa cập nhật thông tin tài khoản ngân hàng
 */

const DEFAULT_BANK_ACCOUNT = {
  bankName: 'Vietcombank',
  bankCode: 'VCB', // Mã ngân hàng cho VietQR
  accountNumber: '1027052693',
  accountName: 'Phan Duy Khang',
  branch: '',
  fullBankName: 'Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)'
};

/**
 * Tạo thông tin chuyển khoản với tài khoản mặc định
 */
function getDefaultBankInfo(amount, courseId, userId) {
  const content = `KHOAHOC ${courseId} USER ${userId}`;
  const encodedContent = encodeURIComponent(content);
  
  return {
    bankName: DEFAULT_BANK_ACCOUNT.fullBankName,
    accountNumber: DEFAULT_BANK_ACCOUNT.accountNumber,
    accountName: DEFAULT_BANK_ACCOUNT.accountName,
    branch: DEFAULT_BANK_ACCOUNT.branch,
    amount: amount,
    content: content,
    qrCode: `https://img.vietqr.io/image/${DEFAULT_BANK_ACCOUNT.bankCode}-${DEFAULT_BANK_ACCOUNT.accountNumber}-compact2.png?amount=${amount}&addInfo=${encodedContent}`,
    note: 'Sử dụng tài khoản mặc định của hệ thống'
  };
}

/**
 * Tạo thông tin chuyển khoản với tài khoản creator
 */
function getCreatorBankInfo(creatorBankAccount, amount, courseId, userId) {
  const content = `KHOAHOC ${courseId} USER ${userId}`;
  const encodedContent = encodeURIComponent(content);
  
  // Lấy mã ngân hàng từ tên (có thể cần mapping phức tạp hơn)
  const bankCode = getBankCode(creatorBankAccount.bank_name);
  
  return {
    bankName: creatorBankAccount.bank_name,
    accountNumber: creatorBankAccount.account_number,
    accountName: creatorBankAccount.account_name,
    branch: creatorBankAccount.branch,
    amount: amount,
    content: content,
    qrCode: `https://img.vietqr.io/image/${bankCode}-${creatorBankAccount.account_number}-compact2.png?amount=${amount}&addInfo=${encodedContent}`
  };
}

/**
 * Mapping tên ngân hàng sang mã ngân hàng cho VietQR
 */
function getBankCode(bankName) {
  const bankMapping = {
    'Vietcombank': 'VCB',
    'VietinBank': 'CTG',
    'BIDV': 'BIDV',
    'Agribank': 'VBA',
    'ACB': 'ACB',
    'Techcombank': 'TCB',
    'MBBank': 'MB',
    'VPBank': 'VPB',
    'TPBank': 'TPB',
    'Sacombank': 'STB',
    'HDBank': 'HDB',
    'VIB': 'VIB',
    'SHB': 'SHB',
    'Eximbank': 'EIB',
    'MSB': 'MSB',
    'CAKE': 'CAKE',
    'Ubank': 'UBANK',
    'Timo': 'TIMO',
    'VietCapitalBank': 'VCCB',
    'SCB': 'SCB',
    'VietBank': 'VIETBANK',
    'BacABank': 'BAB',
    'PVcomBank': 'PVCB',
    'Oceanbank': 'OCEANBANK',
    'NCB': 'NCB',
    'ShinhanBank': 'SHBVN',
    'ABBANK': 'ABB',
    'VietABank': 'VAB',
    'NamABank': 'NAB',
    'PGBank': 'PGB',
    'VietBank': 'VIETBANK',
    'BaoVietBank': 'BVB',
    'SeABank': 'SEAB',
    'COOPBANK': 'COOPBANK',
    'LienVietPostBank': 'LPB',
    'KienLongBank': 'KLB',
    'KBank': 'KBANK'
  };
  
  // Tìm kiếm tên ngân hàng trong mapping
  for (const [name, code] of Object.entries(bankMapping)) {
    if (bankName.toLowerCase().includes(name.toLowerCase())) {
      return code;
    }
  }
  
  // Mặc định trả về tên ngân hàng viết hoa nếu không tìm thấy
  return bankName.toUpperCase().replace(/\s+/g, '');
}

module.exports = {
  DEFAULT_BANK_ACCOUNT,
  getDefaultBankInfo,
  getCreatorBankInfo,
  getBankCode
};