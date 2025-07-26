import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Row, Col, Card, CardBody, Input, Button } from "reactstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const StatisticsApplications = () => {
    const token = localStorage.getItem("token")
    const [role, setRole] = useState(null)
    const [userData, setUserData] = useState();
    const [orders, setOrders] = useState([]);
    const [internalTransfers, setInternalTransfers] = useState([]);
    const [bankmodule, setBankModule] = useState([]);
    const todayDate = new Date().toISOString().split('T')[0];
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [warehouseData, setWarehouseData] = useState([]);
    const [chartsData, setChartsData] = useState();
    const [expense, setExpense] = useState([])
    const [startDate, setStartDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split("T")[0];
    });
    const [endDate, setEndDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split("T")[0];
    });
    const [filteredData, setFilteredData] = useState([]);

    useEffect(() => {
        const role = localStorage.getItem("active");
        setRole(role);
    }, []);

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];

        // Filter today's warehouse entries
        const todaysData = warehouseData.filter(item => {
            if (!item.postoffice_date) return false;

            const date = new Date(item.postoffice_date);
            if (isNaN(date)) return false;

            const itemDate = date.toISOString().split('T')[0];
            return itemDate === todayDate;
        });

        setFilteredData(todaysData);

        // Group by parcel_service and calculate average
        const grouped = {};

        todaysData.forEach(item => {
            const service = item.parcel_service || 'Unknown';
            const amount = parseFloat(item.amount) || 0;

            if (!grouped[service]) {
                grouped[service] = { totalAmount: 0, count: 0 };
            }

            grouped[service].totalAmount += amount;
            grouped[service].count += 1;
        });

        // Convert grouped data into display format
        const result = Object.entries(grouped).map(([service, { totalAmount, count }]) => ({
            parcel_service: service,
            averageAmount: (totalAmount / count).toFixed(2),
            postoffice_date: today,
        }));

        setFilteredData(result);
    }, [warehouseData]);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}profile/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUserData(response?.data?.data?.family);
            } catch (error) {
                toast.error('Error fetching user data:');
            }
        };
        fetchUserData();
    }, []);

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
        const fetchChartData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}dashboard/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setChartsData(response?.data?.data);
                setLoading(false);
            } catch (error) {
                toast.error('Error fetching chart data:');
                setLoading(false);
            }
        };
        fetchChartData();
    }, []);

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
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        axios
            .get(`${import.meta.env.VITE_APP_KEY}finance-report/`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((response) => {
                setBankModule(response?.data?.bank_data); // Keep full dataset
                setLoading(false);

                // Apply default filter for today's date
                const today = new Date();
                applyFilters(response?.data?.data, today);
            })
            .catch((err) => {
                if (err.response && err.response.status === 401) {
                    localStorage.removeItem("token");
                    alert("Your session has expired. Please log in again.");
                } else {
                    setError(err);
                    setLoading(false);
                }
            });
    }, []);

    const todayOrders = orders.filter(order => {
        const orderDate = new Date(order.order_date).toISOString().split('T')[0];
        return orderDate === todayDate;
    });

    const familyStats = todayOrders.reduce((acc, order) => {
        const family = order.family_name || "Unknown";
        const amount = parseFloat(order.total_amount) || 0;

        if (!acc[family]) {
            acc[family] = {
                totalAmount: 0,
                orderCount: 0
            };
        }

        acc[family].totalAmount += amount;
        acc[family].orderCount += 1;
        return acc;
    }, {});

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

    const overallTotals = Object.values(familyStats).reduce((acc, stat) => {
        acc.totalAmount += stat.totalAmount;
        acc.orderCount += stat.orderCount;
        return acc;
    }, { totalAmount: 0, orderCount: 0 });

    // const todayBills = chartsData?.find(item => item?.title === "Today Bills");
    const todayBills = orders.length;
    const totalVolume = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
    const totalexpense = expense.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

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
                        {role === 'CEO' && (
                            <div className="row">
                                {/* Left Column - Division-wise Order Statistics */}
                                <div className="col-md-3">
                                    <h4 className="text-center mb-4 fw-bold text-primary">📊 Division-wise Order Statistics</h4>
                                    <div className="d-flex flex-wrap justify-content-center gap-3">
                                        {Object.entries(familyStats).map(([family, stats]) => (
                                            <div
                                                className="card border-0 shadow-sm p-2 rounded-4"
                                                style={{ width: "180px", transition: "0.3s" }}
                                                key={family}
                                            >
                                                <div className="card-body text-center">
                                                    <h5 className="card-title text-uppercase fw-semibold text-secondary">
                                                        {family}
                                                    </h5>
                                                    <p className="card-text mb-2">
                                                        <span className="text-muted">Total Amount:</span><br />
                                                        <strong className="text-success fs-5">₹{stats?.totalAmount?.toLocaleString()}</strong>
                                                    </p>
                                                    <p className="card-text">
                                                        <span className="text-muted">Total Orders:</span><br />
                                                        <strong className="text-dark fs-5">{stats?.orderCount}</strong>
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Middle Column (optional content) */}
                                <div className="col-md-5 d-flex flex-column gap-4">
                                    <div className="p-3 border rounded-4 shadow-sm bg-white">
                                        <div className="d-flex flex-column gap-3">
                                            {/* First Row (was Column 1) */}
                                            <div className="p-4 border rounded-4 shadow-sm bg-light d-flex flex-column justify-content-center align-items-center text-center">
                                                <p className="text-muted fw-medium mb-2">Total Division Status</p>
                                                <h5 className="mb-1">Today's Total Volume : <span className='text-primary'>₹<strong>{overallTotals.totalAmount.toLocaleString()}</strong></span></h5>
                                                <p className="text-muted fw-medium mb-0">
                                                    Today's Total Orders : <span className="fw-bold text-dark"><strong>{overallTotals.orderCount}</strong></span>
                                                </p>
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
                                                    <th>With / Without</th>
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
                                        <h5 className="text-center text-secondary mb-3">📦 Parcel Summary</h5>
                                        <Table className="table table-bordered table-sm text-center mb-0">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Date</th>
                                                    <th>Parcel Service</th>
                                                    <th>Average Amount (₹)</th>
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