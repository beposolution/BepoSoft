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
    Button,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Form,
    Label,
    Input,
} from "reactstrap";
import { useFormik } from "formik";
import * as Yup from "yup";
// import Breadcrumbs from "../../components/Common/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ManagerLeaveApplications = () => {
    document.title = "Manager Leave Applications | Beposoft";

    const token = localStorage.getItem("token");
    const baseUrl = import.meta.env.VITE_APP_KEY;

    const [loading, setLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [leaveData, setLeaveData] = useState([]);
    const [editModal, setEditModal] = useState(false);
    const [selectedLeaveId, setSelectedLeaveId] = useState(null);
    const [editInitialValues, setEditInitialValues] = useState({
        approval_status: "pending",
        manager_note: "",
    });

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
        return value
            .replaceAll("_", " ")
            .replace(/\b\w/g, c => c.toUpperCase());
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
            const res = await axios.get(buildUrl("employee/leaves/manager/"), {
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

    const openEditModal = item => {
        setSelectedLeaveId(item.id);
        setEditInitialValues({
            approval_status: item.approval_status || "pending",
            manager_note: item.manager_note || "",
        });
        setEditModal(true);
    };

    const closeEditModal = () => {
        setEditModal(false);
        setSelectedLeaveId(null);
        setEditInitialValues({
            approval_status: "pending",
            manager_note: "",
        });
    };

    const editFormik = useFormik({
        enableReinitialize: true,
        initialValues: editInitialValues,
        validationSchema: Yup.object({
            approval_status: Yup.string()
                .oneOf(["pending", "approved", "rejected"])
                .required("Select approval status"),
            manager_note: Yup.string().nullable(),
        }),
        onSubmit: async values => {
            if (!selectedLeaveId) {
                toast.error("Leave id missing");
                return;
            }

            try {
                setSubmitLoading(true);

                const payload = {
                    approval_status: values.approval_status,
                    manager_note: values.manager_note,
                };

                const res = await axios.put(
                    buildUrl(`employee/leaves/edit/${selectedLeaveId}/`),
                    payload,
                    { headers: authHeaders }
                );

                if (res.status === 200 || res.status === 201) {
                    toast.success("Leave application updated successfully");
                    closeEditModal();
                    await fetchLeaveApplications();
                }
            } catch (error) {
                toast.error(
                    error?.response?.data?.message || "Failed to update leave application"
                );
            } finally {
                setSubmitLoading(false);
            }
        },
    });

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
                    {/* <Breadcrumbs
                        title="Leave Management"
                        breadcrumbItem="Manager Leave Applications"
                    /> */}

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
                                        <i className="bx bx-calendar"></i>
                                    </div>

                                    <div>
                                        <h4 className="mb-1 text-white fw-bold">
                                            Manager Leave Applications
                                        </h4>
                                        <p
                                            className="mb-0"
                                            style={{ color: "rgba(255,255,255,0.72)" }}
                                        >
                                            Review, approve, or reject employee leave requests.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Row className="mb-4">
                        <Col md={6} xl={3} className="mb-3">
                            <Card
                                className="border-0 h-100"
                                style={{
                                    borderRadius: "18px",
                                    boxShadow: "0 8px 25px rgba(15, 23, 42, 0.06)",
                                }}
                            >
                                <CardBody>
                                    <p className="text-muted mb-1">Total Applications</p>
                                    <h3 className="fw-bold mb-0">{totalCount}</h3>
                                </CardBody>
                            </Card>
                        </Col>

                        <Col md={6} xl={3} className="mb-3">
                            <Card
                                className="border-0 h-100"
                                style={{
                                    borderRadius: "18px",
                                    boxShadow: "0 8px 25px rgba(15, 23, 42, 0.06)",
                                }}
                            >
                                <CardBody>
                                    <p className="text-muted mb-1">Pending</p>
                                    <h3 className="fw-bold text-warning mb-0">{pendingCount}</h3>
                                </CardBody>
                            </Card>
                        </Col>

                        <Col md={6} xl={3} className="mb-3">
                            <Card
                                className="border-0 h-100"
                                style={{
                                    borderRadius: "18px",
                                    boxShadow: "0 8px 25px rgba(15, 23, 42, 0.06)",
                                }}
                            >
                                <CardBody>
                                    <p className="text-muted mb-1">Approved</p>
                                    <h3 className="fw-bold text-success mb-0">{approvedCount}</h3>
                                </CardBody>
                            </Card>
                        </Col>

                        <Col md={6} xl={3} className="mb-3">
                            <Card
                                className="border-0 h-100"
                                style={{
                                    borderRadius: "18px",
                                    boxShadow: "0 8px 25px rgba(15, 23, 42, 0.06)",
                                }}
                            >
                                <CardBody>
                                    <p className="text-muted mb-1">Rejected</p>
                                    <h3 className="fw-bold text-danger mb-0">{rejectedCount}</h3>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    <Card
                        className="border-0"
                        style={{
                            borderRadius: "20px",
                            boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
                            overflow: "hidden",
                        }}
                    >
                        <div
                            style={{
                                padding: "20px 24px",
                                borderBottom: "1px solid #eef2f7",
                                background: "#fff",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                flexWrap: "wrap",
                                gap: "10px",
                            }}
                        >
                            <div>
                                <h5 className="fw-bold mb-0">Leave Applications</h5>
                                <small className="text-muted">
                                    Showing {leaveData.length} records
                                </small>
                            </div>
                        </div>

                        <CardBody className="p-0">
                            <div className="table-responsive">
                                <Table className="align-middle mb-0">
                                    <thead>
                                        <tr style={{ background: "#f8fafc" }}>
                                            <th style={{ padding: "15px 18px" }}>#</th>
                                            <th style={{ padding: "15px 18px", minWidth: "180px" }}>
                                                Employee
                                            </th>
                                            <th style={{ padding: "15px 18px" }}>Leave Type</th>
                                            <th style={{ padding: "15px 18px" }}>Days</th>
                                            <th style={{ padding: "15px 18px" }}>Start Date</th>
                                            <th style={{ padding: "15px 18px" }}>End Date</th>
                                            <th style={{ padding: "15px 18px", minWidth: "240px" }}>
                                                Reason
                                            </th>
                                            <th style={{ padding: "15px 18px" }}>Status</th>
                                            <th style={{ padding: "15px 18px", minWidth: "140px" }}>
                                                Manager Note
                                            </th>
                                            <th style={{ padding: "15px 18px" }}>Applied On</th>
                                            <th style={{ padding: "15px 18px" }}>Action</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {leaveData.length > 0 ? (
                                            leaveData.map((item, index) => (
                                                <tr key={item.id}>
                                                    <td style={{ padding: "16px 18px" }}>{index + 1}</td>

                                                    <td style={{ padding: "16px 18px" }}>
                                                        <div className="fw-bold">{item.employee_name}</div>

                                                    </td>

                                                    <td style={{ padding: "16px 18px" }}>
                                                        {formatLeaveType(item.leave_type)}
                                                    </td>

                                                    <td style={{ padding: "16px 18px" }}>
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
                                                            maxWidth: "180px",
                                                            whiteSpace: "normal",
                                                            wordBreak: "break-word",
                                                        }}
                                                    >
                                                        {item.manager_note || "-"}
                                                    </td>

                                                    <td style={{ padding: "16px 18px" }}>
                                                        {formatDate(item.created_at)}
                                                    </td>

                                                    <td style={{ padding: "16px 18px" }}>
                                                        <Button
                                                            color="warning"
                                                            size="sm"
                                                            onClick={() => openEditModal(item)}
                                                            style={{
                                                                borderRadius: "10px",
                                                                padding: "7px 14px",
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            <i className="bx bx-edit me-1"></i>
                                                            Edit
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan="11"
                                                    className="text-center py-5 text-muted"
                                                >
                                                    No Leave Applications Found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        </CardBody>
                    </Card>

                    <Modal isOpen={editModal} toggle={closeEditModal} centered>
                        <ModalHeader toggle={closeEditModal}>
                            Update Leave Application
                        </ModalHeader>

                        <Form onSubmit={editFormik.handleSubmit}>
                            <ModalBody>
                                <div className="mb-3">
                                    <Label className="form-label">Approval Status</Label>
                                    <Input
                                        type="select"
                                        name="approval_status"
                                        value={editFormik.values.approval_status}
                                        onChange={editFormik.handleChange}
                                        onBlur={editFormik.handleBlur}
                                        invalid={
                                            editFormik.touched.approval_status &&
                                            !!editFormik.errors.approval_status
                                        }
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Rejected</option>
                                    </Input>
                                    {editFormik.touched.approval_status &&
                                        editFormik.errors.approval_status ? (
                                        <div className="text-danger mt-1">
                                            {editFormik.errors.approval_status}
                                        </div>
                                    ) : null}
                                </div>

                                <div className="mb-3">
                                    <Label className="form-label">Manager Note</Label>
                                    <Input
                                        type="textarea"
                                        rows="4"
                                        name="manager_note"
                                        value={editFormik.values.manager_note}
                                        onChange={editFormik.handleChange}
                                        onBlur={editFormik.handleBlur}
                                        placeholder="Add a note for the employee..."
                                    />
                                </div>


                            </ModalBody>

                            <ModalFooter>
                                <Button color="secondary" type="button" onClick={closeEditModal}>
                                    Cancel
                                </Button>
                                <Button color="primary" type="submit" disabled={submitLoading}>
                                    {submitLoading ? "Updating..." : "Update"}
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

export default ManagerLeaveApplications;