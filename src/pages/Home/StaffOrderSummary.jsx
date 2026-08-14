import React, {
    Fragment,
    useEffect,
    useState,
} from "react";

import axios from "axios";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import {
    toast,
    ToastContainer,
} from "react-toastify";

import "react-toastify/dist/ReactToastify.css";


const StaffOrderSummary = () => {

    // =========================================================
    // NAVIGATION
    // =========================================================
    const navigate = useNavigate();


    // =========================================================
    // PARAMS
    // =========================================================
    const {
        staff_id,
        start_date,
        end_date,
    } = useParams();


    // =========================================================
    // AUTH / API
    // =========================================================
    const token =
        localStorage.getItem("token");

    const apiBaseUrl =
        import.meta.env.VITE_APP_KEY;


    // =========================================================
    // STATES
    // =========================================================
    const [loading, setLoading] =
        useState(false);


    const [staff, setStaff] =
        useState({
            id: null,
            eid: "",
            staff_id: "",
            name: "",
            designation: "",
            department: {
                id: null,
                name: "",
            },
            family: {
                id: null,
                name: "",
            },
        });


    const [dateRange, setDateRange] =
        useState({
            start_date: "",
            end_date: "",
        });


    const [summary, setSummary] =
        useState({
            total_orders: 0,
            total_amount: 0,
        });


    const [orders, setOrders] =
        useState([]);


    // =========================================================
    // FORMAT CURRENCY
    // =========================================================
    const formatCurrency = (value) => {

        return Number(
            value || 0
        ).toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }
        );
    };


    // =========================================================
    // FORMAT DATE
    // =========================================================
    const formatDate = (dateString) => {

        if (!dateString) {
            return "-";
        }

        const date =
            new Date(
                `${dateString}T00:00:00`
            );

        return date.toLocaleDateString(
            "en-GB",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    };


    // =========================================================
    // GET INITIALS
    // =========================================================
    const getInitials = (name) => {

        if (!name) {
            return "?";
        }

        const parts =
            name
                .trim()
                .split(/\s+/);


        if (parts.length === 1) {

            return parts[0]
                .charAt(0)
                .toUpperCase();
        }


        return (
            parts[0].charAt(0) +
            parts[1].charAt(0)
        ).toUpperCase();
    };


    // =========================================================
    // STATUS STYLE
    // =========================================================
    const getStatusStyle = (status) => {

        const value =
            String(
                status || ""
            ).toLowerCase();


        if (
            value.includes("shipped") ||
            value.includes("delivered") ||
            value.includes("approved")
        ) {

            return {
                background: "#dcfce7",
                color: "#15803d",
            };
        }


        if (
            value.includes("waiting") ||
            value.includes("pending")
        ) {

            return {
                background: "#fef3c7",
                color: "#b45309",
            };
        }


        if (
            value.includes("reject") ||
            value.includes("cancel")
        ) {

            return {
                background: "#fee2e2",
                color: "#dc2626",
            };
        }


        return {
            background: "#eef2ff",
            color: "#4f46e5",
        };
    };


    // =========================================================
    // FETCH STAFF ORDER SUMMARY
    // =========================================================
    const fetchStaffOrderSummary =
        async () => {

            if (
                !staff_id ||
                !start_date ||
                !end_date
            ) {

                toast.error(
                    "Staff or date information is missing."
                );

                return;
            }


            if (!token) {

                toast.error(
                    "Authentication token not found."
                );

                return;
            }


            try {

                setLoading(true);


                const response =
                    await axios.get(

                        `${apiBaseUrl}orders/staff/${staff_id}/summary/${start_date}/${end_date}/`,

                        {
                            headers: {
                                Authorization:
                                    `Bearer ${token}`,
                            },
                        }

                    );


                const data =
                    response?.data;


                if (
                    data?.status ===
                    "success"
                ) {

                    // -----------------------------------------
                    // STAFF
                    // -----------------------------------------
                    setStaff({

                        id:
                            data
                                ?.staff
                                ?.id ||
                            null,

                        eid:
                            data
                                ?.staff
                                ?.eid ||
                            "",

                        staff_id:
                            data
                                ?.staff
                                ?.staff_id ||
                            "",

                        name:
                            data
                                ?.staff
                                ?.name ||
                            "",

                        designation:
                            data
                                ?.staff
                                ?.designation ||
                            "",

                        department: {
                            id:
                                data
                                    ?.staff
                                    ?.department
                                    ?.id ||
                                null,

                            name:
                                data
                                    ?.staff
                                    ?.department
                                    ?.name ||
                                "",
                        },

                        family: {
                            id:
                                data
                                    ?.staff
                                    ?.family
                                    ?.id ||
                                null,

                            name:
                                data
                                    ?.staff
                                    ?.family
                                    ?.name ||
                                "",
                        },

                    });


                    // -----------------------------------------
                    // DATE
                    // -----------------------------------------
                    setDateRange({

                        start_date:
                            data
                                ?.date_range
                                ?.start_date ||
                            start_date,

                        end_date:
                            data
                                ?.date_range
                                ?.end_date ||
                            end_date,

                    });


                    // -----------------------------------------
                    // SUMMARY
                    // -----------------------------------------
                    setSummary({

                        total_orders:
                            Number(
                                data
                                    ?.summary
                                    ?.total_orders ||
                                0
                            ),

                        total_amount:
                            Number(
                                data
                                    ?.summary
                                    ?.total_amount ||
                                0
                            ),

                    });


                    // -----------------------------------------
                    // ORDERS
                    // -----------------------------------------
                    setOrders(

                        Array.isArray(
                            data?.orders
                        )
                            ? data.orders
                            : []

                    );

                } else {

                    setOrders([]);

                    setSummary({
                        total_orders: 0,
                        total_amount: 0,
                    });

                    toast.error(
                        data?.message ||
                        "Failed to load staff orders."
                    );
                }

            } catch (error) {

                console.error(
                    "Staff order summary error:",
                    error
                );


                setOrders([]);

                setSummary({
                    total_orders: 0,
                    total_amount: 0,
                });


                if (
                    error?.response?.status ===
                    401
                ) {

                    toast.error(
                        "Session expired. Please login again."
                    );

                } else {

                    toast.error(
                        error
                            ?.response
                            ?.data
                            ?.message ||
                        "Failed to load staff order summary."
                    );
                }

            } finally {

                setLoading(false);
            }
        };


    // =========================================================
    // INITIAL LOAD
    // =========================================================
    useEffect(() => {

        fetchStaffOrderSummary();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        staff_id,
        start_date,
        end_date,
    ]);


    // =========================================================
    // DOCUMENT TITLE
    // =========================================================
    document.title =
        "Staff Order Summary | BEPOSOFT";


    // =========================================================
    // UI
    // =========================================================
    return (

        <Fragment>

            <div
                className="page-content"
                style={{
                    background:
                        "#f5f7fb",
                    minHeight:
                        "100vh",
                }}
            >

                <div className="container-fluid">


                    {/* =================================================
                        HEADER
                    ================================================= */}
                    <div
                        className="
                            card
                            border-0
                            mb-4
                        "
                        style={{
                            borderRadius:
                                "22px",

                            background:
                                "linear-gradient(135deg, #1f2937 0%, #334155 45%, #0f172a 100%)",

                            boxShadow:
                                "0 12px 35px rgba(15, 23, 42, 0.18)",

                            overflow:
                                "hidden",
                        }}
                    >

                        <div className="card-body p-4">

                            <div className="row align-items-center">


                                {/* LEFT */}
                                <div className="col-lg-8">

                                    <div
                                        className="
                                            d-flex
                                            align-items-center
                                            gap-3
                                        "
                                    >

                                        <div
                                            style={{
                                                width:
                                                    "58px",

                                                height:
                                                    "58px",

                                                minWidth:
                                                    "58px",

                                                borderRadius:
                                                    "18px",

                                                background:
                                                    "rgba(255,255,255,0.12)",

                                                display:
                                                    "flex",

                                                alignItems:
                                                    "center",

                                                justifyContent:
                                                    "center",

                                                color:
                                                    "#ffffff",

                                                fontSize:
                                                    "22px",

                                                fontWeight:
                                                    700,
                                            }}
                                        >
                                            {getInitials(
                                                staff.name
                                            )}
                                        </div>


                                        <div>

                                            <div
                                                style={{
                                                    color:
                                                        "rgba(255,255,255,0.65)",

                                                    fontSize:
                                                        "12px",

                                                    textTransform:
                                                        "uppercase",

                                                    letterSpacing:
                                                        "0.05em",

                                                    marginBottom:
                                                        "4px",
                                                }}
                                            >
                                                Staff Order Summary
                                            </div>


                                            <h4
                                                className="
                                                    mb-1
                                                    text-white
                                                    fw-bold
                                                "
                                            >
                                                {staff.name ||
                                                    "Staff"}
                                            </h4>


                                            <p
                                                className="mb-0"
                                                style={{
                                                    color:
                                                        "rgba(255,255,255,0.72)",
                                                }}
                                            >
                                                {staff.designation ||
                                                    "-"}

                                                {" • "}

                                                {staff
                                                    ?.department
                                                    ?.name ||
                                                    "-"}

                                                {" • "}

                                                {staff
                                                    ?.family
                                                    ?.name ||
                                                    "-"}
                                            </p>

                                        </div>

                                    </div>

                                </div>


                                {/* RIGHT */}
                                <div
                                    className="
                                        col-lg-4
                                        mt-4
                                        mt-lg-0
                                    "
                                >

                                    <div
                                        className="
                                            d-flex
                                            justify-content-lg-end
                                            gap-2
                                            flex-wrap
                                        "
                                    >

                                        <span
                                            className="badge"
                                            style={{
                                                background:
                                                    "rgba(34,197,94,0.18)",

                                                color:
                                                    "#bbf7d0",

                                                padding:
                                                    "10px 14px",

                                                borderRadius:
                                                    "999px",

                                                fontSize:
                                                    "13px",

                                                fontWeight:
                                                    500,
                                            }}
                                        >
                                            {orders.length} Orders
                                        </span>


                                        <button
                                            type="button"

                                            className="btn"

                                            onClick={() =>
                                                navigate(-1)
                                            }

                                            style={{
                                                background:
                                                    "rgba(255,255,255,0.12)",

                                                border:
                                                    "1px solid rgba(255,255,255,0.15)",

                                                color:
                                                    "#ffffff",

                                                borderRadius:
                                                    "12px",

                                                padding:
                                                    "9px 15px",

                                                fontWeight:
                                                    600,
                                            }}
                                        >
                                            <i className="bx bx-left-arrow-alt me-1"></i>

                                            Back
                                        </button>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                    <div
                        className="
                            card
                            border-0
                            mb-4
                        "
                        style={{
                            borderRadius:
                                "18px",

                            boxShadow:
                                "0 8px 25px rgba(15,23,42,0.06)",
                        }}
                    >

                        <div className="card-body p-4">

                            <div className="row g-4">


                                {/* STAFF DETAILS */}
                                <div className="col-lg-6">

                                    <h6 className="fw-bold text-dark mb-3">
                                        Staff Information
                                    </h6>


                                    <div
                                        style={{
                                            background:
                                                "#f8fafc",

                                            borderRadius:
                                                "14px",

                                            padding:
                                                "16px",
                                        }}
                                    >


                                        <div className="d-flex justify-content-between mb-3">

                                            <span className="text-muted">
                                                Department
                                            </span>

                                            <strong>
                                                {staff
                                                    ?.department
                                                    ?.name ||
                                                    "-"}
                                            </strong>

                                        </div>


                                        <div className="d-flex justify-content-between">

                                            <span className="text-muted">
                                                Division
                                            </span>

                                            <strong
                                                style={{
                                                    textTransform:
                                                        "capitalize",
                                                }}
                                            >
                                                {staff
                                                    ?.family
                                                    ?.name ||
                                                    "-"}
                                            </strong>

                                        </div>

                                    </div>

                                </div>


                                {/* DATE */}
                                <div className="col-lg-6">

                                    <h6 className="fw-bold text-dark mb-3">
                                        Selected Period
                                    </h6>


                                    <div
                                        className="
                                            h-100
                                            d-flex
                                            align-items-center
                                        "
                                    >

                                        <div
                                            style={{
                                                width:
                                                    "100%",

                                                background:
                                                    "#eef2ff",

                                                color:
                                                    "#4f46e5",

                                                borderRadius:
                                                    "14px",

                                                padding:
                                                    "20px",
                                            }}
                                        >

                                            <div
                                                style={{
                                                    fontSize:
                                                        "12px",

                                                    marginBottom:
                                                        "8px",

                                                    fontWeight:
                                                        600,
                                                }}
                                            >
                                                DATE RANGE
                                            </div>


                                            <div
                                                style={{
                                                    fontSize:
                                                        "18px",

                                                    fontWeight:
                                                        700,
                                                }}
                                            >
                                                {formatDate(
                                                    dateRange.start_date ||
                                                    start_date
                                                )}

                                                {" - "}

                                                {formatDate(
                                                    dateRange.end_date ||
                                                    end_date
                                                )}
                                            </div>

                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        SUMMARY
                    ================================================= */}
                    <div className="row mb-4">


                        {/* TOTAL ORDERS */}
                        <div className="col-xl-6 col-md-6 mb-3">

                            <div
                                className="
                                    card
                                    border-0
                                    h-100
                                "
                                style={{
                                    borderRadius:
                                        "18px",

                                    boxShadow:
                                        "0 8px 25px rgba(15,23,42,0.06)",
                                }}
                            >

                                <div className="card-body">

                                    <div
                                        className="
                                            d-flex
                                            justify-content-between
                                            align-items-center
                                        "
                                    >

                                        <div>

                                            <p className="text-muted mb-1">
                                                Total Orders
                                            </p>

                                            <h3 className="fw-bold mb-0">
                                                {Number(
                                                    summary.total_orders ||
                                                    0
                                                ).toLocaleString(
                                                    "en-IN"
                                                )}
                                            </h3>

                                        </div>


                                        <div
                                            style={{
                                                width:
                                                    "48px",

                                                height:
                                                    "48px",

                                                borderRadius:
                                                    "15px",

                                                background:
                                                    "#eef2ff",

                                                color:
                                                    "#4f46e5",

                                                display:
                                                    "flex",

                                                alignItems:
                                                    "center",

                                                justifyContent:
                                                    "center",

                                                fontSize:
                                                    "24px",
                                            }}
                                        >
                                            <i className="bx bx-receipt"></i>
                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>


                        {/* TOTAL AMOUNT */}
                        <div className="col-xl-6 col-md-6 mb-3">

                            <div
                                className="
                                    card
                                    border-0
                                    h-100
                                "
                                style={{
                                    borderRadius:
                                        "18px",

                                    boxShadow:
                                        "0 8px 25px rgba(15,23,42,0.06)",
                                }}
                            >

                                <div className="card-body">

                                    <div
                                        className="
                                            d-flex
                                            justify-content-between
                                            align-items-center
                                        "
                                    >

                                        <div>

                                            <p className="text-muted mb-1">
                                                Total Amount
                                            </p>

                                            <h3
                                                className="fw-bold mb-0"
                                                style={{
                                                    color:
                                                        "#10b981",
                                                }}
                                            >
                                                ₹{" "}
                                                {formatCurrency(
                                                    summary.total_amount
                                                )}
                                            </h3>

                                        </div>


                                        <div
                                            style={{
                                                width:
                                                    "48px",

                                                height:
                                                    "48px",

                                                borderRadius:
                                                    "15px",

                                                background:
                                                    "#ecfdf5",

                                                color:
                                                    "#10b981",

                                                display:
                                                    "flex",

                                                alignItems:
                                                    "center",

                                                justifyContent:
                                                    "center",

                                                fontSize:
                                                    "24px",
                                            }}
                                        >
                                            <i className="bx bx-rupee"></i>
                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        ORDERS
                    ================================================= */}
                    <div
                        className="
                            card
                            border-0
                        "
                        style={{
                            borderRadius:
                                "22px",

                            boxShadow:
                                "0 10px 35px rgba(15,23,42,0.08)",

                            overflow:
                                "hidden",
                        }}
                    >

                        <div
                            className="
                                card-header
                                border-0
                            "
                            style={{
                                background:
                                    "#ffffff",

                                padding:
                                    "22px 24px",

                                borderBottom:
                                    "1px solid #edf0f4",
                            }}
                        >

                            <div
                                className="
                                    d-flex
                                    justify-content-between
                                    align-items-center
                                    flex-wrap
                                    gap-3
                                "
                            >

                                <div>

                                    <h5 className="fw-bold text-dark mb-1">
                                        Orders
                                    </h5>

                                    <p className="text-muted mb-0">
                                        Order details for this staff
                                        within the selected period.
                                    </p>

                                </div>


                                <span
                                    className="badge"
                                    style={{
                                        background:
                                            "#eef2ff",

                                        color:
                                            "#4f46e5",

                                        borderRadius:
                                            "999px",

                                        padding:
                                            "9px 13px",

                                        fontSize:
                                            "12px",
                                    }}
                                >
                                    {orders.length} Orders
                                </span>

                            </div>

                        </div>


                        <div
                            className="card-body p-0"
                        >
                            {loading ? (

                                <div className="text-center py-5">

                                    <div
                                        className="
                    spinner-border
                    text-primary
                "
                                    ></div>

                                    <div className="text-muted mt-2">
                                        Loading orders...
                                    </div>

                                </div>

                            ) : orders.length > 0 ? (

                                <>
                                    <div className="table-responsive">

                                        <table className="table align-middle mb-0">

                                            <thead>

                                                <tr
                                                    style={{
                                                        background: "#f8fafc",
                                                    }}
                                                >

                                                    <th
                                                        style={{
                                                            padding: "16px 22px",
                                                            color: "#64748b",
                                                            fontSize: "12px",
                                                            fontWeight: 600,
                                                            textTransform: "uppercase",
                                                            borderBottom:
                                                                "1px solid #e2e8f0",
                                                            width: "70px",
                                                        }}
                                                    >
                                                        #
                                                    </th>

                                                    <th
                                                        style={{
                                                            padding: "16px 22px",
                                                            color: "#64748b",
                                                            fontSize: "12px",
                                                            fontWeight: 600,
                                                            textTransform: "uppercase",
                                                            borderBottom:
                                                                "1px solid #e2e8f0",
                                                        }}
                                                    >
                                                        Invoice Number
                                                    </th>

                                                    <th
                                                        style={{
                                                            padding: "16px 22px",
                                                            color: "#64748b",
                                                            fontSize: "12px",
                                                            fontWeight: 600,
                                                            textTransform: "uppercase",
                                                            borderBottom:
                                                                "1px solid #e2e8f0",
                                                        }}
                                                    >
                                                        Order Date
                                                    </th>

                                                    <th
                                                        style={{
                                                            padding: "16px 22px",
                                                            color: "#64748b",
                                                            fontSize: "12px",
                                                            fontWeight: 600,
                                                            textTransform: "uppercase",
                                                            borderBottom:
                                                                "1px solid #e2e8f0",
                                                        }}
                                                    >
                                                        Status
                                                    </th>

                                                    <th
                                                        className="text-end"
                                                        style={{
                                                            padding: "16px 22px",
                                                            color: "#64748b",
                                                            fontSize: "12px",
                                                            fontWeight: 600,
                                                            textTransform: "uppercase",
                                                            borderBottom:
                                                                "1px solid #e2e8f0",
                                                        }}
                                                    >
                                                        Amount
                                                    </th>

                                                </tr>

                                            </thead>

                                            <tbody>

                                                {orders.map(
                                                    (
                                                        order,
                                                        index
                                                    ) => {

                                                        const statusStyle =
                                                            getStatusStyle(
                                                                order.status
                                                            );

                                                        return (

                                                            <tr
                                                                key={
                                                                    order.order_id ||
                                                                    index
                                                                }
                                                                style={{
                                                                    borderBottom:
                                                                        "1px solid #f1f5f9",
                                                                }}
                                                            >

                                                                {/* NUMBER */}
                                                                <td
                                                                    style={{
                                                                        padding:
                                                                            "18px 22px",
                                                                        color:
                                                                            "#94a3b8",
                                                                        fontWeight:
                                                                            600,
                                                                    }}
                                                                >
                                                                    {String(
                                                                        index + 1
                                                                    ).padStart(
                                                                        2,
                                                                        "0"
                                                                    )}
                                                                </td>


                                                                <td
                                                                    style={{
                                                                        padding: "18px 22px",
                                                                    }}
                                                                >
                                                                    <span
                                                                        onClick={() =>
                                                                            navigate(
                                                                                `/order/${order.order_id}/items/`
                                                                            )
                                                                        }
                                                                        style={{
                                                                            fontWeight: 700,
                                                                            color: "#2563eb",
                                                                            cursor: "pointer",
                                                                            textDecoration: "none",
                                                                            transition: "0.2s",
                                                                        }}
                                                                        onMouseEnter={(e) => {
                                                                            e.currentTarget.style.textDecoration =
                                                                                "underline";
                                                                        }}
                                                                        onMouseLeave={(e) => {
                                                                            e.currentTarget.style.textDecoration =
                                                                                "none";
                                                                        }}
                                                                    >
                                                                        {order.invoice_number || "-"}
                                                                    </span>
                                                                </td>

                                                                <td
                                                                    style={{
                                                                        padding:
                                                                            "18px 22px",
                                                                    }}
                                                                >

                                                                    <span
                                                                        style={{
                                                                            color:
                                                                                "#475569",
                                                                        }}
                                                                    >
                                                                        {formatDate(
                                                                            order.order_date
                                                                        )}
                                                                    </span>

                                                                </td>


                                                                {/* STATUS */}
                                                                <td
                                                                    style={{
                                                                        padding:
                                                                            "18px 22px",
                                                                    }}
                                                                >

                                                                    <span
                                                                        style={{
                                                                            ...statusStyle,

                                                                            borderRadius:
                                                                                "999px",

                                                                            padding:
                                                                                "7px 12px",

                                                                            fontSize:
                                                                                "11px",

                                                                            fontWeight:
                                                                                600,

                                                                            display:
                                                                                "inline-block",
                                                                        }}
                                                                    >
                                                                        {order.status ||
                                                                            "-"}
                                                                    </span>

                                                                </td>


                                                                {/* AMOUNT */}
                                                                <td
                                                                    className="text-end"
                                                                    style={{
                                                                        padding:
                                                                            "18px 22px",
                                                                    }}
                                                                >

                                                                    <strong
                                                                        style={{
                                                                            color:
                                                                                "#10b981",
                                                                            fontSize:
                                                                                "14px",
                                                                        }}
                                                                    >
                                                                        ₹{" "}
                                                                        {formatCurrency(
                                                                            order.amount
                                                                        )}
                                                                    </strong>

                                                                </td>

                                                            </tr>

                                                        );
                                                    }
                                                )}

                                            </tbody>


                                            {/* GRAND TOTAL */}
                                            <tfoot>

                                                <tr
                                                    style={{
                                                        background:
                                                            "#f8fafc",
                                                    }}
                                                >

                                                    <td
                                                        colSpan="3"
                                                        style={{
                                                            padding:
                                                                "18px 22px",
                                                            fontWeight:
                                                                700,
                                                            color:
                                                                "#334155",
                                                        }}
                                                    >
                                                        Grand Total
                                                    </td>

                                                    <td
                                                        style={{
                                                            padding:
                                                                "18px 22px",
                                                            fontWeight:
                                                                700,
                                                            color:
                                                                "#4f46e5",
                                                        }}
                                                    >
                                                        {Number(
                                                            summary.total_orders ||
                                                            0
                                                        ).toLocaleString(
                                                            "en-IN"
                                                        )}{" "}
                                                        Orders
                                                    </td>

                                                    <td
                                                        className="text-end"
                                                        style={{
                                                            padding:
                                                                "18px 22px",
                                                            fontWeight:
                                                                700,
                                                            color:
                                                                "#10b981",
                                                            fontSize:
                                                                "15px",
                                                        }}
                                                    >
                                                        ₹{" "}
                                                        {formatCurrency(
                                                            summary.total_amount
                                                        )}
                                                    </td>

                                                </tr>

                                            </tfoot>

                                        </table>

                                    </div>

                                </>

                            ) : (

                                <div
                                    className="text-center"
                                    style={{
                                        padding:
                                            "70px 20px",
                                    }}
                                >

                                    <div
                                        style={{
                                            width:
                                                "82px",

                                            height:
                                                "82px",

                                            borderRadius:
                                                "26px",

                                            background:
                                                "#f1f5f9",

                                            display:
                                                "flex",

                                            alignItems:
                                                "center",

                                            justifyContent:
                                                "center",

                                            margin:
                                                "0 auto 18px",

                                            color:
                                                "#64748b",

                                            fontSize:
                                                "38px",
                                        }}
                                    >
                                        <i className="bx bx-receipt"></i>
                                    </div>


                                    <h5 className="fw-bold text-dark mb-2">
                                        No orders found
                                    </h5>


                                    <p className="text-muted mb-0">
                                        No orders were found
                                        for this staff member
                                        during the selected period.
                                    </p>

                                </div>

                            )}
                        </div>

                    </div>

                </div>

            </div>


            <ToastContainer />

        </Fragment>
    );
};


export default StaffOrderSummary;