import { createElement } from 'react';
import NavMenu from './components/nav-menu.js';
import PgnInput from './components/pgn-input.js';

export default function Web() {
  return createElement(
    'main',
    { className: 'app-shell' },
    createElement(
      'header',
      { className: 'app-header' },
      createElement(
        'a',
        { className: 'brand', href: '/', 'aria-label': 'ChessStack home' },
        createElement('span', { className: 'brand-mark', 'aria-hidden': true }, '♞'),
        'ChessStack',
      ),
      createElement(NavMenu),
    ),
    createElement(
      'section',
      { className: 'page-content' },
      createElement('p', { className: 'eyebrow' }, 'Chess position analysis'),
      createElement('h1', null, 'See the board. Understand the moment.'),
      createElement(
        'p',
        { className: 'page-description' },
        'A focused space for turning chessboard images into clear, useful insights.',
      ),
      createElement(
        'aside',
        { className: 'pgn-card', 'aria-label': 'PGN import' },
        createElement(PgnInput),
      ),
    ),
  );
}
