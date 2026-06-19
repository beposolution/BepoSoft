import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    Card,
    CardBody,
    Col,
    Container,
    Row,
    Button,
    Spinner,
    Table,
    Input,
    Label,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from "reactstrap";
import Select from "react-select";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AttendanceManagerApproval = () => {
    document.title = "Attendance Approval | Beposoft";

    const token = localStorage.getItem("token");
    const baseUrl = import.meta.env.VITE_APP_KEY;

    const todayDate = new Date().toISOString().split("T")[0];

    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const [attendanceTeams, setAttendanceTeams] = useState([]);
    const [allAttendanceRows, setAllAttendanceRows] = useState([]);

    const [teamOptions, setTeamOptions] = useState([]);
    const [memberOptions, setMemberOptions] = useState([]);

    const [editModal, setEditModal] = useState(false);
    const [editLoading, setEditLoading] = useState(false);

    const [editData, setEditData] = useState({
        id: "",
        attendance_time: "",
        status: "",
        approval_status: "",
        manager_note: "",
    });

    const statusOptions = [
        { value: "present", label: "Present" },
        { value: "absent", label: "Absent" },
        { value: "half_day", label: "Half Day" },
    ];

    const editApprovalOptions = [
        { value: "pending", label: "Pending" },
        { value: "approved", label: "Approved" },
        { value: "rejected", label: "Rejected" },
    ];

    const [filters, setFilters] = useState({
        start_date: todayDate,
        end_date: todayDate,
        team: "",
        member: "",
        approval_status: "all",
    });

    const [confirmModal, setConfirmModal] = useState(false);
    const [selectedAttendance, setSelectedAttendance] = useState(null);
    const [selectedAction, setSelectedAction] = useState("");
    const [managerNote, setManagerNote] = useState("");

    const apiBase = useMemo(() => {
        if (!baseUrl) return "";

        const trimmed = baseUrl.replace(/\/+$/, "");

        if (trimmed.endsWith("/api")) {
            return `${trimmed}/`;
        }

        return `${trimmed}/api/`;
    }, [baseUrl]);

    const buildUrl = path => {
        return `${apiBase}${path.replace(/^\/+/, "")}`;
    };

    const authHeaders = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    };

    const selectStyles = {
        control: provided => ({
            ...provided,
            minHeight: "46px",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            background: "#f8fafc",
        }),
        menuPortal: base => ({
            ...base,
            zIndex: 999999,
        }),
        menu: base => ({
            ...base,
            zIndex: 999999,
        }),
    };

    const approvalOptions = [
        { value: "all", label: "All" },
        { value: "pending", label: "Pending" },
        { value: "approved", label: "Approved" },
        { value: "rejected", label: "Rejected" },
        { value: "default_absent", label: "Default Absent" },
    ];

    const formatDateTime = value => {
        if (!value) return "-";

        try {
            return new Date(value).toLocaleString();
        } catch {
            return value;
        }
    };

    const formatStatusLabel = status => {
        if (status === "present") return "Present";
        if (status === "absent") return "Absent";
        if (status === "half_day") return "Half Day";
        return status || "-";
    };

    const formatApprovalLabel = status => {
        if (status === "pending") return "Pending";
        if (status === "approved") return "Approved";
        if (status === "rejected") return "Rejected";
        if (status === "default_absent") return "Default Absent";
        return status || "-";
    };

    const getStatusBadge = status => {
        if (status === "present") {
            return (
                <span
                    className="badge"
                    style={{
                        background: "#dcfce7",
                        color: "#15803d",
                        borderRadius: "999px",
                        padding: "8px 12px",
                        fontSize: "12px",
                    }}
                >
                    <i className="bx bx-check me-1"></i>
                    Present
                </span>
            );
        }

        if (status === "half_day") {
            return (
                <span
                    className="badge"
                    style={{
                        background: "#ffedd5",
                        color: "#c2410c",
                        borderRadius: "999px",
                        padding: "8px 12px",
                        fontSize: "12px",
                    }}
                >
                    <i className="bx bx-time-five me-1"></i>
                    Half Day
                </span>
            );
        }

        return (
            <span
                className="badge"
                style={{
                    background: "#fee2e2",
                    color: "#dc2626",
                    borderRadius: "999px",
                    padding: "8px 12px",
                    fontSize: "12px",
                }}
            >
                <i className="bx bx-x me-1"></i>
                Absent
            </span>
        );
    };

    const getApprovalBadge = approvalStatus => {
        if (approvalStatus === "approved") {
            return (
                <span
                    className="badge"
                    style={{
                        background: "#dcfce7",
                        color: "#15803d",
                        borderRadius: "999px",
                        padding: "8px 12px",
                        fontSize: "12px",
                    }}
                >
                    Approved
                </span>
            );
        }

        if (approvalStatus === "rejected") {
            return (
                <span
                    className="badge"
                    style={{
                        background: "#fee2e2",
                        color: "#b91c1c",
                        borderRadius: "999px",
                        padding: "8px 12px",
                        fontSize: "12px",
                    }}
                >
                    Rejected
                </span>
            );
        }

        if (approvalStatus === "default_absent") {
            return (
                <span
                    className="badge"
                    style={{
                        background: "#f1f5f9",
                        color: "#475569",
                        borderRadius: "999px",
                        padding: "8px 12px",
                        fontSize: "12px",
                    }}
                >
                    Default Absent
                </span>
            );
        }

        return (
            <span
                className="badge"
                style={{
                    background: "#fef3c7",
                    color: "#92400e",
                    borderRadius: "999px",
                    padding: "8px 12px",
                    fontSize: "12px",
                }}
            >
                Pending
            </span>
        );
    };

    const flattenAttendanceResponse = (teamsData = []) => {
        const rows = [];

        teamsData.forEach(team => {
            team?.date_wise_attendance?.forEach(dateGroup => {
                dateGroup?.attendance?.forEach(attendance => {
                    const approvalStatus = String(
                        attendance.approval_status || "pending"
                    ).toLowerCase();

                    rows.push({
                        ...attendance,

                        id: attendance.id || attendance.attendance_id || null,

                        approval_status: approvalStatus,

                        is_default_absent:
                            attendance.is_default_absent ||
                            approvalStatus === "default_absent" ||
                            !attendance.id,

                        team_id: team.team_id,
                        team_name: team.team_name,
                        team_leader: team.team_leader,
                        team_leader_name: team.team_leader_name,
                        members_count: team.members_count,

                        attendance_date:
                            attendance.attendance_date || dateGroup.attendance_date,
                    });
                });
            });
        });

        return rows;
    };

    const buildFilterOptions = teamsData => {
        const teams = [];
        const members = [];

        teamsData.forEach(team => {
            if (team?.team_id) {
                teams.push({
                    value: team.team_id,
                    label: team.team_name || "-",
                });
            }

            team?.date_wise_attendance?.forEach(dateGroup => {
                dateGroup?.attendance?.forEach(attendance => {
                    if (attendance?.staff) {
                        members.push({
                            value: attendance.staff,
                            label: attendance.staff_name || "-",
                        });
                    }
                });
            });
        });

        const uniqueTeams = Array.from(
            new Map(teams.map(item => [String(item.value), item])).values()
        );

        const uniqueMembers = Array.from(
            new Map(members.map(item => [String(item.value), item])).values()
        );

        setTeamOptions(uniqueTeams);
        setMemberOptions(uniqueMembers);
    };

    const fetchAttendance = async () => {
        try {
            setLoading(true);

            const res = await axios.get(buildUrl("staff/attendance/my/team/"), {
                headers: authHeaders,
                params: {
                    start_date: filters.start_date || undefined,
                    end_date: filters.end_date || undefined,
                    member: filters.member || undefined,
                },
            });

            console.log("sdfghjk", res.data)

            const teamsData =
                res?.data?.results?.data ||
                res?.data?.data ||
                res?.data?.results ||
                [];

            const safeTeamsData = Array.isArray(teamsData) ? teamsData : [];

            setAttendanceTeams(safeTeamsData);

            const flattened = flattenAttendanceResponse(safeTeamsData);

            setAllAttendanceRows(flattened);
            buildFilterOptions(safeTeamsData);
        } catch (error) {
            toast.error(
                error?.response?.data?.message ||
                "Failed to load attendance approval data"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filteredRows = useMemo(() => {
        return allAttendanceRows.filter(item => {
            const teamMatch =
                !filters.team ||
                String(item.team_id) === String(filters.team);

            const memberMatch =
                !filters.member ||
                String(item.staff) === String(filters.member);

            const approvalMatch =
                filters.approval_status === "all" ||
                !filters.approval_status ||
                String(item.approval_status || "pending") ===
                String(filters.approval_status);

            return teamMatch && memberMatch && approvalMatch;
        });
    }, [allAttendanceRows, filters]);

    const pendingCount = allAttendanceRows.filter(
        item => item.approval_status === "pending"
    ).length;

    const approvedCount = allAttendanceRows.filter(
        item => item.approval_status === "approved"
    ).length;

    const rejectedCount = allAttendanceRows.filter(
        item => item.approval_status === "rejected"
    ).length;

    const defaultAbsentCount = allAttendanceRows.filter(
        item => item.approval_status === "default_absent" || item.is_default_absent
    ).length;

    const openConfirmModal = (attendance, action) => {
        if (!attendance?.id) {
            toast.warning("Default absent records cannot be approved or rejected");
            return;
        }

        setSelectedAttendance(attendance);
        setSelectedAction(action);
        setManagerNote("");
        setConfirmModal(true);
    };

    const closeConfirmModal = () => {
        setConfirmModal(false);
        setSelectedAttendance(null);
        setSelectedAction("");
        setManagerNote("");
    };

    const submitApprovalAction = async () => {
        if (!selectedAttendance?.id || !selectedAction) {
            toast.error("Attendance record missing");
            return;
        }

        try {
            setActionLoading(true);

            await axios.put(
                buildUrl(`staff/attendance/approve/${selectedAttendance.id}/`),
                {
                    approval_status: selectedAction,
                    manager_note: managerNote || "",
                },
                {
                    headers: authHeaders,
                }
            );

            toast.success(
                selectedAction === "approved"
                    ? "Attendance approved successfully"
                    : "Attendance rejected successfully"
            );

            closeConfirmModal();

            setFilters(prev => ({
                ...prev,
                approval_status: selectedAction,
            }));

            setTimeout(() => {
                fetchAttendance();
            }, 0);
        } catch (error) {
            toast.error(
                error?.response?.data?.message ||
                error?.response?.data?.detail ||
                "Failed to update attendance approval"
            );
        } finally {
            setActionLoading(false);
        }
    };

    const resetFilters = () => {
        const resetData = {
            start_date: todayDate,
            end_date: todayDate,
            team: "",
            member: "",
            approval_status: "all",
        };

        setFilters(resetData);

        setTimeout(() => {
            fetchAttendance();
        }, 0);
    };

    const openEditModal = item => {
        if (!item?.id) {
            toast.warning("Default absent records cannot be edited");
            return;
        }

        setEditData({
            id: item.id,
            attendance_time: item.attendance_time
                ? item.attendance_time.slice(0, 5)
                : "",
            status: item.status || "",
            approval_status: item.approval_status || "pending",
            manager_note: item.manager_note || "",
        });

        setEditModal(true);
    };

    const closeEditModal = () => {
        setEditModal(false);
        setEditData({
            id: "",
            attendance_time: "",
            status: "",
            approval_status: "",
            manager_note: "",
        });
    };

    const submitEditAttendance = async () => {
        if (!editData.id) {
            toast.error("Attendance ID missing");
            return;
        }

        if (!editData.attendance_time || !editData.status || !editData.approval_status) {
            toast.error("Time, status and approval status are required");
            return;
        }

        try {
            setEditLoading(true);

            await axios.put(
                buildUrl(`staff/attendance/edit/${editData.id}/`),
                {
                    attendance_time: editData.attendance_time,
                    status: editData.status,
                },
                {
                    headers: authHeaders,
                }
            );

            await axios.put(
                buildUrl(`staff/attendance/approve/${editData.id}/`),
                {
                    approval_status: editData.approval_status,
                    manager_note: editData.manager_note || "",
                },
                {
                    headers: authHeaders,
                }
            );

            toast.success("Attendance updated successfully");
            closeEditModal();
            fetchAttendance();
        } catch (error) {
            toast.error(
                error?.response?.data?.message ||
                error?.response?.data?.detail ||
                "Failed to update attendance"
            );
        } finally {
            setEditLoading(false);
        }
    };

    return (
        <React.Fragment>
            <div
                className="page-content"
                style={{
                    background: "#f5f7fb",
                    minHeight: "100vh",
                }}
            >
                <Container fluid>

                    <Card
                        className="border-0 mb-4"
                        style={{
                            borderRadius: "22px",
                            background:
                                "linear-gradient(135deg, #1f2937 0%, #334155 45%, #0f172a 100%)",
                            boxShadow: "0 12px 35px rgba(15, 23, 42, 0.18)",
                            overflow: "hidden",
                        }}
                    >
                        <CardBody className="p-4">
                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                                <div className="d-flex align-items-center gap-3">
                                    <div
                                        style={{
                                            width: "58px",
                                            height: "58px",
                                            borderRadius: "18px",
                                            background: "rgba(255,255,255,0.12)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "#fff",
                                            fontSize: "26px",
                                        }}
                                    >
                                        <i className="bx bx-check-shield"></i>
                                    </div>

                                    <div>
                                        <h4 className="mb-1 text-white fw-bold">
                                            Attendance Approval
                                        </h4>
                                        <p
                                            className="mb-0"
                                            style={{
                                                color: "rgba(255,255,255,0.72)",
                                            }}
                                        >
                                            Review self-submitted attendance and approve or reject team records.
                                        </p>
                                    </div>
                                </div>

                                <Button
                                    color="light"
                                    onClick={fetchAttendance}
                                    disabled={loading}
                                    style={{
                                        borderRadius: "12px",
                                        padding: "11px 18px",
                                        fontWeight: 700,
                                        border: "none",
                                    }}
                                >
                                    <i className="bx bx-refresh me-1"></i>
                                    Refresh
                                </Button>
                            </div>
                        </CardBody>
                    </Card>

                    <Row className="mb-4">
                        <Col xl={3} lg={4} md={6} className="mb-3">
                            <Card
                                className="border-0 h-100"
                                style={{
                                    borderRadius: "18px",
                                    boxShadow: "0 8px 25px rgba(15, 23, 42, 0.06)",
                                }}
                            >
                                <CardBody>
                                    <p className="text-muted mb-1">Pending</p>
                                    <h3 className="mb-0 fw-bold text-warning">
                                        {pendingCount}
                                    </h3>
                                </CardBody>
                            </Card>
                        </Col>

                        <Col xl={3} lg={4} md={6} className="mb-3">
                            <Card
                                className="border-0 h-100"
                                style={{
                                    borderRadius: "18px",
                                    boxShadow: "0 8px 25px rgba(15, 23, 42, 0.06)",
                                }}
                            >
                                <CardBody>
                                    <p className="text-muted mb-1">Approved</p>
                                    <h3 className="mb-0 fw-bold text-success">
                                        {approvedCount}
                                    </h3>
                                </CardBody>
                            </Card>
                        </Col>

                        <Col xl={3} lg={4} md={6} className="mb-3">
                            <Card
                                className="border-0 h-100"
                                style={{
                                    borderRadius: "18px",
                                    boxShadow: "0 8px 25px rgba(15, 23, 42, 0.06)",
                                }}
                            >
                                <CardBody>
                                    <p className="text-muted mb-1">Rejected</p>
                                    <h3 className="mb-0 fw-bold text-danger">
                                        {rejectedCount}
                                    </h3>
                                </CardBody>
                            </Card>
                        </Col>

                        <Col xl={3} lg={4} md={6} className="mb-3">
                            <Card
                                className="border-0 h-100"
                                style={{
                                    borderRadius: "18px",
                                    boxShadow: "0 8px 25px rgba(15, 23, 42, 0.06)",
                                }}
                            >
                                <CardBody>
                                    <p className="text-muted mb-1">Default Absent</p>
                                    <h3 className="mb-0 fw-bold text-secondary">
                                        {defaultAbsentCount}
                                    </h3>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    <Card
                        className="border-0 mb-4"
                        style={{
                            borderRadius: "22px",
                            boxShadow: "0 10px 35px rgba(15, 23, 42, 0.08)",
                            overflow: "visible",
                        }}
                    >
                        <CardBody className="p-4">
                            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                                <div>
                                    <h5 className="mb-1 fw-bold text-dark">Filters</h5>
                                    <p className="text-muted mb-0">
                                        Filter approval records by date, team, member, or approval status.
                                    </p>
                                </div>

                                <Button
                                    color="light"
                                    onClick={resetFilters}
                                    style={{
                                        borderRadius: "10px",
                                        padding: "9px 16px",
                                        fontWeight: 600,
                                        border: "1px solid #e5e7eb",
                                        color: "#475569",
                                    }}
                                >
                                    <i className="bx bx-reset me-1"></i>
                                    Reset
                                </Button>
                            </div>

                            <Row className="g-3 align-items-end">
                                <Col xl={2} lg={4} md={6}>
                                    <Label className="fw-semibold text-dark">
                                        Start Date
                                    </Label>
                                    <Input
                                        type="date"
                                        value={filters.start_date}
                                        onChange={e =>
                                            setFilters({
                                                ...filters,
                                                start_date: e.target.value,
                                            })
                                        }
                                        style={{
                                            borderRadius: "12px",
                                            minHeight: "46px",
                                            background: "#f8fafc",
                                            border: "1px solid #e5e7eb",
                                        }}
                                    />
                                </Col>

                                <Col xl={2} lg={4} md={6}>
                                    <Label className="fw-semibold text-dark">
                                        End Date
                                    </Label>
                                    <Input
                                        type="date"
                                        value={filters.end_date}
                                        onChange={e =>
                                            setFilters({
                                                ...filters,
                                                end_date: e.target.value,
                                            })
                                        }
                                        style={{
                                            borderRadius: "12px",
                                            minHeight: "46px",
                                            background: "#f8fafc",
                                            border: "1px solid #e5e7eb",
                                        }}
                                    />
                                </Col>

                                <Col xl={2} lg={4} md={6}>
                                    <Label className="fw-semibold text-dark">
                                        Team
                                    </Label>
                                    <Select
                                        options={teamOptions}
                                        styles={selectStyles}
                                        menuPortalTarget={document.body}
                                        menuPosition="fixed"
                                        value={
                                            teamOptions.find(
                                                item =>
                                                    String(item.value) ===
                                                    String(filters.team)
                                            ) || null
                                        }
                                        onChange={selected =>
                                            setFilters({
                                                ...filters,
                                                team: selected?.value || "",
                                            })
                                        }
                                        placeholder="Select team"
                                        isClearable
                                    />
                                </Col>

                                <Col xl={2} lg={4} md={6}>
                                    <Label className="fw-semibold text-dark">
                                        Member
                                    </Label>
                                    <Select
                                        options={memberOptions}
                                        styles={selectStyles}
                                        menuPortalTarget={document.body}
                                        menuPosition="fixed"
                                        value={
                                            memberOptions.find(
                                                item =>
                                                    String(item.value) ===
                                                    String(filters.member)
                                            ) || null
                                        }
                                        onChange={selected =>
                                            setFilters({
                                                ...filters,
                                                member: selected?.value || "",
                                            })
                                        }
                                        placeholder="Select member"
                                        isClearable
                                    />
                                </Col>

                                <Col xl={2} lg={4} md={6}>
                                    <Label className="fw-semibold text-dark">
                                        Approval Status
                                    </Label>
                                    <Select
                                        options={approvalOptions}
                                        styles={selectStyles}
                                        menuPortalTarget={document.body}
                                        menuPosition="fixed"
                                        value={
                                            approvalOptions.find(
                                                item =>
                                                    String(item.value) ===
                                                    String(filters.approval_status)
                                            ) || null
                                        }
                                        onChange={selected =>
                                            setFilters({
                                                ...filters,
                                                approval_status:
                                                    selected?.value || "all",
                                            })
                                        }
                                        placeholder="Status"
                                    />
                                </Col>

                                <Col xl={2} lg={4} md={6}>
                                    <Button
                                        color="primary"
                                        className="w-100"
                                        onClick={fetchAttendance}
                                        disabled={loading}
                                        style={{
                                            borderRadius: "12px",
                                            minHeight: "46px",
                                            fontWeight: 700,
                                            boxShadow:
                                                "0 8px 18px rgba(79, 70, 229, 0.22)",
                                        }}
                                    >
                                        <i className="bx bx-search me-1"></i>
                                        Search
                                    </Button>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>

                    <Card
                        className="border-0"
                        style={{
                            borderRadius: "22px",
                            boxShadow: "0 10px 35px rgba(15, 23, 42, 0.08)",
                            overflow: "hidden",
                        }}
                    >
                        <div
                            className="card-header border-0"
                            style={{
                                background: "#fff",
                                padding: "22px 24px",
                            }}
                        >
                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                                <div>
                                    <h5 className="mb-1 fw-bold text-dark">
                                        Approval List
                                    </h5>
                                    <p className="text-muted mb-0">
                                        Showing {filteredRows.length} of{" "}
                                        {allAttendanceRows.length} records
                                    </p>
                                </div>
                            </div>
                        </div>

                        <CardBody className="p-0">
                            {loading ? (
                                <div className="text-center py-5">
                                    <Spinner />
                                    <div className="mt-2 text-muted">
                                        Loading attendance approvals...
                                    </div>
                                </div>
                            ) : filteredRows.length > 0 ? (
                                <div className="table-responsive">
                                    <Table className="align-middle mb-0">
                                        <thead>
                                            <tr
                                                style={{
                                                    background: "#f8fafc",
                                                    borderTop:
                                                        "1px solid #edf0f4",
                                                }}
                                            >
                                                {[
                                                    "#",
                                                    "Staff",
                                                    "Date",
                                                    "Time",
                                                    "Status",
                                                    "Approval",
                                                    "Approved By",
                                                    "Action",
                                                ].map(head => (
                                                    <th
                                                        key={head}
                                                        style={{
                                                            padding:
                                                                "16px 22px",
                                                            color: "#64748b",
                                                            fontSize: "12px",
                                                            letterSpacing:
                                                                "0.04em",
                                                            textTransform:
                                                                "uppercase",
                                                            borderBottom:
                                                                "1px solid #edf0f4",
                                                            whiteSpace:
                                                                "nowrap",
                                                        }}
                                                    >
                                                        {head}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {filteredRows.map((item, index) => (
                                                <tr
                                                    key={`${item.staff}-${item.attendance_date}-${item.id || "default"}-${index}`}
                                                    style={{
                                                        borderBottom:
                                                            "1px solid #f1f5f9",
                                                    }}
                                                >
                                                    <td
                                                        style={{
                                                            padding:
                                                                "18px 22px",
                                                            color: "#64748b",
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {index + 1}
                                                    </td>


                                                    <td
                                                        style={{
                                                            padding:
                                                                "18px 22px",
                                                        }}
                                                    >
                                                        <strong>
                                                            {item.staff_name ||
                                                                "-"}
                                                        </strong>
                                                    </td>

                                                    <td
                                                        style={{
                                                            padding:
                                                                "18px 22px",
                                                            whiteSpace:
                                                                "nowrap",
                                                        }}
                                                    >
                                                        {item.attendance_date ||
                                                            "-"}
                                                    </td>

                                                    <td
                                                        style={{
                                                            padding:
                                                                "18px 22px",
                                                            whiteSpace:
                                                                "nowrap",
                                                        }}
                                                    >
                                                        {item.attendance_time ||
                                                            "-"}
                                                    </td>

                                                    <td
                                                        style={{
                                                            padding:
                                                                "18px 22px",
                                                        }}
                                                    >
                                                        {getStatusBadge(
                                                            item.status
                                                        )}
                                                    </td>

                                                    <td
                                                        style={{
                                                            padding:
                                                                "18px 22px",
                                                        }}
                                                    >
                                                        {getApprovalBadge(
                                                            item.approval_status ||
                                                            "pending"
                                                        )}
                                                    </td>

                                                    <td
                                                        style={{
                                                            padding:
                                                                "18px 22px",
                                                        }}
                                                    >
                                                        <div>
                                                            {item.approved_by_name ||
                                                                "-"}
                                                        </div>
                                                        {item.approved_at ? (
                                                            <small className="text-muted">
                                                                {formatDateTime(
                                                                    item.approved_at
                                                                )}
                                                            </small>
                                                        ) : null}
                                                    </td>

                                                    <td
                                                        style={{
                                                            padding: "18px 22px",
                                                            minWidth: "300px",
                                                        }}
                                                    >
                                                        {!item.is_default_absent && item.id ? (
                                                            <div className="d-flex gap-2 flex-wrap">
                                                                <Button
                                                                    color="warning"
                                                                    size="sm"
                                                                    onClick={() => openEditModal(item)}
                                                                    style={{
                                                                        borderRadius: "10px",
                                                                        padding: "8px 13px",
                                                                        fontWeight: 700,
                                                                    }}
                                                                >
                                                                    <i className="bx bx-edit me-1"></i>
                                                                    Edit
                                                                </Button>

                                                            </div>
                                                        ) : (
                                                            <span className="text-muted">No Action</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            ) : (
                                <div
                                    className="text-center"
                                    style={{
                                        padding: "70px 20px",
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
                                            fontSize: "38px",
                                        }}
                                    >
                                        <i className="bx bx-calendar-x"></i>
                                    </div>

                                    <h5 className="fw-bold text-dark mb-2">
                                        No attendance approval records found
                                    </h5>
                                    <p className="text-muted mb-0">
                                        Try changing the filters or date range.
                                    </p>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </Container>
            </div>

            <Modal isOpen={editModal} toggle={closeEditModal} centered>
                <ModalHeader toggle={closeEditModal}>
                    Edit Attendance
                </ModalHeader>

                <ModalBody>
                    <Label className="fw-semibold">Reporting Time</Label>
                    <Input
                        type="time"
                        value={editData.attendance_time}
                        onChange={e =>
                            setEditData({
                                ...editData,
                                attendance_time: e.target.value,
                            })
                        }
                        style={{
                            borderRadius: "12px",
                            minHeight: "46px",
                            background: "#f8fafc",
                            border: "1px solid #e5e7eb",
                        }}
                    />

                    <Label className="fw-semibold mt-3">Status</Label>
                    <Select
                        options={statusOptions}
                        styles={selectStyles}
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                        value={
                            statusOptions.find(
                                item => item.value === editData.status
                            ) || null
                        }
                        onChange={selected =>
                            setEditData({
                                ...editData,
                                status: selected?.value || "",
                            })
                        }
                        placeholder="Select status"
                    />

                    <Label className="fw-semibold mt-3">Approval Status</Label>
                    <Select
                        options={editApprovalOptions}
                        styles={selectStyles}
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                        value={
                            editApprovalOptions.find(
                                item => item.value === editData.approval_status
                            ) || null
                        }
                        onChange={selected =>
                            setEditData({
                                ...editData,
                                approval_status: selected?.value || "",
                            })
                        }
                        placeholder="Select approval status"
                    />

                    <Label className="fw-semibold mt-3">Manager Note</Label>
                    <Input
                        type="textarea"
                        rows="3"
                        value={editData.manager_note}
                        onChange={e =>
                            setEditData({
                                ...editData,
                                manager_note: e.target.value,
                            })
                        }
                        placeholder="Optional note"
                        style={{
                            borderRadius: "12px",
                            background: "#f8fafc",
                            border: "1px solid #e5e7eb",
                        }}
                    />
                </ModalBody>

                <ModalFooter>
                    <Button
                        color="light"
                        onClick={closeEditModal}
                        disabled={editLoading}
                    >
                        Cancel
                    </Button>

                    <Button
                        color="primary"
                        onClick={submitEditAttendance}
                        disabled={editLoading}
                    >
                        {editLoading ? "Updating..." : "Update"}
                    </Button>
                </ModalFooter>
            </Modal>
            <ToastContainer closeButton={false} limit={3} />
        </React.Fragment>
    );
};

export default AttendanceManagerApproval;
