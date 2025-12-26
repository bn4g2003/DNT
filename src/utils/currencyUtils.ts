export const formatCurrency = (amount: number): string => {
  if (amount === 0) return '0 VNĐ';
  if (!amount) return '';

  try {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  } catch (error) {
    return `${amount.toLocaleString('vi-VN')} VNĐ`;
  }
};

export const parseCurrency = (currencyStr: string): number => {
  if (!currencyStr) return 0;

  // Remove all non-numeric characters except decimal point
  const numericStr = currencyStr.replace(/[^\d.-]/g, '');
  const amount = parseFloat(numericStr);

  return isNaN(amount) ? 0 : amount;
};

export const formatNumber = (num: number): string => {
  if (!num) return '0';
  return num.toLocaleString('vi-VN');
};

/**
 * Convert number to Vietnamese words
 */
export const numberToWords = (num: number): string => {
  if (num === 0) return 'Không đồng';
  if (!num || isNaN(num)) return '';

  const units = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  const teens = ['mười', 'mười một', 'mười hai', 'mười ba', 'mười bốn', 'mười lăm', 'mười sáu', 'mười bảy', 'mười tám', 'mười chín'];

  const readThreeDigits = (n: number): string => {
    if (n === 0) return '';
    const hundred = Math.floor(n / 100);
    const remainder = n % 100;
    const ten = Math.floor(remainder / 10);
    const unit = remainder % 10;

    let result = '';
    if (hundred > 0) {
      result += units[hundred] + ' trăm ';
    }
    if (ten === 0 && unit > 0 && hundred > 0) {
      result += 'lẻ ' + units[unit];
    } else if (ten === 1) {
      result += teens[unit];
    } else if (ten > 1) {
      result += units[ten] + ' mươi ';
      if (unit === 1 && ten > 1) {
        result += 'mốt';
      } else if (unit === 5 && ten > 0) {
        result += 'lăm';
      } else if (unit > 0) {
        result += units[unit];
      }
    } else if (unit > 0) {
      result += units[unit];
    }
    return result.trim();
  };

  const groups = ['', 'nghìn', 'triệu', 'tỷ'];
  let result = '';
  let groupIndex = 0;
  let n = Math.abs(num);

  while (n > 0) {
    const threeDigits = n % 1000;
    if (threeDigits > 0) {
      const groupText = readThreeDigits(threeDigits);
      result = groupText + ' ' + groups[groupIndex] + ' ' + result;
    }
    n = Math.floor(n / 1000);
    groupIndex++;
  }

  result = result.trim().replace(/\s+/g, ' ');
  return (num < 0 ? 'Âm ' : '') + result.charAt(0).toUpperCase() + result.slice(1) + ' đồng';
};

/**
 * Calculate discounted price
 * @param amount Original amount
 * @param discountPercent Discount as decimal (0.2 = 20%)
 */
export const calculateDiscount = (amount: number, discountPercent: number): number => {
  if (!amount || amount <= 0) return 0;
  if (!discountPercent || discountPercent <= 0) return amount;
  if (discountPercent >= 1) return 0; // 100% discount
  return Math.round(amount * (1 - discountPercent));
};
