import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

// Fallback for <dialog closedby="any"> light-dismiss where native closedBy is missing
if (typeof window !== 'undefined' && !('closedBy' in HTMLDialogElement.prototype)) {
  const outside = (e: PointerEvent, dialog: HTMLDialogElement) => {
    const r = dialog.getBoundingClientRect();
    return (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    );
  };

  let pressedOutsideDialog: HTMLDialogElement | null = null;
  document.addEventListener('pointerdown', (e) => {
    const target = e.target as HTMLElement | null;
    const dialog = target?.closest?.('dialog[closedby="any"]') as HTMLDialogElement | null;
    if (dialog && outside(e, dialog)) {
      pressedOutsideDialog = dialog;
    } else {
      pressedOutsideDialog = null;
    }
  });

  document.addEventListener('pointerup', (e) => {
    if (pressedOutsideDialog && outside(e, pressedOutsideDialog)) {
      pressedOutsideDialog.close();
    }
    pressedOutsideDialog = null;
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
