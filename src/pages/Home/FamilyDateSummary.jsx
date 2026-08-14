import React, { Fragment, useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

const FamilyDateSummary = () => {

    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const apiBaseUrl = import.meta.env.VITE_APP_KEY;

    const getTodayDate = () => {
        return new Date().toLocaleDateString("en-CA");
    };

    const todayDate = getTodayDate();

    const [startDate, setStartDate] = useState(todayDate);
    const [endDate, setEndDate] = useState(todayDate);
    const [summary, setSummary] = useState({
        total_orders: 0,
        total_amount: 0,
    });
    const [familyWise, setFamilyWise] = useState([]);
    const [dateRange, setDateRange] = useState({
        start_date: "",
        end_date: "",
    });
    const [loading, setLoading] = useState(false);


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

    const formatDate = (dateString) => {

        if (!dateString) {
            return "-";
        }

        const date = new Date(
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


    const fetchFamilyDateSummary = async (
        selectedStartDate = startDate,
        selectedEndDate = endDate
    ) => {

        if (
            !selectedStartDate ||
            !selectedEndDate
        ) {

            toast.warning(
                "Please select both start date and end date"
            );

            return;
        }


        if (
            selectedStartDate >
            selectedEndDate
        ) {
            toast.warning(
                "Start date cannot be greater than end date"
            );

            return;
        }


        if (!token) {
            toast.error(
                "Authentication token not found"
            );

            return;
        }


        try {
            setLoading(true);
            const response = await axios.get(
                `${apiBaseUrl}orders/family/date/summary/${selectedStartDate}/${selectedEndDate}/`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            const data = response?.data;

            if (data?.status === "success") {
                setSummary({
                    total_orders:
                        Number(
                            data
                                ?.summary
                                ?.total_orders || 0
                        ),
                    total_amount:
                        Number(
                            data
                                ?.summary
                                ?.total_amount || 0
                        ),
                });

                setFamilyWise(
                    Array.isArray(
                        data?.family_wise
                    )
                        ? data.family_wise
                        : []
                );

                setDateRange({
                    start_date:
                        data
                            ?.date_range
                            ?.start_date ||
                        selectedStartDate,
                    end_date:
                        data
                            ?.date_range
                            ?.end_date ||
                        selectedEndDate,
                });

            } else {
                setSummary({
                    total_orders: 0,
                    total_amount: 0,
                });

                setFamilyWise([]);

                toast.error(
                    data?.message ||
                    "Failed to load division summary"
                );
            }

        } catch (error) {
            console.error(
                "Family date summary error:",
                error
            );

            setSummary({
                total_orders: 0,
                total_amount: 0,
            });

            setFamilyWise([]);

            if (
                error?.response?.status === 401
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
                    "Failed to load division date summary"
                );
            }

        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        if (token) {
            fetchFamilyDateSummary(
                todayDate,
                todayDate
            );
        }
    }, []);


    const handleSearch = () => {
        fetchFamilyDateSummary(
            startDate,
            endDate
        );
    };


    const handleToday = () => {

        const today =
            getTodayDate();

        setStartDate(today);

        setEndDate(today);

        fetchFamilyDateSummary(
            today,
            today
        );
    };


    const handleCurrentMonth = () => {

        const today =
            new Date();

        const firstDay =
            new Date(
                today.getFullYear(),
                today.getMonth(),
                1
            ).toLocaleDateString(
                "en-CA"
            );

        const currentDay =
            today.toLocaleDateString(
                "en-CA"
            );


        setStartDate(
            firstDay
        );

        setEndDate(
            currentDay
        );


        fetchFamilyDateSummary(
            firstDay,
            currentDay
        );
    };


    const familyTotalOrders =
        familyWise.reduce(
            (sum, item) =>
                sum +
                Number(
                    item?.total_orders || 0
                ),
            0
        );


    const familyTotalAmount =
        familyWise.reduce(
            (sum, item) =>
                sum +
                Number(
                    item?.total_amount || 0
                ),
            0
        );


    document.title = "Division Order Summary | BEPOSOFT";


    return (

        <Fragment>
            <div
                className="page-content"
                style={{
                    background: "#f5f7fb",
                    minHeight: "100vh",
                }}
            >
                <div className="container-fluid">
                    <div
                        className="card border-0 mb-4"
                        style={{
                            borderRadius: "22px",
                            background: "linear-gradient(135deg, #1f2937 0%, #334155 45%, #0f172a 100%)",
                            boxShadow: "0 12px 35px rgba(15, 23, 42, 0.18)",
                            overflow: "hidden",
                        }}
                    >

                        <div className="card-body p-4">
                            <div className="row align-items-center">

                                {/* LEFT */}
                                <div className="col-lg-8">
                                    <div
                                        className="d-flex align-items-center gap-3 ">

                                        <div
                                            style={{
                                                width: "58px",
                                                height: "58px",
                                                borderRadius: "18px",
                                                background: "rgba(255,255,255,0.12)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: "#ffffff",
                                                fontSize: "26px",
                                                flexShrink: 0,
                                            }}
                                        >
                                            <i className="bx bx-bar-chart-alt-2"></i>
                                        </div>

                                        <div>
                                            <h4 className=" mb-1 text-white fw-bold">
                                                Division Order Summary
                                            </h4>

                                            <p
                                                className="mb-0"
                                                style={{
                                                    color:
                                                        "rgba(255,255,255,0.72)",
                                                }}
                                            >
                                                Review division-wise
                                                order volume and billing
                                                performance by date range.
                                            </p>

                                        </div>

                                    </div>

                                </div>


                                {/* RIGHT */}
                                <div className=" col-lg-4 mt-4 mt-lg-0 ">
                                    <div
                                        className="d-flex justify-content-lg-end align-items-center gap-2 flex-wrap">

                                        <span
                                            className="badge"
                                            style={{
                                                background:
                                                    "rgba(99,102,241,0.20)",

                                                color:
                                                    "#c7d2fe",

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
                                            <i className="bx bx-category me-1"></i>

                                            {familyWise.length} Divisions
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
                        className="card border-0 mb-4"
                        style={{
                            borderRadius:
                                "22px",

                            boxShadow:
                                "0 10px 35px rgba(15, 23, 42, 0.08)",
                        }}
                    >

                        <div className="card-body p-4">


                            {/* TITLE */}
                            <div
                                className="
                                    d-flex
                                    justify-content-between
                                    align-items-center
                                    flex-wrap
                                    gap-3
                                    mb-4
                                "
                            >

                                <div>

                                    <h5 className="fw-bold text-dark mb-1">
                                        Date Filter
                                    </h5>

                                    <p className="text-muted mb-0">
                                        Select a custom period
                                        or use one of the quick filters.
                                    </p>

                                </div>


                                <div
                                    style={{
                                        background:
                                            "#eef2ff",

                                        color:
                                            "#4f46e5",

                                        borderRadius:
                                            "999px",

                                        padding:
                                            "8px 13px",

                                        fontSize:
                                            "12px",

                                        fontWeight:
                                            600,
                                    }}
                                >
                                    <i className="bx bx-calendar me-1"></i>

                                    {formatDate(
                                        dateRange.start_date ||
                                        startDate
                                    )}

                                    {" - "}

                                    {formatDate(
                                        dateRange.end_date ||
                                        endDate
                                    )}
                                </div>

                            </div>


                            <div className="row align-items-end g-3">


                                {/* START DATE */}
                                <div className="col-xl-3 col-lg-3 col-md-6">

                                    <label
                                        className="
                                            form-label
                                            fw-semibold
                                        "
                                        style={{
                                            color:
                                                "#475569",

                                            fontSize:
                                                "13px",
                                        }}
                                    >
                                        Start Date
                                    </label>


                                    <input
                                        type="date"

                                        className="form-control"

                                        value={
                                            startDate
                                        }

                                        max={
                                            endDate ||
                                            undefined
                                        }

                                        onChange={(e) =>
                                            setStartDate(
                                                e.target.value
                                            )
                                        }

                                        style={{
                                            height:
                                                "46px",

                                            borderRadius:
                                                "12px",

                                            border:
                                                "1px solid #e2e8f0",

                                            background:
                                                "#f8fafc",

                                            boxShadow:
                                                "none",
                                        }}
                                    />

                                </div>


                                {/* END DATE */}
                                <div className="col-xl-3 col-lg-3 col-md-6">

                                    <label
                                        className="
                                            form-label
                                            fw-semibold
                                        "
                                        style={{
                                            color:
                                                "#475569",

                                            fontSize:
                                                "13px",
                                        }}
                                    >
                                        End Date
                                    </label>


                                    <input
                                        type="date"

                                        className="form-control"

                                        value={
                                            endDate
                                        }

                                        min={
                                            startDate ||
                                            undefined
                                        }

                                        onChange={(e) =>
                                            setEndDate(
                                                e.target.value
                                            )
                                        }

                                        style={{
                                            height:
                                                "46px",

                                            borderRadius:
                                                "12px",

                                            border:
                                                "1px solid #e2e8f0",

                                            background:
                                                "#f8fafc",

                                            boxShadow:
                                                "none",
                                        }}
                                    />

                                </div>


                                {/* SEARCH */}
                                <div className="col-xl-2 col-lg-2 col-md-4">

                                    <button
                                        type="button"

                                        className="
                                            btn
                                            btn-primary
                                            w-100
                                        "

                                        disabled={
                                            loading
                                        }

                                        onClick={
                                            handleSearch
                                        }

                                        style={{
                                            height:
                                                "46px",

                                            borderRadius:
                                                "12px",

                                            fontWeight:
                                                600,
                                        }}
                                    >

                                        {loading ? (

                                            <>
                                                <span
                                                    className="
                                                        spinner-border
                                                        spinner-border-sm
                                                        me-2
                                                    "
                                                ></span>

                                                Loading
                                            </>

                                        ) : (

                                            <>
                                                <i className="bx bx-search-alt me-1"></i>
                                                Search
                                            </>

                                        )}

                                    </button>

                                </div>


                                {/* TODAY */}
                                <div className="col-xl-2 col-lg-2 col-md-4">

                                    <button
                                        type="button"

                                        className="
                                            btn
                                            w-100
                                        "

                                        disabled={
                                            loading
                                        }

                                        onClick={
                                            handleToday
                                        }

                                        style={{
                                            height:
                                                "46px",

                                            borderRadius:
                                                "12px",

                                            background:
                                                "#eef2ff",

                                            color:
                                                "#4f46e5",

                                            border:
                                                "1px solid #e0e7ff",

                                            fontWeight:
                                                600,
                                        }}
                                    >
                                        <i className="bx bx-calendar-event me-1"></i>
                                        Today
                                    </button>

                                </div>


                                {/* THIS MONTH */}
                                <div className="col-xl-2 col-lg-2 col-md-4">

                                    <button
                                        type="button"

                                        className="
                                            btn
                                            w-100
                                        "

                                        disabled={
                                            loading
                                        }

                                        onClick={
                                            handleCurrentMonth
                                        }

                                        style={{
                                            height:
                                                "46px",

                                            borderRadius:
                                                "12px",

                                            background:
                                                "#ffffff",

                                            color:
                                                "#475569",

                                            border:
                                                "1px solid #e2e8f0",

                                            fontWeight:
                                                600,
                                        }}
                                    >
                                        <i className="bx bx-calendar me-1"></i>
                                        This Month
                                    </button>

                                </div>

                            </div>

                        </div>

                    </div>

                    <div
                        className="card border-0"
                        style={{
                            borderRadius:
                                "22px",

                            boxShadow:
                                "0 10px 35px rgba(15, 23, 42, 0.08)",

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
                                    align-items-center
                                    justify-content-between
                                    flex-wrap
                                    gap-3
                                "
                            >

                                <div>

                                    <h5 className="mb-1 fw-bold text-dark">
                                        Division Performance
                                    </h5>

                                    <p className="text-muted mb-0">
                                        Order count and billing
                                        amount for each division.
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

                                        fontWeight:
                                            600,
                                    }}
                                >
                                    <i className="bx bx-category me-1"></i>

                                    {familyWise.length} Divisions
                                </span>

                            </div>

                        </div>


                        {/* =============================================
                            CARD BODY
                        ============================================= */}
                        <div
                            className="card-body"
                            style={{
                                padding:
                                    "24px",

                                background:
                                    "#ffffff",
                            }}
                        >

                            {loading ? (

                                // =========================================
                                // LOADING
                                // =========================================
                                <div className="row">

                                    {[1, 2, 3].map(
                                        (item) => (

                                            <div
                                                className="
                                                    col-xl-4
                                                    col-lg-4
                                                    col-md-6
                                                    mb-3
                                                "
                                                key={item}
                                            >

                                                <div
                                                    style={{
                                                        height:
                                                            "190px",

                                                        background:
                                                            "#f8fafc",

                                                        border:
                                                            "1px solid #edf0f4",

                                                        borderRadius:
                                                            "18px",

                                                        padding:
                                                            "20px",
                                                    }}
                                                >

                                                    <div
                                                        style={{
                                                            width:
                                                                "48px",

                                                            height:
                                                                "48px",

                                                            background:
                                                                "#e5e7eb",

                                                            borderRadius:
                                                                "14px",

                                                            marginBottom:
                                                                "18px",
                                                        }}
                                                    ></div>

                                                    <div
                                                        style={{
                                                            width:
                                                                "45%",

                                                            height:
                                                                "14px",

                                                            background:
                                                                "#e5e7eb",

                                                            borderRadius:
                                                                "8px",

                                                            marginBottom:
                                                                "12px",
                                                        }}
                                                    ></div>

                                                    <div
                                                        style={{
                                                            width:
                                                                "70%",

                                                            height:
                                                                "12px",

                                                            background:
                                                                "#edf2f7",

                                                            borderRadius:
                                                                "8px",
                                                        }}
                                                    ></div>

                                                </div>

                                            </div>

                                        )
                                    )}

                                </div>

                            ) : familyWise.length > 0 ? (

                                <>
                                    {/* =================================
                                        DIVISION COLUMNS
                                    ================================= */}
                                    <div className="row">

                                        {familyWise.map(
                                            (
                                                family,
                                                index
                                            ) => (

                                                <div
                                                    className="
                                                        col-xl-4
                                                        col-lg-4
                                                        col-md-6
                                                        mb-4
                                                    "

                                                    key={
                                                        family.family_id ||
                                                        index
                                                    }
                                                >

                                                    <div
                                                        className="h-100"

                                                        onClick={() =>
                                                            navigate(
                                                                `/orders/family/${family.family_id}/staff/summary/${dateRange.start_date || startDate
                                                                }/${dateRange.end_date || endDate
                                                                }`
                                                            )
                                                        }

                                                        style={{
                                                            border: "1px solid #edf0f4",
                                                            borderRadius: "18px",
                                                            padding: "20px",
                                                            background: "#ffffff",
                                                            boxShadow:
                                                                "0 6px 20px rgba(15,23,42,0.04)",

                                                            cursor: "pointer",
                                                            transition: "all 0.2s ease",
                                                        }}

                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.transform =
                                                                "translateY(-3px)";

                                                            e.currentTarget.style.boxShadow =
                                                                "0 12px 30px rgba(15,23,42,0.10)";

                                                            e.currentTarget.style.borderColor =
                                                                "#c7d2fe";
                                                        }}

                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.transform =
                                                                "translateY(0)";

                                                            e.currentTarget.style.boxShadow =
                                                                "0 6px 20px rgba(15,23,42,0.04)";

                                                            e.currentTarget.style.borderColor =
                                                                "#edf0f4";
                                                        }}
                                                    >

                                                        {/* =================
                                                            DIVISION TOP
                                                        ================= */}
                                                        <div
                                                            className="
                                                                d-flex
                                                                align-items-center
                                                                justify-content-between
                                                                mb-4
                                                            "
                                                        >

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
                                                                            "48px",

                                                                        height:
                                                                            "48px",

                                                                        minWidth:
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
                                                                            "18px",

                                                                        fontWeight:
                                                                            700,
                                                                    }}
                                                                >

                                                                    {(
                                                                        family.family_name ||
                                                                        "-"
                                                                    )
                                                                        .charAt(
                                                                            0
                                                                        )
                                                                        .toUpperCase()}

                                                                </div>


                                                                <div>

                                                                    <h6
                                                                        className="
                                                                            mb-1
                                                                            fw-bold
                                                                            text-dark
                                                                        "
                                                                        style={{
                                                                            textTransform:
                                                                                "capitalize",
                                                                        }}
                                                                    >
                                                                        {
                                                                            family.family_name ||
                                                                            "-"
                                                                        }
                                                                    </h6>


                                                                    <span
                                                                        style={{
                                                                            color:
                                                                                "#94a3b8",

                                                                            fontSize:
                                                                                "12px",
                                                                        }}
                                                                    >
                                                                        Division
                                                                    </span>

                                                                </div>

                                                            </div>


                                                            <span
                                                                style={{
                                                                    color:
                                                                        "#94a3b8",

                                                                    fontSize:
                                                                        "12px",

                                                                    fontWeight:
                                                                        600,
                                                                }}
                                                            >
                                                                #
                                                                {String(
                                                                    index +
                                                                    1
                                                                ).padStart(
                                                                    2,
                                                                    "0"
                                                                )}
                                                            </span>

                                                        </div>


                                                        {/* =================
                                                            DIVISION VALUES
                                                        ================= */}
                                                        <div className="row g-3">


                                                            {/* ORDERS */}
                                                            <div className="col-6">

                                                                <div
                                                                    className="h-100"
                                                                    style={{
                                                                        borderRadius:
                                                                            "14px",

                                                                        background:
                                                                            "#f8fafc",

                                                                        padding:
                                                                            "16px",

                                                                        border:
                                                                            "1px solid #f1f5f9",
                                                                    }}
                                                                >

                                                                    <div
                                                                        style={{
                                                                            fontSize:
                                                                                "11px",

                                                                            color:
                                                                                "#64748b",

                                                                            fontWeight:
                                                                                600,

                                                                            marginBottom:
                                                                                "7px",

                                                                            textTransform:
                                                                                "uppercase",
                                                                        }}
                                                                    >
                                                                        Orders
                                                                    </div>


                                                                    <div
                                                                        style={{
                                                                            color:
                                                                                "#4f46e5",

                                                                            fontSize:
                                                                                "24px",

                                                                            fontWeight:
                                                                                700,
                                                                        }}
                                                                    >
                                                                        {Number(
                                                                            family.total_orders ||
                                                                            0
                                                                        ).toLocaleString(
                                                                            "en-IN"
                                                                        )}
                                                                    </div>

                                                                </div>

                                                            </div>


                                                            {/* AMOUNT */}
                                                            <div className="col-6">

                                                                <div
                                                                    className="h-100"
                                                                    style={{
                                                                        borderRadius:
                                                                            "14px",

                                                                        background:
                                                                            "#f0fdf4",

                                                                        padding:
                                                                            "16px",

                                                                        border:
                                                                            "1px solid #dcfce7",
                                                                    }}
                                                                >

                                                                    <div
                                                                        style={{
                                                                            fontSize:
                                                                                "11px",

                                                                            color:
                                                                                "#64748b",

                                                                            fontWeight:
                                                                                600,

                                                                            marginBottom:
                                                                                "7px",

                                                                            textTransform:
                                                                                "uppercase",
                                                                        }}
                                                                    >
                                                                        Amount
                                                                    </div>


                                                                    <div
                                                                        style={{
                                                                            color:
                                                                                "#10b981",

                                                                            fontSize:
                                                                                "17px",

                                                                            fontWeight:
                                                                                700,

                                                                            wordBreak:
                                                                                "break-word",
                                                                        }}
                                                                    >
                                                                        ₹{" "}
                                                                        {formatCurrency(
                                                                            family.total_amount
                                                                        )}
                                                                    </div>

                                                                </div>

                                                            </div>

                                                        </div>

                                                    </div>

                                                </div>

                                            )
                                        )}

                                    </div>


                                    {/* =================================
                                        GRAND TOTAL
                                    ================================= */}
                                    <div
                                        style={{
                                            borderRadius:
                                                "18px",

                                            background:
                                                "#f8fafc",

                                            border:
                                                "1px solid #e2e8f0",

                                            padding:
                                                "20px 24px",
                                        }}
                                    >

                                        <div className="row align-items-center">


                                            {/* TITLE */}
                                            <div className="col-lg-4 col-md-4">

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
                                                                "46px",

                                                            height:
                                                                "46px",

                                                            borderRadius:
                                                                "14px",

                                                            background:
                                                                "#e2e8f0",

                                                            color:
                                                                "#334155",

                                                            display:
                                                                "flex",

                                                            alignItems:
                                                                "center",

                                                            justifyContent:
                                                                "center",

                                                            fontSize:
                                                                "22px",
                                                        }}
                                                    >
                                                        <i className="bx bx-calculator"></i>
                                                    </div>


                                                    <div>

                                                        <h6 className="fw-bold text-dark mb-1">
                                                            Grand Total
                                                        </h6>

                                                        <span
                                                            style={{
                                                                color:
                                                                    "#94a3b8",

                                                                fontSize:
                                                                    "12px",
                                                            }}
                                                        >
                                                            All divisions combined
                                                        </span>

                                                    </div>

                                                </div>

                                            </div>


                                            {/* ORDERS */}
                                            <div className="col-lg-4 col-md-4 mt-3 mt-md-0">

                                                <div className="text-center">

                                                    <div
                                                        style={{
                                                            color:
                                                                "#64748b",

                                                            fontSize:
                                                                "11px",

                                                            fontWeight:
                                                                600,

                                                            textTransform:
                                                                "uppercase",

                                                            marginBottom:
                                                                "4px",
                                                        }}
                                                    >
                                                        Total Orders
                                                    </div>


                                                    <div
                                                        style={{
                                                            color:
                                                                "#4f46e5",

                                                            fontWeight:
                                                                700,

                                                            fontSize:
                                                                "23px",
                                                        }}
                                                    >
                                                        {familyTotalOrders.toLocaleString(
                                                            "en-IN"
                                                        )}
                                                    </div>

                                                </div>

                                            </div>


                                            {/* AMOUNT */}
                                            <div className="col-lg-4 col-md-4 mt-3 mt-md-0">

                                                <div
                                                    className="
                                                        text-md-end
                                                        text-center
                                                    "
                                                >

                                                    <div
                                                        style={{
                                                            color:
                                                                "#64748b",

                                                            fontSize:
                                                                "11px",

                                                            fontWeight:
                                                                600,

                                                            textTransform:
                                                                "uppercase",

                                                            marginBottom:
                                                                "4px",
                                                        }}
                                                    >
                                                        Total Amount
                                                    </div>


                                                    <div
                                                        style={{
                                                            color:
                                                                "#10b981",

                                                            fontWeight:
                                                                700,

                                                            fontSize:
                                                                "21px",
                                                        }}
                                                    >
                                                        ₹{" "}
                                                        {formatCurrency(
                                                            familyTotalAmount
                                                        )}
                                                    </div>

                                                </div>

                                            </div>

                                        </div>

                                    </div>

                                </>

                            ) : (

                                // =========================================
                                // EMPTY
                                // =========================================
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
                                        <i className="bx bx-bar-chart-square"></i>
                                    </div>


                                    <h5 className="fw-bold text-dark mb-2">
                                        No division data available
                                    </h5>


                                    <p className="text-muted mb-0">
                                        No order data was found
                                        for the selected date range.
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


export default FamilyDateSummary;