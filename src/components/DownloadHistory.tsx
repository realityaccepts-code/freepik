import React, { useState } from 'react';
import { Card, Table, Badge, Button, Spinner, Alert, Form, Row, Col } from 'react-bootstrap';
import { useDownload } from '../contexts/DownloadContext';

const DownloadHistory: React.FC = () => {
  const { downloads, downloadFile, refreshDownloads, loading } = useDownload();
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleDownload = async (id: number) => {
    setDownloadingId(id);
    try {
      await downloadFile(id);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredDownloads = downloads.filter(download => {
    const matchesFilter = filter === 'all' || download.status === filter;
    const matchesSearch = download.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         download.url.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="fade-in">
      <Row className="mb-4">
        <Col>
          <h2 className="text-primary fw-bold">
            <i className="bi bi-clock-history me-2"></i>
            Download History
          </h2>
          <p className="text-muted">View and manage all your downloads</p>
        </Col>
        <Col xs="auto">
          <Button variant="outline-primary" onClick={refreshDownloads} disabled={loading}>
            <i className="bi bi-arrow-clockwise me-2"></i>
            Refresh
          </Button>
        </Col>
      </Row>

      <Card className="mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">Filter by Status</Form.Label>
                <Form.Select 
                  value={filter} 
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">All Downloads</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">Search Downloads</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search by filename or URL..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <h5 className="mb-0">
            <i className="bi bi-list-ul me-2"></i>
            Downloads ({filteredDownloads.length})
          </h5>
        </Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" className="me-2" />
              Loading downloads...
            </div>
          ) : filteredDownloads.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-inbox display-4 text-muted"></i>
              <p className="text-muted mt-3 mb-0">
                {downloads.length === 0 ? 'No downloads found' : 'No downloads match your filters'}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table className="mb-0">
                <thead>
                  <tr>
                    <th>Filename</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDownloads.map((download) => (
                    <tr key={download.id}>
                      <td>
                        <div>
                          <div className="fw-semibold">{download.filename}</div>
                          <small className="text-muted text-truncate d-block" style={{ maxWidth: '300px' }}>
                            {download.url}
                          </small>
                        </div>
                      </td>
                      <td>
                        <Badge bg={getStatusVariant(download.status)}>
                          <i className={`bi ${getStatusIcon(download.status)} me-1`}></i>
                          {download.status.charAt(0).toUpperCase() + download.status.slice(1)}
                        </Badge>
                      </td>
                      <td>
                        {download.status === 'processing' ? (
                          <div style={{ width: '100px' }}>
                            <div className="progress" style={{ height: '6px' }}>
                              <div 
                                className="progress-bar" 
                                style={{ width: `${download.progress}%` }}
                              ></div>
                            </div>
                            <small className="text-muted">{download.progress}%</small>
                          </div>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        <small className="text-muted">
                          {new Date(download.created_at).toLocaleDateString()}
                          <br />
                          {new Date(download.created_at).toLocaleTimeString()}
                        </small>
                      </td>
                      <td>
                        {download.status === 'completed' ? (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleDownload(download.id)}
                            disabled={downloadingId === download.id}
                          >
                            {downloadingId === download.id ? (
                              <>
                                <Spinner animation="border" size="sm" className="me-1" />
                                Downloading...
                              </>
                            ) : (
                              <>
                                <i className="bi bi-download me-1"></i>
                                Download
                              </>
                            )}
                          </Button>
                        ) : download.status === 'failed' ? (
                          <div>
                            <Badge bg="danger" className="mb-1">Failed</Badge>
                            {download.error_message && (
                              <div>
                                <small className="text-danger">{download.error_message}</small>
                              </div>
                            )}
                          </div>
                        ) : (
                          <Badge bg="secondary">
                            {download.status === 'processing' ? 'Processing...' : 'Pending'}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default DownloadHistory;