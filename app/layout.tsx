import type { Metadata } from 'next';
import { Poppins, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { StoreProvider } from '@/store/provider';
import { LocaleProvider } from '@/lib/i18n/LocaleContext';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title: 'Rede Peças Admin',
  description: 'Order administration panel for Rede Peças',
  icons: {
    icon: '/favicon.svg',
  },
};

/**
 * Root HTML layout for the whole app — sets up the fonts and wraps every
 * page in the Redux StoreProvider.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} ${jetbrainsMono.variable}`}>
      <body>
        <StoreProvider>
          <LocaleProvider>{children}</LocaleProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
