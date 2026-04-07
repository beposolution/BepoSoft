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
    Input,
    Button,
    FormFeedback,
    Table,
    Spinner,
    InputGroup,
    InputGroupText,
} from "reactstrap";
import { useFormik } from "formik";
import * as Yup from "yup";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import Select from "react-select";

const AddTeam = () => {
    document.title = "Sales Team Management | Beposoft";

    const token = localStorage.getItem("token");
    const baseUrl = import.meta.env.VITE_APP_KEY;

    const [teams, setTeams] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [familyList, setFamilyList] = useState([]);

    const [loading, setLoading] = useState(false);
    const [tableLoading, setTableLoading] = useState(false);
    const [staffLoading, setStaffLoading] = useState(false);
    const [familyLoading, setFamilyLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [viewLoadingId, setViewLoadingId] = useState(null);

    const [pageError, setPageError] = useState("");
    const [searchText, setSearchText] = useState("");

    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedTeamId, setSelectedTeamId] = useState(null);

    const fetchSalesTeams = async () => {
        try {
            setTableLoading(true);
            setPageError("");

            const response = await axios.get(`${baseUrl}sales/teams/add/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (response.status === 200) {
                setTeams(response?.data?.data || []);
            } else {
                setTeams([]);
                throw new Error("Failed to fetch sales teams");
            }
        } catch (error) {
            const message =
                error?.response?.data?.error ||
                error?.response?.data?.message ||
                error?.message ||
                "Failed to fetch sales teams";
            setPageError(message);
            toast.error(message);
        } finally {
            setTableLoading(false);
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

    const fetchFamilies = async () => {
        try {
            setFamilyLoading(true);

            const response = await axios.get(`${baseUrl}familys/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (response.status === 200) {
                setFamilyList(response?.data?.data || []);
            } else {
                setFamilyList([]);
                throw new Error("Failed to fetch division list");
            }
        } catch (error) {
            const message =
                error?.response?.data?.error ||
                error?.response?.data?.message ||
                error?.message ||
                "Failed to fetch division list";
            toast.error(message);
            setFamilyList([]);
        } finally {
            setFamilyLoading(false);
        }
    };

    useEffect(() => {
        if (!token) {
            setPageError("Token not found");
            return;
        }

        const init = async () => {
            setLoading(true);
            await Promise.all([
                fetchSalesTeams(),
                fetchStaffs(),
                fetchFamilies(),
            ]);
            setLoading(false);
        };

        init();
    }, [token]);

    const staffOptions = useMemo(() => {
        return staffList.map((staff) => ({
            value: staff.id,
            label: staff.name,
        }));
    }, [staffList]);

    const familyOptions = useMemo(() => {
        return familyList.map((family) => ({
            value: family.id,
            label: family.name,
        }));
    }, [familyList]);

    const clearFormAndMode = () => {
        setIsEditMode(false);
        setSelectedTeamId(null);
        setPageError("");
        formik.resetForm();
    };

    const formik = useFormik({
        initialValues: {
            name: "",
            team_leader: "",
            division: "",
        },
        validationSchema: Yup.object({
            name: Yup.string().trim().required("Team name is required"),
            team_leader: Yup.string().required("Please select team leader"),
            division: Yup.string().required("Please select division"),
        }),
        onSubmit: async (values, { resetForm }) => {
            try {
                setSubmitting(true);
                setPageError("");

                const payload = {
                    name: values.name.trim(),
                    team_leader: Number(values.team_leader),
                    division: Number(values.division),
                };

                let response;

                if (isEditMode && selectedTeamId) {
                    response = await axios.put(
                        `${baseUrl}sales/teams/edit/${selectedTeamId}/`,
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
                        `${baseUrl}sales/teams/add/`,
                        payload,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type": "application/json",
                            },
                        }
                    );
                }

                if (response.status === 201 || response.status === 200) {
                    toast.success(
                        isEditMode
                            ? "Sales team updated successfully"
                            : "Sales team created successfully"
                    );

                    resetForm();
                    setIsEditMode(false);
                    setSelectedTeamId(null);
                    await fetchSalesTeams();
                } else {
                    toast.error(
                        isEditMode
                            ? "Failed to update sales team"
                            : "Failed to create sales team"
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

    const handleViewTeam = async (teamId) => {
        try {
            setViewLoadingId(teamId);
            setPageError("");

            const response = await axios.get(
                `${baseUrl}sales/teams/edit/${teamId}/`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.status === 200) {
                const teamData = response?.data?.data;

                formik.setValues({
                    name: teamData?.name ? String(teamData.name) : "",
                    team_leader: teamData?.team_leader
                        ? String(teamData.team_leader)
                        : "",
                    division: teamData?.division
                        ? String(teamData.division)
                        : "",
                });

                setSelectedTeamId(teamId);
                setIsEditMode(true);

                window.scrollTo({
                    top: 0,
                    behavior: "smooth",
                });

                toast.success("Sales team details loaded");
            } else {
                throw new Error("Failed to fetch sales team details");
            }
        } catch (error) {
            const message =
                error?.response?.data?.error ||
                error?.response?.data?.message ||
                error?.message ||
                "Failed to fetch sales team details";
            setPageError(message);
            toast.error(message);
        } finally {
            setViewLoadingId(null);
        }
    };

    const filteredTeams = useMemo(() => {
        if (!searchText.trim()) return teams;

        const search = searchText.toLowerCase();

        return teams.filter((item) => {
            const nameText = item?.name ? item.name.toLowerCase() : "";
            const leaderText = item?.team_leader_name
                ? item.team_leader_name.toLowerCase()
                : "";
            const divisionText = item?.division_name
                ? item.division_name.toLowerCase()
                : "";
            const createdByText = item?.created_by_name
                ? item.created_by_name.toLowerCase()
                : "";

            return (
                nameText.includes(search) ||
                leaderText.includes(search) ||
                divisionText.includes(search) ||
                createdByText.includes(search)
            );
        });
    }, [teams, searchText]);

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <Breadcrumbs title="Sales" breadcrumbItem="Sales Team Management" />

                    {loading ? (
                        <Row>
                            <Col xl={12}>
                                <Card>
                                    <CardBody className="text-center py-5">
                                        <Spinner color="primary" />
                                        <div className="mt-3">Loading sales team page...</div>
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
                                            {isEditMode ? "Update Sales Team" : "Create Sales Team"}
                                        </CardTitle>

                                        {pageError ? (
                                            <div className="alert alert-danger py-2">
                                                {pageError}
                                            </div>
                                        ) : null}

                                        <Form onSubmit={formik.handleSubmit}>
                                            <div className="mb-3">
                                                <Label htmlFor="name">Team Name</Label>
                                                <Input
                                                    id="name"
                                                    name="name"
                                                    type="text"
                                                    placeholder="Enter team name"
                                                    value={formik.values.name}
                                                    onChange={formik.handleChange}
                                                    onBlur={formik.handleBlur}
                                                    invalid={
                                                        formik.touched.name &&
                                                        !!formik.errors.name
                                                    }
                                                />
                                                {formik.touched.name && formik.errors.name ? (
                                                    <FormFeedback>
                                                        {formik.errors.name}
                                                    </FormFeedback>
                                                ) : null}
                                            </div>

                                            <div className="mb-3">
                                                <Label htmlFor="team_leader">
                                                    Team Leader
                                                </Label>
                                                <Select
                                                    inputId="team_leader"
                                                    name="team_leader"
                                                    options={staffOptions}
                                                    placeholder={
                                                        staffLoading
                                                            ? "Loading team leaders..."
                                                            : "Search and select team leader"
                                                    }
                                                    value={
                                                        staffOptions.find(
                                                            (option) =>
                                                                String(option.value) ===
                                                                String(formik.values.team_leader)
                                                        ) || null
                                                    }
                                                    onChange={(selectedOption) => {
                                                        formik.setFieldValue(
                                                            "team_leader",
                                                            selectedOption
                                                                ? String(selectedOption.value)
                                                                : ""
                                                        );
                                                    }}
                                                    onBlur={() =>
                                                        formik.setFieldTouched(
                                                            "team_leader",
                                                            true
                                                        )
                                                    }
                                                    isClearable
                                                    isSearchable
                                                    isDisabled={staffLoading}
                                                    classNamePrefix="react-select"
                                                    className={
                                                        formik.touched.team_leader &&
                                                        formik.errors.team_leader
                                                            ? "is-invalid"
                                                            : ""
                                                    }
                                                    noOptionsMessage={() =>
                                                        "No team leaders found"
                                                    }
                                                />
                                                {formik.touched.team_leader &&
                                                formik.errors.team_leader ? (
                                                    <div className="invalid-feedback d-block">
                                                        {formik.errors.team_leader}
                                                    </div>
                                                ) : null}
                                            </div>

                                            <div className="mb-3">
                                                <Label htmlFor="division">
                                                    Division
                                                </Label>
                                                <Select
                                                    inputId="division"
                                                    name="division"
                                                    options={familyOptions}
                                                    placeholder={
                                                        familyLoading
                                                            ? "Loading divisions..."
                                                            : "Search and select division"
                                                    }
                                                    value={
                                                        familyOptions.find(
                                                            (option) =>
                                                                String(option.value) ===
                                                                String(formik.values.division)
                                                        ) || null
                                                    }
                                                    onChange={(selectedOption) => {
                                                        formik.setFieldValue(
                                                            "division",
                                                            selectedOption
                                                                ? String(selectedOption.value)
                                                                : ""
                                                        );
                                                    }}
                                                    onBlur={() =>
                                                        formik.setFieldTouched(
                                                            "division",
                                                            true
                                                        )
                                                    }
                                                    isClearable
                                                    isSearchable
                                                    isDisabled={familyLoading}
                                                    classNamePrefix="react-select"
                                                    className={
                                                        formik.touched.division &&
                                                        formik.errors.division
                                                            ? "is-invalid"
                                                            : ""
                                                    }
                                                    noOptionsMessage={() =>
                                                        "No divisions found"
                                                    }
                                                />
                                                {formik.touched.division &&
                                                formik.errors.division ? (
                                                    <div className="invalid-feedback d-block">
                                                        {formik.errors.division}
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
                                                        ? "Update Team"
                                                        : "Create Team"}
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
                                    </CardBody>
                                </Card>
                            </Col>

                            <Col xl={8}>
                                <Card className="shadow-sm">
                                    <CardBody>
                                        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
                                            <CardTitle className="mb-0">
                                                Sales Team List
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
                                                        placeholder="Search team, leader, division..."
                                                        value={searchText}
                                                        onChange={(e) =>
                                                            setSearchText(e.target.value)
                                                        }
                                                    />
                                                </InputGroup>

                                                <Button
                                                    color="primary"
                                                    outline
                                                    onClick={fetchSalesTeams}
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
                                                            Showing Results
                                                        </h6>
                                                        <h4 className="mb-0">
                                                            {filteredTeams.length}
                                                        </h4>
                                                    </CardBody>
                                                </Card>
                                            </Col>
                                            <Col md={4}>
                                                <Card className="border shadow-none mb-0">
                                                    <CardBody className="py-3">
                                                        <h6 className="text-muted mb-1">
                                                            Search Status
                                                        </h6>
                                                        <h6 className="mb-0">
                                                            {searchText.trim()
                                                                ? "Filtered"
                                                                : "All Records"}
                                                        </h6>
                                                    </CardBody>
                                                </Card>
                                            </Col>
                                        </Row>

                                        {tableLoading ? (
                                            <div className="text-center py-5">
                                                <Spinner color="primary" />
                                                <div className="mt-2">
                                                    Loading sales teams...
                                                </div>
                                            </div>
                                        ) : filteredTeams.length === 0 ? (
                                            <div className="text-center py-5 text-muted">
                                                No sales teams found
                                            </div>
                                        ) : (
                                            <div className="table-responsive">
                                                <Table
                                                    className="table table-bordered align-middle mb-0"
                                                    hover
                                                >
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th style={{ minWidth: "70px" }}>#</th>
                                                            <th style={{ minWidth: "170px" }}>
                                                                Team Name
                                                            </th>
                                                            <th style={{ minWidth: "160px" }}>
                                                                Team Leader
                                                            </th>
                                                            <th style={{ minWidth: "160px" }}>
                                                                Division
                                                            </th>
                                                            <th style={{ minWidth: "130px" }}>
                                                                Action
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {filteredTeams.map((item, index) => (
                                                            <tr key={item.id}>
                                                                <td>{index + 1}</td>
                                                                <td>{item.name || "-"}</td>
                                                                <td>
                                                                    {item.team_leader_name ||
                                                                        item.team_leader ||
                                                                        "-"}
                                                                </td>
                                                                <td>
                                                                    {item.division_name ||
                                                                        item.division ||
                                                                        "-"}
                                                                </td>
                                                                <td>
                                                                    <Button
                                                                        color="info"
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            handleViewTeam(item.id)
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
                                                        ))}
                                                    </tbody>
                                                </Table>
                                            </div>
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

export default AddTeam;