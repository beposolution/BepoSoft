import axios from 'axios';
import {
    Card, Col, Container, Row, CardBody, CardTitle, Label, Form, Input, FormFeedback, Button
} from "reactstrap";
import * as Yup from 'yup';
import { useFormik } from "formik";
import React, { useState, useEffect } from "react";
import { FiCheckCircle, FiXCircle } from 'react-icons/fi'; // Importing icons

// Import Breadcrumb
import Breadcrumbs from "../../components/Common/Breadcrumb";

const FormLayouts = () => {
    // Meta title
    document.title = "Supervisor Registration | Beposoft";

    // State declarations
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [staffs, setStaffs] = useState([]);
    const token = localStorage.getItem("token"); 
    // Fetch departments on component mount
    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const departmentResponse = await axios.get(`${import.meta.env.VITE_APP_KEY}departments/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const staffResponse = await axios.get(`${import.meta.env.VITE_APP_KEY}staffs/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setDepartments(departmentResponse.data.data); 
                setStaffs(staffResponse.data.data);
            } catch (error) {
                setError("Failed to load departments");
            }
        };
        fetchDepartments();
    }, [token]);

    // Formik setup
    const formik = useFormik({
        initialValues: {
            name: "",
            department: "", // Will hold the department ID
        },
        validationSchema: Yup.object({
            name: Yup.string().required("This field is required"),
            department: Yup.string().required("This field is required"), // Validate department selection
        }),
        onSubmit: async (values) => {
            setLoading(true);
            setError(null);
            setSuccess(null);
            
            try {
                // Ensure you're sending the correct data structure
                const dataToPost = {
                    name: values.name,
                    department: values.department, // Send the department ID directly
                };

                const response = await axios.post(`${import.meta.env.VITE_APP_KEY}add/supervisor/`, dataToPost, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.status === 201) {
                    setSuccess("Supervisor registered successfully");
                    formik.resetForm();
                } else {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
            } catch (error) {
                setError(error.message || "Failed to register supervisor");
            } finally {
                setLoading(false);
            }
        }
    });

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid={true}>
                    <Breadcrumbs title="Forms" breadcrumbItem="Supervisor Form" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="mb-4">Supervisor Registration Form</CardTitle>
                                    
                                    {/* Display success message with icon */}
                                    {success && (
                                        <div className="alert alert-success d-flex align-items-center">
                                            <FiCheckCircle className="me-2" size={20} />
                                            <span>{success}</span>
                                        </div>
                                    )}
                                    
                                    {/* Display error message with icon */}
                                    {error && (
                                        <div className="alert alert-danger d-flex align-items-center">
                                            <FiXCircle className="me-2" size={20} />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    <Form onSubmit={formik.handleSubmit}>
                                        <Row>
                                        <Col md={12}>
                                                <div className="mb-3">
                                                    <Label htmlFor="name">Staff</Label>
                                                    <select
                                                        name="name"
                                                        id="name"
                                                        className="form-control"
                                                        value={formik.values.name} // Sends department ID
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                    >
                                                        <option value="">Select a staff</option>
                                                        {staffs.map((staf) => (
                                                            <option key={staf.id} value={staf.name}>
                                                                {staf.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {formik.touched.name && formik.errors.name ? (
                                                        <FormFeedback>{formik.errors.name}</FormFeedback>
                                                    ) : null}
                                                </div>
                                            </Col>

                                            <Col md={12}>
                                                <div className="mb-3">
                                                    <Label htmlFor="department">Department</Label>
                                                    <select
                                                        name="department"
                                                        id="department"
                                                        className="form-control"
                                                        value={formik.values.department} // Sends department ID
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                    >
                                                        <option value="">Select a Department</option>
                                                        {departments.map((dept) => (
                                                            <option key={dept.id} value={dept.id}>
                                                                {dept.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {formik.touched.department && formik.errors.department ? (
                                                        <FormFeedback>{formik.errors.department}</FormFeedback>
                                                    ) : null}
                                                </div>
                                            </Col>
                                        </Row>

                                        <div className="mb-3">
                                            <Button type="submit" color="primary" disabled={loading}>
                                                {loading ? 'Submitting...' : 'Submit'}
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
