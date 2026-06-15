import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    Table,
    Row,
    Col,
    Card,
    CardBody,
    Button,
    Input,
    FormGroup,
    Badge,
    Spinner,
} from "reactstrap";
import * as XLSX from "xlsx";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Paginations from "../../components/Common/Pagination";

const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
};

const BasicTable = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    const [staffFilter, setStaffFilter] = useState("");
    const [familyFilter, setFamilyFilter] = useState("");
    const [stateFilter, setStateFilter] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const getTodayDate = () => new Date().toISOString().split("T")[0];

    const [startDate, setStartDate] = useState(getTodayDate());
    const [endDate, setEndDate] = useState(getTodayDate());
    const [statusFilter, setStatusFilter] = useState("");
    const [codStatusFilter, setCodStatusFilter] = useState("");
    const [paymentMethodFilter, setPaymentMethodFilter] = useState("");
    const [invoiceFilter, setInvoiceFilter] = useState("");

    const [allStaffs, setAllStaffs] = useState([]);
    const [allFamilies, setAllFamilies] = useState([]);
    const [states, setStates] = useState([]);

    const [currentPage, setCurrentPage] = useState(1);
    const [showMoreFilters, setShowMoreFilters] = useState(false);

    const token = localStorage.getItem("token");
    const role = localStorage.getItem("active");
    const perPageData = 10;

    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const formatAmount = (value) => {
        const num = Number(value || 0);

        if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
        if (num >= 100000) return `₹${(num / 100000).toFixed(2)} Lakh`;
        if (num >= 1000) return `₹${(num / 1000).toFixed(2)}k`;

        return `₹${num.toFixed(2)}`;
    };

    useEffect(() => {
        fetchStaffs();
        fetchFamilies();
        fetchStates();
    }, []);

    useEffect(() => {
        fetchData();
        setCurrentPage(1);
    }, [
        staffFilter,
        familyFilter,
        stateFilter,
        startDate,
        endDate,
        statusFilter,
        codStatusFilter,
        paymentMethodFilter,
        invoiceFilter,
        debouncedSearchTerm,
    ]);

    const fetchStaffs = () => {
        axios
            .get(`${import.meta.env.VITE_APP_KEY}staffs/`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((response) => {
                setAllStaffs(response.data.data || []);
            })
            .catch(() => {
                toast.error("There was an error fetching staff data!");
            });
    };

    const fetchFamilies = () => {
        axios
            .get(`${import.meta.env.VITE_APP_KEY}familys/`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((response) => {
                setAllFamilies(response.data.data || []);
            })
            .catch(() => {
                toast.error("There was an error fetching family data!");
            });
    };

    const fetchStates = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_APP_KEY}states/`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const result = await response.json();

            if (result.message === "State list successfully retrieved") {
                setStates(result.data || []);
            } else {
                toast.error("Failed to fetch states");
            }
        } catch (error) {
            toast.error("Error fetching states");
        }
    };

    const fetchData = () => {
        setLoading(true);

        axios
            .get(`${import.meta.env.VITE_APP_KEY}COD/sales/`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    staff: staffFilter,
                    family: familyFilter,
                    state: stateFilter,
                    start_date: startDate,
                    end_date: endDate,
                    status: statusFilter,
                    cod_status: codStatusFilter,
                    payment_method: paymentMethodFilter,
                    invoice: invoiceFilter,
                    search: debouncedSearchTerm,
                },
            })
            .then((response) => {
                setData(response.data || []);
                setLoading(false);
            })
            .catch(() => {
                toast.error("There was an error fetching the data!");
                setLoading(false);
            });
    };

    const resetFilters = () => {
        setStaffFilter("");
        setFamilyFilter("");
        setStateFilter("");
        setSearchTerm("");
        setStartDate(getTodayDate());
        setEndDate(getTodayDate());
        setStatusFilter("");
        setCodStatusFilter("");
        setPaymentMethodFilter("");
        setInvoiceFilter("");
        setCurrentPage(1);
    };

    const filteredData = useMemo(() => {
        return data
            .map((item) => {
                const filteredOrders = item.orders.filter((order) => {
                    return !(role === "CSO" && order.family_name === "bepocart");
                });

                return filteredOrders.length > 0
                    ? { ...item, orders: filteredOrders }
                    : null;
            })
            .filter(Boolean);
    }, [data, role]);

    const totals = useMemo(() => {
        const totalOrders = filteredData.reduce(
            (sum, item) => sum + item.orders.length,
            0
        );

        const totalAmount = filteredData.reduce(
            (sum, item) =>
                sum +
                item.orders.reduce(
                    (acc, order) => acc + Number(order.total_amount || 0),
                    0
                ),
            0
        );

        const totalPaid = filteredData.reduce(
            (sum, item) =>
                sum +
                item.orders.reduce(
                    (acc, order) => acc + Number(order.total_paid_amount || 0),
                    0
                ),
            0
        );

        const totalPending = filteredData.reduce(
            (sum, item) =>
                sum +
                item.orders.reduce(
                    (acc, order) => acc + Number(order.balance_amount || 0),
                    0
                ),
            0
        );

        return {
            totalOrders,
            totalAmount,
            totalPaid,
            totalPending,
        };
    }, [filteredData]);

    const exportToExcel = () => {
        const excelData = filteredData.map((item, index) => {
            const totalAmount = item.orders.reduce(
                (sum, order) => sum + Number(order.total_amount || 0),
                0
            );

            const paidAmount = item.orders.reduce(
                (sum, order) => sum + Number(order.total_paid_amount || 0),
                0
            );

            const pendingAmount = item.orders.reduce(
                (sum, order) => sum + Number(order.balance_amount || 0),
                0
            );

            return {
                No: index + 1,
                Date: item.date,
                "Total Orders": item.orders.length,
                "Total Amount": totalAmount.toFixed(2),
                "Paid Amount": paidAmount.toFixed(2),
                "Pending Amount": pendingAmount.toFixed(2),
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(workbook, worksheet, "COD Sales Report");
        XLSX.writeFile(workbook, "COD_Sales_Report.xlsx");
    };

    const indexOfLastItem = currentPage * perPageData;
    const indexOfFirstItem = indexOfLastItem - perPageData;
    const currentData = filteredData.slice(indexOfFirstItem, indexOfLastItem);

    const filteredStaffs = allStaffs.filter(
        (staff) =>
            !familyFilter ||
            String(staff.family) === String(familyFilter) ||
            String(staff.family_id) === String(familyFilter)
    );

    const KpiCard = ({ title, value, subtitle, icon, className }) => (
        <Card className={`border-0 shadow-sm h-100 ${className}`}>
            <CardBody>
                <div className="d-flex justify-content-between align-items-start">
                    <div>
                        <p className="text-muted mb-1 fw-semibold">{title}</p>
                        <h3 className="mb-1 fw-bold">{value}</h3>
                        <small className="text-muted">{subtitle}</small>
                    </div>
                    <div className="cod-icon-box">{icon}</div>
                </div>
            </CardBody>
        </Card>
    );

    return (
        <React.Fragment>
            <style>
                {`
          .cod-page {
            background: #f4f7fb;
            min-height: 100vh;
          }

          .cod-header-card {
            border: 0;
            border-radius: 18px;
            background: linear-gradient(135deg, #0f172a, #1e293b);
            color: #fff;
            box-shadow: 0 12px 30px rgba(15, 23, 42, 0.18);
          }

          .cod-header-card p {
            color: rgba(255,255,255,.75);
          }

          .cod-kpi-card {
            border-radius: 18px;
            transition: all .2s ease;
          }

          .cod-kpi-card:hover {
            transform: translateY(-3px);
          }

          .cod-icon-box {
            width: 46px;
            height: 46px;
            border-radius: 14px;
            background: #eef2ff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
          }

          .cod-filter-card,
          .cod-table-card {
            border: 0;
            border-radius: 18px;
            box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08);
          }

          .cod-filter-card label {
            font-size: 12px;
            color: #64748b;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: .04em;
          }

          .cod-filter-card .form-control,
          .cod-filter-card .form-select {
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            min-height: 42px;
          }

          .cod-table {
            border-collapse: separate;
            border-spacing: 0 10px;
          }

          .cod-table thead tr th {
            background: #0f172a;
            color: #fff;
            border: 0;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: .04em;
            padding: 14px;
          }

          .cod-table thead tr th:first-child {
            border-top-left-radius: 14px;
            border-bottom-left-radius: 14px;
          }

          .cod-table thead tr th:last-child {
            border-top-right-radius: 14px;
            border-bottom-right-radius: 14px;
          }

          .cod-table tbody tr {
            background: #fff;
            box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06);
          }

          .cod-table tbody tr td,
          .cod-table tbody tr th {
            border: 0;
            padding: 16px 14px;
            vertical-align: middle;
          }

          .cod-table tbody tr th:first-child,
          .cod-table tbody tr td:first-child {
            border-top-left-radius: 14px;
            border-bottom-left-radius: 14px;
          }

          .cod-table tbody tr td:last-child {
            border-top-right-radius: 14px;
            border-bottom-right-radius: 14px;
          }

          .cod-total-bar {
            background: #0f172a;
            color: #fff;
            border-radius: 16px;
            padding: 16px;
          }

          .cod-total-bar small {
            color: #cbd5e1;
          }

          .cod-empty {
            background: #fff;
            border-radius: 18px;
            padding: 40px;
            text-align: center;
            color: #64748b;
          }

          .btn {
            border-radius: 12px;
          }

          @media (max-width: 768px) {
            .cod-header-card h3 {
              font-size: 20px;
            }

            .cod-table {
              min-width: 850px;
            }
          }
        `}
            </style>

            <div className="page-content cod-page">
                <div className="container-fluid">

                    <Card className="cod-header-card mb-4">
                        <CardBody>
                            <Row className="align-items-center">
                                <Col md={8}>
                                    <h3 className="mb-2 fw-bold">COD Sales Report</h3>
                                    <p className="mb-0">
                                        Track daily COD orders, collection, paid amount and pending
                                        balance in one clean dashboard.
                                    </p>
                                </Col>

                                <Col md={4} className="text-md-end mt-3 mt-md-0">
                                    <Button color="light" onClick={exportToExcel}>
                                        <i className="bx bx-download me-1"></i>
                                        Export Excel
                                    </Button>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>

                    <Card className="cod-filter-card mb-4">
                        <CardBody>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <div>
                                    <h5 className="mb-1 fw-bold">Filters</h5>
                                    <small className="text-muted">
                                        Use filters to refine COD sales report data.
                                    </small>
                                </div>

                                <Button
                                    color="light"
                                    size="sm"
                                    onClick={() => setShowMoreFilters(!showMoreFilters)}
                                >
                                    {showMoreFilters ? "Hide Filters" : "More Filters"}
                                </Button>
                            </div>

                            <Row>
                                <Col lg={2} md={4} sm={6}>
                                    <FormGroup>
                                        <label>Start Date</label>
                                        <Input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                        />
                                    </FormGroup>
                                </Col>

                                <Col lg={2} md={4} sm={6}>
                                    <FormGroup>
                                        <label>End Date</label>
                                        <Input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                        />
                                    </FormGroup>
                                </Col>

                                <Col lg={3} md={4} sm={6}>
                                    <FormGroup>
                                        <label>Division</label>
                                        <Input
                                            type="select"
                                            value={familyFilter}
                                            onChange={(e) => {
                                                setFamilyFilter(e.target.value);
                                                setStaffFilter("");
                                            }}
                                        >
                                            <option value="">All Division</option>
                                            {allFamilies.map((family) => (
                                                <option key={family.id} value={family.id}>
                                                    {family.name}
                                                </option>
                                            ))}
                                        </Input>
                                    </FormGroup>
                                </Col>

                                <Col lg={3} md={4} sm={6}>
                                    <FormGroup>
                                        <label>Staff</label>
                                        <Input
                                            type="select"
                                            value={staffFilter}
                                            onChange={(e) => setStaffFilter(e.target.value)}
                                        >
                                            <option value="">All Staff</option>
                                            {filteredStaffs.map((staff) => (
                                                <option key={staff.id} value={staff.id}>
                                                    {staff.name}
                                                </option>
                                            ))}
                                        </Input>
                                    </FormGroup>
                                </Col>

                                <Col lg={2} md={4} sm={6}>
                                    <FormGroup>
                                        <label>State</label>
                                        <Input
                                            type="select"
                                            value={stateFilter}
                                            onChange={(e) => setStateFilter(e.target.value)}
                                        >
                                            <option value="">All State</option>
                                            {states.map((state) => (
                                                <option key={state.id} value={state.id}>
                                                    {state.name}
                                                </option>
                                            ))}
                                        </Input>
                                    </FormGroup>
                                </Col>
                            </Row>

                            {showMoreFilters && (
                                <Row>
                                    <Col lg={3} md={4} sm={6}>
                                        <FormGroup>
                                            <label>Order Status</label>
                                            <Input
                                                type="select"
                                                value={statusFilter}
                                                onChange={(e) => setStatusFilter(e.target.value)}
                                            >
                                                <option value="">All Status</option>
                                                <option value="Pending">Pending</option>
                                                <option value="Approved">Approved</option>
                                                <option value="Shipped">Shipped</option>
                                                <option value="Invoice Created">Invoice Created</option>
                                                <option value="Invoice Approved">Invoice Approved</option>
                                                <option value="Waiting For Confirmation">
                                                    Waiting For Confirmation
                                                </option>
                                                <option value="To Print">To Print</option>
                                                <option value="Invoice Rejected">Invoice Rejected</option>
                                                <option value="Order Request by Warehouse">
                                                    Order Request by Warehouse
                                                </option>
                                                <option value="Processing">Processing</option>
                                                <option value="Completed">Completed</option>
                                                <option value="Cancelled">Cancelled</option>
                                                <option value="Refunded">Refunded</option>
                                                <option value="Rejected">Rejected</option>
                                                <option value="Return">Return</option>
                                                <option value="Packing under progress">
                                                    Packing under progress
                                                </option>
                                                <option value="Packed">Packed</option>
                                                <option value="Ready to ship">Ready to ship</option>
                                            </Input>
                                        </FormGroup>
                                    </Col>

                                    <Col lg={3} md={4} sm={6}>
                                        <FormGroup>
                                            <label>COD Status</label>
                                            <Input
                                                type="select"
                                                value={codStatusFilter}
                                                onChange={(e) => setCodStatusFilter(e.target.value)}
                                            >
                                                <option value="">All COD Status</option>
                                                <option value="FULL_COD">Full COD</option>
                                                <option value="PARTIAL_COD">Partial COD</option>
                                            </Input>
                                        </FormGroup>
                                    </Col>

                                    <Col lg={3} md={4} sm={6}>
                                        <FormGroup>
                                            <label>Payment Method</label>
                                            <Input
                                                type="select"
                                                value={paymentMethodFilter}
                                                onChange={(e) =>
                                                    setPaymentMethodFilter(e.target.value)
                                                }
                                            >
                                                <option value="">All Payment Method</option>
                                                <option value="Cash on Delivery (COD)">
                                                    Cash on Delivery
                                                </option>
                                                <option value="Bank Transfer">Bank Transfer</option>
                                                <option value="Net Banking">Net Banking</option>
                                                <option value="Credit Card">Credit Card</option>
                                                <option value="Debit Card">Debit Card</option>
                                                <option value="PayPal">PayPal</option>
                                                <option value="1 Razorpay">1 Razorpay</option>
                                            </Input>
                                        </FormGroup>
                                    </Col>

                                    <Col lg={3} md={4} sm={6}>
                                        <FormGroup>
                                            <label>Invoice</label>
                                            <Input
                                                type="text"
                                                placeholder="Search invoice"
                                                value={invoiceFilter}
                                                onChange={(e) => setInvoiceFilter(e.target.value)}
                                            />
                                        </FormGroup>
                                    </Col>
                                </Row>
                            )}

                            <Row className="align-items-end">
                                <Col lg={6} md={6}>
                                    <FormGroup className="mb-md-0">
                                        <label>Global Search</label>
                                        <Input
                                            type="text"
                                            placeholder="Search staff / division / customer"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </FormGroup>
                                </Col>

                                <Col lg={3} md={3} className="mt-3 mt-md-0">
                                    <Button
                                        color="secondary"
                                        outline
                                        className="w-100"
                                        onClick={resetFilters}
                                    >
                                        <i className="bx bx-refresh me-1"></i>
                                        Reset
                                    </Button>
                                </Col>

                                <Col lg={3} md={3} className="mt-3 mt-md-0">
                                    <Button color="success" className="w-100" onClick={exportToExcel}>
                                        <i className="bx bx-file me-1"></i>
                                        Export Excel
                                    </Button>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>

                    <Card className="cod-table-card">
                        <CardBody>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <div>
                                    <h5 className="mb-1 fw-bold">Daily COD Summary</h5>
                                    <small className="text-muted">
                                        Showing {currentData.length} of {filteredData.length} records
                                    </small>
                                </div>

                                <Badge color="primary" pill>
                                    {startDate} to {endDate}
                                </Badge>
                            </div>

                            {loading ? (
                                <div className="text-center py-5">
                                    <Spinner color="primary" />
                                    <p className="mt-3 mb-0 text-muted">Loading COD report...</p>
                                </div>
                            ) : currentData.length > 0 ? (
                                <>
                                    <div className="table-responsive">
                                        <Table className="cod-table mb-0">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Date</th>
                                                    <th>Total Orders</th>
                                                    <th>Total Amount</th>
                                                    <th>Paid Amount</th>
                                                    <th>Pending Amount</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {currentData.map((item, index) => {
                                                    const rowTotalAmount = item.orders.reduce(
                                                        (acc, order) =>
                                                            acc + Number(order.total_amount || 0),
                                                        0
                                                    );

                                                    const rowPaidAmount = item.orders.reduce(
                                                        (acc, order) =>
                                                            acc + Number(order.total_paid_amount || 0),
                                                        0
                                                    );

                                                    const rowPendingAmount = item.orders.reduce(
                                                        (acc, order) =>
                                                            acc + Number(order.balance_amount || 0),
                                                        0
                                                    );

                                                    return (
                                                        <tr key={index}>
                                                            <th>{indexOfFirstItem + index + 1}</th>

                                                            <td>
                                                                <div className="fw-bold">{item.date}</div>
                                                                <small className="text-muted">Report date</small>
                                                            </td>

                                                            <td>
                                                                <Badge color="info" pill>
                                                                    {item.orders.length} Orders
                                                                </Badge>
                                                            </td>

                                                            <td className="fw-bold">
                                                                {formatAmount(rowTotalAmount)}
                                                                <div>
                                                                    <small className="text-muted">
                                                                        ₹{rowTotalAmount.toFixed(2)}
                                                                    </small>
                                                                </div>
                                                            </td>

                                                            <td className="fw-bold text-success">
                                                                {formatAmount(rowPaidAmount)}
                                                                <div>
                                                                    <small className="text-muted">
                                                                        ₹{rowPaidAmount.toFixed(2)}
                                                                    </small>
                                                                </div>
                                                            </td>

                                                            <td className="fw-bold text-warning">
                                                                {formatAmount(rowPendingAmount)}
                                                                <div>
                                                                    <small className="text-muted">
                                                                        ₹{rowPendingAmount.toFixed(2)}
                                                                    </small>
                                                                </div>
                                                            </td>

                                                            <td>
                                                                <Button
                                                                    color="primary"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        window.location.href = `/COD/sales/resport/${item.date}/`;
                                                                    }}
                                                                >
                                                                    <i className="bx bx-show me-1"></i>
                                                                    View Report
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </Table>
                                    </div>

                                    <div className="cod-total-bar mt-4">
                                        <Row>
                                            <Col md={3} xs={6} className="mb-3 mb-md-0">
                                                <small>Total Orders</small>
                                                <h5 className="mb-0 text-white">{totals.totalOrders}</h5>
                                            </Col>

                                            <Col md={3} xs={6} className="mb-3 mb-md-0">
                                                <small>Total Amount</small>
                                                <h5 className="mb-0 text-white">
                                                    {formatAmount(totals.totalAmount)}
                                                </h5>
                                            </Col>

                                            <Col md={3} xs={6}>
                                                <small>Paid Amount</small>
                                                <h5 className="mb-0 text-white">
                                                    {formatAmount(totals.totalPaid)}
                                                </h5>
                                            </Col>

                                            <Col md={3} xs={6}>
                                                <small>Pending Amount</small>
                                                <h5 className="mb-0 text-white">
                                                    {formatAmount(totals.totalPending)}
                                                </h5>
                                            </Col>
                                        </Row>
                                    </div>

                                    <div className="mt-4">
                                        <Paginations
                                            perPageData={perPageData}
                                            data={filteredData}
                                            currentPage={currentPage}
                                            setCurrentPage={setCurrentPage}
                                            isShowingPageLength={true}
                                            paginationDiv="col-auto"
                                            paginationClass="pagination"
                                            indexOfFirstItem={indexOfFirstItem}
                                            indexOfLastItem={indexOfLastItem}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="cod-empty">
                                    <h5 className="fw-bold">No data found</h5>
                                    <p className="mb-0">
                                        Try changing the date range or clearing some filters.
                                    </p>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>
            </div>
        </React.Fragment>
    );
};

export default BasicTable;