import React, { useEffect, useId, useRef, useState } from 'react';
import {
  Eye,
  EyeOff,
  Download,
  RotateCcw,
  KeyRound,
  Check,
  CloudUpload,
  CloudDownload,
  LogOut,
  LogIn,
  AlertCircle,
} from 'lucide-react';
import type { UIStrings } from '../i18n/translations';
import type { GoogleUserProfile } from '../utils/googleDriveBackup';

interface SettingsDialogProps {
  isOpen: boolean;
  strings: UIStrings;
  geminiApiKey: string;
  googleClientId: string;
  googleUser: GoogleUserProfile | null;
  lastCloudBackupAt: string | null;
  isCloudBusy: boolean;
  cloudError: string;
  onSaveApiKey: (key: string) => void;
  onSaveGoogleClientId: (clientId: string) => void;
  onGoogleSignIn: (clientId: string) => Promise<void>;
  onGoogleSignOut: () => void;
  onGoogleBackup: () => Promise<void>;
  onGoogleRestore: () => Promise<void>;
  onExportData: () => void;
  onResetDemoData: () => void;
  onClose: () => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  isOpen,
  strings,
  geminiApiKey,
  googleClientId,
  googleUser,
  lastCloudBackupAt,
  isCloudBusy,
  cloudError,
  onSaveApiKey,
  onSaveGoogleClientId,
  onGoogleSignIn,
  onGoogleSignOut,
  onGoogleBackup,
  onGoogleRestore,
  onExportData,
  onResetDemoData,
  onClose,
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const baseId = useId();
  const [keyInput, setKeyInput] = useState(geminiApiKey);
  const [clientIdInput, setClientIdInput] = useState(googleClientId);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    setKeyInput(geminiApiKey);
  }, [geminiApiKey]);

  useEffect(() => {
    setClientIdInput(googleClientId);
  }, [googleClientId]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      dialog.returnValue = '';
      onClose();
    };
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSaveApiKey(keyInput.trim());
    onSaveGoogleClientId(clientIdInput.trim());
    dialogRef.current?.close('saved');
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={`${baseId}-title`}
      className="confirm-dialog"
      {...({ closedby: 'any' } as Record<string, unknown>)}
    >
      <div className="confirm-dialog-inner">
        <header className="confirm-dialog-header">
          <h2 id={`${baseId}-title`} className="confirm-dialog-title">
            {strings.settingsTitle}
          </h2>
          <p className="field-hint">{strings.settingsDesc}</p>
        </header>

        {/* Google Account Cloud Backup Section */}
        <section className="google-backup-card" aria-labelledby={`${baseId}-gdrive-title`}>
          <h3 id={`${baseId}-gdrive-title`} className="google-backup-heading">
            {strings.googleBackupTitle}
          </h3>
          <p className="field-hint">{strings.googleBackupDesc}</p>

          {googleUser ? (
            <div className="google-profile-box">
              <div className="google-profile-row">
                {googleUser.picture && (
                  <img
                    src={googleUser.picture}
                    alt={googleUser.name}
                    className="google-avatar"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="google-profile-meta">
                  <strong>{googleUser.name}</strong>
                  <span>{googleUser.email}</span>
                </div>
                <button
                  type="button"
                  className="btn-secondary mini-signout-btn"
                  onClick={onGoogleSignOut}
                  disabled={isCloudBusy}
                >
                  <LogOut size={15} />
                  <span>{strings.googleSignOutBtn}</span>
                </button>
              </div>

              {lastCloudBackupAt && (
                <p className="field-hint">
                  Last backup: {new Date(lastCloudBackupAt).toLocaleString()}
                </p>
              )}

              <div className="backup-actions-box">
                <button
                  type="button"
                  className="btn-primary-confirm"
                  onClick={() => void onGoogleBackup()}
                  disabled={isCloudBusy}
                >
                  <CloudUpload size={17} />
                  <span>
                    {isCloudBusy ? strings.googleBackingUp : strings.googleBackupNowBtn}
                  </span>
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => void onGoogleRestore()}
                  disabled={isCloudBusy}
                >
                  <CloudDownload size={17} />
                  <span>
                    {isCloudBusy ? strings.googleRestoring : strings.googleRestoreBtn}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="google-signin-box">
              <div className="form-group">
                <label htmlFor={`${baseId}-gclient`} className="form-label">
                  {strings.googleClientIdLabel}
                </label>
                <input
                  id={`${baseId}-gclient`}
                  name="googleClientId"
                  type="text"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={clientIdInput}
                  onChange={(e) => setClientIdInput(e.target.value)}
                  placeholder="1234567890-abc.apps.googleusercontent.com"
                  className="form-input"
                />
              </div>
              <button
                type="button"
                className="google-signin-btn"
                onClick={() => {
                  onSaveGoogleClientId(clientIdInput.trim());
                  void onGoogleSignIn(clientIdInput.trim());
                }}
                disabled={isCloudBusy}
              >
                <LogIn size={17} />
                <span>{strings.googleSignInBtn}</span>
              </button>
            </div>
          )}

          {cloudError && (
            <div className="field-error" role="alert">
              <AlertCircle size={15} />
              <span>{cloudError}</span>
            </div>
          )}
        </section>

        <form className="confirm-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <div className="label-with-toggle">
              <label htmlFor={`${baseId}-apikey`} className="form-label">
                <KeyRound size={15} /> {strings.apiKeyLabel}
              </label>
              <button
                type="button"
                className="unmask-btn"
                aria-pressed={showKey}
                aria-label={showKey ? strings.hideKey : strings.showKey}
                aria-describedby={`${baseId}-key-warning`}
                onClick={() => setShowKey((prev) => !prev)}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                <span>{showKey ? strings.hideKey : strings.showKey}</span>
              </button>
              <span id={`${baseId}-key-warning`} className="visually-hidden">
                Warning: this will display your API key on the screen.
              </span>
            </div>

            <input
              id={`${baseId}-apikey`}
              name="geminiApiKey"
              type={showKey ? 'text' : 'password'}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="AIzaSy..."
              className="form-input"
            />
          </div>

          <div className="backup-actions-box">
            <button type="button" className="btn-secondary" onClick={onExportData}>
              <Download size={16} />
              <span>{strings.exportBtn}</span>
            </button>
            <button type="button" className="btn-secondary danger-text" onClick={onResetDemoData}>
              <RotateCcw size={16} />
              <span>{strings.resetBtn}</span>
            </button>
          </div>

          <div className="confirm-dialog-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => dialogRef.current?.close('cancel')}
            >
              {strings.closeBtn}
            </button>
            <button type="submit" className="btn-primary-confirm">
              <Check size={18} />
              <span>{strings.saveSettingsBtn}</span>
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
};
