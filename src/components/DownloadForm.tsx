import React, { useState } from 'react';
import { Card, Form, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { useDownload } from '../contexts/DownloadContext';

const DownloadForm: React.FC = () => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { addDownload } = useDownload();

  const validateFreepikUrl = (url: string): boolean => {
    const freepikPattern = /^https:\/\/www\.freepik\.com\/.+/;
    return freepikPattern.test(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateFreepikUrl(url)) {
      setError('Please enter a valid Freepik URL (must start with https://www.freepik.com/)');
      return;
    }

    setLoading(true);

    try {
      await addDownload(url);
      setSuccess('Download added successfully! Check the dashboard for progress.');
      setUrl('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <Row className="justify-content-center">
        <Col lg={8}>
          <Card>
            <Card.Header>
              <h4 className="mb-0">
                <i className="bi bi-plus-circle me-2"></i>
                Add New Download
              </h4>
            </Card.Header>
            <Card.Body className="p-4">
              {error && (
                <Alert variant="danger" className="d-flex align-items-center">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                </Alert>
              )}
              
              {success && (
                <Alert variant="success" className="d-flex align-items-center">
                  <i className="bi bi-check-circle me-2"></i>
                  {success}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold">
                    <i className="bi bi-link-45deg me-2"></i>
                    Freepik Image URL
                  </Form.Label>
                  <Form.Control
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.freepik.com/free-photo/example-image_123456.htm"
                    required
                    disabled={loading}
                    size="lg"
                  />
                  <Form.Text className="text-muted">
                    <i className="bi bi-info-circle me-1"></i>
                    Enter the full URL of the Freepik image you want to download
                  </Form.Text>
                </Form.Group>

                <div className="d-grid">
                  <Button 
                    variant="primary" 
                    type="submit" 
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Adding Download...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-download me-2"></i>
                        Add Download
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>

          <Card className="mt-4">
            <Card.Header>
              <h5 className="mb-0">
                <i className="bi bi-question-circle me-2"></i>
                How to Use
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <div className="d-flex mb-3">
                    <div className="feature-icon bg-primary me-3" style={{ width: '40px', height: '40px', fontSize: '1rem' }}>
                      1
                    </div>
                    <div>
                      <h6 className="fw-semibold">Find Your Image</h6>
                      <p className="text-muted mb-0">Browse Freepik and find the image you want to download</p>
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="d-flex mb-3">
                    <div className="feature-icon bg-primary me-3" style={{ width: '40px', height: '40px', fontSize: '1rem' }}>
                      2
                    </div>
                    <div>
                      <h6 className="fw-semibold">Copy URL</h6>
                      <p className="text-muted mb-0">Copy the full URL from your browser's address bar</p>
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="d-flex mb-3">
                    <div className="feature-icon bg-primary me-3" style={{ width: '40px', height: '40px', fontSize: '1rem' }}>
                      3
                    </div>
                    <div>
                      <h6 className="fw-semibold">Paste & Submit</h6>
                      <p className="text-muted mb-0">Paste the URL above and click "Add Download"</p>
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="d-flex mb-3">
                    <div className="feature-icon bg-primary me-3" style={{ width: '40px', height: '40px', fontSize: '1rem' }}>
                      4
                    </div>
                    <div>
                      <h6 className="fw-semibold">Download Ready</h6>
                      <p className="text-muted mb-0">Monitor progress and download when complete</p>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DownloadForm;