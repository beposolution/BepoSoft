import React, { useState, useEffect } from "react";
import {
    Card,
    Col,
    Container,
    Row,
    CardBody,
    CardTitle,
    Label,
    Form,
    Input,
    Button,
} from "reactstrap";
import { useParams } from "react-router-dom";
import Breadcrumbs from "../../components/Common/Breadcrumb";

const FormLayouts = () => {
    const { id } = useParams();
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedImages, setSelectedImages] = useState([]);
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const created_user = localStorage.getItem("name");
    const token = localStorage.getItem("token");

    useEffect(() => {
        async function fetchProducts() {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_APP_KEY}products/`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                if (!response.ok) {
                    throw new Error("Failed to fetch products");
                }
                const data = await response.json();
                setProducts(data.data);
                setLoading(false);
            } catch (error) {
                setError(error.message);
                setLoading(false);
            }
        }

        if (token) {
            fetchProducts();
        } else {
            setError("User is not authenticated");
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (products.length > 0) {
            const product = products.find((product) => product.id === parseInt(id));
            setSelectedProduct(product);
            setImages(product?.images || []); 
        }
    }, [id, products]);

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);

        console.log("product imagesss",files);

        const imagesWithPreview = files.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
        }));

        setSelectedImages((prevImages) => [...prevImages, ...imagesWithPreview]);
    };

    const removeImage = (index) => {
        URL.revokeObjectURL(selectedImages[index].preview);
        setSelectedImages((prevImages) => prevImages.filter((_, i) => i !== index));
    };

    console.log("selectedImages",selectedImages);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append("created_user", created_user);
        formData.append("product_id", selectedProduct.id);

        selectedImages.forEach((image) => {
            formData.append("images", image.file); 
        });

        console.log("formData",formData);   

        try {
            const response = await fetch(`${import.meta.env.VITE_APP_KEY}image/add/${id}/`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Failed to upload images");
            }

            const result = await response.json();
            alert("Images uploaded successfully!");
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    };

    if (loading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return <p>Error: {error}</p>;
    }

                                                  
    console.log("images..:",images);

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid={true}>
                    <Breadcrumbs title="Forms" breadcrumbItem="Form Layouts" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="mb-4">Form with Product ID</CardTitle>
                                    {selectedProduct ? (
                                        <>
                                            <Form onSubmit={handleSubmit}>
                                                <div className="mb-3">
                                                    <Label>CREATED USER</Label>
                                                    <Input type="text" value={created_user || "N/A"} readOnly />
                                                </div>
                                                <div className="mb-3">
                                                    <Label>PRODUCT NAME</Label>
                                                    <Input
                                                        type="text"
                                                        value={selectedProduct.name}
                                                        readOnly
                                                    />
                                                </div>
                                                <div className="mb-3">
                                                    <Label>Upload Images</Label>
                                                    <Input
                                                        type="file"
                                                        multiple
                                                        accept="image/*"
                                                        onChange={handleImageChange}
                                                    />
                                                    <Row className="mt-3">
                                                        {selectedImages.map((image, index) => (
                                                            <Col md={2} key={index} className="mb-3">
                                                                <div className="image-preview">
                                                                    <img
                                                                        src={image.preview}
                                                                        alt={`preview-${index}`}
                                                                        className="img-fluid"
                                                                        style={{
                                                                            width: "100%",
                                                                            height: "100px",
                                                                            objectFit: "cover",
                                                                            border: "1px solid #ccc",
                                                                            borderRadius: "5px",
                                                                        }}
                                                                    />
                                                                    <Button
                                                                        color="danger"
                                                                        size="sm"
                                                                        className="mt-2"
                                                                        onClick={() => removeImage(index)}
                                                                    >
                                                                        Remove
                                                                    </Button>
                                                                </div>
                                                            </Col>
                                                        ))}
                                                    </Row>
                                                </div>

                                                <div>
                                                    <Button type="submit" color="primary" className="w-md">
                                                        Submit
                                                    </Button>
                                                </div>
                                            </Form>

                                            <div className="mt-5">
                                                <h5>Existing Product Images</h5>
                                                <Row>
                                                    {images.map((image, index) => (
                                                        <Col md={1} key={index} className="mb-3">
                                                            <div className="image-preview">
                                                                <img
                                                                    src={`${import.meta.env.VITE_APP_IMAGE}/${image}`}
                                                                    alt={`Product-${index}`}
                                                                    className="img-fluid"
                                                                    style={{
                                                                        width: "100%",
                                                                        height: "100px",
                                                                        objectFit: "cover",
                                                                        border: "1px solid #ccc",
                                                                        borderRadius: "5px",
                                                                    }}
                                                                />
                                                                {/* <Button
                                                                    color="danger"
                                                                    size="sm"
                                                                    className="mt-2"
                                                                    onClick={() => deleteExistingImage(image.id)}
                                                                >
                                                                    Delete
                                                                </Button> */}
                                                            </div>
                                                        </Col>
                                                    ))}
                                                </Row>
                                            </div>
                                        </>
                                    ) : (
                                        <p>Product not found</p>
                                    )}
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    );
};

export default FormLayouts;
