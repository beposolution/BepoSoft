import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, Col, Container, Row, CardBody, CardTitle, Label, Form, Input, FormFeedback } from "reactstrap";
import Select from 'react-select';
import * as Yup from 'yup';
import { useFormik } from "formik";
import { useParams } from "react-router-dom";


//Import Breadcrumb
import Breadcrumbs from "../../components/Common/Breadcrumb";

const FormLayouts = () => {

    //meta title
    document.title = "Form Layouts | Skote - Vite React Admin & Dashboard Template";
    // State for states and family data
    const [families, setFamilies] = useState([]);
    const [selectedFamilies, setSelectedFamilies] = useState([]);
    const [familyOptions, setFamilyOptions] = useState([]);
    const [product, setProduct] = useState([]);
    const [imagePreview, setImagePreview] = useState(null);

    const { id } = useParams();



    const token = localStorage.getItem('token')
    const created_user = localStorage.getItem('name')


    const UNIT_TYPES = [
        { value: 'BOX', label: 'BOX' },
        { value: 'NOS', label: 'NOS' },
        { value: 'PRS', label: 'PRS' },
        { value: 'SET', label: 'SET' },
        { value: 'SET OF 12', label: 'SET OF 12' },
        { value: 'SET OF 16', label: 'SET OF 16' },
        { value: 'SET OF 6', label: 'SET OF 6' },
        { value: 'SET OF 8', label: 'SET OF 8' },
    ];

    useEffect(() => {
        const fetchFamilies = async () => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_APP_KEY}familys/`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                const familyData = response.data.data;
                const options = familyData.map((family) => ({
                    value: family.id,
                    label: family.name,
                }));
                setFamilies(familyData);
                setFamilyOptions(options); // This will not cause re-renders now
            } catch (error) {
                console.error("Error fetching family data:", error);
            }
        };

        if (token) {
            fetchFamilies();
        }
    }, [token]); // Only fetch families when the token changes

    useEffect(() => {
        const fetchProductData = async () => {
            if (!id) {
                console.error("No ID found in the URL.");
                return;
            }

            try {
                const response = await fetch(
                    `${import.meta.env.VITE_APP_KEY}product/update/${id}/`,
                    {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                setProduct(data.data || data);

                if (data.data?.family) {
                    // Map the product's family IDs to react-select options
                    const selectedFamilies = data.data.family.map((familyId) =>
                        familyOptions.find((option) => option.value === familyId)
                    );
                    setSelectedFamilies(selectedFamilies.filter(Boolean)); // Filter out unmatched IDs
                }
            } catch (error) {
                console.error("Error fetching product data:", error.message);
            }
        };

        if (token && id) {
            fetchProductData();
        }
    }, [token, id]); // Only depends on token and id


    const handleFamilyChange = (selectedOptions) => {
        setSelectedFamilies(selectedOptions || []);
        formik.setFieldValue(
            "family",
            selectedOptions ? selectedOptions.map((option) => option.value) : []
        );
    };

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            name: product?.name || "",
            hsn_code: product?.hsn_code || "",
            family: product?.family || [],
            unit: product?.unit || "",
            state: product?.state || "",
            purchase_rate: product?.purchase_rate || "",
            tax: product?.tax || "",
            selling_price: product?.selling_price || "",
            stock: product?.stock || "",
            color: product?.color || "",
            size: product?.size || "",
            groupID: product?.groupID || "",
            image: product?.image || "",
            check: product?.check || "",
        },
        validationSchema: Yup.object({
            name: Yup.string().required("This field is required"),
            hsn_code: Yup.string().required("This field is required"),
            family: Yup.array()
                .min(1, "Please select at least one family")
                .required("This field is required"),
            unit: Yup.string().required("This field is required"),
            state: Yup.string().required("This field is required"),
            purchase_rate: Yup.number()
                .typeError("Purchase rate must be a number")
                .required("This field is required"),
            tax: Yup.number()
                .typeError("Tax must be a number")
                .required("This field is required"),
            selling_price: Yup.string().required("This field is required"),
            stock: Yup.string().required("This field is required"),
            groupID: Yup.string().required("This field is required"),
            image: Yup.string().required("This field is required"),
            check: Yup.string().required("This field is required"),
        }),
        onSubmit: async (values) => {
            const formData = new FormData();
            Object.keys(values).forEach(key => {
                formData.append(key, values[key]);
            });

            try {
                const response = await axios.put(
                    `${import.meta.env.VITE_APP_KEY}product/update/${id}/`,
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "multipart/form-data",
                        },
                    }
                );
                console.log("Update successful:", response.data);
            } catch (error) {
                console.error("Error updating product:", error.response ? error.response.data : error.message);
            }
        }
    });




    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid={true}>
                    <Breadcrumbs title="Forms" breadcrumbItem="Form Layouts" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="mb-4">Form Grid Layout</CardTitle>

                                    <Form onSubmit={(e) => {
                                        console.log("Form submitted"); // Debugging log
                                        formik.handleSubmit(e);
                                    }}>
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
                                            <Col md={4}>
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
                                            {/* <Col lg={4}>
                                                <div className="mb-3">
                                                    <label htmlFor="familySelect" className="control-label">
                                                        Family
                                                    </label>
                                                    <Select
                                                        id="familySelect"
                                                        name="family"
                                                        isMulti
                                                        value={selectedFamilies}
                                                        onChange={handleFamilyChange}
                                                        options={familyOptions}
                                                        className={`select2-selection ${formik.errors.families && formik.touched.families ? 'is-invalid' : ''}`}
                                                    />
                                                    {formik.errors.families && formik.touched.families && (
                                                        <FormFeedback className="d-block">{formik.errors.families}</FormFeedback>
                                                    )}

                                                </div>
                                            </Col> */}

                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-InputState">Type</Label>
                                                    <select
                                                        name="family"
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
                                        </Row>

                                        <Row>
                                            <Col lg={4}>
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

                                            <Col lg={4}>
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

                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-InputImage">Upload Image</Label>
                                                    <Input
                                                        type="file"
                                                        name="image"
                                                        className={`form-control ${formik.touched.image && formik.errors.image ? 'is-invalid' : ''}`}
                                                        id="formrow-InputImage"
                                                        onChange={(event) => {
                                                            const file = event.currentTarget.files[0];
                                                            if (file) {
                                                                formik.setFieldValue("image", file);
                                                                const reader = new FileReader();
                                                                reader.onloadend = () => {
                                                                    setImagePreview(reader.result);
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
                                                {imagePreview && (
                                                    <div className="image-preview">
                                                        <img src={imagePreview} alt="Preview" style={{ width: '100%', height: 'auto' }} />
                                                    </div>
                                                )}
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-InputCity">Tax</Label>
                                                    <Input
                                                        type="text"
                                                        name="tax"
                                                        className="form-control"
                                                        id="formrow-Inputtax"
                                                        placeholder="Enter Your Living tax"
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
                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-InputCity">Selling Price</Label>
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

                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-Inputpurchase_rate">Created User</Label>
                                                    <Input
                                                        type="text"
                                                        className="form-control"
                                                        value={created_user}
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
                                        </Row>

                                        <div className="mb-3">
                                            <div className="form-check">
                                                <Input
                                                    type="checkbox"
                                                    className="form-check-Input"
                                                    id="formrow-customCheck"
                                                    name="check"
                                                    value={formik.values.check}
                                                    onChange={formik.handleChange}
                                                    onBlur={formik.handleBlur}
                                                    invalid={
                                                        formik.touched.check && formik.errors.check ? true : false
                                                    }
                                                />
                                                <Label
                                                    className="form-check-Label"
                                                    htmlFor="formrow-customCheck"
                                                >
                                                    Check me out
                                                </Label>
                                            </div>
                                            {
                                                formik.errors.check && formik.touched.check ? (
                                                    <FormFeedback type="invalid">{formik.errors.check}</FormFeedback>
                                                ) : null
                                            }
                                        </div>
                                        <div>
                                            <button type="submit" className="btn btn-primary w-md">
                                                Submit
                                            </button>
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
};

export default FormLayouts;
