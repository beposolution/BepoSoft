import React, { useState } from "react";
import { Card, Col, Container, Row, Label, Form, Input, FormFeedback, Alert, Spinner } from "reactstrap";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";

const CompanyForm = () => {
    const token = localStorage.getItem("token");

    // State for feedback messages and loading status
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const formik = useFormik({
        initialValues: {
            name: "",
            gst: "",
            address: "",
            zip: "",
            city: "",
            country: "",
            phone: "",
            email: "",
            web_site: "",
            prefix: "",
        },
        validationSchema: Yup.object({
            name: Yup.string().max(100, "Maximum 100 characters").required("Name is required"),
            gst: Yup.string().max(20, "Maximum 20 characters").required("GST number is required"),
            address: Yup.string().max(500, "Maximum 500 characters"),
            zip: Yup.number().typeError("Must be a number").required("ZIP code is required"),
            city: Yup.string().max(100, "Maximum 100 characters").required("City is required"),
            country: Yup.string().max(100, "Maximum 100 characters").required("Country is required"),
            phone: Yup.string()
                .matches(/^\d{10}$/, "Phone number must be 10 digits")
                .required("Phone number is required"),
            email: Yup.string().email("Invalid email format").required("Email is required"),
            web_site: Yup.string().url("Invalid URL").required("Website is required"),
            prefix: Yup.string().max(5, "Maximum 5 characters").required("Prefix is required"),
        }),

        onSubmit: (values, { resetForm }) => {
            setLoading(true);
            setSuccessMessage("");
            setErrorMessage("");

            axios
                .post(`${import.meta.env.VITE_APP_KEY}company/data/`, values, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                })
                .then((response) => {
                    setSuccessMessage("Company details submitted successfully!");
                    resetForm();
                })
                .catch((error) => {
                    console.error("Error submitting form:", error);
                    
                    let errorMsg = "There was an error submitting the form."; // Default message
                
                    if (error.response?.data?.message) {
                        // Check if message is an object and convert it to a string
                        errorMsg = typeof error.response.data.message === "string" 
                            ? error.response.data.message 
                            : JSON.stringify(error.response.data.message); // Convert object to string
                    }
                
                    setErrorMessage(errorMsg); // Ensure errorMessage is always a string
                })
                
                .finally(() => {
                    setLoading(false);
                });
        },
    });

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid={true}>
                    <h3 className="mb-4">Company Form</h3>

                    {/* Success Message */}
                    {successMessage && <Alert color="success">{successMessage}</Alert>}

                    {/* Error Message */}
                    {errorMessage && <Alert color="danger">{errorMessage}</Alert>}

                    <Form onSubmit={formik.handleSubmit}>
                        <Row>
                            <Col md={6}>
                                <Label>Name</Label>
                                <Input
                                    type="text"
                                    name="name"
                                    {...formik.getFieldProps("name")}
                                    invalid={formik.touched.name && !!formik.errors.name}
                                />
                                <FormFeedback>{formik.errors.name}</FormFeedback>
                            </Col>
                            <Col md={6}>
                                <Label>GST</Label>
                                <Input
                                    type="text"
                                    name="gst"
                                    {...formik.getFieldProps("gst")}
                                    invalid={formik.touched.gst && !!formik.errors.gst}
                                />
                                <FormFeedback>{formik.errors.gst}</FormFeedback>
                            </Col>
                        </Row>

                        <Row className="mt-3">
                            <Col md={6}>
                                <Label>Address</Label>
                                <Input
                                    type="text"
                                    name="address"
                                    {...formik.getFieldProps("address")}
                                    invalid={formik.touched.address && !!formik.errors.address}
                                />
                                <FormFeedback>{formik.errors.address}</FormFeedback>
                            </Col>
                            <Col md={6}>
                                <Label>ZIP</Label>
                                <Input
                                    type="text"
                                    name="zip"
                                    {...formik.getFieldProps("zip")}
                                    invalid={formik.touched.zip && !!formik.errors.zip}
                                />
                                <FormFeedback>{formik.errors.zip}</FormFeedback>
                            </Col>
                        </Row>

                        <Row className="mt-3">
                            <Col md={6}>
                                <Label>City</Label>
                                <Input
                                    type="text"
                                    name="city"
                                    {...formik.getFieldProps("city")}
                                    invalid={formik.touched.city && !!formik.errors.city}
                                />
                                <FormFeedback>{formik.errors.city}</FormFeedback>
                            </Col>
                            <Col md={6}>
                                <Label>Country</Label>
                                <Input
                                    type="text"
                                    name="country"
                                    {...formik.getFieldProps("country")}
                                    invalid={formik.touched.country && !!formik.errors.country}
                                />
                                <FormFeedback>{formik.errors.country}</FormFeedback>
                            </Col>
                        </Row>

                        <Row className="mt-3">
                            <Col md={6}>
                                <Label>Phone</Label>
                                <Input
                                    type="text"
                                    name="phone"
                                    {...formik.getFieldProps("phone")}
                                    invalid={formik.touched.phone && !!formik.errors.phone}
                                />
                                <FormFeedback>{formik.errors.phone}</FormFeedback>
                            </Col>
                            <Col md={6}>
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    name="email"
                                    {...formik.getFieldProps("email")}
                                    invalid={formik.touched.email && !!formik.errors.email}
                                />
                                <FormFeedback>{formik.errors.email}</FormFeedback>
                            </Col>
                        </Row>

                        <Row className="mt-3">
                            <Col md={6}>
                                <Label>Website</Label>
                                <Input
                                    type="text"
                                    name="web_site"
                                    {...formik.getFieldProps("web_site")}
                                    invalid={formik.touched.web_site && !!formik.errors.web_site}
                                />
                                <FormFeedback>{formik.errors.web_site}</FormFeedback>
                            </Col>
                            <Col md={6}>
                                <Label>Prefix</Label>
                                <Input
                                    type="text"
                                    name="prefix"
                                    {...formik.getFieldProps("prefix")}
                                    invalid={formik.touched.prefix && !!formik.errors.prefix}
                                />
                                <FormFeedback>{formik.errors.prefix}</FormFeedback>
                            </Col>
                        </Row>

                        <button type="submit" className="btn btn-primary mt-4" disabled={loading}>
                            {loading ? <Spinner size="sm" /> : "Submit"}
                        </button>
                    </Form>
                </Container>
            </div>
        </React.Fragment>
    );
};

export default CompanyForm;
