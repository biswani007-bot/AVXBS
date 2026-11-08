import React, { useState, useEffect } from 'react';
import { 
  Droplets, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Layers, 
  Wrench,
  Utensils,
  Bath
} from 'lucide-react';
import { fetchEnquiryTabs, submitEnquiryTabForm } from '../../services/api';

// Initial fallback tabs matching Excel Sheet 2
const FALLBACK_TABS = {
  Residential: [
    {
      _id: 'tab-1',
      tabName: 'WATER SOFTENER',
      category: 'Both',
      description: 'Automated ion-exchange whole-house and residential water softening systems.',
      fields: [
        { name: 'name', label: 'Name', type: 'text', placeholder: 'Enter your full name', isRequired: true },
        { name: 'phone', label: 'Phone Number', type: 'tel', placeholder: 'Enter 10-digit mobile number', isRequired: true },
        { name: 'email', label: 'Email', type: 'email', placeholder: 'Optional email address', isRequired: false },
        { name: 'note', label: 'Leave a Note', type: 'textarea', placeholder: 'Tell us about your water softening requirements...', isRequired: false },
      ],
    },
    {
      _id: 'tab-2',
      tabName: 'WTP',
      category: 'Both',
      description: 'Comprehensive Water Treatment Plants & residential filtration solutions.',
      fields: [
        { name: 'name', label: 'Name', type: 'text', placeholder: 'Enter your full name', isRequired: true },
        { name: 'phone', label: 'Phone Number', type: 'tel', placeholder: 'Enter 10-digit mobile number', isRequired: true },
        { name: 'email', label: 'Email', type: 'email', placeholder: 'Optional email address', isRequired: false },
        { name: 'note', label: 'Leave a Note', type: 'textarea', placeholder: 'Tell us about your water treatment plant requirements...', isRequired: false },
      ],
    },
    {
      _id: 'tab-3',
      tabName: 'PLUMBING SOLUTIONS',
      category: 'Residential',
      description: 'Residential plumbing piping, pressure boosting, and distribution engineering.',
      fields: [
        { name: 'name', label: 'Name', type: 'text', placeholder: 'Enter your full name', isRequired: true },
        { name: 'phone', label: 'Phone Number', type: 'tel', placeholder: 'Enter 10-digit mobile number', isRequired: true },
        { name: 'email', label: 'Email', type: 'email', placeholder: 'Optional email address', isRequired: false },
        { name: 'noOfBathrooms', label: 'Number of Bathrooms', type: 'number', placeholder: 'Enter number of bathrooms (e.g. 2, 3, 4)', isRequired: true },
      ],
    },
    {
      _id: 'tab-4',
      tabName: 'MODULAR KITCHEN',
      category: 'Residential',
      description: 'Modern luxury modular kitchen water distribution, under-sink RO & tap fittings.',
      fields: [
        { name: 'name', label: 'Name', type: 'text', placeholder: 'Enter your full name', isRequired: true },
        { name: 'phone', label: 'Phone Number', type: 'tel', placeholder: 'Enter 10-digit mobile number', isRequired: true },
        { name: 'email', label: 'Email', type: 'email', placeholder: 'Optional email address', isRequired: false },
        { name: 'note', label: 'Leave a Note', type: 'textarea', placeholder: 'Tell us about your modular kitchen water requirements...', isRequired: false },
      ],
    },
    {
      _id: 'tab-5',
      tabName: 'SANITARY & BATHFITTINGS',
      category: 'Both',
      description: 'Premium sanitary fittings, shower valves, hard-water-safe CP fittings and fixtures.',
      fields: [
        { name: 'name', label: 'Name', type: 'text', placeholder: 'Enter your full name', isRequired: true },
        { name: 'phone', label: 'Phone Number', type: 'tel', placeholder: 'Enter 10-digit mobile number', isRequired: true },
        { name: 'email', label: 'Email', type: 'email', placeholder: 'Optional email address', isRequired: false },
        { name: 'note', label: 'Leave a Note', type: 'textarea', placeholder: 'Tell us about your sanitary & bath fittings requirements...', isRequired: false },
      ],
    },
  ],
  Commercial: [
    {
      _id: 'tab-1',
      tabName: 'WATER SOFTENER',
      category: 'Both',
      description: 'High-capacity continuous commercial & industrial water softening plants.',
      fields: [
        { name: 'name', label: 'Name', type: 'text', placeholder: 'Enter your full name', isRequired: true },
        { name: 'phone', label: 'Phone Number', type: 'tel', placeholder: 'Enter 10-digit mobile number', isRequired: true },
        { name: 'email', label: 'Email', type: 'email', placeholder: 'Optional email address', isRequired: false },
        { name: 'note', label: 'Leave a Note', type: 'textarea', placeholder: 'Tell us about your commercial softening requirements...', isRequired: false },
      ],
    },
    {
      _id: 'tab-2',
      tabName: 'WTP',
      category: 'Both',
      description: 'Industrial Water Treatment Plants (WTP, STP, ETP & Commercial RO).',
      fields: [
        { name: 'name', label: 'Name', type: 'text', placeholder: 'Enter your full name', isRequired: true },
        { name: 'phone', label: 'Phone Number', type: 'tel', placeholder: 'Enter 10-digit mobile number', isRequired: true },
        { name: 'email', label: 'Email', type: 'email', placeholder: 'Optional email address', isRequired: false },
        { name: 'note', label: 'Leave a Note', type: 'textarea', placeholder: 'Tell us about your commercial water plant requirements...', isRequired: false },
      ],
    },
    {
      _id: 'tab-5',
      tabName: 'SANITARY & BATHFITTINGS',
      category: 'Both',
      description: 'Commercial sanitary fixtures, high-traffic washroom fittings and automated valves.',
      fields: [
        { name: 'name', label: 'Name', type: 'text', placeholder: 'Enter your full name', isRequired: true },
        { name: 'phone', label: 'Phone Number', type: 'tel', placeholder: 'Enter 10-digit mobile number', isRequired: true },
        { name: 'email', label: 'Email', type: 'email', placeholder: 'Optional email address', isRequired: false },
        { name: 'note', label: 'Leave a Note', type: 'textarea', placeholder: 'Tell us about your commercial sanitary requirements...', isRequired: false },
      ],
    },
  ],
};

const getTabIcon = (name = '') => {
  const upper = name.toUpperCase();
  if (upper.includes('SOFTENER')) return Droplets;
  if (upper.includes('WTP')) return Layers;
  if (upper.includes('PLUMBING')) return Wrench;
  if (upper.includes('KITCHEN')) return Utensils;
  if (upper.includes('SANITARY') || upper.includes('BATH')) return Bath;
  return Sparkles;
};

export default function EnquiryTabsSection({ category = 'Residential', onSubmitSuccess }) {
  const [tabs, setTabs] = useState(FALLBACK_TABS[category] || FALLBACK_TABS.Residential);
  const [activeTabId, setActiveTabId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form input state
  const [formValues, setFormValues] = useState({
    name: '',
    phone: '',
    email: '',
    note: '',
    noOfBathrooms: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // { type: 'success' | 'error', message: '' }

  // Load tabs whenever category prop changes
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetchEnquiryTabs(category).then((data) => {
      if (isMounted) {
        if (Array.isArray(data) && data.length > 0) {
          setTabs(data);
          setActiveTabId(data[0]._id);
        } else {
          const fallback = FALLBACK_TABS[category] || FALLBACK_TABS.Residential;
          setTabs(fallback);
          setActiveTabId(fallback[0]._id);
        }
        setLoading(false);
      }
    });

    return () => { isMounted = false; };
  }, [category]);

  // Active tab object
  const activeTab = tabs.find(t => t._id === activeTabId) || tabs[0] || null;

  // Handle Input Changes
  const handleInputChange = (fieldKey, value) => {
    setFormValues(prev => ({ ...prev, [fieldKey]: value }));
    if (submitStatus) setSubmitStatus(null);
  };

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeTab) return;

    // Validate fields according to activeTab.fields
    for (const f of (activeTab.fields || [])) {
      const val = formValues[f.name];
      if (f.isRequired && (!val || !String(val).trim())) {
        setSubmitStatus({
          type: 'error',
          message: `${f.label} is required.`,
        });
        return;
      }
    }

    // Phone validation
    const phoneClean = (formValues.phone || '').replace(/[\s\-\(\)\+]/g, '');
    if (!/^\d{7,15}$/.test(phoneClean)) {
      setSubmitStatus({
        type: 'error',
        message: 'Please provide a valid 10-digit mobile number.',
      });
      return;
    }

    // Email validation if provided
    if (formValues.email && formValues.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formValues.email.trim())) {
        setSubmitStatus({
          type: 'error',
          message: 'Please provide a valid email address.',
        });
        return;
      }
    }

    setSubmitting(true);
    setSubmitStatus(null);

    try {
      const extraFormData = {};
      for (const f of (activeTab.fields || [])) {
        if (!['name', 'phone', 'email'].includes(f.name)) {
          extraFormData[f.label || f.name] = formValues[f.name] || '';
        }
      }

      const payload = {
        tabId: activeTab._id,
        tabName: activeTab.tabName,
        category: category,
        customerName: formValues.name.trim(),
        phoneNumber: formValues.phone.trim(),
        email: formValues.email ? formValues.email.trim() : '',
        formData: extraFormData,
      };

      const result = await submitEnquiryTabForm(payload);

      setSubmitStatus({
        type: 'success',
        message: `Thank you, ${formValues.name}! Your enquiry for ${activeTab.tabName} has been received. Our engineering specialist will reach out shortly.`,
      });

      // Reset form
      setFormValues({
        name: '',
        phone: '',
        email: '',
        note: '',
        noOfBathrooms: '',
      });

      if (onSubmitSuccess) {
        onSubmitSuccess(result);
      }
    } catch (err) {
      setSubmitStatus({
        type: 'error',
        message: err.message || 'Failed to submit enquiry. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section 
      id="enquiry-tabs-section"
      className="enquiry-tabs-section"
      style={{
        width: '100%',
        backgroundColor: '#ffffff',
        padding: '52px 20px 76px',
        boxSizing: 'border-box',
        minHeight: '75vh',
      }}
    >
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        {/* Section Header: Category Title strictly controlled by Navbar */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h1 style={{
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: '800',
            color: '#0f172a',
            margin: '0 0 12px',
            letterSpacing: '-0.02em',
          }}>
            {category === 'Residential' 
              ? 'Residential Water & Infrastructure Solutions' 
              : 'Commercial Water & Industrial Plant Solutions'}
          </h1>

          <p style={{
            fontSize: '16px',
            color: '#64748b',
            maxWidth: '680px',
            margin: '0 auto',
            lineHeight: 1.6,
          }}>
            Select a solution tab below to request an engineered sizing, customized proposal, or direct consultation.
          </p>
        </div>

        {/* Dynamic Enquiry Tabs Navigation */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '10px',
          marginBottom: '32px',
        }}>
          {tabs.map((tab) => {
            const IconComp = getTabIcon(tab.tabName);
            const isActive = tab._id === activeTabId;
            return (
              <button
                key={tab._id}
                type="button"
                onClick={() => {
                  setActiveTabId(tab._id);
                  setSubmitStatus(null);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 22px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '700',
                  border: isActive 
                    ? category === 'Commercial' ? '2px solid #7e22ce' : '2px solid #0284c7'
                    : '1px solid #e2e8f0',
                  backgroundColor: isActive 
                    ? category === 'Commercial' ? 'rgba(126, 34, 206, 0.06)' : 'rgba(2, 132, 199, 0.06)'
                    : '#ffffff',
                  color: isActive 
                    ? category === 'Commercial' ? '#7e22ce' : '#0284c7'
                    : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0 4px 14px rgba(0, 0, 0, 0.06)' : '0 1px 3px rgba(0,0,0,0.03)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                }}
              >
                <IconComp size={16} />
                <span>{tab.tabName}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content & Form Container */}
        {activeTab && (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 30px -5px rgba(15, 23, 42, 0.07)',
            maxWidth: '780px',
            margin: '0 auto',
            overflow: 'hidden',
          }}>
            {/* Form Header Banner */}
            <div style={{
              backgroundColor: category === 'Commercial' ? 'rgba(126, 34, 206, 0.05)' : 'rgba(2, 132, 199, 0.05)',
              borderBottom: '1px solid #f1f5f9',
              padding: '24px 32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
            }}>
              <div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: category === 'Commercial' ? '#7e22ce' : '#0284c7',
                  marginBottom: '4px',
                }}>
                  <span>{category} Enquiry</span>
                  <span>•</span>
                  <span>{activeTab.tabName}</span>
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Quick Enquiry – {activeTab.tabName}
                </h2>
                {activeTab.description && (
                  <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0' }}>
                    {activeTab.description}
                  </p>
                )}
              </div>

              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: category === 'Commercial' ? '#7e22ce' : '#0284c7',
                flexShrink: 0,
              }}>
                <Send size={20} />
              </div>
            </div>

            {/* Submission Status Message */}
            {submitStatus && (
              <div style={{
                padding: '16px 32px',
                backgroundColor: submitStatus.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                borderBottom: submitStatus.type === 'success' ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: submitStatus.type === 'success' ? '#15803d' : '#b91c1c',
                fontSize: '14px',
                fontWeight: '500',
              }}>
                {submitStatus.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                <span>{submitStatus.message}</span>
              </div>
            )}

            {/* Form Fields */}
            <form onSubmit={handleSubmit} style={{ padding: '32px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                {/* Dynamically render fields defined in activeTab */}
                {(activeTab.fields || []).map((field, idx) => {
                  const isFullWidth = field.type === 'textarea';

                  return (
                    <div 
                      key={idx} 
                      style={{ 
                        gridColumn: isFullWidth ? '1 / -1' : 'span 1',
                      }}
                    >
                      <label style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '700',
                        color: '#334155',
                        marginBottom: '8px',
                      }}>
                        {field.label}
                        {field.isRequired ? (
                          <span style={{ color: '#ef4444', marginLeft: '3px' }}>*</span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontWeight: '400', fontSize: '12px', marginLeft: '6px' }}>(Optional)</span>
                        )}
                      </label>

                      {field.type === 'textarea' ? (
                        <textarea
                          rows={3}
                          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                          value={formValues[field.name] || ''}
                          onChange={(e) => handleInputChange(field.name, e.target.value)}
                          required={field.isRequired}
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            borderRadius: '10px',
                            fontSize: '14px',
                            color: '#0f172a',
                            resize: 'vertical',
                            outline: 'none',
                            boxSizing: 'border-box',
                            fontFamily: 'inherit',
                            transition: 'border-color 0.2s',
                          }}
                          onFocus={(e) => { e.target.style.borderColor = category === 'Commercial' ? '#7e22ce' : '#0284c7'; }}
                          onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; }}
                        />
                      ) : (
                        <input
                          type={field.type || 'text'}
                          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                          value={formValues[field.name] || ''}
                          onChange={(e) => handleInputChange(field.name, e.target.value)}
                          required={field.isRequired}
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            borderRadius: '10px',
                            fontSize: '14px',
                            color: '#0f172a',
                            outline: 'none',
                            boxSizing: 'border-box',
                            fontFamily: 'inherit',
                            transition: 'border-color 0.2s',
                          }}
                          onFocus={(e) => { e.target.style.borderColor = category === 'Commercial' ? '#7e22ce' : '#0284c7'; }}
                          onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Submit CTA */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '16px',
                marginTop: '28px',
                borderTop: '1px solid #f1f5f9',
                paddingTop: '20px',
              }}>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                  🔒 Your contact information is kept strictly confidential.
                </span>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '14px 32px',
                    backgroundColor: category === 'Commercial' ? '#7e22ce' : '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: '700',
                    cursor: submitting ? 'wait' : 'pointer',
                    boxShadow: category === 'Commercial'
                      ? '0 6px 18px rgba(126, 34, 206, 0.35)'
                      : '0 6px 18px rgba(2, 132, 199, 0.35)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Send size={16} />
                  <span>{submitting ? 'Submitting...' : 'Submit Enquiry'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}
