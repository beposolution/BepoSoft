import axios from 'axios';
import {
    Card, Col, Container, Row, CardBody, CardTitle, Label, Form, Input, FormFeedback,
} from "reactstrap";
import * as Yup from 'yup';
import { useFormik } from "formik";
import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from 'react-toastify';
import Breadcrumbs from "../../components/Common/Breadcrumb";
import "react-toastify/dist/ReactToastify.css";

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
    const [userData, setUserData] = useState();
    const [role, setRole] = useState(null);
    const [matchedStaffs, setMatchedStaffs] = useState([]);

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
            email: Yup.string().email("Invalid email format").required("Please enter email"),
            phone: Yup.string().required("Please enter phone"),
            address: Yup.string().required("Please enter address"),
            zip_code: Yup.string().required("ZIP code required"),
            manager: Yup.string().required('Manager is required').nullable(),
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
                    toast.success("Customer added successfully");
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
        const role = localStorage.getItem("active");
        setRole(role);
    }, []);

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
        if (token && userData) {
            const fetchAndSetMatchingStaff = async () => {
                try {
                    const response = await axios.get(
                        `${import.meta.env.VITE_APP_KEY}staffs/`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    if (response.status === 200 && Array.isArray(response.data.data)) {
                        // Match staff where family_name equals userData
                        const matched = response.data.data.filter(
                            staff => staff.family_name === userData
                        );
                        setMatchedStaffs(matched); // Save to state
                    } else {
                        setMatchedStaffs([]);
                    }
                } catch (error) {
                    toast.error("Error fetching or matching staff");
                    setMatchedStaffs([]);
                }
            };
            fetchAndSetMatchingStaff();
        }
    }, [token, userData]);

    useEffect(() => {
        if (token) {
            const fetchData = async () => {
                setLoading(true);
                try {
                    const [statesResponse, ManagedResponse] = await Promise.all([
                        axios.get(`${import.meta.env.VITE_APP_KEY}states/`, { headers: { Authorization: `Bearer ${token}` } }),
                        axios.get(`${import.meta.env.VITE_APP_KEY}staffs/`, { headers: { Authorization: `Bearer ${token}` } })
                    ]);

                    let formattedStates = [];
                    if (statesResponse.status === 200) {
                        formattedStates = statesResponse.data.data;
                    } else {
                        throw new Error(`HTTP error! Status: ${statesResponse.status}`);
                    }

                    if (ManagedResponse.status === 200) {
                        let loggedInStaffId;
                        try {
                            const tokenPayload = JSON.parse(window.atob(token.split('.')[1]));
                            loggedInStaffId = tokenPayload.id;
                        } catch (error) {
                            toast.error("Error parsing token");
                        }
                        const filteredStaffs = ManagedResponse.data.data.filter(
                            (staff) => staff.id === loggedInStaffId
                        );
                        setStaffs(filteredStaffs);

                        if (filteredStaffs.length > 0) {
                            formik.setFieldValue("manager", filteredStaffs[0].id);
                            // Filter states based on allocated_states property of the logged-in staff
                            if (filteredStaffs[0].allocated_states && Array.isArray(filteredStaffs[0].allocated_states)) {
                                const allocatedStateIds = filteredStaffs[0].allocated_states;
                                const allocatedStates = formattedStates.filter((stat) =>
                                    allocatedStateIds.includes(stat.id)
                                );
                                setStates(allocatedStates);
                            } else {
                                setStates([]);
                            }
                        }
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
                                                        id="state"
                                                        className={`form-control ${formik.errors.state && formik.touched.state ? 'is-invalid' : ''}`}
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
                                                    {formik.errors.state && formik.touched.state && (
                                                        <FormFeedback type="invalid">{formik.errors.state}</FormFeedback>
                                                    )}
                                                </div>
                                            </Col>

                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="manager">Managed User</Label>
                                                    {role === "BDM" ? (
                                                        <select
                                                            name="manager"
                                                            id="manager"
                                                            className={`form-control ${formik.errors.manager && formik.touched.manager ? 'is-invalid' : ''}`}
                                                            value={formik.values.manager}
                                                            onChange={formik.handleChange}
                                                            onBlur={formik.handleBlur}
                                                        >
                                                            <option value="">Select Manager</option>
                                                            {matchedStaffs.map((staff) => (
                                                                <option key={staff.id} value={staff.id}>
                                                                    {staff.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <Input
                                                            type="text"
                                                            id="manager"
                                                            className="form-control"
                                                            value={staffs.length > 0 ? staffs[0].name : ""}
                                                            readOnly
                                                        />
                                                    )}
                                                    {/* Hidden input to pass the manager id on submit if not BDM */}
                                                    {role !== "BDM" && (
                                                        <Input
                                                            type="hidden"
                                                            name="manager"
                                                            value={formik.values.manager}
                                                        />
                                                    )}
                                                    {formik.errors.manager && formik.touched.manager && (
                                                        <FormFeedback type="invalid">{formik.errors.manager}</FormFeedback>
                                                    )}
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
                                                    <Label htmlFor="commend">Commend</Label>
                                                    <textarea
                                                        name="commend"
                                                        id="commend"
                                                        className={`form-control ${formik.touched.commend && formik.errors.commend ? 'is-invalid' : ''
                                                            }`}
                                                        rows="4"
                                                        placeholder="Enter Customer Commend"
                                                        value={formik.values.commend}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                    ></textarea>
                                                    {formik.errors.commend && formik.touched.commend && (
                                                        <FormFeedback>{formik.errors.commend}</FormFeedback>
                                                    )}
                                                </div>
                                            </Col>


                                        </Row>


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
                    <ToastContainer />
                </Container>
            </div>
        </React.Fragment>
    );
};

export default FormLayouts;
