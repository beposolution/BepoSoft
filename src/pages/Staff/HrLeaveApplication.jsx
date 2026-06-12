import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    Card,
    CardBody,
    Col,
    Container,
    Row,
    Spinner,
    Table,
    Badge,
    Input,
} from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const HrLeaveApplication = () => {
    document.title = "Staffs Leave Applications | Beposoft";

    const token = localStorage.getItem("token");
    const baseUrl = import.meta.env.VITE_APP_KEY;

    const [loading, setLoading] = useState(false);
    const [leaveData, setLeaveData] = useState([]);
    const [searchText, setSearchText] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const apiBase = useMemo(() => {
        if (!baseUrl) return "";
        const trimmed = baseUrl.replace(/\/+$/, "");
        return trimmed.endsWith("/api") ? `${trimmed}/` : `${trimmed}/api/`;
    }, [baseUrl]);

    const buildUrl = path => `${apiBase}${path.replace(/^\/+/, "")}`;

    const authHeaders = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    };

    const formatLeaveType = value => {
        if (!value) return "-";
        return value.replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase());
    };

    const formatDate = value => {
        if (!value) return "-";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleDateString();
    };

    const getStatusBadge = status => {
        switch (status) {
            case "approved":
                return <Badge color="success">Approved</Badge>;
            case "rejected":
                return <Badge color="danger">Rejected</Badge>;
            default:
                return <Badge color="warning">Pending</Badge>;
        }
    };

    const fetchLeaveApplications = async () => {
        try {
            setLoading(true);
            const res = await axios.get(buildUrl("employee/leaves/all/"), {
                headers: authHeaders,
            });
            setLeaveData(res?.data?.data || []);
        } catch (error) {
            toast.error(
                error?.response?.data?.message || "Failed to fetch leave applications"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaveApplications();
    }, []);

    const filteredData = useMemo(() => {
        let items = [...leaveData];

        if (statusFilter !== "all") {
            items = items.filter(item => item.approval_status === statusFilter);
        }

        if (searchText.trim()) {
            const q = searchText.toLowerCase().trim();
            items = items.filter(item => {
                return (
                    String(item.employee_name || "").toLowerCase().includes(q) ||
                    String(item.manager_name || "").toLowerCase().includes(q) ||
                    String(item.leave_type || "").toLowerCase().includes(q) ||
                    String(item.reason || "").toLowerCase().includes(q) ||
                    String(item.approval_status || "").toLowerCase().includes(q)
                );
            });
        }

        return items;
    }, [leaveData, searchText, statusFilter]);

    const totalCount = leaveData.length;
    const pendingCount = leaveData.filter(
        item => item.approval_status === "pending"
    ).length;
    const approvedCount = leaveData.filter(
        item => item.approval_status === "approved"
    ).length;
    const rejectedCount = leaveData.filter(
        item => item.approval_status === "rejected"
    ).length;

    if (loading) {
        return (
            <div
                className="page-content"
                style={{ background: "#f5f7fb", minHeight: "100vh" }}
            >
                <Container fluid>
                    <div className="text-center py-5">
                        <Spinner />
                    </div>
                </Container>
            </div>
        );
    }

    return (
        <React.Fragment>
            <div
                className="page-content"
                style={{
                    background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
                    minHeight: "100vh",
                }}
            >
                <style>{`
        .leave-dashboard-card {
          transition: all 0.25s ease;
        }
        .leave-dashboard-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 35px rgba(15, 23, 42, 0.10) !important;
        }
        .leave-table thead th {
          font-size: 12px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: #475569;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0 !important;
        }
        .leave-table tbody tr {
          transition: all 0.2s ease;
        }
        .leave-table tbody tr:hover {
          background: #f8fafc !important;
        }
      `}</style>

                <Container fluid>
                    {/* <Breadcrumbs
          title="Leave Management"
          breadcrumbItem="HR Leave Applications"
        /> */}

                    <Card
                        className="border-0 mb-4 overflow-hidden leave-dashboard-card"
                        style={{
                            borderRadius: "24px",
                            background:
                                "linear-gradient(135deg, #0f172a 0%, #1e293b 45%, #334155 100%)",
                            boxShadow: "0 14px 40px rgba(15, 23, 42, 0.18)",
                        }}
                    >
                        <CardBody className="p-3 p-md-4">
                            <div className="d-flex align-items-center">
                                {/* Left Section */}
                                <div className="d-flex align-items-center gap-3">
                                    <div
                                        style={{
                                            width: "52px",
                                            height: "52px",
                                            borderRadius: "14px",
                                            background: "rgba(255,255,255,0.12)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "#fff",
                                            fontSize: "24px",
                                            flexShrink: 0,
                                        }}
                                    >
                                        <i className="bx bx-calendar"></i>
                                    </div>

                                    <div>
                                        <h4
                                            className="mb-1 text-white fw-bold"
                                            style={{
                                                fontSize: "28px",
                                                lineHeight: "1.2",
                                            }}
                                        >
                                            Staffs Leave Applications
                                        </h4>

                                        <p
                                            className="mb-0"
                                            style={{
                                                color: "rgba(255,255,255,0.72)",
                                                fontSize: "14px",
                                            }}
                                        >
                                            View and manage employee leave requests across the organization.
                                        </p>
                                    </div>
                                </div>

                                {/* Right Section */}
                                <div className="d-flex align-items-center gap-2 ms-auto">
                                    <div
                                        style={{
                                            padding: "6px 12px",
                                            borderRadius: "999px",
                                            background: "rgba(255,255,255,0.12)",
                                            color: "#fff",
                                            fontSize: "12px",
                                            fontWeight: 600,
                                        }}
                                    >
                                        Total : {totalCount}
                                    </div>

                                    <div
                                        style={{
                                            padding: "6px 12px",
                                            borderRadius: "999px",
                                            background: "rgba(245,158,11,0.18)",
                                            color: "#fde68a",
                                            fontSize: "12px",
                                            fontWeight: 600,
                                        }}
                                    >
                                        Pending : {pendingCount}
                                    </div>

                                    <div
                                        style={{
                                            padding: "6px 12px",
                                            borderRadius: "999px",
                                            background: "rgba(34,197,94,0.18)",
                                            color: "#bbf7d0",
                                            fontSize: "12px",
                                            fontWeight: 600,
                                        }}
                                    >
                                        Approved : {approvedCount}
                                    </div>

                                    <div
                                        style={{
                                            padding: "6px 12px",
                                            borderRadius: "999px",
                                            background: "rgba(239,68,68,0.18)",
                                            color: "#fecaca",
                                            fontSize: "12px",
                                            fontWeight: 600,
                                        }}
                                    >
                                        Rejected : {rejectedCount}
                                    </div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Row className="mb-4">
                        <Col md={6} xl={3} className="mb-3">
                            <Card
                                className="border-0 h-100 leave-dashboard-card"
                                style={{
                                    borderRadius: "20px",
                                    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
                                    borderTop: "4px solid #64748b",
                                }}
                            >
                                <CardBody className="p-4">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <p className="text-muted mb-1">Total Applications</p>
                                            <h3 className="fw-bold mb-0">{totalCount}</h3>
                                        </div>
                                        <div
                                            style={{
                                                width: "48px",
                                                height: "48px",
                                                borderRadius: "14px",
                                                background: "#eef2ff",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: "#4f46e5",
                                                fontSize: "22px",
                                            }}
                                        >
                                            <i className="bx bx-file"></i>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>

                        <Col md={6} xl={3} className="mb-3">
                            <Card
                                className="border-0 h-100 leave-dashboard-card"
                                style={{
                                    borderRadius: "20px",
                                    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
                                    borderTop: "4px solid #f59e0b",
                                }}
                            >
                                <CardBody className="p-4">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <p className="text-muted mb-1">Pending</p>
                                            <h3 className="fw-bold text-warning mb-0">
                                                {pendingCount}
                                            </h3>
                                        </div>
                                        <div
                                            style={{
                                                width: "48px",
                                                height: "48px",
                                                borderRadius: "14px",
                                                background: "#fff7ed",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: "#f59e0b",
                                                fontSize: "22px",
                                            }}
                                        >
                                            <i className="bx bx-time-five"></i>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>

                        <Col md={6} xl={3} className="mb-3">
                            <Card
                                className="border-0 h-100 leave-dashboard-card"
                                style={{
                                    borderRadius: "20px",
                                    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
                                    borderTop: "4px solid #22c55e",
                                }}
                            >
                                <CardBody className="p-4">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <p className="text-muted mb-1">Approved</p>
                                            <h3 className="fw-bold text-success mb-0">
                                                {approvedCount}
                                            </h3>
                                        </div>
                                        <div
                                            style={{
                                                width: "48px",
                                                height: "48px",
                                                borderRadius: "14px",
                                                background: "#f0fdf4",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: "#22c55e",
                                                fontSize: "22px",
                                            }}
                                        >
                                            <i className="bx bx-check-circle"></i>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>

                        <Col md={6} xl={3} className="mb-3">
                            <Card
                                className="border-0 h-100 leave-dashboard-card"
                                style={{
                                    borderRadius: "20px",
                                    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
                                    borderTop: "4px solid #ef4444",
                                }}
                            >
                                <CardBody className="p-4">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <p className="text-muted mb-1">Rejected</p>
                                            <h3 className="fw-bold text-danger mb-0">
                                                {rejectedCount}
                                            </h3>
                                        </div>
                                        <div
                                            style={{
                                                width: "48px",
                                                height: "48px",
                                                borderRadius: "14px",
                                                background: "#fef2f2",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: "#ef4444",
                                                fontSize: "22px",
                                            }}
                                        >
                                            <i className="bx bx-x-circle"></i>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    <Card
                        className="border-0 leave-dashboard-card"
                        style={{
                            borderRadius: "22px",
                            boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
                            overflow: "hidden",
                        }}
                    >
                        <div
                            style={{
                                padding: "20px 24px",
                                borderBottom: "1px solid #e2e8f0",
                                background:
                                    "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
                            }}
                        >
                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                                <div>
                                    <h5 className="fw-bold mb-1">Leave Applications</h5>
                                    <small className="text-muted">
                                        Showing {filteredData.length} of {leaveData.length} records
                                    </small>
                                </div>

                                <div
                                    className="d-flex gap-2 flex-wrap p-2"
                                    style={{
                                        background: "#f8fafc",
                                        borderRadius: "16px",
                                        border: "1px solid #e2e8f0",
                                    }}
                                >
                                    <Input
                                        type="text"
                                        placeholder="Search employee, manager, reason..."
                                        value={searchText}
                                        onChange={(e) => setSearchText(e.target.value)}
                                        style={{
                                            minWidth: "280px",
                                            borderRadius: "12px",
                                            border: "1px solid #dbe3ee",
                                            boxShadow: "none",
                                        }}
                                    />

                                    <Input
                                        type="select"
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        style={{
                                            minWidth: "170px",
                                            borderRadius: "12px",
                                            border: "1px solid #dbe3ee",
                                            boxShadow: "none",
                                        }}
                                    >
                                        <option value="all">All Status</option>
                                        <option value="pending">Pending</option>
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Rejected</option>
                                    </Input>
                                </div>
                            </div>
                        </div>

                        <CardBody className="p-0">
                            <div className="table-responsive">
                                <Table className="align-middle mb-0 leave-table">
                                    <thead>
                                        <tr>
                                            <th style={{ padding: "16px 18px" }}>#</th>
                                            <th style={{ padding: "16px 18px", minWidth: "200px" }}>
                                                Employee
                                            </th>
                                            <th style={{ padding: "16px 18px", minWidth: "200px" }}>
                                                Manager
                                            </th>
                                            <th style={{ padding: "16px 18px" }}>Leave Type</th>
                                            <th style={{ padding: "16px 18px" }}>Days</th>
                                            <th style={{ padding: "16px 18px" }}>Start Date</th>
                                            <th style={{ padding: "16px 18px" }}>End Date</th>
                                            <th style={{ padding: "16px 18px", minWidth: "260px" }}>
                                                Reason
                                            </th>
                                            <th style={{ padding: "16px 18px" }}>Status</th>
                                            <th style={{ padding: "16px 18px", minWidth: "180px" }}>
                                                Manager Note
                                            </th>
                                            <th style={{ padding: "16px 18px" }}>Applied On</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {filteredData.length > 0 ? (
                                            filteredData.map((item, index) => (
                                                <tr
                                                    key={item.id}
                                                    style={{
                                                        backgroundColor:
                                                            index % 2 === 0 ? "#ffffff" : "#f8fafc",
                                                    }}
                                                >
                                                    <td style={{ padding: "16px 18px", color: "#64748b" }}>
                                                        {index + 1}
                                                    </td>

                                                    <td style={{ padding: "16px 18px" }}>
                                                        <div className="d-flex align-items-center gap-3">
                                                            <div
                                                                style={{
                                                                    width: "40px",
                                                                    height: "40px",
                                                                    borderRadius: "50%",
                                                                    background:
                                                                        "linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                    fontWeight: 700,
                                                                    color: "#334155",
                                                                    flexShrink: 0,
                                                                }}
                                                            >
                                                                {(item.employee_name?.charAt(0) || "E").toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div className="fw-bold">
                                                                    {item.employee_name || "-"}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td style={{ padding: "16px 18px" }}>
                                                        <div className="fw-bold">{item.manager_name || "-"}</div>
                                                    </td>

                                                    <td style={{ padding: "16px 18px" }}>
                                                        <span
                                                            style={{
                                                                display: "inline-flex",
                                                                padding: "6px 10px",
                                                                borderRadius: "999px",
                                                                background: "#eff6ff",
                                                                color: "#2563eb",
                                                                fontSize: "12px",
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            {formatLeaveType(item.leave_type)}
                                                        </span>
                                                    </td>

                                                    <td style={{ padding: "16px 18px", fontWeight: 600 }}>
                                                        {item.no_of_days}
                                                    </td>

                                                    <td style={{ padding: "16px 18px" }}>
                                                        {formatDate(item.start_date)}
                                                    </td>

                                                    <td style={{ padding: "16px 18px" }}>
                                                        {formatDate(item.end_date)}
                                                    </td>

                                                    <td
                                                        style={{
                                                            padding: "16px 18px",
                                                            maxWidth: "260px",
                                                            whiteSpace: "normal",
                                                            wordBreak: "break-word",
                                                            color: "#475569",
                                                        }}
                                                    >
                                                        {item.reason || "-"}
                                                    </td>

                                                    <td style={{ padding: "16px 18px" }}>
                                                        {getStatusBadge(item.approval_status)}
                                                    </td>

                                                    <td
                                                        style={{
                                                            padding: "16px 18px",
                                                            maxWidth: "200px",
                                                            whiteSpace: "normal",
                                                            wordBreak: "break-word",
                                                            color: "#475569",
                                                        }}
                                                    >
                                                        {item.manager_note || "-"}
                                                    </td>

                                                    <td style={{ padding: "16px 18px", color: "#475569" }}>
                                                        {formatDate(item.created_at)}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="11" className="text-center py-5 text-muted">
                                                    <div className="py-4">
                                                        <i
                                                            className="bx bx-folder-open"
                                                            style={{ fontSize: "42px", color: "#cbd5e1" }}
                                                        ></i>
                                                        <div className="mt-2 fw-semibold">
                                                            No Leave Applications Found
                                                        </div>
                                                        <div className="small text-muted">
                                                            Try changing the search text or status filter.
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        </CardBody>
                    </Card>

                    <div
                        className="mt-3"
                        style={{
                            color: "#64748b",
                            fontSize: "13px",
                            textAlign: "right",
                        }}
                    >
                        Showing {filteredData.length} record{filteredData.length !== 1 ? "s" : ""}
                    </div>

                    <ToastContainer />
                </Container>
            </div>
        </React.Fragment>
    );
};

export default HrLeaveApplication;