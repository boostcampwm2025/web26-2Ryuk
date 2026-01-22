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

export default function RoomEditForm({
  initialData = {},
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

  const isDisabled =
    !formData.title.trim() || formData.tags.length === 0 || formData.maxParticipants < 1;

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
            initialValue={formData.title}
            onChange={(value) => setFormData((prev) => ({ ...prev, title: value }))}
          />
        </div>

        <div className={styles.section}>
          <label className={styles.label}>대화방 태그</label>
          <TagSelector
            defaultTags={['수다', '게임', '소통']}
            selectedTags={formData.tags}
            onChange={(value) => setFormData((prev) => ({ ...prev, tags: value }))}
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
