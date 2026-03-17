import { useEffect, useState, useRef, useCallback } from 'react';
import { onBroadcastMessage, requestCurrentState } from '@/core/broadcastSync';
import type { BlankSettings, SessionScreen } from '@/core/broadcastSync';
import type { Passage } from '@/core/types';
import { loadAllAssets, type AssetType } from '@/core/assetStorage';

function BlankOverlay({ settings, assetUrls }: { settings: BlankSettings; assetUrls: Record<AssetType, string> }) {
  const session = settings.sessionScreens.find(s => s.id === settings.activeSessionId);
  const logoSrc = assetUrls.logo || settings.logoUrl;
  const bgSrc = assetUrls.softBackground || settings.softBgUrl;

  switch (settings.style) {
    case 'logo':
      return (
        <div className="min-h-screen flex items-center justify-center bg-projection p-16">
          {logoSrc ? (
            <img src={logoSrc} alt="Church Logo" className="max-w-md max-h-[50vh] object-contain opacity-80" />
          ) : (
            <p className="text-projection-foreground/30 text-2xl font-sans">No logo configured</p>
          )}
        </div>
      );
    case 'soft':
      return (
        <div
          className="min-h-screen"
          style={{
            background: bgSrc
              ? `url(${bgSrc}) center/cover no-repeat`
              : 'linear-gradient(135deg, hsl(222 47% 14%), hsl(215 25% 22%))',
          }}
        />
      );
    case 'session':
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-projection p-16 text-center gap-6">
          {logoSrc && (
            <img src={logoSrc} alt="" className="max-w-[200px] max-h-[120px] object-contain opacity-60 mb-4" />
          )}
          <h2 className="text-projection-foreground text-5xl md:text-7xl font-serif font-medium tracking-wide">
            {session?.title || 'Service'}
          </h2>
          {session?.subtitle && (
            <p className="text-projection-foreground/60 text-2xl md:text-3xl font-sans font-light tracking-wider">
              {session.subtitle}
            </p>
          )}
        </div>
      );
    default:
      return <div className="min-h-screen bg-projection" />;
  }
}

function AutoFitVerse({ passage }: { passage: Passage }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(72);

  const fitText = useCallback(() => {
    const container = containerRef.current;
    const text = textRef.current;
    if (!container || !text) return;

    let size = 72;
    const minSize = 20;
    text.style.fontSize = `${size}px`;

    while (size > minSize && text.scrollHeight > container.clientHeight) {
      size -= 2;
      text.style.fontSize = `${size}px`;
    }
    setFontSize(size);
  }, []);

  useEffect(() => {
    fitText();
    window.addEventListener('resize', fitText);
    return () => window.removeEventListener('resize', fitText);
  }, [passage, fitText]);

  return (
    <div ref={containerRef} className="flex-1 flex items-center justify-center overflow-hidden p-8 md:p-16">
      <div
        ref={textRef}
        className="max-w-[70%] text-center space-y-8"
        style={{ fontSize: `${fontSize}px` }}
      >
        <blockquote className="font-serif leading-relaxed tracking-wide text-projection-foreground">
          {passage.verses.map((verse, index) => (
            <span key={verse.verse}>
              {passage.verses.length > 1 && (
                <sup className="opacity-50 mr-1" style={{ fontSize: '0.35em' }}>{verse.verse}</sup>
              )}
              {verse.text}
              {index < passage.verses.length - 1 && ' '}
            </span>
          ))}
        </blockquote>
        <p
          className="font-sans font-medium tracking-widest uppercase text-projection-foreground/70"
          style={{ fontSize: '0.35em' }}
        >
          {passage.displayReference}
        </p>
      </div>
    </div>
  );
}

const Projection = () => {
  const [passage, setPassage] = useState<Passage | null>(null);
  const [isBlanked, setIsBlanked] = useState(false);
  const [blankSettings, setBlankSettings] = useState<BlankSettings>({
    style: 'black',
    logoUrl: '',
    softBgUrl: '',
    sessionScreens: [],
    activeSessionId: '',
  });
  const [assetUrls, setAssetUrls] = useState<Record<AssetType, string>>({ logo: '', softBackground: '' });

  // Load assets from IndexedDB on mount
  useEffect(() => {
    loadAllAssets().then(setAssetUrls);
  }, []);

  useEffect(() => {
    const unsub = onBroadcastMessage((msg) => {
      if (msg.type === 'COMMIT_PASSAGE') {
        setPassage(msg.payload);
        setIsBlanked(false);
      } else if (msg.type === 'CLEAR_PASSAGE') {
        setPassage(null);
      } else if (msg.type === 'BLANK_SCREEN') {
        setIsBlanked(true);
        if (msg.payload) setBlankSettings(msg.payload);
      } else if (msg.type === 'UNBLANK_SCREEN') {
        setIsBlanked(false);
      } else if (msg.type === 'STATE_RESPONSE') {
        setPassage(msg.payload);
      } else if (msg.type === 'RELOAD_ASSETS') {
        // Revoke old URLs and reload from IndexedDB
        Object.values(assetUrls).forEach(u => { if (u) URL.revokeObjectURL(u); });
        loadAllAssets().then(setAssetUrls);
      }
    });

    requestCurrentState();
    return unsub;
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-projection text-projection-foreground cursor-none select-none">
      {isBlanked ? (
        <BlankOverlay settings={blankSettings} assetUrls={assetUrls} />
      ) : passage ? (
        <AutoFitVerse passage={passage} />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground/30 text-2xl font-sans select-none">
            Waiting for passage…
          </div>
        </div>
      )}
    </div>
  );
};

export default Projection;
