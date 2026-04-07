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
    Table,
    Spinner,
    Input,
    InputGroup,
    InputGroupText,
    Badge,
} from "reactstrap";
import { useFormik } from "formik";
import * as Yup from "yup";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import Select from "react-select";

const AddTeamMembers = () => {
    document.title = "Sales Team Members | Beposoft";

    const token = localStorage.getItem("token");
    const baseUrl = import.meta.env.VITE_APP_KEY;

    const [teams, setTeams] = useState([]);
    const [members, setMembers] = useState([]);
    const [staffList, setStaffList] = useState([]);

    const [loading, setLoading] = useState(false);
    const [tableLoading, setTableLoading] = useState(false);
    const [teamsLoading, setTeamsLoading] = useState(false);
    const [staffLoading, setStaffLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [viewLoadingId, setViewLoadingId] = useState(null);

    const [pageError, setPageError] = useState("");
    const [searchText, setSearchText] = useState("");

    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedMemberId, setSelectedMemberId] = useState(null);

    const fetchMyTeams = async () => {
        try {
            setTableLoading(true);
            setTeamsLoading(true);
            setPageError("");

            const response = await axios.get(`${baseUrl}my/sales/team/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (response.status === 200) {
                const teamsData = Array.isArray(response?.data?.data)
                    ? response.data.data
                    : [];

                setTeams(teamsData);

                const allMembers = teamsData.flatMap((team) =>
                    (team.members || []).map((member) => ({
                        ...member,
                        team: team.id,
                        team_name: team.name,
                        team_leader: team.team_leader,
                        team_leader_name: team.team_leader_name,
                        division: team.division,
                        division_name: team.division_name,
                        created_by: team.created_by,
                        created_by_name:
                            member.created_by_name || team.created_by_name || "",
                    }))
                );

                setMembers(allMembers);
            } else {
                setTeams([]);
                setMembers([]);
                throw new Error("Failed to fetch my sales teams");
            }
        } catch (error) {
            const message =
                error?.response?.data?.error ||
                error?.response?.data?.message ||
                error?.message ||
                "Failed to fetch my sales teams";
            setPageError(message);
            toast.error(message);
            setTeams([]);
            setMembers([]);
        } finally {
            setTableLoading(false);
            setTeamsLoading(false);
        }
    };

    const fetchStaffs = async () => {
        try {
            setStaffLoading(true);

            const response = await axios.get(`${baseUrl}staffs/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (response.status === 200) {
                setStaffList(response?.data?.data || []);
            } else {
                setStaffList([]);
                throw new Error("Failed to fetch staff list");
            }
        } catch (error) {
            const message =
                error?.response?.data?.error ||
                error?.response?.data?.message ||
                error?.message ||
                "Failed to fetch staff list";
            toast.error(message);
            setStaffList([]);
        } finally {
            setStaffLoading(false);
        }
    };

    useEffect(() => {
        if (!token) {
            setPageError("Token not found");
            return;
        }

        const init = async () => {
            setLoading(true);
            await Promise.all([fetchMyTeams(), fetchStaffs()]);
            setLoading(false);
        };

        init();
    }, [token]);

    const teamOptions = useMemo(() => {
        return teams.map((team) => ({
            value: team.id,
            label: team.name,
        }));
    }, [teams]);

    const staffOptions = useMemo(() => {
        return staffList.map((staff) => ({
            value: staff.id,
            label: staff.name,
        }));
    }, [staffList]);

    const clearFormAndMode = () => {
        setIsEditMode(false);
        setSelectedMemberId(null);
        setPageError("");
        formik.resetForm();
    };

    const formik = useFormik({
        initialValues: {
            team: "",
            user: "",
        },
        validationSchema: Yup.object({
            team: Yup.string().required("Please select team"),
            user: Yup.string().required("Please select staff"),
        }),
        onSubmit: async (values, { resetForm }) => {
            try {
                setSubmitting(true);
                setPageError("");

                const payload = {
                    team: Number(values.team),
                    user: Number(values.user),
                };

                let response;

                if (isEditMode && selectedMemberId) {
                    response = await axios.put(
                        `${baseUrl}sales/team/members/edit/${selectedMemberId}/`,
                        payload,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type": "application/json",
                            },
                        }
                    );
                } else {
                    response = await axios.post(
                        `${baseUrl}sales/team/members/add/`,
                        payload,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type": "application/json",
                            },
                        }
                    );
                }

                if (response.status === 200 || response.status === 201) {
                    toast.success(
                        isEditMode
                            ? "Sales team member updated successfully"
                            : "Sales team member created successfully"
                    );

                    resetForm();
                    setIsEditMode(false);
                    setSelectedMemberId(null);
                    await fetchMyTeams();
                } else {
                    toast.error(
                        isEditMode
                            ? "Failed to update sales team member"
                            : "Failed to create sales team member"
                    );
                }
            } catch (error) {
                const responseData = error?.response?.data;
                let message = "Something went wrong. Please try again.";

                if (responseData?.errors) {
                    const firstErrorKey = Object.keys(responseData.errors)[0];
                    const firstErrorValue = responseData.errors[firstErrorKey];

                    if (Array.isArray(firstErrorValue)) {
                        message = firstErrorValue[0];
                    } else if (typeof firstErrorValue === "string") {
                        message = firstErrorValue;
                    }

                    if (firstErrorKey) {
                        formik.setFieldTouched(firstErrorKey, true, false);
                        formik.setFieldError(firstErrorKey, message);
                    }
                } else {
                    message =
                        responseData?.error ||
                        responseData?.message ||
                        responseData?.detail ||
                        error?.message ||
                        message;
                }

                setPageError(message);
                toast.error(message);
            } finally {
                setSubmitting(false);
            }
        },
    });

    const handleViewMember = async (memberId) => {
        try {
            setViewLoadingId(memberId);
            setPageError("");

            const response = await axios.get(
                `${baseUrl}sales/team/members/edit/${memberId}/`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.status === 200) {
                const memberData = response?.data?.data;

                formik.setValues({
                    team: memberData?.team ? String(memberData.team) : "",
                    user: memberData?.user ? String(memberData.user) : "",
                });

                setSelectedMemberId(memberId);
                setIsEditMode(true);

                window.scrollTo({
                    top: 0,
                    behavior: "smooth",
                });

                toast.success("Sales team member details loaded");
            } else {
                throw new Error("Failed to fetch sales team member details");
            }
        } catch (error) {
            const message =
                error?.response?.data?.error ||
                error?.response?.data?.message ||
                error?.message ||
                "Failed to fetch sales team member details";
            setPageError(message);
            toast.error(message);
        } finally {
            setViewLoadingId(null);
        }
    };

    const filteredMembers = useMemo(() => {
        if (!searchText.trim()) return members;

        const search = searchText.toLowerCase();

        return members.filter((item) => {
            const teamText = item?.team_name ? item.team_name.toLowerCase() : "";
            const userText = item?.user_name ? item.user_name.toLowerCase() : "";
            const createdByText = item?.created_by_name
                ? item.created_by_name.toLowerCase()
                : "";

            return (
                teamText.includes(search) ||
                userText.includes(search) ||
                createdByText.includes(search)
            );
        });
    }, [members, searchText]);

    const groupedMembers = useMemo(() => {
        const grouped = {};

        filteredMembers.forEach((item) => {
            const teamKey = item?.team_name || "Unknown Team";

            if (!grouped[teamKey]) {
                grouped[teamKey] = [];
            }

            grouped[teamKey].push(item);
        });

        return Object.entries(grouped).map(([teamName, teamMembers]) => ({
            teamName,
            teamMembers,
        }));
    }, [filteredMembers]);

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <Breadcrumbs title="Sales" breadcrumbItem="My Team Members" />

                    {loading ? (
                        <Row>
                            <Col xl={12}>
                                <Card>
                                    <CardBody className="text-center py-5">
                                        <Spinner color="primary" />
                                        <div className="mt-3">Loading sales team members page...</div>
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>
                    ) : (
                        <Row>
                            <Col xl={4}>
                                <Card className="shadow-sm">
                                    <CardBody>
                                        <CardTitle className="mb-4">
                                            {isEditMode
                                                ? "Update Sales Team Member"
                                                : "Create Sales Team Member"}
                                        </CardTitle>

                                        {pageError ? (
                                            <div className="alert alert-danger py-2">
                                                {pageError}
                                            </div>
                                        ) : null}

                                        {teams.length === 0 ? (
                                            <div className="alert alert-warning mb-0">
                                                You are not assigned as team leader for any sales team.
                                            </div>
                                        ) : (
                                            <Form onSubmit={formik.handleSubmit}>
                                                <div className="mb-3">
                                                    <Label htmlFor="team">Team</Label>
                                                    <Select
                                                        inputId="team"
                                                        name="team"
                                                        options={teamOptions}
                                                        placeholder={
                                                            teamsLoading
                                                                ? "Loading teams..."
                                                                : "Search and select team"
                                                        }
                                                        value={
                                                            teamOptions.find(
                                                                (option) =>
                                                                    String(option.value) ===
                                                                    String(formik.values.team)
                                                            ) || null
                                                        }
                                                        onChange={(selectedOption) => {
                                                            formik.setFieldValue(
                                                                "team",
                                                                selectedOption
                                                                    ? String(selectedOption.value)
                                                                    : ""
                                                            );
                                                        }}
                                                        onBlur={() =>
                                                            formik.setFieldTouched("team", true)
                                                        }
                                                        isClearable
                                                        isSearchable
                                                        isDisabled={teamsLoading}
                                                        classNamePrefix="react-select"
                                                        className={
                                                            formik.touched.team && formik.errors.team
                                                                ? "is-invalid"
                                                                : ""
                                                        }
                                                        noOptionsMessage={() => "No teams found"}
                                                    />
                                                    {formik.touched.team && formik.errors.team ? (
                                                        <div className="invalid-feedback d-block">
                                                            {formik.errors.team}
                                                        </div>
                                                    ) : null}
                                                </div>

                                                <div className="mb-3">
                                                    <Label htmlFor="user">Staff</Label>
                                                    <Select
                                                        inputId="user"
                                                        name="user"
                                                        options={staffOptions}
                                                        placeholder={
                                                            staffLoading
                                                                ? "Loading staff..."
                                                                : "Search and select staff"
                                                        }
                                                        value={
                                                            staffOptions.find(
                                                                (option) =>
                                                                    String(option.value) ===
                                                                    String(formik.values.user)
                                                            ) || null
                                                        }
                                                        onChange={(selectedOption) => {
                                                            formik.setFieldValue(
                                                                "user",
                                                                selectedOption
                                                                    ? String(selectedOption.value)
                                                                    : ""
                                                            );
                                                        }}
                                                        onBlur={() =>
                                                            formik.setFieldTouched("user", true)
                                                        }
                                                        isClearable
                                                        isSearchable
                                                        isDisabled={staffLoading}
                                                        classNamePrefix="react-select"
                                                        className={
                                                            formik.touched.user && formik.errors.user
                                                                ? "is-invalid"
                                                                : ""
                                                        }
                                                        noOptionsMessage={() => "No staff found"}
                                                    />
                                                    {formik.touched.user && formik.errors.user ? (
                                                        <div className="invalid-feedback d-block">
                                                            {formik.errors.user}
                                                        </div>
                                                    ) : null}
                                                </div>

                                                <div className="d-flex gap-2 mt-4 flex-wrap">
                                                    <Button
                                                        color="primary"
                                                        type="submit"
                                                        disabled={submitting}
                                                    >
                                                        {submitting
                                                            ? isEditMode
                                                                ? "Updating..."
                                                                : "Saving..."
                                                            : isEditMode
                                                            ? "Update Member"
                                                            : "Create Member"}
                                                    </Button>

                                                    <Button
                                                        color="light"
                                                        type="button"
                                                        onClick={clearFormAndMode}
                                                        disabled={submitting}
                                                    >
                                                        {isEditMode ? "Cancel" : "Reset"}
                                                    </Button>
                                                </div>
                                            </Form>
                                        )}
                                    </CardBody>
                                </Card>
                            </Col>

                            <Col xl={8}>
                                <Card className="shadow-sm">
                                    <CardBody>
                                        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
                                            <CardTitle className="mb-0">
                                                My Team Members
                                            </CardTitle>

                                            <div
                                                className="d-flex flex-wrap gap-2"
                                                style={{ minWidth: "280px" }}
                                            >
                                                <InputGroup>
                                                    <InputGroupText>
                                                        <i className="bx bx-search" />
                                                    </InputGroupText>
                                                    <Input
                                                        type="text"
                                                        placeholder="Search team, staff..."
                                                        value={searchText}
                                                        onChange={(e) =>
                                                            setSearchText(e.target.value)
                                                        }
                                                    />
                                                </InputGroup>

                                                <Button
                                                    color="primary"
                                                    outline
                                                    onClick={fetchMyTeams}
                                                    disabled={tableLoading}
                                                >
                                                    {tableLoading ? "Refreshing..." : "Refresh"}
                                                </Button>
                                            </div>
                                        </div>

                                        <Row className="mb-3">
                                            <Col md={4}>
                                                <Card className="border shadow-none mb-0">
                                                    <CardBody className="py-3">
                                                        <h6 className="text-muted mb-1">
                                                            Total Teams
                                                        </h6>
                                                        <h4 className="mb-0">{teams.length}</h4>
                                                    </CardBody>
                                                </Card>
                                            </Col>
                                            <Col md={4}>
                                                <Card className="border shadow-none mb-0">
                                                    <CardBody className="py-3">
                                                        <h6 className="text-muted mb-1">
                                                            Total Members
                                                        </h6>
                                                        <h4 className="mb-0">{members.length}</h4>
                                                    </CardBody>
                                                </Card>
                                            </Col>
                                            <Col md={4}>
                                                <Card className="border shadow-none mb-0">
                                                    <CardBody className="py-3">
                                                        <h6 className="text-muted mb-1">
                                                            Teams Shown
                                                        </h6>
                                                        <h4 className="mb-0">{groupedMembers.length}</h4>
                                                    </CardBody>
                                                </Card>
                                            </Col>
                                        </Row>

                                        {tableLoading ? (
                                            <div className="text-center py-5">
                                                <Spinner color="primary" />
                                                <div className="mt-2">
                                                    Loading team members...
                                                </div>
                                            </div>
                                        ) : groupedMembers.length === 0 ? (
                                            <div className="text-center py-5 text-muted">
                                                No team members found
                                            </div>
                                        ) : (
                                            groupedMembers.map((group, groupIndex) => (
                                                <Card
                                                    key={group.teamName}
                                                    className="border mb-4 shadow-none"
                                                >
                                                    <CardBody>
                                                        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                                                            <div>
                                                                <h5 className="mb-1">
                                                                    {groupIndex + 1}. {group.teamName}
                                                                </h5>
                                                                <p className="text-muted mb-0">
                                                                    Members in this team
                                                                </p>
                                                            </div>

                                                            <Badge color="primary" pill>
                                                                {group.teamMembers.length} Members
                                                            </Badge>
                                                        </div>

                                                        <div className="table-responsive">
                                                            <Table
                                                                className="table table-bordered align-middle mb-0"
                                                                hover
                                                            >
                                                                <thead className="table-light">
                                                                    <tr>
                                                                        <th style={{ minWidth: "70px" }}>
                                                                            #
                                                                        </th>
                                                                        <th style={{ minWidth: "220px" }}>
                                                                            Staff
                                                                        </th>
                                                                        <th style={{ minWidth: "120px" }}>
                                                                            Action
                                                                        </th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {group.teamMembers.map(
                                                                        (item, memberIndex) => (
                                                                            <tr key={item.id}>
                                                                                <td>{memberIndex + 1}</td>
                                                                                <td>{item.user_name || "-"}</td>
                                                                                <td>
                                                                                    <Button
                                                                                        color="info"
                                                                                        size="sm"
                                                                                        onClick={() =>
                                                                                            handleViewMember(item.id)
                                                                                        }
                                                                                        disabled={
                                                                                            viewLoadingId === item.id
                                                                                        }
                                                                                    >
                                                                                        {viewLoadingId === item.id
                                                                                            ? "Loading..."
                                                                                            : "View"}
                                                                                    </Button>
                                                                                </td>
                                                                            </tr>
                                                                        )
                                                                    )}
                                                                </tbody>
                                                            </Table>
                                                        </div>
                                                    </CardBody>
                                                </Card>
                                            ))
                                        )}
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>  
                    )}
                </Container>
                <ToastContainer />
            </div>
        </React.Fragment>
    );
};

export default AddTeamMembers;