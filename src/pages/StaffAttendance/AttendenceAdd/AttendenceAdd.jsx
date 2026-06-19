import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    Card,
    CardBody,
    Col,
    Container,
    Row,
    Form,
    Label,
    Button,
    Spinner,
    Table,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Input,
} from "reactstrap";
import Select from "react-select";
import { useFormik } from "formik";
import * as Yup from "yup";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AttendanceAdd = () => {
    document.title = "Attendance | Beposoft";

    const token = localStorage.getItem("token");
    const baseUrl = import.meta.env.VITE_APP_KEY;

    const [loading, setLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);

    const [teams, setTeams] = useState([]);
    const [staffs, setStaffs] = useState([]);
    const [attendanceData, setAttendanceData] = useState([]);

    const [staffSearch, setStaffSearch] = useState("");

    const [teamSummary, setTeamSummary] = useState({
        team_name: "-",
        team_leader_name: "-",
        members_count: 0,
    });

    const todayDate = new Date().toISOString().split("T")[0];

    const [filters, setFilters] = useState({
        start_date: todayDate,
        end_date: todayDate,
        member: "",
    });

    const [addModal, setAddModal] = useState(false);

    const [editModal, setEditModal] = useState(false);
    const [selectedAttendanceId, setSelectedAttendanceId] = useState(null);

    const [editInitialValues, setEditInitialValues] = useState({
        staff: "",
        attendance_date: "",
        attendance_time: "",
        status: "",
    });

    const statusOptions = [
        { value: "present", label: "Present" },
        { value: "absent", label: "Absent" },
        { value: "half_day", label: "Half Day" },
    ];

    const selectStyles = {
        control: provided => ({
            ...provided,
            minHeight: "44px",
            borderRadius: "10px",
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

    const fetchTeams = async () => {
        try {
            const res = await axios.get(`${baseUrl}staff/attendance/teams/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setTeams(res?.data?.data || []);
        } catch {
            toast.error("Failed to load teams");
        }
    };

    const fetchStaffs = async (search = "") => {
        try {
            const res = await axios.get(`${baseUrl}staff/attendance/added/users/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                params: { search },
            });

            const attendanceList = res?.data?.results?.data || [];

            const members = attendanceList.map(item => ({
                id: item.staff,
                name: item.staff_name,
                team_id: item.team_id,
                team_name: item.team_name,
            }));

            const uniqueMembers = Array.from(
                new Map(members.map(item => [String(item.id), item])).values()
            );

            setStaffs(uniqueMembers);
        } catch {
            toast.error("Failed to load staff");
        }
    };

    const flattenAttendanceResponse = (teamsData = []) => {
        const flattenedAttendance = [];

        teamsData.forEach(team => {
            team.date_wise_attendance?.forEach(dateGroup => {
                dateGroup.attendance?.forEach(attendance => {
                    flattenedAttendance.push({
                        ...attendance,
                        team_id: team.team_id,
                        team_name: team.team_name,
                        team_leader: team.team_leader,
                        team_leader_name: team.team_leader_name,
                        // members_count: team.members_count,
                        attendance_date:
                            attendance.attendance_date || dateGroup.attendance_date,
                    });
                });
            });
        });

        return flattenedAttendance;
    };

    const fetchAttendance = async () => {
        try {
            const res = await axios.get(`${baseUrl}staff/attendance/added/users/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                params: {
                    start_date: filters.start_date || undefined,
                    end_date: filters.end_date || undefined,
                    member: filters.member || undefined,
                },
            });

            const attendanceList = res?.data?.results?.data || [];

            const firstRecord = attendanceList?.[0] || {};

            setTeamSummary({
                team_name: firstRecord?.team_name || "-",
                team_leader_name: firstRecord?.team_leader_name || "-",
                members_count: attendanceList.length || 0,
            });

            setAttendanceData(attendanceList);
        } catch (error) {
            toast.error(
                error?.response?.data?.message || "Failed to load attendance"
            );
        }
    };

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([fetchTeams(), fetchStaffs(), fetchAttendance()]);
            setLoading(false);
        };

        init();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchStaffs(staffSearch);
        }, 500);

        return () => clearTimeout(timer);
    }, [staffSearch]);

    const teamOptions = useMemo(() => {
        return teams.map(item => ({
            value: item.id ?? item.team_id,
            label: item.team_name ?? item.name ?? "-",
        }));
    }, [teams]);

    const staffOptions = useMemo(() => {
        return staffs.map(item => ({
            value: item.id,
            label: item.name,
        }));
    }, [staffs]);

    const presentCount = attendanceData.filter(
        item => item.status === "present"
    ).length;

    const halfDayCount = attendanceData.filter(
        item => item.status === "half_day"
    ).length;

    const absentCount = attendanceData.filter(
        item => item.status === "absent"
    ).length;

    const formik = useFormik({
        initialValues: {
            // staff: "",
            status: "",
            attendance_time: "",
        },

        validationSchema: Yup.object({
            // staff: Yup.string().required("Select Staff"),
            status: Yup.string().required("Select Status"),
            attendance_time: Yup.string().required("Select Time"),
        }),

        onSubmit: async (values, { resetForm }) => {
            try {
                setSubmitLoading(true);

                const payload = {
                    // staff: Number(values.staff),
                    attendance_date: todayDate,
                    attendance_time: values.attendance_time,
                    status: values.status,
                };

                await axios.post(`${baseUrl}staff/attendance/`, payload, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                toast.success("Attendance submitted. Waiting for manager approval");
                resetForm();
                setAddModal(false);
                fetchAttendance();
            } catch (error) {
                toast.error(error?.response?.data?.message || "Failed to add attendance");
            } finally {
                setSubmitLoading(false);
            }
        },
    });

    const openEditModal = async id => {
        try {
            const res = await axios.get(`${baseUrl}staff/attendance/edit/${id}/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = res?.data?.data;

            setSelectedAttendanceId(id);
            setEditInitialValues({
                staff: String(data.staff),
                attendance_date: data.attendance_date,
                attendance_time: data.attendance_time || "",
                status: data.status,
            });
            setEditModal(true);
        } catch {
            toast.error("Failed to load attendance");
        }
    };

    const editFormik = useFormik({
        enableReinitialize: true,
        initialValues: editInitialValues,

        validationSchema: Yup.object({
            staff: Yup.string().required("Select Staff"),
            attendance_date: Yup.string().required("Select Date"),
            attendance_time: Yup.string().required("Select Time"),
            status: Yup.string().required("Select Status"),
        }),

        onSubmit: async values => {
            try {
                await axios.put(
                    `${baseUrl}staff/attendance/edit/${selectedAttendanceId}/`,
                    {
                        // staff: Number(values.staff),
                        attendance_date: values.attendance_date,
                        attendance_time: values.attendance_time,
                        status: values.status,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                toast.success("Attendance updated");
                setEditModal(false);
                fetchAttendance();
            } catch (error) {
                toast.error(error?.response?.data?.message || "Update failed");
            }
        },
    });

    const resetFilters = () => {
        setFilters({
            start_date: todayDate,
            end_date: todayDate,
            // member: "",
        });

        setTimeout(() => {
            fetchAttendance();
        }, 0);
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

        if (status === "absent") {
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
        }

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
    };

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
                style={{ background: "#f5f7fb", minHeight: "100vh" }}
            >
                <Container fluid>

                    <div
                        className="card border-0 mb-4"
                        style={{
                            borderRadius: "22px",
                            background:
                                "linear-gradient(135deg, #1f2937 0%, #334155 45%, #0f172a 100%)",
                            boxShadow: "0 12px 35px rgba(15, 23, 42, 0.18)",
                            overflow: "hidden",
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
                                                background: "rgba(255,255,255,0.12)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: "#fff",
                                                fontSize: "26px",
                                            }}
                                        >
                                            <i className="bx bx-calendar-check"></i>
                                        </div>

                                        <div>
                                            <h4 className="mb-1 text-white fw-bold">
                                                {teamSummary.team_name || "Team"} Attendance
                                            </h4>
                                            <p
                                                className="mb-0"
                                                style={{ color: "rgba(255,255,255,0.72)" }}
                                            >
                                                Manage attendance, review team records, and update daily
                                                status.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-lg-4 mt-4 mt-lg-0">
                                    <div className="d-flex justify-content-lg-end gap-2 flex-wrap">
                                        <span
                                            className="badge"
                                            style={{
                                                background: "rgba(34,197,94,0.18)",
                                                color: "#bbf7d0",
                                                padding: "10px 14px",
                                                borderRadius: "999px",
                                                fontSize: "13px",
                                                fontWeight: 500,
                                            }}
                                        >
                                            Today: {todayDate}
                                        </span>

                                        <span
                                            className="badge"
                                            style={{
                                                background: "rgba(59,130,246,0.18)",
                                                color: "#bfdbfe",
                                                padding: "10px 14px",
                                                borderRadius: "999px",
                                                fontSize: "13px",
                                                fontWeight: 500,
                                            }}
                                        >
                                            Records: {attendanceData.length}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Row className="mb-4">
                        <Col xl={2} lg={4} md={6} className="mb-3">
                            <Card className="border-0 h-100" style={{ borderRadius: "18px", boxShadow: "0 8px 25px rgba(15, 23, 42, 0.06)" }}>
                                <CardBody>
                                    <p className="text-muted mb-1">Team Manager</p>
                                    <h3 className="mb-0 fw-bold">{teamSummary.team_leader_name || "N/A"}</h3>
                                </CardBody>
                            </Card>
                        </Col>


                        <Col xl={2} lg={4} md={6} className="mb-3">
                            <Card className="border-0 h-100" style={{ borderRadius: "18px", boxShadow: "0 8px 25px rgba(15, 23, 42, 0.06)" }}>
                                <CardBody>
                                    <p className="text-muted mb-1">Total Records</p>
                                    <h3 className="mb-0 fw-bold">{attendanceData.length}</h3>
                                </CardBody>
                            </Card>
                        </Col>

                        <Col xl={2} lg={4} md={6} className="mb-3">
                            <Card className="border-0 h-100" style={{ borderRadius: "18px", boxShadow: "0 8px 25px rgba(15, 23, 42, 0.06)" }}>
                                <CardBody>
                                    <p className="text-muted mb-1">Present</p>
                                    <h3 className="mb-0 fw-bold text-success">{presentCount}</h3>
                                </CardBody>
                            </Card>
                        </Col>

                        <Col xl={2} lg={4} md={6} className="mb-3">
                            <Card className="border-0 h-100" style={{ borderRadius: "18px", boxShadow: "0 8px 25px rgba(15, 23, 42, 0.06)" }}>
                                <CardBody>
                                    <p className="text-muted mb-1">Half Day</p>
                                    <h3 className="mb-0 fw-bold text-warning">{halfDayCount}</h3>
                                </CardBody>
                            </Card>
                        </Col>

                        <Col xl={2} lg={4} md={6} className="mb-3">
                            <Card className="border-0 h-100" style={{ borderRadius: "18px", boxShadow: "0 8px 25px rgba(15, 23, 42, 0.06)" }}>
                                <CardBody>
                                    <p className="text-muted mb-1">Absent</p>
                                    <h3 className="mb-0 fw-bold text-danger">{absentCount}</h3>
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

                    </Card>

                    <Card
                        className="border-0 mb-4"
                        style={{
                            borderRadius: "22px",
                            boxShadow: "0 10px 35px rgba(15, 23, 42, 0.08)",
                            overflow: "visible",
                        }}
                    >

                        <CardBody className="p-4">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <div>
                                    <h5 className="mb-1 fw-bold text-dark">Filters</h5>
                                    <p className="text-muted mb-0">
                                        Filter attendance by date or member.
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
                                <Col xl={3} lg={4} md={6}>
                                    <Label className="fw-semibold text-dark">Start Date</Label>
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

                                <Col xl={3} lg={4} md={6}>
                                    <Label className="fw-semibold text-dark">End Date</Label>
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



                                <Col xl={2} lg={12} md={4}>
                                    <Button
                                        color="primary"
                                        className="w-100"
                                        onClick={fetchAttendance}
                                        style={{
                                            borderRadius: "12px",
                                            minHeight: "46px",
                                            fontWeight: 700,
                                            boxShadow: "0 8px 18px rgba(79, 70, 229, 0.22)",
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
                            <div className="row align-items-center">
                                <div className="col-lg-8">
                                    <h5 className="mb-1 fw-bold text-dark">Attendance List</h5>
                                    <p className="text-muted mb-0">
                                        {teamSummary.team_name} - Team Leader:{" "}
                                        {teamSummary.team_leader_name}
                                    </p>
                                </div>

                                <div className="col-lg-4 mt-3 mt-lg-0 text-lg-end">
                                    <Button
                                        color="primary"
                                        onClick={() => setAddModal(true)}
                                        style={{
                                            borderRadius: "10px",
                                            padding: "10px 18px",
                                            fontWeight: 600,
                                        }}
                                    >
                                        <i className="bx bx-plus me-1"></i>
                                        Add Attendance
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <CardBody className="p-0">
                            {attendanceData?.length > 0 ? (
                                <div className="table-responsive">
                                    <Table className="table align-middle mb-0">
                                        <thead>
                                            <tr
                                                style={{
                                                    background: "#f8fafc",
                                                    borderTop: "1px solid #edf0f4",
                                                }}
                                            >
                                                {[
                                                    "#",
                                                    // "Team",
                                                    // "Team Leader",
                                                    "Staff",
                                                    "Reporting Time",
                                                    "Date",
                                                    "Status",
                                                    "Action",
                                                ].map(head => (
                                                    <th
                                                        key={head}
                                                        style={{
                                                            padding: "16px 22px",
                                                            color: "#64748b",
                                                            fontSize: "12px",
                                                            letterSpacing: "0.04em",
                                                            textTransform: "uppercase",
                                                            borderBottom: "1px solid #edf0f4",
                                                        }}
                                                    >
                                                        {head}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {attendanceData.map((item, index) => (
                                                <tr
                                                    key={item.id}
                                                    style={{
                                                        borderBottom: "1px solid #f1f5f9",
                                                    }}
                                                >
                                                    <td
                                                        style={{
                                                            padding: "18px 22px",
                                                            color: "#64748b",
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {index + 1}
                                                    </td>

                                                    {/* <td style={{ padding: "18px 22px" }}>
                                                        <h6 className="mb-0 fw-bold text-dark">
                                                            {item?.team_name || "-"}
                                                        </h6>
                                                    </td>

                                                    <td style={{ padding: "18px 22px" }}>
                                                        {item?.team_leader_name || "-"}
                                                    </td> */}

                                                    <td style={{ padding: "18px 22px" }}>
                                                        <strong>{item?.staff_name || "-"}</strong>
                                                    </td>

                                                    <td style={{ padding: "18px 22px" }}>
                                                        {item?.attendance_time || "-"}
                                                    </td>

                                                    <td style={{ padding: "18px 22px" }}>
                                                        {item?.attendance_date || "-"}
                                                    </td>

                                                    <td style={{ padding: "18px 22px" }}>
                                                        {getStatusBadge(item.status)}
                                                    </td>

                                                    <td style={{ padding: "18px 22px" }}>
                                                        <Button
                                                            color="warning"
                                                            size="sm"
                                                            onClick={() => openEditModal(item.id)}
                                                            style={{
                                                                borderRadius: "10px",
                                                                padding: "8px 14px",
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            <i className="bx bx-edit me-1"></i>
                                                            Edit
                                                        </Button>
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
                                        No attendance records found
                                    </h5>
                                    <p className="text-muted mb-0">
                                        No attendance data is available for the selected filters.
                                    </p>
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    <Modal
                        isOpen={addModal}
                        toggle={() => setAddModal(false)}
                        centered
                        style={{ zIndex: 1055 }}
                    >
                        <ModalHeader toggle={() => setAddModal(false)}>
                            Add Attendance
                        </ModalHeader>

                        <Form onSubmit={formik.handleSubmit}>
                            <ModalBody style={{ overflow: "visible" }}>
                                <p className="text-muted mb-3">
                                    Today&apos;s Date: <strong>{todayDate}</strong>
                                </p>

                                <Label className="mt-3">Reporting Time</Label>
                                <Input
                                    type="time"
                                    name="attendance_time"
                                    value={formik.values.attendance_time}
                                    onChange={formik.handleChange}
                                    style={{
                                        borderRadius: "10px",
                                        minHeight: "44px",
                                        background: "#f8fafc",
                                    }}
                                />
                                {formik.touched.attendance_time && formik.errors.attendance_time ? (
                                    <div className="text-danger mt-1">
                                        {formik.errors.attendance_time}
                                    </div>
                                ) : null}

                                <Label className="mt-3">Status</Label>
                                <Select
                                    options={statusOptions}
                                    styles={selectStyles}
                                    menuPortalTarget={document.body}
                                    menuPosition="fixed"
                                    menuShouldBlockScroll={true}
                                    value={
                                        statusOptions.find(
                                            x => x.value === formik.values.status
                                        ) || null
                                    }
                                    onChange={e =>
                                        formik.setFieldValue("status", e?.value || "")
                                    }
                                    placeholder="Select status"
                                />
                                {formik.touched.status && formik.errors.status ? (
                                    <div className="text-danger mt-1">
                                        {formik.errors.status}
                                    </div>
                                ) : null}
                            </ModalBody>

                            <ModalFooter>
                                <Button
                                    color="secondary"
                                    type="button"
                                    onClick={() => setAddModal(false)}
                                >
                                    Cancel
                                </Button>

                                <Button
                                    color="primary"
                                    type="submit"
                                    disabled={submitLoading}
                                >
                                    {submitLoading ? "Saving..." : "Add"}
                                </Button>
                            </ModalFooter>
                        </Form>
                    </Modal>

                    <Modal
                        isOpen={editModal}
                        toggle={() => setEditModal(false)}
                        centered
                        style={{ zIndex: 1055 }}
                    >
                        <ModalHeader toggle={() => setEditModal(false)}>
                            Edit Attendance
                        </ModalHeader>

                        <Form onSubmit={editFormik.handleSubmit}>
                            <ModalBody style={{ overflow: "visible" }}>

                                {/* <Label className="mt-3">Date</Label>
                                <Input
                                    type="date"
                                    name="attendance_date"
                                    value={editFormik.values.attendance_date}
                                    onChange={editFormik.handleChange}
                                />
                                {editFormik.touched.attendance_date &&
                                    editFormik.errors.attendance_date ? (
                                    <div className="text-danger mt-1">
                                        {editFormik.errors.attendance_date}
                                    </div>
                                ) : null} */}

                                <Label className="mt-3">Reporting Time</Label>
                                <Input
                                    type="time"
                                    name="attendance_time"
                                    value={editFormik.values.attendance_time}
                                    onChange={editFormik.handleChange}
                                    style={{
                                        borderRadius: "10px",
                                        minHeight: "44px",
                                        background: "#f8fafc",
                                    }}
                                />
                                {editFormik.touched.attendance_time &&
                                    editFormik.errors.attendance_time ? (
                                    <div className="text-danger mt-1">
                                        {editFormik.errors.attendance_time}
                                    </div>
                                ) : null}

                                <Label className="mt-3">Status</Label>
                                <Select
                                    options={statusOptions}
                                    styles={selectStyles}
                                    menuPortalTarget={document.body}
                                    menuPosition="fixed"
                                    menuShouldBlockScroll={true}
                                    value={
                                        statusOptions.find(
                                            x => x.value === editFormik.values.status
                                        ) || null
                                    }
                                    onChange={e =>
                                        editFormik.setFieldValue("status", e?.value || "")
                                    }
                                    placeholder="Select status"
                                />
                                {editFormik.touched.status && editFormik.errors.status ? (
                                    <div className="text-danger mt-1">
                                        {editFormik.errors.status}
                                    </div>
                                ) : null}
                            </ModalBody>

                            <ModalFooter>
                                <Button color="secondary" onClick={() => setEditModal(false)}>
                                    Cancel
                                </Button>
                                <Button color="primary" type="submit">
                                    Update
                                </Button>
                            </ModalFooter>
                        </Form>
                    </Modal>

                    <ToastContainer />
                </Container>
            </div>
        </React.Fragment>
    );
};

export default AttendanceAdd;