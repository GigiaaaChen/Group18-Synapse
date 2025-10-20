import React from 'react';
import { useNavigate } from 'react-router-dom';

function WelcomePage() {
  const navigate = useNavigate();

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  };

  const boxStyle = {
    backgroundColor: 'white',
    padding: '60px 40px',
    borderRadius: '20px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
    textAlign: 'center',
    maxWidth: '500px'
  };

  const titleStyle = {
    fontSize: '32px',
    color: '#333',
    marginBottom: '10px'
  };

  const subtitleStyle = {
    fontSize: '18px',
    color: '#666',
    marginBottom: '30px'
  };

  const buttonStyle = {
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    padding: '15px 40px',
    fontSize: '18px',
    borderRadius: '30px',
    cursor: 'pointer',
    fontWeight: 'bold'
  };

  return (
    <div style={containerStyle}>
      <div style={boxStyle}>
        <h1 style={titleStyle}>🐾 Tamagotchi Task Manager</h1>
        <p style={subtitleStyle}>Keep your tasks alive and happy!</p>
        <button 
          style={buttonStyle}
          onClick={() => navigate('/tasks')}
        >
          Add Tasks
        </button>
      </div>
    </div>
  );
}

export default WelcomePage;