import React, { useState, useEffect } from "react";
import { Card, Col, Container, Row, CardBody, CardTitle, Label, Form, Input, FormFeedback, Alert } from "reactstrap";
import * as Yup from 'yup';
import { useFormik } from "formik";
import axios from 'axios'; // Ensure axios is imported

// Import Breadcrumb
import Breadcrumbs from "../../components/Common/Breadcrumb";

const FormLayouts = () => {
    document.title = "Beposoft | Add Products";

    const [family, setFamily] = useState([]);
    const [successMessage, setSuccessMessage] = useState(""); // State for success message
    const [errorMessage, setErrorMessage] = useState("");
    const [warehouseDetails, setWarehouseDetails] = useState([]);
    const token = localStorage.getItem('token');
    const [isLoading, setIsLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState("");

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

    const TYPES = [
        { value: 'single', label: 'Single' },
        { value: 'variant', label: 'variant' },
    ];

    const formik = useFormik({
        initialValues: {
            name: "",
            hsn_code: "",
            purchase_rate: "",
            tax: "",
            family: [], // Now an array for multiple selections
            unit: "",
            selling_price: "",
            type: "",
            groupID: "",
            stock: "",
            warehouse: "",
            retail_price: "",
            landing_cost: "",
            purchase_type: "International",
            image: null,
        },
        validationSchema: Yup.object({
            name: Yup.string().required("This field is required"),
            hsn_code: Yup.string().required("This field is required"),
            purchase_rate: Yup.string().required("This field is required"),
            tax: Yup.string().required("This field is required"),
            family: Yup.array().min(1, "At least one family is required").required("This field is required"), // Updated validation for multiple selection
            unit: Yup.string().required("This field is required"),
            selling_price: Yup.string().required("This field is required"),
            type: Yup.string().required("This field is required"),
            groupID: Yup.string().required("This field is required"),
            stock: Yup.string().required("This field is required"),
            warehouse: Yup.string().required("This field is required"),
        }),

        onSubmit: async (values, { resetForm }) => {
            const formData = new FormData();

            Object.entries(values).forEach(([key, value]) => {
                if (key === 'family') {
                    value.forEach(item => formData.append('family', item));
                } else if (key === 'image' && value) {
                    formData.append('image', value);
                } else {
                    formData.append(key, value);
                }
            });

            setIsLoading(true);

            try {
                const response = await axios.post(`${import.meta.env.VITE_APP_KEY}add/product/`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${token}`,
                    },
                });

                setSuccessMessage("Form submitted successfully.");
                setErrorMessage('');
                formik.resetForm();
            } catch (error) {
                console.error('Error submitting form:', error);
                setErrorMessage("Error submitting form. Please try again.");
                setSuccessMessage('');
            } finally {
                setIsLoading(false);
            }
        }

    });

    useEffect(() => {
        const fetchProductFamilies = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}familys/`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                setFamily(response.data.data);
                console.log(response.data.data)
            } catch (error) {
                console.error('Error fetching product families:', error);
            }
        };

        fetchProductFamilies();
    }, [token]);

    useEffect(() => {
        const fetchwarehosue = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}warehouse/add/`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                setWarehouseDetails(response.data);
                console.log(response.data)
            } catch (error) {
                console.error('Error fetching warehosue:', error);
            }
        };

        fetchwarehosue();
    }, [token]);

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
                <Container fluid={true}>
                    <Breadcrumbs title="Forms" breadcrumbItem="Form Layouts" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="mb-4">Purchase Form</CardTitle>

                                    {/* Show success or error messages */}
                                    {successMessage && <Alert color="success">{successMessage}</Alert>}
                                    {errorMessage && <Alert color="danger">{errorMessage}</Alert>}
                                    <Form onSubmit={formik.handleSubmit}>
                                        <Row>
                                            <Col md={8}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-name-Input">Name</Label>
                                                    <Input
                                                        type="text"
                                                        name="name"
                                                        className="form-control"
                                                        id="formrow-name-Input"
                                                        placeholder="Enter Name"
                                                        value={formik.values.name}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.name && formik.errors.name}
                                                    />
                                                    {formik.errors.name && formik.touched.name && (
                                                        <FormFeedback>{formik.errors.name}</FormFeedback>
                                                    )}
                                                </div>
                                            </Col>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-name-Input">Purchase Type</Label>
                                                    <select
                                                        name="purchase_type"
                                                        id="formrow-family-Input"
                                                        className="form-control"
                                                        value={formik.values.purchase_type}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.purchase_type && formik.errors.purchase_type}
                                                    >
                                                        <option value="">international</option>
                                                        <option value="Local">Local Purchase</option>
                                                        <option value="International">International Purchase</option>
                                                    </select>
                                                    {formik.errors.name && formik.purchase_type && (
                                                        <FormFeedback>{formik.errors.purchase_type}</FormFeedback>
                                                    )}
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-hsn_code-Input">HSN CODE</Label>
                                                    <Input
                                                        type="text"
                                                        name="hsn_code"
                                                        className="form-control"
                                                        id="formrow-hsn_code-Input"
                                                        placeholder="Enter HSN CODE"
                                                        value={formik.values.hsn_code}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.hsn_code && formik.errors.hsn_code}
                                                    />
                                                    {formik.errors.hsn_code && formik.touched.hsn_code && (
                                                        <FormFeedback>{formik.errors.hsn_code}</FormFeedback>
                                                    )}
                                                </div>
                                            </Col>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-purchase_rate-Input">PURCHASE RATE</Label>
                                                    <Input
                                                        type="text"
                                                        name="purchase_rate"
                                                        className="form-control"
                                                        id="formrow-purchase_rate-Input"
                                                        placeholder="Enter purchase rate"
                                                        value={formik.values.purchase_rate}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.purchase_rate && formik.errors.purchase_rate}
                                                    />
                                                    {formik.errors.purchase_rate && formik.touched.purchase_rate && (
                                                        <FormFeedback>{formik.errors.purchase_rate}</FormFeedback>
                                                    )}
                                                </div>
                                            </Col>

                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-tax-Input">Tax</Label>
                                                    <Input
                                                        type="text"
                                                        name="tax"
                                                        className="form-control"
                                                        id="formrow-tax-Input"
                                                        placeholder="Enter tax"
                                                        value={formik.values.tax}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.tax && formik.errors.tax}
                                                    />
                                                    {formik.errors.tax && formik.touched.tax && (
                                                        <FormFeedback>{formik.errors.tax}</FormFeedback>
                                                    )}
                                                </div>
                                            </Col>


                                        </Row>

                                        <Row>
                                            <Col lg={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-selling_price-Input">landing cost</Label>
                                                    <Input
                                                        type="text"
                                                        name="landing_cost"
                                                        className="form-control"
                                                        id="formrow-selling_price-Input"
                                                        value={formik.values.landing_cost}
                                                        invalid={formik.touched.landing_cost && formik.errors.landing_cost}
                                                    />
                                                    {formik.errors.landing_cost && formik.touched.landing_cost && (
                                                        <FormFeedback>{formik.errors.landing_cost}</FormFeedback>
                                                    )}
                                                </div>
                                            </Col>

                                            <Col md={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-unit-Input">choose warehouse</Label>
                                                    <select
                                                        name="warehouse"
                                                        id="formrow-unit-Input"
                                                        className="form-control"
                                                        value={formik.values.warehouse}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.warehouse && formik.errors.warehouse}
                                                    >
                                                        <option value="">Choose...</option>
                                                        {warehouseDetails.map((unit) => (
                                                            <option key={unit.id} value={unit.id}>{unit.name}</option>
                                                        ))}
                                                    </select>
                                                    {formik.errors.unit && formik.touched.unit && (
                                                        <FormFeedback>{formik.errors.unit}</FormFeedback>
                                                    )}
                                                </div>
                                            </Col>
                                            <Col lg={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-family-Input">Division</Label>
                                                    <select
                                                        name="family"
                                                        id="formrow-family-Input"
                                                        className="form-control"
                                                        value={formik.values.family}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        multiple
                                                        invalid={formik.touched.family && formik.errors.family}
                                                    >
                                                        <option value="">Choose...</option>
                                                        {family.map((item) => (
                                                            <option key={item.id} value={item.id}>{item.name}</option>
                                                        ))}
                                                    </select>
                                                    {formik.errors.family && formik.touched.family && (
                                                        <FormFeedback>{formik.errors.family}</FormFeedback>
                                                    )}
                                                </div>
                                            </Col>
                                            <Col lg={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-unit-Input">Unit</Label>
                                                    <select
                                                        name="unit"
                                                        id="formrow-unit-Input"
                                                        className="form-control"
                                                        value={formik.values.unit}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.unit && formik.errors.unit}
                                                    >
                                                        <option value="">Choose...</option>
                                                        {UNIT_TYPES.map((unit) => (
                                                            <option key={unit.value} value={unit.value}>{unit.label}</option>
                                                        ))}
                                                    </select>
                                                    {formik.errors.unit && formik.touched.unit && (
                                                        <FormFeedback>{formik.errors.unit}</FormFeedback>
                                                    )}
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col lg={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-selling_price-Input">Wholesale Rate</Label>
                                                    <Input
                                                        type="text"
                                                        name="selling_price"
                                                        className="form-control"
                                                        id="formrow-selling_price-Input"
                                                        placeholder="Enter Wholesale Rate"
                                                        value={formik.values.selling_price}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.selling_price && formik.errors.selling_price}
                                                    />
                                                    {formik.errors.selling_price && formik.touched.selling_price && (
                                                        <FormFeedback>{formik.errors.selling_price}</FormFeedback>
                                                    )}
                                                </div>
                                            </Col>
                                            <Col lg={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-selling_price-Input">retail Rate</Label>
                                                    <Input
                                                        type="text"
                                                        name="retail_price"
                                                        className="form-control"
                                                        id="formrow-selling_price-Input"
                                                        placeholder="Enter Retail Rate"
                                                        value={formik.values.retail_price}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.retail_price && formik.errors.retail_price}
                                                    />
                                                    {formik.errors.selling_price && formik.touched.selling_price && (
                                                        <FormFeedback>{formik.errors.retail_price}</FormFeedback>
                                                    )}
                                                </div>
                                            </Col>
                                            <Col lg={2}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-product_type-Input">Product Type</Label>
                                                    <Input
                                                        type="select"
                                                        name="type"
                                                        id="formrow-product_type-Input"
                                                        className="form-control"
                                                        value={formik.values.type}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.type && formik.errors.type}
                                                    >
                                                        <option value="">Choose...</option>
                                                        {TYPES.map((type) => (
                                                            <option key={type.value} value={type.value}>{type.value}</option>
                                                        ))}
                                                    </Input>
                                                    {formik.errors.type && formik.touched.type && (
                                                        <FormFeedback>{formik.errors.type}</FormFeedback>
                                                    )}
                                                </div>
                                            </Col>


                                            <Col lg={2}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-groupID-Input">Group ID</Label>
                                                    <Input
                                                        type="text"
                                                        name="groupID"
                                                        className="form-control"
                                                        id="formrow-groupID-Input"
                                                        placeholder="Enter group ID"
                                                        value={formik.values.groupID}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.groupID && formik.errors.groupID}
                                                    />
                                                    {formik.errors.groupID && formik.touched.groupID && (
                                                        <FormFeedback>{formik.errors.groupID}</FormFeedback>
                                                    )}
                                                </div>
                                            </Col>
                                            <Col lg={2}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-groupID-Input">Stock</Label>
                                                    <Input
                                                        type="text"
                                                        name="stock"
                                                        className="form-control"
                                                        id="formrow-stock-Input"
                                                        placeholder="Enter stock"
                                                        value={formik.values.stock}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.stock && formik.errors.stock}
                                                    />
                                                    {formik.errors.stock && formik.touched.stock && (
                                                        <FormFeedback>{formik.errors.stock}</FormFeedback>
                                                    )}
                                                </div>
                                            </Col>
                                        </Row>
                                        <Row>
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
                                                                    console.error("Error reading file:", error);
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
                                        </Row>

                                        <button type="submit" className="btn btn-primary w-md">
                                            {isLoading ? "submiting..." : "Submit"}
                                        </button>
                                    </Form>
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
