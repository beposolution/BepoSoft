import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import {
    Card,
    Col,
    Container,
    Row,
    CardBody,
    CardTitle,
    Table,
    Spinner,
    Input,
    Modal,
    ModalHeader,
    ModalBody,
    Label,
    ModalFooter,
    Button
} from "reactstrap";
import Paginations from '../../components/Common/Pagination';
import AsyncSelect from "react-select/async";

const OrderReceiptList = () => {
    const [receipts, setReceipts] = useState([]);
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem("token");

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [formData, setFormData] = useState({ bank: '', amount: '' });

    const [selectedOrderId, setSelectedOrderId] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);

    const [banks, setBanks] = useState([]);
    const [users, setUsers] = useState([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const perPageData = 50;

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [filterOrder, setFilterOrder] = useState(null);
    const [filterCustomer, setFilterCustomer] = useState(null);
    const [filterBank, setFilterBank] = useState('');
    const [filterCreatedBy, setFilterCreatedBy] = useState('');

    const rsStyles = {
        menuPortal: base => ({ ...base, zIndex: 9999 }),
        menu: base => ({
            ...base,
            zIndex: 9999,
            backgroundColor: '#fff',
            border: '1px solid #e9ecef',
            boxShadow: '0 6px 20px rgba(0,0,0,.15)',
        }),
        menuList: base => ({
            ...base,
            backgroundColor: '#fff',
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

    const loadCustomers = async (inputValue) => {
        if (!inputValue) return [];

        try {
            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}customers/?search=${inputValue}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            return (response.data.results || []).map(c => ({
                value: String(c.id),
                label: `${c.name} - ${c.phone ?? ""}`
            }));

        } catch (err) {
            return [];
        }
    };

    const loadOrders = async (inputValue) => {
        if (!inputValue) return [];

        try {
            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}orders/?search=${inputValue}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            const orders = response.data?.results?.results || [];

            return orders.map(o => ({
                value: String(o.id),
                label: `${o.invoice} - ${o.customer?.name ?? ""} - ₹${o.total_amount ?? 0}`
            }));

        } catch (error) {
            console.error("Order search error:", error);
            return [];
        }
    };

    useEffect(() => {
        const fetchBanks = async () => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_APP_KEY}banks/`,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                if (response?.status === 200) {
                    setBanks(response.data.data || []);
                }

            } catch (error) {
                toast.error("Error fetching banks");
            }
        };

        fetchBanks();
    }, []);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_APP_KEY}users/`,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                if (response?.status === 200) {
                    setUsers(response.data.data || []);
                }

            } catch (error) {
                toast.error("Error fetching users");
            }
        };

        fetchUsers();
    }, []);

    const fetchReceiptData = async (
        page = currentPage,
        customFilters = null
    ) => {
        try {
            setLoading(true);

            const params = new URLSearchParams();

            params.append("page", page);

            const activeSearch = customFilters?.searchTerm ?? searchTerm;
            const activeOrder = customFilters?.filterOrder ?? filterOrder;
            const activeCustomer = customFilters?.filterCustomer ?? filterCustomer;
            const activeBank = customFilters?.filterBank ?? filterBank;
            const activeCreatedBy = customFilters?.filterCreatedBy ?? filterCreatedBy;
            const activeStartDate = customFilters?.startDate ?? startDate;
            const activeEndDate = customFilters?.endDate ?? endDate;

            if (activeSearch.trim()) {
                params.append("search", activeSearch.trim());
            }

            if (activeOrder?.value) {
                params.append("order", activeOrder.value);
            }

            if (activeCustomer?.value) {
                params.append("customer", activeCustomer.value);
            }

            if (activeBank) {
                params.append("bank", activeBank);
            }

            if (activeCreatedBy) {
                params.append("created_by", activeCreatedBy);
            }

            if (activeStartDate) {
                params.append("start_date", activeStartDate);
            }

            if (activeEndDate) {
                params.append("end_date", activeEndDate);
            }

            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}orderreceipt/view/get/?${params.toString()}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setReceipts(response?.data?.results?.data || []);
            setTotalCount(response?.data?.count || 0);

        } catch (error) {
            toast.error('Error fetching order receipt data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReceiptData(currentPage);
    }, [currentPage]);

    const handleApplyFilter = () => {
        if (currentPage === 1) {
            fetchReceiptData(1);
        } else {
            setCurrentPage(1);
        }
    };

    const handleClearFilter = () => {
        const emptyFilters = {
            searchTerm: '',
            filterOrder: null,
            filterCustomer: null,
            filterBank: '',
            filterCreatedBy: '',
            startDate: '',
            endDate: '',
        };

        setSearchTerm('');
        setFilterOrder(null);
        setFilterCustomer(null);
        setFilterBank('');
        setFilterCreatedBy('');
        setStartDate('');
        setEndDate('');

        if (currentPage === 1) {
            fetchReceiptData(1, emptyFilters);
        } else {
            setCurrentPage(1);
            fetchReceiptData(1, emptyFilters);
        }
    };

    const handleView = async (id) => {
        setModalLoading(true);
        setModalOpen(true);

        try {
            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}orderreceipt/view/${id}/`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            const data = response.data;

            setSelectedReceipt(data);

            setFormData({
                bank: data.bank,
                amount: data.amount,
                payment_receipt: data.payment_receipt,
                created_by_name: data.created_by_name,
                transactionID: data.transactionID,
                remark: data.remark,
                customer_name: data.customer_name,
                received_at: data.received_at ? data.received_at.split("T")[0] : ""
            });

            setSelectedOrderId(data.order);

            setSelectedCustomer({
                value: String(data.customer),
                label: data.customer_name
            });

        } catch (error) {
            toast.error("Error fetching receipt details");
        } finally {
            setModalLoading(false);
        }
    };

    const handleUpdate = async () => {
        try {
            const beforeData = {
                message: "Order Receipt Updated",
                ...selectedReceipt
            };

            const response = await axios.put(
                `${import.meta.env.VITE_APP_KEY}orderreceipt/view/${selectedReceipt.id}/`,
                {
                    payment_receipt: formData.payment_receipt,
                    order: selectedOrderId,
                    bank: formData.bank,
                    amount: formData.amount,
                    transactionID: formData.transactionID,
                    received_at: formData.received_at,
                    customer: selectedCustomer?.value,
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
                fetchReceiptData(currentPage);

                const afterData = response.data ? response.data : {
                    payment_receipt: formData.payment_receipt,
                    order: selectedOrderId,
                    bank: formData.bank,
                    amount: formData.amount,
                    transactionID: formData.transactionID,
                    received_at: formData.received_at,
                    customer: selectedCustomer?.value,
                    remark: formData.remark,
                    created_by: selectedReceipt.created_by,
                };

                await axios.post(
                    `${import.meta.env.VITE_APP_KEY}datalog/create/`,
                    {
                        order: selectedOrderId,
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
            toast.error("Failed to update receipt.");
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const indexOfFirstItem = (currentPage - 1) * perPageData;
    const indexOfLastItem = Math.min(currentPage * perPageData, totalCount);

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid={true}>
                    <Breadcrumbs title="TABLES" breadcrumbItem="ORDER RECEIPTS" />

                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="mb-4">
                                        ORDER RECEIPTS
                                    </CardTitle>

                                    <Row className="mb-3">
                                        <Col md={4}>
                                            <Label>Search</Label>
                                            <Input
                                                type="text"
                                                placeholder="Search Receipt, Invoice, Amount, Transaction ID"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        handleApplyFilter();
                                                    }
                                                }}
                                            />
                                        </Col>

                                        <Col md={4}>
                                            <Label>Order</Label>
                                            <AsyncSelect
                                                cacheOptions
                                                defaultOptions
                                                loadOptions={loadOrders}
                                                value={filterOrder}
                                                onChange={(opt) => setFilterOrder(opt)}
                                                placeholder="Search Order"
                                                isClearable
                                                menuPortalTarget={document.body}
                                                styles={rsStyles}
                                            />
                                        </Col>

                                        <Col md={4}>
                                            <Label>Customer</Label>
                                            <AsyncSelect
                                                cacheOptions
                                                defaultOptions
                                                loadOptions={loadCustomers}
                                                value={filterCustomer}
                                                onChange={(opt) => setFilterCustomer(opt)}
                                                placeholder="Search Customer"
                                                isClearable
                                                menuPortalTarget={document.body}
                                                styles={rsStyles}
                                            />
                                        </Col>
                                    </Row>

                                    <Row className="mb-3">
                                        <Col md={3}>
                                            <Label>Bank</Label>
                                            <Input
                                                type="select"
                                                value={filterBank}
                                                onChange={(e) => setFilterBank(e.target.value)}
                                            >
                                                <option value="">All Banks</option>
                                                {banks.map((bank) => (
                                                    <option key={bank.id} value={bank.id}>
                                                        {bank.name}
                                                    </option>
                                                ))}
                                            </Input>
                                        </Col>

                                        <Col md={3}>
                                            <Label>Created By</Label>
                                            <Input
                                                type="select"
                                                value={filterCreatedBy}
                                                onChange={(e) => setFilterCreatedBy(e.target.value)}
                                            >
                                                <option value="">All Users</option>
                                                {users.map((user) => (
                                                    <option key={user.id} value={user.id}>
                                                        {user.name || user.username}
                                                    </option>
                                                ))}
                                            </Input>
                                        </Col>

                                        <Col md={2}>
                                            <Label>Start Date</Label>
                                            <Input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                            />
                                        </Col>

                                        <Col md={2}>
                                            <Label>End Date</Label>
                                            <Input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                            />
                                        </Col>

                                        <Col md={2} className="d-flex align-items-end gap-2">
                                            <Button
                                                color="primary"
                                                onClick={handleApplyFilter}
                                            >
                                                Filter
                                            </Button>

                                            <Button
                                                color="warning"
                                                onClick={handleClearFilter}
                                            >
                                                Clear
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
                                                    {receipts.length > 0 ? (
                                                        receipts.map((item, index) => (
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
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="11" className="text-center">
                                                                No receipts found
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </Table>

                                            <Paginations
                                                perPageData={perPageData}
                                                data={{ length: totalCount }}
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

                                    <Modal
                                        isOpen={modalOpen}
                                        toggle={() => setModalOpen(!modalOpen)}
                                        size="lg"
                                    >
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
                                                                    value={formData.payment_receipt || ""}
                                                                    disabled
                                                                />
                                                            </div>
                                                        </Col>

                                                        <Col md={4}>
                                                            <div className="mb-3">
                                                                <Label>Orders</Label>
                                                                <AsyncSelect
                                                                    cacheOptions
                                                                    defaultOptions
                                                                    loadOptions={loadOrders}
                                                                    value={
                                                                        selectedOrderId
                                                                            ? {
                                                                                value: selectedOrderId,
                                                                                label: selectedReceipt?.order_name
                                                                            }
                                                                            : null
                                                                    }
                                                                    onChange={(opt) => setSelectedOrderId(opt?.value || "")}
                                                                    placeholder="Search Order (Invoice / Customer)"
                                                                    isClearable
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
                                                                    value={formData.bank || ""}
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
                                                                    value={formData.amount || ""}
                                                                    onChange={handleChange}
                                                                />
                                                            </div>
                                                        </Col>

                                                        <Col md={4}>
                                                            <div className="mb-3">
                                                                <Label>Transaction ID</Label>
                                                                <Input
                                                                    type="text"
                                                                    name="transactionID"
                                                                    value={formData.transactionID || ""}
                                                                    onChange={handleChange}
                                                                />
                                                            </div>
                                                        </Col>

                                                        <Col md={4}>
                                                            <div className="mb-3">
                                                                <Label>Received At</Label>
                                                                <Input
                                                                    type="date"
                                                                    name="received_at"
                                                                    value={formData.received_at || ""}
                                                                    onChange={handleChange}
                                                                />
                                                            </div>
                                                        </Col>
                                                    </Row>

                                                    <Row>
                                                        <Col md={4}>
                                                            <div className="mb-3">
                                                                <Label>Customer Name</Label>
                                                                <AsyncSelect
                                                                    cacheOptions
                                                                    defaultOptions
                                                                    loadOptions={loadCustomers}
                                                                    value={selectedCustomer}
                                                                    onChange={(opt) => setSelectedCustomer(opt)}
                                                                    placeholder="Search Customer (Name / Phone / Email)"
                                                                    isClearable
                                                                    menuPortalTarget={document.body}
                                                                    styles={rsStyles}
                                                                />
                                                            </div>
                                                        </Col>

                                                        <Col md={4}>
                                                            <div className="mb-3">
                                                                <Label>Remark</Label>
                                                                <Input
                                                                    type="text"
                                                                    name="remark"
                                                                    value={formData.remark || ""}
                                                                    onChange={handleChange}
                                                                />
                                                            </div>
                                                        </Col>

                                                        <Col md={4}>
                                                            <div className="mb-3">
                                                                <Label>Created By</Label>
                                                                <Input
                                                                    type="text"
                                                                    value={formData.created_by_name || ""}
                                                                    disabled
                                                                />
                                                            </div>
                                                        </Col>
                                                    </Row>
                                                </>
                                            )}
                                        </ModalBody>

                                        <ModalFooter>
                                            <Button
                                                color="primary"
                                                onClick={handleUpdate}
                                            >
                                                Update Receipt
                                            </Button>

                                            <Button
                                                color="secondary"
                                                onClick={() => setModalOpen(false)}
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
    );
};

export default OrderReceiptList;