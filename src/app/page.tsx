import Link from 'next/link';

export default function Home() {
  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  };

  const boxStyle: React.CSSProperties = {
    backgroundColor: 'white',
    padding: '60px 40px',
    borderRadius: '20px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
    textAlign: 'center',
    maxWidth: '500px'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '32px',
    color: '#333',
    marginBottom: '10px'
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '18px',
    color: '#666',
    marginBottom: '30px'
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    padding: '15px 40px',
    fontSize: '18px',
    borderRadius: '30px',
    cursor: 'pointer',
    fontWeight: 'bold',
    display: 'inline-block',
    textDecoration: 'none'
  };

  return (
    <div style={containerStyle}>
      <div style={boxStyle}>
        <h1 style={titleStyle}>🐾 Tamagotchi Task Manager</h1>
        <p style={subtitleStyle}>Keep your tasks alive and happy!</p>
        <Link href="/tasks" style={buttonStyle}>
          Add Tasks
        </Link>
      </div>
    </div>
  );
}
