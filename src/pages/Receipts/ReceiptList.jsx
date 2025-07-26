import React, { useState, useEffect } from "react";
import axios from 'axios';
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { Card, CardBody, Col, Row, Table, CardTitle, Spinner, Input, Button } from "reactstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Paginations from "../../components/Common/Pagination";

const OtherReceipt = () => {
    const [receipts, setReceipts] = useState({})
    const [customers, setCustomers] = useState([]);
    const [banks, setBanks] = useState([]);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem("token")
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [filteredReceipts, setFilteredReceipts] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const perPageData = 10;

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

    useEffect(() => {
        const allReceipts = receipts.receipts || [];

        let filtered = allReceipts;

        if (startDate && endDate) {
            filtered = allReceipts.filter(receipt => {
                const receiptDate = new Date(receipt.received_at);
                return (
                    receiptDate >= new Date(startDate) &&
                    receiptDate <= new Date(endDate)
                );
            });
        }

        setFilteredReceipts(filtered);
        setCurrentPage(1);
    }, [receipts, startDate, endDate]);

    const getCustomerName = (id) => {
        const customer = customers.find(c => c.id === id);
        return customer ? customer.name : "N/A";
    };

    const getBankName = (id) => {
        const bank = banks.find(b => b.id === id);
        return bank ? bank.name : "N/A";
    };

    const indexOfLastItem = currentPage * perPageData;
    const indexOfFirstItem = indexOfLastItem - perPageData;
    const currentReceipts = filteredReceipts.slice(indexOfFirstItem, indexOfLastItem);

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
                                        <div>
                                            <Row className="mb-3">
                                                <Col md={3}>
                                                    <label>Start Date</label>
                                                    <Input
                                                        type="date"
                                                        value={startDate}
                                                        onChange={(e) => setStartDate(e.target.value)}
                                                    />
                                                </Col>
                                                <Col md={3}>
                                                    <label>End Date</label>
                                                    <Input
                                                        type="date"
                                                        value={endDate}
                                                        onChange={(e) => setEndDate(e.target.value)}
                                                    />
                                                </Col>
                                                <Col md={3} className="d-flex align-items-end">
                                                    <Button color="primary" onClick={() => { /* No action needed since useEffect handles it */ }}>
                                                        Filter
                                                    </Button>
                                                </Col>
                                            </Row>


                                            <Table striped bordered responsive>
                                                <thead>
                                                    <tr>
                                                        <th>#</th>
                                                        <th>Date</th>
                                                        <th>Invoice</th>
                                                        <th>Customer Name</th>
                                                        <th>Bank Name</th>
                                                        <th>Amount</th>
                                                        <th>Reference</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {currentReceipts.length > 0 ? (
                                                        currentReceipts.map((receipt, index) => (
                                                            <tr key={`${receipt.id ?? "receipt"}-${index}`}>
                                                                <td>{indexOfFirstItem + index + 1}</td>
                                                                <td>{receipt.received_at || "N/A"}</td>
                                                                <td>{receipt?.order_name || "N/A"}</td>
                                                                <td>{getCustomerName(receipt.customer)}</td>
                                                                <td>{getBankName(receipt.bank)}</td>
                                                                <td>{receipt.amount || "N/A"}</td>
                                                                <td>{receipt.transactionID || "N/A"}</td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="7" className="text-center">No receipts found.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </Table>
                                            <Paginations
                                                perPageData={perPageData}
                                                data={filteredReceipts}
                                                currentPage={currentPage}
                                                setCurrentPage={setCurrentPage}
                                                isShowingPageLength={true}
                                                paginationDiv="col-auto"
                                                paginationClass="pagination-rounded"
                                                indexOfFirstItem={indexOfFirstItem}
                                                indexOfLastItem={indexOfLastItem}
                                            />
                                        </div>
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