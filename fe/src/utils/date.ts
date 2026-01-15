'use client';

import IS from './is';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ko';

dayjs.extend(relativeTime);
dayjs.locale('ko');

interface DateFormatOptions {
  format?: string;
  fallback?: string;
}

const DateUtil = {
  format(
    dt?: Date | null,
    { format, fallback }: DateFormatOptions = { format: 'YYYY-MM-DD', fallback: '' },
  ): string {
    if (IS.nil(dt)) return fallback!;
    return dayjs(dt).format(format);
  },

  fromNow(dt?: Date | null, fallback: string = ''): string {
    if (IS.nil(dt)) return fallback;
    return dayjs(dt).fromNow();
  },
};

export default DateUtil;
