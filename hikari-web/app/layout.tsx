import React from 'react';
import './globals.css';

export const metadata = {
  title: 'Hikari — Assistive STEM Learning',
  description: 'An autonomous, voice-driven STEM tutor for visually impaired students.',
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
              <span className="logo-title">HIKARI</span>
              <span className="sr-only">Learning Companion</span>
            </div>
            <nav aria-label="Main Navigation">
              <a href="/" className="nav-link">Classroom</a>
              <a href="/learn/upload" className="nav-link">Upload</a>
              <a href="/achievements" className="nav-link">Credentials</a>
            </nav>
          </header>
          <main id="main-content" className="content-area">
            {children}
          </main>
          <footer>
            <p>Hikari Assistive Technology Node. Publicly verifiable ledger credentials.</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
