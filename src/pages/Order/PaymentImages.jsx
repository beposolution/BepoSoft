import React, { useEffect, useState } from 'react';
import {
    Row, Col, Card, CardBody, CardTitle, Button, Form, Input, Modal
} from 'reactstrap';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const PaymentImages = () => {
    const { id } = useParams(); // order id from route
    const [images, setImages] = useState([]);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImg, setPreviewImg] = useState(null);

    // Fetch images when order ID changes
    useEffect(() => {
        if (id) fetchImages();
    }, [id]);

    // Fetch payment images for order
    const fetchImages = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await axios.get(
                `${import.meta.env.VITE_APP_KEY}order/payment/images/${id}/`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setImages(res.data.data || res.data.images || []);
        } catch (err) {
        }
    };

    // File select handler
    const handleFileChange = (e) => {
        setSelectedFiles(Array.from(e.target.files));
    };

    // Upload handler
    const handleUpload = async (e) => {
        e.preventDefault();
        if (!selectedFiles.length) {
            toast.error("Please select at least one image.");
            return;
        }

        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('order', id);
        selectedFiles.forEach(file => formData.append('images', file));

        setUploading(true);
        try {
            await axios.post(
                `${import.meta.env.VITE_APP_KEY}order/payment/images/upload/`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            toast.success("Images uploaded successfully!");
            setSelectedFiles([]);
            fetchImages();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to upload images.");
        } finally {
            setUploading(false);
        }
    };

    // Delete image handler
    const handleDeleteImage = async (imageId) => {
        if (!window.confirm("Are you sure you want to delete this image?")) return;

        const token = localStorage.getItem('token');
        try {
            await axios.delete(
                `${import.meta.env.VITE_APP_KEY}order/payment/images/delete/${imageId}/`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            toast.success('Image deleted successfully!');
            fetchImages();
        } catch (error) {
            toast.error('Image deletion failed!');
        }
    };

    const openPreview = (img) => {
        setPreviewImg(img);
        setPreviewOpen(true);
    };
    const closePreview = () => {
        setPreviewOpen(false);
        setPreviewImg(null);
    };

    return (
        <Card>
            <CardBody>
                <CardTitle className="mb-4 p-2 text-uppercase border-bottom border-primary">
                    <i className="bi bi-info-circle me-2"></i> PAYMENT IMAGES
                </CardTitle>

                {/* Image Upload Form */}
                <Form onSubmit={handleUpload}>
                    <Row className="align-items-center mb-3">
                        <Col md={6} lg={4}>
                            <Input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleFileChange}
                                className="form-control"
                            />
                        </Col>
                        <Col md={6} lg={4} className="d-flex align-items-end">
                            <Button type="submit" color="primary" disabled={uploading}>
                                {uploading ? "Uploading..." : "Upload Images"}
                            </Button>
                        </Col>
                    </Row>
                </Form>

                {/* Selected File Previews */}
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

                {/* Existing Images */}
                {images && images.length > 0 && (
                    <div className="mt-4">
                        <Row>
                            {images.map((img, index) => (
                                <Col key={img.id || index} md={2} className="mb-3 text-center">
                                    <img
                                        src={
                                            img.image?.startsWith('http')
                                                ? img.image
                                                : `${import.meta.env.VITE_APP_IMAGE}${img.image}`
                                        }
                                        alt={`Payment ${index}`}
                                        className="img-thumbnail"
                                        style={{ height: '100px', objectFit: 'cover', cursor: 'pointer' }}
                                        onClick={() => openPreview(img)}
                                    />
                                    <Button
                                        color="danger"
                                        size="sm"
                                        className="mt-2"
                                        onClick={() => handleDeleteImage(img.id)}
                                    >
                                        Delete
                                    </Button>
                                </Col>
                            ))}
                        </Row>
                    </div>
                )}
                <Modal isOpen={previewOpen} toggle={closePreview} centered size="lg">
                    <div className="text-end p-2">
                        <Button close onClick={closePreview}></Button>
                    </div>
                    <div className="text-center mb-3">
                        {previewImg && (
                            <img
                                src={
                                    previewImg.image?.startsWith('http')
                                        ? previewImg.image
                                        : `${import.meta.env.VITE_APP_IMAGE}${previewImg.image}`
                                }
                                alt="Preview"
                                style={{
                                    maxHeight: "80vh",
                                    maxWidth: "98%",
                                    borderRadius: 8,
                                    boxShadow: "0 4px 24px rgba(0,0,0,0.25)"
                                }}
                            />
                        )}
                    </div>
                </Modal>
                <ToastContainer />
            </CardBody>
        </Card>
    );
};

export default PaymentImages;
