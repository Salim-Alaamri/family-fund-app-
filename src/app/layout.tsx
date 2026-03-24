import './globals.css'

export default function RootLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
      <html lang="ar" dir="rtl">
        <body className="min-h-screen bg-gray-50">
          <div className="flex min-h-screen flex-col">
            <div className="flex-1">{children}</div>
            <footer className="px-4 pb-4 text-center text-[11px] font-light text-gray-400">
              Developed by Salim Alaamri
            </footer>
          </div>
        </body>
      </html>
    )
  }
  