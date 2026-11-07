import { Chess, type Move } from 'chess.js';
import { useMemo, useState } from 'react';

interface BoardViewProps {
  pgn: string;
  onBack: () => void;
}

const pieces: Record<string, string> = {
  wk: '♔',
  wq: '♕',
  wr: '♖',
  wb: '♗',
  wn: '♘',
  wp: '♙',
  bk: '♚',
  bq: '♛',
  br: '♜',
  bb: '♝',
  bn: '♞',
  bp: '♟',
};

function parseGame(pgn: string) {
  const chess = new Chess();
  chess.loadPgn(pgn);
  const headers = chess.getHeaders();
  const moves = chess.history({ verbose: true });
  const startingFen = moves[0]?.before ?? headers.FEN;
  const initialPosition = new Chess(startingFen);
  const positions = [initialPosition.fen()];

  for (const move of moves) {
    initialPosition.move(move);
    positions.push(initialPosition.fen());
  }

  return { headers, moves, positions };
}

export default function BoardView({ pgn, onBack }: BoardViewProps) {
  const parsed = useMemo(() => {
    try {
      return { game: parseGame(pgn), error: '' };
    } catch (error) {
      return {
        game: null,
        error: error instanceof Error ? error.message : 'This PGN could not be read.',
      };
    }
  }, [pgn]);
  const [moveIndex, setMoveIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (!parsed.game) {
    return (
      <section className="board-error" role="alert">
        <p className="eyebrow">PGN viewer</p>
        <h1>We could not load this game.</h1>
        <p>{parsed.error}</p>
        <button type="button" className="pgn-button pgn-paste-button" onClick={onBack}>
          Back to import
        </button>
      </section>
    );
  }

  const { headers, moves, positions } = parsed.game;
  const currentMove = moves[moveIndex - 1] as Move | undefined;
  const game = new Chess(positions[Math.min(moveIndex, positions.length - 1)]);
  const board = game.board();
  const files = isFlipped ? 'hgfedcba' : 'abcdefgh';
  const ranks = isFlipped ? '12345678' : '87654321';
  const result = headers.Result && headers.Result !== '*' ? headers.Result : 'In progress';
  const players = `${headers.White || 'White'} vs ${headers.Black || 'Black'}`;

  const goToMove = (index: number) => {
    setMoveIndex(Math.max(0, Math.min(index, moves.length)));
  };

  return (
    <section className="board-page">
      <div className="board-page-heading">
        <div>
          <button type="button" className="board-back-button" onClick={onBack}>
            <span aria-hidden="true">←</span> Import another game
          </button>
          <p className="eyebrow">PGN viewer</p>
          <h1>{headers.Event || 'Imported game'}</h1>
          <p className="board-subtitle">
            {players} <span aria-hidden="true">·</span> {result}
          </p>
        </div>
        <button
          type="button"
          className="board-button board-flip-button"
          onClick={() => setIsFlipped((flipped) => !flipped)}
        >
          Flip board
        </button>
      </div>

      <div className="board-workspace">
        <div className="board-panel">
          {headers.White && (
            <div className="board-player board-player-top">
              <span className="board-player-piece" aria-hidden="true">
                {isFlipped ? '♔' : '♚'}
              </span>
              <span>{isFlipped ? headers.White : headers.Black}</span>
            </div>
          )}
          <div className="chess-board" role="grid" aria-label="Chess board">
            {ranks.split('').map((rank) =>
              files.split('').map((file) => {
                const square = `${file}${rank}`;
                const piece = board[8 - Number(rank)]?.[file.charCodeAt(0) - 97];
                const isLight = (file.charCodeAt(0) - 97 + Number(rank)) % 2 === 0;
                const isLastMove = currentMove?.from === square || currentMove?.to === square;
                return (
                  <div
                    key={square}
                    role="gridcell"
                    aria-label={`${square}${piece ? ` ${piece.color === 'w' ? 'white' : 'black'} ${piece.type}` : ''}`}
                    className={`board-square ${isLight ? 'board-square-light' : 'board-square-dark'}${isLastMove ? ' board-square-last-move' : ''}`}
                  >
                    {file === files[0] && (
                      <span className="board-coordinate board-rank">{rank}</span>
                    )}
                    {rank === ranks[ranks.length - 1] && (
                      <span className="board-coordinate board-file">{file}</span>
                    )}
                    {piece && (
                      <span
                        className={`chess-piece ${piece.color === 'w' ? 'chess-piece-white' : 'chess-piece-black'}`}
                        aria-hidden="true"
                      >
                        {pieces[`${piece.color}${piece.type}`]}
                      </span>
                    )}
                  </div>
                );
              }),
            )}
          </div>
          {headers.Black && (
            <div className="board-player board-player-bottom">
              <span className="board-player-piece" aria-hidden="true">
                {isFlipped ? '♚' : '♔'}
              </span>
              <span>{isFlipped ? headers.Black : headers.White}</span>
            </div>
          )}
        </div>

        <aside className="move-panel" aria-label="Game moves">
          <div className="move-panel-heading">
            <div>
              <h2>Moves</h2>
              <p>{moves.length} half-moves</p>
            </div>
            <span className="move-counter">
              {moveIndex} / {moves.length}
            </span>
          </div>
          <div className="move-list" role="list" aria-label="Move list">
            {moves.length === 0 ? (
              <p className="move-empty">This game has no moves.</p>
            ) : (
              Array.from({ length: Math.ceil(moves.length / 2) }, (_, index) => {
                const whiteIndex = index * 2;
                const blackIndex = whiteIndex + 1;
                return (
                  <div className="move-row" role="listitem" key={whiteIndex}>
                    <span className="move-number">{index + 1}.</span>
                    <button
                      type="button"
                      className={`move-san${moveIndex === whiteIndex + 1 ? ' move-san-active' : ''}`}
                      aria-current={moveIndex === whiteIndex + 1 ? 'step' : undefined}
                      onClick={() => goToMove(whiteIndex + 1)}
                    >
                      {moves[whiteIndex]?.san}
                    </button>
                    {moves[blackIndex] && (
                      <button
                        type="button"
                        className={`move-san${moveIndex === blackIndex + 1 ? ' move-san-active' : ''}`}
                        aria-current={moveIndex === blackIndex + 1 ? 'step' : undefined}
                        onClick={() => goToMove(blackIndex + 1)}
                      >
                        {moves[blackIndex]?.san}
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
          <div className="move-controls" role="group" aria-label="Playback controls">
            <button
              type="button"
              className="board-button"
              aria-label="First move"
              onClick={() => goToMove(0)}
              disabled={moveIndex === 0}
            >
              |◀
            </button>
            <button
              type="button"
              className="board-button"
              aria-label="Previous move"
              onClick={() => goToMove(moveIndex - 1)}
              disabled={moveIndex === 0}
            >
              ◀
            </button>
            <button
              type="button"
              className="board-button board-button-primary"
              aria-label="Next move"
              onClick={() => goToMove(moveIndex + 1)}
              disabled={moveIndex === moves.length}
            >
              ▶
            </button>
            <button
              type="button"
              className="board-button"
              aria-label="Last move"
              onClick={() => goToMove(moves.length)}
              disabled={moveIndex === moves.length}
            >
              ▶|
            </button>
          </div>
          {currentMove && (
            <p className="current-move" aria-live="polite">
              Move {Math.ceil(moveIndex / 2)}
              {moveIndex % 2 ? ' White' : ' Black'}: {currentMove.san}
            </p>
          )}
        </aside>
      </div>
    </section>
  );
}
