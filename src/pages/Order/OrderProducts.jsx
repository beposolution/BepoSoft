import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, Col, Container, Row, CardBody, Button, CardTitle, Label, ModalHeader, Modal, Form, Input, Table, FormFeedback, ModalBody, Spinner } from "reactstrap";
import { FaFileInvoice, FaCalendarAlt, FaUser, FaDollarSign, FaUniversity, FaIdBadge, FaUserCheck, FaUserPlus, FaStickyNote } from "react-icons/fa";
import * as Yup from 'yup';
import { useFormik } from "formik";
import axios from 'axios';
import AddProduct from "./AddCreatedOrderProducts";
import Information from "./information"
import Paymentrecipent from "./PaymentRecipt"
import { useNavigate } from "react-router-dom";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { isDisabled } from "@testing-library/user-event/dist/cjs/utils/index.js";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useLocation } from "react-router-dom";
import { Link } from 'react-router-dom';

const FormLayouts = () => {

    // meta title
    document.title = "BEPOSOFT | ORDER PRODUCTS";
    const { id } = useParams();
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
    const [familyData, setFamilyData] = useState([]);
    const [companyData, setCompanyData] = useState([]);
    const token = localStorage.getItem('token');
    const [modal, setModal] = useState(false);
    const toggleReciptModal = () => setIsOpen(!isOpen);
    const [isOpen, setIsOpen] = useState(false);
    const currentDate = new Date().toISOString().split("T")[0];
    const [banks, setBanks] = useState([]);
    const [selectedBank, setSelectedBank] = useState('');
    const [isAddDisabled, setIsAddDisabled] = useState(false);
    const [isOrderFetched, setIsOrderFetched] = useState(false);
    const [customerId, setCustomerId] = useState([]);
    const [ledgerData, setLedgerData] = useState({});
    const [closingBalance, setClosingBalance] = useState(0);
    const [products, setProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [expandedProductId, setExpandedProductId] = useState(null);
    const [quantity, setQuantity] = useState({});
    const navigate = useNavigate();
    const [userData, setUserData] = useState();
    const warehouseId = userData;
    const location = useLocation();
    const { orderIds = [] } = location.state || {};

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}profile/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUserData(response?.data?.data?.warehouse_id);
            } catch (error) {
                toast.error('Error fetching user data:');
            }
        };
        fetchUserData();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");

        try {
            const response = await fetch(`${import.meta.env.VITE_APP_KEY}all/products/`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
            });


            if (!response.ok) {
                throw new Error("Failed to fetch products");
            }

            const data = await response.json();

            // Ensure the data is an array and properly set it
            if (data && Array.isArray(data.data)) {
                setProducts(data.data);
            } else {
                setError('Data structure is not as expected');
            }

        } catch (error) {
            setError(error.message || "An error occurred while fetching products.");
        } finally {
            setLoading(false);
        }
    };

    const fetchwarehouseProduct = async () => {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");

        try {
            const response = await axios.get(`${import.meta.env.VITE_APP_KEY}warehouse/products/${warehouseId}/`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });

            const data = response.data;

            // Ensure the response contains `data` and it is an array
            if (data && Array.isArray(data.data)) {
                setProducts(data.data);
            } else {
                throw new Error("Unexpected data structure received from API");
            }

        } catch (error) {
            setError(error.response?.data?.message || "An error occurred while fetching products.");
        } finally {
            setLoading(false);
        }
    };

    const addToItem = async (product, variant = null) => {
        const token = localStorage.getItem("token");
        const selected = variant || product;
        const qty = quantity[selected.id] || 1;

        const payload = {
            order: parseInt(id),
            product: selected.id,
            quantity: parseInt(qty),
            rate: selected?.selling_price || 0,
            tax: variant ? product?.tax || 0 : selected?.tax || 0,
        };

        try {
            const response = await fetch(`${import.meta.env.VITE_APP_KEY}order-item/create/`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Failed to add product");
            }

            toast.success("Product added successfully!");
            fetchOrderData();
        } catch (error) {
            toast.error(error.message || "Error adding product");
        }
    };

    useEffect(() => {

        if (!warehouseId || warehouseId === "" || warehouseId === undefined) {
            if (isOpen) {
                fetchProducts();
            }
        } else {
            fetchwarehouseProduct();
        }
    }, [isOpen, warehouseId]);;

    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
    };

    const toggleExpand = (productId) => {
        setExpandedProductId(expandedProductId === productId ? null : productId);
    };

    const handleQuantityChange = (productId, value) => {
        const parsedValue = parseInt(value, 10);
        const product = products.find(p => p.id === productId);
        const stock = product ? product.stock : 0;

        if (parsedValue > stock) {
            setQuantity((prev) => ({
                ...prev,
                [productId]: stock,
            }));
            alert(`Quantity cannot exceed available stock of ${stock}.`);
        } else {
            setQuantity((prev) => ({
                ...prev,
                [productId]: parsedValue,
            }));
        }
    };

    const filteredProducts = Array.isArray(products)
        ? products.filter((product) => {
            const parentMatches = product.approval_status === "Approved" &&
                product.name.toLowerCase().includes(searchQuery.toLowerCase());

            const parentHasStock = product.stock > 0;

            const variantsHaveStock = Array.isArray(product.variantIDs)
                ? product.variantIDs.some((variant) => variant.stock > 0)
                : false;

            return parentMatches && (parentHasStock || variantsHaveStock);
        })
        : [];

    const handleNameClick = (updateId) => {
        navigate(`/customer/${updateId}/edit/`);
    };

    const currentIndex = orderIds.indexOf(parseInt(id));
    const handleNextOrder = () => {
        if (currentIndex !== -1 && currentIndex < orderIds.length - 1) {
            const nextOrderId = orderIds[currentIndex + 1];
            navigate(`/order/${nextOrderId}/items/`, {
                state: { orderIds }
            });
        } else {
            toast.info("No more orders.");
        }
    };

    const handlePrevOrder = () => {
        if (currentIndex > 0) {
            const prevOrderId = orderIds[currentIndex - 1];
            navigate(`/order/${prevOrderId}/items/`, {
                state: { orderIds }
            });
        } else {
            toast.info("This is the first order.");
        }
    };

    useEffect(() => {
        if (familyData.length && !isOrderFetched) {
            fetchOrderData();
            setIsOrderFetched(true);
        }
    }, [familyData, isOrderFetched]);

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
        id: "",
        name: "",
        phone: "",
        alt_phone: "",
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
            cod_amount: "",
            shipping_mode: "",
            family: "",
            payment_status: "",
            check: ""
        },
        validationSchema: Yup.object({
        }),

        onSubmit: async (values) => {
            try {
                const payload = {
                    cod_amount: values.cod_amount,
                    shipping_mode: values.shipping_mode,
                    order_date: values.order_date,
                    payment_status: values.payment_status,
                    family: values.family !== "" ? parseInt(values.family) : null,
                    company: parseInt(values.company),
                    invoice: values.invoice,
                    status: values.status,
                    manage_staff: values.manage_staff,
                    check: values.check,
                    bank: selectedBank,
                };

                const response = await fetch(`${import.meta.env.VITE_APP_KEY}orders/update/${id}/`, {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        cod_amount: values.cod_amount,
                        shipping_mode: values.shipping_mode,
                        order_date: values.order_date,
                        payment_status: values.payment_status,
                        family: values.family !== "" ? parseInt(values.family) : null,
                        company: values.company,
                    }),
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();

                setSuccessMessage("Form submitted successfully!");
            } catch (error) {
                setErrorMessage("Failed to submit the form. Please try again.");
                setSuccessMessage("");
            }
        }

    });

    useEffect(() => {
        const role = localStorage.getItem("active");
        if (role === "BDM" || role === "BDO" || role === "Warehouse Admin") {
            setIsAddDisabled(true);
        }
    }, []);

    useEffect(() => {
        fetchOrderData();
    }, [id]);

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
                toast.error("Error fetching banks:");
            }
        };

        fetchBanks();
    }, []);

    useEffect(() => {
        const fetchFamilyData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}familys/`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                setFamilyData(response?.data?.data)
            } catch (error) {
                toast.error("Error fetching family data.")
            }
        };
        fetchFamilyData();
    }, [])

    useEffect(() => {
        const fetchCompanyData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}company/data/`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                setCompanyData(response?.data?.data)
            } catch (error) {
                toast.error("Error fetching family data.")
            }
        };
        fetchCompanyData();
    }, [])

    useEffect(() => {
        if (!customerId) return;

        const fetchLedger = async () => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_APP_KEY}customer/${customerId}/ledger/`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    }
                );
                setLedgerData(response?.data);
            } catch (error) {
                toast.error("Error fetching ledger data:");
            }
        };

        fetchLedger();
    }, [customerId]);

    useEffect(() => {
        if (ledgerData) {
            let totalAdvanceAmount = 0;
            let totalReceivedAmount = 0;
            let totalLedgerAmount = 0;

            if (Array.isArray(ledgerData.data?.advance_receipts)) {
                const advanceReceipts = ledgerData.data.advance_receipts;

                for (let i = 0; i < advanceReceipts.length; i++) {
                    totalAdvanceAmount += parseFloat(advanceReceipts[i]?.amount || 0);
                }
            }

            if (Array.isArray(ledgerData.data?.ledger)) {
                const ledgerEntries = ledgerData.data.ledger;

                for (let i = 0; i < ledgerEntries.length; i++) {
                    const payments = Array.isArray(ledgerEntries[i]?.recived_payment)
                        ? ledgerEntries[i].recived_payment
                        : [];

                    for (let j = 0; j < payments.length; j++) {
                        totalReceivedAmount += parseFloat(payments[j]?.amount || 0);
                    }

                    totalLedgerAmount += parseFloat(ledgerEntries[i]?.total_amount || 0);
                }
            }
            const grandTotal = totalAdvanceAmount + totalReceivedAmount;
            const closingBalance = grandTotal - totalLedgerAmount;
            setClosingBalance(closingBalance);
        }
    }, [ledgerData]);


    // Fetch order data when component mounts or id changes
    const fetchOrderData = async () => {      // should not be undefined
        try {
            const url = `${import.meta.env.VITE_APP_KEY}order/${id}/items/`;
            const response = await fetch(url, {
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

            if (data.order) {
                const selectedFamily = familyData.find(f => f.name.trim().toLowerCase() === data.order.family.trim().toLowerCase());
                formik.setValues({
                    invoice: data.order.invoice || "",
                    status: data.order.status || "",
                    manage_staff: data.order.manage_staff || "",
                    order_date: data.order.order_date || "",
                    company: data.order.company.id || "",
                    shipping_mode: data.order.shipping_mode || "",
                    cod_amount: data.order.cod_amount || "",
                    check: data.order.check || false,
                    family: selectedFamily ? String(selectedFamily.id) : "",
                    shipping_charge: data.order.shipping_charge || "",
                    payment_status: data.order.payment_status || "",
                });
                setCustomerId(data?.order?.customer?.id || null);
                setOrderItems(data?.items || []);
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
                    id: data.order.customer?.id || "",
                    name: data.order.customer?.name || "",
                    address: data.order.customer?.address || "",
                    email: data.order.customer?.email || "",
                    zipcode: data.order.customer?.zip_code || "",
                    city: data.order.customer?.city || "",
                    country: data.order.customer?.country || "",
                    phone: data.order.customer?.phone || "",
                    alt_phone: data.order.customer?.alt_phone || "",
                    state: data.order.customer?.state || "",
                    gst: data.order.customer?.gst || "",

                });
                setBankDetails({
                    id: data.order.bank?.id || "",
                    name: data.order.bank?.name || "",
                    accountNumber: data.order.bank?.account_number || "",
                    ifscCode: data.order.bank?.ifsc_code || "",
                    Branch: data.order.bank?.branch || "",
                });
                setSelectedBank(data.order.bank?.id || "");

                setpaymentReceipts(data.order.payment_receipts)
                setShippingCharge(data.order.shipping_charge || 0);

                calculateTotalAmount(data.items || []);
                calculateTotalDiscountAmount(data.items || []);
                calculateTotalNetPrice(data.items || []);
                calculateNetAmountBeforTax(data.items || []);
                calculateTaxAmount(data.items || []);

            }
        } catch (error) {
            toast.error("Error fetching order data:");
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
            const rate = parseFloat(item.rate || 0);
            const discount = parseFloat(item.discount || 0);
            const exclude = parseFloat(item.exclude_price || 0);
            const qty = parseInt(item.quantity || 0);

            const effectiveRate = rate - discount;
            const taxPerItem = effectiveRate - exclude;
            const itemTotalTax = taxPerItem * qty;

            return sum + itemTotalTax;
        }, 0);

        setTaxAmount(totalTaxAmount);
    };

    useEffect(() => {
        fetchOrderData();
    }, [id]);

    const handleRemoveItem = async (itemId) => {
        try {

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
            updatedItems[index].quantity = Number(value);
        } else if (field === 'discount') {
            updatedItems[index].discount = Number(value);
        } else if (field === 'rate') {
            updatedItems[index].rate = Number(value);
        }
        setOrderItems(updatedItems);

        // Prepare the data to be sent to the backend
        const updateData = {
            quantity: updatedItems[index].quantity,
            discount: updatedItems[index].discount,
            rate: updatedItems[index].rate
        };

        // Call the backend update function with productId in the URL
        updateCartProduct(productId, updateData);
    };

    const totalPayableAmount = orderItems.reduce(
        (acc, item) => acc + ((item.rate - item.discount) * item.quantity),
        0
    ) + shippingCharge;

    const handleSubmit = async () => {
        const payload = {
            shipping_charge: shippingCharge,
            total_amount: totalPayableAmount,
            bank: selectedBank ? parseInt(selectedBank) : null,
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
                setSuccessMessage("Form submitted successfully!");
                toast("Order updated successfully!");
            } else {
                const errorData = await response.json();
                setErrorMessage("Failed to submit the form. Please check your input and try again.");
            }
        } catch (error) {
            setErrorMessage("An unexpected error occurred. Please try again later.");
            setSuccessMessage("");
        }
    };

    const loggedUser = localStorage.getItem('name');

    const handleDownloadInvoice = () => {

        const pdfUrl = `${import.meta.env.VITE_APP_IMAGE}/invoice/${id}/`;
        window.open(pdfUrl, "_blank");

    }

    const handleDownloadAddress = () => {
        const addressurl = `${import.meta.env.VITE_APP_IMAGE}/shippinglabel/${id}/`;
        window.open(addressurl, "_blank");
    }

    const handleDownloadDeliveryNote = () => {
        const deliveryNoteUrl = `${import.meta.env.VITE_APP_IMAGE}/deliverynote/${id}/`;
        window.open(deliveryNoteUrl, "_blank");
    }

    const totalPayableAmountDisplay = orderItems.reduce(
        (acc, item) => acc + ((item.rate - item.discount) * item.quantity),
        0
    ) + shippingCharge;

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid={true}>
                    <Breadcrumbs title="Forms" breadcrumbItem="ORDER PRODUCTS" />
                    <Row className="mb-3">
                        <Col className="d-flex justify-content-end gap-2">
                            <Button color="warning" tag={Link} to="/Orders">Order List</Button>
                            <Button color="secondary" onClick={handlePrevOrder}>Previous</Button>
                            <Button color="primary" onClick={handleNextOrder}>Next</Button>
                        </Col>
                    </Row>
                    <Row>

                        <Col xl={12}>
                            <Card>
                                <CardBody>
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
                                            <Col md={4}>
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
                                            <Col md={4}>
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
                                            <Col md={4}>
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
                                        </Row>
                                        <Row>
                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-Inputorder_date">CREATED AT</Label>
                                                    <Input
                                                        type="date"
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
                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label>Payment Method</Label>
                                                    <select
                                                        type="select"
                                                        className="form-control"
                                                        name="payment_status"
                                                        value={formik.values.payment_status}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                    >
                                                        <option>Select Payment Method</option>
                                                        <option value="paid">Paid</option>
                                                        <option value="COD">COD</option>
                                                        <option value="credit">Credit</option>
                                                    </select>
                                                </div>
                                            </Col>
                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-InputZip">Division</Label>
                                                    <select
                                                        type="select"
                                                        name="family"
                                                        className="form-control"
                                                        id="formrow-Inputfamily"
                                                        placeholder="Enter Your family Code"
                                                        value={formik.values.family?.toString() || ""}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                    >
                                                        <option>Select Division</option>
                                                        {familyData.map((sta) => (
                                                            <option key={sta.id} value={String(sta.id)}>{sta.name}</option>
                                                        ))}
                                                    </select>
                                                    {
                                                        formik.errors.family && formik.touched.family ? (
                                                            <FormFeedback type="invalid">{formik.errors.family}</FormFeedback>
                                                        ) : null
                                                    }
                                                </div>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col lg={4}>
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
                                                        <option>Select Company</option>
                                                        {companyData.map((sta) => (
                                                            <option key={sta.id} value={sta.id}>
                                                                {sta.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {formik.errors.company && formik.touched.company && (
                                                        <span className="text-danger">{formik.errors.company}</span>
                                                    )}
                                                </div>
                                            </Col>
                                            <Col lg={4}>
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
                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-InputZip">COD CHARGE</Label>
                                                    <Input
                                                        type="text"
                                                        name="cod_amount"
                                                        className="form-control"
                                                        id="formrow-InputZip"
                                                        placeholder="Enter Your COD charge"
                                                        value={formik.values.cod_amount}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={
                                                            formik.touched.cod_amount && formik.errors.cod_amount ? true : false
                                                        }
                                                    />
                                                    {
                                                        formik.errors.cod_amount && formik.touched.cod_amount ? (
                                                            <FormFeedback type="invalid">{formik.errors.cod_amount}</FormFeedback>
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
                                        <div style={{ marginTop: '20px' }}>
                                            <p>
                                                <strong>Name:</strong>
                                                <span
                                                    onClick={() => handleNameClick(billingAddress?.id)}
                                                    style={{ color: 'white', background: "blue", padding: "10px 10px", cursor: 'pointer' }}
                                                >
                                                    {billingAddress.name}
                                                </span>
                                            </p>
                                            <p><strong>Street:</strong> {billingAddress.address}</p>
                                            <p><strong>Phone:</strong> {billingAddress.phone}</p>
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
                                            <p><strong>Phone:</strong> {shippingAddress.phone}</p>
                                            <p><strong>Alternate Phone:</strong> {billingAddress.alt_phone}</p>
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
                                            <div className="text-end mb-3">
                                                <Button color="primary" onClick={toggleReciptModal}>
                                                    Add Product
                                                </Button>
                                            </div>
                                            <Modal isOpen={isOpen} toggle={toggleReciptModal} size="lg" style={{ maxWidth: "90%", width: "90%" }}>
                                                <ModalHeader toggle={toggleReciptModal}>Search Products</ModalHeader>
                                                <ModalBody>
                                                    {loading ? (
                                                        <div className="text-center">
                                                            <Spinner />
                                                            <p>Loading products...</p>
                                                        </div>
                                                    ) : error ? (
                                                        <div className="text-center text-danger">
                                                            <p>{error}</p>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <Input
                                                                type="text"
                                                                placeholder="Search for products..."
                                                                value={searchQuery}
                                                                onChange={handleSearchChange}
                                                                className="mb-3"
                                                            />
                                                            <Table className="mt-3" responsive bordered hover>
                                                                <thead className="table-light">
                                                                    <tr>
                                                                        <th>#</th>
                                                                        <th>Image</th>
                                                                        <th>Name</th>
                                                                        <th>Price</th>
                                                                        <th>Stock</th>
                                                                        <th>Locked Stock</th>
                                                                        <th>Quantity</th>
                                                                        <th>Action</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {filteredProducts.length >= 0 ? (
                                                                        filteredProducts.flatMap((product, index) => {
                                                                            const rows = [];

                                                                            // Parent product row (only if stock > 0)
                                                                            if (product.stock > 0) {
                                                                                rows.push(
                                                                                    <tr key={`parent-${product.id}`}>
                                                                                        <td>{index + 1}</td>
                                                                                        <td><img src={`${import.meta.env.VITE_APP_IMAGE}${product.image}`} style={{ width: "50px", height: "50px" }} alt={product.name} /></td>
                                                                                        <td>{product.name}</td>
                                                                                        <td>₹{product.selling_price?.toFixed(2)}</td>
                                                                                        <td>{product.stock}</td>
                                                                                        <td>{product.locked_stock}</td>
                                                                                        <td>
                                                                                            <Input
                                                                                                type="number"
                                                                                                min="1"
                                                                                                max={product.stock}
                                                                                                value={quantity[product.id] || 1}
                                                                                                onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                                                                                                className="form-control"
                                                                                            />
                                                                                        </td>
                                                                                        <td>
                                                                                            <Button color="success" size="sm" onClick={() => addToItem(product)} disabled={product.stock === 0}>
                                                                                                Add
                                                                                            </Button>
                                                                                        </td>
                                                                                    </tr>
                                                                                );
                                                                            }

                                                                            // Variant rows (only if stock > 0)
                                                                            if (Array.isArray(product.variantIDs)) {
                                                                                product.variantIDs.forEach((variant, variantIndex) => {
                                                                                    if (variant.stock > 0) {
                                                                                        rows.push(
                                                                                            <tr key={`variant-${variant.id}`}>
                                                                                                <td>{index + 1}.{variantIndex + 1}</td>
                                                                                                <td><img src={`${import.meta.env.VITE_APP_IMAGE}${variant.image}`} style={{ width: "50px", height: "50px" }} alt={variant.name} /></td>
                                                                                                <td>{variant.name}</td>
                                                                                                <td>₹{variant.selling_price?.toFixed(2)}</td>
                                                                                                <td>{variant.stock}</td>
                                                                                                <td>{variant.locked_stock}</td>
                                                                                                <td>
                                                                                                    <Input
                                                                                                        type="number"
                                                                                                        min="1"
                                                                                                        max={variant.stock}
                                                                                                        value={quantity[variant.id] || 1}
                                                                                                        onChange={(e) => handleQuantityChange(variant.id, e.target.value)}
                                                                                                        className="form-control"
                                                                                                    />
                                                                                                </td>
                                                                                                <td>
                                                                                                    <Button color="success" size="sm" onClick={() => addToItem(product, variant)} disabled={variant.stock === 0}>
                                                                                                        Add
                                                                                                    </Button>
                                                                                                </td>
                                                                                            </tr>
                                                                                        );
                                                                                    }
                                                                                });
                                                                            }

                                                                            return rows;
                                                                        })
                                                                    ) : (
                                                                        <tr>
                                                                            <td colSpan="7" className="text-center">
                                                                                No products found.
                                                                            </td>
                                                                        </tr>
                                                                    )}
                                                                </tbody>
                                                            </Table>
                                                        </>
                                                    )}
                                                </ModalBody>
                                            </Modal>
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
                                                                <td>{TaxAmount.toFixed(2)}</td>
                                                                <td>
                                                                    <Input
                                                                        type="number"
                                                                        value={item.quantity}
                                                                        disabled={isAddDisabled}
                                                                        onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                                                                        style={{ width: '80px' }}
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <Input
                                                                        type="number"
                                                                        value={item.rate}
                                                                        disabled={isAddDisabled}
                                                                        onChange={(e) => handleItemChange(index, 'rate', Number(e.target.value))}
                                                                        style={{ width: '80px' }}
                                                                    />
                                                                </td>
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
                                                                        onClick={() => handleRemoveItem(item.id)}
                                                                    // disabled={isDisabled}
                                                                    >
                                                                        Remove
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {/* Total Row */}
                                                        <tr className="total-row">
                                                            <td colSpan="7" className="text-end font-weight-bold">Totals:</td>

                                                            {/* <td></td>
                                                            <td></td>
                                                            <td></td> */}
                                                            {/* <td></td> */}
                                                            <td className="font-weight-bold">
                                                                {orderItems.reduce((acc, item) => acc + parseInt(item.quantity), 0)}
                                                            </td>
                                                            <td></td>
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
                                                                        <th scope="row" className="text-dark" style={{ backgroundColor: "#f1f3f5", fontWeight: "bold" }}>
                                                                            Bank Name
                                                                        </th>
                                                                        <td style={{ fontWeight: "500" }}>
                                                                            <select
                                                                                className="form-select"
                                                                                value={selectedBank}
                                                                                onChange={(e) => {
                                                                                    const selectedId = parseInt(e.target.value);
                                                                                    setSelectedBank(selectedId);
                                                                                    const selected = banks.find((b) => b.id === selectedId);
                                                                                    if (selected) {
                                                                                        setBankDetails({
                                                                                            id: selected.id,
                                                                                            name: selected.name,
                                                                                            accountNumber: selected.account_number,
                                                                                            ifscCode: selected.ifsc_code,
                                                                                            Branch: selected.branch,
                                                                                        });
                                                                                    }
                                                                                }}
                                                                            >
                                                                                <option value="">Select a bank</option>
                                                                                {banks.map((bank) => (
                                                                                    <option key={bank.id} value={bank.id}>
                                                                                        {bank.name}
                                                                                    </option>
                                                                                ))}
                                                                            </select>
                                                                        </td>
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
                                                                        <td><strong className="text-success" style={{ fontWeight: "700", fontSize: "1.2em" }}>₹{totalPayableAmountDisplay.toFixed(2)}</strong></td>
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
                                            <div className="mb-3 mt-3" style={{ textAlign: "right" }}>
                                                <Button type="submit" color="primary" disabled={isAddDisabled} onClick={handleSubmit}>
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
                            <Paymentrecipent
                                billingPhone={billingAddress.phone}
                                customerId={customerId}
                                totalPayableAmountDisplay={totalPayableAmountDisplay}
                            />
                            <Information refreshData={fetchOrderData} />
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
                                                            onClick={() => handleDownloadAddress()}
                                                        >
                                                            Download address
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
                                                            onClick={() => handleDownloadDeliveryNote()}
                                                        >
                                                            Download Delivery Note
                                                        </button>
                                                    </div>
                                                </Col>
                                            </Row>
                                        </CardBody>
                                    </Card>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </Container>
            </div >
        </React.Fragment >
    );
};

export default FormLayouts;
