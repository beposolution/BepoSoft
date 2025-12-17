import React, { useState, useEffect } from "react";
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
import "react-toastify/dist/ReactToastify.css";
import Select from "react-select";

const RefundReceipt = () => {
    const token = localStorage.getItem("token");

    const [banks, setBanks] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [invoices, setInvoices] = useState([]);

    const [selectedBank, setSelectedBank] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        bank: "",
        customer: "",
        invoice: "",
        amount: "",
        date: "",
        transactionID: "",
        note: "",
    });

    const authHeaders = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // ---------------- FETCH BANKS ----------------
    useEffect(() => {
        const fetchBanks = async () => {
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_APP_KEY}banks/`,
                    { headers: authHeaders }
                );
                if (res.status === 200) setBanks(res.data?.data || []);
            } catch {
                toast.error("Failed to fetch banks");
            }
        };
        fetchBanks();
        // eslint-disable-next-line
    }, []);

    // ---------------- FETCH CUSTOMERS ----------------
    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_APP_KEY}customers/`,
                    { headers: authHeaders }
                );
                if (res.status === 200) setCustomers(res.data?.data || []);
            } catch {
                toast.error("Failed to fetch customers");
            }
        };
        fetchCustomers();
        // eslint-disable-next-line
    }, []);

    // ---------------- FETCH INVOICES (ORDERS) ----------------
    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_APP_KEY}orders/`,
                    { headers: authHeaders }
                );
                if (res.status === 200)
                    setInvoices(res.data?.results || []);
            } catch {
                toast.error("Failed to fetch invoices");
            }
        };
        fetchInvoices();
        // eslint-disable-next-line
    }, []);

    // ---------------- SELECT HANDLERS ----------------
    const handleBankChange = (selected) => {
        setSelectedBank(selected);
        setFormData((prev) => ({
            ...prev,
            bank: selected ? selected.value : "",
        }));
    };

    const handleCustomerChange = (selected) => {
        setSelectedCustomer(selected);
        setFormData((prev) => ({
            ...prev,
            customer: selected ? selected.value : "",
        }));
    };

    const handleInvoiceChange = (selected) => {
        setSelectedInvoice(selected);
        setFormData((prev) => ({
            ...prev,
            invoice: selected ? selected.value : "",
        }));
    };

    // post to datalog after refund receipt success
    const postDataLog = async (refundNo) => {
        const payload = {
            customer: formData.customer ? Number(formData.customer) : undefined,
            invoice: formData.invoice ? Number(formData.invoice) : undefined,

            before_data: { Action: "Refund Receipt Added" },

            after_data: {
                refund_no: refundNo,
                amount: Number(formData.amount || 0),
                bank_name: selectedBank?.label || "",
                customer_name: selectedCustomer?.label || "",
                invoice_no: selectedInvoice?.label || "",
                transactionID: formData.transactionID || "",
                date: formData.date || "",
                note: formData.note || "",
            },
        };

        try {
            await axios.post(
                `${import.meta.env.VITE_APP_KEY}datalog/create/`,
                payload,
                { headers: authHeaders }
            );
        } catch (err) {
            toast.warn("Refund receipt saved, but DataLog creation failed.");
            console.error("DataLog error:", err?.response?.data || err.message);
        }
    };

    // ---------------- SUBMIT ----------------
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.bank) return toast.error("Please select bank");
        if (!formData.customer) return toast.error("Please select customer");
        if (!formData.amount) return toast.error("Please enter amount");
        if (!formData.date) return toast.error("Please select date");

        setIsLoading(true);

        try {
            const res = await axios.post(
                `${import.meta.env.VITE_APP_KEY}refund/receipts/`,
                formData,
                { headers: authHeaders }
            );
            
            if (res.status === 200 || res.status === 201) {

                const refundData = res.data?.data;

                toast.success("Refund receipt created successfully");

                // fire datalog creation (non-blocking logic already handled)
                await postDataLog(refundData?.refund_no);

                // RESET
                setFormData({
                    bank: "",
                    customer: "",
                    invoice: "",
                    amount: "",
                    date: "",
                    transactionID: "",
                    note: "",
                });
                setSelectedBank(null);
                setSelectedCustomer(null);
                setSelectedInvoice(null);
            }
        } catch (err) {
            toast.error("Failed to create refund receipt");
            console.error(err?.response?.data || err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="PAYMENTS" breadcrumbItem="REFUND RECEIPT" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="mb-4">REFUND RECEIPTS</CardTitle>

                                    <Form onSubmit={handleSubmit}>
                                        <Row>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>Bank</Label>
                                                    <Select
                                                        value={selectedBank}
                                                        onChange={handleBankChange}
                                                        options={banks.map((b) => ({
                                                            label: b.name,
                                                            value: b.id,
                                                        }))}
                                                        isClearable
                                                        placeholder="Select Bank"
                                                    />
                                                </div>
                                            </Col>

                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>Customer</Label>
                                                    <Select
                                                        value={selectedCustomer}
                                                        onChange={handleCustomerChange}
                                                        options={customers.map((c) => ({
                                                            label: `${c.name} (${c.phone})`,
                                                            value: c.id,
                                                        }))}
                                                        isClearable
                                                        placeholder="Select Customer"
                                                    />
                                                </div>
                                            </Col>

                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>Invoice (Optional)</Label>
                                                    <Select
                                                        value={selectedInvoice}
                                                        onChange={handleInvoiceChange}
                                                        options={invoices.map((i) => ({
                                                            label: i.invoice,
                                                            value: i.id,
                                                        }))}
                                                        isClearable
                                                        placeholder="Select Invoice"
                                                    />
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>Amount</Label>
                                                    <Input
                                                        type="number"
                                                        name="amount"
                                                        value={formData.amount}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                            </Col>

                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>Date</Label>
                                                    <Input
                                                        type="date"
                                                        name="date"
                                                        value={formData.date}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                            </Col>

                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>Transaction ID</Label>
                                                    <Input
                                                        type="text"
                                                        name="transactionID"
                                                        value={formData.transactionID}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label>Note</Label>
                                                    <Input
                                                        type="text"
                                                        name="note"
                                                        value={formData.note}
                                                        onChange={handleChange}
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
                                                    {isLoading ? "Creating..." : "Create Refund"}
                                                </Button>
                                            </Col>
                                        </Row>
                                    </Form>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </div>
                <ToastContainer />
            </div>
        </React.Fragment>
    );
};

export default RefundReceipt;
