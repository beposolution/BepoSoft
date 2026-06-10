import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    Card,
    CardBody,
    CardTitle,
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
import Breadcrumbs from "../../../components/Common/Breadcrumb";
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

    const [filters, setFilters] = useState({
        start_date: "",
        end_date: "",
        team: "",
        member: "",
    });

    const [editModal, setEditModal] = useState(false);
    const [selectedAttendanceId, setSelectedAttendanceId] = useState(null);

    const [editInitialValues, setEditInitialValues] = useState({
        staff: "",
        attendance_date: "",
        status: "",
    });

    const statusOptions = [
        { value: "present", label: "Present" },
        { value: "absent", label: "Absent" },
        { value: "half_day", label: "Half Day" },
    ];

    const selectStyles = {
        control: (provided) => ({
            ...provided,
            minHeight: "44px",
            borderRadius: "10px",
        }),

        menuPortal: (base) => ({
            ...base,
            zIndex: 999999,
        }),

        menu: (base) => ({
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
            const res = await axios.get(`${baseUrl}get/staffs/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                params: { search },
            });

            setStaffs(res?.data?.results?.data || []);
        } catch {
            toast.error("Failed to load staff");
        }
    };

    const flattenAttendanceResponse = (teamsData = []) => {
        const flattenedAttendance = [];

        teamsData.forEach((team) => {
            team.date_wise_attendance?.forEach((dateGroup) => {
                dateGroup.attendance?.forEach((attendance) => {
                    flattenedAttendance.push({
                        ...attendance,
                        team_id: team.team_id,
                        team_name: team.team_name,
                        team_leader: team.team_leader,
                        team_leader_name: team.team_leader_name,
                        attendance_date: attendance.attendance_date || dateGroup.attendance_date,
                    });
                });
            });
        });

        return flattenedAttendance;
    };

    const fetchAttendance = async () => {
        try {
            const res = await axios.get(`${baseUrl}staff/attendance/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                params: {
                    start_date: filters.start_date,
                    end_date: filters.end_date,
                    team: filters.team,
                    member: filters.member,
                },
            });

            const teamsData = res?.data?.results?.data || [];
            const flattened = flattenAttendanceResponse(teamsData);

            setAttendanceData(flattened);
        } catch {
            toast.error("Failed to load attendance");
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
        return teams.map((item) => ({
            value: item.id ?? item.team_id,
            label: item.team_name ?? item.name ?? "-",
        }));
    }, [teams]);

    const staffOptions = useMemo(() => {
        return staffs.map((item) => ({
            value: item.id,
            label: item.name,
        }));
    }, [staffs]);

    const todayDate = new Date().toISOString().split("T")[0];

    const formik = useFormik({
        initialValues: {
            staff: "",
            status: "",
        },

        validationSchema: Yup.object({
            staff: Yup.string().required("Select Staff"),
            status: Yup.string().required("Select Status"),
        }),

        onSubmit: async (values, { resetForm }) => {
            try {
                setSubmitLoading(true);

                const payload = {
                    staff: Number(values.staff),
                    attendance_date: todayDate,
                    status: values.status,
                };

                await axios.post(`${baseUrl}staff/attendance/`, payload, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                toast.success("Attendance added successfully");
                resetForm();
                fetchAttendance();
            } catch (error) {
                toast.error(
                    error?.response?.data?.message || "Failed to add attendance"
                );
            } finally {
                setSubmitLoading(false);
            }
        },
    });

    const openEditModal = async (id) => {
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
            status: Yup.string().required("Select Status"),
        }),

        onSubmit: async (values) => {
            try {
                await axios.put(
                    `${baseUrl}staff/attendance/edit/${selectedAttendanceId}/`,
                    {
                        staff: Number(values.staff),
                        attendance_date: values.attendance_date,
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
                toast.error(
                    error?.response?.data?.message || "Update failed"
                );
            }
        },
    });

    const resetFilters = () => {
        const cleared = {
            start_date: "",
            end_date: "",
            team: "",
            member: "",
        };

        setFilters(cleared);
        setTimeout(() => {
            fetchAttendance();
        }, 0);
    };

    if (loading) {
        return (
            <div className="page-content">
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
            <div className="page-content">
                <Container fluid>
                    <Breadcrumbs
                        title="Attendance"
                        breadcrumbItem="Attendance List"
                    />

                    <Card className="mb-4">
                        <CardBody>
                            <CardTitle>Add Attendance</CardTitle>

                            <p className="mb-3">
                                Today&apos;s Date:{" "}
                                <strong>{todayDate}</strong>
                            </p>

                            <Form onSubmit={formik.handleSubmit}>
                                <Row>
                                    <Col md={5}>
                                        <Label>Staff</Label>

                                        <Select
                                            options={staffOptions}
                                            styles={selectStyles}
                                            onInputChange={(value, meta) => {
                                                if (meta.action === "input-change") {
                                                    setStaffSearch(value);
                                                }
                                            }}
                                            value={
                                                staffOptions.find(
                                                    (x) =>
                                                        String(x.value) ===
                                                        String(formik.values.staff)
                                                ) || null
                                            }
                                            onChange={(e) =>
                                                formik.setFieldValue(
                                                    "staff",
                                                    e?.value || ""
                                                )
                                            }
                                            placeholder="Select staff"
                                        />
                                        {formik.touched.staff && formik.errors.staff ? (
                                            <div className="text-danger mt-1">
                                                {formik.errors.staff}
                                            </div>
                                        ) : null}
                                    </Col>

                                    <Col md={5}>
                                        <Label>Status</Label>

                                        <Select
                                            options={statusOptions}
                                            styles={selectStyles}
                                            value={
                                                statusOptions.find(
                                                    (x) =>
                                                        x.value === formik.values.status
                                                ) || null
                                            }
                                            onChange={(e) =>
                                                formik.setFieldValue(
                                                    "status",
                                                    e?.value || ""
                                                )
                                            }
                                            placeholder="Select status"
                                        />
                                        {formik.touched.status && formik.errors.status ? (
                                            <div className="text-danger mt-1">
                                                {formik.errors.status}
                                            </div>
                                        ) : null}
                                    </Col>

                                    <Col md={2}>
                                        <Button
                                            color="primary"
                                            className="w-100 mt-4"
                                            type="submit"
                                            disabled={submitLoading}
                                        >
                                            {submitLoading ? "Saving..." : "Add"}
                                        </Button>
                                    </Col>
                                </Row>
                            </Form>
                        </CardBody>
                    </Card>

                    <Card className="mb-4">
                        <CardBody>
                            <CardTitle>Filters</CardTitle>

                            <Row>
                                <Col md={2}>
                                    <Label>Start Date</Label>
                                    <Input
                                        type="date"
                                        value={filters.start_date}
                                        onChange={(e) =>
                                            setFilters({
                                                ...filters,
                                                start_date: e.target.value,
                                            })
                                        }
                                    />
                                </Col>

                                <Col md={2}>
                                    <Label>End Date</Label>
                                    <Input
                                        type="date"
                                        value={filters.end_date}
                                        onChange={(e) =>
                                            setFilters({
                                                ...filters,
                                                end_date: e.target.value,
                                            })
                                        }
                                    />
                                </Col>

                                <Col md={3}>
                                    <Label>Team</Label>
                                    <Select
                                        options={teamOptions}
                                        styles={selectStyles}
                                        value={
                                            teamOptions.find(
                                                (x) =>
                                                    String(x.value) ===
                                                    String(filters.team)
                                            ) || null
                                        }
                                        onChange={(e) =>
                                            setFilters({
                                                ...filters,
                                                team: e?.value || "",
                                            })
                                        }
                                        placeholder="Select team"
                                    />
                                </Col>

                                <Col md={3}>
                                    <Label>Member</Label>
                                    <Select
                                        options={staffOptions}
                                        styles={selectStyles}
                                        value={
                                            staffOptions.find(
                                                (x) =>
                                                    String(x.value) ===
                                                    String(filters.member)
                                            ) || null
                                        }
                                        onChange={(e) =>
                                            setFilters({
                                                ...filters,
                                                member: e?.value || "",
                                            })
                                        }
                                        placeholder="Select member"
                                        isSearchable
                                        onInputChange={(value, meta) => {
                                            if (meta.action === "input-change") {
                                                setStaffSearch(value);
                                            }
                                        }}
                                    />
                                </Col>

                                <Col md={2}>
                                    <Button
                                        color="primary"
                                        className="w-100 mt-4"
                                        onClick={fetchAttendance}
                                    >
                                        Search
                                    </Button>
                                </Col>

                                <Col md={12} className="mt-3">
                                    <Button color="secondary" onClick={resetFilters}>
                                        Reset Filters
                                    </Button>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody>
                            <CardTitle>Attendance List</CardTitle>

                            <Table bordered responsive>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Staff</th>
                                        <th>Team</th>
                                        <th>Date</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {attendanceData?.length > 0 ? (
                                        attendanceData.map((item, index) => (
                                            <tr key={item.id}>
                                                <td>{index + 1}</td>
                                                <td>{item.staff_name || "-"}</td>
                                                <td>{item.team_name || "-"}</td>
                                                <td>{item.attendance_date || "-"}</td>
                                                <td>
                                                    <span
                                                        className={`badge ${item.status === "present"
                                                                ? "bg-success"
                                                                : item.status === "absent"
                                                                    ? "bg-danger"
                                                                    : "bg-warning"
                                                            }`}
                                                    >
                                                        {item.status || "-"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <Button
                                                        color="warning"
                                                        size="sm"
                                                        onClick={() => openEditModal(item.id)}
                                                    >
                                                        Edit
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="text-center">
                                                No Attendance Found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </CardBody>
                    </Card>

                    <Modal
                        isOpen={editModal}
                        toggle={() => setEditModal(false)}
                        centered
                        style={{
                            zIndex: 1055,
                        }}
                    >
                        <ModalHeader toggle={() => setEditModal(false)}>
                            Edit Attendance
                        </ModalHeader>

                        <Form onSubmit={editFormik.handleSubmit}>
                            <ModalBody
                                style={{
                                    overflow: "visible",
                                }}
                            >
                                <Label>Staff</Label>
                                <Select
                                    options={staffOptions}
                                    styles={selectStyles}
                                    menuPortalTarget={document.body}
                                    menuPosition="fixed"
                                    menuShouldBlockScroll={true}

                                    value={
                                        staffOptions.find(
                                            (x) =>
                                                String(x.value) ===
                                                String(editFormik.values.staff)
                                        ) || null
                                    }
                                    onChange={(e) =>
                                        editFormik.setFieldValue(
                                            "staff",
                                            e?.value || ""
                                        )
                                    }
                                    placeholder="Select staff"
                                />
                                {editFormik.touched.staff && editFormik.errors.staff ? (
                                    <div className="text-danger mt-1">
                                        {editFormik.errors.staff}
                                    </div>
                                ) : null}

                                <Label className="mt-3">Date</Label>
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
                                            (x) =>
                                                x.value === editFormik.values.status
                                        ) || null
                                    }
                                    onChange={(e) =>
                                        editFormik.setFieldValue(
                                            "status",
                                            e?.value || ""
                                        )
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