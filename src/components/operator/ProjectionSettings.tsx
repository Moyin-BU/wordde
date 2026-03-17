import { useState, useEffect, useCallback } from 'react';
import { Monitor, Image, Church, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { ImageUpload } from './ImageUpload';
import {
  type BlankStyle,
  type BlankSettings,
  type SessionScreen,
  loadBlankSettings,
  saveBlankSettings,
  broadcastReloadAssets,
} from '@/core/broadcastSync';
import { saveAsset, deleteAsset, loadAllAssets, type AssetType } from '@/core/assetStorage';

const STYLE_OPTIONS: { value: BlankStyle; label: string; icon: React.ElementType; desc: string }[] = [
  { value: 'black', label: 'Black Screen', icon: Monitor, desc: 'Solid black' },
  { value: 'logo', label: 'Church Logo', icon: Church, desc: 'Centered logo' },
  { value: 'soft', label: 'Soft Background', icon: Image, desc: 'Neutral background' },
  { value: 'session', label: 'Session Screen', icon: MessageSquare, desc: 'Title + subtitle' },
];

export function ProjectionSettings() {
  const [settings, setSettings] = useState<BlankSettings>(loadBlankSettings);
  const [assetUrls, setAssetUrls] = useState<Record<AssetType, string>>({ logo: '', softBackground: '' });

  useEffect(() => {
    loadAllAssets().then(setAssetUrls);
  }, []);

  const update = (partial: Partial<BlankSettings>) => {
    const next = { ...settings, ...partial };
    setSettings(next);
    saveBlankSettings(next);
  };

  const updateSession = (id: string, field: keyof SessionScreen, value: string) => {
    const screens = settings.sessionScreens.map(s =>
      s.id === id ? { ...s, [field]: value } : s
    );
    update({ sessionScreens: screens });
  };

  const handleImageUpload = useCallback(async (type: AssetType, file: File) => {
    await saveAsset(type, file);
    const url = URL.createObjectURL(file);
    setAssetUrls(prev => ({ ...prev, [type]: url }));
    broadcastReloadAssets();
  }, []);

  const handleImageRemove = useCallback(async (type: AssetType) => {
    await deleteAsset(type);
    if (assetUrls[type]) URL.revokeObjectURL(assetUrls[type]);
    setAssetUrls(prev => ({ ...prev, [type]: '' }));
    broadcastReloadAssets();
  }, [assetUrls]);

  return (
    <div className="space-y-4">
      {/* Blank Style */}
      <div>
        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
          Blank Screen Style
        </label>
        <div className="space-y-1">
          {STYLE_OPTIONS.map(opt => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                onClick={() => update({ style: opt.value })}
                className={cn(
                  'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left transition-colors',
                  settings.style === opt.value
                    ? 'bg-primary/10 border border-primary/30'
                    : 'hover:bg-accent/10 border border-transparent'
                )}
              >
                <Icon className={cn('h-3.5 w-3.5 shrink-0', settings.style === opt.value ? 'text-primary' : 'text-muted-foreground')} />
                <div className="min-w-0">
                  <p className={cn('text-xs font-medium', settings.style === opt.value ? 'text-primary' : 'text-foreground')}>{opt.label}</p>
                  <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Logo Upload */}
      {(settings.style === 'logo' || settings.style === 'session') && (
        <ImageUpload
          label="Church Logo"
          currentUrl={assetUrls.logo}
          onUpload={file => handleImageUpload('logo', file)}
          onRemove={() => handleImageRemove('logo')}
        />
      )}

      {/* Soft BG Upload */}
      {settings.style === 'soft' && (
        <ImageUpload
          label="Background Image"
          currentUrl={assetUrls.softBackground}
          onUpload={file => handleImageUpload('softBackground', file)}
          onRemove={() => handleImageRemove('softBackground')}
        />
      )}

      {/* Session Screens */}
      {settings.style === 'session' && (
        <div>
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
            Session Screens
          </label>
          <div className="space-y-1.5">
            {settings.sessionScreens.map(screen => (
              <div
                key={screen.id}
                className={cn(
                  'rounded-md border p-2 space-y-1.5 transition-colors',
                  settings.activeSessionId === screen.id
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-border'
                )}
              >
                <button
                  onClick={() => update({ activeSessionId: screen.id })}
                  className="w-full text-left"
                >
                  <span className={cn(
                    'text-xs font-medium',
                    settings.activeSessionId === screen.id ? 'text-primary' : 'text-foreground'
                  )}>
                    {settings.activeSessionId === screen.id ? '▶ ' : ''}{screen.title}
                  </span>
                </button>
                {settings.activeSessionId === screen.id && (
                  <div className="space-y-1">
                    <Input
                      value={screen.title}
                      onChange={e => updateSession(screen.id, 'title', e.target.value)}
                      placeholder="Title"
                      className="h-7 text-xs"
                    />
                    <Input
                      value={screen.subtitle}
                      onChange={e => updateSession(screen.id, 'subtitle', e.target.value)}
                      placeholder="Subtitle"
                      className="h-7 text-xs"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
