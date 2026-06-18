export const formatCurrency = (amount: number): string => {
  return `¥${amount.toFixed(2)}`;
};

export const formatDuration = (hours: number): string => {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);

  if (wholeHours === 0) {
    return `${minutes}分钟`;
  }
  if (minutes === 0) {
    return `${wholeHours}小时`;
  }
  return `${wholeHours}小时${minutes}分钟`;
};

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const weekday = weekdays[d.getDay()];

  return `${year}年${month}月${day}日 ${weekday}`;
};

export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours < 12 ? '上午' : '下午';
  const displayHours = hours % 12 || 12;
  const displayMinutes = String(minutes).padStart(2, '0');

  return `${period}${displayHours}:${displayMinutes}`;
};

export const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    manicure: '美甲',
    eyelash: '美睫',
    care: '护理',
  };
  return labels[category] || category;
};

export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: '待确认',
    confirmed: '已确认',
    completed: '已完成',
    cancelled: '已取消',
    paid: '已支付',
    refunded: '已退款',
  };
  return labels[status] || status;
};
