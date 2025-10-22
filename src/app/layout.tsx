import './globals.css';

export const metadata = {
  title: 'Furfield Auth - Authentication Service',
  description: 'Centralized authentication for Furfield HMS ecosystem',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
