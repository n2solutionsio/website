import { useState } from 'react';

export default function Welcome() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h2>React is working!</h2>
      <p>Interactive component test: clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>Click me</button>
    </div>
  );
}
