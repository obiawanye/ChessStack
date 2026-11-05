import { createElement } from 'react';
import ReactiveThemeSwitcher from './components/themes.js';

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
      createElement(ReactiveThemeSwitcher, { showAccents: true }),
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
        { className: 'appearance-card', 'aria-labelledby': 'appearance-title' },
        createElement(
          'div',
          null,
          createElement('h2', { id: 'appearance-title' }, 'Make it yours'),
          createElement(
            'p',
            null,
            'Choose a theme and accent color. Your preference stays on this device.',
          ),
        ),
      ),
    ),
  );
}
