import { useState, useEffect } from 'react';

const TOUR_STEPS = [
  { message: "Welcome to ZetsuGuide!", hint: "Your journey starts here" },
  { message: "Explore thousands of guides", hint: "Find any topic you need" },
  { message: "Create & share knowledge", hint: "Start writing your first guide" }
];

export default function TourCursor() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem('zetsuguide_tour_seen')) {
      setVisible(true);
    }
  }, []);

  const handleNext = () => {
    if (step < TOUR_STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      setVisible(false);
      localStorage.setItem('zetsuguide_tour_seen', 'true');
    }
  };

  const handleSkip = () => {
    setVisible(false);
    localStorage.setItem('zetsuguide_tour_seen', 'true');
  };

  if (!visible) return null;

  const current = TOUR_STEPS[step];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 99999,
      pointerEvents: 'none'
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        pointerEvents: 'auto'
      }} />

      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'auto'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          boxShadow: '0 30px 60px rgba(0,0,0,0.3)',
          padding: '32px',
          width: '360px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            backgroundColor: '#000',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: '28px'
          }}>
            📚
          </div>

          <span style={{
            display: 'inline-block',
            fontSize: '11px',
            color: '#6b7280',
            fontWeight: '600',
            marginBottom: '12px'
          }}>
            STEP {step + 1} OF {TOUR_STEPS.length}
          </span>
          
          <h2 style={{ margin: '0 0 10px 0', fontSize: '22px', fontWeight: '700', color: '#000' }}>
            {current.message}
          </h2>
          <p style={{ margin: '0 0 24px 0', color: '#6b7280', fontSize: '14px' }}>
            {current.hint}
          </p>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            {TOUR_STEPS.map((_, i) => (
              <div key={i} style={{
                flex: 1,
                height: '4px',
                borderRadius: '2px',
                backgroundColor: i <= step ? '#000' : '#e5e7eb'
              }} />
            ))}
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleSkip} style={{
              flex: 1,
              padding: '14px',
              backgroundColor: 'white',
              color: '#000',
              border: '2px solid #000',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}>
              Skip
            </button>
            <button onClick={handleNext} style={{
              flex: 2,
              padding: '14px',
              backgroundColor: '#000',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}>
              {step < TOUR_STEPS.length - 1 ? 'Continue' : 'Get Started'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
