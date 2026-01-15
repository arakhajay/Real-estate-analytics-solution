import { Sidebar } from "@/components/Sidebar";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#F3F4F6] min-h-screen">
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar Area */}
          <div className="w-24 lg:w-72 flex-shrink-0 relative">
            <Sidebar />
          </div>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
