import './globals.css'

export const metadata = {
  title: 'AuraScript - Collaborative Screenplay Editor',
  description: 'A premium, real-time collaborative platform for screenwriters.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
