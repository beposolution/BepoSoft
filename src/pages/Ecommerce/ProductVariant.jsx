import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Col, Container, Row, CardBody, CardTitle, Label, Form, Input, Button, FormFeedback, FormGroup, Table } from 'reactstrap'; // Ensure Table is imported
import { FaPlus, FaTrashAlt, FaBox, FaUser } from 'react-icons/fa';
import Breadcrumbs from "../../components/Common/Breadcrumb";
import Select from 'react-select';

const VariantProductCreateForm = () => {
    document.title = "Beposoft | Product Variant";
    const { type, id } = useParams();
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    const [products, setProducts] = useState([]);
    const [stockData, setStockData] = useState([]);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [imagePreviews, setImagePreviews] = useState([]);
    const [attributeOptions, setAttributeOptions] = useState({
        names: [],
        ids: [],
        values: {}
    });
    const [formData, setFormData] = useState({
        product: '',
        attributes: [],
        managedUsers: '',
        stock: '',
        is_variant: false
    });


    const [error, setError] = useState(null);
    const userName = localStorage.getItem('name');


    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_APP_KEY}products/${id}/variants/`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                });
                const data = await response.json();

                const productObj = data.products; // This is your product
                const products = productObj ? [productObj] : []; // Wrap in array for dropdown
                setProducts(products);

                if (id && productObj && String(productObj.id) === String(id)) {
                    setFormData(prevData => ({ ...prevData, product: String(productObj.id) }));
                } else {
                    console.log('Product not found for id:', id);
                }

            } catch (err) {
                setError(err.message || "An error occurred while fetching products");
            }
        };

        fetchProducts();
    }, [token]);

    useEffect(() => {
        const fetchAttributes = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_APP_KEY}product/attributes/`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.status === 401) {
                    localStorage.removeItem('token');
                    navigate('/login');
                    return;
                }

                const data = await response.json();
                if (Array.isArray(data)) {
                    const attributeNames = data.map(attr => attr.name);
                    const attributeIds = data.map(attr => attr.id);

                    setAttributeOptions({
                        names: attributeNames,
                        ids: attributeIds,
                        values: {}
                    });
                } else {
                    throw new Error("Unexpected data structure while fetching attributes");
                }
            } catch (err) {
                setError(err.message || "An error occurred while fetching attributes");
            }
        };

        fetchAttributes();
    }, [token]);


    const handleDelete = async (id) => {
        try {
            const confirmed = window.confirm("Are you sure you want to delete this item?");
            if (!confirmed) return;

            const url = `${import.meta.env.VITE_APP_KEY}product/update/${id}/`;

            // Add token here
            const token = localStorage.getItem("token"); // Assuming the token is stored in localStorage
            if (!token) {
                throw new Error("Authorization token is missing. Please log in.");
            }

            await axios.delete(url, {
                headers: {
                    Authorization: `Bearer ${token}`, // Pass the token in the Authorization header
                },
            });

            // Update the UI by filtering out the deleted item
            setStockData((prevData) => prevData.filter((item) => item.id !== id));

            alert("Item deleted successfully.");
        } catch (err) {
            setError("Failed to delete item. Please try again.");
        }
    };



    const fetchAttributeValues = useCallback(async (attributeId, attributeName) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_APP_KEY}product/attribute/${attributeId}/values/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            })

            const data = await response.json();
            if (Array.isArray(data)) {
                setAttributeOptions(prevOptions => ({
                    ...prevOptions,
                    values: {
                        ...prevOptions.values,
                        [attributeName]: data.map(item => ({ value: item.value, label: item.value }))
                    }
                }));
            } else {
                throw new Error("Unexpected data structure while fetching attribute values");
            }
        } catch (err) {
            setError(err.message || "An error occurred while fetching attribute values");
        }
    }, [token]);


    const handleAttributeNameChange = async (index, selectedOption) => {
        const selectedAttributeName = selectedOption ? selectedOption.value : '';
        const attributeIndex = attributeOptions.names.indexOf(selectedAttributeName);
        const selectedAttributeId = attributeOptions.ids[attributeIndex];


        if (!selectedAttributeId) return;

        const newAttributes = [...formData.attributes];
        newAttributes[index] = {
            ...newAttributes[index],
            attribute: selectedAttributeName,
            values: []
        };
        setFormData(prevData => ({ ...prevData, attributes: newAttributes }));

        try {
            await fetchAttributeValues(selectedAttributeId, selectedAttributeName);
        } catch (err) {
        }
    };

    const handleAttributeValueChange = (index, selectedOptions) => {
        const selectedValues = selectedOptions ? selectedOptions.map(option => option.value) : [];
        const newAttributes = [...formData.attributes];
        newAttributes[index] = {
            ...newAttributes[index],
            values: selectedValues
        };
        setFormData(prevData => ({ ...prevData, attributes: newAttributes }));
    };

    const addAttribute = () => {
        setFormData(prevData => ({
            ...prevData,
            attributes: [...prevData.attributes, { attribute: '', values: [] }]
        }));
    };

    const removeAttribute = (index) => {
        setFormData(prevData => ({
            ...prevData,
            attributes: prevData.attributes.filter((_, i) => i !== index)
        }));
    };



    const handleSubmit = async (e) => {
        e.preventDefault();

        const formDataToSend = new FormData();
        formDataToSend.append('product', formData.product);
        formDataToSend.append('managedUsers', formData.managedUsers);
        formDataToSend.append('attributes', JSON.stringify(formData.attributes));

        try {
            const response = await axios.post(`${import.meta.env.VITE_APP_KEY}add/product/variant/`, formDataToSend, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (response.status === 201) {
                setSuccessMessage("Product added successfully!");
                // Fetch stock data after successful submission
                fetchStockData();
            } else {
                setErrorMessage("Failed to add product. Please try again.");
            }
        } catch (err) {
            setError(err.response ? err.response.data.message : err.message || "An error occurred while submitting");
            setErrorMessage("Failed to add product. Please try again.");
        }
    };

    // Fetch stock data function
    const fetchStockData = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_APP_KEY}products/${id}/variants/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401) {
                localStorage.removeItem('token');
                navigate('/login');
                return;
            }

            const data = await response.json();
            setStockData(data.products.variantIDs); // Ensure that variantIDs are being correctly set
        } catch (err) {
            setError(err.message || "An error occurred while fetching stock data");
        }
    };

    // UseEffect to fetch stock data when component mounts or id changes
    useEffect(() => {
        fetchStockData();
    }, [id, navigate]);











    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <Breadcrumbs title="Ecommerce" breadcrumbItem="Product Management" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="mb-4">Create Variant Products</CardTitle>

                                    {successMessage && (
                                        <div className="alert alert-success" role="alert">
                                            {successMessage}
                                        </div>
                                    )}

                                    <Form onSubmit={handleSubmit}>
                                        <FormGroup className="mb-3">
                                            <Label for="userName">
                                                <FaUser className="me-2" /> Managed Users
                                            </Label>
                                            <Input
                                                type="text"
                                                id="userName"
                                                name="userName"
                                                value={userName}
                                                onChange={(e) => setFormData(prevData => ({ ...prevData, userName: e.target.value }))}
                                                placeholder="e.g., User1, User2 (comma separated)"
                                            />
                                        </FormGroup>

                                        <FormGroup className="mb-3">
                                            <Label for="product">
                                                <FaBox className="me-2" /> Product
                                            </Label>
                                            <Input
                                                type="select"
                                                id="product"
                                                name="product"
                                                value={String(formData.product || "")}
                                                onChange={(e) => {
                                                    setFormData(prevData => ({ ...prevData, product: e.target.value }));
                                                }}
                                            >
                                                <option value="">Select a product</option>
                                                {products.map(product => (
                                                    <option key={product.id} value={String(product.id)}>
                                                        {product.name}
                                                    </option>
                                                ))}
                                            </Input>
                                        </FormGroup>

                                        {type === 'variant' && (
                                            <React.Fragment>
                                                {formData.attributes.map((attr, index) => (
                                                    <FormGroup key={index} className="mb-3">
                                                        <Row form className="align-items-center">
                                                            <Col md={5}>
                                                                <Label for={`attribute-${index}`}>Attribute Name</Label>
                                                                <Select
                                                                    id={`attribute-${index}`}
                                                                    value={attr.attribute ? { value: attr.attribute, label: attr.attribute } : null}
                                                                    onChange={(option) => handleAttributeNameChange(index, option)}
                                                                    options={attributeOptions.names.map(name => ({ value: name, label: name }))}
                                                                    placeholder="Select an attribute"
                                                                />
                                                            </Col>
                                                            <Col md={5}>
                                                                <Label for={`value-${index}`}>Attribute Values</Label>
                                                                <Select
                                                                    id={`value-${index}`}
                                                                    isMulti
                                                                    value={attr.values.map(value => ({ value, label: value }))}
                                                                    onChange={(options) => handleAttributeValueChange(index, options)}
                                                                    options={attr.attribute && attributeOptions.values[attr.attribute] ? attributeOptions.values[attr.attribute] : []}
                                                                    placeholder="Select values"
                                                                    isDisabled={!attr.attribute}
                                                                />
                                                            </Col>

                                                            <Col md={2} className="d-flex justify-content-end align-items-center" style={{ height: '100%' }}>
                                                                <Button
                                                                    color="danger"
                                                                    onClick={() => removeAttribute(index)}
                                                                    outline
                                                                    className="w-100 w-sm-auto"
                                                                    style={{ padding: '8px', alignSelf: 'center' }}
                                                                >
                                                                    <FaTrashAlt /> Remove
                                                                </Button>
                                                            </Col>

                                                        </Row>
                                                    </FormGroup>
                                                ))}

                                                <Button type="button" color="primary" onClick={addAttribute} className="mb-3" outline>
                                                    <FaPlus /> Add Attribute
                                                </Button>

                                            </React.Fragment>
                                        )}

                                        <div className="d-flex justify-content-start">
                                            <Button type="submit" color="success">Submit</Button>
                                        </div>

                                        {error && (
                                            <div className="mt-3">
                                                <FormFeedback type="invalid">{error}</FormFeedback>
                                            </div>
                                        )}
                                    </Form>
                                </CardBody>
                            </Card>


                            <Col xl={12}>
                                <Card>
                                    <CardBody>
                                        <div className="table-responsive">
                                            <h4 className="card-title">
                                                VARIANT ITEMS
                                            </h4>

                                            {error && <p className="text-danger">{error}</p>}
                                            <Table className="align-middle mb-0">
                                                <thead>
                                                    <tr>
                                                        <th>ID</th>
                                                        <th>NAME</th>
                                                        <th>IMAGE</th>
                                                        <th>PRICE</th>
                                                        <th>VARIATION</th>
                                                        <th>STOCK</th>
                                                        <th>CREATED USER</th>
                                                        {/* <th>DELETE</th> */}
                                                        <th>EDIT</th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {stockData && stockData.length > 0 ? (
                                                        stockData.map((item, index) => (
                                                            <tr key={item.id}>
                                                                <th scope="row">{index + 1}</th>
                                                                <td>
                                                                    <Link to={`/product/${item.id}/images`} style={{ textDecoration: "none", color: "inherit" }}>
                                                                        {item.name}
                                                                    </Link>
                                                                </td>

                                                                <td>
                                                                    <img
                                                                        src={`${import.meta.env.VITE_APP_IMAGE}${item.image}`}
                                                                        alt={item.name || 'Image not available'}
                                                                        style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                                                    // onError={(e) => { e.target.src = '/path/to/placeholder.png'; }}
                                                                    />
                                                                </td>

                                                                <td>{item.price}</td>
                                                                <td>{item.size || 'N/A'} - {item.color || 'N/A'}</td>
                                                                <td>{item.stock}</td>
                                                                <td>{item.created_user}</td>
                                                                {/* <td>
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-light btn-sm"
                                                                        onClick={() => handleDelete(item.id)}
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                </td> */}
                                                                <td>
                                                                    <Link to={`/ecommerce-product-edit/${item.id}/`}>
                                                                        <button type="button" className="btn btn-light btn-sm">Edit</button>
                                                                    </Link>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="7" className="text-center">No variant items available</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </Table>
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>


    );
};

const styles = {
    imagePreviewContainer: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        justifyContent: 'flex-start',
        padding: '10px'
    },
    imagePreview: {
        position: 'relative',
        display: 'inline-block',
    },
    image: {
        width: '100px',
        height: '100px',
        objectFit: 'cover',
        borderRadius: '5px',
        border: '1px solid #ddd',
    },
    removeButton: {
        position: 'absolute',
        top: '5px',
        right: '5px',
        backgroundColor: '#ff4d4f',
        color: '#fff',
        border: 'none',
        borderRadius: '3px',
        padding: '5px 10px',
        cursor: 'pointer',
        fontSize: '12px',
    },
};

export default VariantProductCreateForm;
