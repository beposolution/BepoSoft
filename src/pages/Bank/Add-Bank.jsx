import React, { useState, useEffect } from "react";
import { Card, Col, Container, Row, CardBody, CardTitle, Label, Form, Input, FormFeedback } from "reactstrap";
import * as Yup from 'yup';
import { useFormik } from "formik";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const FormLayouts = () => {
    document.title = "Form Layouts | Skote - Vite React Admin & Dashboard Template";

    const [message, setMessage] = useState(null); // For success or error message
    const [messageType, setMessageType] = useState(null); // For determining success or error message type

    const user = localStorage.getItem('name');
    const navigate = useNavigate();

    const formik = useFormik({
        
        initialValues: {
            name: "",
            account_number: "",
            ifsc_code: "",
            branch: "",
            open_balance: "",
            check: "",
        },
        validationSchema: Yup.object({
            name: Yup.string().required("This field is required"),
            account_number: Yup.string().required("This field is required"),
            ifsc_code: Yup.string().required("This field is required"),
            branch: Yup.string().required("This field is required"),
            open_balance: Yup.string().required("This field is required"),
            check: Yup.string().required("This field is required"),
        }),
        onSubmit: async (values) => {
            try {
                // Retrieve token from localStorage
                const token = localStorage.getItem('token');

                const response = await axios.post(
                    `${import.meta.env.VITE_APP_KEY}add/bank/`,
                    values,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        },
                    }
                );

                if (response.status === 201) {
                    // Handle successful response
                    setMessage("Bank account added successfully!");
                    setMessageType("success");
                } else {
                    console.error("Error: " + response.data.message);
                    setMessage(response.data.message || "Something went wrong. Please try again.");
                    setMessageType("error");
                }
            } catch (error) {
                if (error.response && error.response.status === 401) {
                    // Clear invalid token
                    localStorage.removeItem("token");
                    
                    // Show message (optional)
                    alert("Your session has expired. Please log in again.");
                    
                    // Redirect to login page
                    navigate("/login");
                } else {
                    console.error("Error posting data:", error);
                    setMessage("Something went wrong. Please try again.");
                    setMessageType("error");
                }
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

                                    {/* Display success or error message */}
                                    {message && (
                                        <div className={`alert alert-${messageType === 'success' ? 'success' : 'danger'}`} role="alert">
                                            {message}
                                        </div>
                                    )}

                                    <Form onSubmit={formik.handleSubmit}>
                                        <div className="mb-3">
                                            <Label htmlFor="formrow-firstname-Input">Bank Name</Label>
                                            <Input
                                                type="text"
                                                name="name"
                                                className="form-control"
                                                id="formrow-firstname-Input"
                                                placeholder="Enter Bank Name"
                                                value={formik.values.name}
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                                invalid={formik.touched.name && formik.errors.name}
                                            />
                                            {formik.errors.name && formik.touched.name && (
                                                <FormFeedback type="invalid">{formik.errors.name}</FormFeedback>
                                            )}
                                        </div>

                                        <Row>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-email-Input">A/C Number</Label>
                                                    <Input
                                                        type="text"
                                                        name="account_number"
                                                        className="form-control"
                                                        id="formrow-email-Input"
                                                        placeholder="Enter Your A/C Number"
                                                        value={formik.values.account_number}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.account_number && formik.errors.account_number}
                                                    />
                                                    {formik.errors.account_number && formik.touched.account_number && (
                                                        <FormFeedback type="invalid">{formik.errors.account_number}</FormFeedback>
                                                    )}
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-password-Input">IFSC Code</Label>
                                                    <Input
                                                        type="text"
                                                        name="ifsc_code"
                                                        className="form-control"
                                                        id="formrow-password-Input"
                                                        placeholder="Enter Your IFSC Code"
                                                        autoComplete="off"
                                                        value={formik.values.ifsc_code}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.ifsc_code && formik.errors.ifsc_code}
                                                    />
                                                    {formik.errors.ifsc_code && formik.touched.ifsc_code && (
                                                        <FormFeedback type="invalid">{formik.errors.ifsc_code}</FormFeedback>
                                                    )}
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-InputCity">Branch</Label>
                                                    <Input
                                                        type="text"
                                                        name="branch"
                                                        className="form-control"
                                                        id="formrow-InputCity"
                                                        placeholder="Enter Your Branch"
                                                        value={formik.values.branch}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.branch && formik.errors.branch}
                                                    />
                                                    {formik.errors.branch && formik.touched.branch && (
                                                        <FormFeedback type="invalid">{formik.errors.branch}</FormFeedback>
                                                    )}
                                                </div>
                                            </Col>
                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-InputZip">Opening balance</Label>
                                                    <Input
                                                        type="text"
                                                        name="open_balance"
                                                        className="form-control"
                                                        id="formrow-Inputopen_balance"
                                                        placeholder="Enter Your open balance"
                                                        value={formik.values.open_balance}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.open_balance && formik.errors.open_balance}
                                                    />
                                                    {formik.errors.open_balance && formik.touched.open_balance && (
                                                        <FormFeedback type="invalid">{formik.errors.open_balance}</FormFeedback>
                                                    )}
                                                </div>
                                            </Col>

                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-email-Input">Created User</Label>
                                                    <Input
                                                        type="text"
                                                        name="created_user"
                                                        className="form-control"
                                                        id="formrow-email-Input"
                                                        placeholder="Enter Your A/C Number"
                                                        value={user}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.created_user && formik.errors.created_user}
                                                    />
                                                    {formik.errors.created_user && formik.touched.created_user && (
                                                        <FormFeedback type="invalid">{formik.errors.created_user}</FormFeedback>
                                                    )}
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
                                                    invalid={formik.touched.check && formik.errors.check}
                                                />
                                                <Label className="form-check-Label" htmlFor="formrow-customCheck">
                                                    Check me out
                                                </Label>
                                            </div>
                                            {formik.errors.check && formik.touched.check && (
                                                <FormFeedback type="invalid">{formik.errors.check}</FormFeedback>
                                            )}
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
