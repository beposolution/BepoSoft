import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Row, Col, Card, CardBody, Input, Button, Modal, ModalHeader, ModalBody } from "reactstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { FaCalendarAlt } from "react-icons/fa";


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
    const [serviceTotals, setServiceTotals] = useState([]);
    const [warehouseSummary, setWarehouseSummary] = useState(null);
    const [ordersCount, setOrdersCount] = useState(0);
    const [stateBdoReport, setStateBdoReport] = useState([]);
    const [stateBdoLoading, setStateBdoLoading] = useState(false);

    const [todayParcelRows, setTodayParcelRows] = useState([]);
    const [monthlyParcelRows, setMonthlyParcelRows] = useState([]);
    const [expenseSummaryApi, setExpenseSummaryApi] = useState([]);
    const [expenseRange, setExpenseRange] = useState({ from: null, to: null });
    const [expenseMonthTotal, setExpenseMonthTotal] = useState(0);
    const [expenseModalLoading, setExpenseModalLoading] = useState(false);
    const [OD, setOD] = useState([]);
    const [todayReport, setTodayReport] = useState([]);
    const [monthReport, setMonthReport] = useState([]);
    const [showMonth, setShowMonth] = useState(false);
    const [categoryCount, setCategoryCount] = useState([]);
    const [selectedDate, setSelectedDate] = useState("");
    const [categoryData, setCategoryData] = useState([]);
    const [categoryStartDate, setCategoryStartDate] = useState("");
    const [categoryEndDate, setCategoryEndDate] = useState("");
    const [callDuration, setCallDuration] = useState([]);

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
        if (!Array.isArray(warehouseData) || warehouseData.length === 0) return;

        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const monthData = warehouseData.filter(item => {
            if (!item.postoffice_date) return false;
            const d = new Date(item.postoffice_date);
            return d >= firstDay && d <= lastDay;
        });

        // Group by parcel_service and calculate totals
        const grouped = {};
        monthData.forEach(item => {
            const service = item.parcel_service || 'Unknown';
            const amt = parseFloat(item.parcel_amount) || 0;
            const wt = (parseFloat(item.actual_weight) || 0) / 1000;

            if (!grouped[service]) {
                grouped[service] = { totalAmount: 0, totalWeight: 0 };
            }
            grouped[service].totalAmount += amt;
            grouped[service].totalWeight += wt;
        });

        // Convert to array for the table
        const rows = Object.entries(grouped).map(([service, { totalAmount, totalWeight }]) => ({
            parcel_service: service,
            totalAmount,
            totalWeight,
            average: totalWeight > 0 ? (totalAmount / totalWeight).toFixed(2) : "0.00"
        }));

        setServiceTotals(rows);
    }, [warehouseData]);

    const grandTotalAmount =
        warehouseSummary?.current_month_summary?.total_parcel_amount || 0;

    const grandTotalWeight =
        warehouseSummary?.current_month_summary?.total_actual_weight_kg || 0;

    const grandTotalAverage =
        warehouseSummary?.current_month_summary?.average || 0;

    const calculateStateBdoSummary = (reportData) => {
        if (!Array.isArray(reportData)) {
            return {
                families: [],
                grandBills: 0,
                grandAmount: 0,
                totalStates: 0,
                totalBdos: 0,
            };
        }

        const families = reportData
            .filter(
                (family) =>
                    family?.family === "cycling" || family?.family === "skating"
            )
            .map((family) => {
                let familyBills = 0;
                let familyAmount = 0;
                let familyBdos = 0;

                (family.states || []).forEach((state) => {
                    (state.bdo_details || []).forEach((bdo) => {
                        familyBills += Number(bdo?.bills || 0);
                        familyAmount += Number(bdo?.amount || 0);
                        familyBdos += 1;
                    });
                });

                return {
                    family: family.family,
                    totalBills: familyBills,
                    totalAmount: familyAmount,
                    totalStates: (family.states || []).length,
                    totalBdos: familyBdos,
                };
            });

        const grandBills = families.reduce((sum, item) => sum + item.totalBills, 0);
        const grandAmount = families.reduce((sum, item) => sum + item.totalAmount, 0);
        const totalStates = families.reduce((sum, item) => sum + item.totalStates, 0);
        const totalBdos = families.reduce((sum, item) => sum + item.totalBdos, 0);

        return {
            families,
            grandBills,
            grandAmount,
            totalStates,
            totalBdos,
        };
    };

    useEffect(() => {
        const fetchStateBdoSummary = async () => {
            try {
                setStateBdoLoading(true);

                const response = await axios.get(
                    `${import.meta.env.VITE_APP_KEY}reports/state/wise/bdo/`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        params: {
                            start_date: todayDate,
                            end_date: todayDate,
                        },
                    }
                );

                setStateBdoReport(response?.data?.data || []);
            } catch (error) {
                toast.error("Failed to fetch state wise BDO summary");
            } finally {
                setStateBdoLoading(false);
            }
        };

        if (token) {
            fetchStateBdoSummary();
        }
    }, [token, todayDate]);

    const stateBdoSummary = React.useMemo(() => {
        return calculateStateBdoSummary(stateBdoReport);
    }, [stateBdoReport]);

    const goToStateWiseBillingReport = () => {
        navigate("/state/wise/billing/wise/report/");
    };

    useEffect(() => {
        const fetchCallDurationData = async () => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_APP_KEY}bdm/daily/overall/report/`,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                const apiData = response?.data?.results?.data || [];
                setCallDuration(apiData);

            } catch (error) {
                console.error("BDO Call Data API error:", error);
                toast.error("Error fetching BDO call data");
            }
        };

        if (token) {
            fetchCallDurationData();
        }
    }, [token]);


    const fetchOrdersData = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_APP_KEY}orders/`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setOrdersCount(response.data.count);

            let ordersData = [];

            if (Array.isArray(response.data)) {
                ordersData = response.data;
            }
            else if (Array.isArray(response.data.results)) {
                ordersData = response.data.results;
            }
            else if (Array.isArray(response.data.results?.results)) {
                ordersData = response.data.results.results;
            }

            setOrders(ordersData);

        } catch (error) {
            toast.error("Error fetching order data");
        }
    };

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
        if (!selectedDate) return;

        const fetchCategoryCountData = async () => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_APP_KEY}category/wise/product/count/date/${selectedDate}/`,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                setCategoryCount(response?.data);

            } catch (error) {
                toast.error("Error fetching category count data");
            }
        };

        fetchCategoryCountData();
    }, [selectedDate]);


    useEffect(() => {
        const fetchCategoryWiseCountData = async () => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_APP_KEY}category/wise/product/count/`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                        params: {
                            start_date: categoryStartDate || undefined,
                            end_date: categoryEndDate || undefined,
                        },
                    }
                );

                setCategoryData(response?.data?.data || []);
                console.log("category wise data", response.data);
            } catch (error) {
                toast.error("Error fetching category count data");
            }
        };

        if (token) {
            fetchCategoryWiseCountData();
        }
    }, [token, categoryStartDate, categoryEndDate]);


    useEffect(() => {
        const fetchWarehouseSummary = async () => {
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_APP_KEY}warehouse/get/summary/`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                const summary = res.data;
                setWarehouseSummary(summary);

                // ---------- TODAY TABLE ----------
                const todayRows = Object.entries(summary.data || {}).map(
                    ([service, values]) => ({
                        parcel_service: service,
                        averageAmount: Number(values.today?.average || 0).toFixed(2),
                    })
                );

                // ---------- MONTHLY TABLE ----------
                const monthRows = Object.entries(summary.data || {}).map(
                    ([service, values]) => ({
                        parcel_service: service,
                        totalAmount: values.current_month?.total_parcel_amount || 0,
                        totalWeight: values.current_month?.total_actual_weight_kg || 0,
                        average: Number(values.current_month?.average || 0).toFixed(2),
                    })
                );

                setTodayParcelRows(todayRows);
                setMonthlyParcelRows(monthRows);

            } catch (err) {
                toast.error("Failed to fetch warehouse summary");
            }
        };

        fetchWarehouseSummary();
    }, [token]);

    useEffect(() => {
        axios
            .get(`${import.meta.env.VITE_APP_KEY}dashboard/expense/summary/`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then((res) => {
                setExpenseSummaryApi(res.data?.summary || []);
                setExpenseRange(res.data?.range || {});
                setExpenseMonthTotal(res.data?.month_total || 0);
            })
            .catch(() => {
                toast.error("Failed to load expense summary");
            });
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


    useEffect(() => {
        const fetchODData = async () => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_APP_KEY}finance/report/bank/account/type/`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                const bankData = response?.data?.bank_data || [];

                const today = new Date().toISOString().split("T")[0];
                const currentMonth = today.substring(0, 7); // yyyy-mm

                let todayArr = [];
                let monthArr = [];

                bankData.forEach((bank) => {

                    // Sort daily_data by date
                    const sortedDaily = (bank.daily_data || []).slice().sort((a, b) => {
                        return new Date(a.date) - new Date(b.date);
                    });

                    let monthEntries = [];

                    sortedDaily.forEach((entry) => {
                        const credit = Number(entry.total_credit || 0);
                        const debit = Number(entry.total_debit || 0);
                        const interest = Number(entry.daily_interest || 0);

                        const opening = Number(entry.opening || 0);
                        const closing = Number(entry.closing || 0);

                        // current month entries only
                        if (entry.date.startsWith(currentMonth)) {
                            monthEntries.push({
                                date: entry.date,
                                opening,
                                credit,
                                debit,
                                closing,
                                interest,
                                total_interest: Number(entry.total_interest || 0),
                            });
                        }

                        // today entry
                        if (entry.date === today) {
                            todayArr.push({
                                bank_id: bank.bank_id,
                                bank_name: bank.bank_name,
                                date: entry.date,
                                opening,
                                credit,
                                debit,
                                closing,
                                interest,
                            });
                        }
                    });

                    if (monthEntries.length > 0) {
                        monthArr.push({
                            bank_id: bank.bank_id,
                            bank_name: bank.bank_name,
                            monthEntries,
                        });
                    }
                });

                setTodayReport(todayArr);
                setMonthReport(monthArr);

            } catch (error) {
                toast.error("Error fetching internal transfers data");
            }
        };

        fetchODData();
    }, []);



    const selectedBank = OD.find((b) => b.daily_data && b.daily_data.length > 0);


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

    const summaryFrom = expenseRange?.from;
    const summaryTo = expenseRange?.to;

    // Open modal with filtered rows for this type (month-to-date)
    const openExpenseModal = (type) => {
        setExpenseModalLoading(true);
        setSelectedExpenseType(type);
        setSelectedExpenseRows([]);
        setIsExpenseModalOpen(true);

        const normalizedType = type.toString().trim().toLowerCase();

        setTimeout(() => {
            const rows = (expense || []).filter((e) => {
                const rowType = (e?.expense_type || "")
                    .toString()
                    .trim()
                    .toLowerCase();

                const rowDate = (e?.expense_date || "").slice(0, 10);

                const isTypeMatch = rowType === normalizedType;
                const isInRange =
                    (!expenseRange?.from || rowDate >= expenseRange.from) &&
                    (!expenseRange?.to || rowDate <= expenseRange.to);

                return isTypeMatch && isInRange;
            });

            setSelectedExpenseRows(rows);
            setExpenseModalLoading(false);
        }, 400);
    };

    const closeExpenseModal = () => {
        setIsExpenseModalOpen(false);
        setSelectedExpenseType(null);
        setSelectedExpenseRows([]);
        setExpenseModalLoading(false);
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

    const expenseDateRange =
        expenseRange?.from && expenseRange?.to
            ? `${fmtRangeDate(expenseRange.from)} - ${fmtRangeDate(expenseRange.to)}`
            : "";

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
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = now;

    const monthRangeLabel = `${fmtRangeDate(firstDay)} - ${fmtRangeDate(lastDay)}`;

    const ordersThisMonth = Array.isArray(orders)
        ? orders.filter(order => {
            if (!order.order_date) return false;
            const orderDate = new Date(order.order_date);
            return orderDate >= firstDayOfMonth && orderDate <= lastDayOfMonth;
        })
        : [];

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
    const todayBills = ordersCount;
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
                                    <div>
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

                                    <div className="p-3 border rounded-4 shadow-sm bg-light">

                                        <h5 className="text-center mb-3 text-primary">
                                            📦 Category Wise Product Count
                                        </h5>


                                        <Row className="g-3 mb-3">
                                            <Col md={5}>
                                                <label className="form-label fw-semibold">Start Date</label>
                                                <Input
                                                    type="date"
                                                    value={categoryStartDate}
                                                    onChange={(e) => setCategoryStartDate(e.target.value)}
                                                />
                                            </Col>

                                            <Col md={5}>
                                                <label className="form-label fw-semibold">End Date</label>
                                                <Input
                                                    type="date"
                                                    value={categoryEndDate}
                                                    onChange={(e) => setCategoryEndDate(e.target.value)}
                                                />
                                            </Col>

                                            <Col md={2} className="d-flex align-items-end">
                                                <Button
                                                    color="secondary"
                                                    className="w-100"
                                                    onClick={() => {
                                                        setCategoryStartDate("");
                                                        setCategoryEndDate("");
                                                    }}
                                                >
                                                    🗑️
                                                </Button>
                                            </Col>
                                        </Row>

                                        <Table bordered responsive className="mb-0 text-center">
                                            <thead>
                                                <tr>
                                                    {/* <th>#</th> */}
                                                    <th>Category</th>
                                                    <th>Count</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {Array.isArray(categoryData) && categoryData.length > 0 ? (
                                                    categoryData.map((item, index) => (
                                                        <tr key={item.id || index}>
                                                            {/* <td>{index + 1}</td> */}
                                                            <td>
                                                                <strong
                                                                    style={{ cursor: "pointer", color: "#2563eb" }}
                                                                    onClick={() =>
                                                                        navigate("/admin/category/report/view/", {
                                                                            state: {
                                                                                category_id: item.category_id || item.id,
                                                                                start_date: categoryStartDate,
                                                                                end_date: categoryEndDate,
                                                                            },
                                                                        })
                                                                    }
                                                                >
                                                                    {item.category_name || item.category || "-"}
                                                                </strong>
                                                            </td>
                                                            <td>
                                                                <strong>{item.product_count || item.total_quantity || item.count || 0}</strong>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="3" className="text-muted">
                                                            No category data available
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </Table>
                                    </div>

                                    {/* <div className='p-2 border rounded-4 shadow-sm bg-light'>

                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <h5 className="mb-0 text-primary">🛒 Shipped Products Category</h5>

                                            <div className="d-flex align-items-center gap-2">
                                                <input
                                                    type="date"
                                                    value={selectedDate}
                                                    onChange={(e) => setSelectedDate(e.target.value)}
                                                    style={{
                                                        width: "35px",
                                                        height: "35px",
                                                        opacity: 0,
                                                        position: "absolute",
                                                        cursor: "pointer"
                                                    }}
                                                />

                                                <button className="btn btn-outline-primary">
                                                    <FaCalendarAlt />
                                                </button>
                                            </div>

                                        </div>

                                        <Table bordered responsive className="mb-0 text-center">
                                            <thead>
                                                <tr>
                                                    <th>Category</th>
                                                    <th>Count</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {categoryCount?.category_wise_products?.length > 0 ? (
                                                    categoryCount.category_wise_products.map((item, index) => (
                                                        <tr key={index}>
                                                            <td><strong>{item.category}</strong></td>
                                                            <td><strong>{item.total_quantity}</strong></td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="2" className="text-danger">
                                                            {selectedDate ? "No Data Found" : "Please Select Date"}
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </Table>
                                    </div> */}

                                    <div
                                        className="p-3 mt-3 border rounded-4 shadow-sm bg-white"
                                        onClick={goToStateWiseBillingReport}
                                        style={{ cursor: "pointer" }}
                                    >
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <h5 className="mb-0 text-primary">📍 State Wise BDO Summary</h5>
                                            <small className="text-muted">{todayDate}</small>
                                        </div>

                                        {stateBdoLoading ? (
                                            <div className="text-center text-muted py-3">Loading...</div>
                                        ) : stateBdoSummary.families.length > 0 ? (
                                            <>
                                                <Table bordered responsive className="mb-2 text-center">
                                                    <thead>
                                                        <tr>
                                                            <th>Family</th>
                                                            <th>Bills</th>
                                                            <th>Amount</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {stateBdoSummary.families.map((item, index) => (
                                                            <tr key={index}>
                                                                <td className="fw-bold text-uppercase">{item.family}</td>
                                                                <td className="fw-semibold">{item.totalBills}</td>
                                                                <td className="fw-bold text-success">
                                                                    ₹ {Number(item.totalAmount || 0).toLocaleString("en-IN", {
                                                                        minimumFractionDigits: 2,
                                                                        maximumFractionDigits: 2,
                                                                    })}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                    <tfoot>
                                                        <tr className="table-primary fw-bold">
                                                            <td>GRAND TOTAL</td>
                                                            <td>{stateBdoSummary.grandBills}</td>
                                                            <td>
                                                                ₹ {Number(stateBdoSummary.grandAmount || 0).toLocaleString("en-IN", {
                                                                    minimumFractionDigits: 2,
                                                                    maximumFractionDigits: 2,
                                                                })}
                                                            </td>
                                                        </tr>
                                                    </tfoot>
                                                </Table>
                                            </>
                                        ) : (
                                            <div className="text-center text-muted py-3">No summary available</div>
                                        )}
                                    </div>

                                </div>



                                {/* Middle Column (optional content) */}
                                <div className="col-md-5 d-flex flex-column gap-4">

                                    <div className="p-3 border rounded-4 shadow-sm bg-light">
                                        <h5 className="text-center mb-3 text-primary">
                                            BDO Call Data
                                        </h5>

                                        {(() => {
                                            const now = new Date();
                                            const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

                                            const todayData = Array.isArray(callDuration)
                                                ? callDuration.find((item) => item.created_date === today)
                                                : null;

                                            const filteredFamilyData = Array.isArray(todayData?.family_data)
                                                ? todayData.family_data.filter(
                                                    (family) =>
                                                        family.family_name?.toLowerCase() === "skating" ||
                                                        family.family_name?.toLowerCase() === "cycling"
                                                )
                                                : [];

                                            return todayData ? (
                                                filteredFamilyData.length > 0 ? (
                                                    <div className="row g-3">
                                                        {filteredFamilyData.map((family, familyIndex) => (
                                                            <div className="col-md-6" key={familyIndex}>
                                                                <div
                                                                    className="p-3 border rounded-4 bg-white shadow-sm h-100"
                                                                    style={{
                                                                        cursor: "pointer",
                                                                        transition: "all 0.3s ease",
                                                                    }}
                                                                    onClick={() =>
                                                                        navigate("/admin/sales/cd/report/view/", {
                                                                            state: {
                                                                                familyData: family,
                                                                                createdDate: todayData?.created_date,
                                                                                overallData: todayData,
                                                                            },
                                                                        })
                                                                    }
                                                                >
                                                                    <h6 className="text-primary fw-bold mb-3 text-capitalize">
                                                                        {family.family_name || "No Family"}
                                                                    </h6>

                                                                    <div className="row g-2">
                                                                        <div className="col-6">
                                                                            <div className="p-2 border rounded-3 text-center bg-light h-100">
                                                                                <small className="text-muted d-block">
                                                                                    BDM Count
                                                                                </small>
                                                                                <strong>{family.bdm_count || 0}</strong>
                                                                            </div>
                                                                        </div>

                                                                        <div className="col-6">
                                                                            <div className="p-2 border rounded-3 text-center bg-light h-100">
                                                                                <small className="text-muted d-block">
                                                                                    Total Bill
                                                                                </small>
                                                                                <strong>{family.total_bill || 0}</strong>
                                                                            </div>
                                                                        </div>

                                                                        <div className="col-6">
                                                                            <div className="p-2 border rounded-3 text-center bg-light h-100">
                                                                                <small className="text-muted d-block">
                                                                                    Total Orders
                                                                                </small>
                                                                                <strong>{family.total_order_count || 0}</strong>
                                                                            </div>
                                                                        </div>

                                                                        <div className="col-6">
                                                                            <div className="p-2 border rounded-3 text-center bg-light h-100">
                                                                                <small className="text-muted d-block">
                                                                                    Total Volume
                                                                                </small>
                                                                                <strong>
                                                                                    ₹{" "}
                                                                                    {Number(family.total_volume || 0).toLocaleString("en-IN", {
                                                                                        minimumFractionDigits: 2,
                                                                                        maximumFractionDigits: 2,
                                                                                    })}
                                                                                </strong>
                                                                            </div>
                                                                        </div>

                                                                        <div className="col-6">
                                                                            <div className="p-2 border rounded-3 text-center bg-light h-100">
                                                                                <small className="text-muted d-block">
                                                                                    Call Duration
                                                                                </small>
                                                                                <strong>{family.total_call_duration || "00:00:00"}</strong>
                                                                            </div>
                                                                        </div>

                                                                        <div className="col-6">
                                                                            <div className="p-2 border rounded-3 text-center bg-light h-100">
                                                                                <small className="text-muted d-block">
                                                                                    Call Avg %
                                                                                </small>
                                                                                <strong>{family.call_duration_average || 0}</strong>
                                                                            </div>
                                                                        </div>

                                                                        <div className="col-12">
                                                                            <div className="p-2 border rounded-3 text-center bg-light h-100">
                                                                                <small className="text-muted d-block">
                                                                                    Avg Call Duration (Minutes)
                                                                                </small>
                                                                                <strong>
                                                                                    {family.average_call_duration_minutes || 0}
                                                                                </strong>
                                                                            </div>
                                                                        </div>

                                                                        <div className="col-12 text-center mt-2">
                                                                            <small className="text-primary fw-semibold">
                                                                                Click to view details
                                                                            </small>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center text-muted py-3">
                                                        No skating or cycling data available for today
                                                    </div>
                                                )
                                            ) : (
                                                <div className="text-center text-muted py-3">
                                                    No BDO call data available for today
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    <div className="p-3 border rounded-4 shadow-sm bg-white">
                                        <div className="d-flex flex-column gap-3">
                                            {/* First Row (was Column 1) */}
                                            <div className="p-4 border rounded-4 shadow-sm bg-light d-flex flex-column justify-content-center align-items-center text-center">
                                                <p className="text-muted fw-medium mb-2">Total Division Status</p>
                                                <h5 className="mb-1">Today's Total Volume : <span className='text-primary'>₹<strong>{familyOrders2?.today_total_amount?.toFixed(2)}</strong></span></h5>
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
                                                    This Month's Total Volume : <span className='text-primary'>₹<strong>{familyOrders2?.month_total_amount?.toFixed(2)}</strong></span>
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
                                                    <th>OP</th>
                                                    <th>Cr</th>
                                                    <th>Dr</th>
                                                    <th>Cl</th>
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


                                    <div className="p-3 border rounded-4 shadow-sm bg-light">
                                        <h5 className="text-center mb-3 text-primary">
                                            💼 OD Details - {new Date().toLocaleDateString("en-GB")}
                                        </h5>

                                        <Table bordered responsive className="mb-0 text-center">
                                            <thead>
                                                <tr>
                                                    <th>Bank</th>
                                                    <th>OP</th>
                                                    <th>Cr</th>
                                                    <th>Dr</th>
                                                    <th>CL</th>
                                                    <th>Interest</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {todayReport.length > 0 ? (
                                                    todayReport.map((item, index) => (
                                                        <tr key={index}>
                                                            <td className="fw-bold">{item.bank_name}</td>
                                                            <td className="fw-bold">₹ {item.opening.toFixed(2)}</td>
                                                            <td className="fw-bold text-success">₹ {item.credit.toFixed(2)}</td>
                                                            <td className="fw-bold text-danger">₹ {item.debit.toFixed(2)}</td>
                                                            <td className="fw-bold text-primary">₹ {item.closing.toFixed(2)}</td>
                                                            <td className="fw-bold text-primary">₹ {item?.interest}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="5" className="text-muted">
                                                            No transactions found for today.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </Table>

                                        <div className="text-center mt-3">
                                            <button
                                                className="btn btn-primary btn-sm"
                                                onClick={() => setShowMonth(!showMonth)}
                                            >
                                                {showMonth ? "Hide Current Month" : "Show Current Month"}
                                            </button>
                                        </div>

                                        {/* Month View */}
                                        {showMonth && (
                                            <div className="mt-4">
                                                <h6 className="text-center fw-bold text-dark">
                                                    📅 Current Month OD Details
                                                </h6>

                                                {monthReport.map((bank, index) => (
                                                    <div key={index} className="mt-4">
                                                        <h6 className="fw-bold text-primary">{bank.bank_name}</h6>

                                                        <Table bordered responsive className="text-center">
                                                            <thead>
                                                                <tr>
                                                                    <th>Date</th>
                                                                    <th>OB</th>
                                                                    <th>Cr</th>
                                                                    <th>Dr</th>
                                                                    <th>CL</th>
                                                                    <th>Interest</th>
                                                                </tr>
                                                            </thead>

                                                            <tbody>
                                                                {bank.monthEntries.map((entry, i) => (
                                                                    <tr key={i}>
                                                                        <td>{entry.date}</td>
                                                                        <td className="fw-bold">₹ {entry.opening.toFixed(2)}</td>
                                                                        <td className="text-success fw-bold">₹ {entry.credit.toFixed(2)}</td>
                                                                        <td className="text-danger fw-bold">₹ {entry.debit.toFixed(2)}</td>
                                                                        <td className="text-primary fw-bold">₹ {entry.closing.toFixed(2)}</td>
                                                                        <td className="text-primary fw-bold">₹ {entry?.interest}</td>
                                                                    </tr>
                                                                ))}
                                                                <tr>
                                                                    <td><strong>Total</strong></td>
                                                                    <td colSpan="4"></td>
                                                                    <td className="text-primary fw-bold">
                                                                        ₹ {bank.monthEntries.length > 0
                                                                            ? bank.monthEntries[bank.monthEntries.length - 1].total_interest.toFixed(4)
                                                                            : "0.0000"}
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </Table>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
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
                                                {expenseSummaryApi.length > 0 ? (
                                                    expenseSummaryApi.map((item, index) => (
                                                        <tr
                                                            key={index}
                                                            onClick={() => openExpenseModal(item.expense_type)}
                                                            style={{ cursor: "pointer" }}
                                                            title="Click to view all expenses in this category"
                                                        >
                                                            <td>{index + 1}</td>
                                                            <td>
                                                                <strong>{item.expense_type.toUpperCase()}</strong>
                                                            </td>
                                                            <td>
                                                                <strong>₹ {fmtINR(item.total)}</strong>
                                                            </td>
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
                                            {expenseSummaryApi.length > 0 && (
                                                <tfoot>
                                                    <tr>
                                                        <td colSpan="2" className="text-center text-primary fw-semibold"><strong>TOTAL</strong></td>
                                                        <td className="fw-bold text-primary">
                                                            ₹ {fmtINR(expenseMonthTotal)}
                                                        </td>
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
                                                {expenseModalLoading ? (
                                                    <div className="d-flex justify-content-center align-items-center py-5">
                                                        <div className="text-center">
                                                            <div className="spinner-border text-primary mb-3" role="status" />
                                                            <div className="text-muted">Loading expenses…</div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                                            <div>
                                                                <small className="text-muted">Records:</small>{" "}
                                                                <strong>{selectedExpenseRows.length}</strong>
                                                            </div>
                                                            <div>
                                                                <small className="text-muted">Total (₹):</small>{" "}
                                                                <strong>
                                                                    ₹{fmtINR(
                                                                        selectedExpenseRows.reduce(
                                                                            (s, r) => s + Number(r?.amount || 0),
                                                                            0
                                                                        )
                                                                    )}
                                                                </strong>
                                                            </div>
                                                        </div>

                                                        <Table bordered responsive className="mb-0 table-sm text-center">
                                                            <thead>
                                                                <tr>
                                                                    <th>#</th>
                                                                    <th>Date</th>
                                                                    <th>Type</th>
                                                                    <th>Purpose</th>
                                                                    <th>Notes </th>
                                                                    <th className="text-end">Amount (₹)</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {selectedExpenseRows.length ? (
                                                                    selectedExpenseRows.map((row, idx) => (
                                                                        <tr key={idx}>
                                                                            <td>{idx + 1}</td>
                                                                            <td>{fmtDate(row?.expense_date)}</td>
                                                                            <td>{row?.expense_type}</td>
                                                                            <td>{row?.purpose_of_pay || "-"}</td>
                                                                            <td>{row?.description || "-"}</td>
                                                                            <td className="text-end">
                                                                                ₹ {fmtINR(row?.amount)}
                                                                            </td>
                                                                        </tr>
                                                                    ))
                                                                ) : (
                                                                    <tr>
                                                                        <td colSpan="6" className="text-muted text-center">
                                                                            No expenses found for this period.
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </tbody>
                                                        </Table>
                                                    </>
                                                )}
                                            </ModalBody>
                                        </Modal>
                                    </div>
                                    <div className="p-3 mt-2 border rounded-4 shadow-sm bg-white">
                                        <h5 className="text-center text-secondary mb-2">📦 Parcel Summary</h5>
                                        <div className="text-center text-muted mb-1">
                                            {fmtRangeDate(todayDate)}
                                        </div>
                                        <Table className="table table-bordered table-sm text-center mb-0">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Parcel Service</th>
                                                    <th>Average</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {todayParcelRows.length > 0 ? (
                                                    todayParcelRows.map((item, index) => (
                                                        <tr key={index}>
                                                            <td>{index + 1}</td>
                                                            <td>{item.parcel_service}</td>
                                                            <td>₹ {item.averageAmount}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="3" className="text-center text-muted">
                                                            No data available
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                            {warehouseSummary?.today_summary && (
                                                <tfoot>
                                                    <tr className="table-primary fw-bold">
                                                        <td colSpan="2">TOTAL</td>
                                                        <td>
                                                            ₹ {Number(
                                                                warehouseSummary.today_summary.average || 0
                                                            ).toFixed(2)}
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            )}
                                        </Table>
                                    </div>
                                    <div className="p-3 mt-2 border rounded-4 shadow-sm bg-white">
                                        <h5 className="text-center text-secondary mb-2">
                                            📦 Monthly Parcel Summary
                                        </h5>
                                        <p className="text-center text-muted mb-1">
                                            {monthRangeLabel}
                                        </p>
                                        <Table className="table table-bordered table-sm text-center mb-0">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Parcel Service</th>
                                                    <th>Parcel Amount (₹)</th>
                                                    <th>Actual Weight (kg)</th>
                                                    <th>Average (₹/kg)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {monthlyParcelRows.length > 0 ? (
                                                    monthlyParcelRows.map((item, idx) => (
                                                        <tr key={idx}>
                                                            <td>{idx + 1}</td>
                                                            <td>{item.parcel_service}</td>
                                                            <td>{item.totalAmount.toFixed(2)}</td>
                                                            <td>{item.totalWeight.toFixed(2)}</td>
                                                            <td>{item.average}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="5" className="text-center text-muted">
                                                            No monthly data available
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                            {warehouseSummary?.current_month_summary && (
                                                <tfoot>
                                                    <tr className="table-primary fw-bold">
                                                        <td colSpan="2">GRAND TOTAL</td>
                                                        <td>
                                                            ₹ {Number(
                                                                warehouseSummary.current_month_summary.total_parcel_amount || 0
                                                            ).toFixed(2)}
                                                        </td>
                                                        <td>
                                                            {Number(
                                                                warehouseSummary.current_month_summary.total_actual_weight_kg || 0
                                                            ).toFixed(2)}
                                                        </td>
                                                        <td>
                                                            {Number(
                                                                warehouseSummary.current_month_summary.average || 0
                                                            ).toFixed(2)}
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            )}
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