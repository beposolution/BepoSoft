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


const FamilyStaffSummary = () => {

    const navigate = useNavigate();


    const {
        family_id,
        start_date,
        end_date,
    } = useParams();


    const token =
        localStorage.getItem("token");

    const apiBaseUrl =
        import.meta.env.VITE_APP_KEY;


    const [loading, setLoading] =
        useState(false);


    const [family, setFamily] =
        useState({
            family_id: null,
            family_name: "",
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


    const [staffWise, setStaffWise] =
        useState([]);


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


    const getInitials = (name) => {

        if (!name) {
            return "?";
        }

        const words =
            name
                .trim()
                .split(/\s+/);

        if (words.length === 1) {

            return words[0]
                .charAt(0)
                .toUpperCase();
        }

        return (
            words[0].charAt(0) +
            words[1].charAt(0)
        ).toUpperCase();
    };


    const fetchFamilyStaffSummary =
        async () => {

            if (
                !family_id ||
                !start_date ||
                !end_date
            ) {

                toast.error(
                    "Family or date information is missing."
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

                        `${apiBaseUrl}orders/family/${family_id}/staff/summary/${start_date}/${end_date}/`,

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

                    setFamily({

                        family_id:
                            data
                                ?.family
                                ?.family_id ||
                            family_id,

                        family_name:
                            data
                                ?.family
                                ?.family_name ||
                            "",

                    });

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

                    setStaffWise(

                        Array.isArray(
                            data?.staff_wise
                        )
                            ? data.staff_wise
                            : []

                    );

                } else {

                    setStaffWise([]);

                    setSummary({
                        total_orders: 0,
                        total_amount: 0,
                    });


                    toast.error(
                        data?.message ||
                        "Failed to load staff summary."
                    );
                }

            } catch (error) {

                console.error(
                    "Family staff summary error:",
                    error
                );


                setStaffWise([]);

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
                        "Failed to load family staff summary."
                    );
                }

            } finally {

                setLoading(false);
            }
        };

    useEffect(() => {

        fetchFamilyStaffSummary();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        family_id,
        start_date,
        end_date,
    ]);

    const totalStaff =
        staffWise.length;

    const topStaff =
        staffWise.length > 0
            ? [...staffWise].sort(
                (a, b) =>
                    Number(
                        b?.total_amount ||
                        0
                    ) -
                    Number(
                        a?.total_amount ||
                        0
                    )
            )[0]
            : null;

    document.title =
        "Family Staff Summary | BEPOSOFT";


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
                                                    "26px",
                                            }}
                                        >
                                            <i className="bx bx-group"></i>
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
                                                Division Staff Performance
                                            </div>


                                            <h4
                                                className="
                                                    mb-1
                                                    text-white
                                                    fw-bold
                                                "
                                                style={{
                                                    textTransform:
                                                        "capitalize",
                                                }}
                                            >
                                                {family.family_name ||
                                                    "Family"}
                                            </h4>


                                            <p
                                                className="mb-0"
                                                style={{
                                                    color:
                                                        "rgba(255,255,255,0.72)",
                                                }}
                                            >
                                                Staff-wise order
                                                and billing performance
                                                for the selected period.
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
                                            align-items-center
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
                                            <i className="bx bx-user me-1"></i>

                                            {totalStaff} Staff
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

                        <div className="card-body">

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

                                    <h6 className="fw-bold text-dark mb-1">
                                        Selected Period
                                    </h6>

                                    <span className="text-muted">
                                        Staff performance
                                        calculated for this period
                                    </span>

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
                                            "9px 15px",

                                        fontSize:
                                            "13px",

                                        fontWeight:
                                            600,
                                    }}
                                >
                                    <i className="bx bx-calendar me-1"></i>

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


                    <div className="row mb-4">


                        {/* TOTAL STAFF */}
                        <div
                            className="
                                col-xl-4
                                col-md-6
                                mb-3
                            "
                        >

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
                                            align-items-center
                                            justify-content-between
                                        "
                                    >

                                        <div>

                                            <p className="text-muted mb-1">
                                                Total Staff
                                            </p>

                                            <h3 className="mb-0 fw-bold text-dark">
                                                {totalStaff}
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
                                            <i className="bx bx-group"></i>
                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>


                        {/* TOTAL ORDERS */}
                        <div
                            className="
                                col-xl-4
                                col-md-6
                                mb-3
                            "
                        >

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
                                            align-items-center
                                            justify-content-between
                                        "
                                    >

                                        <div>

                                            <p className="text-muted mb-1">
                                                Total Orders
                                            </p>

                                            <h3 className="mb-0 fw-bold">
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
                                                    "#fff7ed",

                                                color:
                                                    "#f97316",

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
                        <div
                            className="
                                col-xl-4
                                col-md-6
                                mb-3
                            "
                        >

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
                                            align-items-center
                                            justify-content-between
                                        "
                                    >

                                        <div>

                                            <p className="text-muted mb-1">
                                                Total Amount
                                            </p>

                                            <h3
                                                className="mb-0 fw-bold"
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
                        STAFF PERFORMANCE
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


                        {/* HEADER */}
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
                                        Staff Performance
                                    </h5>

                                    <p className="text-muted mb-0">
                                        Individual staff order
                                        and billing contribution.
                                    </p>

                                </div>


                                {topStaff && (

                                    <span
                                        className="badge"
                                        style={{
                                            background:
                                                "#ecfdf5",

                                            color:
                                                "#15803d",

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
                                        <i className="bx bx-trophy me-1"></i>

                                        Top:{" "}
                                        {topStaff.staff_name}
                                    </span>

                                )}

                            </div>

                        </div>


                        {/* BODY */}
                        <div
                            className="card-body"
                            style={{
                                padding:
                                    "24px",
                            }}
                        >

                            {loading ? (

                                <div className="row">

                                    {[1, 2, 3, 4, 5, 6].map(
                                        (item) => (

                                            <div
                                                key={item}
                                                className="
                                                    col-xl-4
                                                    col-lg-4
                                                    col-md-6
                                                    mb-4
                                                "
                                            >

                                                <div
                                                    style={{
                                                        height:
                                                            "250px",

                                                        background:
                                                            "#f8fafc",

                                                        borderRadius:
                                                            "18px",

                                                        border:
                                                            "1px solid #edf0f4",

                                                        padding:
                                                            "20px",
                                                    }}
                                                >

                                                    <div
                                                        style={{
                                                            width:
                                                                "52px",

                                                            height:
                                                                "52px",

                                                            borderRadius:
                                                                "16px",

                                                            background:
                                                                "#e5e7eb",

                                                            marginBottom:
                                                                "16px",
                                                        }}
                                                    ></div>


                                                    <div
                                                        style={{
                                                            width:
                                                                "55%",

                                                            height:
                                                                "14px",

                                                            background:
                                                                "#e5e7eb",

                                                            borderRadius:
                                                                "8px",

                                                            marginBottom:
                                                                "10px",
                                                        }}
                                                    ></div>


                                                    <div
                                                        style={{
                                                            width:
                                                                "35%",

                                                            height:
                                                                "11px",

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

                            ) : staffWise.length > 0 ? (

                                <div className="row">

                                    {staffWise.map(
                                        (
                                            staff,
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
                                                    staff.staff_id ||
                                                    index
                                                }
                                            >

                                                <div
                                                    className="h-100"

                                                    onClick={() =>
                                                        navigate(
                                                            `/orders/staff/${staff.staff_id}/summary/${start_date}/${end_date}`
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


                                                    <div
                                                        className="
                                                            d-flex
                                                            align-items-start
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

                                                            {/* AVATAR */}
                                                            <div
                                                                style={{
                                                                    width:
                                                                        "52px",

                                                                    height:
                                                                        "52px",

                                                                    minWidth:
                                                                        "52px",

                                                                    borderRadius:
                                                                        "16px",

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
                                                                        "16px",

                                                                    fontWeight:
                                                                        700,
                                                                }}
                                                            >
                                                                {getInitials(
                                                                    staff.staff_name
                                                                )}
                                                            </div>


                                                            <div>

                                                                <h6
                                                                    className="
                                                                        fw-bold
                                                                        text-dark
                                                                        mb-1
                                                                    "
                                                                >
                                                                    {staff.staff_name ||
                                                                        "-"}
                                                                </h6>


                                                                <div
                                                                    style={{
                                                                        color:
                                                                            "#64748b",

                                                                        fontSize:
                                                                            "12px",
                                                                    }}
                                                                >
                                                                    {staff.designation ||
                                                                        "-"}
                                                                </div>

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

                                                    <div
                                                        style={{
                                                            background:
                                                                "#f8fafc",

                                                            borderRadius:
                                                                "14px",

                                                            padding:
                                                                "14px",

                                                            marginBottom:
                                                                "16px",
                                                        }}
                                                    >

                                                       


                                                        


                                                        <div
                                                            className="
                                                                d-flex
                                                                justify-content-between
                                                            "
                                                        >

                                                            <span
                                                                style={{
                                                                    color:
                                                                        "#64748b",

                                                                    fontSize:
                                                                        "12px",
                                                                }}
                                                            >
                                                                Department
                                                            </span>


                                                            <strong
                                                                style={{
                                                                    color:
                                                                        "#334155",

                                                                    fontSize:
                                                                        "12px",
                                                                }}
                                                            >
                                                                {staff
                                                                    ?.department
                                                                    ?.name ||
                                                                    "-"}
                                                            </strong>

                                                        </div>

                                                    </div>


                                                    {/* =================
                                                        PERFORMANCE
                                                    ================= */}
                                                    <div className="row g-3">


                                                        {/* ORDERS */}
                                                        <div className="col-5">

                                                            <div
                                                                className="h-100"
                                                                style={{
                                                                    background:
                                                                        "#eef2ff",

                                                                    borderRadius:
                                                                        "14px",

                                                                    padding:
                                                                        "14px",
                                                                }}
                                                            >

                                                                <div
                                                                    style={{
                                                                        color:
                                                                            "#64748b",

                                                                        fontSize:
                                                                            "10px",

                                                                        fontWeight:
                                                                            600,

                                                                        textTransform:
                                                                            "uppercase",

                                                                        marginBottom:
                                                                            "5px",
                                                                    }}
                                                                >
                                                                    Orders
                                                                </div>


                                                                <div
                                                                    style={{
                                                                        color:
                                                                            "#4f46e5",

                                                                        fontWeight:
                                                                            700,

                                                                        fontSize:
                                                                            "21px",
                                                                    }}
                                                                >
                                                                    {Number(
                                                                        staff.total_orders ||
                                                                        0
                                                                    ).toLocaleString(
                                                                        "en-IN"
                                                                    )}
                                                                </div>

                                                            </div>

                                                        </div>


                                                        {/* AMOUNT */}
                                                        <div className="col-7">

                                                            <div
                                                                className="h-100"
                                                                style={{
                                                                    background:
                                                                        "#ecfdf5",

                                                                    borderRadius:
                                                                        "14px",

                                                                    padding:
                                                                        "14px",
                                                                }}
                                                            >

                                                                <div
                                                                    style={{
                                                                        color:
                                                                            "#64748b",

                                                                        fontSize:
                                                                            "10px",

                                                                        fontWeight:
                                                                            600,

                                                                        textTransform:
                                                                            "uppercase",

                                                                        marginBottom:
                                                                            "5px",
                                                                    }}
                                                                >
                                                                    Amount
                                                                </div>


                                                                <div
                                                                    style={{
                                                                        color:
                                                                            "#10b981",

                                                                        fontWeight:
                                                                            700,

                                                                        fontSize:
                                                                            "16px",

                                                                        wordBreak:
                                                                            "break-word",
                                                                    }}
                                                                >
                                                                    ₹{" "}
                                                                    {formatCurrency(
                                                                        staff.total_amount
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
                                        <i className="bx bx-user-x"></i>
                                    </div>


                                    <h5 className="fw-bold text-dark mb-2">
                                        No staff data available
                                    </h5>


                                    <p className="text-muted mb-0">
                                        No staff order data was
                                        found for this division
                                        and date range.
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


export default FamilyStaffSummary;