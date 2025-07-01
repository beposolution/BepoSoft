import React, { useState, useEffect } from "react";
import axios from 'axios';
import { ToastContainer, toast } from "react-toastify";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { Card, CardBody, Col, Row, Label, CardTitle, Form, Input, Button } from "reactstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AdvanceReceipt = () => {

    const [banks, setBanks] = useState([]);
    const token = localStorage.getItem("token")
    const [isLoading, setIsLoading] = useState(false);
    const [customers, setCustomers] = useState([]);

    const [formData, setFormData] = useState({
        bank: '',
        amount: '',
        received_at: '',
        transactionID: '',
        remark: '',
        customer: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await axios.post(`${import.meta.env.VITE_APP_KEY}advancereceipt/`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.status === 201 || response.status === 200) {
                toast.success("Advance receipt created successfully");
                setFormData({
                    bank: '',
                    amount: '',
                    received_at: '',
                    transactionID: '',
                    customer: '',
                    remark: ''
                });
            }
        } catch (error) {
            toast.error("Error advance creating receipt:");
            if (error.response?.data) {
                toast.error("Failed to create advance receipt: " + JSON.stringify(error.response.data));
            } else {
                toast.error("Failed to create advance receipt");
            }
        } finally {
            setIsLoading(false);
        }
    };

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

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}customers/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.status === 200) {
                    setCustomers(response?.data?.data);
                }
            } catch (error) {
                toast.error('Error fetching bank data:');
            }
        };
        fetchCustomers();
    }, []);

    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="PAYMENTS" breadcrumbItem="ADVANCE RECEIPT" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="mb-4">ADVANCE RECEIPTS</CardTitle>
                                    <Form>
                                        <Row>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>Bank</Label>
                                                    <Input type="select" name="bank" value={formData.bank} onChange={handleChange}>
                                                        <option value="">Select Bank</option>
                                                        {banks.map((bank) => (
                                                            <option key={bank.id} value={bank.id}>{bank.name}</option>
                                                        ))}
                                                    </Input>
                                                </div>
                                            </Col>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>Amount</Label>
                                                    <Input type="number" name="amount" value={formData.amount} onChange={handleChange} />
                                                </div>
                                            </Col>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>Received Date</Label>
                                                    <Input type="date" name="received_at" value={formData.received_at} onChange={handleChange} />
                                                </div>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>Customers</Label>
                                                    <Input type="select" name="customer" value={formData.customer} onChange={handleChange}>
                                                        <option value="">Select Customers</option>
                                                        {customers.map((customer) => (
                                                            <option key={customer.id} value={customer.id}>{customer.name}</option>
                                                        ))}
                                                    </Input>
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
                                                    <Label>Remarks</Label>
                                                    <Input type="text" name="remark" value={formData.remark} onChange={handleChange} />
                                                </div>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col md={3}>
                                                <div className="w-5">
                                                    <Button
                                                        color="primary"
                                                        onClick={handleSubmit}
                                                        className="mt-4 w-100"
                                                        disabled={isLoading}
                                                    >
                                                        {isLoading ? "Creating..." : "Create Receipt"}
                                                    </Button>
                                                </div>
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

export default AdvanceReceipt;