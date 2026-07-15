import React from 'react';

export const metadata = {
  title: 'Cancellation & Refund Policy | Band Shakthi',
  description: 'Cancellation and refund guidelines for Band Shakthi live events and ticket bookings.',
};

export default function RefundsPage() {
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
          Cancellation & Refund Policy
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
              1. Ticket Bookings & Booking Confirmation
            </h2>
            <p>
              Once a payment has been completed successfully and a unique Ticket ID has been generated, your booking is considered final and confirmed. The booking holds a seat/entry slot at the designated venue for the specified event date.
            </p>
          </section>

          <section style={{
            background: 'rgba(228, 166, 47, 0.03)',
            borderLeft: '4px solid #e4a62f',
            padding: '16px 20px',
            borderRadius: '0 8px 8px 0'
          }}>
            <h2 style={{ color: '#e4a62f', fontSize: '1.25rem', fontWeight: '700', marginBottom: '10px', textTransform: 'uppercase' }}>
              2. Strict No-Refund Policy
            </h2>
            <p style={{ margin: 0, fontWeight: '500' }}>
              We follow a strict <strong>NO REFUNDS, NO CANCELLATIONS, AND NO EXCHANGES</strong> policy. Once tickets are purchased, they cannot be cancelled, returned, or exchanged for cash, credits, or tickets to other shows under any circumstances.
            </p>
          </section>

          <section>
            <h2 style={{ color: '#e4a62f', fontSize: '1.25rem', fontWeight: '700', marginBottom: '10px', textTransform: 'uppercase' }}>
              3. Event Postponement or Cancellation
            </h2>
            <p>
              In the extremely rare event that a live concert is officially postponed or cancelled by the artist, venue, or the management team (Band Shakthi) due to technical failure, severe weather, or force majeure:
            </p>
            <ul style={{ paddingLeft: '20px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong>In case of Postponement:</strong> Your booked ticket pass remains valid and will automatically roll over to the newly scheduled date of the event. No action is required from your end.</li>
              <li><strong>In case of Complete Cancellation:</strong> A full refund of the face value of the ticket will be automatically processed back to the original payment source (bank account/UPI/credit card) within 5–7 working days.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: '#e4a62f', fontSize: '1.25rem', fontWeight: '700', marginBottom: '10px', textTransform: 'uppercase' }}>
              4. Transfer of Tickets
            </h2>
            <p>
              Tickets are strictly bound to the name entered during checkout. However, if you are unable to attend the show, you may transfer your Entry Pass (digital QR or physical ticket) to a friend or family member. The physical person presenting the pass at the check-in gate with the valid QR code will be granted entry. Once a ticket QR code is scanned at the gate, it is instantly deactivated and cannot be reused.
            </p>
          </section>

          <section>
            <h2 style={{ color: '#e4a62f', fontSize: '1.25rem', fontWeight: '700', marginBottom: '10px', textTransform: 'uppercase' }}>
              5. Contact Support & Escalations
            </h2>
            <p>
              If you face duplicate checkout charges or have payment verification issues on your bank statement, please reach out to our team instantly with your Ticket ID, Mobile Number, and Payment ID:
            </p>
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(228, 166, 47, 0.1)',
              borderRadius: '8px',
              padding: '16px',
              marginTop: '12px',
              fontSize: '0.95rem'
            }}>
              <p style={{ margin: '0 0 6px 0' }}>📞 <strong>Support Phone:</strong> +91 88979 63589</p>
              <p style={{ margin: 0 }}>✉️ <strong>Support Email:</strong> bookings@bandshakti.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
