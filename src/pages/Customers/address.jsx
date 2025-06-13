import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, Col, Container, Row, CardBody, Label, Form, Input, FormFeedback, CardTitle, Button, Modal, ModalHeader, ModalBody, ModalFooter, Table } from "reactstrap";
import * as Yup from 'yup';
import { useFormik } from "formik";
import { useParams } from "react-router-dom";
//Import Breadcrumb
import Breadcrumbs from "../../components/Common/Breadcrumb";

const FormLayouts = () => {
    //meta title
    document.title = "Customer address | Beposoft & Dashboard ";

    const [state, setState] = useState([]);
    const [customerAddress, setCustomerAddress] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);  // Stores the message
    const [messageType, setMessageType] = useState("");  // "success" or "danger"

    const [modal, setModal] = useState(false); // Modal state
    const [currentAddress, setCurrentAddress] = useState(null); // Holds the current address to be edited

    const token = localStorage.getItem("token");
    const { id } = useParams();

    // Toggle modal visibility
    const toggle = () => setModal(!modal);

    const formik = useFormik({
        initialValues: {
            name: "",
            email: "",
            city: "",
            phone: "",
            state: "",
            zipcode: "",
            address: "",
            country: "",
            customer: id,
            check: ""
        },
        validationSchema: Yup.object({
            name: Yup.string().required("This field is required"),
            email: Yup.string().email().required("Please Enter Your Email"),
            city: Yup.string().required("This field is required"),
            state: Yup.string().required("This field is required"),
            zipcode: Yup.string().required("This field is required"),
            address: Yup.string().required("This Address is required"),
            country: Yup.string().required("This country is required"),
            phone: Yup.string()
                .matches(/^[0-9]{10}$/, "Phone number must be exactly 10 digits")
                .required("This field is required"),
            check: Yup.boolean().oneOf([true], "You must accept the terms")
        }),
        onSubmit: async (values, { resetForm }) => {
            try {
                const response = await axios.post(
                    `${import.meta.env.VITE_APP_KEY}add/customer/address/${id}/`,
                    values,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
    
                if (response.status === 200 || response.status === 201) {
                    // Optimistically update the state
                    setCustomerAddress(prevAddresses => [
                        ...prevAddresses,
                        { ...values, id: response.data.id } // Assuming response contains the new address ID
                    ]);
                    setMessage("Customer address submitted successfully!");
                    setMessageType("success");
                    resetForm();
                } else {
                    throw new Error("Submission failed.");
                }
            } catch (error) {
                setMessage("Failed to submit the form. Please try again.");
                setMessageType("danger");
                console.error(error);
            }
        }
    });
    

    const handleDeleteAddress = async (id) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this address?");
        if (confirmDelete) {
            try {
                const response = await axios.delete(`${import.meta.env.VITE_APP_KEY}update/customer/address/${id}/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
    
                if (response.status === 200) { // Check for successful deletion (204 No Content)
                    const updatedAddresses = customerAddress.filter(address => address.id !== id);
                    setCustomerAddress(updatedAddresses);
                    alert('Address deleted successfully!');
                } else {
                    alert('Failed to delete the address. Please try again.');
                }
            } catch (error) {
                console.error("There was an error deleting the address:", error);
                alert('Error deleting the address. Please try again.');
            }
        }
    };
    


    // Fetch states from API
    useEffect(() => { 
        const fetchData = async () => {
            setLoading(true); // Set loading to true at the start of fetch
            try {
                const responseState = await axios.get(`${import.meta.env.VITE_APP_KEY}states/`, { headers: { 'Authorization': `Bearer ${token}` } });
                const responseAddress = await axios.get(`${import.meta.env.VITE_APP_KEY}add/customer/address/${id}/`, { headers: { 'Authorization': `Bearer ${token}` } });
    
                if (responseState.status === 200) {
                    setState(responseState.data.data);
                } else {
                    throw new Error(`HTTP error! Status: ${responseState.status}`);
                }
    
                if (responseAddress.status === 200) {
                    setCustomerAddress(responseAddress.data.data);
                } else {
                    throw new Error(`HTTP error! Status: ${responseAddress.status}`);
                }
            } catch (error) {
                setError(error.message || "Failed to fetch states");
            } finally {
                setLoading(false); // Set loading to false after fetching
            }
        };
    
        fetchData();
    }, [token, id]); // Add id to dependencies
    


    // Handle edit address click (opens modal with data)
    const handleEditAddress = (address) => {
        setCurrentAddress(address);  // Set the current address data to edit
        toggle();  // Open the modal
    };

    // Handle update form submission
    const handleUpdateAddress = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.put(
                `${import.meta.env.VITE_APP_KEY}update/cutomer/address/${currentAddress.id}/`,
                currentAddress,  // Use currentAddress state to send updated data
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (response.status === 200) {
                // Update the customerAddress state with the new data
                const updatedAddresses = customerAddress.map(address => address.id === currentAddress.id ? currentAddress : address);
                setCustomerAddress(updatedAddresses);
                toggle();  // Close the modal
                alert('Address updated successfully!');
            }
        } catch (error) {
            console.error("Error updating the address:", error);
            alert('Failed to update the address. Please try again.');
        }
    };


    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid={true}>
                    <Breadcrumbs title="Forms" breadcrumbItem="CUSTOMER SHIPPING ADDRESS" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    {message && (
                                        <div className={`alert alert-${messageType} mt-3`} role="alert">
                                            {messageType === "success" ? (
                                                <span role="img" aria-label="success">✅</span>
                                            ) : (
                                                <span role="img" aria-label="error">❌</span>
                                            )}
                                            {message}
                                        </div>
                                    )}
                                    <Form onSubmit={formik.handleSubmit}>
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

                                        <Row>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-email-Input">EMAIL</Label>
                                                    <Input
                                                        type="email"
                                                        name="email"
                                                        className="form-control"
                                                        id="formrow-email-Input"
                                                        placeholder="Enter Your Email ID"
                                                        value={formik.values.email}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.email && formik.errors.email}
                                                    />
                                                    {formik.errors.email && formik.touched.email && (
                                                        <FormFeedback>{formik.errors.email}</FormFeedback>
                                                    )}
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-country-Input">COUNTRY</Label>
                                                    <Input
                                                        type="text"
                                                        name="country"
                                                        className="form-control"
                                                        id="formrow-country-Input"
                                                        placeholder="Enter Country"
                                                        value={formik.values.country}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.country && formik.errors.country}
                                                    />
                                                    {formik.errors.country && formik.touched.country && (
                                                        <FormFeedback>{formik.errors.country}</FormFeedback>
                                                    )}
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-phone-Input">PHONE</Label>
                                                    <Input
                                                        type="text"
                                                        name="phone"
                                                        className="form-control"
                                                        id="formrow-phone-Input"
                                                        placeholder="Enter Your Phone Number"
                                                        value={formik.values.phone}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.phone && formik.errors.phone}
                                                    />
                                                    {formik.errors.phone && formik.touched.phone && (
                                                        <FormFeedback>{formik.errors.phone}</FormFeedback>
                                                    )}
                                                </div>
                                            </Col>

                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-city-Input">CITY</Label>
                                                    <Input
                                                        type="text"
                                                        name="city"
                                                        className="form-control"
                                                        id="formrow-city-Input"
                                                        placeholder="Enter Your City"
                                                        value={formik.values.city}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.city && formik.errors.city}
                                                    />
                                                    {formik.errors.city && formik.touched.city && (
                                                        <FormFeedback>{formik.errors.city}</FormFeedback>
                                                    )}
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-InputAddress">ADDRESS</Label>
                                                    <Input
                                                        type="text"
                                                        name="address"
                                                        className="form-control"
                                                        id="formrow-InputAddress"
                                                        placeholder="Enter Address"
                                                        value={formik.values.address}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.address && formik.errors.address}
                                                    />
                                                    {formik.errors.address && formik.touched.address && (
                                                        <FormFeedback>{formik.errors.address}</FormFeedback>
                                                    )}
                                                </div>
                                            </Col>

                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-InputState">STATE</Label>
                                                    <select
                                                        name="state"
                                                        id="formrow-InputState"
                                                        className="form-control"
                                                        value={formik.values.state}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                    >
                                                        <option value="">Choose...</option>
                                                        {state.map((st) => (
                                                            <option key={st.id} value={st.id}>
                                                                {st.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {formik.errors.state && formik.touched.state && (
                                                        <span className="text-danger">{formik.errors.state}</span>
                                                    )}
                                                </div>
                                            </Col>

                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-InputZip">ZIP CODE</Label>
                                                    <Input
                                                        type="text"
                                                        name="zipcode"
                                                        className="form-control"
                                                        id="formrow-InputZip"
                                                        placeholder="Enter Your Zip Code"
                                                        value={formik.values.zipcode}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.zipcode && formik.errors.zipcode}
                                                    />
                                                    {formik.errors.zipcode && formik.touched.zipcode && (
                                                        <FormFeedback>{formik.errors.zipcode}</FormFeedback>
                                                    )}
                                                </div>
                                            </Col>
                                        </Row>

                                        <div className="mb-3">
                                            <div className="form-check">
                                                <Input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    id="formrow-customCheck"
                                                    name="check"
                                                    value={formik.values.check}
                                                    onChange={formik.handleChange}
                                                    onBlur={formik.handleBlur}
                                                    invalid={formik.touched.check && formik.errors.check}
                                                />
                                                <Label className="form-check-label" htmlFor="formrow-customCheck">
                                                    Check me out
                                                </Label>
                                            </div>
                                            {formik.errors.check && formik.touched.check && (
                                                <FormFeedback>{formik.errors.check}</FormFeedback>
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
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="h4">Customer Address  </CardTitle>

                                    <div className="table-responsive">
                                        <Table className="table mb-0">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Name</th>
                                                    <th>Phone</th>
                                                    <th>Address</th>
                                                    <th>ZIP CODE</th>
                                                    <th>Email</th>
                                                    <th>State</th>
                                                    <th>Delete</th>
                                                    <th>Update</th>

                                                </tr>
                                            </thead>
                                            <tbody>
                                                {customerAddress.map((address, index) => (
                                                    <tr>
                                                        <th scope="row">{index + 1}</th>
                                                        <td>{address.name}</td>
                                                        <td>{address.phone}</td>
                                                        <td>{address.address}</td>
                                                        <td>{address.zipcode}</td>
                                                        <td>{address.email}</td>
                                                        <td>{address.state}</td>
                                                        <td>
                                                            <i className="bx bxs-trash-alt" style={{ fontSize: '1.5rem' }} onClick={() => handleDeleteAddress(address.id)}></i>
                                                        </td>
                                                        <td>
                                                            <i className="bx bx-edit-alt" style={{ fontSize: '1.5rem', cursor: 'pointer' }} onClick={() => handleEditAddress(address)}></i>
                                                        </td>

                                                    </tr>
                                                ))}

                                            </tbody>
                                        </Table>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    <Modal isOpen={modal} toggle={toggle}>
                        <ModalHeader toggle={toggle}>Edit Address</ModalHeader>
                        <Form onSubmit={handleUpdateAddress}>
                            <ModalBody>
                                <Label for="name">Name</Label>
                                <Input
                                    type="text"
                                    name="name"
                                    id="name"
                                    value={currentAddress?.name || ''}
                                    onChange={(e) => setCurrentAddress({ ...currentAddress, name: e.target.value })}
                                />
                                <Label for="phone" className="mt-2">Phone</Label>
                                <Input
                                    type="text"
                                    name="phone"
                                    id="phone"
                                    value={currentAddress?.phone || ''}
                                    onChange={(e) => setCurrentAddress({ ...currentAddress, phone: e.target.value })}
                                />
                                <Label for="address" className="mt-2">Address</Label>
                                <Input
                                    type="text"
                                    name="address"
                                    id="address"
                                    value={currentAddress?.address || ''}
                                    onChange={(e) => setCurrentAddress({ ...currentAddress, address: e.target.value })}
                                />
                                <Label for="zipcode" className="mt-2">Email</Label>
                                <Input
                                    type="email"
                                    name="email"
                                    id="email"
                                    value={currentAddress?.email || ''}
                                    onChange={(e) => setCurrentAddress({ ...currentAddress, email: e.target.value })}
                                />

                                <Label for="zipcode" className="mt-2">Country</Label>
                                <Input
                                    type="text"
                                    name="country"
                                    id="country"
                                    value={currentAddress?.country || ''}
                                    onChange={(e) => setCurrentAddress({ ...currentAddress, country: e.target.value })}
                                />

                                <Label for="zipcode" className="mt-2">ZIP Code</Label>
                                <Input
                                    type="text"
                                    name="zipcode"
                                    id="zipcode"
                                    value={currentAddress?.zipcode || ''}
                                    onChange={(e) => setCurrentAddress({ ...currentAddress, zipcode: e.target.value })}
                                />

                                <Label for="zipcode" className="mt-2">City</Label>
                                <Input
                                    type="text"
                                    name="city"
                                    id="city"
                                    value={currentAddress?.city || ''}
                                    onChange={(e) => setCurrentAddress({ ...currentAddress, city: e.target.value })}
                                />


                                <Label for="state" className="mt-2">State</Label>
                                <select
                                    name="state"
                                    id="state"
                                    className="form-control"
                                    value={currentAddress?.state || ''}
                                    onChange={(e) => setCurrentAddress({ ...currentAddress, state: e.target.value })}
                                >
                                    <option value="">Choose State...</option>
                                    {state.map((st) => (
                                        <option key={st.id} value={st.id}>
                                            {st.name}
                                        </option>
                                    ))}
                                </select>

                            </ModalBody>
                            <ModalFooter>
                                <Button type="submit" color="primary">Update</Button>
                                <Button color="secondary" onClick={toggle}>Cancel</Button>
                            </ModalFooter>
                        </Form>
                    </Modal>

                </Container>
            </div>
        </React.Fragment>
    );
};

export default FormLayouts;
