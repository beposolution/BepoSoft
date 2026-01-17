import React, { useState, useEffect } from "react";
import axios from 'axios';
import { ToastContainer, toast } from "react-toastify";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { Card, CardBody, Col, Row, Label, CardTitle, Form, Input, Button } from "reactstrap";
import Select from 'react-select';

const CODTransfer = () => {
    const [banks, setBanks] = useState([]);
    const token = localStorage.getItem("token");
    const authHeaders = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }; // <-- NEW

    const [fromBank, setFromBank] = useState(null);
    const [toBank, setToBank] = useState(null);

    const [formData, setFormData] = useState({
        sender_bank: '',
        receiver_bank: '',
        amount: '',
        created_at: '',
        created_end:'',
        // transactionID: '',
        description: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    document.title = "COD Bank Transfer | Beposoft";

    useEffect(() => {
        const fetchbanks = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}banks/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.status === 200) {
                    setBanks(response?.data?.data);
                }
            } catch (error) {
                toast.error('Error fetching bank data:');
            }
        };
        fetchbanks();
    }, []);

    // ---- NEW: DataLog POST after success
    const postDataLog = async () => {
        const payload = {
            before_data: { Action: "Bank Transfer" },
            after_data: {
                amount: Number(formData.amount || 0),
                sender_bank_name: fromBank?.label || "",
                receiver_bank_name: toBank?.label || "",
                // transactionID: formData.transactionID || "",
                created_at: formData.created_at || "",
                created_end: formData.created_end || "",
                description: formData.description || ""
            }
        };

        try {
            await axios.post(`${import.meta.env.VITE_APP_KEY}datalog/create/`, payload, {
                headers: authHeaders
            });
            // optional: toast.info("Transfer logged");
        } catch (err) {
            toast.warn("Transfer saved, but logging to DataLog failed.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // HARD STOP if already submitting
        if (isSubmitting) return;

        setIsSubmitting(true);

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_APP_KEY}cod/transfers/`,
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.status === 201) {
                toast.success("COD Amount transferred successfully");

                await postDataLog();

                // CLEAR FORM
                setFormData({
                    sender_bank: "",
                    receiver_bank: "",
                    amount: "",
                    created_at: "",
                    created_end:"",
                    description: ""
                });

                setFromBank(null);
                setToBank(null);
            }
        } catch (error) {
            toast.error("Failed to COD transfer amount");
        } finally {
            // RELEASE LOCK
            setIsSubmitting(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFromBankChange = (selected) => {
        setFromBank(selected);
        setFormData(prev => ({ ...prev, sender_bank: selected ? selected.value : '' }));
    };

    const handleToBankChange = (selected) => {
        setToBank(selected);
        setFormData(prev => ({ ...prev, receiver_bank: selected ? selected.value : '' }));
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="TRANSFER" breadcrumbItem="COD BANK TRANSFER" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="mb-4">COD BANK TRANSFER</CardTitle>
                                    <Form onSubmit={handleSubmit}>
                                        <Row>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>Receiver Bank</Label>
                                                    <Select
                                                        value={toBank}
                                                        onChange={handleToBankChange}
                                                        options={banks.map(bank => ({ label: bank.name, value: bank.id }))}
                                                        isClearable
                                                        placeholder="Select Bank"
                                                    />
                                                </div>
                                            </Col>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>Receive Date</Label>
                                                    <Input type="date" name="created_end" value={formData.created_end} onChange={handleChange} />
                                                </div>
                                            </Col>

                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>Amount</Label>
                                                    <Input type="number" name="amount" value={formData.amount} onChange={handleChange} />
                                                </div>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>Sender Bank</Label>
                                                    <Select
                                                        value={fromBank}
                                                        onChange={handleFromBankChange}
                                                        options={banks.map(bank => ({ label: bank.name, value: bank.id }))}
                                                        isClearable
                                                        placeholder="Select Bank"
                                                    />
                                                </div>
                                            </Col>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>Send Date</Label>
                                                    <Input type="date" name="created_at" value={formData.created_at} onChange={handleChange} />
                                                </div>
                                            </Col>
                                            {/* <Col md={4}>
                        <div className="mb-3">
                          <Label>Transaction ID</Label>
                          <Input type="text" name="transactionID" value={formData.transactionID} onChange={handleChange} />
                        </div>
                      </Col> */}
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>Description</Label>
                                                    <Input type="text" name="description" value={formData.description} onChange={handleChange} />
                                                </div>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col>
                                                <Button
                                                    color="primary"
                                                    type="submit"
                                                    disabled={
                                                        isSubmitting ||
                                                        !formData.sender_bank ||
                                                        !formData.receiver_bank ||
                                                        !formData.amount ||
                                                        !formData.created_at ||
                                                        !formData.created_end
                                                    }
                                                >
                                                    {isSubmitting ? "Transferring..." : "Transfer Amount"}
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
    )
}

export default CODTransfer;
