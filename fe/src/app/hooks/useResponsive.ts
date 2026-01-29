'use client';

import { useState, useEffect } from 'react';

const DEVICE_TYPES = ['desktop', 'tablet', 'mobile'] as const;
export type DeviceType = (typeof DEVICE_TYPES)[number];

interface ResponsiveState {
  width: number;
  height: number;
  ratio: number;
  index: number;
  status: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

const useResponsive = () => {
  const getStatus = (width: number): DeviceType => {
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  };

  const [state, setState] = useState<ResponsiveState>({
    width: 0,
    height: 0,
    ratio: 0,
    index: 0,
    status: 'desktop',
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const status = getStatus(width);

      setState({
        width,
        height,
        ratio: width / height,
        index: DEVICE_TYPES.indexOf(status),
        status,
        isMobile: status === 'mobile',
        isTablet: status === 'tablet',
        isDesktop: status === 'desktop',
      });
    };

    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return state;
};

export default useResponsive;
