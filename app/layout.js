import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'

export const metadata = {
  title: 'Hawk',
  description: 'An AI coach that keeps you on track in Health, Wealth and Knowledge.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..700&family=Geist:wght@400;500;600&family=Inter:wght@400;600&family=Outfit:wght@500;600;700&family=Caveat:wght@400..700&family=Fraunces:opsz,wght@9..144,400..700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('theme') === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="bg-surface text-on-surface font-sans min-h-screen antialiased flex pb-16 md:pb-0 overflow-x-hidden">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
