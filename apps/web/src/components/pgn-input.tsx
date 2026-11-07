import { Chess } from 'chess.js';
import { useEffect, useRef, useState } from 'react';

interface PgnInputProps {
  onAccept?: (pgn: string) => void;
}

export default function PgnInput({ onAccept }: PgnInputProps) {
  const [pgn, setPgn] = useState('');
  const [acceptedPgn, setAcceptedPgn] = useState('');
  const [status, setStatus] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isPasting, setIsPasting] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pasteRequest = useRef(0);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  const openDialog = () => {
    setPgn(acceptedPgn);
    setStatus('');
    setIsOpen(true);
  };

  const denyPgn = () => {
    pasteRequest.current += 1;
    setIsPasting(false);
    setPgn(acceptedPgn);
    setStatus('');
    setIsOpen(false);
  };

  const acceptPgn = () => {
    if (!pgn.trim()) {
      setStatus('Add a PGN before accepting.');
      return;
    }

    const trimmedPgn = pgn.trim();
    try {
      new Chess().loadPgn(trimmedPgn);
    } catch (error) {
      setStatus(
        error instanceof Error
          ? `This PGN could not be read: ${error.message}`
          : 'This PGN could not be read.',
      );
      return;
    }

    setAcceptedPgn(trimmedPgn);
    setPgn(trimmedPgn);
    setStatus('');
    setIsOpen(false);
    onAccept?.(trimmedPgn);
  };

  const pasteFromClipboard = async () => {
    setStatus('');
    if (!navigator.clipboard?.readText) {
      setStatus('Clipboard access is not available in this browser.');
      return;
    }

    setIsPasting(true);
    const requestId = ++pasteRequest.current;
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (requestId !== pasteRequest.current) return;
      if (!clipboardText.trim()) {
        setStatus('Your clipboard is empty.');
        return;
      }

      setPgn(clipboardText);
      setStatus('PGN pasted. Review it before accepting.');
    } catch (error) {
      if (requestId !== pasteRequest.current) return;
      console.warn('Unable to read PGN from the clipboard.', error);
      setStatus('Could not access the clipboard. You can paste your PGN into the field.');
    } finally {
      if (requestId === pasteRequest.current) setIsPasting(false);
    }
  };

  return (
    <div className="pgn-import">
      <button type="button" className="pgn-button pgn-paste-button" onClick={openDialog}>
        {acceptedPgn ? 'Review accepted PGN' : 'Import a PGN'}
      </button>
      {acceptedPgn && (
        <p className="pgn-accepted" role="status">
          PGN accepted
        </p>
      )}
      <dialog
        ref={dialogRef}
        className="pgn-dialog"
        aria-labelledby="pgn-title"
        onCancel={(event) => {
          event.preventDefault();
          denyPgn();
        }}
        onClose={() => setIsOpen(false)}
      >
        <div className="pgn-input">
          <div className="pgn-dialog-heading">
            <div>
              <h2 id="pgn-title">Review PGN</h2>
              <p>Paste or edit a game, then choose whether to accept or cancel.</p>
            </div>
            <span className="pgn-review-badge">Review</span>
          </div>
          <label className="pgn-label" htmlFor="pgn-text">
            PGN
          </label>
          <textarea
            id="pgn-text"
            className="pgn-textarea"
            value={pgn}
            onChange={(event) => {
              setPgn(event.currentTarget.value);
              setStatus('');
            }}
            disabled={isPasting}
            placeholder={'[Event "Casual Game"]\n\n1. e4 e5 2. Nf3 Nc6'}
            rows={8}
            spellCheck={false}
          />
          <div className="pgn-dialog-footer">
            <p className="pgn-status" role="status" aria-live="polite">
              {status}
            </p>
            <div className="pgn-actions">
              <button
                type="button"
                className="pgn-button pgn-neutral-button"
                onClick={pasteFromClipboard}
                disabled={isPasting}
              >
                {isPasting ? 'Pasting…' : 'Paste'}
              </button>
              <button type="button" className="pgn-button pgn-deny-button" onClick={denyPgn}>
                Cancel
              </button>
              <button
                type="button"
                className="pgn-button pgn-paste-button"
                onClick={acceptPgn}
                disabled={isPasting}
              >
                Accept PGN
              </button>
            </div>
          </div>
        </div>
      </dialog>
    </div>
  );
}
