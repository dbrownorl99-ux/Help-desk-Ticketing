import "./globals.css";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = {
  title: "Helpdesk",
  description: "Simple helpdesk ticketing system"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50 text-neutral-900">
        <header className="border-b bg-white sticky top-0 z-20">
          <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-4">
            <Link href="/" className="font-semibold">
              Helpdesk
            </Link>
            <nav className="ml-auto flex gap-3 text-sm">
              <Link href="/new-ticket" className="underline">
                New Ticket
              </Link>
              <Link href="/admin" className="underline">
                Admin
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
