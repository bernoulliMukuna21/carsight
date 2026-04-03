import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CarSight — Find the best car in your shortlist",
  description:
    "Paste the reg numbers from your shortlist. CarSight ranks each car by MOT risk and tells you which one to go and view first.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 dark:bg-slate-900" suppressHydrationWarning>
        <header className="border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-2">
            <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">CS</span>
              </div>
              <span className="font-bold text-lg text-gray-900 dark:text-white">
                CarSight
              </span>
            </a>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
              Find the best car in your shortlist
            </span>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
        <footer className="border-t border-gray-200 dark:border-slate-700 mt-16">
          <div className="max-w-4xl mx-auto px-4 py-6 text-sm text-gray-500 dark:text-gray-400 text-center">
            <p>
              CarSight uses DVSA MOT history data only. Scores reflect visible
              MOT risk and do not replace a physical inspection or service
              history review.
            </p>
            <p className="mt-2">&copy; 2026 CarSight. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
