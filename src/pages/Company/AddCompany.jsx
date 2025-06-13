import React from "react";
import { Card, Col, Container, Row, CardBody, CardTitle, Label, Form, Input, FormFeedback } from "reactstrap";
import * as Yup from 'yup';
import { useFormik } from "formik";
import axios from "axios";
// Import Breadcrumb
import Breadcrumbs from "../../components/Common/Breadcrumb";

const FormLayouts = () => {

    // Meta title
    document.title = "Form Layouts | Skote - Vite React Admin & Dashboard Template";
    const token = localStorage.getItem('token');

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
            check: ""
        },
        validationSchema: Yup.object({
            name: Yup.string().required("This field is required"),
            gst: Yup.string().required("This field is required"),
            address: Yup.string().required("This field is required"),
            zip: Yup.string().required("This field is required"),
            city: Yup.string().required("This field is required"),
            country: Yup.string().required("This field is required"),
            phone: Yup.string().required("This field is required"),
            email: Yup.string().required("This field is required"),
            web_site: Yup.string().required("This field is required"),
            prefix: Yup.string().required("This field is required"),
            check: Yup.string().required("This field is required"),
        }),

        onSubmit: (values) => {
            axios.post(`${import.meta.env.VITE_APP_KEY}company/data/`,values,{
                        headers: {
                            Authorization: `Bearer ${token}`,
                        }
                    }
                )
                .then((response) => {
                    console.log("Response from API:", response);
                })
                .catch((error) => {
                    console.error("There was an error!", error);
                });
        },
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

                                    <Form onSubmit={formik.handleSubmit}>
                                        <div className="mb-3">
                                            <Label htmlFor="formrow-name-Input">BANK NAME</Label>
                                            <Input
                                                type="text"
                                                name="name"
                                                className="form-control"
                                                id="formrow-name-Input"
                                                placeholder="Enter Your First Name"
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
                                                    <Label htmlFor="formrow-gst-Input">GST Number</Label>
                                                    <Input
                                                        type="text"
                                                        name="gst"
                                                        className="form-control"
                                                        id="formrow-gst-Input"
                                                        placeholder="Enter Your Account Number"
                                                        value={formik.values.gst}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.gst && formik.errors.gst}
                                                    />
                                                    {formik.errors.gst && formik.touched.gst && (
                                                        <FormFeedback type="invalid">{formik.errors.gst}</FormFeedback>
                                                    )}
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-address-Input">ADDRESS</Label>
                                                    <Input
                                                        type="text"
                                                        name="address"
                                                        className="form-control"
                                                        id="formrow-address-Input"
                                                        placeholder="Enter Your IFSC Code"
                                                        value={formik.values.address}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.address && formik.errors.address}
                                                    />
                                                    {formik.errors.address && formik.touched.address && (
                                                        <FormFeedback type="invalid">{formik.errors.address}</FormFeedback>
                                                    )}
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-zip-Input">ZIP</Label>
                                                    <Input
                                                        type="text"
                                                        name="zip"
                                                        className="form-control"
                                                        id="formrow-zip-Input"
                                                        placeholder="Enter Your zip"
                                                        value={formik.values.zip}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.zip && formik.errors.zip}
                                                    />
                                                    {formik.errors.zip && formik.touched.zip && (
                                                        <FormFeedback type="invalid">{formik.errors.zip}</FormFeedback>
                                                    )}
                                                </div>
                                            </Col>

                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-city-Input">Opening Balance</Label>
                                                    <Input
                                                        type="text"
                                                        name="city"
                                                        className="form-control"
                                                        id="formrow-city-Input"
                                                        placeholder="Enter Opening Balance"
                                                        value={formik.values.city}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.city && formik.errors.city}
                                                    />
                                                    {formik.errors.city && formik.touched.city && (
                                                        <FormFeedback type="invalid">{formik.errors.city}</FormFeedback>
                                                    )}
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-phone-Input">Phone Number</Label>
                                                    <Input
                                                        type="text"
                                                        name="phone"
                                                        className="form-control"
                                                        id="formrow-phone-Input"
                                                        placeholder="Enter Phone Number"
                                                        value={formik.values.phone}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.phone && formik.errors.phone}
                                                    />
                                                    {formik.errors.phone && formik.touched.phone && (
                                                        <FormFeedback type="invalid">{formik.errors.phone}</FormFeedback>
                                                    )}
                                                </div>
                                            </Col>

                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-email-Input">Email Address</Label>
                                                    <Input
                                                        type="email"
                                                        name="email"
                                                        className="form-control"
                                                        id="formrow-email-Input"
                                                        placeholder="Enter Email Address"
                                                        value={formik.values.email}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.email && formik.errors.email}
                                                    />
                                                    {formik.errors.email && formik.touched.email && (
                                                        <FormFeedback type="invalid">{formik.errors.email}</FormFeedback>
                                                    )}
                                                </div>
                                            </Col>

                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-website-Input">Website</Label>
                                                    <Input
                                                        type="text"
                                                        name="web_site"
                                                        className="form-control"
                                                        id="formrow-website-Input"
                                                        placeholder="Enter Website"
                                                        value={formik.values.web_site}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.web_site && formik.errors.web_site}
                                                    />
                                                    {formik.errors.web_site && formik.touched.web_site && (
                                                        <FormFeedback type="invalid">{formik.errors.web_site}</FormFeedback>
                                                    )}
                                                </div>
                                            </Col>
                                        </Row>

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
