import React, { useEffect, useState, useCallback } from "react";
import {
    Table,
    Row,
    Col,
    Card,
    CardBody,
    Label,
    Button,
    Input,
} from "reactstrap";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Breadcrumbs from "../../components/Common/Breadcrumb";

const BasicTable = () => {
    document.title = "GRV List | Beposoft";

    const token = localStorage.getItem("token");
    const apiBase = import.meta.env.VITE_APP_KEY;

    const [tableData, setTableData] = useState([]);
    const [loading, setLoading] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [nextPage, setNextPage] = useState(null);
    const [previousPage, setPreviousPage] = useState(null);
    const pageSize = 50;

    const [searchTerm, setSearchTerm] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [remarkFilter, setRemarkFilter] = useState("");
    const [returnReasonFilter, setReturnReasonFilter] = useState("");

    const [orders, setOrders] = useState([]);
    const [staffs, setStaffs] = useState([]);
    const [customers, setCustomers] = useState([]);

    const [orderSearch, setOrderSearch] = useState("");
    const [staffSearch, setStaffSearch] = useState("");
    const [customerSearch, setCustomerSearch] = useState("");

    const [selectedOrderId, setSelectedOrderId] = useState("");
    const [selectedStaffId, setSelectedStaffId] = useState("");
    const [selectedCustomerId, setSelectedCustomerId] = useState("");

    const [orderLoading, setOrderLoading] = useState(false);
    const [staffLoading, setStaffLoading] = useState(false);
    const [customerLoading, setCustomerLoading] = useState(false);

    const fetchOrderData = useCallback(async (search = "") => {
        try {
            setOrderLoading(true);

            const params = {};
            if (search.trim()) {
                params.search = search.trim();
            }

            const response = await axios.get(`${apiBase}orders/`, {
                headers: { Authorization: `Bearer ${token}` },
                params,
            });

            let orderList = [];
            if (response?.data?.results?.results) {
                orderList = response.data.results.results;
            } else if (response?.data?.results?.data) {
                orderList = response.data.results.data;
            } else if (Array.isArray(response?.data?.results)) {
                orderList = response.data.results;
            } else if (Array.isArray(response?.data?.data)) {
                orderList = response.data.data;
            }

            setOrders(orderList || []);
        } catch (error) {
            toast.error("Error fetching orders");
        } finally {
            setOrderLoading(false);
        }
    }, [apiBase, token]);

    const fetchStaffData = useCallback(async (search = "") => {
        try {
            setStaffLoading(true);

            const params = {};
            if (search.trim()) {
                params.search = search.trim();
            }

            const response = await axios.get(`${apiBase}get/staffs/`, {
                headers: { Authorization: `Bearer ${token}` },
                params,
            });

            let staffList = [];
            if (response?.data?.results?.data) {
                staffList = response.data.results.data;
            } else if (Array.isArray(response?.data?.data)) {
                staffList = response.data.data;
            } else if (Array.isArray(response?.data?.results)) {
                staffList = response.data.results;
            }

            setStaffs(staffList || []);
        } catch (error) {
            toast.error("Error fetching staffs");
        } finally {
            setStaffLoading(false);
        }
    }, [apiBase, token]);

    const fetchCustomers = useCallback(async (search = "") => {
        try {
            setCustomerLoading(true);

            const params = {};
            if (search.trim()) {
                params.search = search.trim();
            }

            const response = await axios.get(`${apiBase}customers/`, {
                headers: { Authorization: `Bearer ${token}` },
                params,
            });

            let customerList = [];
            if (Array.isArray(response?.data?.results)) {
                customerList = response.data.results;
            } else if (Array.isArray(response?.data?.data)) {
                customerList = response.data.data;
            }

            setCustomers(customerList || []);
        } catch (error) {
            toast.error("Error fetching customer data");
        } finally {
            setCustomerLoading(false);
        }
    }, [apiBase, token]);

    const fetchData = useCallback(async (page = 1) => {
        try {
            setLoading(true);

            const params = { page };

            if (searchTerm.trim()) params.search = searchTerm.trim();
            if (selectedOrderId) params.order = selectedOrderId;
            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;
            if (selectedStaffId) params.manage_staff = selectedStaffId;
            if (selectedCustomerId) params.customer = selectedCustomerId;
            if (statusFilter) params.status = statusFilter;
            if (remarkFilter) params.remark = remarkFilter;
            if (returnReasonFilter) params.returnreason = returnReasonFilter;

            const response = await axios.get(`${apiBase}get/grv/data/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                params,
            });

            const responseData = response?.data || {};
            const resultsBlock = responseData?.results || {};
            const listData = resultsBlock?.data || [];

            setTableData(listData);
            setTotalCount(responseData?.count || 0);
            setNextPage(responseData?.next || null);
            setPreviousPage(responseData?.previous || null);
            setCurrentPage(page);
        } catch (error) {
            setTableData([]);
            setTotalCount(0);
            setNextPage(null);
            setPreviousPage(null);

            if (error?.response?.status === 404) {
                toast.error("No GRV records found");
            } else {
                toast.error("Error fetching GRV data");
            }
        } finally {
            setLoading(false);
        }
    }, [
        apiBase,
        token,
        searchTerm,
        selectedOrderId,
        startDate,
        endDate,
        selectedStaffId,
        selectedCustomerId,
        statusFilter,
        remarkFilter,
        returnReasonFilter,
    ]);

    useEffect(() => {
        fetchData(1);
        fetchOrderData("");
        fetchStaffData("");
        fetchCustomers("");
    }, [fetchData, fetchOrderData, fetchStaffData, fetchCustomers]);

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            fetchOrderData(orderSearch);
        }, 400);

        return () => clearTimeout(delayDebounce);
    }, [orderSearch, fetchOrderData]);

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            fetchStaffData(staffSearch);
        }, 400);

        return () => clearTimeout(delayDebounce);
    }, [staffSearch, fetchStaffData]);

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            fetchCustomers(customerSearch);
        }, 400);

        return () => clearTimeout(delayDebounce);
    }, [customerSearch, fetchCustomers]);

    const handleApplyFilters = () => {
        fetchData(1);
    };

    const handleClearFilters = () => {
        setSearchTerm("");
        setOrderSearch("");
        setSelectedOrderId("");
        setStartDate("");
        setEndDate("");
        setStatusFilter("");
        setRemarkFilter("");
        setReturnReasonFilter("");
        setStaffSearch("");
        setCustomerSearch("");
        setSelectedStaffId("");
        setSelectedCustomerId("");
        fetchData(1);
        fetchOrderData("");
        fetchStaffData("");
        fetchCustomers("");
    };

    const handlePageChange = (page) => {
        fetchData(page);
    };

    const handleChange = async (id, field, value) => {
        try {
            const data = {
                [field]: value,
            };

            const response = await axios.put(`${apiBase}grv/update/${id}/`, data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data) {
                const updatedData = tableData.map((item) =>
                    item.id === id ? { ...item, [field]: value } : item
                );
                setTableData(updatedData);
            }
        } catch (error) {
            toast.error("Error updating data");
        }
    };

    const getStatusTextClass = (status) => {
        switch (status) {
            case "pending":
                return "text-warning";
            case "approved":
                return "text-success";
            case "rejected":
                return "text-danger";
            case "Waiting For Approval":
                return "text-primary";
            default:
                return "";
        }
    };

    const getRemarkTextClass = (remark) => {
        switch (remark) {
            case "return":
                return "text-info";
            case "refund":
                return "text-secondary";
            case "exchange":
                return "text-primary";
            case "cod_return":
                return "text-warning";
            default:
                return "";
        }
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <React.Fragment>
            <style>{`
                .grv-filter-label {
                    font-size: 14px;
                    font-weight: 500;
                    color: #344054;
                    margin-bottom: 8px;
                    display: inline-block;
                }

                .grv-filter-input {
                    background: #ffffff !important;
                    border: 1px solid #cfd4dc !important;
                    border-radius: 8px !important;
                    min-height: 40px !important;
                    height: 40px !important;
                    padding: 8px 12px !important;
                    font-size: 14px !important;
                    color: #344054 !important;
                    box-shadow: none !important;
                }

                .grv-filter-input:focus {
                    border-color: #b8c3f5 !important;
                    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.10) !important;
                    outline: none !important;
                }

                .grv-filter-select,
                .grv-table-select {
                    appearance: none !important;
                    -webkit-appearance: none !important;
                    -moz-appearance: none !important;
                    background-color: #ffffff !important;
                    border: 1px solid #cfd4dc !important;
                    border-radius: 8px !important;
                    min-height: 40px !important;
                    height: 40px !important;
                    padding: 8px 38px 8px 14px !important;
                    font-size: 14px !important;
                    color: #344054 !important;
                    box-shadow: none !important;
                    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%23555' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>");
                    background-repeat: no-repeat !important;
                    background-position: right 12px center !important;
                    background-size: 16px !important;
                    cursor: pointer;
                }

                .grv-filter-select:focus,
                .grv-table-select:focus {
                    border-color: #b8c3f5 !important;
                    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.10) !important;
                    outline: none !important;
                }

                .grv-filter-select:hover,
                .grv-table-select:hover,
                .grv-filter-input:hover {
                    border-color: #bcc5d3 !important;
                }

                .grv-table-select {
                    width: 100%;
                    min-width: 150px;
                }

                .grv-search-dropdown {
                    position: absolute;
                    top: calc(100% + 6px);
                    left: 0;
                    width: 100%;
                    max-height: 220px;
                    overflow-y: auto;
                    z-index: 9999;
                    background-color: #fff;
                    border: 1px solid #cfd4dc;
                    border-radius: 8px;
                    box-shadow: 0 10px 24px rgba(16, 24, 40, 0.10);
                }

                .grv-search-option {
                    padding: 10px 12px;
                    cursor: pointer;
                    font-size: 14px;
                    color: #344054;
                    border-bottom: 1px solid #f2f4f7;
                    background: #fff;
                }

                .grv-search-option:last-child {
                    border-bottom: none;
                }

                .grv-search-option:hover {
                    background: #f5f8ff;
                }

                .grv-search-empty {
                    padding: 10px 12px;
                    font-size: 14px;
                    color: #667085;
                    background: #fff;
                }

                .grv-table-select.text-warning {
                    color: #d97706 !important;
                    font-weight: 500;
                }

                .grv-table-select.text-success {
                    color: #16a34a !important;
                    font-weight: 500;
                }

                .grv-table-select.text-danger {
                    color: #dc2626 !important;
                    font-weight: 500;
                }

                .grv-table-select.text-primary {
                    color: #2563eb !important;
                    font-weight: 500;
                }

                .grv-table-select.text-info {
                    color: #0891b2 !important;
                    font-weight: 500;
                }

                .grv-table-select.text-secondary {
                    color: #6b7280 !important;
                    font-weight: 500;
                }

                .grv-search-subtext {
                    display: block;
                    font-size: 12px;
                    color: #667085;
                    margin-top: 2px;
                }
            `}</style>

            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Tables" breadcrumbItem="GRV LIST" />
                    <ToastContainer />

                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <div className="table-responsive">
                                        <Row className="mb-3">
                                            <Col md={3} className="mb-3">
                                                <Label className="grv-filter-label">Search</Label>
                                                <Input
                                                    type="text"
                                                    className="grv-filter-input"
                                                    placeholder="Search by remark, price, return reason, product"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                            </Col>

                                            <Col md={3} className="mb-3" style={{ position: "relative" }}>
                                                <Label className="grv-filter-label">Order / Invoice</Label>
                                                <Input
                                                    type="text"
                                                    className="grv-filter-input"
                                                    placeholder="Type invoice or customer..."
                                                    value={orderSearch}
                                                    onChange={(e) => {
                                                        setOrderSearch(e.target.value);
                                                        setSelectedOrderId("");
                                                    }}
                                                />

                                                {orderSearch && (
                                                    <div
                                                        className="grv-search-dropdown"
                                                        onMouseDown={(e) => e.preventDefault()}
                                                    >
                                                        {orderLoading ? (
                                                            <div className="grv-search-empty">Loading...</div>
                                                        ) : orders.length > 0 ? (
                                                            orders.map((order) => (
                                                                <div
                                                                    key={order.id}
                                                                    className="grv-search-option"
                                                                    onMouseDown={() => {
                                                                        setOrderSearch(order.invoice || "");
                                                                        setSelectedOrderId(order.id);
                                                                    }}
                                                                >
                                                                    <strong>{order.invoice || "No Invoice"}</strong>
                                                                    <span className="grv-search-subtext">
                                                                        {order?.customer?.name || "No Customer"}
                                                                    </span>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="grv-search-empty">No order found</div>
                                                        )}
                                                    </div>
                                                )}
                                            </Col>

                                            <Col md={3} className="mb-3">
                                                <Label className="grv-filter-label">From Date</Label>
                                                <Input
                                                    type="date"
                                                    className="grv-filter-input"
                                                    value={startDate}
                                                    onChange={(e) => setStartDate(e.target.value)}
                                                />
                                            </Col>

                                            <Col md={3} className="mb-3">
                                                <Label className="grv-filter-label">To Date</Label>
                                                <Input
                                                    type="date"
                                                    className="grv-filter-input"
                                                    value={endDate}
                                                    onChange={(e) => setEndDate(e.target.value)}
                                                />
                                            </Col>

                                            <Col md={3} className="mb-3" style={{ position: "relative" }}>
                                                <Label className="grv-filter-label">Invoice Created By</Label>
                                                <Input
                                                    type="text"
                                                    className="grv-filter-input"
                                                    placeholder="Type staff name..."
                                                    value={staffSearch}
                                                    onChange={(e) => {
                                                        setStaffSearch(e.target.value);
                                                        setSelectedStaffId("");
                                                    }}
                                                />

                                                {staffSearch && (
                                                    <div
                                                        className="grv-search-dropdown"
                                                        onMouseDown={(e) => e.preventDefault()}
                                                    >
                                                        {staffLoading ? (
                                                            <div className="grv-search-empty">Loading...</div>
                                                        ) : staffs.length > 0 ? (
                                                            staffs.map((staff) => (
                                                                <div
                                                                    key={staff.id}
                                                                    className="grv-search-option"
                                                                    onMouseDown={() => {
                                                                        setStaffSearch(staff.name);
                                                                        setSelectedStaffId(staff.id);
                                                                    }}
                                                                >
                                                                    {staff.name} ({staff.designation})
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="grv-search-empty">No staff found</div>
                                                        )}
                                                    </div>
                                                )}
                                            </Col>

                                            <Col md={3} className="mb-3" style={{ position: "relative" }}>
                                                <Label className="grv-filter-label">Customer</Label>
                                                <Input
                                                    type="text"
                                                    className="grv-filter-input"
                                                    placeholder="Type customer name or phone..."
                                                    value={customerSearch}
                                                    onChange={(e) => {
                                                        setCustomerSearch(e.target.value);
                                                        setSelectedCustomerId("");
                                                    }}
                                                />

                                                {customerSearch && (
                                                    <div
                                                        className="grv-search-dropdown"
                                                        onMouseDown={(e) => e.preventDefault()}
                                                    >
                                                        {customerLoading ? (
                                                            <div className="grv-search-empty">Loading...</div>
                                                        ) : customers.length > 0 ? (
                                                            customers.map((customer) => (
                                                                <div
                                                                    key={customer.id}
                                                                    className="grv-search-option"
                                                                    onMouseDown={() => {
                                                                        setCustomerSearch(customer.name);
                                                                        setSelectedCustomerId(customer.id);
                                                                    }}
                                                                >
                                                                    <strong>{customer.name}</strong>
                                                                    <br />
                                                                    <small className="text-muted">
                                                                        {customer.phone} · {customer.state_name}
                                                                    </small>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="grv-search-empty">No customer found</div>
                                                        )}
                                                    </div>
                                                )}
                                            </Col>

                                            <Col md={2} className="mb-3">
                                                <Label className="grv-filter-label">Status</Label>
                                                <Input
                                                    type="select"
                                                    className="grv-filter-select"
                                                    value={statusFilter}
                                                    onChange={(e) => setStatusFilter(e.target.value)}
                                                >
                                                    <option value="">All Status</option>
                                                    <option value="pending">Pending</option>
                                                    <option value="approved">Approved</option>
                                                    <option value="rejected">Rejected</option>
                                                    <option value="Waiting For Approval">Waiting For Approval</option>
                                                </Input>
                                            </Col>

                                            <Col md={2} className="mb-3">
                                                <Label className="grv-filter-label">Remark</Label>
                                                <Input
                                                    type="select"
                                                    className="grv-filter-select"
                                                    value={remarkFilter}
                                                    onChange={(e) => setRemarkFilter(e.target.value)}
                                                >
                                                    <option value="">All Remark</option>
                                                    <option value="return">Return</option>
                                                    <option value="refund">Refund</option>
                                                    <option value="exchange">Exchange</option>
                                                    <option value="cod_return">COD Return</option>
                                                </Input>
                                            </Col>

                                            <Col md={2} className="mb-3">
                                                <Label className="grv-filter-label">Return Reason</Label>
                                                <Input
                                                    type="select"
                                                    className="grv-filter-select"
                                                    value={returnReasonFilter}
                                                    onChange={(e) => setReturnReasonFilter(e.target.value)}
                                                >
                                                    <option value="">All Condition</option>
                                                    <option value="damaged">Damaged</option>
                                                    <option value="partially_damaged">Partially Damaged</option>
                                                    <option value="usable">Usable</option>
                                                </Input>
                                            </Col>

                                            <Col md={3} className="mb-3 d-flex align-items-end gap-2">
                                                <Button color="primary" onClick={handleApplyFilters}>
                                                    Apply Filter
                                                </Button>
                                                <Button color="secondary" onClick={handleClearFilters}>
                                                    Clear
                                                </Button>
                                            </Col>
                                        </Row>

                                        <Table className="table table-bordered mb-0 custom-table">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>NO</th>
                                                    <th>Product / Invoice / Amount</th>
                                                    <th>Condition</th>
                                                    <th>QTY</th>
                                                    <th>Price</th>
                                                    <th>COD Amount</th>
                                                    <th>Invoice Created By</th>
                                                    <th>Customer</th>
                                                    <th>Description</th>
                                                    <th>Invoice Delivered</th>
                                                    <th>Remark</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {loading ? (
                                                    <tr>
                                                        <td colSpan="12" className="text-center">
                                                            Loading...
                                                        </td>
                                                    </tr>
                                                ) : tableData.length > 0 ? (
                                                    tableData.map((item, index) => (
                                                        <tr key={item.id}>
                                                            <th scope="row">
                                                                {(currentPage - 1) * pageSize + index + 1}
                                                            </th>
                                                            <td>{item.product} / {item.invoice} / {item.price}</td>
                                                            <td>{item.returnreason}</td>
                                                            <td>{item.quantity}</td>
                                                            <td>{item.price}</td>
                                                            <td>{item.cod_amount || "--"}</td>
                                                            <td>{item.staff}</td>
                                                            <td>{item.customer}</td>
                                                            <td>{item.note || "N/A"}</td>
                                                            <td>{item.order_date}</td>
                                                            <td>
                                                                <select
                                                                    className={`grv-table-select ${getRemarkTextClass(item.remark)}`}
                                                                    value={item.remark || ""}
                                                                    onChange={(e) =>
                                                                        handleChange(item.id, "remark", e.target.value)
                                                                    }
                                                                >
                                                                    <option value="return">Return</option>
                                                                    <option value="refund">Refund</option>
                                                                    <option value="exchange">Exchange</option>
                                                                    <option value="cod_return">COD Return</option>
                                                                </select>
                                                            </td>
                                                            <td>
                                                                <select
                                                                    className={`grv-table-select ${getStatusTextClass(item.status)}`}
                                                                    value={item.status || ""}
                                                                    onChange={(e) =>
                                                                        handleChange(item.id, "status", e.target.value)
                                                                    }
                                                                >
                                                                    <option value="pending">Pending</option>
                                                                    <option value="approved">Approved</option>
                                                                    <option value="rejected">Reject</option>
                                                                    <option value="Waiting For Approval">Waiting For Approval</option>
                                                                </select>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="12" className="text-center">
                                                            No data available
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </Table>

                                        <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap">
                                            <div>
                                                <strong>Total:</strong> {totalCount}
                                            </div>

                                            <div className="d-flex align-items-center gap-2">
                                                <Button
                                                    color="secondary"
                                                    size="sm"
                                                    disabled={!previousPage || currentPage === 1}
                                                    onClick={() => handlePageChange(currentPage - 1)}
                                                >
                                                    Previous
                                                </Button>

                                                <span>
                                                    Page {currentPage} of {totalPages || 1}
                                                </span>

                                                <Button
                                                    color="secondary"
                                                    size="sm"
                                                    disabled={!nextPage || currentPage === totalPages}
                                                    onClick={() => handlePageChange(currentPage + 1)}
                                                >
                                                    Next
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </div>
        </React.Fragment>
    );
};

export default BasicTable;