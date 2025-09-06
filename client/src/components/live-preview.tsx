import { useEffect, useRef } from "react";

interface LivePreviewProps {
  html: string;
  css: string;
  javascript: string;
}

export default function LivePreview({ html, css, javascript }: LivePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!iframeRef.current) return;

    const iframe = iframeRef.current;
    const document = iframe.contentDocument || iframe.contentWindow?.document;
    
    if (!document) return;

    const content = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Preview</title>
        <style>
          ${css}
        </style>
      </head>
      <body>
        ${html}
        <script>
          try {
            ${javascript}
          } catch (error) {
            console.error('JavaScript Error:', error);
          }
        </script>
      </body>
      </html>
    `;

    document.open();
    document.write(content);
    document.close();
  }, [html, css, javascript]);

  return (
    <iframe
      ref={iframeRef}
      className="w-full h-full border-0 bg-white"
      title="Live Preview"
      sandbox="allow-scripts allow-same-origin"
      data-testid="live-preview"
      style={{ minHeight: 'calc(100vh - 180px)' }}
    />
  );
}
