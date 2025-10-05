import React from 'react';

export default function AboutDialog({ isOpen, onClose }) {
  if (!isOpen) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000, // Make sure this is very high
    }}>
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'rgba(20, 20, 40, 0.95)',
          borderRadius: '10px',
          padding: '20px 30px',
          maxWidth: '500px',
          width: '80%',
          color: 'white',
          boxShadow: '0 0 20px rgba(0, 100, 255, 0.5)',
          border: '1px solid rgba(100, 150, 255, 0.3)',
        }}
      >
        <h2 style={{ 
          textAlign: 'center', 
          marginBottom: '15px', 
          color: '#4f9ef2',
          borderBottom: '1px solid rgba(100, 150, 255, 0.3)',
          paddingBottom: '10px'
        }}>
          CIDAK Team
        </h2>
        
        <p style={{ marginBottom: '15px', lineHeight: '1.5' }}>
          We are students from the University of London, participating in the 2025 NASA Space Apps Challenge. Our team is focused on creating immersive experiences that make NASA's Earth observation data more accessible.
        </p>
        
        <h3 style={{ marginBottom: '10px', color: '#4f9ef2' }}>Team Members:</h3>
        <ul style={{ 
          listStyleType: 'none', 
          padding: '0 0 0 15px',
          marginBottom: '15px' 
        }}>
          <li style={{ marginBottom: '8px' }}>• Dylan Prinsloo</li>
          <li style={{ marginBottom: '8px' }}>• Ian Chow</li>
          <li style={{ marginBottom: '8px' }}>• Josephine Matthysen</li>
          <li style={{ marginBottom: '8px' }}>• Silvam Alexsandra</li>
        </ul>
        
        <p style={{ marginBottom: '20px', fontSize: '0.9em', opacity: '0.8' }}>
          Our VR experience is designed to help users explore and understand NASA's ocean data through an interactive solar system journey.
        </p>
        
        <div style={{ textAlign: 'center' }}>
          <button 
            onClick={onClose}
            style={{
              background: 'rgba(0, 100, 200, 0.8)',
              color: 'white',
              border: 'none',
              padding: '8px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}