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
    const [orderCount, setOrderCount] = useState();
    const [myOrderData, setMyOrderData] = useState();
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
        const fetchMyOrderData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}my/order/summary/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMyOrderData(response?.data);
                console.log("Order Count:", response?.data);
            } catch (error) {
                toast.error('Error fetching order count:');
            }
        };
        fetchMyOrderData();
    }, []);

    useEffect(() => {
        const fetchOrderCount = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}orders/status/count/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setOrderCount(response?.data);
            } catch (error) {
                toast.error('Error fetching order count:');
            }
        };
        fetchOrderCount();
    }, []);

    const getTodayStatusCount = (status) =>
        orderCount?.today?.find(item => item.status === status)?.count || 0;

    const getAllStatusCount = (status) =>
        orderCount?.all?.find(item => item.status === status)?.count || 0;


    // WAITING FOR APPROVAL
    const waitingForApprovalToday =
        getTodayStatusCount("Invoice Created");

    const waitingForApprovalAll =
        getAllStatusCount("Invoice Created");


    // INVOICE APPROVED
    const invoiceApprovedToday =
        getTodayStatusCount("Invoice Approved");

    const invoiceApprovedAll =
        getAllStatusCount("Invoice Approved");


    // PRE BOOKED
    const preBookedToday =
        getTodayStatusCount("Pre Booked");

    const preBookedAll =
        getAllStatusCount("Pre Booked");


    // WAITING FOR CONFIRMATION
    const waitingForConfirmationStatusToday =
        getTodayStatusCount("Waiting For Confirmation");

    const waitingForConfirmationStatusAll =
        getAllStatusCount("Waiting For Confirmation");


    // DELIVERY ORDER
    const toPrintToday =
        getTodayStatusCount("To Print");

    const toPrintAll =
        getAllStatusCount("To Print");


    // PACKING UNDER PROGRESS
    const packingUnderProgressToday =
        getTodayStatusCount("Packing under progress");

    const packingUnderProgressAll =
        getAllStatusCount("Packing under progress");


    // PACKED FOR DELIVERY
    const packedForDeliveryToday =
        getTodayStatusCount("Packed");

    const packedForDeliveryAll =
        getAllStatusCount("Packed");


    // OUT FOR DELIVERY
    const outForDeliveryToday =
        getTodayStatusCount("Ready to ship");

    const outForDeliveryAll =
        getAllStatusCount("Ready to ship");


    // RETURN FROM DELIVERY
    const returnFromDeliveryToday =
        getTodayStatusCount("Return From Delivery");

    const returnFromDeliveryAll =
        getAllStatusCount("Return From Delivery");


    // SHIPPED
    const shippedToday =
        getTodayStatusCount("Shipped");

    const shippedAll =
        getAllStatusCount("Shipped");


    // INVOICE REJECTED
    const invoiceRejectedToday =
        getTodayStatusCount("Invoice Rejected");

    const invoiceRejectedAll =
        getAllStatusCount("Invoice Rejected");


    useEffect(() => {
        const fetchOrdersData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}orders/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

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
        order => order?.status === "Waiting For Confirmation"
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

                {/* warehouse & Warehouse Admin dashboard */}

                {(role === "warehouse" || role === "Warehouse Admin") && (
                    <Row className="g-3 mb-3">

                        {/* DELIVERY ORDER */}
                        <Col xs={12} sm={6} md={6} lg={4} xl={3} xxl>
                            <Card
                                onClick={() => navigate("/orders/toprint")}
                                className="h-100 border-0 shadow-sm"
                                style={{
                                    cursor: "pointer",
                                    borderRadius: "16px",
                                    minHeight: "155px",
                                    background: "#f8fbff",
                                    borderLeft: "5px solid #3b82f6"
                                }}
                            >
                                <CardBody className="p-3 p-md-4">

                                    <p
                                        className="fw-semibold mb-2"
                                        style={{
                                            color: "#475569",
                                            fontSize: "14px"
                                        }}
                                    >
                                        Delivery Order (DO)
                                    </p>

                                    <h2
                                        className="fw-bold mb-3"
                                        style={{
                                            color: "#1e3a8a",
                                            fontSize: "30px"
                                        }}
                                    >
                                        {toPrintAll}
                                    </h2>

                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            backgroundColor: "#dbeafe",
                                            color: "#1d4ed8",
                                            padding: "7px 12px",
                                            borderRadius: "8px",
                                            fontSize: "13px",
                                            fontWeight: "500"
                                        }}
                                    >
                                        Today:&nbsp;
                                        <strong style={{ fontWeight: "700" }}>
                                            {toPrintToday}
                                        </strong>
                                    </span>

                                </CardBody>
                            </Card>
                        </Col>


                        {/* PACKED FOR DELIVERY */}
                        <Col xs={12} sm={6} md={6} lg={4} xl={3} xxl>
                            <Card
                                onClick={() => navigate("/orders/packed")}
                                className="h-100 border-0 shadow-sm"
                                style={{
                                    cursor: "pointer",
                                    borderRadius: "16px",
                                    minHeight: "155px",
                                    background: "#f5fdff",
                                    borderLeft: "5px solid #06b6d4"
                                }}
                            >
                                <CardBody className="p-3 p-md-4">

                                    <p
                                        className="fw-semibold mb-2"
                                        style={{
                                            color: "#475569",
                                            fontSize: "14px"
                                        }}
                                    >
                                        Packed For Delivery (PFD)
                                    </p>

                                    <h2
                                        className="fw-bold mb-3"
                                        style={{
                                            color: "#155e75",
                                            fontSize: "30px"
                                        }}
                                    >
                                        {packedForDeliveryAll}
                                    </h2>

                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            backgroundColor: "#cffafe",
                                            color: "#0e7490",
                                            padding: "7px 12px",
                                            borderRadius: "8px",
                                            fontSize: "13px",
                                            fontWeight: "500"
                                        }}
                                    >
                                        Today:&nbsp;
                                        <strong style={{ fontWeight: "700" }}>
                                            {packedForDeliveryToday}
                                        </strong>
                                    </span>

                                </CardBody>
                            </Card>
                        </Col>

                        {/* DGM */}
                        <Col xs={12} sm={6} md={6} lg={4} xl={3} xxl>
                            <Card
                                onClick={() => navigate("/daily/good/movment/")}
                                className="h-100 border-0 shadow-sm"
                                style={{
                                    cursor: "pointer",
                                    borderRadius: "16px",
                                    minHeight: "155px",
                                    background: "#fff7f7",
                                    borderLeft: "5px solid #ef4444"
                                }}
                            >
                                <CardBody className="p-3 p-md-4">

                                    <p
                                        className="fw-semibold mb-2"
                                        style={{
                                            color: "#475569",
                                            fontSize: "14px"
                                        }}
                                    >
                                        Daily Goods Movement
                                    </p>

                                    <h2>DGM</h2>
                                    <span>Check daily goods movement</span>

                                </CardBody>
                            </Card>
                        </Col>


                        {/* OUT FOR DELIVERY */}
                        <Col xs={12} sm={6} md={6} lg={4} xl={3} xxl>
                            <Card
                                onClick={() => navigate("/orders/readytoship")}
                                className="h-100 border-0 shadow-sm"
                                style={{
                                    cursor: "pointer",
                                    borderRadius: "16px",
                                    minHeight: "155px",
                                    background: "#fffaf3",
                                    borderLeft: "5px solid #f59e0b"
                                }}
                            >
                                <CardBody className="p-3 p-md-4">

                                    <p
                                        className="fw-semibold mb-2"
                                        style={{
                                            color: "#475569",
                                            fontSize: "14px"
                                        }}
                                    >
                                        Out For Delivery (OFD)
                                    </p>

                                    <h2
                                        className="fw-bold mb-3"
                                        style={{
                                            color: "#92400e",
                                            fontSize: "30px"
                                        }}
                                    >
                                        {outForDeliveryAll}
                                    </h2>

                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            backgroundColor: "#fef3c7",
                                            color: "#b45309",
                                            padding: "7px 12px",
                                            borderRadius: "8px",
                                            fontSize: "13px",
                                            fontWeight: "500"
                                        }}
                                    >
                                        Today:&nbsp;
                                        <strong style={{ fontWeight: "700" }}>
                                            {outForDeliveryToday}
                                        </strong>
                                    </span>

                                </CardBody>
                            </Card>
                        </Col>


                        {/* RETURN FROM DELIVERY */}
                        <Col xs={12} sm={6} md={6} lg={4} xl={3} xxl>
                            <Card
                                onClick={() => navigate("/orders/returnfromdelivery")}
                                className="h-100 border-0 shadow-sm"
                                style={{
                                    cursor: "pointer",
                                    borderRadius: "16px",
                                    minHeight: "155px",
                                    background: "#fff7f7",
                                    borderLeft: "5px solid #ef4444"
                                }}
                            >
                                <CardBody className="p-3 p-md-4">

                                    <p
                                        className="fw-semibold mb-2"
                                        style={{
                                            color: "#475569",
                                            fontSize: "14px"
                                        }}
                                    >
                                        Return From Delivery (RFD)
                                    </p>

                                    <h2
                                        className="fw-bold mb-3"
                                        style={{
                                            color: "#991b1b",
                                            fontSize: "30px"
                                        }}
                                    >
                                        {returnFromDeliveryAll}
                                    </h2>

                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            backgroundColor: "#fee2e2",
                                            color: "#b91c1c",
                                            padding: "7px 12px",
                                            borderRadius: "8px",
                                            fontSize: "13px",
                                            fontWeight: "500"
                                        }}
                                    >
                                        Today:&nbsp;
                                        <strong style={{ fontWeight: "700" }}>
                                            {returnFromDeliveryToday}
                                        </strong>
                                    </span>

                                </CardBody>
                            </Card>
                        </Col>


                        {/* SHIPPED */}
                        <Col xs={12} sm={6} md={6} lg={4} xl={3} xxl>
                            <Card
                                onClick={() => navigate("/orders/shipped")}
                                className="h-100 border-0 shadow-sm"
                                style={{
                                    cursor: "pointer",
                                    borderRadius: "16px",
                                    minHeight: "155px",
                                    background: "#f5fff8",
                                    borderLeft: "5px solid #22c55e"
                                }}
                            >
                                <CardBody className="p-3 p-md-4">

                                    <p
                                        className="fw-semibold mb-2"
                                        style={{
                                            color: "#475569",
                                            fontSize: "14px"
                                        }}
                                    >
                                        Shipped
                                    </p>

                                    <h2
                                        className="fw-bold mb-3"
                                        style={{
                                            color: "#166534",
                                            fontSize: "30px"
                                        }}
                                    >
                                        {shippedAll}
                                    </h2>

                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            backgroundColor: "#dcfce7",
                                            color: "#15803d",
                                            padding: "7px 12px",
                                            borderRadius: "8px",
                                            fontSize: "13px",
                                            fontWeight: "500"
                                        }}
                                    >
                                        Today:&nbsp;
                                        <strong style={{ fontWeight: "700" }}>
                                            {shippedToday}
                                        </strong>
                                    </span>

                                </CardBody>
                            </Card>
                        </Col>

                    </Row>
                )}

                {/* ADMIN & Accounts / Accounting dashboard */}

                {(role === "ADMIN" || role === "Accounts / Accounting" || role === "COO") && (
                    <Row className="g-3 mb-3">

                        <Col xs={12} sm={6} md={6} lg={4} xl={3} xxl={2}>
                            <Card
                                onClick={() => navigate("/dashboard/todaysbill-details")}
                                className="h-100 border-0 shadow-sm"
                                style={{
                                    cursor: "pointer",
                                    borderRadius: "16px",
                                    minHeight: "155px",
                                    background: "#f8fbff",
                                    borderLeft: "5px solid #3b82f6"
                                }}
                            >
                                <CardBody className="p-3 p-md-4">

                                    <p
                                        className="fw-semibold mb-2"
                                        style={{
                                            color: "#475569",
                                            fontSize: "14px"
                                        }}
                                    >
                                        Today's Bill
                                    </p>

                                    <h2
                                        className="fw-bold mb-3"
                                        style={{
                                            color: "#1e3a8a",
                                            fontSize: "30px"
                                        }}
                                    >
                                        {allTodayOrdersCount}
                                    </h2>

                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            backgroundColor: "#dbeafe",
                                            color: "#1d4ed8",
                                            padding: "7px 12px",
                                            borderRadius: "8px",
                                            fontSize: "13px",
                                            fontWeight: "500"
                                        }}
                                    >
                                        Today's Orders
                                    </span>

                                </CardBody>
                            </Card>
                        </Col>

                        {/* WAITING FOR APPROVAL */}
                        <Col xs={12} sm={6} md={6} lg={4} xl={3} xxl={2}>
                            <Card
                                onClick={() => navigate("/orders/invoicecreated")}
                                className="h-100 border-0 shadow-sm"
                                style={{
                                    cursor: "pointer",
                                    borderRadius: "16px",
                                    minHeight: "155px",
                                    background: "#f8fbff",
                                    borderLeft: "5px solid #3b82f6"
                                }}
                            >
                                <CardBody className="p-3 p-md-4">

                                    <p
                                        className="fw-semibold mb-2"
                                        style={{
                                            color: "#475569",
                                            fontSize: "14px"
                                        }}
                                    >
                                        Waiting For Approval
                                    </p>

                                    <h2
                                        className="fw-bold mb-3"
                                        style={{
                                            color: "#1e3a8a",
                                            fontSize: "30px"
                                        }}
                                    >
                                        {waitingForApprovalAll}
                                    </h2>

                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            backgroundColor: "#dbeafe",
                                            color: "#1d4ed8",
                                            padding: "7px 12px",
                                            borderRadius: "8px",
                                            fontSize: "13px",
                                            fontWeight: "500"
                                        }}
                                    >
                                        Today:&nbsp;
                                        <strong style={{ fontWeight: "700" }}>
                                            {waitingForApprovalToday}
                                        </strong>
                                    </span>

                                </CardBody>
                            </Card>
                        </Col>


                        {/* INVOICE APPROVED */}
                        <Col xs={12} sm={6} md={6} lg={4} xl={3} xxl={2}>
                            <Card
                                onClick={() => navigate("/orders/invoiceapproved")}
                                className="h-100 border-0 shadow-sm"
                                style={{
                                    cursor: "pointer",
                                    borderRadius: "16px",
                                    minHeight: "155px",
                                    background: "#f5fdff",
                                    borderLeft: "5px solid #06b6d4"
                                }}
                            >
                                <CardBody className="p-3 p-md-4">

                                    <p
                                        className="fw-semibold mb-2"
                                        style={{
                                            color: "#475569",
                                            fontSize: "14px"
                                        }}
                                    >
                                        Invoice Approved
                                    </p>

                                    <h2
                                        className="fw-bold mb-3"
                                        style={{
                                            color: "#155e75",
                                            fontSize: "30px"
                                        }}
                                    >
                                        {invoiceApprovedAll}
                                    </h2>

                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            backgroundColor: "#cffafe",
                                            color: "#0e7490",
                                            padding: "7px 12px",
                                            borderRadius: "8px",
                                            fontSize: "13px",
                                            fontWeight: "500"
                                        }}
                                    >
                                        Today:&nbsp;
                                        <strong style={{ fontWeight: "700" }}>
                                            {invoiceApprovedToday}
                                        </strong>
                                    </span>

                                </CardBody>
                            </Card>
                        </Col>

                        {/* Waiting For Confirmation */}
                        <Col xs={12} sm={6} md={6} lg={4} xl={3} xxl={2}>
                            <Card
                                onClick={() => navigate("/orders/waitingforconfirmation")}
                                className="h-100 border-0 shadow-sm"
                                style={{
                                    cursor: "pointer",
                                    borderRadius: "16px",
                                    minHeight: "155px",
                                    background: "#fff7f7",
                                    borderLeft: "5px solid #ef4444"
                                }}
                            >
                                <CardBody className="p-3 p-md-4">

                                    <p
                                        className="fw-semibold mb-2"
                                        style={{
                                            color: "#475569",
                                            fontSize: "14px"
                                        }}
                                    >
                                        Waiting For Confirmation
                                    </p>

                                    <h2
                                        className="fw-bold mb-3"
                                        style={{
                                            color: "#155e75",
                                            fontSize: "30px"
                                        }}
                                    >
                                        {waitingForConfirmationStatusAll}
                                    </h2>

                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            backgroundColor: "#cffafe",
                                            color: "#0e7490",
                                            padding: "7px 12px",
                                            borderRadius: "8px",
                                            fontSize: "13px",
                                            fontWeight: "500"
                                        }}
                                    >
                                        Today:&nbsp;
                                        <strong style={{ fontWeight: "700" }}>
                                            {waitingForConfirmationStatusToday}
                                        </strong>
                                    </span>

                                </CardBody>
                            </Card>
                        </Col>


                        {/* Delivery Order */}
                        <Col xs={12} sm={6} md={6} lg={4} xl={3} xxl={2}>
                            <Card
                                onClick={() => navigate("/orders/toprint")}
                                className="h-100 border-0 shadow-sm"
                                style={{
                                    cursor: "pointer",
                                    borderRadius: "16px",
                                    minHeight: "155px",
                                    background: "#fffaf3",
                                    borderLeft: "5px solid #f59e0b"
                                }}
                            >
                                <CardBody className="p-3 p-md-4">

                                    <p
                                        className="fw-semibold mb-2"
                                        style={{
                                            color: "#475569",
                                            fontSize: "14px"
                                        }}
                                    >
                                        Delivery Order (DO)
                                    </p>

                                    <h2
                                        className="fw-bold mb-3"
                                        style={{
                                            color: "#92400e",
                                            fontSize: "30px"
                                        }}
                                    >
                                        {toPrintAll}
                                    </h2>

                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            backgroundColor: "#fef3c7",
                                            color: "#b45309",
                                            padding: "7px 12px",
                                            borderRadius: "8px",
                                            fontSize: "13px",
                                            fontWeight: "500"
                                        }}
                                    >
                                        Today:&nbsp;
                                        <strong style={{ fontWeight: "700" }}>
                                            {toPrintToday}
                                        </strong>
                                    </span>

                                </CardBody>
                            </Card>
                        </Col>

                        {/* Packing Under Progress */}
                        <Col xs={12} sm={6} md={6} lg={4} xl={3} xxl={2}>
                            <Card
                                onClick={() => navigate("/orders/packingunderprogress")}
                                className="h-100 border-0 shadow-sm"
                                style={{
                                    cursor: "pointer",
                                    borderRadius: "16px",
                                    minHeight: "155px",
                                    background: "#fffaf3",
                                    borderLeft: "5px solid #f59e0b"
                                }}
                            >
                                <CardBody className="p-3 p-md-4">

                                    <p
                                        className="fw-semibold mb-2"
                                        style={{
                                            color: "#475569",
                                            fontSize: "14px"
                                        }}
                                    >
                                        Packing Under Progress
                                    </p>

                                    <h2
                                        className="fw-bold mb-3"
                                        style={{
                                            color: "#92400e",
                                            fontSize: "30px"
                                        }}
                                    >
                                        {packingUnderProgressAll}
                                    </h2>

                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            backgroundColor: "#fef3c7",
                                            color: "#b45309",
                                            padding: "7px 12px",
                                            borderRadius: "8px",
                                            fontSize: "13px",
                                            fontWeight: "500"
                                        }}
                                    >
                                        Today:&nbsp;
                                        <strong style={{ fontWeight: "700" }}>
                                            {packingUnderProgressToday}
                                        </strong>
                                    </span>

                                </CardBody>
                            </Card>
                        </Col>


                        {/* PACKED FOR DELIVERY */}
                        <Col xs={12} sm={6} md={6} lg={4} xl={3} xxl={2}>
                            <Card
                                onClick={() => navigate("/orders/packed")}
                                className="h-100 border-0 shadow-sm"
                                style={{
                                    cursor: "pointer",
                                    borderRadius: "16px",
                                    minHeight: "155px",
                                    background: "#f5fdff",
                                    borderLeft: "5px solid #06b6d4"
                                }}
                            >
                                <CardBody className="p-3 p-md-4">

                                    <p
                                        className="fw-semibold mb-2"
                                        style={{
                                            color: "#475569",
                                            fontSize: "14px"
                                        }}
                                    >
                                        Packed For Delivery (PFD)
                                    </p>

                                    <h2
                                        className="fw-bold mb-3"
                                        style={{
                                            color: "#155e75",
                                            fontSize: "30px"
                                        }}
                                    >
                                        {packedForDeliveryAll}
                                    </h2>

                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            backgroundColor: "#cffafe",
                                            color: "#0e7490",
                                            padding: "7px 12px",
                                            borderRadius: "8px",
                                            fontSize: "13px",
                                            fontWeight: "500"
                                        }}
                                    >
                                        Today:&nbsp;
                                        <strong style={{ fontWeight: "700" }}>
                                            {packedForDeliveryToday}
                                        </strong>
                                    </span>

                                </CardBody>
                            </Card>
                        </Col>

                        {/* DGM */}
                        <Col xs={12} sm={6} md={6} lg={4} xl={3} xxl={2}>
                            <Card
                                onClick={() => navigate("/daily/good/movment/")}
                                className="h-100 border-0 shadow-sm"
                                style={{
                                    cursor: "pointer",
                                    borderRadius: "16px",
                                    minHeight: "155px",
                                    background: "#fff7f7",
                                    borderLeft: "5px solid #ef4444"
                                }}
                            >
                                <CardBody className="p-3 p-md-4">

                                    <p
                                        className="fw-semibold mb-2"
                                        style={{
                                            color: "#475569",
                                            fontSize: "14px"
                                        }}
                                    >
                                        Daily Goods Movement
                                    </p>

                                    <h2>DGM</h2>
                                    <span>Check daily goods movement</span>

                                </CardBody>
                            </Card>
                        </Col>


                        {/* OUT FOR DELIVERY */}
                        <Col xs={12} sm={6} md={6} lg={4} xl={3} xxl={2}>
                            <Card
                                onClick={() => navigate("/orders/readytoship")}
                                className="h-100 border-0 shadow-sm"
                                style={{
                                    cursor: "pointer",
                                    borderRadius: "16px",
                                    minHeight: "155px",
                                    background: "#fffaf3",
                                    borderLeft: "5px solid #f59e0b"
                                }}
                            >
                                <CardBody className="p-3 p-md-4">

                                    <p
                                        className="fw-semibold mb-2"
                                        style={{
                                            color: "#475569",
                                            fontSize: "14px"
                                        }}
                                    >
                                        Out For Delivery (OFD)
                                    </p>

                                    <h2
                                        className="fw-bold mb-3"
                                        style={{
                                            color: "#92400e",
                                            fontSize: "30px"
                                        }}
                                    >
                                        {outForDeliveryAll}
                                    </h2>

                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            backgroundColor: "#fef3c7",
                                            color: "#b45309",
                                            padding: "7px 12px",
                                            borderRadius: "8px",
                                            fontSize: "13px",
                                            fontWeight: "500"
                                        }}
                                    >
                                        Today:&nbsp;
                                        <strong style={{ fontWeight: "700" }}>
                                            {outForDeliveryToday}
                                        </strong>
                                    </span>

                                </CardBody>
                            </Card>
                        </Col>


                        {/* RETURN FROM DELIVERY */}
                        <Col xs={12} sm={6} md={6} lg={4} xl={3} xxl={2}>
                            <Card
                                onClick={() => navigate("/orders/returnfromdelivery")}
                                className="h-100 border-0 shadow-sm"
                                style={{
                                    cursor: "pointer",
                                    borderRadius: "16px",
                                    minHeight: "155px",
                                    background: "#fff7f7",
                                    borderLeft: "5px solid #ef4444"
                                }}
                            >
                                <CardBody className="p-3 p-md-4">

                                    <p
                                        className="fw-semibold mb-2"
                                        style={{
                                            color: "#475569",
                                            fontSize: "14px"
                                        }}
                                    >
                                        Return From Delivery (RFD)
                                    </p>

                                    <h2
                                        className="fw-bold mb-3"
                                        style={{
                                            color: "#991b1b",
                                            fontSize: "30px"
                                        }}
                                    >
                                        {returnFromDeliveryAll}
                                    </h2>

                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            backgroundColor: "#fee2e2",
                                            color: "#b91c1c",
                                            padding: "7px 12px",
                                            borderRadius: "8px",
                                            fontSize: "13px",
                                            fontWeight: "500"
                                        }}
                                    >
                                        Today:&nbsp;
                                        <strong style={{ fontWeight: "700" }}>
                                            {returnFromDeliveryToday}
                                        </strong>
                                    </span>

                                </CardBody>
                            </Card>
                        </Col>


                        {/* SHIPPED */}
                        <Col xs={12} sm={6} md={6} lg={4} xl={3} xxl={2}>
                            <Card
                                onClick={() => navigate("/orders/shipped")}
                                className="h-100 border-0 shadow-sm"
                                style={{
                                    cursor: "pointer",
                                    borderRadius: "16px",
                                    minHeight: "155px",
                                    background: "#f5fff8",
                                    borderLeft: "5px solid #22c55e"
                                }}
                            >
                                <CardBody className="p-3 p-md-4">

                                    <p
                                        className="fw-semibold mb-2"
                                        style={{
                                            color: "#475569",
                                            fontSize: "14px"
                                        }}
                                    >
                                        Shipped
                                    </p>

                                    <h2
                                        className="fw-bold mb-3"
                                        style={{
                                            color: "#166534",
                                            fontSize: "30px"
                                        }}
                                    >
                                        {shippedAll}
                                    </h2>

                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            backgroundColor: "#dcfce7",
                                            color: "#15803d",
                                            padding: "7px 12px",
                                            borderRadius: "8px",
                                            fontSize: "13px",
                                            fontWeight: "500"
                                        }}
                                    >
                                        Today:&nbsp;
                                        <strong style={{ fontWeight: "700" }}>
                                            {shippedToday}
                                        </strong>
                                    </span>

                                </CardBody>
                            </Card>
                        </Col>

                        <Col xs={12} sm={6} md={6} lg={4} xl={3} xxl={2}>
                            <Card
                                onClick={() => navigate("/perfoma/invoices/")}
                                className="h-100 border-0 shadow-sm"
                                style={{
                                    cursor: "pointer",
                                    borderRadius: "16px",
                                    minHeight: "155px",
                                    background: "#f5fdff",
                                    borderLeft: "5px solid #06b6d4"
                                }}
                            >
                                <CardBody className="p-3 p-md-4">

                                    <p
                                        className="fw-semibold mb-2"
                                        style={{
                                            color: "#475569",
                                            fontSize: "14px"
                                        }}
                                    >
                                        Proforma Invoices
                                    </p>

                                    <h2
                                        className="fw-bold mb-3"
                                        style={{
                                            color: "#155e75",
                                            fontSize: "30px"
                                        }}
                                    >
                                        {proformaCountAdmin}
                                    </h2>

                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            backgroundColor: "#cffafe",
                                            color: "#0e7490",
                                            padding: "7px 12px",
                                            borderRadius: "8px",
                                            fontSize: "13px",
                                            fontWeight: "500"
                                        }}
                                    >
                                        View Proforma
                                    </span>

                                </CardBody>
                            </Card>
                        </Col>

                        <Col xs={12} sm={6} md={6} lg={4} xl={3} xxl={2}>
                            <Card
                                onClick={() => navigate("/beposoft/grv/view/")}
                                className="h-100 border-0 shadow-sm"
                                style={{
                                    cursor: "pointer",
                                    borderRadius: "16px",
                                    minHeight: "155px",
                                    background: "#fff7f7",
                                    borderLeft: "5px solid #ef4444"
                                }}
                            >
                                <CardBody className="p-3 p-md-4">

                                    <p
                                        className="fw-semibold mb-2"
                                        style={{
                                            color: "#475569",
                                            fontSize: "14px"
                                        }}
                                    >
                                        Goods Return
                                    </p>

                                    <h2
                                        className="fw-bold mb-3"
                                        style={{
                                            color: "#991b1b",
                                            fontSize: "30px"
                                        }}
                                    >
                                        {goodsReturn?.order || 0}
                                    </h2>

                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            backgroundColor: "#fee2e2",
                                            color: "#b91c1c",
                                            padding: "7px 12px",
                                            borderRadius: "8px",
                                            fontSize: "13px",
                                            fontWeight: "500"
                                        }}
                                    >
                                        View Returns
                                    </span>

                                </CardBody>
                            </Card>
                        </Col>

                        <Col xs={12} sm={6} md={6} lg={4} xl={3} xxl={2}>
                            <Card
                                onClick={() => navigate("/dashboard/grvwaitingforconfirmation-details")}
                                className="h-100 border-0 shadow-sm"
                                style={{
                                    cursor: "pointer",
                                    borderRadius: "16px",
                                    minHeight: "155px",
                                    background: "#fffaf3",
                                    borderLeft: "5px solid #f59e0b"
                                }}
                            >
                                <CardBody className="p-3 p-md-4">

                                    <p
                                        className="fw-semibold mb-2"
                                        style={{
                                            color: "#475569",
                                            fontSize: "14px"
                                        }}
                                    >
                                        GRV Waiting for Confirmation
                                    </p>

                                    <h2
                                        className="fw-bold mb-3"
                                        style={{
                                            color: "#92400e",
                                            fontSize: "30px"
                                        }}
                                    >
                                        {(grvWaitingForConfirmation?.order || 0)}
                                    </h2>

                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            backgroundColor: "#fef3c7",
                                            color: "#b45309",
                                            padding: "7px 12px",
                                            borderRadius: "8px",
                                            fontSize: "13px",
                                            fontWeight: "500"
                                        }}
                                    >
                                        View Pending GRV
                                    </span>

                                </CardBody>
                            </Card>
                        </Col>

                    </Row>
                )}

                {(role === 'CSO' || role === 'SD' || role === 'Marketing') && (
                    <Col lg={3}>
                        <div style={{ cursor: "pointer" }}
                            onClick={() => navigate("/dashboard/todaysbill-details")}>
                            <Card className="mini-stats-wid">
                                <CardBody>
                                    <div className="d-flex">
                                        <div className="flex-grow-1">
                                            <p className="text-muted fw-medium">Todays Bill</p>
                                            <h4 className="mb-0">
                                                {role === "CEO"
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
                                            {/* <i className="bx bx-trending-up align-bottom me-1 text-success"></i> {todayBills?.percentageValue} */}
                                        </span>
                                        {/* Increase last month */}
                                    </p>
                                </div>
                            </Card>
                        </div>
                    </Col>
                )}


                {(role === "CSO" || role === 'SD') && (
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
                {(role === "CSO" || role === 'SD') && (
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

                {(role === 'CSO' || role === 'SD' || role === 'Marketing') && (
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
                                            {/* <i className="bx bx-trending-up align-bottom me-1 text-success"></i> {todayBills?.percentageValue} */}
                                        </span>
                                        {/* Increase last month */}
                                    </p>
                                </div>
                            </Card>
                        </div>
                    </Col>
                )}

                {(role === "BDO" || role === "BDM") && (
                    <>

                        {/* Waiting For Approval */}
                        <Col xs={12} sm={6} md={6} lg={4} xl={3} xxl>
                            <Card
                                onClick={() => navigate("/staff/order/list/")}
                                className="h-100 border-0 shadow-sm"
                                style={{
                                    cursor: "pointer",
                                    borderRadius: "16px",
                                    minHeight: "155px",
                                    background: "#f8fbff",
                                    borderLeft: "5px solid #3b82f6"
                                }}
                            >
                                <CardBody className="p-3 p-md-4">

                                    <p
                                        className="fw-semibold mb-2"
                                        style={{
                                            color: "#475569",
                                            fontSize: "14px"
                                        }}
                                    >
                                        Waiting For Approval
                                    </p>

                                    <h2
                                        className="fw-bold mb-3"
                                        style={{
                                            color: "#1e3a8a",
                                            fontSize: "30px"
                                        }}
                                    >
                                        ₹ {myOrderData?.invoice_created?.total_amount?.toFixed(1)}
                                    </h2>

                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            backgroundColor: "#dbeafe",
                                            color: "#1d4ed8",
                                            padding: "7px 12px",
                                            borderRadius: "8px",
                                            fontSize: "13px",
                                            fontWeight: "500"
                                        }}
                                    >
                                        Bills:&nbsp;
                                        <strong style={{ fontWeight: "700" }}>
                                            {myOrderData?.invoice_created?.count}
                                        </strong>
                                    </span>

                                </CardBody>
                            </Card>
                        </Col>


                        {/* Todays order */}
                        <Col xs={12} sm={6} md={6} lg={4} xl={3} xxl>
                            <Card
                                onClick={() => navigate("/staff/order/list/")}
                                className="h-100 border-0 shadow-sm"
                                style={{
                                    cursor: "pointer",
                                    borderRadius: "16px",
                                    minHeight: "155px",
                                    background: "#f5fdff",
                                    borderLeft: "5px solid #06b6d4"
                                }}
                            >
                                <CardBody className="p-3 p-md-4">

                                    <p
                                        className="fw-semibold mb-2"
                                        style={{
                                            color: "#475569",
                                            fontSize: "14px"
                                        }}
                                    >
                                        Todays Bills
                                    </p>

                                    <h2
                                        className="fw-bold mb-3"
                                        style={{
                                            color: "#155e75",
                                            fontSize: "30px"
                                        }}
                                    >
                                        ₹ {myOrderData?.today_orders?.total_amount?.toFixed(1)}
                                    </h2>

                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            backgroundColor: "#cffafe",
                                            color: "#0e7490",
                                            padding: "7px 12px",
                                            borderRadius: "8px",
                                            fontSize: "13px",
                                            fontWeight: "500"
                                        }}
                                    >
                                        Bills:&nbsp;
                                        <strong style={{ fontWeight: "700" }}>
                                            {myOrderData?.today_orders?.count}
                                        </strong>
                                    </span>

                                </CardBody>
                            </Card>
                        </Col>

                        {/* total */}
                        <Col xs={12} sm={6} md={6} lg={4} xl={3} xxl>
                            <Card
                                onClick={() => navigate("/staff/order/list/")}
                                className="h-100 border-0 shadow-sm"
                                style={{
                                    cursor: "pointer",
                                    borderRadius: "16px",
                                    minHeight: "155px",
                                    background: "#fffaf3",
                                    borderLeft: "5px solid #f59e0b"
                                }}
                            >
                                <CardBody className="p-3 p-md-4">

                                    <p
                                        className="fw-semibold mb-2"
                                        style={{
                                            color: "#475569",
                                            fontSize: "14px"
                                        }}
                                    >
                                        Total Bills
                                    </p>

                                    <h2
                                        className="fw-bold mb-3"
                                        style={{
                                            color: "#92400e",
                                            fontSize: "30px"
                                        }}
                                    >
                                        ₹ {myOrderData?.all_orders?.total_amount?.toFixed(1)}
                                    </h2>

                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            backgroundColor: "#fef3c7",
                                            color: "#b45309",
                                            padding: "7px 12px",
                                            borderRadius: "8px",
                                            fontSize: "13px",
                                            fontWeight: "500"
                                        }}
                                    >
                                        Bills:&nbsp;
                                        <strong style={{ fontWeight: "700" }}>
                                            {myOrderData?.all_orders?.count}
                                        </strong>
                                    </span>

                                </CardBody>
                            </Card>
                        </Col>

                        {/* ORDERS */}
                        <Col xs={12} sm={6} md={6} lg={4} xl={3} xxl>
                            <Card
                                onClick={() => navigate("/staff/order/list/")}
                                className="h-100 border-0 shadow-sm"
                                style={{
                                    cursor: "pointer",
                                    borderRadius: "16px",
                                    minHeight: "155px",
                                    background: "#f8fbff",
                                    borderLeft: "5px solid #3b82f6"
                                }}
                            >
                                <CardBody className="p-3 p-md-4">

                                    <p
                                        className="fw-semibold mb-2"
                                        style={{
                                            color: "#475569",
                                            fontSize: "14px"
                                        }}
                                    >
                                        ORDERS
                                    </p>

                                    <h2
                                        className="fw-bold mb-3"
                                        style={{
                                            color: "#1e3a8a",
                                            fontSize: "30px"
                                        }}
                                    >
                                        Orders
                                    </h2>

                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            backgroundColor: "#dbeafe",
                                            color: "#1d4ed8",
                                            padding: "7px 12px",
                                            borderRadius: "8px",
                                            fontSize: "13px",
                                            fontWeight: "500"
                                        }}
                                    >
                                        View Orders
                                    </span>

                                </CardBody>
                            </Card>
                        </Col>


                        {/* CUSTOMERS */}
                        <Col xs={12} sm={6} md={6} lg={4} xl={3} xxl>
                            <Card
                                onClick={() => navigate("/all/staff/customers/")}
                                className="h-100 border-0 shadow-sm"
                                style={{
                                    cursor: "pointer",
                                    borderRadius: "16px",
                                    minHeight: "155px",
                                    background: "#f5fdff",
                                    borderLeft: "5px solid #06b6d4"
                                }}
                            >
                                <CardBody className="p-3 p-md-4">

                                    <p
                                        className="fw-semibold mb-2"
                                        style={{
                                            color: "#475569",
                                            fontSize: "14px"
                                        }}
                                    >
                                        CUSTOMERS
                                    </p>

                                    <h2
                                        className="fw-bold mb-3"
                                        style={{
                                            color: "#155e75",
                                            fontSize: "30px"
                                        }}
                                    >
                                        Customers
                                    </h2>

                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            backgroundColor: "#cffafe",
                                            color: "#0e7490",
                                            padding: "7px 12px",
                                            borderRadius: "8px",
                                            fontSize: "13px",
                                            fontWeight: "500"
                                        }}
                                    >
                                        View Customers
                                    </span>

                                </CardBody>
                            </Card>
                        </Col>
                    </>
                )}
            </Row>
        </React.Fragment>
    );
}

export default ChartSection;