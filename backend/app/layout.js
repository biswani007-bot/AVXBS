import './globals.css';

export const metadata = {
  title: 'AVXBS Control Panel & Administration',
  description: 'Management portal for AVXBS Water Treatment Systems',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

