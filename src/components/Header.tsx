import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Settings } from 'lucide-react';
import { SettingsModal } from './SettingsModal';

export const Header: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <header className="h-14 bg-white border-b border-stone-200 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="text-xl">🍌</div>
          <h1 className="text-base font-semibold text-stone-800 hidden md:block font-sans tracking-tight">
            Nano Banana Editor
          </h1>
          <h1 className="text-base font-semibold text-stone-800 md:hidden font-sans">
            NB Editor
          </h1>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowSettings(true)}
          className="h-8 w-8"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </header>

      <SettingsModal open={showSettings} onOpenChange={setShowSettings} />
    </>
  );
};
