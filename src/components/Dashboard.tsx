import React from 'react';
import { Row, Col, Card, ProgressBar, Badge } from 'react-bootstrap';
import { useDownload } from '../contexts/DownloadContext';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { stats, downloads } = useDownload();
  const { user } = useAuth();

  const recentDownloads = downloads.slice(0, 5);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'processing': return 'primary';
      case 'failed': return 'danger';
      default: return 'warning';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'bi-check-circle-fill';
      case 'processing': return 'bi-arrow-clockwise';
      case 'failed': return 'bi-x-circle-fill';
      default: return 'bi-clock-fill';
    }
  };

  return (
    <div className="fade-in">
      <Row className="mb-4">
        <Col>
          <h2 className="text-primary fw-bold">
            <i className="bi bi-speedometer2 me-2"></i>
            Dashboard
          </h2>
          <p className="text-muted">Welcome back, {user?.name}! Here's your download overview.</p>
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="h-100">
            <Card.Body className="text-center">
              <div className="feature-icon bg-primary mb-3">
                <i className="bi bi-collection"></i>
              </div>
              <h3 className="fw-bold text-primary">{stats.total}</h3>
              <p className="text-muted mb-0">Total Downloads</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100">
            <Card.Body className="text-center">
              <div className="feature-icon bg-success mb-3">
                <i className="bi bi-check-circle"></i>
              </div>
              <h3 className="fw-bold text-success">{stats.completed}</h3>
              <p className="text-muted mb-0">Completed</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100">
            <Card.Body className="text-center">
              <div className="feature-icon bg-warning mb-3">
                <i className="bi bi-clock"></i>
              </div>
              <h3 className="fw-bold text-warning">{stats.processing + stats.pending}</h3>
              <p className="text-muted mb-0">In Progress</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100">
            <Card.Body className="text-center">
              <div className="feature-icon bg-danger mb-3">
                <i className="bi bi-x-circle"></i>
              </div>
              <h3 className="fw-bold text-danger">{stats.failed}</h3>
              <p className="text-muted mb-0">Failed</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg={8}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="bi bi-clock-history me-2"></i>
                Recent Downloads
              </h5>
            </Card.Header>
            <Card.Body>
              {recentDownloads.length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-inbox display-4 text-muted"></i>
                  <p className="text-muted mt-3">No downloads yet. Start by adding a new download!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentDownloads.map((download) => (
                    <div key={download.id} className="download-item">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="flex-grow-1">
                          <h6 className="mb-1 fw-semibold">{download.filename}</h6>
                          <small className="text-muted">{download.url}</small>
                        </div>
                        <Badge bg={getStatusVariant(download.status)} className="ms-2">
                          <i className={`bi ${getStatusIcon(download.status)} me-1`}></i>
                          {download.status.charAt(0).toUpperCase() + download.status.slice(1)}
                        </Badge>
                      </div>
                      {download.status === 'processing' && (
                        <ProgressBar 
                          now={download.progress} 
                          label={`${download.progress}%`}
                          className="mb-2"
                        />
                      )}
                      <small className="text-muted">
                        <i className="bi bi-calendar me-1"></i>
                        {new Date(download.created_at).toLocaleDateString()}
                      </small>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="bi bi-pie-chart me-2"></i>
                Download Statistics
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-success">Completed</span>
                  <span className="fw-semibold">{stats.completed}</span>
                </div>
                <ProgressBar 
                  variant="success" 
                  now={stats.total > 0 ? (stats.completed / stats.total) * 100 : 0} 
                />
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-primary">Processing</span>
                  <span className="fw-semibold">{stats.processing}</span>
                </div>
                <ProgressBar 
                  variant="primary" 
                  now={stats.total > 0 ? (stats.processing / stats.total) * 100 : 0} 
                />
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-warning">Pending</span>
                  <span className="fw-semibold">{stats.pending}</span>
                </div>
                <ProgressBar 
                  variant="warning" 
                  now={stats.total > 0 ? (stats.pending / stats.total) * 100 : 0} 
                />
              </div>
              <div>
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-danger">Failed</span>
                  <span className="fw-semibold">{stats.failed}</span>
                </div>
                <ProgressBar 
                  variant="danger" 
                  now={stats.total > 0 ? (stats.failed / stats.total) * 100 : 0} 
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;