import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Row, Col, Card, CardBody, Container,
    FormGroup, Label, Input, Button
} from "reactstrap";

const AddImages = ({ orderId }) => {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [existingImages, setExistingImages] = useState([]);

    useEffect(() => {
        if (orderId) fetchExistingImages();
    }, [orderId]);

    const fetchExistingImages = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await axios.get(`${import.meta.env.VITE_APP_KEY}order/images/${orderId}/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setExistingImages(response.data.images || []);
        } catch (error) {
            console.error('Error fetching existing images:', error.response?.data || error.message);
        }
    };

    const handleFileChange = (e) => {
        setSelectedFiles(Array.from(e.target.files));  // Collect all selected images
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) {
            alert('Please select at least one image to upload.');
            return;
        }

        const token = localStorage.getItem('token');
        const formData = new FormData();

        formData.append('order', orderId);
        formData.append('uploaded_at', new Date().toISOString());

        selectedFiles.forEach(file => {
            formData.append('images', file);  // All images under 'images' key like Postman
        });

        try {
            const response = await axios.post(`${import.meta.env.VITE_APP_KEY}order/images/upload/`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            alert('Images uploaded successfully!');
            setSelectedFiles([]);  // Clear selection
            fetchExistingImages();  // Refresh list
        } catch (error) {
            console.error('Upload failed:', error.response?.data || error.message);
            alert('Image upload failed!');
        }
    };

    const handleDeleteImage = async (imageId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this image?");
        if (!confirmDelete) return;

        const token = localStorage.getItem('token');
        try {
            await axios.delete(`${import.meta.env.VITE_APP_KEY}order/images/delete/${imageId}/`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            alert('Image deleted successfully!');
            fetchExistingImages();  // Refresh list
        } catch (error) {
            console.error('Delete failed:', error.response?.data || error.message);
            alert('Image deletion failed!');
        }
    };

    return (
        <div className="page-content">
            <Container fluid>
                <Row>
                    <Col xs={12}>
                        <Card>
                            <CardBody>
                                <h6 className="mb-4 card-title">PRODUCT IMAGES</h6>
                                <Row>
                                    <Col md={6} lg={4}>
                                        <FormGroup>
                                            <Label htmlFor="productImages">Select Parcel Images</Label>
                                            <Input
                                                type="file"
                                                id="productImages"
                                                name="productImages"
                                                multiple
                                                onChange={handleFileChange}
                                                className="form-control"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={6} lg={4} className="d-flex align-items-end">
                                        <Button color="primary" onClick={handleUpload} className="mt-2 mt-md-0">
                                            Upload Images
                                        </Button>
                                    </Col>
                                </Row>

                                {selectedFiles.length > 0 && (
                                    <div className="mt-3">
                                        <h6>Selected Files:</h6>
                                        <Row>
                                            {selectedFiles.map((file, i) => (
                                                <Col key={i} md={2} className="mb-3 text-center">
                                                    <img
                                                        src={URL.createObjectURL(file)}
                                                        alt={`Selected ${i}`}
                                                        className="img-thumbnail"
                                                        style={{ height: '100px', objectFit: 'cover' }}
                                                    />
                                                    <div className="mt-2">{file.name}</div>
                                                </Col>
                                            ))}
                                        </Row>
                                    </div>
                                )}

                                {existingImages.length > 0 && (
                                    <div className="mt-4">
                                        {/* <h6>Existing Images:</h6> */}
                                        <Row>
                                            {existingImages.map((img, index) => (
                                                <Col key={index} md={2} className="mb-3 text-center">
                                                    <img
                                                        src={`${import.meta.env.VITE_APP_IMAGE}${img.image}`}
                                                        alt={`Product ${index}`}
                                                        className="img-thumbnail"
                                                        style={{ height: '100px', objectFit: 'cover' }}
                                                    />
                                                    <Button
                                                        color="danger"
                                                        size="sm"
                                                        className="mt-2"
                                                        onClick={() => handleDeleteImage(img.id)} // Now img.id will be valid
                                                    >
                                                        Delete
                                                    </Button>
                                                </Col>
                                            ))}
                                        </Row>
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default AddImages;
