import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { Card, CardBody, Col, Row, Label, CardTitle, Form, Input, Button } from "reactstrap";
import Select from "react-select";

const OrderReceipt = () => {
    const { id } = useParams(); // get order ID from route
    const token = localStorage.getItem("token");
    const [banks, setBanks] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [order, setOrder] = useState([]);
    const [selectedOrderId, setSelectedOrderId] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedBank, setSelectedBank] = useState(null);
    const [searchBank, setSearchBank] = useState('');
    const [searchOrder, setSearchOrder] = useState('');

    const [formData, setFormData] = useState({
        bank: '',
        amount: '',
        received_at: '',
        transactionID: '',
        remark: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_APP_KEY}payment/${selectedOrderId}/reciept/`,
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response?.status === 200 || response?.status === 201) {
                toast.success("Order receipt created successfully!");
                setFormData({
                    bank: '',
                    amount: '',
                    received_at: '',
                    transactionID: '',
                    remark: ''
                });
                setSelectedOrderId('');
            }
        } catch (error) {
            toast.error("Failed to create order receipt");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const fetchBanks = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}banks/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response?.status === 200) {
                    setBanks(response?.data?.data);
                }
            } catch (error) {
                toast.error("Error fetching banks:");
            }
        };
        fetchBanks();
    }, []);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}orders/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.status === 200) {
                    setOrder(response?.data?.results);
                }
            } catch (error) {
                toast.error("Error fetching banks:");
            }
        };
        fetchOrders();
    }, []);

    const filteredBanks = banks.filter(bank =>
        (bank?.name || "").toLowerCase().includes(searchBank.toLowerCase())
    );

    const filteredOrders = order.filter(ord =>
        (ord?.invoice || "").toLowerCase().includes(searchOrder.toLowerCase()) ||
        (ord?.customer?.name || "").toLowerCase().includes(searchOrder.toLowerCase())
    );

    const handleBankChange = (selected) => {
        setSelectedBank(selected);
        setFormData(prev => ({ ...prev, bank: selected ? selected.value : '' }));
    };

    const handleOrderChange = (selected) => {
        setSelectedOrder(selected);
        setSelectedOrderId(selected ? selected.value : '');
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="PAYMENTS" breadcrumbItem="ORDER RECEIPT" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="mb-4">ORDER RECEIPT</CardTitle>
                                    <Form onSubmit={handleSubmit}>
                                        <Row>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>Orders</Label>
                                                    <Select
                                                        value={selectedOrder}
                                                        onChange={handleOrderChange}
                                                        options={filteredOrders.map(order => ({
                                                            label: `${order.invoice} - ${order.customer?.name} - ₹${order.total_amount}`,
                                                            value: order.id
                                                        }))}
                                                        isClearable
                                                        placeholder="Select Order"
                                                    />
                                                </div>
                                            </Col>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>Bank</Label>
                                                    <Select
                                                        value={selectedBank}
                                                        onChange={handleBankChange}
                                                        options={filteredBanks.map(bank => ({
                                                            label: bank.name,
                                                            value: bank.id
                                                        }))}
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
                                                    <Label>Received Date</Label>
                                                    <Input type="date" name="received_at" value={formData.received_at} onChange={handleChange} />
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
                                                        type="submit"
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
                    <ToastContainer />
                </div>
            </div>
        </React.Fragment>
    );
};

export default OrderReceipt;
