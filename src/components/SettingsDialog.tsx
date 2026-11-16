import React, { useEffect, useId, useRef, useState } from 'react';
import { Eye, EyeOff, Download, RotateCcw, KeyRound, Check } from 'lucide-react';
import type { UIStrings } from '../i18n/translations';

interface SettingsDialogProps {
  isOpen: boolean;
  strings: UIStrings;
  geminiApiKey: string;
  onSaveApiKey: (key: string) => void;
  onExportData: () => void;
  onResetDemoData: () => void;
  onClose: () => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  isOpen,
  strings,
  geminiApiKey,
  onSaveApiKey,
  onExportData,
  onResetDemoData,
  onClose,
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const baseId = useId();
  const [keyInput, setKeyInput] = useState(geminiApiKey);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    setKeyInput(geminiApiKey);
  }, [geminiApiKey]);

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
