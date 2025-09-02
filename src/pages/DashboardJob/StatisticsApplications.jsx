import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Row, Col, Card, CardBody, Input, Button, Modal, ModalHeader, ModalBody } from "reactstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

const StatisticsApplications = () => {
    const token = localStorage.getItem("token")
    const [role, setRole] = useState(null)
    const [orders, setOrders] = useState([]);
    const [familyOrders, setFamilyOrders] = useState([]);
    const [familyOrders2, setFamilyOrders2] = useState([]);
    const [internalTransfers, setInternalTransfers] = useState([]);
    const [bankmodule, setBankModule] = useState([]);
    const todayDate = new Date().toISOString().split('T')[0];
    const [warehouseData, setWarehouseData] = useState([]);
    const [expense, setExpense] = useState([])
    const [filteredData, setFilteredData] = useState([]);
    const navigate = useNavigate();
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [selectedExpenseType, setSelectedExpenseType] = useState(null);
    const [selectedExpenseRows, setSelectedExpenseRows] = useState([]);

    useEffect(() => {
        const role = localStorage.getItem("active");
        setRole(role);
    }, []);

    useEffect(() => {
        // Filter today's warehouse entries
        const todaysData = warehouseData.filter(item => {
            if (!item.postoffice_date) return false;
            const date = new Date(item.postoffice_date);
            if (isNaN(date)) return false;
            const itemDate = date.toISOString().split('T')[0];
            return itemDate === todayDate;
        });

        // Group by parcel_service and calculate average (actual_weight / parcel_amount)
        const grouped = {};

        todaysData.forEach(item => {
            const service = item.parcel_service || 'Unknown';
            const actualWeight = parseFloat(item.actual_weight) || 0;
            const parcelAmount = parseFloat(item.parcel_amount) || 0;

            if (!grouped[service]) {
                grouped[service] = { totalWeight: 0, totalAmount: 0 };
            }

            grouped[service].totalWeight += actualWeight;
            grouped[service].totalAmount += parcelAmount;
        });

        // Convert grouped data into display format
        const result = Object.entries(grouped).map(([service, { totalWeight, totalAmount }]) => ({
            parcel_service: service,
            averageAmount: totalAmount > 0 ? (totalWeight / totalAmount).toFixed(2) : "0.00",
            postoffice_date: todayDate,
        }));

        setFilteredData(result);
    }, [warehouseData]);

    useEffect(() => {
        const fetchOrdersData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}orders/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setOrders(response?.data?.results || []);
            } catch (error) {
                toast.error('Error fetching order data:');
            }
        };
        fetchOrdersData();
    }, []);

    useEffect(() => {
        const fetchOrdersData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}orders/summary/family/data/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setFamilyOrders(response?.data?.results);
                setFamilyOrders2(response?.data?.overall);
            } catch (error) {
                toast.error('Error fetching order data:');
            }
        };
        fetchOrdersData();
    }, []);

    const familyStats = React.useMemo(() => {
        if (!familyOrders) return {};
        const entries = familyOrders.map(r => [
            r.family_name || "Unknown",
            {
                todayAmount: Number(r.today_total_amount || 0),
                todayOrders: Number(r.today_count || 0),
                monthAmount: Number(r.month_total_amount || 0),
                monthOrders: Number(r.month_count || 0),
                family_id: r.family_id
            }
        ]);
        return Object.fromEntries(entries);
    }, [familyOrders]);

    useEffect(() => {
        const fetchInternalTransfersData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}internal/transfers/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setInternalTransfers(response?.data);
            } catch (error) {
                toast.error('Error fetching internal transfers data:');
            }
        };
        fetchInternalTransfersData();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}warehouse/get/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                let warehouses = [];
                response?.data?.results.forEach(order => {
                    if (Array.isArray(order.warehouses) && order.warehouses.length > 0) {
                        warehouses = warehouses.concat(order.warehouses);
                    }
                });
                setWarehouseData(warehouses);
            } catch (error) {
                toast.error("Error fetching warehouse data:");
            }
        };

        fetchData();
    }, [token]);

    useEffect(() => {
        axios.get(`${import.meta.env.VITE_APP_KEY}expense/add/`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((response) => {
                setExpense(response.data.data);
            })
            .catch((error) => {
                toast.error("There was an error fetching the data!");
            });
    }, []);

    // Helpers
    const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    const monthStartStr = `${todayStr.slice(0, 7)}-01`;

    // Month-to-date expenses
    const expensesThisMonth = React.useMemo(() => {
        if (!Array.isArray(expense)) return [];
        return expense.filter(e => {
            const d = (e?.expense_date || '').slice(0, 10); // 'YYYY-MM-DD'
            return d && d >= monthStartStr && d <= todayStr;
        });
    }, [expense]);

    const expenseSummary = React.useMemo(() => {
        if (expensesThisMonth.length === 0) return [];
        const grouped = expensesThisMonth.reduce((acc, item) => {
            const type = item?.expense_type || "Unknown";
            const amt = parseFloat(item?.amount) || 0;
            acc[type] = (acc[type] || 0) + amt;
            return acc;
        }, {});
        return Object.entries(grouped).map(([type, total]) => ({
            expense_type: type,
            total: total.toFixed(2),
        }));
    }, [expensesThisMonth]);

    // Open modal with filtered rows for this type (month-to-date)
    const openExpenseModal = (type) => {
        const normalized = type || "Unknown";
        const rows = (expensesThisMonth || []).filter(
            (e) => (e?.expense_type || "Unknown") === normalized
        );
        setSelectedExpenseType(normalized);
        setSelectedExpenseRows(rows);
        setIsExpenseModalOpen(true);
    };

    const closeExpenseModal = () => {
        setIsExpenseModalOpen(false);
        setSelectedExpenseType(null);
        setSelectedExpenseRows([]);
    };

    // Small helpers
    const fmtINR = (n) =>
        Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-CA") : "");

    const fmtRangeDate = (dateStr) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    };

    const expenseDateRange = `${fmtRangeDate(monthStartStr)} - ${fmtRangeDate(todayStr)}`;

    const totalExpenseMTD = React.useMemo(() => {
        if (!expensesThisMonth?.length) return 0;
        return expensesThisMonth.reduce(
            (sum, e) => sum + (parseFloat(e?.amount) || 0),
            0
        );
    }, [expensesThisMonth]);

    useEffect(() => {
        axios
            .get(`${import.meta.env.VITE_APP_KEY}finance-report/`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((response) => {
                setBankModule(response?.data?.bank_data); // Keep full dataset

                // Apply default filter for today's date
                const today = new Date();
                applyFilters(response?.data?.data, today);
            })
            .catch((err) => {
                if (err.response && err.response.status === 401) {
                    localStorage.removeItem("token");
                    alert("Your session has expired. Please log in again.");
                } else {
                }
            });
    }, []);

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const ordersThisMonth = orders.filter(order => {
        if (!order.order_date) return false;
        const orderDate = new Date(order.order_date);
        return orderDate >= firstDayOfMonth && orderDate <= lastDayOfMonth;
    });

    const calculateCredit = (payments, dateFilter) => {
        if (!payments || payments.length === 0) return 0;

        return payments.reduce((total, payment) => {
            const paymentDate = new Date(payment.received_at).toISOString().split('T')[0];
            const { start, end, date, before } = dateFilter;

            const isInRange = start && end && paymentDate >= start && paymentDate <= end;
            const isExact = date && paymentDate === date;
            const isBefore = before && paymentDate < before;

            if (isInRange || isExact || isBefore) {
                return total + parseFloat(payment.amount);
            }
            return total;
        }, 0);
    };

    const calculateDebit = (banks, dateFilter) => {
        if (!banks || banks.length === 0) return 0;

        return banks.reduce((total, bank) => {
            const expenseDate = new Date(bank.expense_date).toISOString().split('T')[0];
            const { start, end, date, before } = dateFilter;

            const isInRange = start && end && expenseDate >= start && expenseDate <= end;
            const isExact = date && expenseDate === date;
            const isBefore = before && expenseDate < before;

            if (isInRange || isExact || isBefore) {
                return total + parseFloat(bank.amount);
            }
            return total;
        }, 0);
    };

    const formatDate = (d) => new Date(d).toISOString().split("T")[0];
    const today = new Date();
    const selectedDay = formatDate(today);

    const dateFilter = { date: selectedDay };
    const priorFilter = { before: selectedDay };

    const processedBankData = (bankmodule || []).map((customer) => {
        const priorCredit = calculateCredit(customer.payments, priorFilter);
        const priorDebit = calculateDebit(customer.banks, priorFilter);

        const openBalance = parseFloat(customer.open_balance || 0) + priorCredit - priorDebit;

        const credit = calculateCredit(customer.payments, dateFilter);
        const debit = calculateDebit(customer.banks, dateFilter);
        const closingBalance = openBalance + credit - debit;

        return {
            ...customer,
            open_balance: openBalance,
            credit,
            debit,
            closingBalance,
        };
    });

    const total = processedBankData.reduce(
        (acc, customer) => {
            acc.open_balance += parseFloat(customer.open_balance || 0);
            acc.credit += parseFloat(customer.credit || 0);
            acc.debit += parseFloat(customer.debit || 0);
            acc.closingBalance += parseFloat(customer.closingBalance || 0);
            return acc;
        },
        { open_balance: 0, credit: 0, debit: 0, closingBalance: 0 }
    );

    // const todayBills = chartsData?.find(item => item?.title === "Today Bills");
    const todayBills = orders.length;
    const totalVolume = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
    const totalexpense = expense.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

    const codOrdersThisMonth = ordersThisMonth.filter(order => order.payment_status === "COD");
    const codOrdersCount = codOrdersThisMonth.length;
    const codOrdersTotalVolume = codOrdersThisMonth.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);

    // Today's COD orders (all divisions)
    const todayCodOrders = orders.filter(order => {
        const orderDate = new Date(order.order_date).toISOString().split('T')[0];
        return orderDate === todayDate && order.payment_status === "COD";
    });
    const todayCodOrdersCount = todayCodOrders.length;
    const todayCodOrdersVolume = todayCodOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);

    // Get today's date in local time (not UTC)
    const todayDates = new Date().toLocaleDateString('en-CA'); // "YYYY-MM-DD" format

    const internalTransfersToday = internalTransfers.filter(transfer => {
        const transferDate = new Date(transfer.created_at).toLocaleDateString('en-CA');
        return transferDate === todayDates;
    });

    const totalInternalTransferAmountToday = internalTransfersToday.reduce((sum, transfer) => {
        return sum + parseFloat(transfer.amount || 0);
    }, 0);

    return (
        <React.Fragment>
            <Col lg={12}>
                <Card className="shadow-sm border-0">
                    <CardBody>
                        {(role === 'CEO' || role === 'COO') && (
                            <div className="row">
                                {/* Left Column - Division-wise Order Statistics */}
                                <div className="col-md-3">
                                    <h4 className="text-center mb-4 fw-bold text-primary">📊 Division-wise Order Statistics</h4>

                                    {/* Guard for loading/empty */}
                                    {!familyOrders?.length ? (
                                        <div className="text-center text-muted">No data</div>
                                    ) : (
                                        <div className="d-flex flex-wrap justify-content-center gap-3">
                                            {familyOrders.map((r) => {
                                                const family = r.family_name || "Unknown";
                                                const stats = familyStats[family] || {
                                                    todayAmount: 0, todayOrders: 0, monthAmount: 0, monthOrders: 0
                                                };

                                                return (
                                                    <div
                                                        className="card border-0 shadow-sm p-2 rounded-4"
                                                        style={{ width: "180px", transition: "0.3s", cursor: "pointer", background: "#f9fcff" }}
                                                        key={r.family_id || family}
                                                        onClick={() => navigate("/dashboard/family/details", { state: { family_id: r.family_id, family_name: family } })}
                                                    >
                                                        <div className="card-body text-center">
                                                            <h5 className="card-title text-uppercase fw-semibold text-secondary">
                                                                {family}
                                                            </h5>

                                                            <p className="card-text mb-2">
                                                                <span className="text-muted">Today's Total:</span><br />
                                                                <strong className="text-success fs-6">
                                                                    ₹{stats.todayAmount.toLocaleString()} ({stats.todayOrders} orders)
                                                                </strong>
                                                            </p>

                                                            <hr />

                                                            <p className="card-text mb-0">
                                                                <span className="text-muted">This Month:</span><br />
                                                                <strong className="text-primary fs-6">
                                                                    ₹{stats.monthAmount.toLocaleString()} ({stats.monthOrders} orders)
                                                                </strong>
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Middle Column (optional content) */}
                                <div className="col-md-5 d-flex flex-column gap-4">
                                    <div className="p-3 border rounded-4 shadow-sm bg-white">
                                        <div className="d-flex flex-column gap-3">
                                            {/* First Row (was Column 1) */}
                                            <div className="p-4 border rounded-4 shadow-sm bg-light d-flex flex-column justify-content-center align-items-center text-center">
                                                <p className="text-muted fw-medium mb-2">Total Division Status</p>
                                                <h5 className="mb-1">Today's Total Volume : <span className='text-primary'>₹<strong>{familyOrders2?.today_total_amount}</strong></span></h5>
                                                <p className="text-muted fw-medium mb-1">
                                                    Today's Total Orders : <span className="fw-bold text-dark"><strong>{familyOrders2?.today_count}</strong></span>
                                                </p>
                                                <h6 className="text-muted mb-1">
                                                    Today's COD Orders : <span className="fw-bold text-dark"><strong>{Number(familyOrders2?.payment_status_summary?.today?.COD?.count || 0)}</strong>
                                                    </span> | ₹<span className="fw-bold text-dark">
                                                        <strong>
                                                            {Number(familyOrders2?.payment_status_summary?.today?.COD?.total || 0).toLocaleString("en-IN", {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </strong>
                                                    </span>
                                                </h6>
                                                <hr className="my-3" style={{ width: "60%" }} />
                                                <h5 className="mb-1">
                                                    This Month's Total Volume : <span className='text-primary'>₹<strong>{familyOrders2?.month_total_amount}</strong></span>
                                                </h5>
                                                <p className="text-muted fw-medium mb-1">
                                                    This Month's Total Orders : <span className="fw-bold text-dark"><strong>{familyOrders2?.month_count}</strong></span>
                                                </p>
                                                <h6 className="text-muted mb-1">
                                                    COD Orders : <span className="fw-bold text-dark"><strong>{Number(familyOrders2?.payment_status_summary?.month?.COD?.count || 0)}</strong>
                                                    </span> | ₹<span className="fw-bold text-dark">
                                                        <strong>
                                                            {Number(familyOrders2?.payment_status_summary?.month?.COD?.total || 0).toLocaleString("en-IN", {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </strong>
                                                    </span>
                                                </h6>
                                            </div>

                                            {/* Second Row (was Column 2) */}
                                            <div className="d-flex gap-3">
                                                {/* Left Column - 1/3 width */}
                                                <div className="w-33 flex-shrink-0 p-4 border rounded-4 shadow-sm bg-light d-flex flex-column justify-content-center align-items-center text-center">
                                                    <p className="text-muted fw-medium mb-1">Total Bill</p>
                                                    <h4 className="mb-0">{todayBills}</h4>
                                                </div>

                                                {/* Right Column - 2/3 width with two rows */}
                                                <div className="flex-grow-1 d-flex flex-column gap-3">
                                                    {/* Row 1: Total Expense */}
                                                    <div className="p-4 border rounded-4 shadow-sm bg-light text-center">
                                                        <p className="text-muted fw-medium mb-1">Total Expense: <span>₹<strong>{totalexpense.toFixed(2)}</strong></span></p>
                                                    </div>

                                                    {/* Row 2: Total Volume */}
                                                    <div className="p-4 border rounded-4 shadow-sm bg-light text-center">
                                                        <p className="text-muted fw-medium mb-1">Total Volume: <span>₹<strong>{totalVolume.toFixed(2)}</strong></span></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-2 border rounded-4 shadow-sm bg-light">
                                        <h5 className="text-center mb-3 text-primary">🏦 Bank Finance Totals</h5>
                                        <Table bordered responsive className="mb-0 text-center">
                                            <thead>
                                                <tr>
                                                    <th>DBR</th>
                                                    <th>Opening Balance</th>
                                                    <th>Credit</th>
                                                    <th>Debit</th>
                                                    <th>Closing Balance</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td className="fw-medium">With Internal Transfer</td>
                                                    <td>
                                                        <strong>
                                                            ₹{total?.open_balance?.toLocaleString("en-IN", {
                                                                minimumFractionDigits: 2
                                                            })}
                                                        </strong>
                                                    </td>
                                                    <td className="text-success">
                                                        <strong>
                                                            ₹{total?.credit?.toLocaleString("en-IN", {
                                                                minimumFractionDigits: 2
                                                            })}
                                                        </strong>
                                                    </td>
                                                    <td className="text-danger">
                                                        <strong>
                                                            ₹{total?.debit?.toLocaleString("en-IN", {
                                                                minimumFractionDigits: 2
                                                            })}
                                                        </strong>
                                                    </td>
                                                    <td className="text-primary">
                                                        <strong>
                                                            ₹{total?.closingBalance?.toLocaleString("en-IN", {
                                                                minimumFractionDigits: 2
                                                            })}
                                                        </strong>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Without Internal Transfer</td>
                                                    <td>
                                                        <strong>
                                                            ₹{total?.open_balance?.toLocaleString("en-IN", {
                                                                minimumFractionDigits: 2
                                                            })}
                                                        </strong>
                                                    </td>
                                                    <td className="text-success">
                                                        <strong>
                                                            ₹{(total?.credit - totalInternalTransferAmountToday).toLocaleString("en-IN", {
                                                                minimumFractionDigits: 2
                                                            })}
                                                        </strong>
                                                    </td>
                                                    <td className="text-danger">
                                                        <strong>
                                                            ₹{(total?.debit - totalInternalTransferAmountToday).toLocaleString("en-IN", {
                                                                minimumFractionDigits: 2
                                                            })}
                                                        </strong>
                                                    </td>
                                                    <td className="text-primary">
                                                        <strong>
                                                            ₹{(
                                                                total?.open_balance +
                                                                (total?.credit - totalInternalTransferAmountToday) -
                                                                (total?.debit - totalInternalTransferAmountToday)
                                                            ).toLocaleString("en-IN", {
                                                                minimumFractionDigits: 2
                                                            })}
                                                        </strong>
                                                    </td>

                                                </tr>
                                            </tbody>
                                        </Table>
                                    </div>
                                </div>

                                <div className="col-md-4">
                                    <div className="p-3 border rounded-4 shadow-sm bg-white">
                                        <h5 className="text-center text-secondary mb-2">💰 Expense Summary</h5>
                                        <p className="text-center text-muted mb-1">
                                            {expenseDateRange}
                                        </p>
                                        <Table bordered responsive className="mb-0 text-center">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Expense Type</th>
                                                    <th>Total (₹)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {expenseSummary.length > 0 ? (
                                                    expenseSummary.map((item, index) => (
                                                        <tr
                                                            key={index}
                                                            onClick={() => openExpenseModal(item.expense_type)}  // 👈 opens modal
                                                            style={{ cursor: "pointer" }}
                                                            title="Click to view all expenses in this category"
                                                        >
                                                            <td>{index + 1}</td>
                                                            <td><strong>{(item?.expense_type || "UNKNOWN").toUpperCase()}</strong></td>
                                                            <td><strong>₹ {item.total}</strong></td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="3" className="text-muted text-center">
                                                            No expense data available
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                            {expenseSummary.length > 0 && (
                                                <tfoot>
                                                    <tr>
                                                        <td colSpan="2" className="text-center text-primary fw-semibold"><strong>TOTAL</strong></td>
                                                        <td className="fw-bold text-primary"><strong>₹ {fmtINR(totalExpenseMTD)}</strong></td>
                                                    </tr>
                                                </tfoot>
                                            )}
                                        </Table>
                                        <Modal isOpen={isExpenseModalOpen} toggle={closeExpenseModal} size="lg">
                                            <ModalHeader toggle={closeExpenseModal}>
                                                <div className="d-flex justify-content-between w-100 align-items-center">
                                                    <span>Expenses — {(selectedExpenseType || "UNKNOWN").toUpperCase()}</span>
                                                    <small className="text-muted m-2">{expenseDateRange}</small>
                                                </div>
                                            </ModalHeader>
                                            <ModalBody>
                                                {/* Header stats */}
                                                <div className="d-flex justify-content-between align-items-center mb-3">
                                                    <div>
                                                        <small className="text-muted">Records:</small>{" "}
                                                        <strong>{selectedExpenseRows.length}</strong>
                                                    </div>
                                                    <div>
                                                        <small className="text-muted">Total (₹):</small>{" "}
                                                        <strong>
                                                            ₹
                                                            {fmtINR(
                                                                selectedExpenseRows.reduce(
                                                                    (s, r) => s + Number(r?.amount || 0),
                                                                    0
                                                                )
                                                            )}
                                                        </strong>
                                                    </div>
                                                </div>

                                                {/* Data table */}
                                                <Table bordered responsive className="mb-0 table-sm text-center">
                                                    <thead>
                                                        <tr>
                                                            <th>#</th>
                                                            <th>Date</th>
                                                            <th>Type</th>
                                                            <th>Purpose / Notes</th>
                                                            <th>Mode / Bank</th>
                                                            <th>Amount (₹)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {selectedExpenseRows.length ? (
                                                            selectedExpenseRows.map((row, idx) => (
                                                                <tr key={idx}>
                                                                    <td>{idx + 1}</td>
                                                                    <td>{fmtDate(row?.expense_date)}</td>
                                                                    <td>{(row?.expense_type || "Unknown").toUpperCase()}</td>
                                                                    <td>{row?.purpose || row?.description || "-"}</td>
                                                                    <td>
                                                                        {row?.payment_mode || row?.paymentType || row?.bank_name || "-"}
                                                                    </td>
                                                                    <td className="text-end">₹ {fmtINR(row?.amount)}</td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan={6} className="text-center text-muted">
                                                                    No expenses found.
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </Table>
                                            </ModalBody>
                                        </Modal>
                                    </div>
                                    <div className="p-3 mt-2 border rounded-4 shadow-sm bg-white">
                                        <h5 className="text-center text-secondary mb-3">📦 Parcel Summary</h5>
                                        <Table className="table table-bordered table-sm text-center mb-0">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Date</th>
                                                    <th>Parcel Service</th>
                                                    <th>Average</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredData.length > 0 ? (
                                                    filteredData.map((item, index) => (
                                                        <tr key={index}>
                                                            <th scope="row">{index + 1}</th>
                                                            <td>{item.postoffice_date}</td>
                                                            <td>{item.parcel_service}</td>
                                                            <td>₹ {item.averageAmount}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="4" className="text-center text-muted">
                                                            No data available for the selected date range
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </Table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardBody>
                </Card>
            </Col>
        </React.Fragment>
    );
};

export default StatisticsApplications;