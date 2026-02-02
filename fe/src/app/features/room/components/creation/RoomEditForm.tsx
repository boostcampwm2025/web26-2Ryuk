'use client';

import { useState, useEffect, FormEvent } from 'react';
import { DefaultTextfield } from '@/app/components/shared/textfield/Textfield';
import { PrimaryTextButton, OutlineTextButton } from '@/app/components/shared/button/TextButton';
import ParticipantStepper from '@/app/components/shared/stepper/ParticipantStepper';
import TagSelector from '@/app/components/shared/tag/TagSelector';
import MicSetting from './MicSetting';
import PasswordSetting from './PasswordSetting';
import { RoomEditData } from '@/app/features/room/dtos/data';
import styles from './roomEditForm.module.css';
import { RoomEditFormProps } from '@/app/features/room/components/type';
import IS from '@/utils/is';

export default function RoomEditForm({
  initialData = {},
  type,
  onSubmit,
  onCancel,
  submitText,
}: RoomEditFormProps) {
  const [formData, setFormData] = useState<RoomEditData>({
    title: initialData.title || '',
    tags: initialData.tags || [],
    maxParticipants: initialData.maxParticipants || 4,
    isMicAvailable: initialData.isMicAvailable ?? true,
    isPrivate: initialData.isPrivate ?? false,
    password: initialData.password,
  });

  // initialData가 변경될 때 state 업데이트
  useEffect(() => {
    setFormData((prev) => ({
      title: initialData.title ?? prev.title,
      tags: initialData.tags ?? prev.tags,
      maxParticipants: initialData.maxParticipants ?? prev.maxParticipants,
      isMicAvailable: initialData.isMicAvailable ?? prev.isMicAvailable,
      isPrivate: initialData.isPrivate ?? prev.isPrivate,
      password: initialData.password ?? prev.password,
    }));
  }, [
    initialData.title,
    initialData.tags,
    initialData.maxParticipants,
    initialData.isMicAvailable,
    initialData.isPrivate,
    initialData.password,
  ]);

  // 비밀번호 입력 여부
  const hasPassword = !IS.nil(formData.password) && formData.password?.trim() !== '';

  // 필수 입력값 검증
  const isTitleEmpty = !formData.title.trim();
  const hasNoTags = formData.tags.length === 0;
  const isInvalidParticipantCount = formData.maxParticipants < 2;

  // 비공개 방 비밀번호 조건
  const isPrivateWithoutPassword = formData.isPrivate && !hasPassword;
  const isUpdateRequiringPassword =
    type === 'update' && !initialData.isPrivate && formData.isPrivate && !hasPassword;

  // 전체 비활성화 조건
  const isDisabled =
    isTitleEmpty ||
    hasNoTags ||
    isInvalidParticipantCount ||
    (type === 'create' && isPrivateWithoutPassword) ||
    isUpdateRequiringPassword;

  initialData.isPrivate;

  const initialIsPrivate = initialData.isPrivate ?? false;

  const passwordPlaceholder = (() => {
    if (type === 'create') return '비밀번호를 입력하세요';
    return initialIsPrivate
      ? '비밀번호를 비우면 기존 비밀번호로 적용됩니다'
      : '비밀번호를 입력하세요';
  })();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const data: RoomEditData = {
      ...formData,
      title: formData.title.trim(),
      password: formData.isPrivate ? formData.password : undefined,
    };
    onSubmit?.(data);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.inputArea}>
        <div className={styles.section}>
          <label className={styles.label}>대화방 제목</label>
          <DefaultTextfield
            placeholder="대화방 제목을 입력하세요"
            value={formData.title}
            onChange={(value) => setFormData((prev) => ({ ...prev, title: value }))}
            maxLength={40}
          />
        </div>

        <div className={styles.section}>
          <label className={styles.label}>대화방 태그</label>
          <TagSelector
            defaultTags={['수다', '게임', '소통']}
            selectedTags={formData.tags}
            placeholder="#대화방, #태그를, #입력하세요 (최대 6개)"
            onChange={(value) => setFormData((prev) => ({ ...prev, tags: value }))}
            maxCount={6}
          />
        </div>

        <div className={styles.row}>
          <div className={styles.halfSection}>
            <label className={styles.label}>최대 인원 수 (Max 10)</label>
            <ParticipantStepper
              initialValue={formData.maxParticipants}
              onChange={(value) => setFormData((prev) => ({ ...prev, maxParticipants: value }))}
            />
          </div>
          <div className={styles.halfSection}>
            <label className={styles.label}>대화방 설정</label>
            <MicSetting
              initialChecked={formData.isMicAvailable}
              onChange={(value) => setFormData((prev) => ({ ...prev, isMicAvailable: value }))}
            />
          </div>
        </div>

        <div className={styles.section}>
          <PasswordSetting
            initialChecked={formData.isPrivate}
            onChangeChecked={(value) => setFormData((prev) => ({ ...prev, isPrivate: value }))}
            initialPassword={formData.password || ''}
            onChangePassword={(value) => setFormData((prev) => ({ ...prev, password: value }))}
            placeholder={passwordPlaceholder}
          />
        </div>
      </div>

      <div className={styles.footer}>
        <OutlineTextButton text="취소" size="medium" onClick={onCancel} />
        <PrimaryTextButton text={submitText} size="medium" type="submit" disabled={isDisabled} />
      </div>
    </form>
  );
}
