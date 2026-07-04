import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    Card,
    CardBody,
    CardTitle,
    Col,
    Container,
    Row,
    Table,
    Spinner,
    Button,
    Input,
} from "reactstrap";
import Select from "react-select";
import Breadcrumbs from "../../../components/Common/Breadcrumb";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const StaffAttendance = () => {
    document.title = "Staff Attendance | Beposoft";

    const token = localStorage.getItem("token");
    const baseUrl = import.meta.env.VITE_APP_KEY;

    const [loading, setLoading] = useState(false);
    const [attendanceData, setAttendanceData] = useState([]);

    const [pagination, setPagination] = useState({
        count: 0,
        next: null,
        previous: null,
        page: 1,
    });

    const today = new Date().toISOString().split("T")[0];

    const [filters, setFilters] = useState({
        start_date: today,
        end_date: today,
        team: "",
        member: "",
    });

    const [teams, setTeams] = useState([]);
    const [members, setMembers] = useState([]);

    const fetchAttendance = async (page = 1, customFilters = filters) => {
        try {
            setLoading(true);

            const res = await axios.get(`${baseUrl}staff/attendance/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                params: {
                    page,
                    start_date: customFilters.start_date || undefined,
                    end_date: customFilters.end_date || undefined,
                    team: customFilters.team || undefined,
                    member: customFilters.member || undefined,
                },
            });

            const result = res?.data;

            setAttendanceData(result?.results?.data || []);

            setPagination({
                count: result?.count || 0,
                next: result?.next,
                previous: result?.previous,
                page,
            });

            const teamsData =
                result?.results?.data?.map((team) => ({
                    value: team.team_id,
                    label: team.team_name,
                })) || [];

            setTeams(teamsData);

            const allMembers = [];

            result?.results?.data?.forEach((team) => {
                team?.date_wise_attendance?.forEach((dateItem) => {
                    dateItem?.attendance?.forEach((staff) => {
                        allMembers.push({
                            value: staff.staff,
                            label: staff.staff_name,
                        });
                    });
                });
            });

            const uniqueMembers = Array.from(
                new Map(allMembers.map((item) => [item.value, item])).values()
            );

            setMembers(uniqueMembers);
        } catch (error) {
            toast.error(
                error?.response?.data?.message || "Failed to load attendance"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance(1);
    }, []);

    const handleSearch = () => {
        fetchAttendance(1);
    };

    const resetFilters = () => {
        const resetData = {
            start_date: today,
            end_date: today,
            team: "",
            member: "",
        };

        setFilters(resetData);
        fetchAttendance(1, resetData);
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <Breadcrumbs
                        title="Attendance"
                        breadcrumbItem="Staff Attendance"
                    />

                    <Card className="mb-4">
                        <CardBody>
                            <CardTitle>Filters</CardTitle>

                            <Row>
                                <Col md={3}>
                                    <label>Start Date</label>
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

                                <Col md={3}>
                                    <label>End Date</label>
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
                                    <label>Team</label>
                                    <Select
                                        options={teams}
                                        value={
                                            teams.find(
                                                (item) =>
                                                    item.value === filters.team
                                            ) || null
                                        }
                                        onChange={(selected) =>
                                            setFilters({
                                                ...filters,
                                                team: selected?.value || "",
                                            })
                                        }
                                        placeholder="Select Team"
                                        isClearable
                                    />
                                </Col>

                                <Col md={3}>
                                    <label>Member</label>
                                    <Select
                                        options={members}
                                        value={
                                            members.find(
                                                (item) =>
                                                    item.value === filters.member
                                            ) || null
                                        }
                                        onChange={(selected) =>
                                            setFilters({
                                                ...filters,
                                                member: selected?.value || "",
                                            })
                                        }
                                        placeholder="Select Member"
                                        isClearable
                                    />
                                </Col>
                            </Row>

                            <div className="mt-3">
                                <Button color="primary" onClick={handleSearch}>
                                    Search
                                </Button>

                                <Button
                                    color="secondary"
                                    className="ms-2"
                                    onClick={resetFilters}
                                >
                                    Reset
                                </Button>
                            </div>
                        </CardBody>
                    </Card>

                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner />
                        </div>
                    ) : (
                        <>
                            <Row>
                                {attendanceData?.length > 0 ? (
                                    attendanceData.map((team) => (
                                        <Col
                                            xs={12}
                                            key={team.team_id}
                                            className="mb-3"
                                        >
                                            <Card
                                                className="shadow-sm border-0"
                                                style={{
                                                    borderRadius: "12px",
                                                }}
                                            >
                                                <CardBody>
                                                    <div className="d-flex justify-content-between align-items-center flex-wrap mb-3">
                                                        <div>
                                                            <h5 className="mb-1 fw-bold">
                                                                {team.team_name}
                                                            </h5>

                                                            <small className="text-muted">
                                                                Team Leader :{" "}
                                                                {
                                                                    team.team_leader_name
                                                                }
                                                            </small>
                                                        </div>

                                                        <div>
                                                            <span className="badge bg-primary">
                                                                Members :{" "}
                                                                {team.members_count ||
                                                                    0}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {team?.date_wise_attendance
                                                        ?.length > 0 ? (
                                                        team.date_wise_attendance.map(
                                                            (dateItem) => (
                                                                <div
                                                                    key={
                                                                        dateItem.attendance_date
                                                                    }
                                                                    className="mb-4"
                                                                >
                                                                    <div className="d-flex justify-content-between align-items-center flex-wrap mb-2">
                                                                        <h6 className="fw-bold mb-0">
                                                                            Date :{" "}
                                                                            {
                                                                                dateItem.attendance_date
                                                                            }
                                                                        </h6>

                                                                        <div className="d-flex gap-2 flex-wrap">
                                                                            <span className="badge bg-success">
                                                                                Present
                                                                                :{" "}
                                                                                {dateItem.present_count ||
                                                                                    0}
                                                                            </span>

                                                                            <span className="badge bg-warning">
                                                                                Half
                                                                                Day
                                                                                :{" "}
                                                                                {dateItem.half_day_count ||
                                                                                    0}
                                                                            </span>

                                                                            <span className="badge bg-danger">
                                                                                Absent
                                                                                :{" "}
                                                                                {dateItem.absent_count ||
                                                                                    0}
                                                                            </span>

                                                                            <span className="badge bg-secondary">
                                                                                Pending
                                                                                :{" "}
                                                                                {dateItem.pending_count ||
                                                                                    0}
                                                                            </span>

                                                                            <span className="badge bg-dark">
                                                                                Rejected
                                                                                :{" "}
                                                                                {dateItem.rejected_count ||
                                                                                    0}
                                                                            </span>

                                                                            <span className="badge bg-primary">
                                                                                Total
                                                                                :{" "}
                                                                                {dateItem.total_count ||
                                                                                    0}
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    <Table
                                                                        bordered
                                                                        responsive
                                                                        size="sm"
                                                                        className="mb-0"
                                                                    >
                                                                        <thead>
                                                                            <tr>
                                                                                <th width="5%">
                                                                                    #
                                                                                </th>
                                                                                <th>
                                                                                    Staff
                                                                                    Name
                                                                                </th>
                                                                                <th>
                                                                                    Reporting
                                                                                    Time
                                                                                </th>
                                                                                <th width="15%">
                                                                                    Status
                                                                                </th>
                                                                                <th width="15%">
                                                                                    Approval
                                                                                </th>
                                                                            </tr>
                                                                        </thead>

                                                                        <tbody>
                                                                            {dateItem
                                                                                ?.attendance
                                                                                ?.length >
                                                                            0 ? (
                                                                                dateItem.attendance.map(
                                                                                    (
                                                                                        staff,
                                                                                        index
                                                                                    ) => (
                                                                                        <tr
                                                                                            key={
                                                                                                staff.id
                                                                                            }
                                                                                        >
                                                                                            <td>
                                                                                                {index +
                                                                                                    1}
                                                                                            </td>

                                                                                            <td>
                                                                                                {
                                                                                                    staff.staff_name
                                                                                                }
                                                                                            </td>

                                                                                            <td>
                                                                                                {staff.attendance_time ||
                                                                                                    "--:--:--"}
                                                                                            </td>

                                                                                            <td>
                                                                                                <span
                                                                                                    className={`badge ${
                                                                                                        staff.status ===
                                                                                                        "present"
                                                                                                            ? "bg-success"
                                                                                                            : staff.status ===
                                                                                                              "absent"
                                                                                                            ? "bg-danger"
                                                                                                            : "bg-warning"
                                                                                                    }`}
                                                                                                >
                                                                                                    {
                                                                                                        staff.status
                                                                                                    }
                                                                                                </span>
                                                                                            </td>

                                                                                            <td>
                                                                                                <span
                                                                                                    className={`badge ${
                                                                                                        staff.approval_status ===
                                                                                                        "approved"
                                                                                                            ? "bg-success"
                                                                                                            : staff.approval_status ===
                                                                                                              "rejected"
                                                                                                            ? "bg-danger"
                                                                                                            : "bg-warning"
                                                                                                    }`}
                                                                                                >
                                                                                                    {staff.approval_status ||
                                                                                                        "pending"}
                                                                                                </span>
                                                                                            </td>
                                                                                        </tr>
                                                                                    )
                                                                                )
                                                                            ) : (
                                                                                <tr>
                                                                                    <td
                                                                                        colSpan="5"
                                                                                        className="text-center"
                                                                                    >
                                                                                        No
                                                                                        Attendance
                                                                                    </td>
                                                                                </tr>
                                                                            )}
                                                                        </tbody>
                                                                    </Table>
                                                                </div>
                                                            )
                                                        )
                                                    ) : (
                                                        <div className="text-center py-3">
                                                            No Attendance
                                                        </div>
                                                    )}
                                                </CardBody>
                                            </Card>
                                        </Col>
                                    ))
                                ) : (
                                    <Col md={12}>
                                        <Card>
                                            <CardBody className="text-center">
                                                No Attendance Found
                                            </CardBody>
                                        </Card>
                                    </Col>
                                )}
                            </Row>

                            <Card>
                                <CardBody>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <Button
                                            color="secondary"
                                            disabled={!pagination.previous}
                                            onClick={() =>
                                                fetchAttendance(
                                                    pagination.page - 1
                                                )
                                            }
                                        >
                                            Previous
                                        </Button>

                                        <span>Page {pagination.page}</span>

                                        <Button
                                            color="secondary"
                                            disabled={!pagination.next}
                                            onClick={() =>
                                                fetchAttendance(
                                                    pagination.page + 1
                                                )
                                            }
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </CardBody>
                            </Card>
                        </>
                    )}

                    <ToastContainer />
                </Container>
            </div>
        </React.Fragment>
    );
};

export default StaffAttendance;