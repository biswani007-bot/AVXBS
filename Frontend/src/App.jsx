import React, { useState, useEffect, useLayoutEffect } from 'react';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HeroSection from './components/hero/HeroSection';
import InquiryPromoBanner from './components/hero/InquiryPromoBanner';
import SecondaryBannerSection from './components/banner/SecondaryBannerSection';
import SolutionSlider from './components/slider/SolutionSlider';
import TestimonialsSection from './components/testimonials/TestimonialsSection';
import InquiryDrawer from './components/inquiry/InquiryDrawer';
import FloatingSupportWidget from './components/chat/FloatingSupportWidget';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import { getSubmissionCount, incrementSubmissionCount } from './services/submissionCounter';
import { fetchSubmissionCount } from './services/api';
import { MessageCircle, X } from 'lucide-react';

export default function App() {
  const [submissionCount, setSubmissionCount] = useState(0);
  const [selectedType, setSelectedType] = useState('Residential');
  const [searchQuery, setSearchQuery] = useState('');
  const [showChatBubble, setShowChatBubble] = useState(true);

  // Ensure scroll starts strictly at top: 0 before the page becomes visible on full browser refresh
  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, []);

  // Right-Side Animated Inquiry Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerProduct, setDrawerProduct] = useState('Water Softener');

  // Dynamic Selected Solution from Mega Menu / Links
  const [activeSelectedSolution, setActiveSelectedSolution] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const sol = params.get('solution');
      const scp = params.get('scope');
      if (sol) {
        return {
          name: decodeURIComponent(sol),
          scope: scp && scp.toLowerCase() === 'commercial' ? 'Commercial' : 'Residential'
        };
      }
    }
    return null;
  });

  // Client-Side Route State supporting '/', '/about', and '/contact'
  const [currentPath, setCurrentPath] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname.replace(/\/+$/, '') || '/';
      return p;
    }
    return '/';
  });

  // Listen to browser Back / Forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname.replace(/\/+$/, '') || '/';
      setCurrentPath(p);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path) => {
    const normalized = path.replace(/\/+$/, '') || '/';
    if (normalized !== currentPath) {
      window.history.pushState({}, '', normalized);
      setCurrentPath(normalized);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Initialize counter from MongoDB (with fallback to localStorage) on mount
  useEffect(() => {
    fetchSubmissionCount().then((count) => {
      if (typeof count === 'number') {
        setSubmissionCount(count);
      }
    });
  }, []);

  // Open right-side sliding inquiry drawer for specific product
  const handleOpenInquiry = (productName = 'Water Softener') => {
    setDrawerProduct(productName);
    setIsDrawerOpen(true);
  };

  const handleCloseInquiry = () => {
    setIsDrawerOpen(false);
  };

  const handleFormSubmitSuccess = (submittedData) => {
    console.log('Inquiry recorded into MongoDB & State:', submittedData);
    if (submittedData && submittedData.totalSubmissions !== undefined) {
      setSubmissionCount(submittedData.totalSubmissions);
    } else {
      const updatedCount = incrementSubmissionCount();
      setSubmissionCount(updatedCount);
    }
  };

  // Handle Mega Menu Solution Click -> Navigate to Homepage Solution Slider Card
  const handleSelectMegaMenuSolution = (solution) => {
    setActiveSelectedSolution(solution);

    // Update URL query parameters without full page reload
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.pathname = '/';
      url.searchParams.set('solution', solution.name);
      if (solution.scope) {
        url.searchParams.set('scope', solution.scope);
      }
      window.history.pushState({}, '', url.toString());
      setCurrentPath('/');
    }

    // Scroll smoothly to solution slider inquiry card section
    setTimeout(() => {
      const target = document.getElementById('water-softener-inquiry-section');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  return (
    <div className="app-root">
      {/* 1. Header with Brand Logo, Mega Menus & Right-Side Three-Dot Menu */}
      <Header 
        navigate={navigate} 
        currentPath={currentPath}
        selectedType={selectedType}
        onSelectType={setSelectedType}
        onOpenInquiry={handleOpenInquiry}
        onSelectSolution={handleSelectMegaMenuSolution}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Content Router */}
      {currentPath === '/about' ? (
        <main className="main-content">
          <AboutPage navigate={navigate} />
        </main>
      ) : currentPath === '/contact' ? (
        <main className="main-content">
          <ContactPage
            navigate={navigate}
            initialType={selectedType}
            onSubmitSuccess={handleFormSubmitSuccess}
          />
        </main>
      ) : (
        <main className="main-content homepage-content">
          {/* 2. Hero Section: Autonomous Video + Shimmering Headline */}
          <HeroSection />

          {/* 3. Promotional Inquiry Banner: Faucet Pouring Water into Glass + Inquiry Headline */}
          <InquiryPromoBanner />

          {/* 3.1 Secondary Promotional Banner Section (~80% hero banner height) */}
          <SecondaryBannerSection />

          {/* 4. Interactive Section: Persistent Solution Slider */}
          <div className="interactive-section-wrapper">
            <SolutionSlider
              counter={submissionCount}
              onOpenContact={handleOpenInquiry}
              selectedSolution={activeSelectedSolution}
            />
          </div>

          {/* 5. Customer Feedback Section: "What Our Customers Say" */}
          <TestimonialsSection />
        </main>
      )}

      {/* 6. Professional Samsung-Inspired Footer */}
      <Footer />

      {/* 5. Right-Side Sliding Inquiry Form Drawer */}
      <InquiryDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseInquiry}
        productName={drawerProduct}
        initialType={selectedType}
        onSubmitSuccess={handleFormSubmitSuccess}
      />

      {/* 6. Premium Floating Customer Support Chat Widget (Draggable + Glowing Avatar) */}
      <FloatingSupportWidget onOpenChat={() => handleOpenInquiry('Water Softener')} />
    </div>
  );
}
