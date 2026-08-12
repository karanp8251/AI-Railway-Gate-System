import { useEffect, useState } from 'react';

export default function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="font-display text-cyan-400 text-sm tracking-widest">
      {time.toLocaleTimeString()} · {time.toLocaleDateString()}
    </div>
  );
}
