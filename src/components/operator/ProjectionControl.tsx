import { useState, useEffect, useRef, useCallback } from 'react';
import { onBroadcastMessage, broadcastStateResponse, broadcastSync, loadBlankSettings } from '@/core/broadcastSync';
import { useStateManager } from '@/core/stateManager';
import { Monitor, ExternalLink, Wifi, WifiOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ProjectionStatus = 'idle' | 'connecting' | 'active' | 'disconnected';

const SETUP_STEPS = [
  'Move the projection window to the TV screen',
  'Press F11 in the projection window for fullscreen',
  'Return to this screen to control slides',
];

export function ProjectionControl() {
  const [status, setStatus] = useState<ProjectionStatus>('idle');
  const [showGuide, setShowGuide] = useState(false);
  const projectorWindowRef = useRef<Window | null>(null);
  const lastHeartbeatRef = useRef<number>(0);

  const { committedPassage, isScreenBlanked } = useStateManager();

  // Listen for PROJECTOR_READY + HEARTBEAT
  useEffect(() => {
    const unsub = onBroadcastMessage((msg) => {
      if (msg.type === 'PROJECTOR_READY') {
        setStatus('active');
        setShowGuide(true);
      } else if (msg.type === 'HEARTBEAT') {
        lastHeartbeatRef.current = msg.timestamp;
        if (status === 'disconnected' || status === 'connecting') {
          setStatus('active');
        }
      } else if (msg.type === 'REQUEST_STATE') {
        const state = useStateManager.getState();
        broadcastStateResponse(state.committedPassage);
      }
    });
    return unsub;
  }, [status]);

  // Heartbeat timeout checker
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastHeartbeatRef.current && Date.now() - lastHeartbeatRef.current > 5000) {
        if (status === 'active') setStatus('disconnected');
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [status]);

  // Periodic state re-sync
  useEffect(() => {
    const interval = setInterval(() => {
      const state = useStateManager.getState();
      broadcastSync(
        state.committedPassage,
        state.isScreenBlanked,
        state.isScreenBlanked ? loadBlankSettings() : undefined
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Auto-hide guide after 12 seconds
  useEffect(() => {
    if (!showGuide) return;
    const timer = setTimeout(() => setShowGuide(false), 12000);
    return () => clearTimeout(timer);
  }, [showGuide]);

  const startProjection = useCallback(() => {
    // If window exists and is open, just focus
    if (projectorWindowRef.current && !projectorWindowRef.current.closed) {
      projectorWindowRef.current.focus();
      if (status === 'disconnected') {
        // Re-send current state
        const state = useStateManager.getState();
        broadcastSync(
          state.committedPassage,
          state.isScreenBlanked,
          state.isScreenBlanked ? loadBlankSettings() : undefined
        );
        setStatus('active');
      }
      return;
    }

    setStatus('connecting');
    projectorWindowRef.current = window.open('/projection', 'projector');

    // Send INIT state after a short delay
    setTimeout(() => {
      const state = useStateManager.getState();
      broadcastSync(
        state.committedPassage,
        state.isScreenBlanked,
        state.isScreenBlanked ? loadBlankSettings() : undefined
      );
    }, 500);
  }, [status]);

  const statusConfig = {
    idle: {
      label: 'Start Projection',
      icon: ExternalLink,
      variant: 'default' as const,
      disabled: false,
    },
    connecting: {
      label: 'Setting up projection…',
      icon: Monitor,
      variant: 'outline' as const,
      disabled: true,
    },
    active: {
      label: 'Projection Active',
      icon: Wifi,
      variant: 'outline' as const,
      disabled: false,
    },
    disconnected: {
      label: 'Reconnect Projector',
      icon: WifiOff,
      variant: 'destructive' as const,
      disabled: false,
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="relative flex items-center gap-3">
      {/* Status indicator dot */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span
          className={cn(
            'h-2 w-2 rounded-full transition-colors',
            status === 'active' && 'bg-green-500',
            status === 'connecting' && 'bg-yellow-500 animate-pulse',
            status === 'disconnected' && 'bg-destructive',
            status === 'idle' && 'bg-muted-foreground/40'
          )}
        />
        <span className="hidden sm:inline">
          {status === 'active' && 'Connected'}
          {status === 'connecting' && 'Connecting…'}
          {status === 'disconnected' && 'Disconnected'}
          {status === 'idle' && 'Not started'}
        </span>
      </div>

      <Button
        variant={config.variant}
        size="sm"
        className="h-7 text-xs gap-1.5"
        onClick={startProjection}
        disabled={config.disabled}
      >
        <Icon className="h-3.5 w-3.5" />
        {config.label}
      </Button>

      {/* Guided setup overlay */}
      {showGuide && status === 'active' && (
        <div className="absolute top-full right-0 mt-2 z-50 w-64 rounded-lg border border-border bg-card shadow-lg p-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-primary">Setup Guide</span>
            <button
              onClick={() => setShowGuide(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <ol className="space-y-1.5">
            {SETUP_STEPS.map((step, i) => (
              <li key={i} className="flex gap-2 text-[11px] text-muted-foreground">
                <span className="shrink-0 w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
