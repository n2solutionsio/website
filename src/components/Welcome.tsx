import { useState } from 'react';

export default function Welcome() {
  const [count, setCount] = useState(0);

  return (
    <div className="rounded-lg border border-border bg-bg-secondary p-6">
      <h2 className="mb-2 text-xl">React is working!</h2>
      <p className="mb-4 text-text-muted">
        Interactive component test: clicked {count} times
      </p>
      <button
        onClick={() => setCount(count + 1)}
        className="rounded-md bg-accent px-4 py-2 font-medium text-bg transition-colors hover:bg-accent-hover"
      >
        Click me
      </button>
    </div>
  );
}
