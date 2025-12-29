import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Breadcrumbs from "../../components/Common/Breadcrumb";
import {
    Card,
    Col,
    Container,
    Row,
    CardBody,
    CardTitle,
    Label,
    Input,
    Button,
    Spinner
} from "reactstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Select from "react-select";

const AmountTransfer = () => {

    const token = localStorage.getItem("token");

    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        send_from: null,
        send_to: null,
        amount: "",
        date: "",
        note: "",
        images: [],
    });

    const fetchCustomers = async () => {
        try {
            const res = await axios.get(
                `${import.meta.env.VITE_APP_KEY}customers/`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const options = (res.data?.data || []).map(c => ({
                value: c.id,
                label: c.name,
            }));

            setCustomers(options);
        } catch {
            toast.error("Failed to load customers");
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const handleFileChange = (e) => {
        setFormData(prev => ({
            ...prev,
            images: Array.from(e.target.files),
        }));
    };

    const handleSubmit = async () => {

        if (!formData.send_from || !formData.send_to || !formData.amount || !formData.date) {
            toast.error("Please fill all required fields");
            return;
        }

        setLoading(true);

        try {
            const payload = new FormData();
            payload.append("send_from", formData.send_from.value);
            payload.append("send_to", formData.send_to.value);
            payload.append("amount", formData.amount);
            payload.append("date", formData.date);
            payload.append("note", formData.note);

            formData.images.forEach(img => {
                payload.append("images", img);
            });

            const res = await axios.post(
                `${import.meta.env.VITE_APP_KEY}advance/transfer/create/`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            if (res.status === 201) {
                await axios.post(
                    `${import.meta.env.VITE_APP_KEY}datalog/create/`,
                    {
                        reference_type: "ADVANCE_AMOUNT_TRANSFER",
                        reference_no: `TRANSFER-${res.data.data.id}`,
                        before_data: "Customer Advance Amount Transfer",
                        after_data: {
                            send_from: formData.send_from.label,
                            send_to: formData.send_to.label,
                            amount: formData.amount,
                            date: formData.date,
                            note: formData.note,
                        },
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                toast.success("Advance amount transfer created successfully");

                setFormData({
                    send_from: null,
                    send_to: null,
                    amount: "",
                    date: "",
                    note: "",
                    images: [],
                });
            }

        } catch (err) {
            console.error(err);
            toast.error("Failed to create transfer");
        } finally {
            setLoading(false);
        }
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <Breadcrumbs title="TABLES" breadcrumbItem="ADVANCE AMOUNT TRANSFER" />

                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="mb-4">ADVANCE AMOUNT TRANSFER</CardTitle>

                                    <Row>

                                        <Col md={6}>
                                            <Label>Product Send From *</Label>
                                            <Select
                                                options={customers}
                                                value={formData.send_from}
                                                onChange={(val) => setFormData({ ...formData, send_from: val })}
                                            />
                                        </Col>
                                        <Col md={6}>
                                            <Label>Product Send To *</Label>
                                            <Select
                                                options={customers}
                                                value={formData.send_to}
                                                onChange={(val) => setFormData({ ...formData, send_to: val })}
                                            />
                                        </Col>
                                    </Row>

                                    <Row className="mt-3">
                                        <Col md={4}>
                                            <Label>Amount *</Label>
                                            <Input
                                                type="number"
                                                value={formData.amount}
                                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            />
                                        </Col>

                                        <Col md={4}>
                                            <Label>Date *</Label>
                                            <Input
                                                type="date"
                                                value={formData.date}
                                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            />
                                        </Col>
                                    </Row>

                                    <Row className="mt-3">
                                        <Col md={12}>
                                            <Label>Note</Label>
                                            <Input
                                                value={formData.note}
                                                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                            />
                                        </Col>
                                    </Row>

                                    <Row className="mt-3">
                                        <Col md={12}>
                                            <Label>Upload Images</Label>
                                            <Input type="file" multiple onChange={handleFileChange} />
                                        </Col>
                                    </Row>

                                    <Row className="mt-4">
                                        <Col>
                                            <Button color="primary" onClick={handleSubmit} disabled={loading}>
                                                {loading ? <Spinner size="sm" /> : "Submit"}
                                            </Button>
                                        </Col>
                                    </Row>

                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
                <ToastContainer />
            </div>
        </React.Fragment>
    );
};

export default AmountTransfer;
