import React, { useState, useEffect } from "react";
import { Button, Card, CardBody, CardTitle, Col, Container, Form, Input, Label, Row, FormFeedback } from "reactstrap";
import axios from "axios";
import * as yup from "yup";
import { useFormik } from "formik";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { useParams } from 'react-router-dom';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const EcommerenceAddProduct = () => {
    document.title = "Add Product | Skote - Vite React Admin & Dashboard Template";

    const { id } = useParams();
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [imagePreview, setImagePreview] = useState("");
    const [families, setFamilyOptions] = useState([]);
    const [message, setMessage] = useState(null); // To store success or error message
    const [messageType, setMessageType] = useState(null);
    const [rackList, setRackList] = useState([]);
    const [rackDetails, setRackDetails] = useState([]);
    const [categories, setCategories] = useState([]);

    const token = localStorage.getItem('token');

    const formik = useFormik({
        initialValues: {
            name: '',
            hsn_code: '',
            family: [],
            purchase_rate: '',
            type: '',
            tax: '',
            unit: "",
            selling_price: '',
            // stock: '',
            color: '',
            size: '',
            image: null,
            groupID: '',
            landing_cost: '',
            product_category: '',
            rack_details: [],
        },
        validationSchema: yup.object().shape({
            name: yup.string().required('Please Enter Your Product Name'),
            hsn_code: yup.string().required('Please Enter HSN Code'),
            family: yup.array().min(1, 'Please select at least one Division'),
            purchase_rate: yup.number().required('Please Enter Purchase Rate'),
            type: yup.string().required('Please Enter Product Type'),
            tax: yup.string().required('Please Enter Tax'),
            unit: yup.string().required('Please Enter Unit'),
            selling_price: yup.number().required('Please Enter Selling Price'),
            // stock: yup.number().required('Please Enter Stock Quantity'),
            // color: yup.string().required('Please Enter Color'),
            // size: yup.string().required('Please Enter Size'),
            groupID: yup.string().required('Please Enter groupID')

        }),
        onSubmit: async (values) => {
            const formData = new FormData();

            for (const key in values) {
                if (key === 'family' && Array.isArray(values[key])) {
                    // Append each family value individually
                    values[key].forEach((value) => {
                        formData.append('family', value);
                    });
                } else {
                    formData.append(key, values[key]);
                }
            }

            if (selectedFiles.length > 0) {
                formData.append('image', selectedFiles[0]);
            }

            formData.append('product_category', values.product_category);
            formData.append('rack_details', JSON.stringify(
                rackDetails
                    .filter(r => r.rack_id && r.column_name && r.usability && r.rack_stock)
                    .map(r => ({
                        rack_id: Number(r.rack_id),
                        column_name: r.column_name,
                        usability: r.usability,
                        rack_stock: Number(r.rack_stock)
                    }))
            ));

            try {
                const response = await fetch(
                    `${import.meta.env.VITE_APP_KEY}product/update/${id}/`,
                    {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                        body: formData,
                    }
                );

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || 'Error updating product');
                }
                setMessage('Product updated successfully!');
                setMessageType('success');
                formik.resetForm();
                setImagePreview("");
            } catch (error) {
                setMessage(error.message || 'Error updating product');
                setMessageType('error');
            }
        },
    });

    const UNIT_TYPES = [
        { value: 'NOS', label: 'NOS' },
        { value: 'PRS', label: 'PRS' },
        { value: 'BOX', label: 'BOX' },
        { value: 'SET', label: 'SET' },
        { value: 'SET OF 12', label: 'SET OF 12' },
        { value: 'SET OF 16', label: 'SET OF 16' },
        { value: 'SET OF 6', label: 'SET OF 6' },
        { value: 'SET OF 8', label: 'SET OF 8' },
    ];

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}product/category/add/`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                setCategories(response.data);
            } catch {
                toast.error('Error fetching categories.');
            }
        };
        fetchCategories();
    }, [token]);

    useEffect(() => {
        const fetchRacks = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_APP_KEY}rack/add/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setRackList(res?.data || []);
            } catch {
                toast.error('Failed to load rack data.');
            }
        };
        fetchRacks();
    }, [token]);

    useEffect(() => {
        const fetchFamilyData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}familys/`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (response.data && response.data.data) {
                    setFamilyOptions(response.data.data);
                } else {
                    toast.error('Unexpected family data format:');
                }
            } catch (error) {
                toast.error('Error fetching family data:');
            }
        };

        const fetchProductData = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_APP_KEY}product/update/${id}/`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                const productData = await response.json();
                if (response.ok && productData) {
                    formik.setValues({
                        name: productData.data.name || '',
                        hsn_code: productData.data.hsn_code || '',
                        family: productData.data.family.map(id => id.toString()) || [],
                        purchase_rate: productData.data.purchase_rate || '',
                        type: productData.data.type || '',
                        tax: productData.data.tax || '',
                        unit: productData.data.unit || '',
                        selling_price: productData.data.selling_price || '',
                        stock: productData.data.stock || '',
                        color: productData.data.color || '',
                        size: productData.data.size || '',
                        groupID: productData.data.groupID || '',
                        landing_cost: productData.data.landing_cost || '',
                        product_category: productData.data.product_category !== undefined && productData.data.product_category !== null
                            ? String(productData.data.product_category)
                            : "",
                        rack_details: productData.data.rack_details || [],
                        retail_price: productData.data.retail_price || ''
                    });
                    setRackDetails(productData.data.rack_details || []);
                    if (productData.data.image) {
                        setImagePreview(productData.data.image);
                    }
                } else {
                    toast.error('Error fetching product data:');
                }
            } catch (error) {
                toast.error('Error fetching product data:');
            }
        };

        fetchFamilyData();
        fetchProductData();
    }, [token, id]);


    const handleAcceptedFiles = (files) => {
        const file = files[0];
        setSelectedFiles(files);
        setImagePreview(URL.createObjectURL(file));
    };



    useEffect(() => {
        const { purchase_rate, tax } = formik.values;
        const rate = parseFloat(purchase_rate) || 0;
        const taxValue = parseFloat(tax) || 0;
        const calculatedLandingCost = rate + (rate * taxValue / 100);
        formik.setFieldValue("landing_cost", calculatedLandingCost.toFixed(2));
    }, [formik.values.purchase_rate, formik.values.tax]);

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <Breadcrumbs title="Ecommerce" breadcrumbItem="Add Product" />

                    <Row>
                        <Col xs="12">
                            <Card>
                                <CardBody>
                                    <CardTitle tag="h4">Basic Information</CardTitle>
                                    {message && (
                                        <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-danger'}`}>
                                            {message}
                                        </div>
                                    )}

                                    <Form onSubmit={formik.handleSubmit} autoComplete="off">

                                        <div className="mb-3">
                                            <Label htmlFor="formrow-name-Input">Product Name</Label>
                                            <Input
                                                type="text"
                                                name="name"
                                                className="form-control"
                                                id="formrow-name-Input"
                                                placeholder="Enter Your First Name"
                                                value={formik.values.name}
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                                invalid={
                                                    formik.touched.name && formik.errors.name ? true : false
                                                }
                                            />
                                            {
                                                formik.errors.name && formik.touched.name ? (
                                                    <FormFeedback type="invalid">{formik.errors.name}</FormFeedback>
                                                ) : null
                                            }
                                        </div>
                                        <Row>
                                            <Col md={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-hsn_code-Input">Product HSN code</Label>
                                                    <Input
                                                        type="text"
                                                        name="hsn_code"
                                                        className="form-control"
                                                        id="formrow-hsn_code-Input"
                                                        placeholder="Enter Your HSN code"
                                                        value={formik.values.hsn_code}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={
                                                            formik.touched.hsn_code && formik.errors.hsn_code ? true : false
                                                        }
                                                    />
                                                    {
                                                        formik.errors.hsn_code && formik.touched.hsn_code ? (
                                                            <FormFeedback type="invalid">{formik.errors.hsn_code}</FormFeedback>
                                                        ) : null
                                                    }
                                                </div>
                                            </Col>

                                            <Col lg={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-InputState">Type</Label>
                                                    <select
                                                        name="type"
                                                        id="formrow-InputState"
                                                        className="form-control"
                                                        value={formik.values.type}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                    >
                                                        <option value="single">single</option>
                                                        <option value="variant">variant</option>

                                                    </select>
                                                    {
                                                        formik.errors.type && formik.touched.type ? (
                                                            <span className="text-danger">{formik.errors.type}</span>
                                                        ) : null
                                                    }
                                                </div>
                                            </Col>

                                            <Col lg={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-Inputunit">Unit</Label>
                                                    <select
                                                        name="unit"
                                                        id="formrow-Inputunit"
                                                        className={`form-control ${formik.touched.unit && formik.errors.unit ? 'is-invalid' : ''
                                                            }`}
                                                        value={formik.values.unit}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                    >
                                                        <option value="" disabled>
                                                            Select a unit
                                                        </option>
                                                        {UNIT_TYPES.map((unit) => (
                                                            <option key={unit.value} value={unit.value}>
                                                                {unit.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {formik.errors.unit && formik.touched.unit && (
                                                        <FormFeedback className="d-block">{formik.errors.unit}</FormFeedback>
                                                    )}
                                                </div>
                                            </Col>

                                            <Col lg={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-Inputpurchase_rate">Purchase Rate</Label>
                                                    <Input
                                                        type="text"
                                                        name="purchase_rate"
                                                        className="form-control"
                                                        id="formrow-Inputpurchase_rate"
                                                        placeholder="Enter Your purchase_rate Code"
                                                        value={formik.values.purchase_rate}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={
                                                            formik.touched.purchase_rate && formik.errors.purchase_rate ? true : false
                                                        }
                                                    />
                                                    {
                                                        formik.errors.purchase_rate && formik.touched.purchase_rate ? (
                                                            <FormFeedback type="invalid">{formik.errors.purchase_rate}</FormFeedback>
                                                        ) : null
                                                    }
                                                </div>
                                            </Col>

                                        </Row>

                                        <Row>
                                            <Col lg={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-Inputpurchase_rate">Tax</Label>
                                                    <Input
                                                        type="number"
                                                        name="tax"
                                                        className="form-control"
                                                        id="formrow-Inputpurchase_rate"
                                                        placeholder="Enter tax"
                                                        value={formik.values.tax}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={
                                                            formik.touched.tax && formik.errors.tax ? true : false
                                                        }
                                                    />
                                                    {
                                                        formik.errors.tax && formik.touched.tax ? (
                                                            <FormFeedback type="invalid">{formik.errors.tax}</FormFeedback>
                                                        ) : null
                                                    }
                                                </div>
                                            </Col>

                                            <Col lg={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-InputCity">Landing Cost</Label>
                                                    <Input
                                                        type="number"
                                                        name="landing_cost"
                                                        className="form-control"
                                                        id="formrow-Inputtax"
                                                        placeholder="Enter Your Selling Price"
                                                        value={formik.values?.landing_cost || ''}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={
                                                            formik.touched.landing_cost && formik.errors.landing_cost ? true : false
                                                        }
                                                    />
                                                    {
                                                        formik.errors.landing_cost && formik.touched.landing_cost ? (
                                                            <FormFeedback type="invalid">{formik.errors.landing_cost}</FormFeedback>
                                                        ) : null
                                                    }
                                                </div>
                                            </Col>

                                            <Col lg={3}>

                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-InputCity">wholeSale rate</Label>
                                                    <Input
                                                        type="text"
                                                        name="selling_price"
                                                        className="form-control"
                                                        id="formrow-Inputtax"
                                                        placeholder="Enter Your Selling Price"
                                                        value={formik.values.selling_price}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={
                                                            formik.touched.selling_price && formik.errors.selling_price ? true : false
                                                        }
                                                    />
                                                    {
                                                        formik.errors.selling_price && formik.touched.selling_price ? (
                                                            <FormFeedback type="invalid">{formik.errors.selling_price}</FormFeedback>
                                                        ) : null
                                                    }
                                                </div>
                                            </Col>
                                            <Col lg={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-InputCity">Retail Price</Label>
                                                    <Input
                                                        type="text"
                                                        name="retail_price"
                                                        className="form-control"
                                                        id="formrow-Inputtax"
                                                        placeholder="Enter Your Color"
                                                        value={formik.values.retail_price}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={
                                                            formik.touched.retail_price && formik.errors.retail_price ? true : false
                                                        }
                                                    />
                                                    {
                                                        formik.errors.retail_price && formik.touched.retail_price ? (
                                                            <FormFeedback type="invalid">{formik.errors.retail_price}</FormFeedback>
                                                        ) : null
                                                    }
                                                </div>
                                            </Col>

                                        </Row>

                                        <Row>
                                            <Col lg={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-Inputpurchase_rate">Size</Label>
                                                    <Input
                                                        type="text"
                                                        name="size"
                                                        className="form-control"
                                                        id="formrow-Inputpurchase_rate"
                                                        placeholder="Enter Your Size"
                                                        value={formik.values.size}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={
                                                            formik.touched.size && formik.errors.size ? true : false
                                                        }
                                                    />
                                                    {
                                                        formik.errors.size && formik.touched.size ? (
                                                            <FormFeedback type="invalid">{formik.errors.size}</FormFeedback>
                                                        ) : null
                                                    }
                                                </div>
                                            </Col>

                                            <Col lg={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-Inputpurchase_rate">Group ID</Label>
                                                    <Input
                                                        type="text"
                                                        name="groupID"
                                                        className="form-control"
                                                        id="formrow-Inputpurchase_rate"
                                                        placeholder="Enter Your groupID"
                                                        value={formik.values.groupID}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        // readOnly
                                                        invalid={
                                                            formik.touched.groupID && formik.errors.groupID ? true : false
                                                        }
                                                    />
                                                    {
                                                        formik.errors.groupID && formik.touched.groupID ? (
                                                            <FormFeedback type="invalid">{formik.errors.groupID}</FormFeedback>
                                                        ) : null
                                                    }
                                                </div>
                                            </Col>
                                            <Col lg={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-InputCity">Stock</Label>
                                                    <Input
                                                        type="text"
                                                        name="stock"
                                                        className="form-control"
                                                        id="formrow-Inputtax"
                                                        placeholder="Enter Your  Stock"
                                                        value={formik.values.stock}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        readOnly
                                                        invalid={
                                                            formik.touched.stock && formik.errors.stock ? true : false
                                                        }
                                                    />
                                                    {
                                                        formik.errors.stock && formik.touched.stock ? (
                                                            <FormFeedback type="invalid">{formik.errors.stock}</FormFeedback>
                                                        ) : null
                                                    }
                                                </div>
                                            </Col>


                                            <Col lg={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-InputCity">Color</Label>
                                                    <Input
                                                        type="text"
                                                        name="color"
                                                        className="form-control"
                                                        id="formrow-Inputtax"
                                                        placeholder="Enter Your Color"
                                                        value={formik.values.color}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={
                                                            formik.touched.color && formik.errors.color ? true : false
                                                        }
                                                    />
                                                    {
                                                        formik.errors.color && formik.touched.color ? (
                                                            <FormFeedback type="invalid">{formik.errors.color}</FormFeedback>
                                                        ) : null
                                                    }
                                                </div>
                                            </Col>

                                        </Row>

                                        <Row>
                                            <Col lg={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-InputState">Division</Label>
                                                    <select
                                                        name="family"
                                                        id="formrow-InputState"
                                                        className="form-control"
                                                        value={formik.values.family.map(String)}
                                                        onChange={(e) => {
                                                            const options = Array.from(e.target.selectedOptions, (option) => option.value);
                                                            formik.setFieldValue('family', options);
                                                        }}
                                                        onBlur={formik.handleBlur}
                                                        multiple
                                                    >
                                                        {families.map((family) => (
                                                            <option key={family.id} value={family.id.toString()}>
                                                                {family.name}
                                                            </option>
                                                        ))}
                                                    </select>


                                                    {/* Validation Error Message */}
                                                    {formik.errors.family && formik.touched.family ? (
                                                        <span className="text-danger">{formik.errors.family}</span>
                                                    ) : null}
                                                </div>
                                            </Col>
                                            <Col lg={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-InputImage">Upload Image (File size should be less than 100kb)</Label>
                                                    <Input
                                                        type="file"
                                                        name="image"
                                                        className={`form-control ${formik.touched.image && formik.errors.image ? 'is-invalid' : ''}`}
                                                        id="formrow-InputImage"
                                                        onChange={(event) => {
                                                            const file = event.currentTarget.files[0];

                                                            if (file) {
                                                                formik.setFieldValue("image", file);

                                                                // Ensure FileReader reads the image correctly
                                                                const reader = new FileReader();
                                                                reader.onload = () => {
                                                                    setImagePreview(reader.result); // Set preview image
                                                                };
                                                                reader.onerror = (error) => {
                                                                    toast.error("Error reading file:");
                                                                };
                                                                reader.readAsDataURL(file);
                                                            }
                                                        }}
                                                        onBlur={formik.handleBlur}
                                                        accept="image/*"
                                                    />
                                                    {formik.errors.image && formik.touched.image && (
                                                        <FormFeedback className="d-block">{formik.errors.image}</FormFeedback>
                                                    )}
                                                </div>

                                                {/* Display Image Preview */}
                                                {imagePreview && (
                                                    <div className="image-preview mt-2">
                                                        <img
                                                            src={imagePreview}
                                                            alt="Preview"
                                                            style={{ width: '50%', height: 'auto', borderRadius: '5px', border: '1px solid #ddd', padding: '5px' }}
                                                        />
                                                    </div>
                                                )}

                                            </Col>
                                            <Col lg={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-category-Input">Category</Label>
                                                    <select
                                                        name="product_category"
                                                        className="form-control"
                                                        value={formik.values.product_category}
                                                        onChange={formik.handleChange}
                                                    >
                                                        <option value="">Choose...</option>
                                                        {categories.map(cat => (
                                                            <option key={cat.id} value={String(cat.id)}>
                                                                {cat.category_name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {formik.touched.product_category && formik.errors.product_category && (
                                                        <FormFeedback className="d-block">{formik.errors.product_category}</FormFeedback>
                                                    )}
                                                </div>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col md={12}>
                                                <Label>Rack Details</Label>
                                                {rackDetails.map((rack, idx) => {
                                                    const racks = rackList; // (optionally filter by warehouse if needed)
                                                    const getColumnsForRack = (rackId) => {
                                                        const found = rackList.find(r => String(r.id) === String(rackId));
                                                        return found ? found.column_names : [];
                                                    };
                                                    const columns = getColumnsForRack(rack.rack_id);

                                                    return (
                                                        <Row key={idx} className="align-items-end mb-2">
                                                            <Col md={3}>
                                                                <select
                                                                    className="form-control"
                                                                    value={rack.rack_id}
                                                                    onChange={e => {
                                                                        const arr = [...rackDetails];
                                                                        arr[idx].rack_id = e.target.value;
                                                                        arr[idx].column_name = '';
                                                                        setRackDetails(arr);
                                                                    }}
                                                                    required
                                                                >
                                                                    <option value="">Select Rack</option>
                                                                    {racks.map(r => (
                                                                        <option key={r.id} value={r.id}>{r.rack_name}</option>
                                                                    ))}
                                                                </select>
                                                            </Col>
                                                            <Col md={3}>
                                                                <select
                                                                    className="form-control"
                                                                    value={rack.column_name}
                                                                    onChange={e => {
                                                                        const arr = [...rackDetails];
                                                                        arr[idx].column_name = e.target.value;
                                                                        setRackDetails(arr);
                                                                    }}
                                                                    required
                                                                    disabled={!rack.rack_id}
                                                                >
                                                                    <option value="">Select Column</option>
                                                                    {columns.map((col, colIdx) => (
                                                                        <option key={colIdx} value={col}>{col}</option>
                                                                    ))}
                                                                </select>
                                                            </Col>
                                                            <Col md={3}>
                                                                <Input
                                                                    type="select"
                                                                    value={rack.usability}
                                                                    onChange={e => {
                                                                        const arr = [...rackDetails];
                                                                        arr[idx].usability = e.target.value;
                                                                        setRackDetails(arr);
                                                                    }}
                                                                    required
                                                                >
                                                                    <option value="">Usability</option>
                                                                    <option value="usable">Usable</option>
                                                                    <option value="damaged">Damaged</option>
                                                                    <option value="partially_damaged">Partially Damaged</option>
                                                                </Input>
                                                            </Col>
                                                            <Col md={2}>
                                                                <Input
                                                                    type="number"
                                                                    placeholder="Rack Stock"
                                                                    value={rack.rack_stock}
                                                                    onChange={e => {
                                                                        const arr = [...rackDetails];
                                                                        arr[idx].rack_stock = e.target.value;
                                                                        setRackDetails(arr);
                                                                    }}
                                                                    min={0}
                                                                    required
                                                                />
                                                            </Col>
                                                            <Col md={1}>
                                                                <Button
                                                                    color="danger"
                                                                    size="sm"
                                                                    onClick={() => setRackDetails(rackDetails.filter((_, i) => i !== idx))}
                                                                >
                                                                    Remove
                                                                </Button>
                                                            </Col>
                                                        </Row>
                                                    );
                                                })}
                                                <Button
                                                    color="info"
                                                    size="sm"
                                                    className="mb-2"
                                                    onClick={() => setRackDetails([
                                                        ...rackDetails,
                                                        { rack_id: '', column_name: '', usability: '', rack_stock: '' }
                                                    ])}
                                                >
                                                    Add Rack
                                                </Button>
                                            </Col>
                                        </Row>
                                        <div className="d-flex flex-wrap gap-2">
                                            <Button type="submit" color="primary">Save Changes</Button>
                                            <Button type="button" color="secondary" onClick={() => formik.resetForm()}>Cancel</Button>
                                        </div>
                                    </Form>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    );
}

export default EcommerenceAddProduct;
