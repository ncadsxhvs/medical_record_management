'use client';

import { useEffect } from 'react';

export default function ApiDocsPage() {
  useEffect(() => {
    // Dynamically load Swagger UI CSS and JS
    const loadSwaggerUI = async () => {
      // Load CSS
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://unpkg.com/swagger-ui-dist@5/swagger-ui.css';
      document.head.appendChild(cssLink);

      // Load JS bundles
      const scripts = [
        'https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js',
        'https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js'
      ];

      for (const src of scripts) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = src;
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }

      // Initialize Swagger UI
      if (window.SwaggerUIBundle) {
        window.ui = window.SwaggerUIBundle({
          url: '/openapi.yaml',
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [
            window.SwaggerUIBundle.presets.apis,
            window.SwaggerUIStandalonePreset
          ],
          plugins: [
            window.SwaggerUIBundle.plugins.DownloadUrl
          ],
          layout: 'StandaloneLayout',
          defaultModelsExpandDepth: 1,
          defaultModelExpandDepth: 1,
          docExpansion: 'list',
          filter: true,
          tryItOutEnabled: true,
          persistAuthorization: true
        });
      }
    };

    loadSwaggerUI();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div id="swagger-ui"></div>
      <style jsx global>{`
        .topbar {
          display: none;
        }
        .swagger-ui .info {
          margin: 30px 0;
        }
        .swagger-ui .scheme-container {
          background: #f7f7f7;
          box-shadow: 0 1px 2px 0 rgba(0,0,0,.15);
          margin: 0 0 20px 0;
          padding: 20px;
        }
      `}</style>
    </div>
  );
}

// TypeScript declarations for Swagger UI
declare global {
  interface Window {
    SwaggerUIBundle: any;
    SwaggerUIStandalonePreset: any;
    ui: any;
  }
}
