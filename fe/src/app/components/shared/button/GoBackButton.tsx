'use client';

import { GhostTextButton } from './TextButton';
import { GhostIconButton } from '@/app/components/shared/icon/IconButton';
import useNavigation from '@/app/hooks/useNavigation';
import useResponsive from '@/app/hooks/useResponsive';
import { GoBackButtonProps } from './type';

export default function GoBackButton({ text = '돌아가기', onClick }: GoBackButtonProps) {
  const { goBack } = useNavigation();
  const { isDesktop } = useResponsive();

  const handleClick = () => {
    if (onClick) onClick();
    else goBack();
  };

  return (
    <div className="go-back">
      {isDesktop ? (
        <GhostTextButton iconName="left" text={text} size="medium" onClick={handleClick} />
      ) : (
        <GhostIconButton name="left" size="medium" onClick={handleClick} />
      )}
    </div>
  );
}
