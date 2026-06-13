import React from 'react';
import './globals.css';

export const metadata = {
  title: 'Hikari — Autonomous STEM Learning Companion',
  description: 'An autonomous, voice-driven STEM tutor for visually impaired students, issuing on-chain credentials.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <div className="app-container">
          <header>
            <div className="logo-container">
              <span className="logo-icon" aria-hidden="true">光</span>
              <div>
                <span className="logo-title">HIKARI</span>
                <span className="sr-only">Hikari Learning Companion</span>
              </div>
            </div>
            <nav aria-label="Main Navigation">
              <a href="/" className="nav-link">Dashboard</a>
              <a href="/learn/upload" className="nav-link">Upload Diagram</a>
              <a href="/achievements" className="nav-link">Credentials</a>
            </nav>
          </header>
          <main id="main-content" className="content-area">
            {children}
          </main>
          <footer>
            <p>© 2026 Hikari Learning Systems. Designed for accessibility, portability, and independence.</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
