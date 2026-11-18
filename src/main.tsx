// Entry point (ADR-010): registers styles, mounts <App/>.
import { render } from 'preact';

import './styles/tokens.css';
import './styles/reset.css';
import './styles/components.css';
import './styles/screens.css';

import { App } from './app.tsx';

const root = document.getElementById('app');
if (!root) {
  throw new Error('Missing #app element');
}
render(<App />, root);
