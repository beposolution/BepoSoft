import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import { Card, Col, Container, Row, CardBody, CardTitle, Table, Spinner, Input, Modal, ModalHeader, ModalBody, Label, ModalFooter, Button } from "reactstrap";
import Paginations from '../../components/Common/Pagination';
import Select from 'react-select';

const OtherReceiptList = () => {
    const [receipts, setReceipts] = useState([])
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem("token")
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [formData, setFormData] = useState({
        bank: '',
        amount: '',
        payment_receipt: '',
        created_by_name: '',
        transactionID: '',
        remark: '',
        received_at: '',
        customer: '',
        order: '',
    });
    const [modalLoading, setModalLoading] = useState(false);
    const [banks, setBanks] = useState([]);
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const perPageData = 10;
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

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
                if (response?.status === 200) {
                    setOrders(response?.data?.results);
                }
            } catch (error) {
                toast.error("Error fetching banks:");
            }
        };
        fetchOrders();
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

    const fetchReceiptData = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_APP_KEY}bankreceipt/view/`, {
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
            const response = await axios.get(`${import.meta.env.VITE_APP_KEY}bankreceipt/view/${id}/`, {
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
        } catch (error) {
            toast.error("Error fetching receipt details:");
        } finally {
            setModalLoading(false);
        }
    };

    const handleUpdate = async () => {
        try {
            let shouldDeleteOriginalReceipt = false;

            if (formData.customer) {
                const response = await axios.post(`${import.meta.env.VITE_APP_KEY}advancereceipt/`, {
                    bank: formData.bank,
                    amount: formData.amount,
                    received_at: formData.received_at,
                    transactionID: formData.transactionID,
                    remark: formData.remark,
                    customer: formData.customer,
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                toast.success("Advance Receipt created successfully");
                shouldDeleteOriginalReceipt = true;

            } else if (formData.order) {
                const response = await axios.post(`${import.meta.env.VITE_APP_KEY}payment/${formData.order}/reciept/`, {
                    bank: formData.bank,
                    amount: formData.amount,
                    received_at: formData.received_at,
                    transactionID: formData.transactionID,
                    remark: formData.remark,
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                toast.success("Order Receipt created successfully");
                shouldDeleteOriginalReceipt = true;
            } else {
                // Regular PUT update
                const response = await axios.put(
                    `${import.meta.env.VITE_APP_KEY}bankreceipt/view/${selectedReceipt.id}/`,
                    {
                        payment_receipt: formData.payment_receipt,
                        bank: formData.bank,
                        amount: formData.amount,
                        transactionID: formData.transactionID,
                        received_at: formData.received_at,
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
                    fetchReceiptData();
                }
            }

            // DELETE only if conversion to advance/order receipt was successful
            if (shouldDeleteOriginalReceipt && selectedReceipt?.id) {
                await axios.delete(`${import.meta.env.VITE_APP_KEY}bankreceipt/view/${selectedReceipt.id}/`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                toast.success("Original bank receipt deleted.");
                fetchReceiptData(); // refresh the list
            }

            setModalOpen(false);
        } catch (error) {
            console.error("Error:", error);
            toast.error("Failed to update receipt.");
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const filteredReceipts = receipts.filter((item) => {
        const matchesSearch =
            (item.payment_receipt || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.transactionID || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.bank_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.remark || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.created_by_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(item.amount ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            Number(item.amount || 0).toFixed(2).includes(searchTerm);

        const receiptDate = new Date(item.received_at);
        const isAfterStart = startDate ? receiptDate >= new Date(startDate) : true;
        const isBeforeEnd = endDate ? receiptDate <= new Date(endDate) : true;

        return matchesSearch && isAfterStart && isBeforeEnd;
    });

    const resetForm = () => {
        setFormData({
            bank: '',
            amount: '',
            payment_receipt: '',
            created_by_name: '',
            transactionID: '',
            remark: '',
            received_at: '',
            customer: '',
            order: '',
        });
        setSelectedReceipt(null);
    };

    const indexOfLastItem = currentPage * perPageData;
    const indexOfFirstItem = indexOfLastItem - perPageData;
    const currentReceipts = filteredReceipts.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <React.Fragment>
            <style>
                {`
                    .modal {
                        overflow: visible !important;
                    }
                    .Select__menu-portal {
                        z-index: 9999;
                    }
                    .react-select__menu {
                        z-index: 9999 !important;
                    }
                `}
            </style>
            <div className="page-content">
                <Container fluid={true}>
                    <Breadcrumbs title="TABLES" breadcrumbItem="OTHER RECEIPTS" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="mb-4">OTHER RECEIPTS</CardTitle>
                                    <Row className="mb-3">
                                        <Col>
                                            <Label>Search</Label>
                                            <Input
                                                type="text"
                                                placeholder="Search by Receipt, Amount, Transaction ID, Bank, Remark, Created By"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </Col>

                                        <Col md={3}>
                                            <Label>Start Date</Label>
                                            <Input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                            />
                                        </Col>
                                        <Col md={3}>
                                            <Label>End Date</Label>
                                            <Input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                            />
                                        </Col>
                                        <Col md={3} className="d-flex align-items-end">
                                            <Button
                                                color="warning"
                                                onClick={() => {
                                                    setStartDate('');
                                                    setEndDate('');
                                                }}
                                            >
                                                Clear Date Filter
                                            </Button>
                                        </Col>
                                    </Row>
                                    {loading ? (
                                        <Spinner color="primary" />
                                    ) : (
                                        <>
                                            <Table bordered responsive striped hover>
                                                <thead className="thead-dark">
                                                    <tr>
                                                        <th>#</th>
                                                        <th>Receipt</th>
                                                        <th>Amount</th>
                                                        <th>Transaction ID</th>
                                                        <th>Received At</th>
                                                        <th>Remark</th>
                                                        <th>Bank</th>
                                                        <th>Created By</th>
                                                        <th>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {currentReceipts.map((item, index) => (
                                                        <tr key={item.id}>
                                                            <td>{indexOfFirstItem + index + 1}</td>
                                                            <td>{item.payment_receipt}</td>
                                                            <td>{item.amount}</td>
                                                            <td>{item.transactionID}</td>
                                                            <td>{item.received_at}</td>
                                                            <td>{item.remark}</td>
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
                                        </>
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
                                                        <Col md={6}>
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
                                                        <Col md={6}>
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
                                                                <Label>Remark</Label>
                                                                <Input type='text' name='remark' value={formData.remark} onChange={handleChange} />
                                                            </div>
                                                        </Col>
                                                        <Col md={6}>
                                                            <div className="mb-3">
                                                                <Label>Created BY</Label>
                                                                <Input type='text' value={formData.created_by_name} disabled></Input>
                                                            </div>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Col md={6}>
                                                            <div className="mb-3">
                                                                <Label>Select Customer</Label>
                                                                <Select
                                                                    options={customers.map(c => ({ label: c.name, value: c.id }))}
                                                                    onChange={(selected) => setFormData(prev => ({
                                                                        ...prev,
                                                                        customer: selected?.value || '',
                                                                        order: ''  // clear order if customer is selected
                                                                    }))}
                                                                    isClearable
                                                                    placeholder="Choose Customer"
                                                                    value={
                                                                        formData.customer
                                                                            ? { label: customers.find(c => c.id === formData.customer)?.name || '', value: formData.customer }
                                                                            : null
                                                                    }
                                                                    isDisabled={!!formData.order}
                                                                    menuPortalTarget={document.body}
                                                                    styles={{
                                                                        menuPortal: base => ({ ...base, zIndex: 9999 }),
                                                                        menu: base => ({ ...base, zIndex: 9999 })
                                                                    }}
                                                                />
                                                            </div>
                                                        </Col>
                                                        <Col md={6}>
                                                            <div className="mb-3">
                                                                <Label>Select Order</Label>
                                                                <Select
                                                                    options={orders.map(order => ({
                                                                        label: `${order.invoice} - ${order.customer?.name} - ₹${order.total_amount}`,
                                                                        value: order.id
                                                                    }))}
                                                                    onChange={(selected) => setFormData(prev => ({
                                                                        ...prev,
                                                                        order: selected?.value || '',
                                                                        customer: ''  // clear customer if order is selected
                                                                    }))}
                                                                    isClearable
                                                                    placeholder="Choose Order"
                                                                    value={
                                                                        formData.order
                                                                            ? {
                                                                                label: orders.find(o => o.id === formData.order)?.invoice +
                                                                                    ' - ' + orders.find(o => o.id === formData.order)?.customer?.name +
                                                                                    ' - ₹' + orders.find(o => o.id === formData.order)?.total_amount,
                                                                                value: formData.order
                                                                            }
                                                                            : null
                                                                    }
                                                                    isDisabled={!!formData.customer}
                                                                    menuPortalTarget={document.body}
                                                                    styles={{
                                                                        menuPortal: base => ({ ...base, zIndex: 9999 }),
                                                                        menu: base => ({ ...base, zIndex: 9999 })
                                                                    }}
                                                                />
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
                                            <Button
                                                color="secondary"
                                                onClick={() => {
                                                    setModalOpen(false);
                                                    resetForm();  // reset all form fields
                                                }}
                                            >
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
export default OtherReceiptList;