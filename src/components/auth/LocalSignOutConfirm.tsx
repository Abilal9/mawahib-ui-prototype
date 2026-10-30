import React, { useRef, useState } from 'react';
import ConfirmActionModal from '../ui/ConfirmActionModal';
import { useAuth } from '../../context/AuthContext';

const FAILURE_MESSAGE =
  'Could not log out. You are still signed in on this device.';

/**
 * Confirmed, current-device logout shared by Settings and the sidebar.
 * AuthContext.signOut owns cache-safe cleanup and the product destination.
 * onSignedOut is UI-only and must not navigate the product tree.
 */
export function useLocalSignOutPrompt(onSignedOut?: () => void) {
  const { signOut } = useAuth();
  const onSignedOutRef = useRef(onSignedOut);
  onSignedOutRef.current = onSignedOut;
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const running = useRef(false);

  const request = () => {
    if (running.current) return;
    setFailed(false);
    setVisible(true);
  };

  const cancel = () => {
    if (running.current) return;
    setFailed(false);
    setVisible(false);
  };

  const confirm = async () => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setFailed(false);
    try {
      await signOut('logout');
      setVisible(false);
      onSignedOutRef.current?.();
    } catch {
      setFailed(true);
    } finally {
      running.current = false;
      setBusy(false);
    }
  };

  const dialog = (
    <ConfirmActionModal
      visible={visible}
      title="Log out?"
      message={
        failed
          ? FAILURE_MESSAGE
          : 'Are you sure you want to log out of this device?'
      }
      confirmLabel="Log Out"
      cancelLabel="Cancel"
      danger
      busy={busy}
      onCancel={cancel}
      onConfirm={() => {
        void confirm();
      }}
    />
  );

  return { request, dialog, busy };
}
