'use client';

import { GhostTextButton } from './TextButton';
import Modal from '@/app/components/shared/modal/Modal';
import LoginOptionsModalContent from '@/app/components/layout/header/LoginOptionsModalContent';
import { useModal } from '@/app/components/shared/modal/useModal';

export default function LoginButtonWithModal() {
  const { openModal } = useModal();

  return (
    <>
      <GhostTextButton text="로그인" size="small" onClick={() => openModal('login-options')} />
      <Modal id="login-options">
        <LoginOptionsModalContent />
      </Modal>
    </>
  );
}
