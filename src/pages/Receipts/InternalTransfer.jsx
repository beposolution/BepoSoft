import React, { useState, useEffect } from "react";
import axios from 'axios';
import { ToastContainer, toast } from "react-toastify";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { Card, CardBody, Col, Row, Label, CardTitle, Form, Input, Button } from "reactstrap";
import Select from 'react-select';

const InternalTransfer = () => {
    const [banks, setBanks] = useState([]);
    const token = localStorage.getItem("token")
    const [fromBank, setFromBank] = useState(null);
    const [toBank, setToBank] = useState(null);

    const [formData, setFormData] = useState({
        sender_bank: '',
        receiver_bank: '',
        amount: '',
        created_at: '',
        transactionID: '',
        description: ''
    });

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

    const handleSubmit = async () => {
        try {
            const response = await axios.post(`${import.meta.env.VITE_APP_KEY}internal/transfers/`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.status === 201) {
                toast.success("Amount Transfered successfully");
                setFormData({
                    sender_bank: '',
                    receiver_bank: '',
                    amount: '',
                    created_at: '',
                    transactionID: '',
                    description: ''
                });
                setFromBank(null);
                setToBank(null);
            }
        } catch (error) {
            toast.error("Failed to transfer amount");
            console.error(error);
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
                    <Breadcrumbs title="TRANSFER" breadcrumbItem="INTERNAL BANK TRANSFER" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="mb-4">INTERNAL BANK TRANSFER</CardTitle>
                                    <Form>
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
                                                    <Label>Reciever Bank</Label>
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
                                                    <Label>Amount</Label>
                                                    <Input type="number" name="amount" value={formData.amount} onChange={handleChange} />
                                                </div>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>Transfer Date</Label>
                                                    <Input type="date" name="created_at" value={formData.created_at} onChange={handleChange} />
                                                </div>
                                            </Col>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>Transaction ID</Label>
                                                    <Input type="text" name="transactionID" value={formData.transactionID} onChange={handleChange} />
                                                </div>
                                            </Col>
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
                                                    onClick={handleSubmit}
                                                    disabled={
                                                        !formData.sender_bank ||
                                                        !formData.receiver_bank ||
                                                        !formData.amount ||
                                                        !formData.created_at
                                                    }
                                                >
                                                    Transfer Amount
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

export default InternalTransfer;