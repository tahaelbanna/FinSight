import React, { useMemo } from 'react';
import { PowerBIEmbed } from 'powerbi-client-react';
import { models, Report } from 'powerbi-client';

interface PowerBIEmbedContainerProps {
  reportId: string;
  embedUrl: string;
  embedToken: string;
  onLoaded?: () => void;
  onRendered?: () => void;
  onError?: (error: any) => void;
  onReportReady?: (report: Report) => void;
}

export const PowerBIEmbedContainer: React.FC<PowerBIEmbedContainerProps> = ({
  reportId,
  embedUrl,
  embedToken,
  onLoaded,
  onRendered,
  onError,
  onReportReady,
}) => {
  const embedConfig: models.IReportEmbedConfiguration = useMemo(
    () => ({
      type: 'report',
      id: reportId,
      embedUrl: embedUrl,
      accessToken: embedToken,
      tokenType: models.TokenType.Embed,
      settings: {
        panes: {
          filters: {
            expanded: false,
            visible: true,
          },
          pageNavigation: {
            visible: true,
            position: models.PageNavigationPosition.Bottom,
          },
        },
        background: models.BackgroundType.Transparent,
      },
    }),
    [reportId, embedUrl, embedToken]
  );

  const eventHandlersMap = useMemo(() => {
    const map = new Map<string, (event?: any) => void>();
    map.set('loaded', () => {
      onLoaded?.();
    });
    map.set('rendered', () => {
      onRendered?.();
    });
    map.set('error', (event?: any) => {
      onError?.(event?.detail || event);
    });
    return map;
  }, [onLoaded, onRendered, onError]);

  return (
    <div className="w-full h-[720px] rounded-2xl overflow-hidden border border-stone-200/90 bg-white shadow-2xs">
      <PowerBIEmbed
        embedConfig={embedConfig}
        eventHandlers={eventHandlersMap}
        cssClassName="w-full h-full min-h-[680px]"
        getEmbeddedComponent={(embeddedReport) => {
          if (embeddedReport && (embeddedReport as Report).fullscreen) {
            onReportReady?.(embeddedReport as Report);
          }
        }}
      />
    </div>
  );
};
