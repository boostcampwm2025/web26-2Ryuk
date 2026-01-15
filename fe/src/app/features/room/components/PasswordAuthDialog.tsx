'use client';

import { useState, useEffect } from 'react';
import Modal from '@/app/components/shared/modal/Modal';
import Dialog from '@/app/components/shared/dialog/Dialog';
import { OutlineTextfield } from '@/app/components/shared/textfield/Textfield';
import { useModal } from '@/app/components/shared/modal/useModal';
import Paths from '@/app/shared/path';

interface PasswordAuthDialogProps {
  isOpen: boolean;
  onConfirm: (password: string) => void;
  onCancel: () => void;
}

export default function PasswordAuthDialog({
  isOpen,
  onConfirm,
  onCancel,
}: PasswordAuthDialogProps) {
  const { openModal, closeModal } = useModal();
  const [modalId] = useState(() => `room-password-${Date.now()}`);
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (isOpen) openModal(modalId);
    else closeModal(modalId);
    setPassword('');
  }, [isOpen, modalId, openModal, closeModal]);

  const handlePasswordConfirm = () => {
    if (!password.trim()) return;
    onConfirm(password);
    setPassword('');
  };

  const handleCancel = () => {
    setPassword('');
    onCancel();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && password.trim()) handlePasswordConfirm();
  };

  if (!isOpen) return null;

  return (
    <Modal id={modalId} closeOnBackdropClick={false}>
      <Dialog
        modalId={modalId}
        src={Paths.images('mascot_curious')}
        title="비밀방입니다"
        content="방에 입장하려면 비밀번호를 입력하세요."
        closeIfConfirm={false}
        onCancel={handleCancel}
        onConfirm={handlePasswordConfirm}
      >
        <OutlineTextfield
          placeholder="비밀번호를 입력하세요"
          value={password}
          onChange={setPassword}
          onKeyDown={handleKeyDown}
          hidable
        />
      </Dialog>
    </Modal>
  );
}
