import {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { PowerBILoadingSkeleton } from './PowerBILoadingSkeleton';
import { DEFAULT_POWER_BI_EMBED_URL } from '../config/powerbi.config';

export interface PowerBIEmbedContainerRef {
  reload: () => void;
  requestFullscreen: () => void;
  exitFullscreen: () => void;
  isFullscreen: () => boolean;
}

export interface PowerBIEmbedContainerProps {
  src?: string;
  title?: string;
  className?: string;
  onLoaded?: () => void;
  onError?: (error: unknown) => void;
}

/**
 * Responsive container for the FinSight Power BI Dashboard.
 *
 * Sizing Architecture:
 * - width: 100% (adapts to available parent container width)
 * - aspect-ratio: 1140 / 541.25 (~2.106:1), matching original report canvas proportions
 * - responsive minimum heights: prevents squishing on tablet and mobile viewports
 * - overflow-hidden: avoids horizontal page overflow
 * - supports HTML5 Fullscreen and iframe fullscreen
 * - graceful loading skeleton and theme-aware Modern FinTech shell
 */
export const PowerBIEmbedContainer = forwardRef<
  PowerBIEmbedContainerRef,
  PowerBIEmbedContainerProps
>(({
  src = DEFAULT_POWER_BI_EMBED_URL,
  title = 'FinSight Power BI Dashboard',
  className = '',
  onLoaded,
  onError,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Expose imperative handle for parent controls (refresh, fullscreen)
  useImperativeHandle(ref, () => ({
    reload: () => {
      setIsLoaded(false);
      if (iframeRef.current) {
        const currentSrc = iframeRef.current.src;
        iframeRef.current.src = currentSrc;
      }
    },
    requestFullscreen: () => {
      if (containerRef.current && !document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch((err) => {
          console.error('Failed to enter fullscreen:', err);
          onError?.(err);
        });
      }
    },
    exitFullscreen: () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch((err) => {
          console.error('Failed to exit fullscreen:', err);
        });
      }
    },
    isFullscreen: () => Boolean(document.fullscreenElement),
  }));

  // Track native fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Graceful loading fallback: ensure skeleton transitions out even if cross-origin policy suppresses iframe load event
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      setIsLoaded(true);
    }, 5000);
    return () => clearTimeout(fallbackTimer);
  }, []);

  const handleIframeLoad = () => {
    setIsLoaded(true);
    onLoaded?.();
  };

  return (
    <div
      ref={containerRef}
      className={`w-full max-w-full relative overflow-hidden transition-all duration-200 ${
        isFullscreen
          ? 'fixed inset-0 z-50 rounded-none border-0 h-screen w-screen !aspect-auto bg-stone-900'
          : 'rounded-2xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-[#151A2D] shadow-2xs min-h-[460px] sm:min-h-[500px] md:min-h-[540px] lg:min-h-[580px] xl:min-h-[620px]'
      } ${className}`}
      style={isFullscreen ? undefined : { aspectRatio: '1140 / 541.25' }}
    >
      {/* Loading Skeleton Overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 z-10 pointer-events-none transition-opacity duration-300">
          <PowerBILoadingSkeleton />
        </div>
      )}

      {/* Power BI Embedded Iframe */}
      <iframe
        ref={iframeRef}
        title={title}
        src={src}
        frameBorder="0"
        allowFullScreen={true}
        onLoad={handleIframeLoad}
        className={`w-full h-full block border-0 transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        loading="lazy"
      />
    </div>
  );
});

PowerBIEmbedContainer.displayName = 'PowerBIEmbedContainer';
