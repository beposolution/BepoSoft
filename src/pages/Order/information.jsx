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

    const logChanges = async (beforeObj, afterObj) => {
        try {
            await axios.post(
                `${import.meta.env.VITE_APP_KEY}datalog/create/`,
                {
                    order: Number(id),
                    before_data: beforeObj,
                    after_data: afterObj,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (err) {
            console.warn("DataLog write failed:", err?.response?.data || err.message);
        }
    };

    const formik = useFormik({
        initialValues: {
            status: '',
            billing_address: '',
            note: '',
            accounts_note: '',
        },
        validationSchema: Yup.object({
            status: Yup.string().required('Status is required'),
            // billing_address: Yup.string().required('Address is required'),
            // note: Yup.string().max(500, 'Note cannot exceed 500 characters'),
        }),
        // 2) replace your onSubmit with this version
        onSubmit: async (values) => {
            const payload = {};
            const original = originalValuesRef.current;

            // detect changes (add any new fields here if needed)
            ["status", "billing_address", "note", "accounts_note"].forEach((key) => {
                const before = original?.[key] ?? "";
                const after = values?.[key] ?? "";
                if (after !== "" && after !== before) {
                    payload[key] = after;
                }
            });

            if (Object.keys(payload).length === 0) {
                toast.info("No changes to update.");
                return;
            }

            // build delta snapshots for the log
            const beforeDelta = {};
            const afterDelta = {};
            Object.keys(payload).forEach((k) => {
                beforeDelta[k] = original?.[k] ?? null;
                afterDelta[k] = values?.[k] ?? null;
            });

            try {
                // 1) update the order
                await axios.put(
                    `${import.meta.env.VITE_APP_KEY}shipping/${id}/order/`,
                    payload,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                // 2) write the data log (any changed fields)
                // build delta snapshots for the log
                const beforeDelta = {};
                const afterDelta = {};
                Object.keys(payload).forEach((k) => {
                    let beforeVal = original?.[k] ?? null;
                    let afterVal = values?.[k] ?? null;

                    // special case: billing_address, replace ID with label
                    if (k === "billing_address") {
                        const beforeObj = customerAddresses.find(a => a.id === Number(beforeVal));
                        const afterObj = customerAddresses.find(a => a.id === Number(afterVal));
                        beforeVal = beforeObj
                            ? `${beforeObj.name}-${beforeObj.city}-${beforeObj.state}-${beforeObj.zipcode}-${beforeObj.address}-${beforeObj.phone}-${beforeObj.email}`
                            : beforeVal;
                        afterVal = afterObj
                            ? `${afterObj.name}-${afterObj.city}-${afterObj.state}-${afterObj.zipcode}-${afterObj.address}-${afterObj.phone}-${afterObj.email}`
                            : afterVal;
                    }

                    beforeDelta[k] = beforeVal;
                    afterDelta[k] = afterVal;
                });

                // then send to datalog
                await logChanges(beforeDelta, afterDelta);

                toast.success("Order information updated successfully!");
                if (refreshData) refreshData();

                // 3) sync originals so future diffs work
                originalValuesRef.current = { ...originalValuesRef.current, ...payload };
            } catch (error) {
                toast.error("Error updating order!");
                console.warn(error?.response?.data || error.message);
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
                const { status, note, billing_address, accounts_note } = orderData;
                const customerId = orderData.customerID;

                // Set initial form values with status and note
                formik.setValues({
                    status: status || '',
                    billing_address: billing_address?.id || '',
                    note: note || '',
                    accounts_note: accounts_note || '',
                });

                originalValuesRef.current = {
                    status: status || '',
                    billing_address: billing_address?.id || '',
                    note: note || '',
                    accounts_note: accounts_note || '',
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
                                    {(role === "ADMIN" || role === "BDM" || role === "Accounts / Accounting" || role === "Marketing" || role === "CEO" || role === 'COO') && (
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
                                <>
                                    <Col md={12}>
                                        <div className="mb-3">
                                            <Label htmlFor="formrow-note-Input">WAREHOUSE NOTE</Label>
                                            <Input
                                                type="textarea"
                                                name="note"
                                                className="form-control"
                                                id="formrow-note-Input"
                                                placeholder="Add a note"
                                                value={formik.values.note}
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                                disabled={
                                                    (role === "BDM" || role === "BDO") &&
                                                    !["Invoice Created"].includes(formik.values.status)
                                                }
                                                invalid={formik.touched.note && formik.errors.note}
                                            />
                                        </div>
                                    </Col>
                                    <Col md={12}>
                                        <div className="mb-3">
                                            <Label htmlFor="formrow-note-Input">ACCOUNTS NOTE</Label>
                                            <Input
                                                type="textarea"
                                                name="accounts_note"
                                                className="form-control"
                                                id="formrow-note-Input"
                                                placeholder="Add a note"
                                                value={formik.values.accounts_note}
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                                disabled={
                                                    (role === "BDM" || role === "BDO") &&
                                                    !["Invoice Created"].includes(formik.values.status)
                                                }
                                                invalid={formik.touched.accounts_note && formik.errors.accounts_note}
                                            />
                                        </div>
                                    </Col>
                                </>
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
