import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardBody, Col, Container, Row, Label, Input, Button, FormFeedback } from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import axios from "axios";
import { useFormik } from "formik";
import * as Yup from 'yup';
import { toast } from "react-toastify";

const PerfomaOrder = () => {
    const { invoice } = useParams();
    const [orders, setOrders] = useState(null);
    const token = localStorage.getItem('token');
    const [banks, setBanks] = useState([]);
    const [selectedProductId, setSelectedProductId] = useState("");
    const [addQuantity, setAddQuantity] = useState(1);

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
            total_amount: orders?.total_amount || 0,
            order_date: orders?.order_date || new Date().toISOString().substring(0, 10),
            status: "Invoice Created",
            warehouses: orders?.warehouse_id || "",
        },
        validationSchema: Yup.object({
            payment_status: Yup.string().required("Payment status is required"),
            payment_method: Yup.string().required("Payment method is required"),
            bank: Yup.string().required("Bank selection is required"),
        }),
        onSubmit: async (values, { resetForm }) => {
            try {
                const payload = { ...values };
                const response = await axios.post(
                    `${import.meta.env.VITE_APP_KEY}order/create/`,
                    payload,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (response.status === 201) {
                    toast.success("Order created successfully!");
                    resetForm();
                }
            } catch (error) {
                console.error("Order creation failed", error);
                toast.error("Failed to create order");
            }
        },
    });


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
            console.error("Error adding to cart:", error);
            alert("Error adding product to cart.");
        }
    };

    const handleAddInvoiceItemsToCart = async () => {
        if (!orders || !orders.perfoma_items || orders.perfoma_items.length === 0) {
            alert("No items to add to cart.");
            return;
        }

        try {
            for (const item of orders.perfoma_items) {
                const payload = {
                    product: item.product, // product ID
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
                    throw new Error(`Failed to add product ID ${item.product}`);
                }
            }

            alert("All items added to cart successfully!");
            fetchOrderData(); // Refresh data
        } catch (error) {
            console.error("Error adding invoice items to cart:", error);
            alert("Some items could not be added to cart.");
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
            console.error("Error fetching order data:", error);
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
            console.error("Error fetching banks:", error);
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
                                        color="success"
                                        className="mt-3"
                                        onClick={handleAddInvoiceItemsToCart}
                                    >
                                        Add All Items to Cart
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
                                                    onChange={formik.handleChange}
                                                    onBlur={formik.handleBlur}
                                                    invalid={formik.touched.payment_status && formik.errors.payment_status ? true : false}
                                                >
                                                    <option value="">Select</option>
                                                    <option value="paid">Paid</option>
                                                    <option value="COD">COD</option>
                                                    <option value="credit">Credit</option>
                                                </Input>
                                                {formik.errors.payment_status && formik.touched.payment_status ? (
                                                    <FormFeedback>{formik.errors.payment_status}</FormFeedback>
                                                ) : null}
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
                                        >
                                            Create Order
                                        </Button>
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>

                    </div>
                </Container>

            </div>
        </React.Fragment>
    );
};

export default PerfomaOrder;
