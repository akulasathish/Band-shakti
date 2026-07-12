'use client';
import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

export default function StickersPrintPage() {
  const [stickers, setStickers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(100);

  useEffect(() => {
    // Read count from URL parameters
    const params = new URLSearchParams(window.location.search);
    const countParam = parseInt(params.get('count')) || 100;
    setCount(countParam);

    const generateStickersList = async () => {
      const list = [];
      for (let i = 0; i < countParam; i++) {
        // Generate random unique UUID for each sticker
        const uuid = 'offline_' + Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12);
        
        // Gate check-in URL
        const verificationUrl = `http://127.0.0.1:3000/admin?verify=${uuid}`;
        
        const qrUrl = await QRCode.toDataURL(verificationUrl, {
          width: 150,
          margin: 1,
        });

        list.push({
          id: uuid,
          qr: qrUrl
        });
      }
      setStickers(list);
      setLoading(false);
    };

    generateStickersList();
  }, []);

  return (
    <main className="stickers-print-container">
      {/* Top Controls Bar - Hidden during printing */}
      <div className="print-header-controls no-print">
        <h3>Printable QR Sticker Sheets</h3>
        <p>Total Stickers: <b>{count}</b>. Perfect for printing on adhesive labels at your local print shop.</p>
        <div className="control-buttons">
          <button onClick={() => window.print()} className="btn-print">Print QR Stickers</button>
          <button onClick={() => window.close()} className="btn-close">Close Tab</button>
        </div>
      </div>

      {loading ? (
        <div className="stickers-loading">
          <span className="spinner-mini"></span>
          <span>Generating unique check-in QR codes...</span>
        </div>
      ) : (
        <div className="stickers-grid">
          {stickers.map((stk, idx) => (
            <div key={stk.id} className="sticker-item">
              <span className="sticker-index">#{idx + 1}</span>
              <img src={stk.qr} alt="QR Code" className="sticker-qr-img" />
              <span className="sticker-id">{stk.id.substring(8, 20)}</span>
            </div>
          ))}
        </div>
      )}

      <style jsx global>{`
        .stickers-print-container {
          background: #ffffff;
          min-height: 100vh;
          padding: 20px;
          color: #000000;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .print-header-controls {
          background: #f4f4f5;
          border: 1px solid #e4e4e7;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .print-header-controls h3 {
          margin: 0;
          font-size: 1.2rem;
          color: #000000;
        }

        .print-header-controls p {
          margin: 0;
          font-size: 0.85rem;
          color: #71717a;
        }

        .control-buttons {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }

        .btn-print {
          background: #000000;
          color: #ffffff;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          font-size: 0.85rem;
          transition: background 0.2s;
        }

        .btn-print:hover {
          background: #27272a;
        }

        .btn-close {
          background: transparent;
          border: 1px solid #d4d4d8;
          color: #18181b;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          font-size: 0.85rem;
          transition: background 0.2s;
        }

        .btn-close:hover {
          background: #f4f4f5;
        }

        .stickers-loading {
          text-align: center;
          padding: 60px;
          font-size: 1rem;
          color: #71717a;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .spinner-mini {
          width: 24px;
          height: 24px;
          border: 3px solid rgba(0, 0, 0, 0.1);
          border-top-color: #000000;
          border-radius: 50%;
          animation: spin 1s infinite linear;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* 5-Column Printable Grid layout */
        .stickers-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 15px;
          max-width: 900px;
          margin: 0 auto;
        }

        .sticker-item {
          border: 1px dashed #d4d4d8;
          padding: 12px 8px 8px 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          background: #ffffff;
          page-break-inside: avoid;
        }

        .sticker-index {
          font-size: 0.65rem;
          font-weight: 700;
          color: #a1a1aa;
          position: absolute;
          top: 4px;
          left: 6px;
        }

        .sticker-qr-img {
          width: 100%;
          max-width: 110px;
          aspect-ratio: 1;
        }

        .sticker-id {
          font-size: 0.6rem;
          font-family: monospace;
          color: #52525b;
          margin-top: 4px;
          letter-spacing: 0.05em;
        }

        /* PRINT MEDIA STYLES */
        @media print {
          .no-print {
            display: none !important;
          }
          
          body {
            margin: 0;
            padding: 0;
          }

          .stickers-print-container {
            padding: 0;
            background: #ffffff;
          }

          .stickers-grid {
            gap: 10px;
          }

          .sticker-item {
            border: 1px dashed #b5b5b5; /* Light grey dots for sticker cutting guidelines */
          }
        }
      `}</style>
    </main>
  );
}
