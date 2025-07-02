import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, Col, Container, Row, CardBody, CardTitle, Label, Form, Input, FormFeedback } from "reactstrap";
import * as Yup from 'yup';
import { useFormik } from "formik";
import axios from 'axios';
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


const FormLayouts = () => {
    const { id } = useParams();
    const [managers, setManagers] = useState([]);
    const [states, setStates] = useState([]);
    const token = localStorage.getItem('token');
    const [userData, setUserData] = useState();

    document.title = "Form Layouts | Skote - Vite React Admin & Dashboard Template";

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}profile/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUserData(response?.data?.data?.family_name);
            } catch (error) {
                toast.error('Error fetching user data:');
            }
        };
        fetchUserData();
    }, []);

    useEffect(() => {
        const fetchManagers = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}staffs/`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                setManagers(response.data.data);
            } catch (error) {
                toast.error("Error fetching managers:");
            }
        };

        const fetchStates = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}states/`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                setStates(response.data.data);
            } catch (error) {
                toast.error("Error fetching states:");
            }
        };

        fetchManagers();
        fetchStates();
    }, [id, token]);

    const [customerData, setCustomerData] = useState(null);

    useEffect(() => {
        const fetchCustomerData = async () => {
            if (id) {
                try {
                    const response = await axios.get(`${import.meta.env.VITE_APP_KEY}customer/update/${id}/`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    setCustomerData(response.data.data);
                } catch (error) {
                    toast.error("Error fetching customer data:");
                }
            }
        };
        fetchCustomerData();
    }, [id, token]);

    useEffect(() => {
        if (customerData && managers.length > 0 && states.length > 0) {
            const managerObj = managers.find(m => m.name === customerData.manager);
            const stateObj = states.find(s => s.name === customerData.state)
            formik.setValues({
                ...customerData,
                manager: managerObj ? managerObj.id.toString() : "",
                state: stateObj ? stateObj.id.toString() : "",
            });
        }
        // eslint-disable-next-line
    }, [customerData, managers, states]);

    const formik = useFormik({
        initialValues: {
            name: "",
            manager: "",
            gst: "",
            phone: "",
            alt_phone: "",
            email: "",
            address: "",
            zip_code: "",
            city: "",
            state: "",
            comment: "",
        },
        validationSchema: Yup.object({
            name: Yup.string().required("This field is required"),
            manager: Yup.string().required("This field is required"),
            email: Yup.string().email().required("Please Enter Your Email"),
            gst: Yup.string().required("This field is required"),
            phone: Yup.string().required("This field is required"),
            alt_phone: Yup.string().required("This field is required"),
            address: Yup.string().required("This field is required"),
            zip_code: Yup.string().required("This field is required"),
            city: Yup.string().required("This field is required"),
            state: Yup.string().required("This field is required"),
            comment: Yup.string().required("This field is required"),
        }),
        onSubmit: async (values) => {
            try {
                const payload = {
                    ...values,
                    manager: values.manager, // Send the manager's ID
                };
                const response = await axios.put(
                    `${import.meta.env.VITE_APP_KEY}customer/update/${id}/`,
                    payload,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                alert("Customer data saved successfully!");
            } catch (error) {
                alert("Failed to save customer data.");
            }
        },
    });

    const filteredManagers = userData
        ? managers.filter(manager => manager.family_name === userData)
        : managers;

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid={true}>
                    <Breadcrumbs title="Forms" breadcrumbItem="UPDATE CUSTOMERS" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <Form onSubmit={formik.handleSubmit}>
                                        <div className="mb-3">

                                        </div>
                                        <Row>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="name">Name</Label>
                                                    <Input
                                                        type="text"
                                                        name="name"
                                                        className="form-control"
                                                        placeholder="Enter Your Name"
                                                        value={formik.values.name}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.name && formik.errors.name ? true : false}
                                                    />
                                                    <FormFeedback>{formik.errors.name}</FormFeedback>
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="gst">Manager</Label>
                                                    <Input
                                                        type="select"
                                                        name="manager"
                                                        id="manager"
                                                        className="form-control"
                                                        value={formik.values.manager?.toString() || ""}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.manager && formik.errors.manager ? true : false}
                                                    >
                                                        {/* <option value="">Select Manager</option> */}
                                                        {filteredManagers.map((option) => (
                                                            <option key={option.id} value={option?.id?.toString()}>
                                                                {option.name}
                                                            </option>
                                                        ))}
                                                    </Input>
                                                    <FormFeedback>{formik.errors.gst}</FormFeedback>
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="email">Email</Label>
                                                    <Input
                                                        type="email"
                                                        name="email"
                                                        className="form-control"
                                                        placeholder="Enter Your Email ID"
                                                        value={formik.values.email}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.email && formik.errors.email ? true : false}
                                                    />
                                                    <FormFeedback>{formik.errors.email}</FormFeedback>
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="gst">GST</Label>
                                                    <Input
                                                        type="text"
                                                        name="gst"
                                                        className="form-control"
                                                        placeholder="Enter Your GST Number"
                                                        value={formik.values.gst}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.gst && formik.errors.gst ? true : false}
                                                    />
                                                    <FormFeedback>{formik.errors.gst}</FormFeedback>
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="phone">Phone</Label>
                                                    <Input
                                                        type="text"
                                                        name="phone"
                                                        className="form-control"
                                                        placeholder="Enter Your Phone Number"
                                                        value={formik.values.phone}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.phone && formik.errors.phone ? true : false}
                                                    />
                                                    <FormFeedback>{formik.errors.phone}</FormFeedback>
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="alt_phone">Alternate Phone</Label>
                                                    <Input
                                                        type="text"
                                                        name="alt_phone"
                                                        className="form-control"
                                                        placeholder="Enter Your Alternate Phone"
                                                        value={formik.values.alt_phone}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.alt_phone && formik.errors.alt_phone ? true : false}
                                                    />
                                                    <FormFeedback>{formik.errors.alt_phone}</FormFeedback>
                                                </div>
                                            </Col>
                                        </Row>

                                        <div className="mb-3">
                                            <Label htmlFor="address">Address</Label>
                                            <Input
                                                type="text"
                                                name="address"
                                                className="form-control"
                                                placeholder="Enter Your Address"
                                                value={formik.values.address}
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                                invalid={formik.touched.address && formik.errors.address ? true : false}
                                            />
                                            <FormFeedback>{formik.errors.address}</FormFeedback>
                                        </div>

                                        <Row>
                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="city">City</Label>
                                                    <Input
                                                        type="text"
                                                        name="city"
                                                        className="form-control"
                                                        placeholder="Enter Your City"
                                                        value={formik.values.city}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.city && formik.errors.city ? true : false}
                                                    />
                                                    <FormFeedback>{formik.errors.city}</FormFeedback>
                                                </div>
                                            </Col>
                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="state">State</Label>
                                                    <Input
                                                        type="select"
                                                        name="state"
                                                        id="state"
                                                        className="form-control"
                                                        value={formik.values.state}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.state && formik.errors.state ? true : false}
                                                    >
                                                        <option value="">Select State</option>
                                                        {states.map((state) => (
                                                            <option key={state.id} value={state.id}>
                                                                {state.name}
                                                            </option>
                                                        ))}
                                                    </Input>
                                                    <FormFeedback>{formik.errors.state}</FormFeedback>
                                                </div>
                                            </Col>
                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="zip_code">Zip Code</Label>
                                                    <Input
                                                        type="text"
                                                        name="zip_code"
                                                        className="form-control"
                                                        placeholder="Enter Your Zip Code"
                                                        value={formik.values.zip_code}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.zip_code && formik.errors.zip_code ? true : false}
                                                    />
                                                    <FormFeedback>{formik.errors.zip_code}</FormFeedback>
                                                </div>
                                            </Col>
                                        </Row>

                                        <div className="mb-3">
                                            <Label htmlFor="comment">Comment</Label>
                                            <Input
                                                type="textarea"
                                                name="comment"
                                                className="form-control"
                                                placeholder="Enter Your Comment"
                                                value={formik.values.comment || ""}
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                                invalid={formik.touched.comment && formik.errors.comment ? true : false}
                                            />
                                            <FormFeedback>{formik.errors.comment}</FormFeedback>
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
