import React, { useState } from 'react';

export default function WelcomePage({ onStart }) {
  const [isStarting, setIsStarting] = useState(false);

  const handleStart = () => {
    setIsStarting(true);
    // Slight delay for animation effect
    setTimeout(() => {
      onStart();
    }, 500);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#000000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontFamily: '"Courier New", monospace',
      overflow: 'hidden',
      zIndex: 9999,
      opacity: isStarting ? 0 : 1,
      transition: 'opacity 0.5s ease-out'
    }}>
      {/* Animated ASCII-style stars background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(1px 1px at 20% 30%, white, transparent),
          radial-gradient(1px 1px at 60% 70%, white, transparent),
          radial-gradient(1px 1px at 50% 50%, white, transparent),
          radial-gradient(1px 1px at 80% 10%, white, transparent),
          radial-gradient(1px 1px at 90% 60%, white, transparent),
          radial-gradient(1px 1px at 33% 80%, white, transparent),
          radial-gradient(1px 1px at 70% 40%, white, transparent)
        `,
        backgroundSize: '200% 200%',
        animation: 'twinkle 10s ease-in-out infinite',
        opacity: 0.3
      }} />

      {/* Main content container */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        textAlign: 'center',
        maxWidth: '800px',
        padding: '40px',
        animation: 'fadeInUp 1s ease-out',
        border: '1px solid rgba(255,255,255,0.2)',
        backgroundColor: 'rgba(0,0,0,0.8)'
      }}>
        {/* ASCII Art style logo */}
        <div style={{
          fontSize: '16px',
          marginBottom: '30px',
          fontFamily: '"Courier New", monospace',
          letterSpacing: '2px',
          lineHeight: '1.2',
          color: '#ffffff',
          whiteSpace: 'pre'
        }}>
{`   _____ _____ _____     ___  _  __
  / ____|_   _|  __ \\   / _ \\| |/ /
 | |      | | | |  | | / /_\\ \\ ' / 
 | |      | | | |  | | |  _  |  <  
 | |____ _| |_| |__| | | | | | . \\ 
  \\_____|_____|_____/  |_| |_|_|\\_\\`}
        </div>

        {/* Main title */}
        <h1 style={{
          fontSize: '42px',
          fontWeight: 'bold',
          marginBottom: '15px',
          color: '#ffffff',
          textTransform: 'uppercase',
          letterSpacing: '4px',
          fontFamily: '"Courier New", monospace'
        }}>
          OCEAN TO SKY WITH WEBXR
        </h1>

        {/* Description */}
        <p style={{
          fontSize: '14px',
          lineHeight: '1.8',
          marginBottom: '40px',
          color: '#aaaaaa',
          maxWidth: '600px',
          margin: '0 auto 40px',
          fontFamily: '"Courier New", monospace',
          textAlign: 'left',
          padding: '20px',
          border: '1px solid rgba(255,255,255,0.1)',
          backgroundColor: 'rgba(0,0,0,0.5)'
        }}>
          {'>> INITIALIZING SYSTEM...\n'}
          {'>> LOADING SOLAR SYSTEM DATA...\n'}
          {'>> CONNECTING TO NASA SATELLITES...\n\n'}
          {'Embark on an immersive journey through our solar system.\n'}
          {'Explore NASA\'s ocean temperature data, interact with\n'}
          {'planets and satellites, and discover the wonders of\n'}
          {'space in stunning 3D visualization.'}
        </p>

        {/* Features list - Terminal style */}
        <div style={{
          textAlign: 'left',
          marginBottom: '40px',
          padding: '20px',
          border: '1px solid rgba(255,255,255,0.2)',
          backgroundColor: 'rgba(0,0,0,0.5)',
          fontFamily: '"Courier New", monospace',
          fontSize: '13px'
        }}>
          <div style={{ color: '#ffffff', marginBottom: '15px', fontWeight: 'bold' }}>
            {'[SYSTEM FEATURES]'}
          </div>
          <div style={{ color: '#aaaaaa', lineHeight: '2' }}>
            {'[✓] Ocean Temperature Data Visualization\n'}
            {'[✓] Real NASA Aqua Satellite Integration\n'}
            {'[✓] AI-Powered Astronaut Assistant\n'}
            {'[✓] VR Compatible (Meta Quest 3)\n'}
            {'[✓] Interactive 3D Solar System\n'}
            {'[✓] Real-time Data Streaming'}
          </div>
        </div>

        {/* Start button - Terminal style */}
        <button
          onClick={handleStart}
          disabled={isStarting}
          style={{
            padding: '15px 40px',
            fontSize: '16px',
            fontWeight: 'bold',
            color: isStarting ? '#666666' : '#000000',
            background: isStarting ? '#333333' : '#ffffff',
            border: '2px solid #ffffff',
            borderRadius: '0px',
            cursor: isStarting ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            textTransform: 'uppercase',
            letterSpacing: '3px',
            fontFamily: '"Courier New", monospace'
          }}
          onMouseOver={(e) => {
            if (!isStarting) {
              e.currentTarget.style.background = '#000000';
              e.currentTarget.style.color = '#ffffff';
            }
          }}
          onMouseOut={(e) => {
            if (!isStarting) {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.color = '#000000';
            }
          }}
        >
          {isStarting ? '> LAUNCHING...' : '> LAUNCH EXPERIENCE'}
        </button>

        {/* Controls hint - Terminal style */}
        <div style={{
          marginTop: '30px',
          fontSize: '11px',
          color: '#666666',
          fontFamily: '"Courier New", monospace',
          textAlign: 'left',
          padding: '10px',
          border: '1px solid rgba(255,255,255,0.1)',
          backgroundColor: 'rgba(0,0,0,0.5)'
        }}>
          {'[CONTROLS]\n'}
          {'Mouse: Navigate | Click: Explore | Type: Ask Questions'}
        </div>
      </div>

      {/* Footer - Terminal style with links */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '11px',
        color: '#666666',
        textAlign: 'center',
        fontFamily: '"Courier New", monospace',
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <span>{'University of London'}</span>
        <span>{'|'}</span>
        
        <a 
          href="https://cidak.co/about" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            color: '#ffffff',
            textDecoration: 'none',
            transition: 'opacity 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.opacity = '0.6'}
          onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
        >
          {'[Website]'}
        </a>
        <a 
          href="https://github.com/CIDAK/2025-nasa-space-apps-challenge" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            color: '#ffffff',
            textDecoration: 'none',
            transition: 'opacity 0.2s',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}
          onMouseOver={(e) => e.currentTarget.style.opacity = '0.6'}
          onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
        >
          <svg 
            height="14" 
            width="14" 
            viewBox="0 0 16 16" 
            fill="currentColor"
            style={{ marginRight: '2px' }}
          >
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          {'[GitHub]'}
        </a>
        <a 
          href="https://www.linkedin.com/company/cidak" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            color: '#ffffff',
            textDecoration: 'none',
            transition: 'opacity 0.2s',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}
          onMouseOver={(e) => e.currentTarget.style.opacity = '0.6'}
          onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
        >
          <svg 
            height="14" 
            width="14" 
            viewBox="0 0 24 24" 
            fill="currentColor"
            style={{ marginRight: '2px' }}
          >
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          {'[LinkedIn]'}
        </a>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes twinkle {
          0%, 100% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.4;
          }
        }
      `}</style>
    </div>
  );
}