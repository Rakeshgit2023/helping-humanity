import { useEffect, useState } from 'react';
import { Text } from 'react-native';

/** "", ".", "..", "..." cycling — drop it right after a word. */
export function AnimatedDots() {
  const [n, setN] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setN((x) => (x + 1) % 4), 400);
    return () => clearInterval(t);
  }, []);

  return <Text>{'.'.repeat(n)}</Text>;
}
