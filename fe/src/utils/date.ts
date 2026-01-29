'use client';

import IS from './is';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ko';

dayjs.extend(relativeTime);
dayjs.locale('ko');

type DateLike = Date | number | string;

interface DateFormatOptions {
  format?: string;
  fallback?: string;
}

interface DateDescribeOptions {
  fallback?: string;
  now?: Date;
}

const toDate = (value?: DateLike | null): Date | undefined => {
  if (IS.nil(value)) return undefined;
  if (value instanceof Date) return value;
  return new Date(value!);
};

const DateUtil = {
  format(
    dt?: DateLike | null,
    { format, fallback }: DateFormatOptions = { format: 'YYYY-MM-DD', fallback: '' },
  ): string {
    const date = toDate(dt);
    if (!date) return fallback!;
    return dayjs(date).format(format);
  },

  fromNow(dt?: DateLike | null, fallback: string = ''): string {
    const date = toDate(dt);
    if (!date) return fallback;
    return dayjs(date).fromNow();
  },

  describe(
    dt?: DateLike | null,
    { fallback = '-', now = new Date() }: DateDescribeOptions = {},
  ): string {
    const date = toDate(dt);
    if (!date) return fallback;

    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);

    if (diffSeconds < 60) return `${diffSeconds}초 전`;
    if (diffSeconds < 60 * 60) {
      const minutes = Math.floor(diffSeconds / 60);
      return `${minutes}분 전`;
    }

    if (diffSeconds < 60 * 60 * 24) {
      const hours = Math.floor(diffSeconds / (60 * 60));
      return `${hours}시간 전`;
    }

    return DateUtil.format(date, { format: 'YYYY. MM. DD', fallback });
  },
};

export default DateUtil;
