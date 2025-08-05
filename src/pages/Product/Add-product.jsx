import React, { useState, useEffect } from "react";
import { Card, Col, Container, Row, CardBody, CardTitle, Label, Form, Input, FormFeedback, Alert } from "reactstrap";
import * as Yup from 'yup';
import { useFormik } from "formik";
import axios from 'axios';
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Select from "react-select";

const FormLayouts = () => {
    document.title = "Beposoft | Add Products";

    const [family, setFamily] = useState([]);
    const [successMessage, setSuccessMessage] = useState(""); // State for success message
    const [errorMessage, setErrorMessage] = useState("");
    const [warehouseDetails, setWarehouseDetails] = useState([]);
    const token = localStorage.getItem('token');
    const [isLoading, setIsLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState("");
    const [categories, setCategories] = useState([]);
    const [rackList, setRackList] = useState([]);
    const [rackDetails, setRackDetails] = useState([]);

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
            product_category: "",
            warehouse: "",
            duty_charge: "",
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
            family: Yup.array().min(1, "At least one Division is required").required("This field is required"),
            unit: Yup.string().required("This field is required"),
            selling_price: Yup.string().required("This field is required"),
            type: Yup.string().required("This field is required"),
            groupID: Yup.string().required("This field is required"),
            warehouse: Yup.string().required("This field is required"),
            duty_charge: Yup.string().required("This field is required"),
            product_category: Yup.string().required("This field is required"),
        }),

        onSubmit: async (values, { resetForm }) => {
            const formData = new FormData();

            // Clean up rackDetails: Remove empty, parse numbers
            const cleanRackDetails = rackDetails
                .filter(r => r.rack_id && r.column_name && r.usability && r.rack_stock)
                .map(r => ({
                    rack_id: Number(r.rack_id),
                    column_name: r.column_name,
                    usability: r.usability,
                    rack_stock: Number(r.rack_stock)
                }));

            // Attach fields to FormData
            Object.entries(values).forEach(([key, value]) => {
                if (key === 'family') {
                    value.forEach(item => formData.append('family', item));
                } else if (key === 'image' && value) {
                    formData.append('image', value);
                } else if (key === 'warehouse' || key === 'product_category') {
                    formData.append(key, Number(value)); // Ensure numeric
                } else {
                    formData.append(key, value);
                }
            });

            // Attach rack_details as JSON string
            formData.append('rack_details', JSON.stringify(cleanRackDetails));

            setIsLoading(true);

            try {
                const response = await axios.post(
                    `${import.meta.env.VITE_APP_KEY}add/product/`,
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                            'Authorization': `Bearer ${token}`,
                        },
                    }
                );
                setSuccessMessage("Form submitted successfully.");
                setErrorMessage('');
                resetForm();
                setRackDetails([]); // Clear rack rows on success
            } catch (error) {
                toast.error('Error submitting form:');
                setErrorMessage("Error submitting form. Please try again.");
                setSuccessMessage('');
            } finally {
                setIsLoading(false);
            }
        }
    });

    const viewRacks = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_APP_KEY}rack/add/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setRackList(res?.data || []);
        } catch (error) {
            toast.error("Failed to load rack data.");
        }
    };

    useEffect(() => {
        viewRacks();
    }, []);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}product/category/add/`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                setCategories(response.data); // response.data should be an array
            } catch (error) {
                toast.error('Error fetching categories.');
            }
        };
        fetchCategories();
    }, [token]);

    const categoryOptions = categories.map(cat => ({
        value: cat.id,
        label: cat.category_name,
    }));

    useEffect(() => {
        const fetchProductFamilies = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}familys/`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                setFamily(response.data.data);
            } catch (error) {
                toast.error('Error fetching product families:');
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
            } catch (error) {
                toast.error('Error fetching warehosue:');
            }
        };

        fetchwarehosue();
    }, [token]);

    useEffect(() => {
        const { purchase_rate, duty_charge } = formik.values;
        const rate = parseFloat(purchase_rate) || 0;
        const dutyPercent = parseFloat(duty_charge) || 0;

        const calculatedLandingCost = rate + (rate * dutyPercent / 100);
        formik.setFieldValue("landing_cost", calculatedLandingCost.toFixed(2));
    }, [formik.values.purchase_rate, formik.values.duty_charge]);

    const totalWithTax = (() => {
        const landingCost = parseFloat(formik.values.landing_cost) || 0;
        const taxPercent = parseFloat(formik.values.tax) || 0;
        return (landingCost + (landingCost * taxPercent / 100)).toFixed(2);
    })();

    // Get racks for the selected warehouse
    const getRacksForWarehouse = (warehouseId) =>
        rackList.filter(rack => String(rack.warehouse) === String(warehouseId));

    // Get columns for a rack id
    const getColumnsForRack = (rackId) => {
        const rack = rackList.find(r => String(r.id) === String(rackId));
        return rack ? rack.column_names : [];
    };

    // When Add Rack is clicked
    const handleAddRack = () => {
        // Only allow adding if a warehouse is selected
        if (!formik.values.warehouse) {
            toast.error("Please select a warehouse before adding a rack.");
            return;
        }
        setRackDetails([
            ...rackDetails,
            {
                rack_id: '',
                column_name: '',
                usability: '',
                rack_stock: '',
            }
        ]);
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid={true}>
                    <Breadcrumbs title="Forms" breadcrumbItem="ADD PRODUCTS" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    {/* <CardTitle className="mb-4">Purchase Form</CardTitle> */}

                                    {/* Show success or error messages */}
                                    {successMessage && <Alert color="success">{successMessage}</Alert>}
                                    {errorMessage && <Alert color="danger">{errorMessage}</Alert>}
                                    <Form onSubmit={formik.handleSubmit}>
                                        <Row>
                                            <Col md={8}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-name-Input">NAME</Label>
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
                                                    <Label htmlFor="formrow-name-Input">PURCHASE TYPE</Label>
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
                                            <Col md={3}>
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
                                            <Col md={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-purchase_rate-Input">PURCHASE RATE</Label>
                                                    <Input
                                                        type="number"
                                                        name="purchase_rate"
                                                        className="form-control"
                                                        id="formrow-purchase_rate-Input"
                                                        placeholder="Enter Purchase Rate"
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
                                            <Col md={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-duty_charge-Input">DUTY CHARGE(%)</Label>
                                                    <Input
                                                        type="number"
                                                        name="duty_charge"
                                                        className="form-control"
                                                        id="formrow-duty_charge-Input"
                                                        placeholder="Enter Duty Charge"
                                                        value={formik.values.duty_charge}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.duty_charge && formik.errors.duty_charge}
                                                    />
                                                    {formik.errors.duty_charge && formik.touched.duty_charge && (
                                                        <FormFeedback>{formik.errors.duty_charge}</FormFeedback>
                                                    )}
                                                </div>
                                            </Col>
                                            <Col lg={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-selling_price-Input">LANDING COST</Label>
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
                                        </Row>

                                        <Row>
                                            <Col lg={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-tax-Input">TAX (%)</Label>
                                                    <Input
                                                        type="number"
                                                        name="tax"
                                                        className="form-control"
                                                        id="formrow-tax-Input"
                                                        placeholder="Enter Tax"
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

                                            <Col md={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-unit-Input">CHOOSE WAREHOUSE</Label>
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
                                                    <Label htmlFor="formrow-family-Input">DIVISION</Label>
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
                                                    <Label htmlFor="formrow-unit-Input">UNIT</Label>
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
                                            <Col md={3}>
                                                <div className="mb-3">
                                                    <Label>TOTAL (Landing + Tax)</Label>
                                                    <Input
                                                        type="text"
                                                        className="form-control"
                                                        value={totalWithTax}
                                                        readOnly
                                                    />
                                                </div>
                                            </Col>

                                            <Col lg={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-selling_price-Input">WHOLESALE RATE</Label>
                                                    <Input
                                                        type="number"
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
                                                    <Label htmlFor="formrow-selling_price-Input">RETAIL RATE</Label>
                                                    <Input
                                                        type="number"
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
                                            <Col lg={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-product_type-Input">PRODUCT TYPE</Label>
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


                                            <Col lg={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-groupID-Input">GROUP ID</Label>
                                                    <Input
                                                        type="text"
                                                        name="groupID"
                                                        className="form-control"
                                                        id="formrow-groupID-Input"
                                                        placeholder="Enter Group ID"
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
                                            {/* <Col lg={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-groupID-Input">STOCK</Label>
                                                    <Input
                                                        type="text"
                                                        name="stock"
                                                        className="form-control"
                                                        id="formrow-stock-Input"
                                                        placeholder="Enter Stock"
                                                        value={formik.values.stock}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.stock && formik.errors.stock}
                                                    />
                                                    {formik.errors.stock && formik.touched.stock && (
                                                        <FormFeedback>{formik.errors.stock}</FormFeedback>
                                                    )}
                                                </div>
                                            </Col> */}
                                            <Col lg={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-category-Input">CATEGORY</Label>
                                                    <Select
                                                        name="product_category"
                                                        id="formrow-category-Input"
                                                        options={categoryOptions}
                                                        value={categoryOptions.find(option => option.value === formik.values.product_category) || null}
                                                        onChange={option => formik.setFieldValue("product_category", option ? option.value : "")}
                                                        onBlur={formik.handleBlur}
                                                        placeholder="Search or choose category"
                                                        isClearable
                                                    />
                                                    {formik.touched.product_category && formik.errors.product_category && (
                                                        <div className="text-danger mt-1">{formik.errors.product_category}</div>
                                                    )}
                                                </div>
                                            </Col>
                                            <Col lg={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-InputImage">UPLOAD IMAGE (File size should be less than 100kb)</Label>
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
                                        </Row>
                                        <Row>
                                            <Col md={12}>
                                                <Label>Rack Details</Label>
                                                {rackDetails.map((rack, idx) => {
                                                    // Filter racks for the selected warehouse
                                                    const racks = getRacksForWarehouse(formik.values.warehouse);
                                                    // Get columns for selected rack
                                                    const columns = getColumnsForRack(rack.rack_id);

                                                    return (
                                                        <Row key={idx} className="align-items-end mb-2">
                                                            <Col md={3}>
                                                                {/* Rack select */}
                                                                <select
                                                                    className="form-control"
                                                                    value={rack.rack_id}
                                                                    onChange={e => {
                                                                        const arr = [...rackDetails];
                                                                        arr[idx].rack_id = e.target.value;
                                                                        arr[idx].column_name = ''; // reset column name if rack changes
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
                                                                {/* Column select */}
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
                                                                {/* Usability */}
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
                                                                {/* Rack Stock */}
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
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-danger btn-sm"
                                                                    onClick={() => setRackDetails(rackDetails.filter((_, i) => i !== idx))}
                                                                >
                                                                    Remove
                                                                </button>
                                                            </Col>
                                                        </Row>
                                                    );
                                                })}
                                                <button
                                                    type="button"
                                                    className="btn btn-info btn-sm mb-2"
                                                    onClick={handleAddRack}
                                                >
                                                    Add Rack
                                                </button>
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
