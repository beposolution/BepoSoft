import axios from 'axios';
import {
    Card, Col, Container, Row, CardBody, CardTitle, Label, Form, Input, InputGroup, FormFeedback, Button
} from "reactstrap";
import * as Yup from 'yup';
import { useFormik } from "formik";
import React, { useState, useEffect } from "react";
import Select from 'react-select';
import { useParams } from 'react-router-dom';
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const FormLayouts = () => {
    // Meta title
    document.title = "Staff Registration | Beposoft";

    // State declarations
    const [department, setDepartment] = useState([]);
    const [familys, setFamilys] = useState([]);
    const [supervisor, setSupervisor] = useState([]);
    const [states, setStates] = useState([]);
    const [lga, setLga] = useState([]);
    const [selectedStates, setSelectedStates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const token = localStorage.getItem("token"); // Token fetching
    const { id } = useParams();

    // Formik setup
    const formik = useFormik({
        initialValues: {
            name: "",
            username: "",
            email: "",
            password: "",
            country: "",
            state: "",
            allocated_states: [],
            date_of_birth: "",
            gender: "",
            marital_status: "",
            phone: "",
            alternate_number: "",
            driving_license: "",
            driving_license_exp_date: "",
            employment_status: "",
            designation: "",
            join_date: "",
            confirmation_date: "",
            termination_date: "",
            supervisor_id: "",
            department_id: "",
            approval_status: "",
            signatur_up: "",
            family: "",
            check: "",
        },
        validationSchema: Yup.object({
            // Basic Info
            name: Yup.string().required("This field is required"),
            username: Yup.string().required("Please enter a username"),
            email: Yup.string()
                .email("Invalid email format")
                .required("Please enter an email"),
            phone: Yup.string()
                .matches(/^[0-9]+$/, "Phone number must be digits only")
                .min(10, "Phone number must be at least 10 digits")
                .required("Please enter a phone number"),

            // Password Validation
            password: Yup.string()
                .nullable()
                .test(
                    "passwordTest",
                    "Password must be at least 8 characters, contain upper, lower, number, and special character",
                    value => {
                        if (!value) return true; // allow empty (no update)
                        return (
                            value.length >= 8 &&
                            /[a-z]/.test(value) &&
                            /[A-Z]/.test(value) &&
                            /[0-9]/.test(value) &&
                            /[!@#$%^&*(),.?":{}|<>]/.test(value)
                        );
                    }
                ),
            // Employment Info
            join_date: Yup.date().required("Join date is required"),
            date_of_birth: Yup.date().required("Date of birth is required"),
            confirmation_date: Yup.date()
                .nullable()
                .min(Yup.ref('join_date'), "Confirmation date cannot be before join date")
                .required("Confirmation date is required"),
            designation: Yup.string().required("Please select a designation"),
            employment_status: Yup.string().required("Please select employment status"),
            department_id: Yup.string().required("Please select a department"),
            supervisor_id: Yup.string().required("Please select a supervisor"),

            // Signature
            signatur_up: Yup.string(),
            // .required("Signature is required"),

            // Marital and Personal Info
            marital_status: Yup.string().required("Please select marital status"),
            country: Yup.string().required("This field is required"),
            state: Yup.string().required("This field is required"),
            allocated_states: Yup.array()
                .nullable(true)
                .required("This field is required"),

            approval_status: Yup.string().required("This field is required"),
            gender: Yup.string().required("This field is required"),

            // Other
            check: Yup.string().required("This field is required"),
        }),
        onSubmit: async (values) => {
            try {
                const formData = new FormData();

                for (let key in values) {
                    if (key === "signatur_up" && values[key]) {
                        formData.append(key, values[key]); // Append the file
                    } else if (key === "allocated_states") {
                        values[key].forEach(state => formData.append('allocated_states', state)); // Append each state individually
                    } 
                    else if (key === "password") {
                        // Append password only if not empty or null
                        if (values[key] && values[key].trim() !== '') {
                            formData.append(key, values[key]);
                        }
                    } else if (values[key] !== '') {
                        formData.append(key, values[key]); // Append other non-empty values
                    }
                }

                // Log FormData entries
                for (let pair of formData.entries()) {
                }

                const response = await axios.put(
                    `${import.meta.env.VITE_APP_KEY}staff/update/${id}/`, formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    }
                });

                if (response.status === 201 || response.status === 200) {
                    setSuccess("Form submitted successfully");
                } else {
                    setError("Failed to submit the form");
                }


            } catch (err) {
                if (err.response && err.response.data && err.response.data.errors) {
                    const backendErrors = err.response.data.errors;

                    if (backendErrors.email) {
                        formik.setFieldError('email', backendErrors.email[0]);
                    }
                    if (backendErrors.username) {
                        formik.setFieldError('username', backendErrors.username[0]);
                    }
                    if (backendErrors.phone) {
                        formik.setFieldError('phone', backendErrors.phone[0]);
                    }
                    if (backendErrors.alternate_number) {
                        formik.setFieldError('alternate_number', backendErrors.alternate_number[0]);
                    }
                } else {
                    setError("An error occurred. Please try again.");
                }
            }
        }

    });


    useEffect(() => {
        setSelectedStates(
            states.filter(state => formik.values.allocated_states.includes(state.value))
        );
    }, [formik.values.allocated_states, states]);


    useEffect(() => {
        if (token) {
            const fetchData = async () => {
                setLoading(true);
                try {
                    const [departmentResponse, statesResponse, supervisorResponse, staffResponse, familyResponse] = await Promise.all([
                        axios.get(`${import.meta.env.VITE_APP_KEY}departments/`, { headers: { Authorization: `Bearer ${token}` } }),
                        axios.get(`${import.meta.env.VITE_APP_KEY}states/`, { headers: { Authorization: `Bearer ${token}` } }),
                        axios.get(`${import.meta.env.VITE_APP_KEY}supervisors/`, { headers: { Authorization: `Bearer ${token}` } }),
                        axios.get(`${import.meta.env.VITE_APP_KEY}staff/update/${id}/`, { headers: { Authorization: `Bearer ${token}` } }),
                        axios.get(`${import.meta.env.VITE_APP_KEY}familys/`, { headers: { Authorization: `Bearer ${token}` } })
                    ]);

                    // Check and handle staff data (renamed from customerData)
                    if (staffResponse.status === 200) {
                        const staffData = staffResponse.data.data;

                        // Populate the form with the fetched staff data
                        formik.setValues({
                            name: staffData.name || "",
                            username: staffData.username || "",
                            email: staffData.email || "",
                            password: "", // Keep password empty for security reasons
                            country: staffData.country || "",
                            state: staffData.state || "",
                            family: staffData.family || "",
                            allocated_states: staffData.allocated_states || [],
                            date_of_birth: staffData.date_of_birth || "",
                            gender: staffData.gender || "",
                            marital_status: staffData.marital_status || "",
                            phone: staffData.phone || "",
                            alternate_number: staffData.alternate_number || "",
                            driving_license: staffData.driving_license || "",
                            driving_license_exp_date: staffData.driving_license_exp_date || "",
                            employment_status: staffData.employment_status || "",
                            designation: staffData.designation || "",
                            join_date: staffData.join_date || "",
                            confirmation_date: staffData.confirmation_date || "",
                            termination_date: staffData.termination_date || "",
                            supervisor_id: staffData.supervisor_id || "",
                            department_id: staffData.department_id || "",
                            approval_status: staffData.approval_status || "",
                            signatur_up: "", // Assuming the signature is an uploaded file, keep this empty
                            check: "", // Assuming this is for any checks, adjust accordingly
                        });
                    } else {
                        setError(`Failed to fetch staff data. Status: ${staffResponse.status}`);
                    }


                    // Handle department response
                    if (departmentResponse.status === 200) {
                        setDepartment(departmentResponse.data.data);
                    } else {
                        throw new Error(`HTTP error! Status: ${departmentResponse.status}`);
                    }

                    // Handle states response
                    if (statesResponse.status === 200) {
                        const formattedStates = statesResponse.data.data.map(state => ({
                            value: state.id,
                            label: state.name
                        }));
                        setStates(formattedStates);
                        setLga(statesResponse.data.data);
                    } else {
                        throw new Error(`HTTP error! Status: ${statesResponse.status}`);
                    }

                    // Handle supervisor response
                    if (supervisorResponse.status === 200) {
                        setSupervisor(supervisorResponse.data.data);
                    } else {
                        throw new Error(`HTTP error! Status: ${supervisorResponse.status}`);
                    }

                    if (familyResponse.status === 200) {
                        setFamilys(familyResponse.data.data);
                    } else {
                        throw new Error(`HTTP error! Status: ${familyResponse.status}`);
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
    }, [token, id]); // Adding id in dependency array


    // Handler for multi-select changes
    const handleMultiChange = (selectedOptions) => {
        const selectedValues = selectedOptions ? selectedOptions.map(option => option.value) : [];
        formik.setFieldValue("allocated_states", selectedValues);
        setSelectedStates(selectedOptions);
    };
    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid={true}>
                    <Breadcrumbs title="Forms" breadcrumbItem="Staff Form" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="mb-4">Staff Edit Form</CardTitle>
                                    {loading && (
                                        <div className="alert alert-info d-flex align-items-center" role="alert">
                                            <div className="spinner-border text-info me-2" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                            <span>Loading...</span>
                                        </div>
                                    )}

                                    {error && (
                                        <div className="alert alert-danger" role="alert">
                                            <i className="bi bi-exclamation-circle-fill me-2"></i>
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    {success && (
                                        <div className="alert alert-success" role="alert">
                                            <i className="bi bi-check-circle-fill me-2"></i>
                                            <span>{success}</span>
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
                                                        placeholder="Enter Staff First Name"
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
                                                    <Label htmlFor="formrow-username-Input"> Username</Label>
                                                    <Input
                                                        type="text"
                                                        name="username"
                                                        className="form-control"
                                                        id="formrow-username-Input"
                                                        placeholder="Enter Staff Username"
                                                        value={formik.values.username}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={
                                                            formik.touched.username && formik.errors.username ? true : false
                                                        }
                                                    />
                                                    {
                                                        formik.errors.username && formik.touched.username ? (
                                                            <FormFeedback type="invalid">{formik.errors.username}</FormFeedback>
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
                                                        placeholder="Enter Staff Email ID"
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
                                                    <Label htmlFor="formrow-password-Input">Password</Label>
                                                    <Input
                                                        type="password"
                                                        name="password"
                                                        className="form-control"
                                                        id="formrow-password-Input"
                                                        placeholder="Enter Staff Password"
                                                        autoComplete="new-password"
                                                        value={formik.values.password}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={
                                                            formik.touched.password && formik.errors.password ? true : false
                                                        }
                                                    />
                                                    {
                                                        formik.errors.password && formik.touched.password ? (
                                                            <FormFeedback type="invalid">{formik.errors.password}</FormFeedback>
                                                        ) : null
                                                    }
                                                </div>
                                            </Col>

                                        </Row>

                                        <Row>
                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-Input-country">Country</Label>
                                                    <Input
                                                        type="text"
                                                        name="country"
                                                        className="form-control"
                                                        id="formrow-Input-country"
                                                        placeholder="Enter Staff Living country"
                                                        value={formik.values.country}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={
                                                            formik.touched.country && formik.errors.country ? true : false
                                                        }
                                                    />
                                                    {
                                                        formik.errors.country && formik.touched.country ? (
                                                            <FormFeedback type="invalid">{formik.errors.country}</FormFeedback>
                                                        ) : null
                                                    }
                                                </div>
                                            </Col>


                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-state-Input">State</Label>
                                                    <select
                                                        name="state"
                                                        id="formrow-state-Input"
                                                        className={`form-control ${formik.touched.state && formik.errors.state ? 'is-invalid' : ''}`}
                                                        value={formik.values.state} // Ensure state id is set here
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                    >
                                                        <option value="">Select State</option>
                                                        {/* Iterate over lga (states list) to display options */}
                                                        {lga.map((sta) => (
                                                            <option key={sta.id} value={sta.name}>
                                                                {sta.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {/* Show validation error */}
                                                    {formik.touched.state && formik.errors.state ? (
                                                        <div className="invalid-feedback">{formik.errors.state}</div>
                                                    ) : null}
                                                </div>
                                            </Col>




                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label className="control-label">Allocated States</Label>
                                                    <Select
                                                        value={selectedStates} // This should contain the currently selected options
                                                        isMulti={true}
                                                        onChange={handleMultiChange}
                                                        options={states} // This should be the list of all states
                                                        className="select2-selection"
                                                    />
                                                </div>
                                            </Col>


                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-dateofbirth-Imput">Date Of Birth</Label>
                                                    <Input
                                                        type="date"
                                                        name="date_of_birth"
                                                        className="form-control"
                                                        id="formrow-dateofbirth-Imput"
                                                        placeholder="Enter Staff Date Of Birth"
                                                        value={formik.values.date_of_birth}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={
                                                            formik.touched.date_of_birth && formik.errors.date_of_birth ? true : false
                                                        }
                                                    />
                                                    {
                                                        formik.errors.date_of_birth && formik.touched.date_of_birth ? (
                                                            <FormFeedback type="invalid">{formik.errors.date_of_birth}</FormFeedback>
                                                        ) : null
                                                    }
                                                </div>
                                            </Col>


                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-gender-Input">Gender</Label>
                                                    <select
                                                        name="gender"
                                                        id="formrow-gender-Input"
                                                        className={`form-control ${formik.touched.gender && formik.errors.gender ? 'is-invalid' : ''}`}
                                                        value={formik.values.gender}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                    >
                                                        <option value="">Select Gender</option> {/* Placeholder option */}
                                                        <option value="Male">Male</option>
                                                        <option value="Female">Female</option>
                                                    </select>

                                                    {/* Display validation error if gender is invalid */}
                                                    {formik.errors.gender && formik.touched.gender ? (
                                                        <FormFeedback type="invalid">{formik.errors.gender}</FormFeedback>
                                                    ) : null}
                                                </div>
                                            </Col>



                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-MaritalStatus-Input">Marital Status</Label>
                                                    <select
                                                        name="marital_status"
                                                        id="formrow-MaritalStatus-Input"
                                                        className={`form-control ${formik.touched.marital_status && formik.errors.marital_status ? 'is-invalid' : ''}`}
                                                        value={formik.values.marital_status}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                    >
                                                        <option value="">Select Marital Status</option> {/* Placeholder option */}
                                                        <option value="Single">Single</option>
                                                        <option value="Married">Married</option>
                                                    </select>

                                                    {/* Display validation error if marital_status is invalid */}
                                                    {formik.errors.marital_status && formik.touched.marital_status ? (
                                                        <FormFeedback type="invalid">{formik.errors.marital_status}</FormFeedback>
                                                    ) : null}
                                                </div>
                                            </Col>

                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-family-Input">Family</Label>
                                                    <select
                                                        name="family"
                                                        id="formrow-family-Input"
                                                        className={`form-control ${formik.touched.family && formik.errors.family ? 'is-invalid' : ''}`}
                                                        value={formik.values.family}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                    >
                                                        <option value="">Select family</option>
                                                        {familys.map((sta) => (
                                                            <option key={sta.id} value={sta.id}>
                                                                {sta.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </Col>




                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-Phone-Input">Phone</Label>
                                                    <Input
                                                        type="text"
                                                        name="phone"
                                                        className="form-control"
                                                        id="formrow-Phone-Input"
                                                        placeholder="Enter Staff Phone"
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

                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-alt-phone-Input">Alt Phone</Label>
                                                    <Input
                                                        type="text"
                                                        name="alternate_number"
                                                        className="form-control"
                                                        id="formrow-alt-phone-Input"
                                                        placeholder="Enter Staff Alternate Phone"
                                                        autoComplete="off"
                                                        value={formik.values.alternate_number}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={
                                                            formik.touched.alternate_number && formik.errors.alternate_number ? true : false
                                                        }
                                                    />
                                                    {
                                                        formik.errors.alternate_number && formik.touched.alternate_number ? (
                                                            <FormFeedback type="invalid">{formik.errors.alternate_number}</FormFeedback>
                                                        ) : null
                                                    }
                                                </div>
                                            </Col>

                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-driving-Input">Driving License</Label>
                                                    <Input
                                                        type="text"
                                                        name="driving_license"
                                                        className="form-control"
                                                        id="formrow-driving-Input"
                                                        placeholder="Enter Staff Driving License No :"
                                                        autoComplete="off"
                                                        value={formik.values.driving_license}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={
                                                            formik.touched.driving_license && formik.errors.driving_license ? true : false
                                                        }
                                                    />
                                                    {
                                                        formik.errors.driving_license && formik.touched.driving_license ? (
                                                            <FormFeedback type="invalid">{formik.errors.driving_license}</FormFeedback>
                                                        ) : null
                                                    }
                                                </div>
                                            </Col>

                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-Driving-date-Input">Driving License Exp Date</Label>
                                                    <Input
                                                        type="date"
                                                        name="driving_license_exp_date"
                                                        className="form-control"
                                                        id="formrow-Driving-date-Input"
                                                        placeholder="Enter Staff Driving License Exp Date :"
                                                        autoComplete="off"
                                                        value={formik.values.driving_license_exp_date}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={
                                                            formik.touched.driving_license_exp_date && formik.errors.driving_license_exp_date ? true : false
                                                        }
                                                    />
                                                    {
                                                        formik.errors.driving_license_exp_date && formik.touched.driving_license_exp_date ? (
                                                            <FormFeedback type="invalid">{formik.errors.driving_license_exp_date}</FormFeedback>
                                                        ) : null
                                                    }
                                                </div>
                                            </Col>

                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-employment-Input">Employment Status</Label>
                                                    <select
                                                        name="employment_status"
                                                        id="formrow-employment-Input"
                                                        className={`form-control ${formik.touched.employment_status && formik.errors.employment_status ? 'is-invalid' : ''}`}
                                                        value={formik.values.employment_status}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                    >
                                                        <option value="">Select Employment Status</option> {/* Placeholder option */}
                                                        <option value="Full-Time">Full-Time</option>
                                                        <option value="Part-Time">Part-Time</option>
                                                        <option value="Internship">Internship</option>
                                                        <option value="Permanent">Permanent</option>
                                                        <option value="Contract">Contract</option>
                                                    </select>

                                                    {/* Show validation message */}
                                                    {formik.errors.employment_status && formik.touched.employment_status ? (
                                                        <FormFeedback type="invalid">{formik.errors.employment_status}</FormFeedback>
                                                    ) : null}
                                                </div>
                                            </Col>



                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-Designation">Designation</Label>
                                                    <Input
                                                        type="text"
                                                        name="designation"
                                                        className="form-control"
                                                        id="formrow-Designation"
                                                        placeholder="Enter Staff Staff designation"
                                                        value={formik.values.designation}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={
                                                            formik.touched.designation && formik.errors.designation ? true : false
                                                        }
                                                    />
                                                    {
                                                        formik.errors.designation && formik.touched.designation ? (
                                                            <FormFeedback type="invalid">{formik.errors.designation}</FormFeedback>
                                                        ) : null
                                                    }
                                                </div>
                                            </Col>


                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-InputJoinDate">Join Date</Label>
                                                    <Input
                                                        type="date" // Set type to "date"
                                                        name="join_date"
                                                        className="form-control"
                                                        id="formrow-InputJoinDate"
                                                        value={formik.values.join_date}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={
                                                            formik.touched.join_date && formik.errors.join_date ? true : false
                                                        }
                                                    />
                                                    {
                                                        formik.errors.join_date && formik.touched.join_date ? (
                                                            <FormFeedback type="invalid">{formik.errors.join_date}</FormFeedback>
                                                        ) : null
                                                    }
                                                </div>
                                            </Col>


                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-ConfirmationDate-Input">Confirmation Date</Label>
                                                    <Input
                                                        type="date" // Set type to "date"
                                                        name="confirmation_date"
                                                        className="form-control"
                                                        id="formrow-ConfirmationDate-Input"
                                                        value={formik.values.confirmation_date}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={
                                                            formik.touched.confirmation_date && formik.errors.confirmation_date ? true : false
                                                        }
                                                    />
                                                    {
                                                        formik.errors.confirmation_date && formik.touched.confirmation_date ? (
                                                            <FormFeedback type="invalid">{formik.errors.confirmation_date}</FormFeedback>
                                                        ) : null
                                                    }
                                                </div>
                                            </Col>

                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-TerminationDate-Input">Termination Date</Label>
                                                    <Input
                                                        type="date" // Set type to "date"
                                                        name="termination_date"
                                                        className="form-control"
                                                        id="formrow-TerminationDate-Input"
                                                        value={formik.values.termination_date}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={
                                                            formik.touched.termination_date && formik.errors.termination_date ? true : false
                                                        }
                                                    />
                                                    {
                                                        formik.errors.termination_date && formik.touched.termination_date ? (
                                                            <FormFeedback type="invalid">{formik.errors.termination_date}</FormFeedback>
                                                        ) : null
                                                    }
                                                </div>
                                            </Col>



                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-Supervisor-Input">Supervisor</Label>
                                                    <select
                                                        name="supervisor_id"
                                                        id="formrow-Supervisor-Input"
                                                        className={`form-control ${formik.touched.supervisor_id && formik.errors.supervisor_id ? 'is-invalid' : ''}`}
                                                        value={formik.values.supervisor_id}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                    >
                                                        <option value="">Select Supervisor</option> {/* Add a default option */}
                                                        {supervisor.length > 0 ? (
                                                            supervisor.map((sup) => (
                                                                <option key={sup.id} value={sup.id}>
                                                                    {sup.name}
                                                                </option>
                                                            ))
                                                        ) : (
                                                            <option disabled>No supervisors available</option>
                                                        )}
                                                    </select>
                                                    {formik.errors.supervisor_id && formik.touched.supervisor_id ? (
                                                        <FormFeedback type="invalid">{formik.errors.supervisor_id}</FormFeedback>
                                                    ) : null}
                                                </div>
                                            </Col>



                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-Department-Input">Department</Label>
                                                    <select
                                                        name="department_id"
                                                        id="formrow-Department-Input"
                                                        className={`form-control ${formik.touched.department_id && formik.errors.department_id ? 'is-invalid' : ''}`}  // Add 'is-invalid' class for Bootstrap validation
                                                        value={formik.values.department_id}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                    >
                                                        <option value="">Select Department</option> {/* Add a default option */}
                                                        {department.length > 0 ? (
                                                            department.map((dept) => (
                                                                <option key={dept.id} value={dept.id}>
                                                                    {dept.name}
                                                                </option>
                                                            ))
                                                        ) : (
                                                            <option disabled>No departments available</option>
                                                        )}
                                                    </select>
                                                    {formik.errors.department_id && formik.touched.department_id ? (
                                                        <FormFeedback type="invalid">{formik.errors.department_id}</FormFeedback>
                                                    ) : null}
                                                </div>
                                            </Col>




                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-status-Input">Approval Status</Label>
                                                    <select
                                                        name="approval_status"
                                                        id="formrow-status-Input"
                                                        className={`form-control ${formik.touched.approval_status && formik.errors.approval_status ? 'is-invalid' : ''}`}
                                                        value={formik.values.approval_status}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                    >
                                                        <option value="">Select Status</option> {/* Add a default option */}
                                                        <option value="approved">Active</option>
                                                        <option value="disapproved">Inactive</option>
                                                    </select>
                                                    {formik.errors.approval_status && formik.touched.approval_status ? (
                                                        <FormFeedback type="invalid">{formik.errors.approval_status}</FormFeedback>
                                                    ) : null}
                                                </div>
                                            </Col>



                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-Signature-Input">Signature Upload</Label>
                                                    <Input
                                                        type="file"
                                                        name="signatur_up"
                                                        id="formrow-Signature-Input"
                                                        onChange={(event) => {
                                                            formik.setFieldValue("signatur_up", event.currentTarget.files[0]);
                                                        }}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.signatur_up && formik.errors.signatur_up ? true : false}
                                                    />
                                                    {formik.errors.signatur_up && formik.touched.signatur_up ? (
                                                        <FormFeedback type="invalid">{formik.errors.signatur_up}</FormFeedback>
                                                    ) : null}
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
                                        <div className="mb-3">
                                            <Button type="submit" color="primary" disabled={formik.isSubmitting}>
                                                {formik.isSubmitting ? "Submitting..." : "Submit"}
                                            </Button>
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
