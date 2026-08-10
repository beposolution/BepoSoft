import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card, Col, Container, Row, CardBody, Button, CardTitle, Label, ModalHeader, Modal, Form, Input, Table, FormFeedback, ModalBody } from "reactstrap";
import { FaFileInvoice, FaCalendarAlt, FaUser, FaDollarSign, FaUniversity, FaIdBadge, FaUserCheck, FaUserPlus, FaStickyNote } from "react-icons/fa";
import * as Yup from 'yup';
import { useFormik } from "formik";
import axios from 'axios';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Breadcrumbs from "../../components/Common/Breadcrumb";

const FormLayouts = () => {

    // meta title
    document.title = "Form Layouts | Skote - Vite React Admin & Dashboard Template";
    const { id } = useParams();
    const { invoice } = useParams();

    const [orderItems, setOrderItems] = React.useState([]);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const toggleModal = () => {
        setModalOpen((prev) => !prev);
    };
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

    const [products, setProducts] = useState([]);
    const [productSearch, setProductSearch] = useState("");
    const [productLoading, setProductLoading] = useState(false);
    const [productError, setProductError] = useState("");
    const [productQuantity, setProductQuantity] = useState({});
    const [addingProductId, setAddingProductId] = useState(null);

    const role = localStorage.getItem("active");

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
        email: "",
        gst: "",
        address: "",
        zipcode: "",
    })

    const createDataLog = async (action, beforeData = {}, afterData = {}) => {
        try {
            const token = localStorage.getItem("token");

            if (!token) {
                console.error("Datalog: Authorization token missing");
                return;
            }

            // Product item order ID is the actual Proforma order ID.
            const orderId = orderItems?.[0]?.order;

            if (!orderId) {
                console.error("Datalog: Order ID missing");
                return;
            }

            const logPayload = {
                order: Number(orderId),

                before_data: {
                    Action: action,
                    Data: beforeData,
                },

                after_data: {
                    Action: action,
                    Data: afterData,
                },
            };

            await axios.post(
                `${import.meta.env.VITE_APP_KEY}datalog/create/`,
                logPayload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            console.log("Datalog created:", action);

        } catch (error) {
            // Datalog failure should NOT stop the main operation.
            console.error(
                "Datalog creation failed:",
                error?.response?.data || error
            );
        }
    };


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
                const response = await fetch(`${import.meta.env.VITE_APP_KEY}shipping/${id}/order/`, {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        code_charge: values.code_charge,
                        shipping_mode: values.shipping_mode,
                    }),
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();
                setSuccessMessage("Form submitted successfully!");
            } catch (error) {
                setErrorMessage("Failed to submit the form. Please try again.")
                setSuccessMessage("");
            }
        }

    });


    useEffect(() => {
        const fetchBanks = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_APP_KEY}banks`, {
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




    // Fetch order data when component mounts or id changes
    const fetchOrderData = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_APP_KEY}perfoma/${invoice}/invoice/`, {
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

            if (data) {
                formik.setValues({
                    invoice: data.invoice || "",
                    status: data.status || "",
                    manage_staff: data.manage_staff_name || "",
                    order_date: data.order_date || "",
                    company: data.company || "",
                    shipping_mode: data.shipping_mode || "",
                    code_charge: data.code_charge || "",
                    check: data.check || false,
                    family: data.familyname || "",
                });

                setOrderItems(data.perfoma_items || []);

                setShippingAddress({
                    name: data.billing_address?.name || "",
                    address: data.billing_address?.address || "",
                    email: data.billing_address?.email || "",
                    zipcode: data.billing_address?.zipcode || "",
                    city: data.billing_address?.city || "",
                    country: data.billing_address?.country || "",
                    phone: data.billing_address?.phone || "",
                    state: data.billing_address?.state || "",
                });

                setBillingAddress({
                    name: data.customer?.name || "",
                    address: data.customer?.address || "",
                    email: data.customer?.email || "",
                    zipcode: data.customer?.zip_code || "",
                    city: data.customer?.city || "",
                    country: data.customer?.country || "",
                    phone: data.customer?.phone || "",
                    state: data.customer?.state || "",
                    gst: data.customer?.gst || "",
                });

                setBankDetails({
                    name: data.bank?.name || "",
                    accountNumber: data.bank?.account_number || "",
                    ifscCode: data.bank?.ifsc_code || "",
                    branch: data.bank?.branch || "",
                });

                setpaymentReceipts(data.payment_receipts || []);

                // Update calculations based on the correct order items array `perfoma_items`
                calculateTotalAmount(data.perfoma_items || []);
                calculateTotalDiscountAmount(data.perfoma_items || []);
                calculateTotalNetPrice(data.perfoma_items || []);
                calculateNetAmountBeforeTax(data.perfoma_items || []);
                calculateTaxAmount(data.perfoma_items || []);
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

        const total = subtotal + shippingCharge; // Add shipping charge to subtotal
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

    const fetchProducts = async (search = "") => {
        const token = localStorage.getItem("token");

        if (!token) {
            toast.error("Authorization token is missing");
            return;
        }

        setProductLoading(true);
        setProductError("");

        try {
            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}all/products/get/`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    params: {
                        search: search,
                    },
                }
            );

            const results =
                response?.data?.results ||
                response?.data?.data ||
                [];

            setProducts(
                Array.isArray(results)
                    ? results
                    : []
            );

        } catch (error) {
            console.error(
                "Product fetch error:",
                error?.response?.data || error
            );

            setProducts([]);
            setProductError("Failed to load products");
        } finally {
            setProductLoading(false);
        }
    };

    useEffect(() => {
        if (!modalOpen) {
            return;
        }

        const timer = setTimeout(() => {
            fetchProducts(productSearch);
        }, 400);

        return () => clearTimeout(timer);

    }, [modalOpen, productSearch]);

    const handleNewProductQuantityChange = (
        productId,
        value,
        availableStock
    ) => {
        let enteredQuantity = parseInt(value, 10);

        if (!Number.isFinite(enteredQuantity) || enteredQuantity < 1) {
            enteredQuantity = 1;
        }

        const stock = Number(availableStock || 0);

        if (enteredQuantity > stock) {
            toast.error(
                `Available quantity is only ${stock}. Please contact Accounts.`
            );

            setProductQuantity((prev) => ({
                ...prev,
                [productId]: stock > 0 ? stock : 1,
            }));

            return;
        }

        setProductQuantity((prev) => ({
            ...prev,
            [productId]: enteredQuantity,
        }));
    };

    const handleAddProduct = async (product) => {
        const token = localStorage.getItem("token");

        if (!token) {
            toast.error("Authorization token is missing");
            return;
        }

        if (!product?.id) {
            toast.error("Invalid product selected");
            return;
        }

        // SAME ORDER ID USED BY UPDATE / DELETE API
        const orderId = orderItems?.[0]?.order;

        if (!orderId) {
            toast.error("Order ID is missing");
            console.error("Unable to get orderId from orderItems:", orderItems);
            return;
        }

        const quantity =
            Number(productQuantity[product.id]) || 1;

        const availableStock =
            Number(product.available_stock || 0);

        if (availableStock <= 0) {
            toast.error("No available stock");
            return;
        }

        if (quantity <= 0) {
            toast.error("Quantity must be at least 1");
            return;
        }

        if (quantity > availableStock) {
            toast.error(
                `Available quantity is only ${availableStock}. Please contact Accounts.`
            );
            return;
        }

        const rate = Number(
            product.selling_price ??
            product.rate ??
            product.price ??
            0
        );

        const tax = Number(
            product.tax ??
            product.tax_percentage ??
            product.gst ??
            0
        );

        const payload = {
            product: Number(product.id),
            quantity: quantity,
            rate: rate,
            discount: 0,
            tax: tax,
            description:
                product.description ||
                product.name ||
                "Additional product",
        };

        console.log("ORDER ID:", orderId);
        console.log("ADD PRODUCT PAYLOAD:", payload);

        setAddingProductId(product.id);

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_APP_KEY}perfoma/order/${orderId}/item/add/`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            console.log(
                "ADD PRODUCT RESPONSE:",
                response.data
            );

            toast.success(
                response?.data?.message ||
                "Product added successfully"
            );

            setProductQuantity((prev) => ({
                ...prev,
                [product.id]: 1,
            }));

            await createDataLog(
                "Product Added to Proforma",
                {},
                {
                    product_id: product.id,
                    product_name: product.name,
                    quantity: quantity,
                    rate: rate,
                    discount: 0,
                    tax: tax,
                    description: payload.description,
                }
            );

            // Refresh products in invoice
            await fetchOrderData();

        } catch (error) {
            console.error(
                "Add Proforma product error:",
                error?.response?.data || error
            );

            const data = error?.response?.data;

            let message = "Failed to add product";

            if (typeof data?.message === "string") {
                message = data.message;

            } else if (typeof data?.detail === "string") {
                message = data.detail;

            } else if (data?.description) {
                message = Array.isArray(data.description)
                    ? data.description.join(", ")
                    : String(data.description);

            } else if (data) {
                try {
                    message = JSON.stringify(data);
                } catch {
                    message = "Failed to add product";
                }
            }

            toast.error(message);

        } finally {
            setAddingProductId(null);
        }
    };

    const handleRemoveItem = async (orderId, itemId) => {

        const removedItem = orderItems.find(
            (item) => Number(item.id) === Number(itemId)
        );

        const confirmDelete = window.confirm(
            "Are you sure you want to remove this product?"
        );

        if (!confirmDelete) {
            return;
        }

        try {
            const token = localStorage.getItem("token");

            if (!token) {
                toast.error("Authorization token is missing");
                return;
            }

            const response = await fetch(
                `${import.meta.env.VITE_APP_KEY}perfoma/order/${orderId}/item/${itemId}/delete/`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    data?.errors ||
                    "Failed to remove product"
                );
            }

            toast.success(
                data?.message || "Product removed successfully"
            );

            await createDataLog(
                "Product Removed from Proforma",
                removedItem
                    ? {
                        product_id: removedItem.product,
                        product_name: removedItem.name,
                        quantity: removedItem.quantity,
                        rate: removedItem.rate,
                        discount: removedItem.discount,
                        tax: removedItem.tax,
                    }
                    : {
                        item_id: itemId,
                    },
                {}
            );

            // Reload Performa data after delete.
            // This updates products + all calculations.
            await fetchOrderData();

        } catch (error) {
            console.error("Delete product error:", error);

            toast.error(
                error.message || "Failed to remove product"
            );
        }
    };


    const updateCartProduct = async (
        orderId,
        itemId,
        updateData,
        oldItem = null
    ) => {
        const token = localStorage.getItem("token");

        if (!token) {
            toast.error("Authorization token is missing");
            return;
        }

        try {
            const response = await fetch(
                `${import.meta.env.VITE_APP_KEY}perfoma/order/${orderId}/item/${itemId}/update/`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(updateData),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    data?.errors ||
                    "Failed to update product"
                );
            }

            toast.success("Product updated successfully");

            const changedField = Object.keys(updateData)[0];

            await createDataLog(
                `Product ${changedField} Updated`,
                {
                    item_id: itemId,
                    product_id: oldItem?.product,
                    product_name: oldItem?.name,
                    [changedField]: oldItem?.[changedField],
                },
                {
                    item_id: itemId,
                    product_id: oldItem?.product,
                    product_name: oldItem?.name,
                    [changedField]: updateData[changedField],
                }
            );

            // Reload the latest Performa data
            await fetchOrderData();

        } catch (error) {
            console.error("Update Performa product error:", error);

            toast.error(
                error.message || "Failed to update product"
            );
        }
    };

    // Handle Quantity/Discount Change
    const handleItemChange = async (index, field, value) => {
        const updatedItems = [...orderItems];

        const item = updatedItems[index];

        if (!item) {
            return;
        }

        const numericValue = Number(value);

        updatedItems[index] = {
            ...item,
            [field]: numericValue,
        };

        setOrderItems(updatedItems);

        const updateData = {
            [field]: numericValue,
        };

        await updateCartProduct(
            item.order,
            item.id,
            updateData,
            item
        );
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
                setSuccessMessage("Form submitted successfully!");

                await createDataLog(
                    "Shipping / Total Information Updated",
                    {
                        shipping_charge: shippingCharge,
                        total_amount: totalAmount,
                    },
                    {
                        shipping_charge: payload.shipping_charge,
                        total_amount: payload.total_amount,
                    }
                );

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


    const Recieptformik = useFormik({
        initialValues: {
            date: new Date().toISOString().slice(0, 10), // Today's date
            amount: '',
            bank: '',
            transactionID: '',
            receivedBy: '',
            createdBy: loggedUser || '', // Set loggedUser as default for createdBy
            remarks: '',
        },
        validationSchema: Yup.object({  // Fix: added ":" after validationSchema
            date: Yup.date().required("Date is required"),
            amount: Yup.number().required("Amount is required").positive("Amount must be positive"),
            bank: Yup.string().required("Bank selection is required"),
            transactionID: Yup.string().required("Transaction ID is required"),
            receivedBy: Yup.string().required("Receiver's name is required"),
            createdBy: Yup.string().required("Creator's name is required"),
            remarks: Yup.string().max(300, "Remarks can't exceed 300 characters"),
        }),
        onSubmit: async (values) => {
            setLoading(true); // Start loading
            try {
                const response = await axios.post(
                    `${import.meta.env.VITE_APP_KEY}payment/${id}/reciept/`,
                    values,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${localStorage.getItem('token')}`, // Include token if required
                        },
                    }
                );
                alert("Receipt saved successfully!");

                await createDataLog(
                    "Payment Receipt Added",
                    {},
                    {
                        date: values.date,
                        amount: values.amount,
                        bank: values.bank,
                        transactionID: values.transactionID,
                        receivedBy: values.receivedBy,
                        createdBy: values.createdBy,
                        remarks: values.remarks,
                    }
                );

                toggleReciptModal(); // Close modal after saving
            } catch (error) {
                alert("Failed to save receipt. Please try again.");
            } finally {
                setLoading(false); // End loading
            }
        },
    });

    const handleInformationSubmit = async () => {
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
                setSuccessMessage("Form submitted successfully!");

                await createDataLog(
                    "Shipping / Total Information Updated",
                    {
                        shipping_charge: shippingCharge,
                        total_amount: totalAmount,
                    },
                    {
                        shipping_charge: payload.shipping_charge,
                        total_amount: payload.total_amount,
                    }
                );
            } else {
                const errorData = await response.json();
                setErrorMessage("Failed to submit the form. Please check your input and try again.");
            }
        } catch (error) {
            setErrorMessage("An unexpected error occurred. Please try again later.");
            setSuccessMessage("");
        }
    };

    const handleDownloadPerformaInvoice = () => {
        const addressurl = `${import.meta.env.VITE_APP_IMAGE}/performainvoice/${invoice}/`;
        window.open(addressurl, "_blank");
    }

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
                                                        disabled
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
                                                        disabled
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
                                                    <Label htmlFor="formrow-InputZip">Division</Label>
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
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <CardTitle className="h4 mb-0">
                                                    Bordered Table
                                                </CardTitle>

                                                <Button
                                                    color="primary"
                                                    type="button"
                                                    onClick={toggleModal}
                                                >
                                                    Add Product
                                                </Button>
                                            </div>
                                            <div className="table-responsive">
                                                <Table className="table table-bordered table-striped mb-0">
                                                    <thead>
                                                        <tr className="table-header">
                                                            <th>ID</th>
                                                            <th>Image</th>
                                                            <th>Name</th>
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
                                                                    {item.images ? (
                                                                        <img
                                                                            src={`${import.meta.env.VITE_APP_IMAGE}${item.images}`}
                                                                            alt={item.name || "Product Image"}
                                                                            style={{
                                                                                width: "50px",
                                                                                height: "50px",
                                                                                objectFit: "cover",
                                                                                borderRadius: "5px",
                                                                            }}
                                                                            onError={(e) => {
                                                                                e.currentTarget.style.display = "none";
                                                                            }}
                                                                        />
                                                                    ) : (
                                                                        <span>No Image</span>
                                                                    )}
                                                                </td>

                                                                <td>{item.name}</td>

                                                                {/* EDITABLE RATE */}
                                                                <td>
                                                                    <Input
                                                                        type="number"
                                                                        value={item.rate}
                                                                        min="0"
                                                                        onChange={(e) =>
                                                                            handleItemChange(
                                                                                index,
                                                                                "rate",
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                        style={{ width: "90px" }}
                                                                    />
                                                                </td>

                                                                <td>{item.tax} %</td>

                                                                <td>
                                                                    {(Number(item.rate || 0) - Number(item.exclude_price || 0)).toFixed(2)}
                                                                </td>

                                                                {/* EDITABLE QUANTITY */}
                                                                <td>
                                                                    <Input
                                                                        type="number"
                                                                        value={item.quantity}
                                                                        min="1"
                                                                        onChange={(e) =>
                                                                            handleItemChange(
                                                                                index,
                                                                                "quantity",
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                        style={{ width: "80px" }}
                                                                    />
                                                                </td>

                                                                <td>
                                                                    {(Number(item.rate || 0) - Number(item.discount || 0)).toFixed(2)}
                                                                </td>

                                                                {/* EDITABLE DISCOUNT */}
                                                                <td>
                                                                    <Input
                                                                        type="number"
                                                                        value={item.discount}
                                                                        min="0"
                                                                        onChange={(e) =>
                                                                            handleItemChange(
                                                                                index,
                                                                                "discount",
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                        style={{ width: "80px" }}
                                                                    />
                                                                </td>

                                                                <td>
                                                                    {(
                                                                        (Number(item.rate || 0) - Number(item.discount || 0)) *
                                                                        Number(item.quantity || 0)
                                                                    ).toFixed(2)}
                                                                </td>

                                                                <td>
                                                                    <Button
                                                                        color="danger"
                                                                        onClick={() =>
                                                                            handleRemoveItem(
                                                                                item.order,
                                                                                item.id
                                                                            )
                                                                        }
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
                                            {/* <div className="mb-3 mt-3">
                                                <Button color="primary" onClick={toggleModal}>
                                                    Add Products
                                                </Button>
                                            </div> */}

                                            <div className="mb-3 mt-3" style={{ textAlign: "right" }}>
                                                <Button type="submit" color="primary" onClick={handleSubmit}>
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

                            </Card>
                        </Col>


                        <Col xl={12}>

                            {/* <Information/> */}
                            <Row>
                                <Col xl={12}>
                                    <Card>
                                        <CardBody>
                                            <CardTitle className="mb-4">ORDER and DOWNLOAD BILLS AND INVOICE</CardTitle>

                                            <Row>
                                                <Col md={4}>
                                                    <div className="d-flex align-items-center mb-3">
                                                        <Link
                                                            to={`/perfoma/order/${invoice}/`}
                                                            className="btn btn-primary px-4 py-2 w-100" // Bootstrap button styles
                                                            style={{
                                                                fontWeight: 'bold',
                                                                textDecoration: 'none',
                                                                borderRadius: '5px',
                                                                backgroundColor: '#007bff',
                                                                color: '#ffffff'
                                                            }}
                                                        >
                                                            Order
                                                        </Link>
                                                    </div>
                                                </Col>

                                                <Col md={4}>
                                                    <div className="d-flex align-items-center mb-3">
                                                        <button
                                                            type="button"
                                                            className="btn btn-secondary w-100"
                                                            onClick={() => handleDownloadPerformaInvoice()}
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
                        </Col>
                    </Row>

                    <Modal
                        isOpen={modalOpen}
                        toggle={toggleModal}
                        size="lg"
                        style={{
                            maxWidth: "90%",
                            width: "90%",
                        }}
                    >
                        <ModalHeader toggle={toggleModal}>
                            Search Products
                        </ModalHeader>

                        <ModalBody>

                            {/* SEARCH */}
                            <Input
                                type="text"
                                placeholder="Search for products..."
                                value={productSearch}
                                onChange={(e) =>
                                    setProductSearch(e.target.value)
                                }
                                className="mb-3"
                            />

                            {/* LOADING */}
                            {productLoading ? (

                                <div className="text-center py-4">
                                    <div
                                        className="spinner-border text-primary"
                                        role="status"
                                    >
                                        <span className="visually-hidden">
                                            Loading...
                                        </span>
                                    </div>

                                    <div className="mt-2">
                                        Loading products...
                                    </div>
                                </div>

                            ) : productError ? (

                                <div className="text-center text-danger py-3">
                                    {productError}
                                </div>

                            ) : (

                                <div className="table-responsive">

                                    <Table
                                        className="table table-bordered table-hover"
                                    >

                                        <thead className="table-light">
                                            <tr>
                                                <th>#</th>
                                                <th>Image</th>
                                                <th>Name</th>
                                                <th>Price</th>

                                                {(
                                                    role === "Accounts" ||
                                                    role === "Accounts / Accounting" ||
                                                    role === "CEO" ||
                                                    role === "COO" ||
                                                    role === "ADMIN"
                                                ) && (
                                                        <th>Stock</th>
                                                    )}

                                                <th>
                                                    Available Stock
                                                </th>

                                                <th>
                                                    Quantity
                                                </th>

                                                <th>
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>

                                            {products.length > 0 ? (

                                                products.map(
                                                    (product, index) => {

                                                        const availableStock =
                                                            Number(
                                                                product.available_stock ||
                                                                0
                                                            );

                                                        return (

                                                            <tr key={product.id}>

                                                                <td>
                                                                    {index + 1}
                                                                </td>

                                                                {/* IMAGE */}
                                                                <td>

                                                                    {product.image ? (

                                                                        <img
                                                                            src={`${import.meta.env.VITE_APP_IMAGE}${product.image}`}
                                                                            alt={
                                                                                product.name ||
                                                                                "Product"
                                                                            }
                                                                            style={{
                                                                                width: "50px",
                                                                                height: "50px",
                                                                                objectFit: "cover",
                                                                                borderRadius: "6px",
                                                                            }}
                                                                            onError={(e) => {
                                                                                e.currentTarget.style.display =
                                                                                    "none";
                                                                            }}
                                                                        />

                                                                    ) : (

                                                                        <span>
                                                                            No Image
                                                                        </span>

                                                                    )}

                                                                </td>

                                                                {/* NAME */}
                                                                <td>
                                                                    {product.name ||
                                                                        "Unknown Product"}
                                                                </td>

                                                                {/* PRICE */}
                                                                <td>
                                                                    ₹
                                                                    {Number(
                                                                        product.selling_price ||
                                                                        product.rate ||
                                                                        product.price ||
                                                                        0
                                                                    ).toFixed(2)}
                                                                </td>

                                                                {/* STOCK */}
                                                                {(
                                                                    role === "Accounts" ||
                                                                    role === "Accounts / Accounting" ||
                                                                    role === "CEO" ||
                                                                    role === "COO" ||
                                                                    role === "ADMIN"
                                                                ) && (

                                                                        <td>
                                                                            {Number(
                                                                                product.stock ||
                                                                                0
                                                                            )}
                                                                        </td>

                                                                    )}

                                                                {/* AVAILABLE STOCK */}
                                                                <td>
                                                                    {availableStock}
                                                                </td>

                                                                {/* QUANTITY */}
                                                                <td>

                                                                    <Input
                                                                        type="number"
                                                                        min="1"
                                                                        max={
                                                                            availableStock
                                                                        }
                                                                        value={
                                                                            productQuantity[
                                                                            product.id
                                                                            ] || 1
                                                                        }
                                                                        onChange={(e) =>
                                                                            handleNewProductQuantityChange(
                                                                                product.id,
                                                                                e.target.value,
                                                                                availableStock
                                                                            )
                                                                        }
                                                                        style={{
                                                                            width: "100px",
                                                                        }}
                                                                    />

                                                                </td>

                                                                {/* ACTION */}
                                                                <td>

                                                                    <Button
                                                                        color="success"
                                                                        size="sm"
                                                                        type="button"
                                                                        disabled={
                                                                            availableStock <= 0 ||
                                                                            addingProductId ===
                                                                            product.id
                                                                        }
                                                                        onClick={() =>
                                                                            handleAddProduct(
                                                                                product
                                                                            )
                                                                        }
                                                                    >

                                                                        {addingProductId ===
                                                                            product.id
                                                                            ? "Adding..."
                                                                            : "Add"}

                                                                    </Button>

                                                                </td>

                                                            </tr>

                                                        );
                                                    }
                                                )

                                            ) : (

                                                <tr>

                                                    <td
                                                        colSpan={
                                                            (
                                                                role === "Accounts" ||
                                                                role ===
                                                                "Accounts / Accounting" ||
                                                                role === "CEO" ||
                                                                role === "COO" ||
                                                                role === "ADMIN"
                                                            )
                                                                ? 8
                                                                : 7
                                                        }
                                                        className="text-center"
                                                    >
                                                        No products found.
                                                    </td>

                                                </tr>

                                            )}

                                        </tbody>

                                    </Table>

                                </div>

                            )}

                        </ModalBody>
                    </Modal>

                </Container>
            </div >
        </React.Fragment >
    );
};

export default FormLayouts;
