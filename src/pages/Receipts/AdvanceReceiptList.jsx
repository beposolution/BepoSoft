import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { Card, Col, Container, Row, CardBody, CardTitle, Table, Spinner, Input, Modal, ModalHeader, ModalBody, Label, ModalFooter, Button } from "reactstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Paginations from '../../components/Common/Pagination';
import Select from "react-select";


const AdvanceReceiptList = () => {
    const [receipts, setReceipts] = useState([])
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem("token")
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [formData, setFormData] = useState({ bank: '', amount: '', order: '' });
    const [customerId, setCustomerId] = useState('')
    const [modalLoading, setModalLoading] = useState(false);
    const [banks, setBanks] = useState([]);
    const [customer, setCustomer] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const perPageData = 10;
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [beforeSnapshot, setBeforeSnapshot] = useState(null);
    const [orders, setOrders] = useState([]);

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

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}orders/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (response?.status === 200) {
                    setOrders(response?.data?.results || []);
                }
            } catch (error) {
                toast.error("Error fetching orders");
            }
        };
        fetchOrders();
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

            setBeforeSnapshot(pickFields({
                payment_receipt: data.payment_receipt,
                bank: data.bank,
                amount: data.amount,
                transactionID: data.transactionID,
                received_at: data.received_at,
                customer: data.customer,
                remark: data.remark,
            }));
        } catch (error) {
            toast.error("Error fetching receipt details:");
        } finally {
            setModalLoading(false);
        }
    };

    const handleUpdate = async () => {
        try {
            let shouldDeleteOriginal = false;
            let convertMode = null;

            // If order is selected → convert Advance Receipt → Order Receipt
            if (formData.order) {
                const response = await axios.post(
                    `${import.meta.env.VITE_APP_KEY}payment/${formData.order}/reciept/`,
                    {
                        bank: formData.bank,
                        amount: formData.amount,
                        received_at: formData.received_at,
                        transactionID: formData.transactionID,
                        remark: formData.remark,
                    },
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                if (response.status === 200 || response.status === 201) {
                    toast.success("Converted to Order Receipt successfully!");
                    convertMode = "toOrder";
                    shouldDeleteOriginal = true;

                    // Log changes
                    const afterSnapshot = pickFields({
                        ...formData,
                        order: formData.order,
                    });
                    const { before_data, after_data } = computeDiff(beforeSnapshot, afterSnapshot);
                    if (Object.keys(before_data).length > 0) {
                        await axios.post(
                            `${import.meta.env.VITE_APP_KEY}datalog/create/`,
                            { before_data, after_data },
                            {
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                    "Content-Type": "application/json",
                                },
                            }
                        );
                    }
                }
            } else {
                // Normal update
                const payload = {
                    payment_receipt: formData.payment_receipt,
                    bank: formData.bank,
                    amount: formData.amount,
                    transactionID: formData.transactionID,
                    received_at: formData.received_at,
                    customer: customerId,
                    remark: formData.remark,
                    created_by: selectedReceipt.created_by,
                };

                const resp = await axios.put(
                    `${import.meta.env.VITE_APP_KEY}advancereceipt/view/${selectedReceipt.id}/`,
                    payload,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (resp.status === 200 || resp.status === 204) {
                    toast.success("Receipt updated successfully!");
                    const afterSnapshot = pickFields(payload);
                    const { before_data, after_data } = computeDiff(beforeSnapshot, afterSnapshot);
                    if (Object.keys(before_data).length > 0) {
                        await axios.post(
                            `${import.meta.env.VITE_APP_KEY}datalog/create/`,
                            { before_data, after_data },
                            {
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                    "Content-Type": "application/json",
                                },
                            }
                        );
                    }
                }
            }

            // If conversion succeeded, delete the original Advance Receipt
            if (shouldDeleteOriginal && selectedReceipt?.id) {
                await axios.delete(
                    `${import.meta.env.VITE_APP_KEY}advancereceipt/view/${selectedReceipt.id}/`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                toast.success("Original Advance Receipt deleted.");
            }

            setModalOpen(false);
            fetchReceiptData();
        } catch (error) {
            console.error("Error updating receipt:", error);
            toast.error("Failed to update receipt.");
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // fields we care about comparing / logging
    const RECEIPT_FIELDS = [
        "payment_receipt",
        "bank",
        "amount",
        "transactionID",
        "received_at",
        "customer",
        "remark",
    ];

    /** Safely normalize values for comparison (trim strings, keep null as null) */
    const norm = (v) => {
        if (v === undefined) return null;
        if (typeof v === "string") return v.trim();
        return v;
    };

    /** Pick only fields we care about */
    const pickFields = (obj) => {
        const out = {};
        RECEIPT_FIELDS.forEach((k) => {
            if (obj && Object.prototype.hasOwnProperty.call(obj, k)) {
                out[k] = obj[k];
            }
        });
        return out;
    };

    /** Compute {before_data, after_data} with only changed keys */
    const computeDiff = (prev, next) => {
        const before_data = {};
        const after_data = {};

        RECEIPT_FIELDS.forEach((k) => {
            const a = norm(prev?.[k]);
            const b = norm(next?.[k]);
            // compare loosely but safely (stringify numbers so 10 vs "10" doesn't log noise)
            const sa = a === null ? null : String(a);
            const sb = b === null ? null : String(b);
            if (sa !== sb) {
                before_data[k] = prev?.[k] ?? null;
                after_data[k] = next?.[k] ?? null;
            }
        });

        return { before_data, after_data };
    };

    const filteredReceipts = receipts.filter((item) => {
        const matchesSearch =
            (item.payment_receipt || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.transactionID || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.customer_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.bank_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.created_by_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.remark || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(item.amount ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            Number(item.amount || 0).toFixed(2).includes(searchTerm);

        const itemDate = new Date(item.received_at);
        const isAfterStart = startDate ? itemDate >= new Date(startDate) : true;
        const isBeforeEnd = endDate ? itemDate <= new Date(endDate) : true;

        return matchesSearch && isAfterStart && isBeforeEnd;
    });

    // put near your other state/constants
    const rsStyles = {
        menuPortal: base => ({ ...base, zIndex: 9999 }),
        menu: base => ({ ...base, zIndex: 9999, backgroundColor: "#fff" }),
        menuList: base => ({ ...base, backgroundColor: "#fff" }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isFocused ? "#eef5ff" : "#fff",
            color: "#212529",
            cursor: "pointer",
        }),
        control: base => ({ ...base, minHeight: 38 }),
    };

    // turn customers into react-select options
    const customerOptions = customer.map(c => ({
        value: String(c.id),
        label: c.name,
    }));

    const indexOfLastItem = currentPage * perPageData;
    const indexOfFirstItem = indexOfLastItem - perPageData;
    const currentReceipts = filteredReceipts.slice(indexOfFirstItem, indexOfLastItem);

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
                                    <Row className="mb-3">
                                        <Col>
                                            <Label>Search</Label>
                                            <Input
                                                type="text"
                                                placeholder="Search by Receipt, Amount, Transaction ID, Customer, Bank, Remark, Created By"
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
                                            Advance Receipt Details
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
                                                        <Col md={4}>
                                                            <div className="mb-3">
                                                                <Label>Customer Name</Label>
                                                                <Select
                                                                    options={customerOptions}
                                                                    value={customerOptions.find(o => o.value === String(customerId)) || null}
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
                                                                <Label>Select Order</Label>
                                                                <Select
                                                                    options={orders.map(o => ({
                                                                        value: String(o.id),
                                                                        label: `${o.invoice} - ${o.customer?.name || ''} - ₹${o.total_amount || 0}`,
                                                                    }))}
                                                                    value={
                                                                        formData.order
                                                                            ? {
                                                                                label: `${orders.find(o => o.id === Number(formData.order))?.invoice || ''} - ${orders.find(o => o.id === Number(formData.order))?.customer?.name || ''} - ₹${orders.find(o => o.id === Number(formData.order))?.total_amount || 0}`,
                                                                                value: String(formData.order),
                                                                            }
                                                                            : null
                                                                    }
                                                                    onChange={(opt) =>
                                                                        setFormData((prev) => ({
                                                                            ...prev,
                                                                            order: opt?.value || '',
                                                                        }))
                                                                    }
                                                                    placeholder="Choose Order"
                                                                    isClearable
                                                                    isSearchable
                                                                    menuPortalTarget={document.body}
                                                                    styles={rsStyles}
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