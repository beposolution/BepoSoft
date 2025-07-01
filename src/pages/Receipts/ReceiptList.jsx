import React, { useState, useEffect } from "react";
import axios from 'axios';
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { Card, CardBody, Col, Row, Table, CardTitle, Spinner, Input, Button } from "reactstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const OtherReceipt = () => {
    const [receipts, setReceipts] = useState({})
    const [customers, setCustomers] = useState([]);
    const [banks, setBanks] = useState([]);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem("token")

    useEffect(() => {
        const fetchReceiptData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}allreceipts/view/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setReceipts(response?.data);
            } catch (error) {
                toast.error('Error fetching order data:');
            } finally {
                setLoading(false);
            }
        };
        fetchReceiptData();
    }, []);

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

    const getCustomerName = (id) => {
        const customer = customers.find(c => c.id === id);
        return customer ? customer.name : "N/A";
    };

    const getBankName = (id) => {
        const bank = banks.find(b => b.id === id);
        return bank ? bank.name : "N/A";
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="PAYMENTS" breadcrumbItem="ALL RECEIPT LIST" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="mb-4">ALL RECEIPT LIST</CardTitle>
                                    {loading ? (
                                        <Spinner color="primary" />
                                    ) : (
                                        <Table striped bordered responsive>
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Date</th>
                                                    <th>Customer Name</th>
                                                    <th>Bank Name</th>
                                                    <th>Amount</th>
                                                    <th>Reference</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {[...receipts.advance_receipts, ...receipts.bank_receipts, ...receipts.payment_receipts].length > 0 ? (
                                                    [...receipts.advance_receipts, ...receipts.bank_receipts, ...receipts.payment_receipts].map((receipt, index) => (
                                                        <tr key={receipt.id || index}>
                                                            <td>{index + 1}</td>
                                                            <td>{receipt.received_at || "N/A"}</td>
                                                            <td>{getCustomerName(receipt.customer)}</td>
                                                            <td>{getBankName(receipt.bank)}</td>
                                                            <td>{receipt.amount || "N/A"}</td>
                                                            <td>{receipt.transactionID || "N/A"}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="6" className="text-center">No receipts found.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </Table>
                                    )}
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </div>
        </React.Fragment>
    )
};
export default OtherReceipt;