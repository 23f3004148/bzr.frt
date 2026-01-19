import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

export type FlashVariant = 'info' | 'success' | 'warning' | 'error';

interface FlashState {
  message: string;
  variant: FlashVariant;
}

interface FlashContextValue {
  showFlash: (message: string, variant?: FlashVariant, durationMs?: number) => void;
}

const FlashContext = createContext<FlashContextValue | undefined>(undefined);

export const FlashProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const [flash, setFlash] = useState<FlashState | null>(null);
  const timerRef = useRef<number | null>(null);
  const showFlash = useCallback(
    (message: string, variant: FlashVariant = 'info', durationMs = 4000) => {
      setFlash({ message, variant });
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        setFlash(null);
        timerRef.current = null;
      }, durationMs);
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const flashClass = useMemo(() => {
    if (!flash) return '';
    switch (flash.variant) {
      case 'success':
        return 'bg-emerald-500/95 border-emerald-300 text-white';
      case 'warning':
        return 'bg-amber-500/95 border-amber-300 text-white';
      case 'error':
        return 'bg-red-500/95 border-red-300 text-white';
      default:
        return 'bg-blue-500/95 border-blue-300 text-white';
    }
  }, [flash]);

  return (
    <FlashContext.Provider value={{ showFlash }}>
      {children}
      {flash && (
        <div
          className={`pointer-events-auto fixed top-20 right-6 z-50 max-w-lg rounded-3xl border px-6 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)] ${flashClass}`}
          style={{ whiteSpace: 'pre-line', fontSize: '1rem', lineHeight: 1.5 }}
        >
          {flash.message}
        </div>
      )}
    </FlashContext.Provider>
  );
};

export const useFlash = (): FlashContextValue => {
  const context = useContext(FlashContext);
  if (!context) {
    throw new Error('useFlash must be used within a FlashProvider');
  }
  return context;
};
