import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardBody, Col, Nav, NavItem, NavLink } from 'reactstrap';
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

    useEffect(() => {
        const role = localStorage.getItem("active");
        setRole(role);
    }, []);

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
        if (!acc[family]) {
            acc[family] = {
                totalAmount: 0,
                orderCount: 0
            };
        }
        acc[family].totalAmount += order.total_amount || 0;
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

    return (
        <React.Fragment>
            <Col lg={12}>
                <Card className="shadow-sm border-0">
                    <CardBody>
                        {role === 'CEO' && (
                            <>
                                {/* Family Statistics */}
                                <div>
                                    <h4 className="text-center mb-4 fw-bold text-primary">📊 Family-wise Order Statistics</h4>
                                    <div className="d-flex flex-wrap justify-content-center gap-3">
                                        {Object.entries(familyStats).map(([family, stats]) => (
                                            <div
                                                className="card border-0 shadow-sm p-2 rounded-4"
                                                style={{ width: "18rem", transition: "0.3s" }}
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

                                {/* Bank Totals */}
                                <div className="mt-5 p-4 border rounded-4 shadow-sm bg-light" style={{ maxWidth: '500px', margin: '0 auto' }}>
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
                            </>
                        )}
                    </CardBody>
                </Card>
            </Col>
        </React.Fragment>
    );
};

export default StatisticsApplications;