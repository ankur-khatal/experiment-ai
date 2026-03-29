import { useState, useEffect } from 'react';

interface SessionStatsProps {
  gestureCount: number;
  clickCount: number;
  scrollDistance: number;
  startTime: number;
}

export function SessionStats({ gestureCount, clickCount, scrollDistance, startTime }: SessionStatsProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  const stats = [
    { label: 'Gestures', value: gestureCount },
    { label: 'Clicks', value: clickCount },
    { label: 'Scroll', value: scrollDistance },
    { label: 'Duration', value: `${minutes}:${seconds.toString().padStart(2, '0')}` },
  ];

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <h3 className="text-sm font-medium text-zinc-300 mb-3">Session Stats</h3>
      <div className="grid grid-cols-4 gap-4">
        {stats.map(({ label, value }) => (
          <div key={label}>
            <p className="text-xs text-zinc-500">{label}</p>
            <p className="font-mono text-2xl text-zinc-200">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
