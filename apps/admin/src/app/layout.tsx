import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'پنل مدیریت | آفرود شاپ',
  description: 'پنل مدیریت فروشگاه آفرود شاپ',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
