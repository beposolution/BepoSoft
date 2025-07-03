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
    console.log("dataa", warehouseData)

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

    const calculateCredit = (payments) => {
        if (!payments || payments.length === 0) return 0;
        return payments.reduce((total, payment) => total + parseFloat(payment.amount || 0), 0);
    };

    const calculateDebit = (banks) => {
        if (!banks || banks.length === 0) return 0;
        return banks.reduce((total, bank) => total + parseFloat(bank.amount || 0), 0);
    };

    const processBankData = (data) => {
        return data.map((customer) => {
            const todayPayments = (customer.payments || []).filter(p => {
                if (!p.date) return false;
                const date = new Date(p.date);
                return !isNaN(date) && date.toISOString().split('T')[0] === todayDate;
            });

            const todayBanks = (customer.banks || []).filter(b => {
                if (!b.date) return false;
                const date = new Date(b.date);
                return !isNaN(date) && date.toISOString().split('T')[0] === todayDate;
            });

            const credit = calculateCredit(todayPayments);
            const debit = calculateDebit(todayBanks);
            const openBalance = parseFloat(customer.open_balance || 0);
            const closingBalance = openBalance + credit - debit;

            return {
                ...customer,
                credit,
                debit,
                closingBalance,
                open_balance: openBalance,
            };
        });
    };

    const processedBankData = processBankData(bankmodule);

    const total = processedBankData.reduce(
        (acc, customer) => {
            acc.open_balance += customer.open_balance;
            acc.credit += customer.credit;
            acc.debit += customer.debit;
            acc.closingBalance += customer.closingBalance;
            return acc;
        },
        { open_balance: 0, credit: 0, debit: 0, closingBalance: 0 }
    );

    const overallTotals = Object.values(familyStats).reduce((acc, stat) => {
        acc.totalAmount += stat.totalAmount;
        acc.orderCount += stat.orderCount;
        return acc;
    }, { totalAmount: 0, orderCount: 0 });

    const todayBills = chartsData?.find(item => item?.title === "Today Bills");
    const totalVolume = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
    const totalexpense = expense.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

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
                                                <p className="text-muted fw-medium mb-2">Total Division Stats</p>
                                                <h5 className="mb-1">Total Volume : <span className='text-primary'>₹<strong>{overallTotals.totalAmount.toLocaleString()}</strong></span></h5>
                                                <p className="text-muted fw-medium mb-0">
                                                    Total Orders : <span className="fw-bold text-dark"><strong>{overallTotals.orderCount}</strong></span>
                                                </p>
                                            </div>

                                            {/* Second Row (was Column 2) */}
                                            <div className="d-flex flex-row justify-content-between gap-3 text-center">
                                                {/* Card 1 */}
                                                <div className="flex-fill p-4 border rounded-4 shadow-sm bg-light">
                                                    <p className="text-muted fw-medium mb-1">Today's Bill</p>
                                                    <h4 className="mb-0">{role === "CEO" && (todayBills?.order || 0)}</h4>
                                                </div>

                                                {/* Card 2 */}
                                                <div className="flex-fill p-4 border rounded-4 shadow-sm bg-light">
                                                    <p className="text-muted fw-medium mb-1">Total Expense</p>
                                                    <h4 className="mb-0">₹{totalexpense}</h4>
                                                </div>

                                                {/* Card 3 */}
                                                <div className="flex-fill p-4 border rounded-4 shadow-sm bg-light">
                                                    <p className="text-muted fw-medium mb-1">Total Volume</p>
                                                    <h4 className="mb-0">₹{totalVolume}</h4>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 border rounded-4 shadow-sm bg-light">
                                        <h5 className="text-center mb-3 text-primary">🏦 Bank Finance Totals</h5>
                                        <ul className="list-group list-group-flush">
                                            <li className="list-group-item d-flex justify-content-between">
                                                <span className="fw-medium">Opening Balance:</span>
                                                <span className="fw-bold">₹{total.open_balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <span className="fw-medium">Credit:</span>
                                                <span className="fw-bold text-success">₹{total.credit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <span className="fw-medium">Debit:</span>
                                                <span className="fw-bold text-danger">₹{total.debit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <span className="fw-medium">Closing Balance:</span>
                                                <span className="fw-bold text-primary">₹{total.closingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                                            </li>
                                        </ul>
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