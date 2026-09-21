import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
    Card,
    CardBody,
    Col,
    Row,
    Table,
    Button,
    Spinner,
    Alert
} from "reactstrap";
import {
    useLocation,
    useNavigate,
    useParams
} from "react-router-dom";

const localDate = () => {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const money = (value) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Number(value ?? 0));

const CompanyFinanceReport = () => {
    const { companyId } = useParams();

    const navigate = useNavigate();
    const location = useLocation();

    const [startDate, setStartDate] = useState(localDate);
    const [endDate, setEndDate] = useState(localDate);

    const [appliedDates, setAppliedDates] = useState(() => ({
        start: localDate(),
        end: localDate()
    }));

    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    document.title = "Company Finance Report | BEPOSOFT";

    const fetchReport = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const token = localStorage.getItem("token");

            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}finance/report/company/wise/${companyId}/`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    params: {
                        start_date: appliedDates.start,
                        end_date: appliedDates.end
                    }
                }
            );

            if (
                response.data?.status !== "success" ||
                !response.data?.data
            ) {
                throw new Error(
                    "Invalid company finance report response"
                );
            }

            setReport(response.data.data);
        } catch (err) {
            setReport(null);

            setError(
                err.response?.data?.message ||
                err.message ||
                "Failed to load company finance report"
            );
        } finally {
            setLoading(false);
        }
    }, [
        companyId,
        appliedDates.start,
        appliedDates.end
    ]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    const summary = [
        {
            label: "Opening Balance",
            value: money(report?.opening_balance),
            color: "#2563eb",
            background: "#eff6ff",
            icon: "bx bx-wallet"
        },
        {
            label: "Credit",
            value: money(report?.credit),
            color: "#16a34a",
            background: "#ecfdf5",
            icon: "bx bx-trending-up"
        },
        {
            label: "Debit",
            value: money(report?.debit),
            color: "#dc2626",
            background: "#fef2f2",
            icon: "bx bx-trending-down"
        },
        {
            label: "Closing Balance",
            value: money(report?.closing_balance),
            color: "#0891b2",
            background: "#ecfeff",
            icon: "bx bx-money"
        }
    ];

    const companyName =
        report?.company_name ||
        location.state?.companyName ||
        "Company Finance Report";

    const handleFilter = (event) => {
        event.preventDefault();

        if (startDate > endDate) {
            setError("Start date cannot be after end date");
            return;
        }

        setError("");

        setAppliedDates({
            start: startDate,
            end: endDate
        });
    };

    return (
        <div
            className="page-content"
            style={{
                background: "#f5f7fb",
                minHeight: "100vh"
            }}
        >
            <div className="container-fluid">

                {/* HEADER */}

                <div
                    className="card border-0 mb-4"
                    style={{
                        borderRadius: "22px",
                        background:
                            "linear-gradient(135deg, #1f2937 0%, #334155 45%, #0f172a 100%)",
                        boxShadow:
                            "0 12px 35px rgba(15, 23, 42, 0.18)",
                        overflow: "hidden"
                    }}
                >
                    <div className="card-body p-4">

                        <div className="row align-items-center">

                            <div className="col-lg-8">

                                <div className="d-flex align-items-center gap-3">

                                    <div
                                        style={{
                                            width: "58px",
                                            height: "58px",
                                            borderRadius: "18px",
                                            background:
                                                "rgba(255,255,255,0.12)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "#fff",
                                            fontSize: "26px",
                                            flexShrink: 0
                                        }}
                                    >
                                        <i className="bx bx-line-chart"></i>
                                    </div>

                                    <div>

                                        <h4 className="mb-1 text-white fw-bold">
                                            {companyName}
                                        </h4>

                                        <p
                                            className="mb-0"
                                            style={{
                                                color:
                                                    "rgba(255,255,255,0.72)"
                                            }}
                                        >
                                            View company-wise bank balances,
                                            credits, debits and financial
                                            summaries from one workspace.
                                        </p>

                                    </div>

                                </div>

                            </div>

                            <div className="col-lg-4 mt-4 mt-lg-0">

                                <div className="d-flex justify-content-lg-end gap-2 flex-wrap">

                                    <button
                                        type="button"
                                        onClick={() => navigate(-1)}
                                        className="btn"
                                        style={{
                                            background:
                                                "rgba(255,255,255,0.12)",
                                            color: "#fff",
                                            border:
                                                "1px solid rgba(255,255,255,0.18)",
                                            borderRadius: "12px",
                                            padding: "10px 16px",
                                            fontWeight: 600
                                        }}
                                    >
                                        <i className="bx bx-arrow-back me-2"></i>
                                        Back to Dashboard
                                    </button>

                                </div>

                            </div>

                        </div>

                    </div>
                </div>

                {/* DATE FILTER */}

                <div
                    className="card border-0 mb-4"
                    style={{
                        borderRadius: "22px",
                        boxShadow:
                            "0 10px 35px rgba(15, 23, 42, 0.08)",
                        overflow: "hidden"
                    }}
                >

                    <div
                        className="card-header border-0"
                        style={{
                            background: "#fff",
                            padding: "22px 24px"
                        }}
                    >

                        <div className="d-flex align-items-center gap-3">

                            <div
                                style={{
                                    width: "48px",
                                    height: "48px",
                                    borderRadius: "15px",
                                    background: "#eef2ff",
                                    color: "#4f46e5",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "24px",
                                    flexShrink: 0
                                }}
                            >
                                <i className="bx bx-calendar"></i>
                            </div>

                            <div>

                                <h5 className="mb-1 fw-bold text-dark">
                                    Finance Report Filter
                                </h5>

                                <p className="text-muted mb-0">
                                    Select a date range to view the
                                    company finance report.
                                </p>

                            </div>

                        </div>

                    </div>

                    <div
                        className="card-body"
                        style={{
                            padding: "24px",
                            borderTop: "1px solid #edf0f4"
                        }}
                    >

                        <form onSubmit={handleFilter}>

                            <Row className="g-3 align-items-end">

                                <Col xs={12} md={4}>

                                    <label
                                        htmlFor="finance-start-date"
                                        className="form-label fw-semibold"
                                        style={{
                                            color: "#475569"
                                        }}
                                    >
                                        Start Date
                                    </label>

                                    <input
                                        id="finance-start-date"
                                        type="date"
                                        className="form-control"
                                        value={startDate}
                                        onChange={(event) =>
                                            setStartDate(
                                                event.target.value
                                            )
                                        }
                                        required
                                        style={{
                                            borderRadius: "14px",
                                            padding: "12px 16px",
                                            border:
                                                "1px solid #e5e7eb",
                                            background: "#f8fafc"
                                        }}
                                    />

                                </Col>

                                <Col xs={12} md={4}>

                                    <label
                                        htmlFor="finance-end-date"
                                        className="form-label fw-semibold"
                                        style={{
                                            color: "#475569"
                                        }}
                                    >
                                        End Date
                                    </label>

                                    <input
                                        id="finance-end-date"
                                        type="date"
                                        className="form-control"
                                        value={endDate}
                                        onChange={(event) =>
                                            setEndDate(
                                                event.target.value
                                            )
                                        }
                                        required
                                        style={{
                                            borderRadius: "14px",
                                            padding: "12px 16px",
                                            border:
                                                "1px solid #e5e7eb",
                                            background: "#f8fafc"
                                        }}
                                    />

                                </Col>

                                <Col xs={12} md={4}>

                                    <Button
                                        type="submit"
                                        color="primary"
                                        disabled={loading}
                                        className="w-100"
                                        style={{
                                            borderRadius: "12px",
                                            padding: "12px 16px",
                                            fontWeight: 600
                                        }}
                                    >
                                        <i className="bx bx-filter-alt me-2"></i>
                                        Apply Filter
                                    </Button>

                                </Col>

                            </Row>

                        </form>

                        <div className="mt-3">

                            <span
                                className="badge"
                                style={{
                                    background: "#eef2ff",
                                    color: "#4f46e5",
                                    borderRadius: "999px",
                                    padding: "9px 13px",
                                    fontSize: "12px",
                                    fontWeight: 600
                                }}
                            >
                                <i className="bx bx-calendar-check me-1"></i>

                                Showing: {appliedDates.start} to{" "}
                                {appliedDates.end}

                            </span>

                        </div>

                    </div>

                </div>

                {/* ERROR */}

                {error && (

                    <Alert
                        color="danger"
                        style={{
                            borderRadius: "14px"
                        }}
                    >
                        <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">

                            <span>
                                <i className="bx bx-error-circle me-2"></i>
                                {error}
                            </span>

                            <Button
                                color="danger"
                                outline
                                size="sm"
                                onClick={fetchReport}
                                style={{
                                    borderRadius: "10px"
                                }}
                            >
                                Retry
                            </Button>

                        </div>
                    </Alert>

                )}

                {/* LOADING */}

                {loading ? (

                    <div
                        className="card border-0"
                        style={{
                            borderRadius: "22px",
                            boxShadow:
                                "0 10px 35px rgba(15, 23, 42, 0.08)"
                        }}
                    >

                        <div
                            className="card-body text-center"
                            style={{
                                padding: "70px 20px"
                            }}
                        >

                            <Spinner color="primary" />

                            <h5 className="fw-bold text-dark mt-3 mb-2">
                                Loading Finance Report
                            </h5>

                            <p className="text-muted mb-0">
                                Please wait while we fetch the company
                                bank balances.
                            </p>

                        </div>

                    </div>

                ) : report ? (

                    <>

                        {/* SUMMARY CARDS */}

                        <Row className="mb-4">

                            {summary.map((item) => (

                                <Col
                                    key={item.label}
                                    xl={3}
                                    lg={4}
                                    md={6}
                                    xs={12}
                                    className="mb-3"
                                >

                                    <div
                                        className="card border-0 h-100"
                                        style={{
                                            borderRadius: "18px",
                                            boxShadow:
                                                "0 8px 25px rgba(15, 23, 42, 0.06)"
                                        }}
                                    >

                                        <div className="card-body">

                                            <div className="d-flex align-items-center justify-content-between gap-3">

                                                <div
                                                    style={{
                                                        minWidth: 0
                                                    }}
                                                >

                                                    <p className="text-muted mb-1">
                                                        {item.label}
                                                    </p>

                                                    <h4
                                                        className="mb-0 fw-bold"
                                                        style={{
                                                            color:
                                                                "#1f2937",
                                                            overflowWrap:
                                                                "anywhere"
                                                        }}
                                                    >
                                                        {item.value}
                                                    </h4>

                                                </div>

                                                <div
                                                    style={{
                                                        width: "48px",
                                                        height: "48px",
                                                        minWidth: "48px",
                                                        borderRadius:
                                                            "15px",
                                                        background:
                                                            item.background,
                                                        color:
                                                            item.color,
                                                        display: "flex",
                                                        alignItems:
                                                            "center",
                                                        justifyContent:
                                                            "center",
                                                        fontSize: "24px"
                                                    }}
                                                >
                                                    <i
                                                        className={
                                                            item.icon
                                                        }
                                                    ></i>
                                                </div>

                                            </div>

                                        </div>

                                    </div>

                                </Col>

                            ))}

                        </Row>

                        {/* BANK WISE REPORT */}

                        <div
                            className="card border-0"
                            style={{
                                borderRadius: "22px",
                                boxShadow:
                                    "0 10px 35px rgba(15, 23, 42, 0.08)",
                                overflow: "hidden"
                            }}
                        >

                            <div
                                className="card-header border-0"
                                style={{
                                    background: "#fff",
                                    padding: "22px 24px"
                                }}
                            >

                                <div className="row align-items-center">

                                    <div className="col-lg-8">

                                        <div className="d-flex align-items-center gap-3">

                                            <div
                                                style={{
                                                    width: "48px",
                                                    height: "48px",
                                                    borderRadius: "15px",
                                                    background:
                                                        "#eef2ff",
                                                    color: "#4f46e5",
                                                    display: "flex",
                                                    alignItems:
                                                        "center",
                                                    justifyContent:
                                                        "center",
                                                    fontSize: "24px",
                                                    flexShrink: 0
                                                }}
                                            >
                                                <i className="bx bx-buildings"></i>
                                            </div>

                                            <div>

                                                <h5 className="mb-1 fw-bold text-dark">
                                                    Bank-wise Breakdown
                                                </h5>

                                                <p className="text-muted mb-0">
                                                    View opening balance,
                                                    credit, debit and
                                                    closing balance for
                                                    each bank.
                                                </p>

                                            </div>

                                        </div>

                                    </div>

                                    <div className="col-lg-4 mt-3 mt-lg-0">

                                        <div className="d-flex justify-content-lg-end">

                                            <span
                                                className="badge"
                                                style={{
                                                    background:
                                                        "#eef2ff",
                                                    color: "#4f46e5",
                                                    borderRadius:
                                                        "999px",
                                                    padding:
                                                        "10px 14px",
                                                    fontSize: "13px",
                                                    fontWeight: 600
                                                }}
                                            >
                                                Total Banks:{" "}
                                                {report.total_banks ?? 0}
                                            </span>

                                        </div>

                                    </div>

                                </div>

                            </div>

                            <div className="card-body p-0">

                                {(report.banks || []).length > 0 ? (

                                    <div className="table-responsive">

                                        <Table className="align-middle mb-0">

                                            <thead>

                                                <tr
                                                    style={{
                                                        background:
                                                            "#f8fafc",
                                                        borderTop:
                                                            "1px solid #edf0f4"
                                                    }}
                                                >

                                                    {[
                                                        "#",
                                                        "Bank Name",
                                                        "Opening Balance",
                                                        "Credit",
                                                        "Debit",
                                                        "Closing Balance"
                                                    ].map(
                                                        (
                                                            heading,
                                                            index
                                                        ) => (

                                                            <th
                                                                key={
                                                                    heading
                                                                }
                                                                className={
                                                                    index >= 2
                                                                        ? "text-end"
                                                                        : ""
                                                                }
                                                                style={{
                                                                    padding:
                                                                        "16px 22px",
                                                                    color:
                                                                        "#64748b",
                                                                    fontSize:
                                                                        "12px",
                                                                    letterSpacing:
                                                                        "0.04em",
                                                                    textTransform:
                                                                        "uppercase",
                                                                    borderBottom:
                                                                        "1px solid #edf0f4",
                                                                    whiteSpace:
                                                                        "nowrap"
                                                                }}
                                                            >
                                                                {heading}
                                                            </th>

                                                        )
                                                    )}

                                                </tr>

                                            </thead>

                                            <tbody>

                                                {report.banks.map(
                                                    (bank, index) => (

                                                        <tr
                                                            key={bank.id}
                                                            style={{
                                                                borderBottom:
                                                                    "1px solid #f1f5f9"
                                                            }}
                                                        >

                                                            <td
                                                                style={{
                                                                    padding:
                                                                        "18px 22px",
                                                                    color:
                                                                        "#64748b",
                                                                    fontWeight:
                                                                        600
                                                                }}
                                                            >
                                                                {index + 1}
                                                            </td>

                                                            <td
                                                                style={{
                                                                    padding:
                                                                        "18px 22px"
                                                                }}
                                                            >

                                                                <div className="d-flex align-items-center gap-3">

                                                                    <div
                                                                        style={{
                                                                            width:
                                                                                "44px",
                                                                            height:
                                                                                "44px",
                                                                            minWidth:
                                                                                "44px",
                                                                            borderRadius:
                                                                                "14px",
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
                                                                                "22px"
                                                                        }}
                                                                    >
                                                                        <i className="bx bx-building-house"></i>
                                                                    </div>

                                                                    <div>

                                                                        <h6 className="mb-1 fw-bold text-dark">
                                                                            {bank.name}
                                                                        </h6>

                                                                        <span
                                                                            style={{
                                                                                color:
                                                                                    "#94a3b8",
                                                                                fontSize:
                                                                                    "12px"
                                                                            }}
                                                                        >
                                                                            Bank ID:{" "}
                                                                            {bank.id}
                                                                        </span>

                                                                    </div>

                                                                </div>

                                                            </td>

                                                            <td
                                                                className="text-end"
                                                                style={{
                                                                    padding:
                                                                        "18px 22px",
                                                                    color:
                                                                        "#475569",
                                                                    fontWeight:
                                                                        600,
                                                                    whiteSpace:
                                                                        "nowrap"
                                                                }}
                                                            >
                                                                {money(
                                                                    bank.opening_balance
                                                                )}
                                                            </td>

                                                            <td
                                                                className="text-end"
                                                                style={{
                                                                    padding:
                                                                        "18px 22px",
                                                                    whiteSpace:
                                                                        "nowrap"
                                                                }}
                                                            >

                                                                <span
                                                                    className="badge"
                                                                    style={{
                                                                        background:
                                                                            "#dcfce7",
                                                                        color:
                                                                            "#15803d",
                                                                        borderRadius:
                                                                            "999px",
                                                                        padding:
                                                                            "8px 12px",
                                                                        fontSize:
                                                                            "13px",
                                                                        fontWeight:
                                                                            600
                                                                    }}
                                                                >
                                                                    {money(
                                                                        bank.credit
                                                                    )}
                                                                </span>

                                                            </td>

                                                            <td
                                                                className="text-end"
                                                                style={{
                                                                    padding:
                                                                        "18px 22px",
                                                                    whiteSpace:
                                                                        "nowrap"
                                                                }}
                                                            >

                                                                <span
                                                                    className="badge"
                                                                    style={{
                                                                        background:
                                                                            "#fee2e2",
                                                                        color:
                                                                            "#b91c1c",
                                                                        borderRadius:
                                                                            "999px",
                                                                        padding:
                                                                            "8px 12px",
                                                                        fontSize:
                                                                            "13px",
                                                                        fontWeight:
                                                                            600
                                                                    }}
                                                                >
                                                                    {money(
                                                                        bank.debit
                                                                    )}
                                                                </span>

                                                            </td>

                                                            <td
                                                                className="text-end"
                                                                style={{
                                                                    padding:
                                                                        "18px 22px",
                                                                    whiteSpace:
                                                                        "nowrap"
                                                                }}
                                                            >

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
                                                                            "8px 12px",
                                                                        fontSize:
                                                                            "13px",
                                                                        fontWeight:
                                                                            700
                                                                    }}
                                                                >
                                                                    {money(
                                                                        bank.closing_balance
                                                                    )}
                                                                </span>

                                                            </td>

                                                        </tr>

                                                    )
                                                )}

                                            </tbody>

                                        </Table>

                                    </div>

                                ) : (

                                    <div
                                        className="text-center"
                                        style={{
                                            padding: "70px 20px"
                                        }}
                                    >

                                        <div
                                            style={{
                                                width: "82px",
                                                height: "82px",
                                                borderRadius: "26px",
                                                background: "#f1f5f9",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                margin: "0 auto 18px",
                                                color: "#64748b",
                                                fontSize: "38px"
                                            }}
                                        >
                                            <i className="bx bx-buildings"></i>
                                        </div>

                                        <h5 className="fw-bold text-dark mb-2">
                                            No Banks Found
                                        </h5>

                                        <p className="text-muted mb-0">
                                            No bank records are available
                                            for this company.
                                        </p>

                                    </div>

                                )}

                            </div>

                        </div>

                    </>

                ) : !error ? (

                    <div
                        className="card border-0"
                        style={{
                            borderRadius: "22px",
                            boxShadow:
                                "0 10px 35px rgba(15, 23, 42, 0.08)"
                        }}
                    >

                        <div
                            className="card-body text-center"
                            style={{
                                padding: "70px 20px"
                            }}
                        >

                            <div
                                style={{
                                    width: "82px",
                                    height: "82px",
                                    borderRadius: "26px",
                                    background: "#f1f5f9",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    margin: "0 auto 18px",
                                    color: "#64748b",
                                    fontSize: "38px"
                                }}
                            >
                                <i className="bx bx-file-blank"></i>
                            </div>

                            <h5 className="fw-bold text-dark mb-2">
                                No Finance Report Available
                            </h5>

                            <p className="text-muted mb-0">
                                No finance report is available for
                                the selected date range.
                            </p>

                        </div>

                    </div>

                ) : null}

            </div>
        </div>
    );
};

export default CompanyFinanceReport;