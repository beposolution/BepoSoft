import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, Col, Container, Row, CardBody, Button, CardTitle, Label, ModalHeader, Modal, Form, Input, Table, FormFeedback, ModalBody } from "reactstrap";
import { FaFileInvoice, FaCalendarAlt, FaUser, FaDollarSign, FaUniversity, FaIdBadge, FaUserCheck, FaUserPlus, FaStickyNote } from "react-icons/fa";
import * as Yup from 'yup';
import { useFormik } from "formik";
import axios from 'axios';
import AddProduct from "./AddCreatedOrderProducts";
import Information from "./information"
import Paymentrecipent from "./PaymentRecipt"


// Import Breadcrumb
import Breadcrumbs from "../../components/Common/Breadcrumb";

const FormLayouts = () => {

    // meta title
    document.title = "Form Layouts | Skote - Vite React Admin & Dashboard Template";
    const { id } = useParams(); // Get the order ID from URL params
    const [orderItems, setOrderItems] = React.useState([]);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const toggleModal = () => setModalOpen(!modalOpen);
    const [modalOpen, setModalOpen] = useState(false);
    const [totalAmount, setTotalAmount] = useState(0);
    const [totalDiscountAmount, setTotalDiscountAmount] = useState(0);
    const [totalNetPrice, settotalNetPrice] = useState(0);
    const [NetAmountBeforTax, setNetAmountBeforTax] = useState(0);
    const [TaxAmount, setTaxAmount] = useState(0);
    const [shippingCharge, setShippingCharge] = useState(0);
    const [paymentReceipts, setpaymentReceipts] = useState("");

    const [modal, setModal] = useState(false);
    const toggleReciptModal = () => setIsOpen(!isOpen);
    const [isOpen, setIsOpen] = useState(false);
    const currentDate = new Date().toISOString().split("T")[0];
    const [banks, setBanks] = useState([]);
    const [selectedBank, setSelectedBank] = useState('');
    const [role, setRole] = useState(null);

    // Toggle modal visibility



    const [bankDetails, setBankDetails] = useState({
        name: "",
        accountNumber: "",
        ifscCode: "",
        Branch: "",
    });
    const [shippingAddress, setShippingAddress] = useState({
        name: "",
        address: "",
        city: "",
        state: "",
        zip_code: "",
        country: "",
        phone: "",
        email: "",

    });
    const [billingAddress, setBillingAddress] = useState({
        name: "",
        phone: "",
        gst: "",
        address: "",
        zipcode: "",
        email: "",
    })




    const formik = useFormik({
        initialValues: {
            invoice: "",
            status: "",
            manage_staff: "",
            order_date: "",
            company: "",
            code_charge: "",
            shipping_mode: "",
            check: ""
        },
        validationSchema: Yup.object({
            invoice: Yup.string().required("This field is required"),
            status: Yup.string().required("Please Enter Your Email"),
            manage_staff: Yup.string().required("This field is required"),
            order_date: Yup.string().required("This field is required"),
            company: Yup.string().required("This field is required"),
            code_charge: Yup.string().required("This field is required"),
            shipping_mode: Yup.string().required("This field is required"),
            check: Yup.string().required("This field is required"),
        }),

        onSubmit: async (values) => {
            try {
                // Calculate the total amount
                const subtotal = values.items.reduce((sum, item) => {
                    const itemTotal = item.quantity * (item.rate - item.discount);
                    return sum + itemTotal;
                }, 0);

                const totalAmount = subtotal + parseFloat(values.shipping_charge || 0);

                // Make the PUT request to save data
                const response = await fetch(`${import.meta.env.VITE_APP_KEY}shipping/${id}/order/`, {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        code_charge: values.code_charge,
                        shipping_mode: values.shipping_mode,
                        shipping_charge: values.shipping_charge,
                        total_amount: totalAmount, // Save the total amount
                    }),
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();
                console.log("Response:", data);

                setSuccessMessage("Form submitted successfully!");
            } catch (error) {
                console.error("Error submitting form data:", error);
                setErrorMessage("Failed to submit the form. Please try again.");
                setSuccessMessage("");
            }
        }

    });

    const [isAddDisabled, setIsAddDisabled] = useState(false);

    useEffect(() => {
        const role = localStorage.getItem("active");
        setRole(role);
        if (role === "BDM" || role === "BDO") {
            setIsAddDisabled(true);
        }
    }, []);

    useEffect(() => {
        const fetchBanks = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_APP_KEY}banks/`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();
                setBanks(data.data);

            } catch (error) {
                console.error("Error fetching banks:", error);
            }
        };

        fetchBanks();
    }, []);




    // Fetch order data when component mounts or id changes
    const fetchOrderData = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_APP_KEY}order/${id}/items/`, {
                method: 'GET',
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem('token')}`,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                throw new Error("Error fetching order data");
            }

            const data = await response.json();
            console.log("Fetched data:", data);

            if (data.order) {
                formik.setValues({
                    invoice: data.order.invoice || "",
                    status: data.order.status || "",
                    manage_staff: data.order.manage_staff || "",
                    order_date: data.order.order_date || "",
                    company: data.order.company || "",
                    shipping_mode: data.order.shipping_mode || "",
                    code_charge: data.order.code_charge || "",
                    check: data.order.check || false,
                    family: data.order.family || "",
                    shipping_charge: data.order.shipping_charge || "",

                });
                setOrderItems(data.items || []);
                setShippingAddress({
                    name: data.order.billing_address?.name || "",
                    address: data.order.billing_address?.address || "",
                    email: data.order.billing_address?.email || "",
                    zipcode: data.order.billing_address?.zipcode || "",
                    city: data.order.billing_address?.city || "",
                    country: data.order.billing_address?.country || "",
                    phone: data.order.billing_address?.phone || "",
                    state: data.order.billing_address?.state || "",
                });

                setBillingAddress({
                    name: data.order.customer?.name || "",
                    address: data.order.customer?.address || "",
                    email: data.order.customer?.email || "",
                    zipcode: data.order.customer?.zip_code || "",
                    city: data.order.customer?.city || "",
                    country: data.order.customer?.country || "",
                    phone: data.order.customer?.phone || "",
                    state: data.order.customer?.state || "",
                    gst: data.order.customer?.gst || "",

                });
                setBankDetails({
                    name: data.order.bank?.name || "",
                    accountNumber: data.order.bank?.account_number || "",
                    ifscCode: data.order.bank?.ifsc_code || "",
                    Branch: data.order.bank?.branch || "",

                });

                setpaymentReceipts(data.order.payment_receipts)
                setShippingCharge(data.order.shipping_charge || 0);

                calculateTotalAmount(data.items || []);
                calculateTotalDiscountAmount(data.items || []);
                calculateTotalNetPrice(data.items || []);
                calculateNetAmountBeforTax(data.items || []);
                calculateTaxAmount(data.items || []);

            }
        } catch (error) {
            console.error("Error fetching order data:", error);
        }
    };

    const calculateTotalAmount = (items) => {
        const subtotal = items.reduce((sum, item) => {
            const itemTotal = item.quantity * (item.rate - item.discount);
            return sum + itemTotal;
        }, 0);

        const total = subtotal;
        setTotalAmount(total);
    };



    const calculateTotalDiscountAmount = (items) => {
        const totalDiscount = items.reduce((sum, item) => {
            const itemDiscount = item.quantity * item.discount;
            return sum + itemDiscount;
        }, 0);
        setTotalDiscountAmount(totalDiscount);
    };



    const calculateTotalNetPrice = (items) => {
        const totalNetPrice = items.reduce((sum, item) => {
            const itemTotal = item.rate * item.quantity;
            return sum + itemTotal;
        }, 0);
        settotalNetPrice(totalNetPrice);
    };


    const calculateNetAmountBeforTax = (items) => {
        const totalNetPricebeforTax = items.reduce((sum, item) => {
            const itemTotaltax = item.exclude_price * item.quantity;
            return sum + itemTotaltax;
        }, 0);
        setNetAmountBeforTax(totalNetPricebeforTax);
    };

    const calculateTaxAmount = (items) => {
        const totalTaxAmount = items.reduce((sum, item) => {
            const itemTax = item.actual_price - item.exclude_price;
            const itemTotalTax = itemTax * item.quantity;
            return sum + itemTotalTax;
        }, 0);

        setTaxAmount(totalTaxAmount);
    };







    // Use the fetchOrderData in useEffect
    useEffect(() => {
        fetchOrderData();
    }, [id]);

    const handleRemoveItem = async (itemId) => {
        try {
            // Replace with your API URL and method to delete the item
            const response = await fetch(`${import.meta.env.VITE_APP_KEY}remove/order/${itemId}/item/`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });


            if (!response.ok) {
                throw new Error('Failed to remove item');
            }

            setOrderItems((prevItems) => prevItems.filter((item) => item.id !== itemId));

            // Optionally show success message or notification
            alert('Item removed successfully');
        } catch (error) {
            console.error('Error removing item:', error);
            alert('Failed to remove item');
        }
    };


    const updateCartProduct = async (productId, updateData) => {
        const token = localStorage.getItem("token"); // Retrieve token directly here

        if (!token) {
            setErrorMessage("Authorization token is missing");
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_APP_KEY}remove/order/${productId}/item/`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to update the product. Status: ${response.status} - ${errorData.message || 'Unknown error'}`);
            }

            setFeedback("Product updated successfully");
        } catch (error) {
        }
    };

    // Handle Quantity/Discount Change
    const handleItemChange = (index, field, value) => {
        const updatedItems = [...orderItems];
        const productId = updatedItems[index].id; // Assuming each item has a unique ID

        // Update local state
        if (field === 'quantity') {
            updatedItems[index].quantity = Number(value); // Convert to Number for consistency
        } else if (field === 'discount') {
            updatedItems[index].discount = Number(value); // Convert to Number
        }
        setOrderItems(updatedItems);

        // Prepare the data to be sent to the backend
        const updateData = {
            quantity: updatedItems[index].quantity,
            discount: updatedItems[index].discount
        };

        // Call the backend update function with productId in the URL
        updateCartProduct(productId, updateData);
    };



    const handleSubmit = async () => {
        const payload = {
            shipping_charge: shippingCharge,
            total_amount: totalAmount + shippingCharge,
        };

        try {
            const response = await fetch(`${import.meta.env.VITE_APP_KEY}shipping/${id}/order/`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const data = await response.json();
                console.log("Response:", data);
                setSuccessMessage("Form submitted successfully!");
            } else {
                const errorData = await response.json();
                console.error("Error response data:", errorData);
                setErrorMessage("Failed to submit the form. Please check your input and try again.");
            }
        } catch (error) {
            console.error("Error submitting form data:", error);
            setErrorMessage("An unexpected error occurred. Please try again later.");
            setSuccessMessage("");
        }
    };

    const loggedUser = localStorage.getItem('name');

    const handleDownloadInvoice = () => {

        const pdfUrl = `${import.meta.env.VITE_APP_IMAGE}/invoice/${id}/`;
        window.open(pdfUrl, "_blank");

    }
    console.log("order-itemss", orderItems)


    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid={true}>
                    <Breadcrumbs title="Forms" breadcrumbItem="Form Layouts" />
                    <Row>

                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="mb-4">ORDER PRODUCTS </CardTitle>

                                    {successMessage && (
                                        <div className="alert alert-success mt-3">
                                            {successMessage}
                                        </div>
                                    )}

                                    {/* Error Message */}
                                    {errorMessage && (
                                        <div className="alert alert-danger mt-3">
                                            {errorMessage}
                                        </div>
                                    )}

                                    <Form onSubmit={formik.handleSubmit}>
                                        <Row>
                                            <Col md={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-invoice-Input">INVOICE NO</Label>
                                                    <Input
                                                        type="text"
                                                        name="invoice"
                                                        className="form-control"
                                                        id="formrow-invoice-Input"
                                                        placeholder="Enter Your INVOICE NO"
                                                        value={formik.values.invoice}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={
                                                            formik.touched.invoice && formik.errors.invoice ? true : false
                                                        }
                                                    />
                                                    {
                                                        formik.errors.invoice && formik.touched.invoice ? (
                                                            <FormFeedback type="invalid">{formik.errors.invoice}</FormFeedback>
                                                        ) : null
                                                    }
                                                </div>
                                            </Col>

                                            <Col md={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-email-Input">STATUS</Label>
                                                    <Input
                                                        type="text"
                                                        name="status"
                                                        className="form-control"
                                                        id="formrow-email-Input"
                                                        placeholder="Enter Your Email ID"
                                                        value={formik.values.status}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={
                                                            formik.touched.status && formik.errors.status ? true : false
                                                        }
                                                    />
                                                    {
                                                        formik.errors.status && formik.touched.status ? (
                                                            <FormFeedback type="invalid">{formik.errors.status}</FormFeedback>
                                                        ) : null
                                                    }
                                                </div>
                                            </Col>
                                            <Col md={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-manage_staff-Input">CREATED BY</Label>
                                                    <Input
                                                        type="text"
                                                        name="manage_staff"
                                                        className="form-control"
                                                        id="formrow-manage_staff-Input"
                                                        placeholder="Enter Your manage_staff"
                                                        autoComplete="off"
                                                        value={formik.values.manage_staff}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={
                                                            formik.touched.manage_staff && formik.errors.manage_staff ? true : false
                                                        }
                                                    />
                                                    {
                                                        formik.errors.manage_staff && formik.touched.manage_staff ? (
                                                            <FormFeedback type="invalid">{formik.errors.manage_staff}</FormFeedback>
                                                        ) : null
                                                    }
                                                </div>
                                            </Col>

                                            <Col lg={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-Inputorder_date">CREATED AT</Label>
                                                    <Input
                                                        type="text"
                                                        name="order_date"
                                                        className="form-control"
                                                        id="formrow-Inputorder_date"
                                                        placeholder="Enter Your Living order_date"
                                                        value={formik.values.order_date}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={
                                                            formik.touched.order_date && formik.errors.order_date ? true : false
                                                        }
                                                    />
                                                    {
                                                        formik.errors.order_date && formik.touched.order_date ? (
                                                            <FormFeedback type="invalid">{formik.errors.order_date}</FormFeedback>
                                                        ) : null
                                                    }
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row>

                                            <Col lg={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-Inputcompany">COMPANY</Label>
                                                    <select
                                                        name="company"
                                                        id="formrow-Inputcompany"
                                                        className="form-control"
                                                        value={formik.values.company}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.company && formik.errors.company ? true : false}
                                                    >

                                                        <option value="MICHEAL IMPORT EXPORT PVT LTD">MICHEAL IMPORT EXPORT PVT LTD</option>
                                                        <option value="BEPOSITIVE RACING PVT LTD">BEPOSITIVE RACING PVT LTD</option>
                                                    </select>
                                                    {formik.errors.company && formik.touched.company && (
                                                        <span className="text-danger">{formik.errors.company}</span>
                                                    )}
                                                </div>
                                            </Col>



                                            <Col lg={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-InputZip">SHIPING MODE</Label>
                                                    <Input
                                                        type="text"
                                                        name="shipping_mode"
                                                        className="form-control"
                                                        id="formrow-InputZip"
                                                        placeholder="Enter Your SHIPPING MODE"
                                                        value={formik.values.shipping_mode}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={
                                                            formik.touched.shipping_mode && formik.errors.shipping_mode ? true : false
                                                        }
                                                    />
                                                    {
                                                        formik.errors.shipping_mode && formik.touched.shipping_mode ? (
                                                            <FormFeedback type="invalid">{formik.errors.shipping_mode}</FormFeedback>
                                                        ) : null
                                                    }
                                                </div>
                                            </Col>

                                            <Col lg={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-InputZip">FAMILY</Label>
                                                    <Input
                                                        type="text"
                                                        name="family"
                                                        className="form-control"
                                                        id="formrow-Inputfamily"
                                                        placeholder="Enter Your family Code"
                                                        value={formik.values.family}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={
                                                            formik.touched.family && formik.errors.family ? true : false
                                                        }
                                                    />
                                                    {
                                                        formik.errors.family && formik.touched.family ? (
                                                            <FormFeedback type="invalid">{formik.errors.family}</FormFeedback>
                                                        ) : null
                                                    }
                                                </div>
                                            </Col>

                                            <Col lg={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-InputZip">COD CHARGE</Label>
                                                    <Input
                                                        type="text"
                                                        name="code_charge"
                                                        className="form-control"
                                                        id="formrow-InputZip"
                                                        placeholder="Enter Your COD charge"
                                                        value={formik.values.code_charge}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={
                                                            formik.touched.code_charge && formik.errors.code_charge ? true : false
                                                        }
                                                    />
                                                    {
                                                        formik.errors.code_charge && formik.touched.code_charge ? (
                                                            <FormFeedback type="invalid">{formik.errors.code_charge}</FormFeedback>
                                                        ) : null
                                                    }
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
                                        <div>
                                            <button type="submit" className="btn btn-primary w-md">
                                                save changes
                                            </button>
                                        </div>
                                    </Form>
                                </CardBody>


                                <div style={{ display: "flex", justifyContent: "space-between", padding: "20px", gap: "20px", backgroundColor: "#f5f5f5" }}>
                                    {/* Billing Address Card */}
                                    <div style={{
                                        flex: "1",
                                        padding: "20px",
                                        borderRadius: "12px",
                                        backgroundColor: "#fff",
                                        boxShadow: "0px 8px 16px rgba(0, 0, 0, 0.1)"
                                    }}>
                                        <h2 style={{ display: "flex", alignItems: "center", gap: "10px", color: "#333", borderBottom: "1px solid #e0e0e0", paddingBottom: "10px" }}>
                                            <span role="img" aria-label="Billing Icon">💳</span> Billing Address
                                        </h2>
                                        <div style={{ marginTop: "20px" }}>
                                            <p><strong>Name:</strong> {billingAddress.name}</p>
                                            <p><strong>Street:</strong> {billingAddress.address}</p>
                                            <p><strong>City:</strong> {billingAddress.city}</p>
                                            <p><strong>State:</strong> {billingAddress.state}</p>
                                            <p><strong>Zip Code:</strong> {billingAddress.zipcode}</p>
                                            <p><strong>GST:</strong> {billingAddress.gst}</p>
                                        </div>
                                    </div>

                                    {/* Shipping Address Card */}
                                    <div style={{
                                        flex: "1",
                                        padding: "20px",
                                        borderRadius: "12px",
                                        backgroundColor: "#fff",
                                        boxShadow: "0px 8px 16px rgba(0, 0, 0, 0.1)"
                                    }}>
                                        <h2 style={{ display: "flex", alignItems: "center", gap: "10px", color: "#333", borderBottom: "1px solid #e0e0e0", paddingBottom: "10px" }}>
                                            <span role="img" aria-label="Shipping Icon">🚚</span> Shipping Address
                                        </h2>
                                        <div style={{ marginTop: "20px" }}>
                                            <p><strong>Name:</strong> {shippingAddress.name}</p>
                                            <p><strong>Street:</strong> {shippingAddress.address}</p>
                                            <p><strong>City:</strong> {shippingAddress.city}</p>
                                            <p><strong>State:</strong> {shippingAddress.state}</p>
                                            <p><strong>Zip Code:</strong> {shippingAddress.zipcode}</p>
                                            <p><strong>Country:</strong> {shippingAddress.country}</p>
                                        </div>
                                    </div>
                                </div>

                                <Col xl={12}>
                                    <Card className="bordered-card">
                                        <CardBody>
                                            <CardTitle className="h4">Order table</CardTitle>
                                            <div className="table-responsive">
                                                <Table className="table table-bordered table-striped mb-0">
                                                    <thead>
                                                        <tr className="table-header">
                                                            <th>ID</th>
                                                            <th>Image</th>
                                                            <th>Name</th>
                                                            <th>Actual Price</th>
                                                            <th>Rate</th>
                                                            <th>Tax %</th>
                                                            <th>Tax Amount</th>
                                                            <th>Quantity</th>
                                                            <th>Price</th>
                                                            <th>Discount</th>
                                                            <th>Total Amount</th>
                                                            <th>Remove</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {orderItems.map((item, index) => (
                                                            <tr key={item.id} className="table-row">
                                                                <td>{index + 1}</td>
                                                                <td className="image-cell">
                                                                    <img
                                                                        src={`${import.meta.env.VITE_APP_IMAGE}${item.image}`}
                                                                        alt={item.name}
                                                                        style={{
                                                                            width: '50px',
                                                                            height: '50px',
                                                                            objectFit: 'cover',
                                                                            borderRadius: '5px'
                                                                        }}
                                                                    />

                                                                </td>
                                                                <td>{item.name}</td>
                                                                <td>{item.rate}</td>
                                                                <td>{item.exclude_price}</td>
                                                                <td>{item.tax} %</td>
                                                                <td>{item.rate - item.exclude_price}</td>
                                                                <td>
                                                                    <Input
                                                                        type="number"
                                                                        value={item.quantity}
                                                                        disabled={isAddDisabled}
                                                                        onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                                                                        style={{ width: '80px' }}
                                                                    />
                                                                </td>
                                                                <td>{item.rate - item.discount}</td>
                                                                <td>
                                                                    <Input
                                                                        type="number"
                                                                        value={item.discount}
                                                                        disabled={isAddDisabled}
                                                                        onChange={(e) => handleItemChange(index, 'discount', Number(e.target.value))}
                                                                        style={{ width: '80px' }}
                                                                    />
                                                                </td>

                                                                <td>{((item.rate - item.discount) * item.quantity).toFixed(2)}</td>
                                                                <td>
                                                                    <Button
                                                                        color="danger"
                                                                        disabled={isAddDisabled}
                                                                        onClick={() => handleRemoveItem(item.id)}
                                                                    >
                                                                        Remove
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        ))}

                                                        {/* Total Row */}
                                                        <tr className="total-row">
                                                            <td colSpan="3" className="text-end font-weight-bold">Totals:</td>

                                                            <td className="font-weight-bold">
                                                                {orderItems.reduce((acc, item) => acc + parseFloat(item.rate), 0).toFixed(2)}
                                                            </td>
                                                            <td className="font-weight-bold">
                                                                {orderItems.reduce((acc, item) => acc + parseFloat(item.exclude_price * item.quantity), 0).toFixed(2)}
                                                            </td>
                                                            <td></td>
                                                            <td></td>
                                                            <td className="font-weight-bold">
                                                                {orderItems.reduce((acc, item) => acc + parseInt(item.quantity), 0)}
                                                            </td>


                                                            <td className="font-weight-bold">
                                                                {orderItems.reduce((acc, item) => acc + parseInt(item.rate - item.discount), 0)}
                                                            </td>

                                                            <td className="font-weight-bold">
                                                                {orderItems.reduce((acc, item) => acc + parseInt(item.discount * item.quantity), 0)}
                                                            </td>
                                                            <td className="font-weight-bold">
                                                                {orderItems.reduce((acc, item) =>
                                                                    acc + ((item.rate - item.discount) * item.quantity), 0).toFixed(2)}
                                                            </td>
                                                            <td></td>
                                                        </tr>

                                                    </tbody>



                                                </Table>
                                                <div className="container mt-5">
                                                    {/* Invoice Header */}
                                                    <div className="row">
                                                        <div className="col-12 text-center mb-4">
                                                            <h3 className="text-primary">Invoice</h3>
                                                        </div>
                                                    </div>
                                                    <div className="row">
                                                        {/* Bank Details Section */}
                                                        <div className="col-md-6 mb-4">
                                                            <h5 className="mb-3" style={{ fontWeight: "600", color: "#333" }}>Bank Details</h5>
                                                            <Table className="table table-bordered" style={{ border: "2px solid #000" }}>
                                                                <tbody>
                                                                    <tr>
                                                                        <th scope="row" className="text-dark" style={{ width: "40%", backgroundColor: "#f1f3f5", fontWeight: "bold" }}>Bank A/C</th>
                                                                        <td style={{ fontWeight: "500" }}>{bankDetails.accountNumber}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <th scope="row" className="text-dark" style={{ backgroundColor: "#f1f3f5", fontWeight: "bold" }}>Bank Name</th>
                                                                        <td style={{ fontWeight: "500" }}>{bankDetails.name}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <th scope="row" className="text-dark" style={{ backgroundColor: "#f1f3f5", fontWeight: "bold" }}>Bank IFSC</th>
                                                                        <td style={{ fontWeight: "500" }}>{bankDetails.ifscCode}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <th scope="row" className="text-dark" style={{ backgroundColor: "#f1f3f5", fontWeight: "bold" }}>Branch</th>
                                                                        <td style={{ fontWeight: "500" }}>{bankDetails.Branch}</td>
                                                                    </tr>
                                                                </tbody>
                                                            </Table>
                                                        </div>

                                                        {/* Summary Section */}
                                                        <div className="col-md-6 mb-4">
                                                            <h5 className="mb-3" style={{ fontWeight: "600", color: "#333" }}>Billing Summary</h5>
                                                            <Table className="table table-bordered" style={{ border: "2px solid #000" }}>
                                                                <tbody>
                                                                    <tr>
                                                                        <th scope="row" className="text-dark" style={{ width: "60%", backgroundColor: "#f1f3f5", fontWeight: "bold" }}>Discounted Amount</th>
                                                                        <td style={{ fontWeight: "500" }}>${totalDiscountAmount.toFixed(2)}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <th scope="row" className="text-dark" style={{ backgroundColor: "#f1f3f5", fontWeight: "bold" }}>Net Amount</th>
                                                                        <td style={{ fontWeight: "500" }}>${totalNetPrice.toFixed(2)}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <th scope="row" className="text-dark" style={{ backgroundColor: "#f1f3f5", fontWeight: "bold" }}>Net Amount Before Tax</th>
                                                                        <td style={{ fontWeight: "500" }}>${NetAmountBeforTax.toFixed(2)}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <th scope="row" className="text-dark" style={{ backgroundColor: "#f1f3f5", fontWeight: "bold" }}>Total Tax Amount</th>
                                                                        <td style={{ fontWeight: "500" }}>${TaxAmount.toFixed(2)}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <th scope="row" className="text-dark" style={{ backgroundColor: "#f1f3f5", fontWeight: "bold" }}>Shipping Charge</th>
                                                                        <td>
                                                                            <input
                                                                                type="number"
                                                                                value={shippingCharge}
                                                                                onChange={(e) => setShippingCharge(Number(e.target.value))}
                                                                                style={{ width: '80px', fontWeight: "500", border: "1px solid #ccc", borderRadius: "4px", padding: "3px" }}
                                                                            />
                                                                        </td>
                                                                    </tr>
                                                                    <tr>
                                                                        <th scope="row" className="text-dark" style={{ backgroundColor: "#f1f3f5", fontWeight: "bold" }}>Total Payable Amount</th>
                                                                        <td><strong className="text-success" style={{ fontWeight: "700", fontSize: "1.2em" }}>${Number(totalAmount + shippingCharge).toFixed(2)}</strong></td>
                                                                    </tr>
                                                                </tbody>
                                                            </Table>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>



                                            <style jsx>{`
                                                .bordered-card {
                                                    border-radius: 8px;
                                                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                                                }
                                                .totals-section h5, .bank-details h5 {
                                                    font-weight: bold;
                                                    margin-bottom: 1rem;
                                                }
                                                .table-bordered th, .table-bordered td {
                                                    padding: 8px;
                                                    vertical-align: middle;
                                                }
                                            `}</style>
                                            <div className="mb-3 mt-3">
                                                <Button color="primary" disabled={isAddDisabled} onClick={toggleModal}>
                                                    Add Products
                                                </Button>
                                            </div>

                                            <div className="mb-3 mt-3" style={{ textAlign: "right" }}>
                                                <Button type="submit" color="primary" onClick={handleSubmit} d
                                                    disabled={isAddDisabled}>
                                                    Submit
                                                </Button>
                                            </div>

                                        </CardBody>


                                    </Card>

                                    <style jsx>{`
                                        .bordered-card {
                                            border-radius: 8px;
                                            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                                        }
                                        .table-header {
                                            background-color: #f8f9fa;
                                            font-weight: bold;
                                        }
                                        .table-row:hover {
                                            background-color: #f1f1f1;
                                        }
                                        .image-cell {
                                            text-align: center;
                                        }
                                        .total-row {
                                            background-color: #f1f1f1;
                                            font-weight: bold;
                                        }
                                    `}</style>
                                </Col>

                                <AddProduct
                                    isOpen={modalOpen}
                                    toggle={toggleModal}
                                />

                            </Card>
                        </Col>


                        <Col xl={12}>
                            <Paymentrecipent />



                            {(role === "ADMIN" || role === "BDM") && (
                                <Information />
                            )}
                            {(role === "ADMIN" || role === "BDM") && (
                                <Row>
                                    <Col xl={12}>
                                        <Card>
                                            <CardBody>
                                                <CardTitle className="mb-4">DOWNLOAD BILLS AND INVOICE</CardTitle>
                                                <Row>
                                                    <Col md={4}>
                                                        <div className="d-flex align-items-center mb-3">
                                                            <button
                                                                type="button"
                                                                className="btn btn-primary w-100"
                                                                onClick={() => handleDownload("bill")}
                                                            >
                                                                Download Bill
                                                            </button>
                                                        </div>
                                                    </Col>
                                                    <Col md={4}>
                                                        <div className="d-flex align-items-center mb-3">
                                                            <button
                                                                type="button"
                                                                className="btn btn-secondary w-100"
                                                                onClick={() => handleDownloadInvoice()}
                                                            >
                                                                Download Invoice
                                                            </button>
                                                        </div>
                                                    </Col>
                                                    <Col md={4}>
                                                        <div className="d-flex align-items-center mb-3">
                                                            <button
                                                                type="button"
                                                                className="btn btn-info w-100"
                                                                onClick={() => handleDownload("billingAddress")}
                                                            >
                                                                Download Billing Address
                                                            </button>
                                                        </div>
                                                    </Col>
                                                </Row>
                                            </CardBody>
                                        </Card>
                                    </Col>
                                </Row>
                            )}

                        </Col>
                    </Row>

                </Container>
            </div >
        </React.Fragment >
    );
};

export default FormLayouts;
