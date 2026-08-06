import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardBody, Col, Container, Row, Label, Input, Button, FormFeedback } from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import axios from "axios";
import { useFormik } from "formik";
import * as Yup from 'yup';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const PerfomaOrder = () => {
    const { invoice } = useParams();
    const [orders, setOrders] = useState(null);
    const token = localStorage.getItem('token');
    const [banks, setBanks] = useState([]);
    const [selectedProductId, setSelectedProductId] = useState("");
    const [addQuantity, setAddQuantity] = useState(1);
    const [paymentImages, setPaymentImages] = useState([]);
    const [paymentImagesError, setPaymentImagesError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAddingItemsToCart, setIsAddingItemsToCart] = useState(false);
    const [invoiceItemsAdded, setInvoiceItemsAdded] = useState(false);

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            state: orders?.state || "",
            company: orders?.company || "",
            family: orders?.family || "",
            customer: orders?.customerID || "",
            manage_staff: orders?.manage_staff || "",
            billing_address: orders?.billing_address?.id || "",
            payment_status: "",
            payment_method: "",
            bank: "",
            cod_status: "",
            cod_amount: "",
            adv_cod_amount: "",
            total_amount: orders?.total_amount || 0,
            // order_date: orders?.order_date || new Date().toISOString().substring(0, 10),
            order_date: new Date().toISOString().split("T")[0],
            status: "Invoice Created",
            warehouses: orders?.warehouse_id || "",
        },
        validationSchema: Yup.object({
            payment_status: Yup.string().required("Payment status is required"),

            payment_method: Yup.string().when("payment_status", {
                is: (val) => val === "paid" || val === "credit",
                then: (schema) => schema.required("Payment method is required"),
                otherwise: (schema) => schema.notRequired(),
            }),

            bank: Yup.string().when("payment_status", {
                is: (val) => val === "paid" || val === "credit",
                then: (schema) => schema.required("Bank selection is required"),
                otherwise: (schema) => schema.notRequired(),
            }),

            cod_status: Yup.string().when("payment_status", {
                is: "COD",
                then: (schema) => schema.required("COD Status is required"),
                otherwise: (schema) => schema.nullable(),
            }),

            cod_amount: Yup.number().when("cod_status", {
                is: "FULL_COD",
                then: (schema) => schema.required("COD Amount is required"),
                otherwise: (schema) => schema.nullable(),
            }),

            adv_cod_amount: Yup.number().when("cod_status", {
                is: "PARTIAL_COD",
                then: (schema) => schema.required("Advance COD Amount is required"),
                otherwise: (schema) => schema.nullable(),
            }),
        }),
        onSubmit: async (values, { resetForm }) => {
            if (!orders) {
                toast.error("Performa order data is not available");
                return;
            }

            if (paymentImages.length === 0) {
                setPaymentImagesError("At least one payment slip is required");
                toast.error("Please select at least one payment slip");
                return;
            }

            setIsSubmitting(true);

            try {
                const payload = {
                    ...values,
                    state: orders.state,
                    company: orders.company,
                    family: orders.family,
                    customer: orders.customerID,
                    manage_staff: orders.manage_staff,
                    billing_address: orders.billing_address?.id,
                    warehouses: orders.warehouse_id,
                    total_amount: orders.total_amount,
                };

                // SAME PAYMENT LOGIC AS THE EXISTING ORDER CREATION PAGE
                if (values.payment_status === "COD") {
                    payload.cod_amount = Number(values.cod_amount || 0);

                    if (values.cod_status === "PARTIAL_COD") {
                        payload.adv_cod_amount = Number(values.adv_cod_amount || 0);
                    } else {
                        payload.adv_cod_amount = null;
                    }
                } else {
                    delete payload.cod_status;
                    delete payload.cod_amount;
                    delete payload.adv_cod_amount;
                }

                const formData = new FormData();

                Object.entries(payload).forEach(([key, value]) => {
                    if (value !== undefined && value !== null && value !== "") {
                        formData.append(key, value);
                    }
                });

                paymentImages.forEach((imageItem) => {
                    formData.append("images", imageItem.file);
                });

                const response = await axios.post(
                    `${import.meta.env.VITE_APP_KEY}order/create/new/`,
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (response.status === 201) {
                    toast.success(
                        response?.data?.message ||
                        "Order and payment slips created successfully!"
                    );

                    paymentImages.forEach((imageItem) => {
                        URL.revokeObjectURL(imageItem.preview);
                    });

                    setPaymentImages([]);
                    setPaymentImagesError("");
                    resetForm();
                }
            } catch (error) {
                const responseData = error?.response?.data;

                if (
                    responseData?.error_code === "OUT_OF_STOCK" &&
                    Array.isArray(responseData?.errors)
                ) {
                    const stockMessage = responseData.errors
                        .map((item) =>
                            `${item.product_name || `Product ${item.product_id}`}: ${item.message}`
                        )
                        .join(" | ");

                    toast.error(stockMessage || responseData.message);
                } else if (responseData?.errors) {
                    const validationMessage = typeof responseData.errors === "string"
                        ? responseData.errors
                        : Object.entries(responseData.errors)
                            .map(([field, messages]) =>
                                `${field}: ${Array.isArray(messages) ? messages.join(", ") : messages}`
                            )
                            .join(" | ");

                    toast.error(validationMessage || responseData.message);
                } else {
                    toast.error(
                        responseData?.message || "Failed to create order"
                    );
                }
            } finally {
                setIsSubmitting(false);
            }
        }
    });


    const handlePaymentImagesChange = (event) => {
        const selectedFiles = Array.from(event.target.files || []);

        if (selectedFiles.length === 0) {
            return;
        }

        const newImages = selectedFiles.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
        }));

        setPaymentImages((previousImages) => [
            ...previousImages,
            ...newImages,
        ]);
        setPaymentImagesError("");

        // Allows selecting the same file again after removing it.
        event.target.value = "";
    };

    const removePaymentImage = (indexToRemove) => {
        setPaymentImages((previousImages) => {
            const imageToRemove = previousImages[indexToRemove];

            if (imageToRemove?.preview) {
                URL.revokeObjectURL(imageToRemove.preview);
            }

            const updatedImages = previousImages.filter(
                (_, index) => index !== indexToRemove
            );

            if (updatedImages.length === 0) {
                setPaymentImagesError("At least one payment slip is required");
            }

            return updatedImages;
        });
    };


    const handleAddToCart = async () => {
        if (!selectedProductId || addQuantity <= 0) {
            alert("Select a valid product and quantity.");
            return;
        }

        const payload = {
            product: selectedProductId,
            quantity: addQuantity
        };

        try {
            const response = await fetch(`${import.meta.env.VITE_APP_KEY}cart/product/`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error("Failed to add product to cart.");
            }

            const data = await response.json();
            alert("Product added to cart successfully!");

            fetchOrderData();
        } catch (error) {
            toast.error("Error adding to cart:");
            alert("Error adding product to cart.");
        }
    };

    const handleAddInvoiceItemsToCart = async () => {
        if (invoiceItemsAdded || isAddingItemsToCart) {
            return;
        }

        if (!orders || !orders.perfoma_items || orders.perfoma_items.length === 0) {
            toast.error("No items available to add to cart");
            return;
        }

        setIsAddingItemsToCart(true);

        try {
            for (const item of orders.perfoma_items) {
                const payload = {
                    product: item.product,
                    quantity: item.quantity
                };

                const response = await fetch(`${import.meta.env.VITE_APP_KEY}cart/product/`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => null);
                    throw new Error(
                        errorData?.message ||
                        `Failed to add ${item.name || `product ID ${item.product}`} to cart`
                    );
                }
            }

            setInvoiceItemsAdded(true);
            toast.success("All items added to cart successfully!");
        } catch (error) {
            toast.error(error?.message || "Some items could not be added to cart");
        } finally {
            setIsAddingItemsToCart(false);
        }
    };

    const fetchOrderData = async () => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_APP_KEY}perfoma/${invoice}/invoice/`,
                {
                    method: 'GET',
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setOrders(data);

        } catch (error) {
            toast.error("Error fetching order data:");
        }
    };

    const fetchBanks = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_APP_KEY}banks/`, {
                method: 'GET',
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setBanks(data.data);

        } catch (error) {
            toast.error("Error fetching banks:");
        }
    };

    useEffect(() => {
        fetchOrderData();
    }, []);

    useEffect(() => {
        fetchBanks();
    }, []);


    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid={true}>
                    <Breadcrumbs title="Forms" breadcrumbItem="INVOICE ORDER" />
                    <div>
                        <Card>
                            <CardBody>
                                <Row>
                                    <Col>
                                        {orders?.perfoma_items?.length > 0 ? (
                                            <table className="table table-bordered mt-4">
                                                <thead className="thead-light">
                                                    <tr>
                                                        <th>#</th>
                                                        <th>Image</th>
                                                        <th>Product Name</th>
                                                        <th>Quantity</th>
                                                        <th>Rate</th>
                                                        <th>Tax (%)</th>
                                                        <th>Total (₹)</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {orders.perfoma_items.map((item, index) => (
                                                        <tr key={item.id}>
                                                            <td>{index + 1}</td>
                                                            <td>
                                                                <img
                                                                    src={`${import.meta.env.VITE_APP_KEY}${item.images}`}
                                                                    alt={item.name}
                                                                    style={{ width: "60px", height: "60px", objectFit: "cover" }}
                                                                />
                                                            </td>
                                                            <td>{item.name}</td>
                                                            <td>{item.quantity}</td>
                                                            <td>₹{item.rate}</td>
                                                            <td>{item.tax}%</td>
                                                            <td>₹{(item.rate * item.quantity * (1 + item.tax / 100)).toFixed(2)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <p>No items found in perfoma invoice.</p>
                                        )}
                                    </Col>
                                </Row>
                                <Row>
                                    <Button
                                        color={invoiceItemsAdded ? "secondary" : "success"}
                                        className="mt-3"
                                        onClick={handleAddInvoiceItemsToCart}
                                        disabled={
                                            isAddingItemsToCart ||
                                            invoiceItemsAdded ||
                                            !orders?.perfoma_items?.length
                                        }
                                    >
                                        {isAddingItemsToCart
                                            ? "Adding Items..."
                                            : invoiceItemsAdded
                                                ? "Items Added to Cart"
                                                : "Add All Items to Cart"}
                                    </Button>
                                </Row>
                                <Row className="mt-4">

                                    <Col md={6}>
                                        <Card className="mb-3">
                                            <CardBody>
                                                <Label for="payment_status">Payment Status *</Label>
                                                <Input
                                                    type="select"
                                                    name="payment_status"
                                                    id="payment_status"
                                                    value={formik.values.payment_status}
                                                    onChange={(e) => {
                                                        formik.handleChange(e);
                                                        const val = e.target.value;

                                                        if (val === "paid" || val === "credit") {
                                                            // reset COD fields
                                                            formik.setFieldValue("cod_status", "");
                                                            formik.setFieldValue("cod_amount", "");
                                                            formik.setFieldValue("adv_cod_amount", "");

                                                            // auto set bank + method
                                                            formik.setFieldValue("payment_method", "Bank Transfer");
                                                            if (banks.length > 0) {
                                                                formik.setFieldValue("bank", banks[0].id);
                                                            }
                                                        }

                                                        if (val === "COD") {
                                                            formik.setFieldValue("payment_method", "");
                                                            formik.setFieldValue("bank", "");
                                                        }
                                                    }}
                                                    onBlur={formik.handleBlur}
                                                    invalid={formik.touched.payment_status && formik.errors.payment_status}
                                                >
                                                    <option value="">Select</option>
                                                    <option value="paid">Paid</option>
                                                    <option value="COD">COD</option>
                                                    <option value="credit">Credit</option>
                                                </Input>
                                                <FormFeedback>{formik.errors.payment_status}</FormFeedback>

                                                {formik.values.payment_status === "COD" && (
                                                    <>
                                                        <Label className="mt-3">COD Status</Label>
                                                        <Input
                                                            type="select"
                                                            name="cod_status"
                                                            value={formik.values.cod_status}
                                                            onChange={formik.handleChange}
                                                            onBlur={formik.handleBlur}
                                                            invalid={formik.touched.cod_status && formik.errors.cod_status}
                                                        >
                                                            <option value="">Select COD Status</option>
                                                            <option value="FULL_COD">Full COD</option>
                                                            <option value="PARTIAL_COD">Partial COD</option>
                                                        </Input>
                                                        <FormFeedback>{formik.errors.cod_status}</FormFeedback>

                                                        {formik.values.cod_status === "FULL_COD" && (
                                                            <>
                                                                <Label className="mt-3">COD Amount</Label>
                                                                <Input
                                                                    type="number"
                                                                    name="cod_amount"
                                                                    value={formik.values.cod_amount}
                                                                    onChange={formik.handleChange}
                                                                    onBlur={formik.handleBlur}
                                                                    invalid={formik.touched.cod_amount && formik.errors.cod_amount}
                                                                />
                                                                <FormFeedback>{formik.errors.cod_amount}</FormFeedback>
                                                            </>
                                                        )}

                                                        {formik.values.cod_status === "PARTIAL_COD" && (
                                                            <>
                                                                <Label className="mt-3">Advance COD Amount</Label>
                                                                <Input
                                                                    type="number"
                                                                    name="adv_cod_amount"
                                                                    value={formik.values.adv_cod_amount}
                                                                    onChange={formik.handleChange}
                                                                    onBlur={formik.handleBlur}
                                                                    invalid={formik.touched.adv_cod_amount && formik.errors.adv_cod_amount}
                                                                />
                                                                <FormFeedback>{formik.errors.adv_cod_amount}</FormFeedback>
                                                            </>
                                                        )}
                                                    </>
                                                )}

                                                <Label for="bank" className="mt-3">Bank Name</Label>
                                                <Input
                                                    type="select"
                                                    name="bank"
                                                    id="bank"
                                                    value={formik.values.bank}
                                                    onChange={formik.handleChange}
                                                    onBlur={formik.handleBlur}
                                                    invalid={formik.touched.bank && formik.errors.bank ? true : false}
                                                >
                                                    <option value="">Select</option>
                                                    {banks.map((bank) => (
                                                        <option key={bank.id} value={bank.id}>
                                                            {bank.name}
                                                        </option>
                                                    ))}
                                                </Input>
                                                {formik.errors.bank && formik.touched.bank ? (
                                                    <FormFeedback>{formik.errors.bank}</FormFeedback>
                                                ) : null}
                                                <Label for="payment_method" className="mt-3">Payment Method</Label>
                                                <Input
                                                    type="select"
                                                    name="payment_method"
                                                    id="payment_method"
                                                    value={formik.values.payment_method}
                                                    onChange={formik.handleChange}
                                                    onBlur={formik.handleBlur}
                                                    invalid={formik.touched.payment_method && formik.errors.payment_method ? true : false}
                                                >
                                                    <option value="">Select</option>
                                                    <option value="Credit Card">Credit Card</option>
                                                    <option value="Debit Card">Debit Card</option>
                                                    <option value="Net Banking">Net Banking</option>
                                                    <option value="PayPal">PayPal</option>
                                                    <option value="1 Razorpay">Razorpay</option>
                                                    <option value="Cash on Delivery (COD)">Cash on Delivery</option>
                                                    <option value="Bank Transfer">Bank Transfer</option>
                                                </Input>
                                                {formik.errors.payment_method && formik.touched.payment_method ? (
                                                    <FormFeedback>{formik.errors.payment_method}</FormFeedback>
                                                ) : null}

                                                <div className="mt-4">
                                                    <Label for="payment_images">
                                                        Payment Slips *
                                                    </Label>
                                                    <Input
                                                        type="file"
                                                        id="payment_images"
                                                        name="payment_images"
                                                        accept="image/*"
                                                        multiple
                                                        onChange={handlePaymentImagesChange}
                                                        invalid={Boolean(paymentImagesError)}
                                                    />
                                                    <FormFeedback>
                                                        {paymentImagesError}
                                                    </FormFeedback>
                                                    <small className="text-muted d-block mt-1">
                                                        You can select multiple payment receipt images.
                                                    </small>

                                                    {paymentImages.length > 0 && (
                                                        <Row className="mt-3">
                                                            {paymentImages.map((imageItem, index) => (
                                                                <Col
                                                                    key={`${imageItem.file.name}-${imageItem.file.lastModified}-${index}`}
                                                                    xs={6}
                                                                    md={4}
                                                                    className="mb-3"
                                                                >
                                                                    <div
                                                                        className="border rounded p-2 position-relative"
                                                                        style={{ minHeight: "150px" }}
                                                                    >
                                                                        <img
                                                                            src={imageItem.preview}
                                                                            alt={`Payment slip ${index + 1}`}
                                                                            style={{
                                                                                width: "100%",
                                                                                height: "110px",
                                                                                objectFit: "cover",
                                                                                borderRadius: "4px",
                                                                            }}
                                                                        />
                                                                        <div
                                                                            className="small text-truncate mt-2"
                                                                            title={imageItem.file.name}
                                                                        >
                                                                            {imageItem.file.name}
                                                                        </div>
                                                                        <Button
                                                                            type="button"
                                                                            color="danger"
                                                                            size="sm"
                                                                            className="position-absolute top-0 end-0 m-1"
                                                                            onClick={() => removePaymentImage(index)}
                                                                        >
                                                                            ×
                                                                        </Button>
                                                                    </div>
                                                                </Col>
                                                            ))}
                                                        </Row>
                                                    )}
                                                </div>
                                            </CardBody>
                                        </Card>
                                    </Col>


                                    <Col md={6}>
                                        <Card>
                                            <CardBody>
                                                <h6 className="border-bottom pb-2">Total: <span className="float-end">₹&nbsp;</span></h6>
                                                <h6 className="border-bottom pb-2">Advance Paid: <span className="float-end">₹0.00</span></h6>
                                                <h6 className="border-bottom pb-2">Total Discount: <span className="float-end">₹&nbsp;</span></h6>
                                                <h6 className="border-bottom pb-2">Shipping Charge: <span className="float-end">₹0.00</span></h6>
                                                <h6 className="border-bottom pb-2">Total Cart Discount: <span className="float-end">₹0.00</span></h6>
                                                <h6 className="font-weight-bold">Net Amount: <span className="float-end">₹&nbsp;    </span></h6>

                                            </CardBody>
                                        </Card>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col>
                                        <Button
                                            color="primary"
                                            className="mt-3"
                                            onClick={formik.handleSubmit}
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? "Creating Order..." : "Create Order"}
                                        </Button>
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>

                    </div>
                </Container>
                <ToastContainer />
            </div>
        </React.Fragment>
    );
};

export default PerfomaOrder;
