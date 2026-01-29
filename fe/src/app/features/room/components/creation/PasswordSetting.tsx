'use client';

import { useState } from 'react';
import { OutlineTextfield } from '@/app/components/shared/textfield/Textfield';
import LabeledToggle from '@/app/components/shared/toggle/LabeledToggle';
import { PasswordSettingProps } from '../type';

export default function PasswordSetting({
  initialChecked = false,
  onChangeChecked,
  initialPassword = '',
  onChangePassword,
  placeholder = '비밀번호를 입력하세요',
}: PasswordSettingProps) {
  const [checked, setChecked] = useState<boolean>(initialChecked);

  const handleChangeChecked = (checked: boolean) => {
    setChecked(checked);
    onChangeChecked?.(checked);
  };

  return (
    <LabeledToggle
      name="lock"
      label="비공개 방으로 설정"
      initialChecked={initialChecked}
      onChange={handleChangeChecked}
    >
      <OutlineTextfield
        placeholder={placeholder}
        initialValue={initialPassword}
        disabled={!checked}
        onChange={onChangePassword}
        hidable
      />
    </LabeledToggle>
  );
}
