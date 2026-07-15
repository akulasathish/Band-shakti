import React from 'react';

export const metadata = {
  title: 'Terms & Conditions | Band Shakthi',
  description: 'Terms and conditions governing ticket purchases and venue entry for Band Shakthi live events.',
};

export default function TermsPage() {
  return (
    <div style={{
      background: '#070709',
      color: '#ffffff',
      minHeight: '100vh',
      fontFamily: "'Outfit', 'Inter', sans-serif",
      padding: '60px 20px'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(228, 166, 47, 0.15)',
        borderRadius: '16px',
        padding: '40px',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
      }}>
        {/* Back Link */}
        <a href="/" style={{
          color: '#e4a62f',
          textDecoration: 'none',
          fontSize: '0.9rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '30px',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          ← Back To Home
        </a>

        {/* Title */}
        <h1 style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '2.2rem',
          fontWeight: '800',
          color: '#e4a62f',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '8px',
          borderBottom: '2px solid rgba(228, 166, 47, 0.2)',
          paddingBottom: '16px'
        }}>
          Terms & Conditions
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginBottom: '32px' }}>
          Last Updated: July 15, 2026
        </p>

        {/* Content */}
        <div style={{
          lineHeight: '1.7',
          fontSize: '1rem',
          color: 'rgba(255, 255, 255, 0.85)',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          <section>
            <h2 style={{ color: '#e4a62f', fontSize: '1.25rem', fontWeight: '700', marginBottom: '10px', textTransform: 'uppercase' }}>
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing, browsing, or booking tickets through the official Band Shakthi website (https://bandshakthi.com), you agree to comply with and be bound by the following Terms & Conditions. If you disagree with any part of these terms, please do not use this service.
            </p>
          </section>

          <section>
            <h2 style={{ color: '#e4a62f', fontSize: '1.25rem', fontWeight: '700', marginBottom: '10px', textTransform: 'uppercase' }}>
              2. Ticket Purchasing & Verification
            </h2>
            <p>
              Tickets can be booked online through our secure payment gateway or issued offline at our authorized event counters. Each completed booking (whether processed online or offline) generates a unique Ticket ID and an official entry pass. You must ensure that the name, email, and phone number entered during registration are accurate.
            </p>
          </section>

          <section>
            <h2 style={{ color: '#e4a62f', fontSize: '1.25rem', fontWeight: '700', marginBottom: '10px', textTransform: 'uppercase' }}>
              3. Age Restrictions & Venue Policies
            </h2>
            <p>
              Entry guidelines and restrictions are determined by the respective pub, club, or stadium hosting the live event:
            </p>
            <ul style={{ paddingLeft: '20px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong>Age Limit:</strong> All physical attendees must meet the venue’s age policies (typically 21+ for pub/bar concert venues serving alcohol). Valid age-proof government identity cards must be presented at the gate.</li>
              <li><strong>Rights of Admission:</strong> The venue management reserves the absolute right of admission. Security personnel may deny entry in case of misconduct, intoxication, or violation of venue dress codes.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: '#e4a62f', fontSize: '1.25rem', fontWeight: '700', marginBottom: '10px', textTransform: 'uppercase' }}>
              4. Secure Check-In
            </h2>
            <p>
              At the gate, your unique Entry Pass QR code (digital or physical) will be scanned by our digital scanners. Once successfully scanned, the ticket state is updated to checked-in inside our databases and instantly deactivated. Any secondary scan attempts will result in an ACCESS DENIED screen.
            </p>
          </section>

          <section>
            <h2 style={{ color: '#e4a62f', fontSize: '1.25rem', fontWeight: '700', marginBottom: '10px', textTransform: 'uppercase' }}>
              5. Intellectual Property
            </h2>
            <p>
              All website graphics, logos, photos, video reels, sound clips, and software structures on this website are the sole intellectual property of Band Shakthi. Unauthorized duplication or scraping is strictly prohibited.
            </p>
          </section>

          <section>
            <h2 style={{ color: '#e4a62f', fontSize: '1.25rem', fontWeight: '700', marginBottom: '10px', textTransform: 'uppercase' }}>
              6. Limitation of Liability
            </h2>
            <p>
              Band Shakthi and its organizers shall not be held liable for any loss, injury, damage, or delayed schedules arising during or relating to the live concert, except where required by law.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
