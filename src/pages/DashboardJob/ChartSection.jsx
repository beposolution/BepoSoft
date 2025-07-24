import React, { useState, useEffect } from 'react';
import { Card, CardBody, Col, Row } from 'reactstrap';
import ReactApexChart from "react-apexcharts"
import axios from 'axios';
import { JobWidgetCharts } from './JobCharts';
// import { cryptoReports } from '../../common/data'
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


const ChartSection = () => {
    const [chartsData, setChartsData] = useState();
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem("token")
    const [role, setRole] = useState(null)
    const [orders, setOrders] = useState([]);
    const [userData, setUserData] = useState();
    const [proforma, setProforma] = useState([]);
    const [uniqueProforma, setUniqueProforma] = useState([]);
    const [grvCount, setGrvCount] = useState([]);
    const navigate = useNavigate();
    const [expense, setExpense] = useState([])

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
        const token = localStorage.getItem('token');

        axios.get(`${import.meta.env.VITE_APP_KEY}expense/add/`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((response) => {
                setExpense(response.data.data);
                // setFilteredData(response.data.data);
                // setLoading(false);
            })
            .catch((error) => {
                toast.error("There was an error fetching the data!");
                setLoading(false);
            });
    }, []);

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
        const fetchProformaData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}perfoma/invoices/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProforma(response?.data?.data);
            } catch (error) {
                toast.error("Error fetching proforma data");
            }
        };
        fetchProformaData();
    }, []);

    useEffect(() => {
        const fetchUniqueProformaData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}performa/invoice/staff/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUniqueProforma(response?.data?.data);
            } catch (error) {
                toast.error("Error fetching proforma data");
            }
        };
        fetchUniqueProformaData();
    }, []);

    useEffect(() => {
        const fetchGRVCount = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}grv/data/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setGrvCount(response?.data?.data);
            } catch (error) {
                toast.error("Error fetching GRV count");
            }
        };
        fetchGRVCount();
    }, []);

    if (loading) {
        return <p>Loading...</p>;
    }

    const todayBills = chartsData?.find(item => item?.title === "Today Bills");
    const waitingForConfirmation = chartsData?.find(item => item?.title === "Waiting For Confirmation");
    const shipped = chartsData?.find(item => item?.title === "Shipped");
    const proformaInvoices = chartsData?.find(item => item?.title === "Proforma Invoices");
    const goodsReturn = chartsData?.find(item => item?.title === "Goods Return");
    const grvWaitingForConfirmation = chartsData?.find(item => item?.title === "GRV waiting for confirmation");
    const waitingForApproval = chartsData?.find(item => item?.title === "Waiting For Approval");

    const invoiceApprovedCount = orders?.filter(order => order?.status === "Invoice Approved")?.length;

    const proformaCountAdmin = proforma?.length || 0;
    const uniqueProformaCount = uniqueProforma?.length || 0;

    const today = new Date().toISOString().split('T')[0];

    const totalAmountForCurrentUserFamilyToday = orders
        ?.filter(order =>
            order.family_id === userData &&
            order.order_date?.slice(0, 10) === today
        )
        ?.reduce((sum, order) => sum + (order.total_amount || 0), 0);

    const allTodayOrdersCount = orders?.filter(
        order => order?.order_date === today
    )?.length || 0;

    // Destructure from orders
    const familyIds = orders?.map(order => order.family_id);
    const orderDates = orders?.map(order => order.order_date);
    const waitingForConfirmationToday = orders?.filter(
        order => order?.status === "Waiting For Confirmation" && order.order_date === today
    )?.length;
    const shippedOrdersToday = orders?.filter(
        order => order?.status === "Shipped" && order.order_date === today
    )?.length;
    const shippedOrdersTodayStaff = orders?.filter(
        order =>
            order?.status === "Shipped" &&
            order?.order_date === today &&
            order?.family_id === userData
    ).length;

    const waitingForApprovalStaff = orders?.filter(
        order => order?.status === "Invoice Created" && order?.family_id === userData
    ).length;

    // from grv/data api
    const pendingGRVCount = grvCount?.filter(item => item?.status === "pending" && item?.family === userData)?.length;

    // Filter orders where family_id matches userData AND order_date matches today
    const userFamilyTodayOrderCount = orders?.filter(
        order => order?.family_id === userData && order?.order_date === today
    )?.length;

    const totalAmountSkatingAndCyclingToday = orders?.reduce((sum, order) => {
        const orderDate = order?.order_date?.slice(0, 10);
        if (
            (order.family_name === "skating" || order.family_name === "cycling") &&
            orderDate === today
        ) {
            return sum + (parseFloat(order.total_amount) || 0);
        }
        return sum;
    }, 0);

    const skatingAndCyclingTodayCount = orders?.filter(order =>
        (order.family_name === "skating" || order.family_name === "cycling") &&
        order.order_date === today
    )?.length || 0;

    const skatingTodayCount = orders?.filter(order =>
        (order.family_name === "skating") &&
        order.order_date === today
    )?.length || 0;

    const cyclingTodayCount = orders?.filter(order =>
        (order.family_name === "cycling") &&
        order.order_date === today
    )?.length || 0;

    const totalSkatingTodayAmount = orders?.reduce((sum, order) => {
        const orderDate = order?.order_date?.slice(0, 10);
        if (order.family_name === "skating" && orderDate === today) {
            return sum + (parseFloat(order.total_amount) || 0);
        }
        return sum;
    }, 0);

    const totalCyclingTodayAmount = orders?.reduce((sum, order) => {
        const orderDate = order?.order_date?.slice(0, 10);
        if (order.family_name === "cycling" && orderDate === today) {
            return sum + (parseFloat(order.total_amount) || 0);
        }
        return sum;
    }, 0);

    return (
        <React.Fragment>

            <Row>
                {(role === "warehouse" || role === "Warehouse Admin") && (
                    <>
                        <Col lg={3} style={{ cursor: "pointer" }}>
                            <Card className="mini-stats-wid" onClick={() => navigate("/Orders/")}>
                                <CardBody>
                                    <div className="d-flex">
                                        <div className="flex-grow-1">
                                            <p className="text-muted fw-medium">Waiting For Packing</p>
                                            <h4 className="mb-0"></h4>
                                        </div>

                                    </div>
                                </CardBody>

                            </Card>
                        </Col>
                        <Col lg={3} style={{ cursor: "pointer" }}>
                            <Card className="mini-stats-wid" onClick={() => navigate("/Orders2")}>
                                <CardBody>
                                    <div className="d-flex">
                                        <div className="flex-grow-1">
                                            <p className="text-muted fw-medium">Waiting For Shipping</p>
                                            <h4 className="mb-0"></h4>
                                        </div>

                                    </div>
                                </CardBody>

                            </Card>
                        </Col>
                    </>
                )}

                {(role === "ADMIN" || role === "BDM" || role === "Accounts / Accounting" || role === 'CSO' || role === 'Marketing') && (
                    <Col lg={3}>
                        <div style={{ cursor: "pointer" }}
                            onClick={() => navigate("/dashboard/todaysbill-details")}>
                            <Card className="mini-stats-wid">
                                <CardBody>
                                    <div className="d-flex">
                                        <div className="flex-grow-1">
                                            <p className="text-muted fw-medium">Todays Bill</p>
                                            <h4 className="mb-0">
                                                {role === "ADMIN" || role === "CEO"
                                                    ? allTodayOrdersCount
                                                    : role === "CSO"
                                                        ? skatingAndCyclingTodayCount
                                                        : userFamilyTodayOrderCount}
                                            </h4>
                                        </div>
                                    </div>
                                </CardBody>
                                <div className="card-body border-top py-3">
                                    <p className="mb-0">
                                        <span className="badge badge-soft-success me-2">
                                            <i className="bx bx-trending-up align-bottom me-1 text-success"></i> {todayBills?.percentageValue}
                                        </span>
                                        Increase last month
                                    </p>
                                </div>
                            </Card>
                        </div>
                    </Col>
                )}


                {(role === "CSO") && (
                    <Col lg={3}>
                        <div style={{ cursor: "pointer" }}>
                            <Card className="mini-stats-wid">
                                <CardBody>
                                    <div className="d-flex">
                                        <div className="flex-grow-1">
                                            <p className="text-muted fw-medium">SKATING</p>
                                            <h5>Todays Bill: <strong> {skatingTodayCount}</strong> </h5>
                                            <h5>Todays Volume: ₹ <strong> {totalSkatingTodayAmount?.toFixed(2)}</strong> </h5>
                                        </div>
                                        <div className="flex-shrink-0 align-self-center">
                                            {/* Optional Chart */}
                                        </div>
                                    </div>
                                </CardBody>
                                <div className="card-body border-top py-3">
                                </div>
                            </Card>
                        </div>
                    </Col>
                )}
                {(role === "CSO") && (
                    <Col lg={3}>
                        <div style={{ cursor: "pointer" }}>
                            <Card className="mini-stats-wid">
                                <CardBody>
                                    <div className="d-flex">
                                        <div className="flex-grow-1">
                                            <p className="text-muted fw-medium">CYCLING</p>
                                            <h5>Todays Bill: <strong> {cyclingTodayCount}</strong> </h5>
                                            <h5>Todays Volume: ₹ <strong> {totalCyclingTodayAmount?.toFixed(2)}</strong> </h5>
                                        </div>
                                        <div className="flex-shrink-0 align-self-center">
                                            {/* Optional Chart */}
                                        </div>
                                    </div>
                                </CardBody>
                                <div className="card-body border-top py-3">
                                </div>
                            </Card>
                        </div>
                    </Col>
                )}

                {(role === "BDM" || role === 'CSO') && (
                    <Col lg={3}>
                        <div style={{ cursor: "pointer" }}>
                            <Card className="mini-stats-wid">
                                <CardBody>
                                    <div className="d-flex">
                                        <div className="flex-grow-1">
                                            <p className="text-muted fw-medium">Todays Total Volume</p>
                                            <h4>
                                                ₹ {role === "CSO"
                                                    ? totalAmountSkatingAndCyclingToday
                                                    : totalAmountForCurrentUserFamilyToday}
                                            </h4>
                                        </div>
                                        <div className="flex-shrink-0 align-self-center">
                                            {/* Optional Chart */}
                                        </div>
                                    </div>
                                </CardBody>
                                <div className="card-body border-top py-3">
                                    <p className="mb-0">
                                        <span className="badge badge-soft-success me-2">
                                            <i className="bx bx-trending-up align-bottom me-1 text-success"></i> {todayBills?.percentageValue}
                                        </span>
                                        Increase last month
                                    </p>
                                </div>
                            </Card>
                        </div>
                    </Col>
                )}

                {(role === "ADMIN" || role === "Accounts / Accounting") && (
                    <Col lg={3} style={{ cursor: "pointer" }}
                        onClick={() => navigate("/dashboard/waitingforconfirmation-details")}>
                        <Card className="mini-stats-wid">
                            <CardBody>
                                <div className="d-flex">
                                    <div className="flex-grow-1">
                                        <p className="text-muted fw-medium">Waiting For Confirmation</p>
                                        <h4 className="mb-0">{waitingForConfirmationToday}</h4>
                                    </div>
                                    <div className="flex-shrink-0 align-self-center">
                                        {/* Optional Chart */}
                                    </div>
                                </div>
                            </CardBody>
                            <div className="card-body border-top py-3">
                                <p className="mb-0">
                                    <span className="badge badge-soft-success me-2">
                                        <i className="bx bx-trending-up align-bottom me-1 text-success"></i>{waitingForConfirmation?.percentageValue || 0}
                                    </span>
                                    Increase last month
                                </p>
                            </div>
                        </Card>
                    </Col>
                )}

                {(role === "ADMIN" || role === "BDM" || role === "Accounts / Accounting") && (
                    <Col lg={3}>
                        <div style={{ cursor: "pointer" }}
                            onClick={() => navigate("/dashboard/shipped-details")}>
                            <Card className="mini-stats-wid">
                                <CardBody>
                                    <div className="d-flex">
                                        <div className="flex-grow-1">
                                            <p className="text-muted fw-medium">Shipped</p>
                                            <h4 className="mb-0"> {role === "ADMIN" ? (shippedOrdersToday) : shippedOrdersTodayStaff}</h4>
                                        </div>
                                        <div className="flex-shrink-0 align-self-center">
                                            {/* Optional Chart */}
                                        </div>
                                    </div>
                                </CardBody>
                                <div className="card-body border-top py-3">
                                    <p className="mb-0">
                                        <span className="badge badge-soft-success me-2">
                                            <i className="bx bx-trending-up align-bottom me-1 text-success"></i>{shipped?.percentageValue || 0}
                                        </span>
                                        Increase last month
                                    </p>
                                </div>
                            </Card>
                        </div>
                    </Col>
                )}

                {(role === "ADMIN" || role === "BDM" || role === "Accounts / Accounting") && (
                    <Col lg={3}>
                        <div style={{ cursor: "pointer" }}
                            onClick={() => navigate("/perfoma/invoices/")}>
                            <Card className="mini-stats-wid">
                                <CardBody>
                                    <div className="d-flex">
                                        <div className="flex-grow-1">
                                            <p className="text-muted fw-medium">Proforma Invoices</p>
                                            <h4 className="mb-0">{role === "ADMIN" ? (proformaCountAdmin) : uniqueProformaCount}</h4>
                                        </div>
                                        <div className="flex-shrink-0 align-self-center">
                                            {/* Optional Chart */}
                                        </div>
                                    </div>
                                </CardBody>
                                <div className="card-body border-top py-3">
                                    <p className="mb-0">
                                        <span className="badge badge-soft-success me-2">
                                            <i className="bx bx-trending-up align-bottom me-1 text-success"></i>{proformaInvoices?.percentageValue || 0}
                                        </span>
                                        Increase last month
                                    </p>
                                </div>
                            </Card>
                        </div>
                    </Col>
                )}

                {(role === "ADMIN" || role === "Accounts / Accounting") && (
                    <Col lg={3} style={{ cursor: "pointer" }}
                        onClick={() => navigate("/beposoft/grv/view/")}>
                        <Card className="mini-stats-wid">
                            <CardBody>
                                <div className="d-flex">
                                    <div className="flex-grow-1">
                                        <p className="text-muted fw-medium">Goods Return</p>
                                        <h4 className="mb-0">{goodsReturn?.order || 0}</h4>
                                    </div>
                                    <div className="flex-shrink-0 align-self-center">
                                        {/* Optional Chart */}
                                    </div>
                                </div>
                            </CardBody>
                            <div className="card-body border-top py-3">
                                <p className="mb-0">
                                    <span className="badge badge-soft-success me-2">
                                        <i className="bx bx-trending-up align-bottom me-1 text-success"></i>{goodsReturn?.percentageValue || 0}
                                    </span>
                                    Increase last month
                                </p>
                            </div>
                        </Card>
                    </Col>
                )}

                {(role === "ADMIN" || role === "BDM" || role === "Accounts / Accounting") && (
                    <Col lg={3}>
                        <div style={{ cursor: "pointer" }}
                            onClick={() => navigate("/dashboard/grvwaitingforconfirmation-details")}>
                            <Card className="mini-stats-wid">
                                <CardBody>
                                    <div className="d-flex">
                                        <div className="flex-grow-1">
                                            <p className="text-muted fw-medium">GRV waiting for confirmation</p>
                                            <h4 className="mb-0">
                                                {role === "ADMIN"
                                                    ? (grvWaitingForConfirmation?.order)
                                                    : (pendingGRVCount)}
                                            </h4>

                                        </div>
                                        <div className="flex-shrink-0 align-self-center">
                                            {/* Optional Chart */}
                                        </div>
                                    </div>
                                </CardBody>
                                <div className="card-body border-top py-3">
                                    <p className="mb-0">
                                        <span className="badge badge-soft-success me-2">
                                            <i className="bx bx-trending-up align-bottom me-1 text-success"></i>{grvWaitingForConfirmation?.percentageValue || 0}
                                        </span>
                                        Increase last month
                                    </p>
                                </div>
                            </Card>
                        </div>
                    </Col>
                )}

                {(role === "ADMIN" || role === "BDM" || role === "Accounts / Accounting") && (
                    <Col lg={3}>
                        <div style={{ cursor: "pointer" }}
                            onClick={() => navigate("/dashboard/waitingforapproval-details")}>
                            <Card className="mini-stats-wid">
                                <CardBody>
                                    <div className="d-flex">
                                        <div className="flex-grow-1">
                                            <p className="text-muted fw-medium">Waiting For Approval</p>
                                            <h4 className="mb-0">{role === "ADMIN" ? (waitingForApproval?.order) : waitingForApprovalStaff}</h4>
                                        </div>
                                        <div className="flex-shrink-0 align-self-center">
                                            {/* Optional Chart */}
                                        </div>
                                    </div>
                                </CardBody>
                                <div className="card-body border-top py-3">
                                    <p className="mb-0">
                                        <span className="badge badge-soft-success me-2">
                                            <i className="bx bx-trending-up align-bottom me-1 text-success"></i>{waitingForApproval?.percentageValue}
                                        </span>
                                        Increase last month
                                    </p>
                                </div>
                            </Card>
                        </div>
                    </Col>
                )}
                {(role === "BDO") && (
                    <Col lg={3}>
                        <div style={{ cursor: "pointer" }}
                            onClick={() => navigate("/managed/family/order/")}>
                            <Card className="mini-stats-wid">
                                <CardBody>
                                    <div className="d-flex">
                                        <div className="flex-grow-1">
                                            <p className="text-muted fw-medium">ORDERS</p>
                                        </div>
                                        <div className="flex-shrink-0 align-self-center">
                                            {/* Optional Chart */}
                                        </div>
                                    </div>
                                </CardBody>
                                <div className="card-body border-top py-3">
                                </div>
                            </Card>
                        </div>
                    </Col>
                )}
                {(role === "BDO") && (
                    <Col lg={3}>
                        <div style={{ cursor: "pointer" }}
                            onClick={() => navigate("/all/staff/customers/")}>
                            <Card className="mini-stats-wid">
                                <CardBody>
                                    <div className="d-flex">
                                        <div className="flex-grow-1">
                                            <p className="text-muted fw-medium">CUSTOMERS</p>
                                        </div>
                                        <div className="flex-shrink-0 align-self-center">
                                            {/* Optional Chart */}
                                        </div>
                                    </div>
                                </CardBody>
                                <div className="card-body border-top py-3">
                                </div>
                            </Card>
                        </div>
                    </Col>
                )}
            </Row>
        </React.Fragment>
    );
}

export default ChartSection;