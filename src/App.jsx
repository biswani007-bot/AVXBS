import React, { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HeroSection from './components/hero/HeroSection';
import SolutionSlider from './components/slider/SolutionSlider';
import InquiryDrawer from './components/inquiry/InquiryDrawer';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import { getSubmissionCount, incrementSubmissionCount } from './services/submissionCounter';
import { MessageCircle, X } from 'lucide-react';

export default function App() {
  const [submissionCount, setSubmissionCount] = useState(0);
  const [selectedType, setSelectedType] = useState('Residential');
  const [searchQuery, setSearchQuery] = useState('');
  const [showChatBubble, setShowChatBubble] = useState(true);

  // Right-Side Animated Inquiry Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerProduct, setDrawerProduct] = useState('Water Softener');

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

  // Initialize counter from localStorage on mount
  useEffect(() => {
    const initial = getSubmissionCount();
    setSubmissionCount(initial);
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
    console.log('Inquiry submitted successfully (Prototype):', submittedData);
    const updatedCount = incrementSubmissionCount();
    setSubmissionCount(updatedCount);
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
        <main className="main-content">
          {/* 2. Hero Section: Autonomous Video + Shimmering Headline + Search/Filter */}
          <HeroSection
            selectedType={selectedType}
            onSelectType={setSelectedType}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          {/* 3. Interactive Section: Persistent Solution Slider */}
          <div className="interactive-section-wrapper">
            <SolutionSlider
              counter={submissionCount}
              onOpenContact={handleOpenInquiry}
            />
          </div>
        </main>
      )}

      {/* 4. Professional Samsung-Inspired Footer */}
      <Footer />

      {/* 5. Right-Side Sliding Inquiry Form Drawer */}
      <InquiryDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseInquiry}
        productName={drawerProduct}
        initialType={selectedType}
        onSubmitSuccess={handleFormSubmitSuccess}
      />

      {/* 6. Floating Customer Support Chat Badge */}
      <div className="floating-support-chat" role="complementary" aria-label="Customer Support Chat">
        {showChatBubble && (
          <div className="chat-speech-bubble">
            <span className="bubble-text">Check for special offers, chat with us</span>
            <button
              type="button"
              className="bubble-close-btn"
              onClick={() => setShowChatBubble(false)}
              aria-label="Dismiss offer notification"
            >
              <X size={14} />
            </button>
          </div>
        )}
        <button
          type="button"
          className="chat-avatar-btn"
          aria-label="Open support consultation inquiry"
          onClick={() => {
            handleOpenInquiry('Water Softener');
            setShowChatBubble(false);
          }}
        >
          {/* Support representative avatar with online green ring */}
          <div className="avatar-circle">
            <img
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
              alt="Support Specialist"
              className="avatar-img"
            />
            <span className="online-indicator-ring" aria-hidden="true" />
          </div>
        </button>
      </div>
    </div>
  );
}
