import { useState } from 'react';

type Screen = 'home' | 'calibration' | 'dashboard' | 'settings';

export function App() {
  const [screen, setScreen] = useState<Screen>('home');

  return (
    <div className="flex h-screen bg-zinc-950">
      <nav className="w-64 border-r border-zinc-800 p-4 flex flex-col gap-2">
        <h1 className="text-lg font-semibold mb-6 px-3">Experiment AI</h1>
        {(['home', 'calibration', 'dashboard', 'settings'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setScreen(s)}
            className={`px-3 py-2 rounded-lg text-sm text-left capitalize transition-colors ${
              screen === s
                ? 'bg-zinc-800 text-zinc-50'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            {s}
          </button>
        ))}
      </nav>
      <main className="flex-1 p-6 overflow-auto">
        <p className="text-zinc-400">{screen} screen — coming soon</p>
      </main>
    </div>
  );
}
