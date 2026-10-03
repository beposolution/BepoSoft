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
import AsyncSelect from "react-select/async";
import { createAuditLog } from "../../services/auditService";

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
                if (res.status === 200) setCustomers(res.data?.results || []);
            } catch {
                toast.error("Failed to fetch customers");
            }
        };
        fetchCustomers();
        // eslint-disable-next-line
    }, []);

    const loadCustomerOptions = async (inputValue) => {
        try {
            const res = await axios.get(
                `${import.meta.env.VITE_APP_KEY}customers/?search=${inputValue}`,
                { headers: authHeaders }
            );

            const customers = res.data?.results || [];

            return customers.map((c) => ({
                label: `${c.name} (${c.phone})`,
                value: c.id,
            }));
        } catch (err) {
            console.error("Customer search error:", err);
            return [];
        }
    };

    // ---------------- FETCH INVOICES (ORDERS) ----------------
    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_APP_KEY}orders/`,
                    { headers: authHeaders }
                );
                if (res.status === 200)
                    setInvoices(res.data?.results?.results || []);
            } catch {
                toast.error("Failed to fetch invoices");
            }
        };
        fetchInvoices();
        // eslint-disable-next-line
    }, []);


    const loadInvoiceOptions = async (inputValue) => {
        try {
            const res = await axios.get(
                `${import.meta.env.VITE_APP_KEY}orders/?search=${inputValue}`,
                { headers: authHeaders }
            );

            const invoices = res.data?.results?.results || [];

            return invoices.map((inv) => ({
                label: `${inv.invoice} - ${inv.customer?.name || ""}`,
                value: inv.id,
            }));
        } catch (err) {
            console.error("Invoice search error:", err);
            return [];
        }
    };

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

    const createRefundReceiptDataLog = async (
        receiptData,
        responseData = null,
        bankData = null,
        customerData = null,
        invoiceData = null
    ) => {
        try {
            const afterData = {
                refund_no:
                    responseData?.refund_no ??
                    "",

                amount:
                    responseData?.amount ??
                    Number(receiptData.amount || 0),

                bank:
                    responseData?.bank_name ??
                    bankData?.label ??
                    "",

                bank_id:
                    responseData?.bank ??
                    receiptData.bank ??
                    "",

                customer:
                    responseData?.customer_name ??
                    customerData?.label ??
                    "",

                customer_id:
                    responseData?.customer ??
                    receiptData.customer ??
                    "",

                invoice:
                    responseData?.invoice_no ??
                    invoiceData?.label ??
                    "",

                invoice_id:
                    responseData?.invoice ??
                    receiptData.invoice ??
                    "",

                transactionID:
                    responseData?.transactionID ??
                    receiptData.transactionID ??
                    "",

                date:
                    responseData?.date ??
                    receiptData.date ??
                    "",

                note:
                    responseData?.note ??
                    receiptData.note ??
                    "",
            };

            const auditCreated = await createAuditLog({
                action: "refund_receipt_created_website",
                beforeData: {},
                afterData: afterData,
            });

            if (!auditCreated) {
                console.error(
                    "Refund receipt created successfully, but DataLog creation failed."
                );

                return false;
            }

            return true;
        } catch (error) {
            console.error(
                "Refund Receipt DataLog creation error:",
                error
            );

            return false;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Prevent duplicate submission
        if (isLoading) {
            return;
        }

        // VALIDATION

        if (!formData.bank) {
            toast.error("Please select bank");
            return;
        }

        if (!formData.customer) {
            toast.error("Please select customer");
            return;
        }

        if (!formData.amount) {
            toast.error("Please enter amount");
            return;
        }

        if (!formData.date) {
            toast.error("Please select date");
            return;
        }

        setIsLoading(true);

        try {
            // KEEP SUBMITTED VALUES

            const submittedData = {
                ...formData,
            };

            const submittedBank = selectedBank
                ? { ...selectedBank }
                : null;

            const submittedCustomer = selectedCustomer
                ? { ...selectedCustomer }
                : null;

            const submittedInvoice = selectedInvoice
                ? { ...selectedInvoice }
                : null;

            // CREATE REFUND RECEIPT

            const res = await axios.post(
                `${import.meta.env.VITE_APP_KEY}refund/receipts/`,
                submittedData,
                {
                    headers: authHeaders,
                }
            );

            // REFUND CREATED SUCCESSFULLY

            if (
                res.status === 200 ||
                res.status === 201
            ) {
                toast.success(
                    "Refund receipt created successfully"
                );

                // Backend-created refund receipt
                const createdRefund =
                    res?.data?.data ??
                    res?.data ??
                    null;

                // CREATE AUDIT / DATA LOG

                const auditCreated =
                    await createRefundReceiptDataLog(
                        submittedData,
                        createdRefund,
                        submittedBank,
                        submittedCustomer,
                        submittedInvoice
                    );

                // Refund remains successful even if audit log fails
                if (!auditCreated) {
                    console.error(
                        "Refund receipt created successfully, but DataLog creation failed."
                    );

                    toast.warn(
                        "Refund receipt saved, but logging to DataLog failed."
                    );
                }

                // RESET FORM

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
        } catch (error) {
            // REFUND CREATION FAILED

            toast.error(
                "Failed to create refund receipt"
            );

            if (error.response?.data) {
                toast.error(
                    "Details: " +
                    JSON.stringify(
                        error.response.data
                    )
                );
            }

            console.error(
                "Refund receipt error:",
                error?.response?.data ||
                error?.message ||
                error
            );
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
                                                    <AsyncSelect
                                                        cacheOptions
                                                        loadOptions={loadCustomerOptions}
                                                        defaultOptions
                                                        value={selectedCustomer}
                                                        onChange={handleCustomerChange}
                                                        isClearable
                                                        placeholder="Search Customer..."
                                                    />
                                                </div>
                                            </Col>

                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>Invoice (Optional)</Label>
                                                    <AsyncSelect
                                                        cacheOptions
                                                        loadOptions={loadInvoiceOptions}
                                                        defaultOptions
                                                        value={selectedInvoice}
                                                        onChange={handleInvoiceChange}
                                                        isClearable
                                                        placeholder="Search Invoice..."
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
