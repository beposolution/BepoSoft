import React, { useEffect, useState } from 'react';
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

const UpdateInformationPage = () => {
    const token = localStorage.getItem("token");
    const { id } = useParams();
    const [customerAddresses, setCustomerAddresses] = useState([]);
    const [statusOptions, setStatusOptions] = useState([]);

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
            try {
                const response = await axios.put(
                    `${import.meta.env.VITE_APP_KEY}shipping/${id}/order/`,
                    values,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                toast.success("Order information updated successfully!"); 
            } catch (error) {
                toast.error("Error updating order!",error);
                // Optionally, handle the error or display an error message
            }
        },
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
                "Invoice Rejected",
                'Packing under progress',
                'Packed',
                'Ready to ship',
                'Shipped',
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
                const { status, note } = orderData;
                const customerId = orderData.customerID;

                // Set initial form values with status and note
                formik.setValues({ status, address: '', note });

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
                                            {statusOptions.map((option, index) => (
                                                <option key={index} value={option}>
                                                    {option}
                                                </option>
                                            ))}
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
                                        {formik.errors.billing_address && formik.touched.billing_address ? (
                                            <FormFeedback type="invalid">{formik.errors.billing_address}</FormFeedback>
                                        ) : null}
                                    </div>
                                </Col>

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
                                        {formik.errors.note && formik.touched.note ? (
                                            <FormFeedback type="invalid">{formik.errors.note}</FormFeedback>
                                        ) : null}
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
