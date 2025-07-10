import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { Card, Col, Container, Row, CardBody, CardTitle, Table, Spinner, Input, Modal, ModalHeader, ModalBody, Label, ModalFooter, Button } from "reactstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AdvanceReceiptList = () => {
    const [receipts, setReceipts] = useState([])
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem("token")
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [formData, setFormData] = useState({ bank: '', amount: '' });
    const [customerId, setCustomerId] = useState('')
    const [modalLoading, setModalLoading] = useState(false);
    const [banks, setBanks] = useState([]);
    const [customer, setCustomer] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}customers/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.status === 200) {
                    setCustomer(response?.data?.data);
                }
            } catch (error) {
                toast.error("Error fetching banks:");
            }
        };
        fetchCustomers();
    }, []);

    useEffect(() => {
        const fetchBanks = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}banks/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response?.status === 200) {
                    setBanks(response.data.data);
                }
            } catch (error) {
                toast.error("Error fetching banks:");
            }
        };
        fetchBanks();
    }, []);

    const fetchReceiptData = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_APP_KEY}advancereceipt/view/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReceipts(response?.data);
        } catch (error) {
            toast.error('Error fetching order data:');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReceiptData();
    }, []);

    const handleView = async (id) => {
        setModalLoading(true);
        setModalOpen(true);
        try {
            const response = await axios.get(`${import.meta.env.VITE_APP_KEY}advancereceipt/view/${id}/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = response.data;
            setSelectedReceipt(data);
            setFormData({
                bank: data.bank,
                amount: data.amount,
                payment_receipt: data.payment_receipt,
                created_by_name: data.created_by_name,
                transactionID: data.transactionID,
                remark: data.remark,
                received_at: data.received_at
            });
            setCustomerId(data.customer)
        } catch (error) {
            toast.error("Error fetching receipt details:");
        } finally {
            setModalLoading(false);
        }
    };

    const handleUpdate = async () => {
        try {
            const response = await axios.put(
                `${import.meta.env.VITE_APP_KEY}advancereceipt/view/${selectedReceipt.id}/`,
                {
                    payment_receipt: formData.payment_receipt,
                    bank: formData.bank,
                    amount: formData.amount,
                    transactionID: formData.transactionID,
                    received_at: formData.received_at,
                    customer: customerId,
                    remark: formData.remark,
                    created_by: selectedReceipt.created_by,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );
            if (response.status === 200 || response.status === 204) {
                toast.success("Receipt updated successfully!");
                setModalOpen(false);
                fetchReceiptData();
            }
        } catch (error) {
            toast.error("Failed to update receipt.");
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const filteredReceipts = receipts.filter((item) =>
        (item.payment_receipt || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.transactionID || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.customer_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.bank_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.created_by_name || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid={true}>
                    <Breadcrumbs title="TABLES" breadcrumbItem="ADVANCE RECEIPTS" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="mb-4">ADVANCE RECEIPTS</CardTitle>
                                    <div className="mb-3">
                                        <Input
                                            type="text"
                                            placeholder="Search by Receipt, Transaction ID, Customer, Bank, Created By"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    {loading ? (
                                        <Spinner color="primary" />
                                    ) : (
                                        <Table bordered responsive striped hover>
                                            <thead className="thead-dark">
                                                <tr>
                                                    <th>#</th>
                                                    <th>Receipt</th>
                                                    <th>Amount</th>
                                                    <th>Transaction ID</th>
                                                    <th>Received At</th>
                                                    <th>Remark</th>
                                                    <th>Customer</th>
                                                    <th>Bank</th>
                                                    <th>Created By</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredReceipts.map((item, index) => (
                                                    <tr key={item.id}>
                                                        <td>{index + 1}</td>
                                                        <td>{item.payment_receipt}</td>
                                                        <td>{item.amount}</td>
                                                        <td>{item.transactionID}</td>
                                                        <td>{item.received_at}</td>
                                                        <td>{item.remark}</td>
                                                        <td>{item.customer_name}</td>
                                                        <td>{item.bank_name}</td>
                                                        <td>{item.created_by_name}</td>
                                                        <td>
                                                            <button
                                                                className="btn btn-primary btn-sm"
                                                                onClick={() => handleView(item.id)}
                                                            >
                                                                View
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    )}
                                    <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)} size="lg">
                                        <ModalHeader toggle={() => setModalOpen(!modalOpen)}>
                                            Receipt Details
                                        </ModalHeader>
                                        <ModalBody>
                                            {modalLoading ? (
                                                <div>Loading...</div>
                                            ) : (
                                                <>
                                                    <Row>
                                                        <Col md={4}>
                                                            <div className="mb-3">
                                                                <Label>Receipt</Label>
                                                                <Input
                                                                    type="text"
                                                                    value={formData.payment_receipt}
                                                                    disabled
                                                                >
                                                                </Input>
                                                            </div>
                                                        </Col>
                                                        <Col md={4}>
                                                            <div className="mb-3">
                                                                <Label>Bank</Label>
                                                                <Input
                                                                    type="select"
                                                                    name="bank"
                                                                    value={formData.bank}
                                                                    onChange={handleChange}
                                                                >
                                                                    <option value="">Select Bank</option>
                                                                    {banks.map((bank) => (
                                                                        <option key={bank.id} value={bank.id}>
                                                                            {bank.name}
                                                                        </option>
                                                                    ))}
                                                                </Input>
                                                            </div>
                                                        </Col>
                                                        <Col md={4}>
                                                            <div className="mb-3">
                                                                <Label>Created BY</Label>
                                                                <Input type='text' value={formData.created_by_name} disabled></Input>
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
                                                                <Label>Transaction ID</Label>
                                                                <Input type='text' name='transactionID' value={formData.transactionID} onChange={handleChange} />
                                                            </div>
                                                        </Col>
                                                        <Col md={4}>
                                                            <div className="mb-3">
                                                                <Label>Received At</Label>
                                                                <Input type='date' name='received_at' value={formData.received_at} onChange={handleChange}></Input>
                                                            </div>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Col md={6}>
                                                            <div className="mb-3">
                                                                <Label>Customer Name</Label>
                                                                <Input type='select' name='customer_name'
                                                                    value={customerId}
                                                                    onChange={(e) => setCustomerId(e.target.value)}
                                                                >
                                                                    <option value="">Select Customer</option>
                                                                    {customer.map((customer) => (
                                                                        <option key={customer.id} value={customer.id}>
                                                                            {customer.name}
                                                                        </option>
                                                                    ))}
                                                                </Input>
                                                            </div>
                                                        </Col>
                                                        <Col md={6}>
                                                            <div className="mb-3">
                                                                <Label>Remark</Label>
                                                                <Input type='text' name='remark' value={formData.remark} onChange={handleChange} />
                                                            </div>
                                                        </Col>
                                                    </Row>
                                                </>
                                            )}
                                        </ModalBody>
                                        <ModalFooter>
                                            <Button color="primary" onClick={handleUpdate}>
                                                Update Receipt
                                            </Button>
                                            <Button color="secondary" onClick={() => setModalOpen(false)}>
                                                Cancel
                                            </Button>
                                        </ModalFooter>
                                    </Modal>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
                <ToastContainer />
            </div>
        </React.Fragment>
    )
}
export default AdvanceReceiptList;