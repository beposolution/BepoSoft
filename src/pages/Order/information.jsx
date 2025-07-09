import React, { useEffect, useState } from 'react';
import { useRef } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useParams } from "react-router-dom";
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import {
    Row,
    Col,
    Card,
    CardBody,
    CardTitle,
    Form,
    Input,
    Label,
    FormFeedback,
} from 'reactstrap';


const UpdateInformationPage = ({ refreshData }) => {
    const token = localStorage.getItem("token");
    const { id } = useParams();
    const [customerAddresses, setCustomerAddresses] = useState([]);
    const [statusOptions, setStatusOptions] = useState([]);
    const [role, setRole] = useState(null);
    const originalValuesRef = useRef({});

    useEffect(() => {
        const role = localStorage.getItem("active");
        setRole(role);
    }, []);

    const formik = useFormik({
        initialValues: {
            status: '',
            billing_address: '',
            note: '',
        },
        validationSchema: Yup.object({
            status: Yup.string().required('Status is required'),
            // billing_address: Yup.string().required('Address is required'),
            // note: Yup.string().max(500, 'Note cannot exceed 500 characters'),
        }),
        onSubmit: async (values) => {
            const payload = {};
            const original = originalValuesRef.current;

            // Compare each field
            if (values.status && values.status !== original.status) {
                payload.status = values.status;
            }
            if (values.billing_address && values.billing_address !== original.billing_address) {
                payload.billing_address = values.billing_address;
            }
            if (values.note && values.note !== original.note) {
                payload.note = values.note;
            }

            if (Object.keys(payload).length === 0) {
                toast.info("No changes to update.");
                return;
            }

            try {
                await axios.put(
                    `${import.meta.env.VITE_APP_KEY}shipping/${id}/order/`,
                    payload,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                toast.success("Order information updated successfully!");
                if (refreshData) {
                    refreshData();
                }
            } catch (error) {
                toast.error("Error updating order!");
            }
        }
    });

    useEffect(() => {
        const active = localStorage.getItem("active");
        if (active === "BDO") {
            setStatusOptions(["Invoice Approved"]);
        } else {
            setStatusOptions([
                "Invoice Created",
                "Invoice Approved",
                "Waiting For Confirmation",
                "To Print",
                'Packing under progress',
                'Packed',
                'Ready to ship',
                'Shipped',
                "Invoice Rejected",
            ]);
        }
    }, []);


    useEffect(() => {
    }, [])

    useEffect(() => {
        const fetchOrderAndCustomerData = async () => {
            try {
                // Step 1: Fetch order data
                const orderResponse = await axios.get(`${import.meta.env.VITE_APP_KEY}order/${id}/items/`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                // Access order and customer details from the response
                const orderData = orderResponse.data.order;
                const { status, note, billing_address } = orderData;
                const customerId = orderData.customerID;

                // Set initial form values with status and note
                formik.setValues({
                    status: status || '',
                    billing_address: billing_address?.id || '',
                    note: note || '',
                });

                originalValuesRef.current = {
                    status: status || '',
                    billing_address: billing_address?.id || '',
                    note: note || '',
                };

                // Step 2: Fetch customer shipping addresses
                const customerResponse = await axios.get(`${import.meta.env.VITE_APP_KEY}add/customer/address/${customerId}/`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                setCustomerAddresses(customerResponse.data.data); // Assuming this returns an array of addresses

            } catch (error) {
                toast.error("Error fetching data:");
            }
        };

        fetchOrderAndCustomerData();
    }, [id, token]);


    return (
        <Row>
            <Col xl={12}>
                <Card>
                    <CardBody>
                        <CardTitle className="mb-4">UPDATE INFORMATION</CardTitle>

                        <Form onSubmit={formik.handleSubmit}>
                            <Row>
                                <>
                                    {(role === "ADMIN" || role === "BDM" || role === "Accounts / Accounting") && (
                                        <>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-status-select">STATUS</Label>
                                                    <Input
                                                        type="select"
                                                        name="status"
                                                        className="form-control"
                                                        id="formrow-status-select"
                                                        value={formik.values.status}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.status && formik.errors.status}
                                                    >
                                                        <option value="">Select Status</option>
                                                        {(() => {
                                                            let filteredOptions = [];

                                                            if (formik.values.status === "Invoice Rejected") {
                                                                filteredOptions = [...statusOptions];
                                                            } else {
                                                                const selectedIndex = statusOptions.indexOf(formik.values.status);
                                                                if (selectedIndex !== -1) {
                                                                    filteredOptions = statusOptions.slice(selectedIndex, selectedIndex + 2);
                                                                } else {
                                                                    filteredOptions = statusOptions.slice(0, 2);
                                                                }

                                                                if (!filteredOptions.includes("Invoice Rejected")) {
                                                                    filteredOptions.push("Invoice Rejected");
                                                                }
                                                            }
                                                            return filteredOptions.map((option, index) => (
                                                                <option key={index} value={option}>
                                                                    {option}
                                                                </option>
                                                            ));
                                                        })()}
                                                    </Input>
                                                    {formik.errors.status && formik.touched.status ? (
                                                        <FormFeedback type="invalid">{formik.errors.status}</FormFeedback>
                                                    ) : null}
                                                </div>
                                            </Col>


                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-address-select">ADDRESS</Label>
                                                    <Input
                                                        type="select"
                                                        name="billing_address"
                                                        className="form-control"
                                                        id="formrow-billing_address-select"
                                                        value={formik.values.billing_address}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.billing_address && formik.errors.billing_address}
                                                    >
                                                        <option value="">Select Address</option>
                                                        {customerAddresses.map((addr) => (
                                                            <option key={addr.id} value={addr.id}>
                                                                {addr.name}-{addr.city}-{addr.state}-{addr.zipcode}-{addr.address}-{addr.phone}-{addr.email}
                                                            </option>
                                                        ))}
                                                    </Input>
                                                </div>
                                            </Col>
                                        </>
                                    )}
                                </>
                                <Col md={12}>
                                    <div className="mb-3">
                                        <Label htmlFor="formrow-note-Input">NOTE</Label>
                                        <Input
                                            type="textarea"
                                            name="note"
                                            className="form-control"
                                            id="formrow-note-Input"
                                            placeholder="Add a note"
                                            value={formik.values.note}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            invalid={formik.touched.note && formik.errors.note}
                                        />
                                    </div>
                                </Col>
                            </Row>

                            <div>
                                <button type="submit" className="btn btn-primary w-md">
                                    Save Changes
                                </button>
                            </div>
                        </Form>
                    </CardBody>
                    <ToastContainer />
                </Card>
            </Col>
        </Row>
    );
};

export default UpdateInformationPage;
