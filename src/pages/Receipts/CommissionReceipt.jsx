import React, { useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import {
    Card,
    CardBody,
    Col,
    Row,
    Label,
    CardTitle,
    Form,
    Input,
    Button,
} from "reactstrap";
import Select from "react-select";

const CommissionReceipt = () => {
    const token = localStorage.getItem("token");

    const [banks, setBanks] = useState([]);
    const [orders, setOrders] = useState([]);

    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);
    const [isLoadingBanks, setIsLoadingBanks] = useState(false);

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedBank, setSelectedBank] = useState(null);

    const [formData, setFormData] = useState({
        order: "",
        bank: "",
        amount: "",
        received_at: "",
        transactionID: "",
        remark: "",
    });

    const authHeaders = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    };

    const getErrorMessage = (error, fallbackMessage) => {
        const responseData = error?.response?.data;

        if (responseData?.message) {
            return responseData.message;
        }

        if (responseData?.errors) {
            if (typeof responseData.errors === "string") {
                return responseData.errors;
            }

            const firstError = Object.values(responseData.errors)?.[0];

            if (Array.isArray(firstError)) {
                return firstError[0];
            }

            if (typeof firstError === "string") {
                return firstError;
            }
        }

        return fallbackMessage;
    };

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previousData) => ({
            ...previousData,
            [name]: value,
        }));
    };

    const fetchBanks = async () => {
        setIsLoadingBanks(true);

        try {
            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}banks/`,
                {
                    headers: authHeaders,
                }
            );

            if (response?.status === 200) {
                setBanks(response?.data?.data || []);
            }
        } catch (error) {
            toast.error(getErrorMessage(error, "Error fetching banks"));
        } finally {
            setIsLoadingBanks(false);
        }
    };

    const fetchOrders = async (search = "") => {
        setIsLoadingOrders(true);

        try {
            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}orders/`,
                {
                    headers: authHeaders,
                    params: {
                        search,
                    },
                }
            );

            if (response?.status === 200) {
                const orderResults =
                    response?.data?.results?.results ||
                    response?.data?.results ||
                    response?.data?.data ||
                    [];

                setOrders(Array.isArray(orderResults) ? orderResults : []);
            }
        } catch (error) {
            toast.error(getErrorMessage(error, "Error fetching orders"));
        } finally {
            setIsLoadingOrders(false);
        }
    };

    useEffect(() => {
        fetchBanks();
        fetchOrders();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleOrderSearch = (inputValue, actionMeta) => {
        if (actionMeta?.action === "input-change") {
            fetchOrders(inputValue);
        }

        return inputValue;
    };

    const handleOrderChange = (selectedOption) => {
        setSelectedOrder(selectedOption);

        setFormData((previousData) => ({
            ...previousData,
            order: selectedOption ? selectedOption.value : "",
        }));
    };

    const handleBankChange = (selectedOption) => {
        setSelectedBank(selectedOption);

        setFormData((previousData) => ({
            ...previousData,
            bank: selectedOption ? selectedOption.value : "",
        }));
    };

    const postDataLog = async (createdReceipt = null) => {
        if (!formData.order) {
            return;
        }

        const payload = {
            order: Number(formData.order),

            before_data: {
                Action: "Adding Commission Receipt",
            },

            after_data: {
                Data: "Commission receipt created",
                commission_receipt_id: createdReceipt?.id || null,
                payment_receipt: createdReceipt?.payment_receipt || "",
                amount: Number(formData.amount || 0),
                bank_id: formData.bank ? Number(formData.bank) : null,
                bank_name: selectedBank?.label || "",
                transactionID: formData.transactionID || "",
                received_at: formData.received_at || "",
                remark: formData.remark || "",
            },
        };

        try {
            await axios.post(
                `${import.meta.env.VITE_APP_KEY}datalog/create/`,
                payload,
                {
                    headers: authHeaders,
                }
            );
        } catch (error) {
            toast.warn(
                "Commission receipt was saved, but DataLog creation failed."
            );
        }
    };

    const resetForm = () => {
        setFormData({
            order: "",
            bank: "",
            amount: "",
            received_at: "",
            transactionID: "",
            remark: "",
        });

        setSelectedOrder(null);
        setSelectedBank(null);
    };

    const validateForm = () => {
        if (!formData.order) {
            toast.error("Please select an order.");
            return false;
        }

        if (!formData.bank) {
            toast.error("Please select a bank.");
            return false;
        }

        if (!formData.amount) {
            toast.error("Please enter the amount.");
            return false;
        }

        if (Number(formData.amount) <= 0) {
            toast.error("Amount must be greater than zero.");
            return false;
        }

        if (!formData.received_at) {
            toast.error("Please select the received date.");
            return false;
        }

        if (!formData.transactionID.trim()) {
            toast.error("Please enter the transaction ID.");
            return false;
        }

        if (!formData.remark.trim()) {
            toast.error("Please enter remarks.");
            return false;
        }

        return true;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const payload = {
                order: Number(formData.order),
                bank: Number(formData.bank),
                amount: formData.amount,
                received_at: formData.received_at,
                transactionID: formData.transactionID.trim(),
                remark: formData.remark.trim(),
            };

            const response = await axios.post(
                `${import.meta.env.VITE_APP_KEY}commission/receipts/add/`,
                payload,
                {
                    headers: authHeaders,
                }
            );

            if (response?.status === 200 || response?.status === 201) {
                const createdReceipt = response?.data?.data || null;

                toast.success(
                    response?.data?.message ||
                    "Commission receipt created successfully!"
                );

                await postDataLog(createdReceipt);

                resetForm();
            }
        } catch (error) {
            toast.error(
                getErrorMessage(error, "Failed to create commission receipt")
            );
        } finally {
            setIsLoading(false);
        }
    };

    const orderOptions = orders.map((order) => ({
        value: order.id,
        label: `${order.invoice || "No Invoice"} - ${order.customer?.name ||
            order.customer_name ||
            "No Customer"
            } - ₹${order.total_amount || 0}`,
    }));

    const bankOptions = banks.map((bank) => ({
        value: bank.id,
        label: bank.name,
    }));

    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs
                        title="PAYMENTS"
                        breadcrumbItem="COMMISSION RECEIPT"
                    />

                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="mb-4">
                                        CREATE COMMISSION RECEIPT
                                    </CardTitle>

                                    <Form onSubmit={handleSubmit}>
                                        <Row>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>
                                                        Order <span className="text-danger">*</span>
                                                    </Label>

                                                    <Select
                                                        value={selectedOrder}
                                                        onChange={handleOrderChange}
                                                        onInputChange={handleOrderSearch}
                                                        options={orderOptions}
                                                        isClearable
                                                        isLoading={isLoadingOrders}
                                                        placeholder="Search by invoice or customer"
                                                        noOptionsMessage={() =>
                                                            isLoadingOrders
                                                                ? "Loading orders..."
                                                                : "No orders found"
                                                        }
                                                    />
                                                </div>
                                            </Col>

                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>
                                                        Bank <span className="text-danger">*</span>
                                                    </Label>

                                                    <Select
                                                        value={selectedBank}
                                                        onChange={handleBankChange}
                                                        options={bankOptions}
                                                        isClearable
                                                        isSearchable
                                                        isLoading={isLoadingBanks}
                                                        placeholder="Select bank"
                                                        noOptionsMessage={() =>
                                                            isLoadingBanks
                                                                ? "Loading banks..."
                                                                : "No banks found"
                                                        }
                                                    />
                                                </div>
                                            </Col>

                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>
                                                        Amount <span className="text-danger">*</span>
                                                    </Label>

                                                    <Input
                                                        type="number"
                                                        name="amount"
                                                        value={formData.amount}
                                                        onChange={handleChange}
                                                        min="0.01"
                                                        step="0.01"
                                                        placeholder="Enter amount"
                                                        required
                                                    />
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>
                                                        Received Date{" "}
                                                        <span className="text-danger">*</span>
                                                    </Label>

                                                    <Input
                                                        type="date"
                                                        name="received_at"
                                                        value={formData.received_at}
                                                        onChange={handleChange}
                                                        required
                                                    />
                                                </div>
                                            </Col>

                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>
                                                        Transaction ID{" "}
                                                        <span className="text-danger">*</span>
                                                    </Label>

                                                    <Input
                                                        type="text"
                                                        name="transactionID"
                                                        value={formData.transactionID}
                                                        onChange={handleChange}
                                                        maxLength={50}
                                                        placeholder="Enter transaction ID"
                                                        required
                                                    />
                                                </div>
                                            </Col>

                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>
                                                        Remarks <span className="text-danger">*</span>
                                                    </Label>

                                                    <Input
                                                        type="text"
                                                        name="remark"
                                                        value={formData.remark}
                                                        onChange={handleChange}
                                                        placeholder="Enter remarks"
                                                        required
                                                    />
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col md={3}>
                                                <Button
                                                    color="primary"
                                                    type="submit"
                                                    className="mt-3 w-100"
                                                    disabled={isLoading}
                                                >
                                                    {isLoading
                                                        ? "Creating..."
                                                        : "Create Commission Receipt"}
                                                </Button>
                                            </Col>
                                        </Row>
                                    </Form>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    <ToastContainer />
                </div>
            </div>
        </React.Fragment>
    );
};

export default CommissionReceipt;