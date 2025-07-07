import axios from 'axios';
import {
    Card, Col, Container, Row, CardBody, CardTitle, Label, Form, Input, FormFeedback,
} from "reactstrap";
import * as Yup from 'yup';
import { useFormik } from "formik";
import React, { useState, useEffect } from "react";

// Import Breadcrumb
import Breadcrumbs from "../../components/Common/Breadcrumb";

const FormLayouts = () => {
    // Meta title
    document.title = "Customer Registration | Beposoft";

    // State declarations
    const [department, setDepartment] = useState([]);
    const [staffs, setStaffs] = useState([]);
    const [states, setStates] = useState([]);
    const [selectedStates, setSelectedStates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const token = localStorage.getItem("token"); // Token fetching

    // Formik setup
    const formik = useFormik({
        initialValues: {
            name: "",
            gst: "",
            email: "",
            address: "",
            zip_code: "",
            state: "",
            phone: "",
            alt_phone: "",
            manager: "",
            city: "",
            commend: "",
        },
        validationSchema: Yup.object({
            name: Yup.string().required("This field is required"),
            email: Yup.string().email("Invalid email format"),
            phone: Yup.string().required("Please enter phone"),
            address: Yup.string().required("Please enter address"),
            zip_code: Yup.string().required("ZIP code required"),
            manager: Yup.string().required("Please select a manager"),
            city: Yup.string().required("City is required"),
            state: Yup.string().required("State is required"),
        }),

        onSubmit: async (values) => {
            setLoading(true);
            setError(null);

            try {
                const response = await axios.post(`${import.meta.env.VITE_APP_KEY}add/customer/`, values, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                });

                if (response.status === 201) {
                    setSuccess("Customer added successfully!");
                    formik.resetForm();
                }
            } catch (err) {
                if (err.response && err.response.data && err.response.data.errors) {
                    const backendErrors = err.response.data.errors;
                    if (backendErrors.gst) {
                        formik.setFieldError('gst', backendErrors.gst[0]);
                    }
                    if (backendErrors.email) {
                        formik.setFieldError('email', backendErrors.email[0]);
                    }
                    if (backendErrors.phone) {
                        formik.setFieldError('phone', backendErrors.phone[0]);
                    }
                } else {
                    setError("An error occurred. Please try again.");
                }
            } finally {
                setLoading(false);
            }
        },

    });

    useEffect(() => {
        if (token) {
            const fetchData = async () => {
                setLoading(true);
                try {
                    const [statesResponse, ManagedResponse] = await Promise.all([
                        axios.get(`${import.meta.env.VITE_APP_KEY}states/`, { headers: { Authorization: `Bearer ${token}` } }),
                        axios.get(`${import.meta.env.VITE_APP_KEY}staffs/`, { headers: { Authorization: `Bearer ${token}` } })
                    ]);

                    if (statesResponse.status === 200) {
                        const formattedStates = statesResponse.data.data
                        setStates(formattedStates);
                    } else {
                        throw new Error(`HTTP error! Status: ${statesResponse.status}`);
                    }

                    if (ManagedResponse.status === 200) {
                        setStaffs(ManagedResponse.data.data);
                    } else {
                        throw new Error(`HTTP error! Status: ${ManagedResponse.status}`);
                    }
                } catch (error) {
                    setError(error.message || "Failed to fetch data");
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        } else {
            setError("Token not found");
            setLoading(false);
        }
    }, [token]);

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid={true}>
                    <Breadcrumbs title="Forms" breadcrumbItem="Staff Form" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="mb-4">Customer Registration Form</CardTitle>
                                    {loading && <p>Loading...</p>}
                                    {error && (
                                        <div className="alert alert-danger alert-dismissible fade show" role="alert">
                                            {error}
                                            <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                                        </div>
                                    )}
                                    {success && (
                                        <div className="alert alert-success alert-dismissible fade show" role="alert">
                                            {success}
                                            <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                                        </div>
                                    )}


                                    <Form onSubmit={formik.handleSubmit}>
                                        <Row>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-name-Input"> Name</Label>
                                                    <Input
                                                        type="text"
                                                        name="name"
                                                        className="form-control"
                                                        id="formrow-name-Input"
                                                        placeholder="Enter Customer Name"
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
                                            </Col>

                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-name-Input">GST</Label>
                                                    <Input
                                                        type="text"
                                                        name="gst"
                                                        className="form-control"
                                                        id="formrow-name-Input"
                                                        placeholder="Enter GST Number"
                                                        value={formik.values.gst}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={
                                                            formik.touched.gst && formik.errors.gst ? true : false
                                                        }
                                                    />
                                                    {
                                                        formik.errors.gst && formik.touched.gst ? (
                                                            <FormFeedback type="invalid">{formik.errors.gst}</FormFeedback>
                                                        ) : null
                                                    }
                                                </div>
                                            </Col>

                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-email-Input">Email</Label>
                                                    <Input
                                                        type="email"
                                                        name="email"
                                                        className="form-control"
                                                        id="formrow-email-Input"
                                                        placeholder="Enter Customer Email ID"
                                                        value={formik.values.email}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={
                                                            formik.touched.email && formik.errors.email ? true : false
                                                        }
                                                    />
                                                    {
                                                        formik.errors.email && formik.touched.email ? (
                                                            <FormFeedback type="invalid">{formik.errors.email}</FormFeedback>
                                                        ) : null
                                                    }
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-password-Input">Address</Label>
                                                    <Input
                                                        type="text"
                                                        name="address"
                                                        className="form-control"
                                                        id="formrow-address-Input"
                                                        placeholder="Enter Customer Address"
                                                        autoComplete="off"
                                                        value={formik.values.address}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={
                                                            formik.touched.address && formik.errors.address ? true : false
                                                        }
                                                    />
                                                    {
                                                        formik.errors.address && formik.touched.address ? (
                                                            <FormFeedback type="invalid">{formik.errors.address}</FormFeedback>
                                                        ) : null
                                                    }
                                                </div>
                                            </Col>

                                        </Row>

                                        <Row>
                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-Inputcountry">City</Label>
                                                    <Input
                                                        type="text"
                                                        name="city"
                                                        className="form-control"
                                                        id="formrow-Inputcountry"
                                                        placeholder="Enter Customer Living city"
                                                        value={formik.values.city}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={
                                                            formik.touched.city && formik.errors.city ? true : false
                                                        }
                                                    />
                                                    {
                                                        formik.errors.city && formik.touched.city ? (
                                                            <FormFeedback type="invalid">{formik.errors.city}</FormFeedback>
                                                        ) : null
                                                    }
                                                </div>
                                            </Col>


                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="state">State</Label>
                                                    <select
                                                        name="state"
                                                        id="supervisor_id"
                                                        className="form-control"
                                                        value={formik.values.state}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                    >
                                                        <option value="">Select State</option>
                                                        {states.map((stat) => (
                                                            <option key={stat.id} value={stat.id}>
                                                                {stat.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {formik.errors.state && formik.touched.state ? (
                                                        <FormFeedback type="invalid">{formik.errors.state}</FormFeedback>
                                                    ) : null}
                                                </div>
                                            </Col>

                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="manager">Managed User</Label>
                                                    <select
                                                        name="manager"
                                                        id="supervisor_id"
                                                        className="form-control"
                                                        value={formik.values.manager}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                    >
                                                        <option value="">Select Manager</option> {/* Default option */}
                                                        {staffs.map((staff) => (
                                                            <option key={staff.id} value={staff.id}>
                                                                {staff.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {formik.errors.manager && formik.touched.manager ? (
                                                        <FormFeedback type="invalid">{formik.errors.manager}</FormFeedback>
                                                    ) : null}
                                                </div>
                                            </Col>

                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-password-Input">Phone</Label>
                                                    <Input
                                                        type="text"
                                                        name="phone"
                                                        className="form-control"
                                                        id="formrow-Inputcountry"
                                                        placeholder="Enter Customer Phone"
                                                        autoComplete="off"
                                                        value={formik.values.phone}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={
                                                            formik.touched.phone && formik.errors.phone ? true : false
                                                        }
                                                    />
                                                    {
                                                        formik.errors.phone && formik.touched.phone ? (
                                                            <FormFeedback type="invalid">{formik.errors.phone}</FormFeedback>
                                                        ) : null
                                                    }
                                                </div>
                                            </Col>

                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-password-Input">Alt Phone</Label>
                                                    <Input
                                                        type="text"
                                                        name="alt_phone"
                                                        className="form-control"
                                                        id="formrow-Inputcountry"
                                                        placeholder="Enter Customer Alternate Phone"
                                                        autoComplete="off"
                                                        value={formik.values.alt_phone}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={
                                                            formik.touched.alt_phone && formik.errors.alt_phone ? true : false
                                                        }
                                                    />
                                                    {
                                                        formik.errors.alt_phone && formik.touched.alt_phone ? (
                                                            <FormFeedback type="invalid">{formik.errors.alt_phone}</FormFeedback>
                                                        ) : null
                                                    }
                                                </div>
                                            </Col>

                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-password-Input">ZIP CODE</Label>
                                                    <Input
                                                        type="text"
                                                        name="zip_code"
                                                        className="form-control"
                                                        id="formrow-Inputcountry"
                                                        placeholder="Enter Customer zip code No :"
                                                        autoComplete="off"
                                                        value={formik.values.zip_code}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={
                                                            formik.touched.zip_code && formik.errors.zip_code ? true : false
                                                        }
                                                    />
                                                    {
                                                        formik.errors.zip_code && formik.touched.zip_code ? (
                                                            <FormFeedback type="invalid">{formik.errors.zip_code}</FormFeedback>
                                                        ) : null
                                                    }
                                                </div>
                                            </Col>




                                            <Col lg={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="comments">Commend</Label>
                                                    <textarea
                                                        name="commend"
                                                        id="comments"
                                                        className="form-control"
                                                        rows="4"
                                                        placeholder="Enter Customer Commend"
                                                        value={formik.values.commend}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                    ></textarea>
                                                    {formik.errors.commend && formik.touched.commend ? (
                                                        <FormFeedback type="invalid">{formik.errors.commend}</FormFeedback>
                                                    ) : null}
                                                </div>
                                            </Col>


                                        </Row>

                                        {/* <div className="mb-3">
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
                                        </div> */}
                                        
                                        <div className="mb-3">
                                            <button type="submit" className="btn btn-primary w-md" disabled={loading}>
                                                {loading ? 'Submitting...' : 'Submit'}
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
