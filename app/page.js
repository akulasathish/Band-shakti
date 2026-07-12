import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Booking from '@/components/Booking';
import Gallery from '@/components/Gallery';
import News from '@/components/News';
import Contact from '@/components/Contact';

export default function Home() {
  return (
    <main className="mobile-container">
      {/* Sticky Navbar */}
      <Navbar />
      
      {/* Hero Slide & Video Modal */}
      <Hero />
      
      {/* About & Band Members */}
      <About />
      
      {/* Dynamic Ticket Counter Selector (Instamojo prep) */}
      <Booking />
      
      {/* Photo Lightbox Gallery */}
      <Gallery />
      
      {/* News & Announcements */}
      <News />
      
      {/* Booking Form & WhatsApp Float */}
      <Contact />
    </main>
  );
}
