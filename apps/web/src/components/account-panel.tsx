import { useEffect, useState, type FormEvent } from 'react';

type Provider = 'LICHESS' | 'CHESS_COM';

interface Account {
  provider: Provider;
  username: string;
}

interface Settings {
  theme: 'light' | 'dark' | 'system';
  accent: 'indigo' | 'emerald' | 'violet' | 'rose' | 'amber';
  gamesPerSync: number;
  ratedGamesOnly: boolean;
}

interface Game {
  id: string;
  provider: Provider;
  white: string;
  black: string;
  result: string;
  playedAt: string | null;
  gameUrl: string | null;
  pgn: string;
}

interface User {
  id: string;
  email: string | null;
  displayName: string | null;
  accounts: Account[];
  settings: Settings | null;
}

interface AccountResponse {
  user: User;
}

interface GamesResponse {
  games: Game[];
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/v1${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    let message = `Request failed with status ${response.status}.`;
    try {
      const body: unknown = await response.json();
      if (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string') {
        message = body.error;
      }
    } catch (error) {
      console.warn('Unable to read an API error response.', error);
    }
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

interface AccountPanelProps {
  onOpenPgn: (pgn: string) => void;
}

export default function AccountPanel({ onOpenPgn }: AccountPanelProps) {
  const [user, setUser] = useState<User | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [chessComUsername, setChessComUsername] = useState('');
  const [settings, setSettings] = useState<Settings>({
    theme: 'system',
    accent: 'indigo',
    gamesPerSync: 20,
    ratedGamesOnly: false,
  });
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    let active = true;
    request<AccountResponse>('/auth/me')
      .then(({ user: currentUser }) => {
        if (!active) return;
        setUser(currentUser);
        if (currentUser.settings) setSettings(currentUser.settings);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        if (cause instanceof Error && cause.message !== 'Sign in to continue.') {
          setError(cause.message);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    request<GamesResponse>('/games')
      .then(({ games: savedGames }) => {
        if (active) setGames(savedGames);
      })
      .catch((cause: unknown) => {
        if (active)
          setError(cause instanceof Error ? cause.message : 'Unable to load saved games.');
      });
    return () => {
      active = false;
    };
  }, [user?.id]);

  const submitCredentials = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setStatus('');
    setIsBusy(true);
    try {
      const { user: signedInUser } = await request<AccountResponse>(
        `/auth/${isRegistering ? 'register' : 'login'}`,
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        },
      );
      setUser(signedInUser);
      if (signedInUser.settings) setSettings(signedInUser.settings);
      setPassword('');
      setStatus(isRegistering ? 'Your account is ready.' : 'You are signed in.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to sign in.');
    } finally {
      setIsBusy(false);
    }
  };

  const signOut = async () => {
    setIsBusy(true);
    setError('');
    try {
      await request<void>('/auth/logout', { method: 'POST' });
      setUser(null);
      setGames([]);
      setStatus('You are signed out.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to sign out.');
    } finally {
      setIsBusy(false);
    }
  };

  const linkChessCom = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsBusy(true);
    setError('');
    setStatus('');
    try {
      const response = await request<{ account: Account; verifiedByPublicProfile: boolean }>(
        '/accounts/chess-com',
        { method: 'PUT', body: JSON.stringify({ username: chessComUsername }) },
      );
      setUser((current) =>
        current
          ? {
              ...current,
              accounts: [
                ...current.accounts.filter((account) => account.provider !== 'CHESS_COM'),
                response.account,
              ],
            }
          : current,
      );
      setChessComUsername('');
      setStatus('Chess.com profile verified and linked.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to link Chess.com.');
    } finally {
      setIsBusy(false);
    }
  };

  const unlinkChessCom = async () => {
    setIsBusy(true);
    setError('');
    try {
      await request<void>('/accounts/chess-com', { method: 'DELETE' });
      setUser((current) =>
        current
          ? {
              ...current,
              accounts: current.accounts.filter((account) => account.provider !== 'CHESS_COM'),
            }
          : current,
      );
      setStatus('Chess.com account unlinked.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to unlink Chess.com.');
    } finally {
      setIsBusy(false);
    }
  };

  const syncGames = async () => {
    setIsBusy(true);
    setError('');
    setStatus('');
    try {
      const result = await request<{ imported: number; games: Game[] }>('/games/sync', {
        method: 'POST',
      });
      setGames(result.games);
      setStatus(`Imported ${result.imported} game${result.imported === 1 ? '' : 's'}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to import games.');
    } finally {
      setIsBusy(false);
    }
  };

  const saveSettings = async (nextSettings: Settings) => {
    const previousSettings = settings;
    setIsSavingSettings(true);
    setSettings(nextSettings);
    setError('');
    try {
      const result = await request<{ settings: Settings }>('/settings', {
        method: 'PUT',
        body: JSON.stringify(nextSettings),
      });
      setSettings(result.settings);
      setStatus('Game import settings saved.');
    } catch (cause) {
      setSettings(previousSettings);
      setError(cause instanceof Error ? cause.message : 'Unable to save settings.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const chessCom = user?.accounts.find((account) => account.provider === 'CHESS_COM');
  const lichess = user?.accounts.find((account) => account.provider === 'LICHESS');

  return (
    <section className="account-card" aria-label="Accounts and saved games">
      <div className="account-heading">
        <div>
          <p className="eyebrow">Your chess library</p>
          <h2>
            {user
              ? `Welcome${user.displayName ? `, ${user.displayName}` : ''}`
              : 'Your accounts & games'}
          </h2>
        </div>
        {user && (
          <button type="button" className="board-button" onClick={signOut} disabled={isBusy}>
            Sign out
          </button>
        )}
      </div>

      {!user ? (
        <div className="account-signin">
          <div className="account-provider-actions">
            <a className="account-provider-button lichess-button" href="/api/v1/auth/lichess">
              Continue with Lichess
            </a>
            <p>Chess.com profiles can be linked after signing in.</p>
          </div>
          <form className="account-form" onSubmit={submitCredentials}>
            <label>
              Email
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.currentTarget.value)}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                autoComplete={isRegistering ? 'new-password' : 'current-password'}
                minLength={10}
                maxLength={128}
                required
                value={password}
                onChange={(event) => setPassword(event.currentTarget.value)}
              />
            </label>
            <button type="submit" className="pgn-button pgn-paste-button" disabled={isBusy}>
              {isBusy ? 'Please wait…' : isRegistering ? 'Create account' : 'Sign in'}
            </button>
            <button
              type="button"
              className="account-text-button"
              onClick={() => setIsRegistering((registering) => !registering)}
            >
              {isRegistering
                ? 'Already have an account? Sign in'
                : 'New to ChessStack? Create an account'}
            </button>
          </form>
        </div>
      ) : (
        <div className="account-dashboard">
          <div className="connected-accounts">
            <h3>Connected accounts</h3>
            <div className="connected-account-row">
              <span>
                <strong>Lichess</strong>
                <span className="connected-account-detail">
                  {lichess?.username ?? 'Not connected'}
                </span>
              </span>
              {lichess ? (
                <span className="connection-status">Connected</span>
              ) : (
                <a className="account-link" href="/api/v1/auth/lichess">
                  Connect
                </a>
              )}
            </div>
            <div className="connected-account-row">
              <span>
                <strong>Chess.com</strong>
                <span className="connected-account-detail">
                  {chessCom?.username ?? 'Public profile verification'}
                </span>
              </span>
              {chessCom ? (
                <button
                  type="button"
                  className="account-text-button"
                  onClick={unlinkChessCom}
                  disabled={isBusy}
                >
                  Unlink
                </button>
              ) : (
                <span className="connection-status">Not connected</span>
              )}
            </div>
            {!chessCom && (
              <form className="chess-com-link-form" onSubmit={linkChessCom}>
                <label htmlFor="chess-com-username">Chess.com username</label>
                <div>
                  <input
                    id="chess-com-username"
                    autoComplete="username"
                    value={chessComUsername}
                    onChange={(event) => setChessComUsername(event.currentTarget.value)}
                    required
                  />
                  <button type="submit" className="board-button" disabled={isBusy}>
                    Verify & link
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="game-settings">
            <h3>Game import settings</h3>
            <label>
              Recent games to import
              <select
                value={settings.gamesPerSync}
                disabled={isSavingSettings}
                onChange={(event) =>
                  void saveSettings({
                    ...settings,
                    gamesPerSync: Number(event.currentTarget.value),
                  })
                }
              >
                {[10, 20, 50, 100].map((count) => (
                  <option key={count} value={count}>
                    {count} games
                  </option>
                ))}
              </select>
            </label>
            <label className="rated-only-setting">
              <input
                type="checkbox"
                checked={settings.ratedGamesOnly}
                disabled={isSavingSettings}
                onChange={(event) =>
                  void saveSettings({ ...settings, ratedGamesOnly: event.currentTarget.checked })
                }
              />
              Rated games only
            </label>
            <button
              type="button"
              className="pgn-button pgn-paste-button"
              onClick={syncGames}
              disabled={isBusy || user.accounts.length === 0}
            >
              {isBusy ? 'Working…' : 'Import games'}
            </button>
          </div>

          {games.length > 0 && (
            <div className="saved-games">
              <h3>Recently imported</h3>
              {games.map((game) => (
                <button
                  key={game.id}
                  type="button"
                  className="saved-game-row"
                  onClick={() => onOpenPgn(game.pgn)}
                >
                  <span>
                    {game.white} — {game.black}
                  </span>
                  <span>{game.result}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {(status || error) && (
        <p
          className={`account-message${error ? ' account-message-error' : ''}`}
          role={error ? 'alert' : 'status'}
        >
          {error || status}
        </p>
      )}
    </section>
  );
}
