import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Navbar, Nav } from 'react-bootstrap';
import Dashboard from './components/Dashboard';
import DownloadForm from './components/DownloadForm';
import DownloadHistory from './components/DownloadHistory';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DownloadProvider } from './contexts/DownloadContext';

function AppContent() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const handleLogout = () => {
    logout();
    setActiveTab('dashboard');
  };

  if (!user && (showLogin || showRegister)) {
    return (
      <Container fluid className="min-vh-100 d-flex align-items-center justify-content-center">
        <Row className="w-100 justify-content-center">
          <Col md={6} lg={4}>
            {showLogin ? (
              <LoginForm 
                onSuccess={() => {
                  setShowLogin(false);
                  setActiveTab('dashboard');
                }}
                onSwitchToRegister={() => {
                  setShowLogin(false);
                  setShowRegister(true);
                }}
              />
            ) : (
              <RegisterForm 
                onSuccess={() => {
                  setShowRegister(false);
                  setShowLogin(true);
                }}
                onSwitchToLogin={() => {
                  setShowRegister(false);
                  setShowLogin(true);
                }}
              />
            )}
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <>
      <Navbar expand="lg" className="mb-4" fixed="top">
        <Container fluid>
          <Navbar.Brand href="#" className="text-primary">
            <i className="bi bi-download me-2"></i>
            Freepik Downloader Pro
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              {user && (
                <>
                  <Nav.Link 
                    active={activeTab === 'dashboard'} 
                    onClick={() => setActiveTab('dashboard')}
                  >
                    <i className="bi bi-speedometer2 me-1"></i>
                    Dashboard
                  </Nav.Link>
                  <Nav.Link 
                    active={activeTab === 'download'} 
                    onClick={() => setActiveTab('download')}
                  >
                    <i className="bi bi-plus-circle me-1"></i>
                    New Download
                  </Nav.Link>
                  <Nav.Link 
                    active={activeTab === 'history'} 
                    onClick={() => setActiveTab('history')}
                  >
                    <i className="bi bi-clock-history me-1"></i>
                    History
                  </Nav.Link>
                </>
              )}
            </Nav>
            <Nav>
              {user ? (
                <>
                  <Nav.Link disabled className="text-muted">
                    <i className="bi bi-person-circle me-1"></i>
                    {user.email}
                  </Nav.Link>
                  <Nav.Link onClick={handleLogout} className="text-danger">
                    <i className="bi bi-box-arrow-right me-1"></i>
                    Logout
                  </Nav.Link>
                </>
              ) : (
                <>
                  <Nav.Link onClick={() => setShowLogin(true)}>
                    <i className="bi bi-box-arrow-in-right me-1"></i>
                    Login
                  </Nav.Link>
                  <Nav.Link onClick={() => setShowRegister(true)}>
                    <i className="bi bi-person-plus me-1"></i>
                    Register
                  </Nav.Link>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container fluid style={{ marginTop: '80px', paddingBottom: '2rem' }}>
        {user ? (
          <DownloadProvider>
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'download' && <DownloadForm />}
            {activeTab === 'history' && <DownloadHistory />}
          </DownloadProvider>
        ) : (
          <Row className="justify-content-center">
            <Col lg={8}>
              <div className="hero-section fade-in">
                <h1 className="display-4 fw-bold text-primary mb-4">
                  Freepik Downloader Pro
                </h1>
                <p className="lead text-muted mb-4">
                  Download high-quality images from Freepik with ease. 
                  Secure, fast, and reliable image downloading service.
                </p>
                <div className="d-flex gap-3 justify-content-center">
                  <button 
                    className="btn btn-primary btn-lg"
                    onClick={() => setShowLogin(true)}
                  >
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Get Started
                  </button>
                  <button 
                    className="btn btn-outline-primary btn-lg"
                    onClick={() => setShowRegister(true)}
                  >
                    <i className="bi bi-person-plus me-2"></i>
                    Create Account
                  </button>
                </div>
              </div>

              <Row className="g-4">
                <Col md={4}>
                  <div className="text-center">
                    <div className="feature-icon">
                      <i className="bi bi-shield-check"></i>
                    </div>
                    <h5 className="fw-bold">Secure Downloads</h5>
                    <p className="text-muted">
                      Your downloads are processed securely with enterprise-grade security measures.
                    </p>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="text-center">
                    <div className="feature-icon">
                      <i className="bi bi-lightning-charge"></i>
                    </div>
                    <h5 className="fw-bold">Lightning Fast</h5>
                    <p className="text-muted">
                      High-speed downloads with optimized processing for quick results.
                    </p>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="text-center">
                    <div className="feature-icon">
                      <i className="bi bi-graph-up"></i>
                    </div>
                    <h5 className="fw-bold">Track Progress</h5>
                    <p className="text-muted">
                      Monitor your downloads with real-time status updates and history tracking.
                    </p>
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>
        )}
      </Container>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;