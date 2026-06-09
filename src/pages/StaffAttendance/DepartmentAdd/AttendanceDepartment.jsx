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
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from "reactstrap";
import { useFormik } from "formik";
import * as Yup from "yup";
import Select from "react-select";
import Breadcrumbs from "../../../components/Common/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AttendanceDepartment = () => {
    document.title = "Attendance Department Management | Beposoft";

    const token = localStorage.getItem("token");
    const baseUrl = import.meta.env.VITE_APP_KEY;

    const [departments, setDepartments] = useState([]);
    const [staffList, setStaffList] = useState([]);

    const [loading, setLoading] = useState(false);
    const [tableLoading, setTableLoading] = useState(false);
    const [staffLoading, setStaffLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editSubmitting, setEditSubmitting] = useState(false);

    const [pageError, setPageError] = useState("");
    const [searchText, setSearchText] = useState("");

    const [editModal, setEditModal] = useState(false);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState(null);
    const [viewLoadingId, setViewLoadingId] = useState(null);

    const [editInitialValues, setEditInitialValues] = useState({
        team_name: "",
        team_leader: "",
    });

    const fetchDepartments = async () => {
        try {
            setTableLoading(true);
            setPageError("");

            const response = await axios.get(
                `${baseUrl}staff/attendance/teams/`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.status === 200) {
                setDepartments(response?.data?.data || []);
            } else {
                setDepartments([]);
                throw new Error("Failed to fetch departments");
            }
        } catch (error) {
            const message =
                error?.response?.data?.error ||
                error?.response?.data?.message ||
                error?.message ||
                "Failed to fetch departments";

            setPageError(message);
            toast.error(message);
        } finally {
            setTableLoading(false);
        }
    };

    const fetchStaffs = async () => {
        try {
            setStaffLoading(true);

            const response = await axios.get(`${baseUrl}staff/managers/`, {
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
            await Promise.all([fetchDepartments(), fetchStaffs()]);
            setLoading(false);
        };

        init();
    }, []);

    const staffOptions = useMemo(() => {
        return staffList.map((staff) => ({
            value: staff.id,
            label: staff.name,
        }));
    }, [staffList]);

    const customSelectStyles = {
        control: (provided, state) => ({
            ...provided,
            minHeight: "44px",
            borderColor: state.isFocused ? "#86b7fe" : "#dee2e6",
            boxShadow: state.isFocused ? "0 0 0 0.2rem rgba(13,110,253,.10)" : "none",
            borderRadius: "10px",
            backgroundColor: "#fff",
            "&:hover": {
                borderColor: "#86b7fe",
            },
        }),
        placeholder: (provided) => ({
            ...provided,
            color: "#8c98a5",
            fontSize: "14px",
        }),
        singleValue: (provided) => ({
            ...provided,
            fontSize: "14px",
            color: "#2b2f33",
        }),
        option: (provided, state) => ({
            ...provided,
            fontSize: "14px",
            backgroundColor: state.isSelected
                ? "#0d6efd"
                : state.isFocused
                    ? "#eef5ff"
                    : "#fff",
            color: state.isSelected ? "#fff" : "#2b2f33",
        }),
        menu: (provided) => ({
            ...provided,
            zIndex: 9999,
            borderRadius: "10px",
            overflow: "hidden",
        }),
    };

    const createFormik = useFormik({
        initialValues: {
            team_name: "",
            team_leader: "",
        },
        validationSchema: Yup.object({
            team_name: Yup.string()
                .trim()
                .required("Department name is required"),
            team_leader: Yup.string().required("Please select team leader"),
        }),
        onSubmit: async (values, { resetForm }) => {
            try {
                setSubmitting(true);
                setPageError("");

                const payload = {
                    team_name: values.team_name.trim(),
                    team_leader: Number(values.team_leader),
                };

                const response = await axios.post(
                    `${baseUrl}staff/attendance/teams/`,
                    payload,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (response.status === 200 || response.status === 201) {
                    toast.success("Department created successfully");
                    resetForm();
                    await fetchDepartments();
                } else {
                    toast.error("Failed to create department");
                }
            } catch (error) {
                const responseData = error?.response?.data;
                const message =
                    responseData?.error ||
                    responseData?.message ||
                    responseData?.detail ||
                    error?.message ||
                    "Something went wrong";

                setPageError(message);
                toast.error(message);
            } finally {
                setSubmitting(false);
            }
        },
    });

    const editFormik = useFormik({
        enableReinitialize: true,
        initialValues: editInitialValues,
        validationSchema: Yup.object({
            team_name: Yup.string()
                .trim()
                .required("Department name is required"),
            team_leader: Yup.string().required("Please select team leader"),
        }),
        onSubmit: async (values) => {
            if (!selectedDepartmentId) return;

            try {
                setEditSubmitting(true);
                setPageError("");

                const payload = {
                    team_name: values.team_name.trim(),
                    team_leader: Number(values.team_leader),
                };

                const response = await axios.put(
                    `${baseUrl}staff/attendance/teams/edit/${selectedDepartmentId}/`,
                    payload,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (response.status === 200 || response.status === 201) {
                    toast.success("Department updated successfully");
                    setEditModal(false);
                    setSelectedDepartmentId(null);
                    setEditInitialValues({
                        team_name: "",
                        team_leader: "",
                    });
                    await fetchDepartments();
                } else {
                    toast.error("Failed to update department");
                }
            } catch (error) {
                const responseData = error?.response?.data;
                const message =
                    responseData?.error ||
                    responseData?.message ||
                    responseData?.detail ||
                    error?.message ||
                    "Something went wrong";

                setPageError(message);
                toast.error(message);
            } finally {
                setEditSubmitting(false);
            }
        },
    });

    const openEditDepartment = async (departmentId) => {
        try {
            setViewLoadingId(departmentId);
            setPageError("");

            const response = await axios.get(
                `${baseUrl}staff/attendance/teams/edit/${departmentId}/`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.status === 200) {
                const departmentData = response?.data?.data || response?.data || {};

                setSelectedDepartmentId(departmentId);
                setEditInitialValues({
                    team_name: departmentData?.team_name || "",
                    team_leader: departmentData?.team_leader
                        ? String(departmentData.team_leader)
                        : "",
                });
                setEditModal(true);
            } else {
                throw new Error("Failed to fetch department details");
            }
        } catch (error) {
            const message =
                error?.response?.data?.error ||
                error?.response?.data?.message ||
                error?.message ||
                "Failed to fetch department details";

            toast.error(message);
        } finally {
            setViewLoadingId(null);
        }
    };

    const filteredDepartments = useMemo(() => {
        if (!searchText.trim()) return departments;

        const search = searchText.toLowerCase();

        return departments.filter((item) => {
            const teamName = item?.team_name?.toLowerCase() || "";
            const leaderName = item?.team_leader_name?.toLowerCase() || "";
            return teamName.includes(search) || leaderName.includes(search);
        });
    }, [departments, searchText]);

    const totalDepartments = departments.length;
    const showingDepartments = filteredDepartments.length;

    const cardStyle = {
        borderRadius: "16px",
        boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)",
        border: "1px solid #eef2f7",
        background: "#fff",
    };

    const sectionHeaderStyle = {
        fontWeight: 700,
        color: "#1f2937",
        marginBottom: "0",
    };

    return (
        <React.Fragment>
            <div
                className="page-content"
                style={{
                    background: "#f6f8fc",
                    minHeight: "100vh",
                }}
            >
                <Container fluid>
                    <Breadcrumbs
                        title="Attendance"
                        breadcrumbItem="Department Management"
                    />

                    {loading ? (
                        <Row>
                            <Col xl={12}>
                                <Card style={cardStyle}>
                                    <CardBody className="text-center py-5">
                                        <Spinner color="primary" />
                                        <div className="mt-3 text-muted">
                                            Loading Department Page...
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>
                    ) : (
                        <>
                            <Row className="mb-3">
                                <Col md={4}>
                                    <Card style={cardStyle} className="mb-3">
                                        <CardBody className="py-3">
                                            <div className="text-muted" style={{ fontSize: "13px" }}>
                                                Total Departments
                                            </div>
                                            <div style={{ fontSize: "22px", fontWeight: 700, color: "#0d6efd" }}>
                                                {totalDepartments}
                                            </div>
                                        </CardBody>
                                    </Card>
                                </Col>

                                <Col md={4}>
                                    <Card style={cardStyle} className="mb-3">
                                        <CardBody className="py-3">
                                            <div className="text-muted" style={{ fontSize: "13px" }}>
                                                Showing Results
                                            </div>
                                            <div style={{ fontSize: "22px", fontWeight: 700, color: "#16a34a" }}>
                                                {showingDepartments}
                                            </div>
                                        </CardBody>
                                    </Card>
                                </Col>

                                <Col md={4}>
                                    <Card style={cardStyle} className="mb-3">
                                        <CardBody className="py-3">
                                            <div className="text-muted" style={{ fontSize: "13px" }}>
                                                Search Status
                                            </div>
                                            <div style={{ fontSize: "22px", fontWeight: 700, color: "#7c3aed" }}>
                                                {searchText.trim() ? "Filtered" : "All Records"}
                                            </div>
                                        </CardBody>
                                    </Card>
                                </Col>
                            </Row>

                            <Row>
                                <Col xl={12}>
                                    <Card style={cardStyle} className="mb-4">
                                        <CardBody>
                                            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                                                <CardTitle className="mb-0" style={sectionHeaderStyle}>
                                                    Add Department
                                                </CardTitle>
                                            </div>

                                            {pageError ? (
                                                <div className="alert alert-danger py-2 mb-3">
                                                    {pageError}
                                                </div>
                                            ) : null}

                                            <Form onSubmit={createFormik.handleSubmit}>
                                                <Row className="g-3 align-items-start">
                                                    <Col md={5}>
                                                        <Label htmlFor="team_name" className="fw-semibold">
                                                            Department Name
                                                        </Label>
                                                        <Input
                                                            id="team_name"
                                                            name="team_name"
                                                            type="text"
                                                            placeholder="Enter department name"
                                                            value={createFormik.values.team_name}
                                                            onChange={createFormik.handleChange}
                                                            onBlur={createFormik.handleBlur}
                                                            invalid={
                                                                createFormik.touched.team_name &&
                                                                !!createFormik.errors.team_name
                                                            }
                                                            style={{
                                                                height: "44px",
                                                                borderRadius: "10px",
                                                                background: "#fff",
                                                            }}
                                                        />
                                                        {createFormik.touched.team_name && createFormik.errors.team_name ? (
                                                            <FormFeedback>
                                                                {createFormik.errors.team_name}
                                                            </FormFeedback>
                                                        ) : null}
                                                    </Col>

                                                    <Col md={5}>
                                                        <Label htmlFor="team_leader" className="fw-semibold">
                                                            Team Leader
                                                        </Label>
                                                        <Select
                                                            inputId="team_leader"
                                                            options={staffOptions}
                                                            placeholder={
                                                                staffLoading
                                                                    ? "Loading staff..."
                                                                    : "Select Team Leader"
                                                            }
                                                            value={
                                                                staffOptions.find(
                                                                    (option) =>
                                                                        String(option.value) ===
                                                                        String(createFormik.values.team_leader)
                                                                ) || null
                                                            }
                                                            onChange={(selectedOption) => {
                                                                createFormik.setFieldValue(
                                                                    "team_leader",
                                                                    selectedOption ? String(selectedOption.value) : ""
                                                                );
                                                            }}
                                                            onBlur={() => createFormik.setFieldTouched("team_leader", true)}
                                                            isSearchable
                                                            isClearable
                                                            isDisabled={staffLoading}
                                                            styles={customSelectStyles}
                                                        />
                                                        {createFormik.touched.team_leader && createFormik.errors.team_leader ? (
                                                            <div className="invalid-feedback d-block">
                                                                {createFormik.errors.team_leader}
                                                            </div>
                                                        ) : null}
                                                    </Col>

                                                    <Col
                                                        md={2}
                                                        className="d-flex align-items-end"
                                                        style={{ paddingTop: "32px" }}
                                                    >
                                                        <Button
                                                            color="primary"
                                                            type="submit"
                                                            disabled={submitting}
                                                            style={{
                                                                width: "100%",
                                                                height: "48px",
                                                                borderRadius: "10px",
                                                                fontWeight: 600,
                                                                marginTop: "1px",
                                                            }}
                                                        >
                                                            {submitting ? "Adding..." : "Add Team"}
                                                        </Button>

                                                    </Col>
                                                </Row>
                                            </Form>
                                        </CardBody>
                                    </Card>
                                </Col>

                                <Col xl={12}>
                                    <Card style={cardStyle}>
                                        <CardBody>
                                            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                                                <CardTitle className="mb-0" style={sectionHeaderStyle}>
                                                    Department List
                                                </CardTitle>

                                                <div className="d-flex gap-2 align-items-center" style={{ minWidth: "320px" }}>
                                                    <InputGroup>
                                                        <InputGroupText style={{ background: "#f8fafc" }}>
                                                            <i className="bx bx-search" />
                                                        </InputGroupText>
                                                        <Input
                                                            placeholder="Search department..."
                                                            value={searchText}
                                                            onChange={(e) => setSearchText(e.target.value)}
                                                            style={{
                                                                height: "44px",
                                                                borderRadius: "10px",
                                                            }}
                                                        />
                                                    </InputGroup>

                                                    <Button
                                                        color="primary"
                                                        outline
                                                        onClick={fetchDepartments}
                                                        disabled={tableLoading}
                                                        style={{
                                                            height: "44px",
                                                            borderRadius: "10px",
                                                            whiteSpace: "nowrap",
                                                        }}
                                                    >
                                                        {tableLoading ? "Refreshing..." : "Refresh"}
                                                    </Button>
                                                </div>
                                            </div>

                                            {tableLoading ? (
                                                <div className="text-center py-5">
                                                    <Spinner color="primary" />
                                                    <div className="mt-2 text-muted">Loading departments...</div>
                                                </div>
                                            ) : filteredDepartments.length === 0 ? (
                                                <div className="text-center py-5 text-muted">
                                                    No departments found
                                                </div>
                                            ) : (
                                                <div className="table-responsive">
                                                    <Table
                                                        bordered
                                                        hover
                                                        className="align-middle mb-0"
                                                        style={{
                                                            fontSize: "13px",
                                                            background: "#fff",
                                                        }}
                                                    >
                                                        <thead>
                                                            <tr style={{ background: "#f1f7ff" }}>
                                                                <th style={{ minWidth: "70px" }}>#</th>
                                                                <th style={{ minWidth: "220px" }}>Department Name</th>
                                                                <th style={{ minWidth: "220px" }}>Team Leader</th>
                                                                <th style={{ minWidth: "150px" }}>Created At</th>
                                                                <th style={{ minWidth: "120px" }}>Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {filteredDepartments.map((item, index) => (
                                                                <tr key={item.id}>
                                                                    <td>{index + 1}</td>
                                                                    <td>{item.team_name || "-"}</td>
                                                                    <td>{item.team_leader_name || "-"}</td>
                                                                    <td>
                                                                        {item.created_at
                                                                            ? new Date(item.created_at).toLocaleDateString()
                                                                            : "-"}
                                                                    </td>
                                                                    <td>
                                                                        <Button
                                                                            color="warning"
                                                                            size="sm"
                                                                            onClick={() => openEditDepartment(item.id)}
                                                                            disabled={viewLoadingId === item.id}
                                                                            style={{
                                                                                borderRadius: "8px",
                                                                                fontWeight: 600,
                                                                            }}
                                                                        >
                                                                            {viewLoadingId === item.id ? "Loading..." : "Edit"}
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
                        </>
                    )}

                    <Modal
                        isOpen={editModal}
                        toggle={() => {
                            setEditModal(false);
                            setSelectedDepartmentId(null);
                        }}
                        centered
                        size="md"
                    >
                        <ModalHeader
                            toggle={() => {
                                setEditModal(false);
                                setSelectedDepartmentId(null);
                            }}
                            style={{ borderBottom: "1px solid #eef2f7" }}
                        >
                            Edit Department
                        </ModalHeader>

                        <Form onSubmit={editFormik.handleSubmit}>
                            <ModalBody style={{ background: "#fbfdff" }}>
                                <div className="mb-3">
                                    <Label htmlFor="edit_team_name" className="fw-semibold">
                                        Department Name
                                    </Label>
                                    <Input
                                        id="edit_team_name"
                                        name="team_name"
                                        type="text"
                                        placeholder="Enter department name"
                                        value={editFormik.values.team_name}
                                        onChange={editFormik.handleChange}
                                        onBlur={editFormik.handleBlur}
                                        invalid={
                                            editFormik.touched.team_name &&
                                            !!editFormik.errors.team_name
                                        }
                                        style={{
                                            height: "44px",
                                            borderRadius: "10px",
                                        }}
                                    />
                                    {editFormik.touched.team_name && editFormik.errors.team_name ? (
                                        <FormFeedback>{editFormik.errors.team_name}</FormFeedback>
                                    ) : null}
                                </div>

                                <div className="mb-2">
                                    <Label htmlFor="edit_team_leader" className="fw-semibold">
                                        Team Leader
                                    </Label>
                                    <Select
                                        inputId="edit_team_leader"
                                        options={staffOptions}
                                        placeholder={
                                            staffLoading
                                                ? "Loading staff..."
                                                : "Select Team Leader"
                                        }
                                        value={
                                            staffOptions.find(
                                                (option) =>
                                                    String(option.value) ===
                                                    String(editFormik.values.team_leader)
                                            ) || null
                                        }
                                        onChange={(selectedOption) => {
                                            editFormik.setFieldValue(
                                                "team_leader",
                                                selectedOption ? String(selectedOption.value) : ""
                                            );
                                        }}
                                        onBlur={() => editFormik.setFieldTouched("team_leader", true)}
                                        isSearchable
                                        isClearable
                                        isDisabled={staffLoading}
                                        styles={customSelectStyles}
                                    />
                                    {editFormik.touched.team_leader && editFormik.errors.team_leader ? (
                                        <div className="invalid-feedback d-block">
                                            {editFormik.errors.team_leader}
                                        </div>
                                    ) : null}
                                </div>
                            </ModalBody>

                            <ModalFooter style={{ borderTop: "1px solid #eef2f7" }}>
                                <Button
                                    color="light"
                                    type="button"
                                    onClick={() => {
                                        setEditModal(false);
                                        setSelectedDepartmentId(null);
                                    }}
                                    style={{
                                        borderRadius: "10px",
                                        fontWeight: 600,
                                    }}
                                >
                                    Cancel
                                </Button>

                                <Button
                                    color="primary"
                                    type="submit"
                                    disabled={editSubmitting}
                                    style={{
                                        borderRadius: "10px",
                                        fontWeight: 600,
                                    }}
                                >
                                    {editSubmitting ? "Updating..." : "Update Department"}
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

export default AttendanceDepartment;