import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Simple smoke test to verify Jest + Testing Library setup.
 * - Confirms jest-dom matchers are available
 * - Confirms basic user interactions work
 */

function Counter({ initial = 0 }: { initial?: number }) {
  const [count, setCount] = React.useState(initial);
  return (
    <div>
      <div>Count: {count}</div>
      <button onClick={() => setCount((c) => c + 1)}>Increment</button>
      <button onClick={() => setCount(initial)}>Reset</button>
    </div>
  );
}

test('Jest + Testing Library setup works and user interactions are functional', async () => {
  const user = userEvent.setup();
  render(<Counter initial={2} />);

  // initial render
  expect(screen.getByText(/Count:/)).toHaveTextContent('Count: 2');

  // increment
  await user.click(screen.getByRole('button', { name: /increment/i }));
  expect(screen.getByText(/Count:/)).toHaveTextContent('Count: 3');

  // reset
  await user.click(screen.getByRole('button', { name: /reset/i }));
  expect(screen.getByText(/Count:/)).toHaveTextContent('Count: 2');
});
