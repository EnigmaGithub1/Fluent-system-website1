// src/app/page.tsx
import Nav from '@/components/Nav';
import Hero from '@/components/Hero';
import ProblemSection from '@/components/ProblemSection';
import Positioning from '@/components/Positioning';
import ModelSection from '@/components/ModelSection';
import WhatsInside from '@/components/WhatsInside';
import CompleteUpsell from '@/components/CompleteUpsell';
import HowItWorks from '@/components/HowItWorks';
import WhoItsFor from '@/components/WhoItsFor';
import Testimonials from '@/components/Testimonials';
import FAQ from '@/components/FAQ';
import Footer from '@/components/Footer';
import PageViewTracker from '@/components/PageViewTracker';

export default function LandingPage() {
  return (
    <>
      <PageViewTracker event="landing_page_view" />
      <Nav />
      <main>
        <Hero />
        <ProblemSection />
        <Positioning />
        <ModelSection />
        <WhatsInside />
        <HowItWorks />
        <CompleteUpsell />
        <WhoItsFor />
        <Testimonials />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
