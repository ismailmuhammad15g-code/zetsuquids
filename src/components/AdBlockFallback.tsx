import { RefreshCw, ShieldAlert } from "lucide-react";
import { CSSProperties, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function AdBlockFallback() {
  const overlayRef = useRef(null);

  useEffect(() => {
    // Save originals
    const htmlEl = document.documentElement;
    const bodyEl = document.body;

    const origHtmlZoom = htmlEl.style.zoom;
    const origHtmlOverflow = htmlEl.style.overflow;
    const origBodyOverflow = bodyEl.style.overflow;

    // CRITICAL: Reset zoom on html so 100vw/100vh = real viewport
    htmlEl.style.zoom = '1';
    htmlEl.style.overflow = 'hidden';
    bodyEl.style.overflow = 'hidden';

    return () => {
      htmlEl.style.zoom = origHtmlZoom;
      htmlEl.style.overflow = origHtmlOverflow;
      bodyEl.style.overflow = origBodyOverflow;
    };
  }, []);

  const handleRefresh = (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) e.preventDefault();
    window.location.reload();
  };

  const steps = [
    {
      id: 1,
      title: "Locate the Tracker Shield",
      description:
        "Tap on the lion icon at the top of your browser if you are using Brave. If you are using another browser, search Google for: 'How to turn off ad tracker in [your browser name]'.",
      image: "/images/addblock_tutorial1.png",
    },
    {
      id: 2,
      title: "Disable the Tracker",
      description: "Click on the toggle switch to turn it off.",
      image: "/images/addblock_tutorial2.png",
    },
    {
      id: 3,
      title: "Refresh the Page",
      description: (
        <>
          And that's it! You can now refresh the page by clicking{" "}
          <button
            onClick={handleRefresh}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: '700',
              color: '#4f46e5',
              textDecoration: 'underline',
              textDecorationThickness: '2px',
              textUnderlineOffset: '4px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              padding: 0,
              fontSize: 'inherit',
              fontFamily: 'inherit'
            }}
          >
            here
            <RefreshCw size={14} />
          </button>{" "}
          if it hasn't refreshed automatically.
        </>
      ),
      image: "/images/addblock_tutorial3.png",
    },
  ];

  const overlayStyle: CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100vw',
    height: '100vh',
    zIndex: 2147483647,
    backgroundColor: '#f9fafb',
    overflowY: 'auto',
    overflowX: 'hidden',
    margin: 0,
    padding: 0
  };

  const content = (
    <div ref={overlayRef} style={overlayStyle}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '48px 16px',
        minHeight: '100%'
      }}>

        {/* Header */}
        <div style={{ maxWidth: '48rem', width: '100%', textAlign: 'center', marginBottom: '64px', marginTop: '16px' }}>
          <div style={{
            margin: '0 auto 24px auto',
            width: '80px',
            height: '80px',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            borderRadius: '9999px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '4px solid #ffffff',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }}>
            <ShieldAlert size={40} strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '3rem', fontWeight: '900', color: '#111827', letterSpacing: '-0.025em', marginBottom: '16px', lineHeight: '1.1' }}>
            AdBlocker Detected
          </h1>
          <p style={{ maxWidth: '36rem', margin: '0 auto', fontSize: '1.125rem', color: '#4b5563', lineHeight: '1.625', fontWeight: '600' }}>
            It looks like you're using an AdBlocker or tracking shield. To ensure our platform functions correctly, please disable it for this site by following the steps below.
          </p>
        </div>

        {/* Steps */}
        <div style={{ maxWidth: '64rem', width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
          {steps.map((step: any) => (
            <div key={step.id} style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              border: '1px solid #e5e7eb',
              overflow: 'hidden',
              position: 'relative'
            }}>
              {/* Badge */}
              <div style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                width: '40px',
                height: '40px',
                backgroundColor: '#000000',
                color: '#ffffff',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '900',
                fontSize: '20px',
                zIndex: 10
              }}>
                {step.id}
              </div>

              {/* Image */}
              <div style={{ position: 'relative', paddingTop: '70%', width: '100%', backgroundColor: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
                <img
                  src={step.image}
                  alt={`Step ${step.id}`}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    padding: '24px'
                  }}
                />
              </div>

              {/* Text */}
              <div style={{ padding: '24px', flex: '1', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#111827', marginBottom: '12px' }}>
                  {step.title}
                </h3>
                <div style={{ color: '#4b5563', lineHeight: '1.625', fontWeight: '500' }}>
                  {step.description}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Button */}
        <div style={{ marginTop: '64px', marginBottom: '48px', textAlign: 'center', borderTop: '1px solid #e5e7eb', paddingTop: '32px', width: '100%', maxWidth: '64rem' }}>
          <button
            onClick={handleRefresh}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '16px 32px',
              backgroundColor: '#000000',
              color: '#ffffff',
              borderRadius: '6px',
              fontWeight: '700',
              fontSize: '18px',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
              maxWidth: '320px'
            }}
          >
            I've Disabled It - Refresh Page
            <RefreshCw size={20} />
          </button>
        </div>

      </div>
    </div>
  );

  return createPortal(content, document.body);
}

