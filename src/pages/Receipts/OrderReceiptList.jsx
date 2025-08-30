import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import { Card, Col, Container, Row, CardBody, CardTitle, Table, Spinner, Input, Modal, ModalHeader, ModalBody, Label, ModalFooter, Button } from "reactstrap";
import Paginations from '../../components/Common/Pagination';
import Select from "react-select";

const OrderReceiptList = () => {
    const [receipts, setReceipts] = useState([])
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem("token");
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [formData, setFormData] = useState({ bank: '', amount: '' });
    const [selectedOrderId, setSelectedOrderId] = useState('');
    const [customerId, setCustomerId] = useState('')
    const [modalLoading, setModalLoading] = useState(false);
    const [banks, setBanks] = useState([]);
    const [order, setOrder] = useState([]);
    const [customer, setCustomer] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const perPageData = 10;
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

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
            const response = await axios.get(`${import.meta.env.VITE_APP_KEY}orderreceipt/view/`, {
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
            const response = await axios.get(`${import.meta.env.VITE_APP_KEY}orderreceipt/view/${id}/`, {
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
            setSelectedOrderId(data.order);
            setCustomerId(data.customer)
        } catch (error) {
            toast.error("Error fetching receipt details:");
        } finally {
            setModalLoading(false);
        }
    };

    const handleUpdate = async () => {
        try {
            // Save old data before updating
            const beforeData = {
                message: "Order Receipt Updated",
                ...selectedReceipt
            };

            // Make update API call
            const response = await axios.put(
                `${import.meta.env.VITE_APP_KEY}orderreceipt/view/${selectedReceipt.id}/`,
                {
                    payment_receipt: formData.payment_receipt,
                    order: selectedOrderId,
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

                // Prepare after data (use response.data if your API returns updated receipt)
                const afterData = response.data ? response.data : {
                    payment_receipt: formData.payment_receipt,
                    order: selectedOrderId,
                    bank: formData.bank,
                    amount: formData.amount,
                    transactionID: formData.transactionID,
                    received_at: formData.received_at,
                    customer: customerId,
                    remark: formData.remark,
                    created_by: selectedReceipt.created_by,
                };

                // Send log to create/datalog/
                await axios.post(
                    `${import.meta.env.VITE_APP_KEY}datalog/create/`,
                    {
                        order: selectedOrderId, // order id
                        before_data: beforeData,
                        after_data: afterData,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json"
                        }
                    }
                );
            }
        } catch (error) {
            console.error(error);
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
        const q = searchTerm.toLowerCase();
        const norm = v => (v ?? '').toString().toLowerCase();

        const matchesSearch =
            norm(item.payment_receipt).includes(q) ||
            norm(item.order_name).includes(q) ||
            norm(item.transactionID).includes(q) ||
            norm(item.customer_name).includes(q) ||
            norm(item.bank_name).includes(q) ||
            norm(item.created_by_name).includes(q) ||
            norm(item.remark).includes(q) ||
            norm(item.amount).includes(q);

        const receiptDate = new Date(item.received_at);
        const isAfterStart = startDate ? receiptDate >= new Date(startDate) : true;
        const isBeforeEnd = endDate ? receiptDate <= new Date(endDate) : true;

        return matchesSearch && isAfterStart && isBeforeEnd;
    });

    // put these above your return (or inside the component body)
    const orderOptions = order.map(o => ({
        value: String(o.id), // make types consistent
        label: `${o.invoice} - ${o.customer?.name ?? ""} - ₹${o.total_amount ?? 0}`,
    }));

    const customerOptions = customer.map(c => ({
        value: String(c.id),
        label: c.name,
    }));

    const reactSelectStyles = {
        menuPortal: base => ({ ...base, zIndex: 9999 }),
    };

    // If your state is numeric, normalize it to string once:
    const selectedOrderValue = selectedOrderId ? String(selectedOrderId) : "";
    const selectedCustomerValue = customerId ? String(customerId) : "";

    const rsStyles = {
        menuPortal: base => ({ ...base, zIndex: 9999 }),
        menu: base => ({
            ...base,
            zIndex: 9999,
            backgroundColor: '#fff',     // <-- force solid background
            border: '1px solid #e9ecef',
            boxShadow: '0 6px 20px rgba(0,0,0,.15)',
        }),
        menuList: base => ({
            ...base,
            backgroundColor: '#fff',     // <-- make list solid too
        }),
        option: (base, state) => ({
            ...base,
            cursor: 'pointer',
            backgroundColor: state.isFocused ? '#eef5ff' : '#fff',
            color: '#212529',
        }),
        control: base => ({
            ...base,
            minHeight: 38,
            borderColor: '#ced4da',
        }),
        singleValue: base => ({ ...base, color: '#212529' }),
        placeholder: base => ({ ...base, color: '#6c757d' }),
    };

    const indexOfLastItem = currentPage * perPageData;
    const indexOfFirstItem = indexOfLastItem - perPageData;
    const currentReceipts = filteredReceipts.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid={true}>
                    <Breadcrumbs title="TABLES" breadcrumbItem="ORDER RECEIPTS" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="mb-4">ORDER RECEIPTS</CardTitle>
                                    <Row className="mb-3">
                                        <Col>
                                            <Label>Search</Label>
                                            <Input
                                                type="text"
                                                placeholder="Search by Receipt, Order, Amount, Transaction ID, Remark, Customer, Bank, Created By"
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
                                                        <th>Order</th>
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
                                                    {currentReceipts.map((item, index) => (
                                                        <tr key={item.id}>
                                                            <td>{indexOfFirstItem + index + 1}</td>
                                                            <td>{item.payment_receipt}</td>
                                                            <td>{item.order_name}</td>
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
                                                                <Label>Orders</Label>
                                                                <Select
                                                                    options={orderOptions}
                                                                    value={orderOptions.find(opt => opt.value === selectedOrderValue) || null}
                                                                    onChange={(opt) => setSelectedOrderId(opt?.value || "")}
                                                                    placeholder="Select Order"
                                                                    isClearable
                                                                    isSearchable
                                                                    menuPortalTarget={document.body}
                                                                    styles={rsStyles}
                                                                />
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
                                                        <Col md={4}>
                                                            <div className="mb-3">
                                                                <Label>Customer Name</Label>
                                                                <Select
                                                                    options={customerOptions}
                                                                    value={customerOptions.find(opt => opt.value === selectedCustomerValue) || null}
                                                                    onChange={(opt) => setCustomerId(opt?.value || "")}
                                                                    placeholder="Select Customer"
                                                                    isClearable
                                                                    isSearchable
                                                                    menuPortalTarget={document.body}
                                                                    styles={rsStyles}
                                                                />
                                                            </div>
                                                        </Col>
                                                        <Col md={4}>
                                                            <div className="mb-3">
                                                                <Label>Remark</Label>
                                                                <Input type='text' name='remark' value={formData.remark} onChange={handleChange} />
                                                            </div>
                                                        </Col>
                                                        <Col md={4}>
                                                            <div className="mb-3">
                                                                <Label>Created BY</Label>
                                                                <Input type='text' value={formData.created_by_name} disabled></Input>
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
export default OrderReceiptList;