import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'TaskFlow — Scalable Task Manager',
  description: 'A secure, JWT-authenticated task management platform with role-based access control.',
  keywords: ['task management', 'productivity', 'REST API', 'JWT'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <AuthProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#000',
                color: '#ededed',
                border: '1px solid #333',
                borderRadius: '6px',
                fontSize: '0.875rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              },
              success: { iconTheme: { primary: '#ededed', secondary: '#000' } },
              error: { iconTheme: { primary: '#ff4444', secondary: '#000' } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
