import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      gutter={12}
      toastOptions={{
        duration: 4000,
        style: {
          fontFamily: '"DM Sans", system-ui, sans-serif',
          background: '#fff',
          color: '#1C1917',
          borderRadius: '0.75rem',
          padding: '12px 16px',
          boxShadow:
            '0 4px 12px rgba(28, 25, 23, 0.1), 0 1px 3px rgba(28, 25, 23, 0.06)',
          fontSize: '0.875rem',
          maxWidth: '420px',
        },
        success: {
          iconTheme: {
            primary: '#15803D',
            secondary: '#fff',
          },
          style: {
            borderLeft: '4px solid #15803D',
          },
        },
        error: {
          iconTheme: {
            primary: '#DC2626',
            secondary: '#fff',
          },
          style: {
            borderLeft: '4px solid #DC2626',
          },
        },
      }}
    />
  );
}
