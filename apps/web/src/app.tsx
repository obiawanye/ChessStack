import { useEffect, useState } from 'react';
import AccountPanel from './components/account-panel.js';
import BoardView from './components/board-view.js';
import NavMenu from './components/nav-menu.js';
import PgnInput from './components/pgn-input.js';

const acceptedPgnKey = 'chessstack-accepted-pgn';

export default function Web() {
  const [path, setPath] = useState(window.location.pathname);
  const [pgn, setPgn] = useState('');
  const [storageError, setStorageError] = useState('');
  const [authMessage, setAuthMessage] = useState('');

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    const authResult = new URLSearchParams(window.location.search).get('auth');
    if (authResult === 'lichess-success') setAuthMessage('Lichess account connected.');
    if (authResult === 'lichess-error')
      setAuthMessage('Lichess sign-in was not completed. Please try again.');
    if (authResult === 'lichess-already-linked') {
      setAuthMessage('That Lichess account is already linked to another ChessStack user.');
    }
    if (authResult) window.history.replaceState({}, '', window.location.pathname);
    try {
      setPgn(window.localStorage.getItem(acceptedPgnKey) ?? '');
    } catch (error) {
      console.warn('Unable to read the accepted PGN from browser storage.', error);
      setStorageError(
        'This browser could not save the game. Please enable local storage and try again.',
      );
    }
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const openBoard = (acceptedPgn: string) => {
    try {
      window.localStorage.setItem(acceptedPgnKey, acceptedPgn);
    } catch (error) {
      console.warn('Unable to save the accepted PGN for the board view.', error);
      setStorageError(
        'This browser could not save the game. Please enable local storage and try again.',
      );
      return;
    }
    setPgn(acceptedPgn);
    window.history.pushState({}, '', '/board');
    setPath('/board');
  };

  const returnToImport = () => {
    window.history.pushState({}, '', '/');
    setPath('/');
  };

  const isBoardPage = path.replace(/\/+$/, '') === '/board';

  return (
    <main className="app-shell">
      <header className="app-header">
        <a
          className="brand"
          href="/"
          aria-label="ChessStack home"
          onClick={(event) => {
            event.preventDefault();
            returnToImport();
          }}
        >
          <span className="brand-mark" aria-hidden="true">
            ♞
          </span>
          ChessStack
        </a>
        <NavMenu />
      </header>
      {isBoardPage ? (
        pgn ? (
          <BoardView pgn={pgn} onBack={returnToImport} />
        ) : (
          <section className="board-error">
            <p className="eyebrow">PGN viewer</p>
            <h1>No game to show yet.</h1>
            <p>Import and accept a PGN to open it on the board.</p>
            <button type="button" className="pgn-button pgn-paste-button" onClick={returnToImport}>
              Back to import
            </button>
          </section>
        )
      ) : (
        <section className="page-content">
          <p className="eyebrow">Chess position analysis</p>
          <h1>See the board. Understand the moment.</h1>
          <p className="page-description">
            Paste a game in PGN format and follow every move on an interactive board.
          </p>
          <div className="home-tools">
            <AccountPanel onOpenPgn={openBoard} />
            {authMessage && (
              <p className="account-message" role="status">
                {authMessage}
              </p>
            )}
            <aside className="pgn-card" aria-label="PGN import">
              <PgnInput onAccept={openBoard} />
            </aside>
          </div>
          {storageError && (
            <p className="pgn-status storage-error" role="alert">
              {storageError}
            </p>
          )}
        </section>
      )}
    </main>
  );
}
