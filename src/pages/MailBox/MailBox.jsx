import React, { useEffect, useState } from "react";
import {
    Card,
    CardBody,
    Col,
    Container,
    Row,
    Label,
    Form,
    Input,
    FormFeedback,
    Button,
    Badge,
} from "reactstrap";
import * as Yup from "yup";
import { useFormik } from "formik";
import axios from "axios";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const MailBox = () => {
    const token = localStorage.getItem("token");

    const [users, setUsers] = useState([]);
    const [mails, setMails] = useState([]);
    const [selectedMail, setSelectedMail] = useState(null);
    const [mailType, setMailType] = useState("inbox");
    const [loading, setLoading] = useState(false);
    const [userSearch, setUserSearch] = useState("");
    const [selectedRecipientUsers, setSelectedRecipientUsers] = useState([]);

    document.title = "Internal Mail | Bepositive";

    const headers = {
        Authorization: `Bearer ${token}`,
    };

    const fetchUsers = async (searchValue = "") => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}get/staffs/`,
                {
                    headers,
                    params: {
                        search: searchValue,
                    },
                }
            );

            const data = response?.data?.results?.data || response?.data?.data || [];
            setUsers(data);
        } catch (error) {
            toast.error("Error fetching users");
        }
    };

    const fetchMails = async () => {
        try {
            setLoading(true);

            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}internal/mails/?type=${mailType}`,
                { headers }
            );

            const data = response?.data?.results?.data || response?.data?.data || [];
            setMails(data);
        } catch (error) {
            toast.error("Error fetching mails");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            fetchUsers(userSearch);
        }, 400);

        return () => clearTimeout(delayDebounce);
    }, [userSearch]);

    useEffect(() => {
        fetchMails();
        setSelectedMail(null);
    }, [mailType]);

    const formik = useFormik({
        initialValues: {
            recipients: [],
            subject: "",
            message: "",
            documents: [],
        },
        validationSchema: Yup.object({
            recipients: Yup.array()
                .min(1, "Select at least one user")
                .required("Select at least one user"),
            subject: Yup.string().required("Subject is required"),
            message: Yup.string(),
        }),
        onSubmit: async (values, { resetForm }) => {
            if (!values.message && values.documents.length === 0) {
                toast.error("Message or attachment is required");
                return;
            }

            const formData = new FormData();

            values.recipients.forEach((id) => {
                formData.append("recipients", id);
            });

            formData.append("subject", values.subject);
            formData.append("message", values.message || "");

            values.documents.forEach((file) => {
                formData.append("documents", file);
            });

            try {
                await axios.post(
                    `${import.meta.env.VITE_APP_KEY}internal/mails/`,
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "multipart/form-data",
                        },
                    }
                );

                toast.success("Mail sent successfully");
                resetForm();
                setSelectedRecipientUsers([]);
                setUserSearch("");
                setMailType("sent");
                fetchMails();
            } catch (error) {
                toast.error(error?.response?.data?.message || "Failed to send mail");
            }
        },
    });

    const handleRecipientChange = (e) => {
        const selected = Array.from(e.target.selectedOptions).map((option) =>
            Number(option.value)
        );

        formik.setFieldValue("recipients", selected);
    };

    const handleFiles = (e) => {
        const files = Array.from(e.target.files);
        const totalSize = files.reduce((sum, file) => sum + file.size, 0);

        if (totalSize > 1024 * 1024) {
            toast.error("Maximum 1 MB total attachments can be uploaded");
            e.target.value = "";
            formik.setFieldValue("documents", []);
            return;
        }

        formik.setFieldValue("documents", files);
    };

    const openMail = async (mailId) => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}internal/mails/${mailId}/`,
                { headers }
            );

            setSelectedMail(response?.data?.data);
        } catch (error) {
            toast.error("Failed to open mail");
        }
    };

    const deleteMail = async (mailId) => {
        if (!window.confirm("Delete this mail?")) return;

        try {
            await axios.delete(
                `${import.meta.env.VITE_APP_KEY}internal/mails/${mailId}/`,
                { headers }
            );

            toast.success("Mail deleted successfully");
            setSelectedMail(null);
            fetchMails();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to delete mail");
        }
    };

    const selectedUsers = selectedRecipientUsers;

    const filteredUsers = users.filter(
        (user) =>
            !formik.values.recipients.includes(Number(user.id)) &&
            user.name.toLowerCase().includes(userSearch.toLowerCase())
    );

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid={true}>
                    <Breadcrumbs title="Mail" breadcrumbItem="Internal Mail" />

                    <Row>
                        <Col lg={4}>
                            <Card className="border-0 shadow-sm" style={{ borderRadius: "16px" }}>
                                <CardBody className="p-4">
                                    <div className="d-flex align-items-center justify-content-between mb-3">
                                        <div>
                                            <h5 className="mb-1 fw-semibold">Compose Mail</h5>
                                            <small className="text-muted">Send internal messages with attachments</small>
                                        </div>
                                        <div
                                            className="bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center"
                                            style={{
                                                width: "42px",
                                                height: "42px",
                                                borderRadius: "12px",
                                                fontSize: "18px",
                                            }}
                                        >
                                            ✉
                                        </div>
                                    </div>

                                    <Form onSubmit={formik.handleSubmit}>
                                        <div className="mb-3 position-relative">
                                            <Label className="fw-medium mb-2">Recipients</Label>

                                            <Input
                                                type="text"
                                                placeholder="Search employee..."
                                                value={userSearch}
                                                onChange={(e) => setUserSearch(e.target.value)}
                                                style={{
                                                    height: "42px",
                                                    borderRadius: "10px",
                                                }}
                                            />

                                            {userSearch && filteredUsers.length > 0 && (
                                                <Card
                                                    className="shadow-sm border position-absolute w-100 mt-1"
                                                    style={{
                                                        zIndex: 999,
                                                        maxHeight: 220,
                                                        overflowY: "auto",
                                                        borderRadius: 10,
                                                    }}
                                                >
                                                    <CardBody className="p-0">
                                                        {filteredUsers.map((user) => (
                                                            <div
                                                                key={user.id}
                                                                onClick={() => {
                                                                    const userId = Number(user.id);

                                                                    formik.setFieldValue("recipients", [
                                                                        ...formik.values.recipients,
                                                                        userId,
                                                                    ]);

                                                                    setSelectedRecipientUsers((prev) => [
                                                                        ...prev,
                                                                        user,
                                                                    ]);

                                                                    setUserSearch("");
                                                                }}
                                                                style={{
                                                                    padding: "10px 15px",
                                                                    cursor: "pointer",
                                                                    borderBottom: "1px solid #f2f2f2",
                                                                }}
                                                                onMouseEnter={(e) =>
                                                                    (e.currentTarget.style.background = "#f8f9fa")
                                                                }
                                                                onMouseLeave={(e) =>
                                                                    (e.currentTarget.style.background = "#fff")
                                                                }
                                                            >
                                                                <div className="fw-semibold">
                                                                    {user.name}
                                                                </div>

                                                                <small className="text-muted">
                                                                    {user.department_name || user.department}
                                                                </small>
                                                            </div>
                                                        ))}
                                                    </CardBody>
                                                </Card>
                                            )}

                                            {selectedUsers.length > 0 && (
                                                <div className="d-flex flex-wrap gap-2 mt-3">
                                                    {selectedUsers.map((user) => (
                                                        <Badge
                                                            key={user.id}
                                                            color="primary"
                                                            pill
                                                            className="px-3 py-2 d-flex align-items-center"
                                                            style={{ fontSize: 13 }}
                                                        >
                                                            {user.name}

                                                            <span
                                                                onClick={() => {
                                                                    const userId = Number(user.id);

                                                                    formik.setFieldValue(
                                                                        "recipients",
                                                                        formik.values.recipients.filter(
                                                                            (id) => Number(id) !== userId
                                                                        )
                                                                    );

                                                                    setSelectedRecipientUsers((prev) =>
                                                                        prev.filter((item) => Number(item.id) !== userId)
                                                                    );
                                                                }}
                                                                style={{
                                                                    marginLeft: 8,
                                                                    cursor: "pointer",
                                                                    fontWeight: "bold",
                                                                }}
                                                            >
                                                                ×
                                                            </span>
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}

                                            <FormFeedback>
                                                {formik.errors.recipients}
                                            </FormFeedback>
                                        </div>

                                        <div className="mb-3">
                                            <Label className="fw-medium mb-2">Subject</Label>
                                            <Input
                                                type="text"
                                                name="subject"
                                                placeholder="Enter subject"
                                                value={formik.values.subject}
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                                invalid={formik.touched.subject && !!formik.errors.subject}
                                                style={{
                                                    height: "42px",
                                                    borderRadius: "10px",
                                                    fontSize: "13px",
                                                }}
                                            />
                                            <FormFeedback>{formik.errors.subject}</FormFeedback>
                                        </div>

                                        <div className="mb-3">
                                            <Label className="fw-medium mb-2">Message</Label>
                                            <Input
                                                type="textarea"
                                                name="message"
                                                placeholder="Write your message"
                                                value={formik.values.message}
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                                rows="5"
                                                style={{
                                                    borderRadius: "10px",
                                                    fontSize: "13px",
                                                    resize: "none",
                                                }}
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <Label className="fw-medium mb-2">Documents / Images / Files</Label>

                                            <div
                                                style={{
                                                    border: "1px dashed #cfd6e4",
                                                    borderRadius: "12px",
                                                    padding: "12px",
                                                    background: "#f8faff",
                                                }}
                                            >
                                                <Input
                                                    type="file"
                                                    multiple
                                                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                                                    onChange={handleFiles}
                                                    style={{
                                                        borderRadius: "8px",
                                                        fontSize: "13px",
                                                        background: "#fff",
                                                    }}
                                                />

                                                <small className="text-muted d-block mt-2">
                                                    Maximum total upload size: 1 MB.
                                                </small>
                                            </div>
                                        </div>

                                        <Button
                                            color="primary"
                                            type="submit"
                                            className="w-100 fw-semibold"
                                            style={{
                                                height: "44px",
                                                borderRadius: "10px",
                                                boxShadow: "0 6px 14px rgba(85, 110, 230, 0.25)",
                                            }}
                                        >
                                            Send Mail
                                        </Button>
                                    </Form>
                                </CardBody>
                            </Card>
                        </Col>

                        <Col lg={8}>
                            <Card>
                                <CardBody>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <div>
                                            <Button
                                                color={mailType === "inbox" ? "primary" : "light"}
                                                className="me-2"
                                                onClick={() => setMailType("inbox")}
                                            >
                                                Inbox
                                            </Button>

                                            <Button
                                                color={mailType === "sent" ? "primary" : "light"}
                                                onClick={() => setMailType("sent")}
                                            >
                                                Sent
                                            </Button>
                                        </div>

                                        <Button color="secondary" size="sm" onClick={fetchMails}>
                                            Refresh
                                        </Button>
                                    </div>

                                    <Row>
                                        <Col md={5}>
                                            <div style={{ maxHeight: "600px", overflowY: "auto" }}>
                                                {loading ? (
                                                    <p>Loading...</p>
                                                ) : mails.length === 0 ? (
                                                    <p className="text-muted">No mails found</p>
                                                ) : (
                                                    mails.map((mail) => (
                                                        <Card
                                                            key={mail.id}
                                                            className="mb-2"
                                                            style={{ cursor: "pointer" }}
                                                            onClick={() => openMail(mail.id)}
                                                        >
                                                            <CardBody className="p-3">
                                                                <h6 className="mb-1">{mail.subject}</h6>

                                                                <p className="mb-1 text-muted small">
                                                                    From: {mail.sender_name || "Unknown"}
                                                                </p>

                                                                <p className="mb-1 small">
                                                                    {mail.message
                                                                        ? mail.message.substring(0, 70)
                                                                        : "No message"}
                                                                </p>

                                                                {mail.attachments?.length > 0 && (
                                                                    <Badge color="info">
                                                                        {mail.attachments.length} Attachment
                                                                    </Badge>
                                                                )}

                                                                <div className="text-muted small mt-1">
                                                                    {new Date(mail.created_at).toLocaleString()}
                                                                </div>
                                                            </CardBody>
                                                        </Card>
                                                    ))
                                                )}
                                            </div>
                                        </Col>

                                        <Col md={7}>
                                            {selectedMail ? (
                                                <Card className="border">
                                                    <CardBody>
                                                        <div className="d-flex justify-content-between align-items-start">
                                                            <h5>{selectedMail.subject}</h5>

                                                            <Button
                                                                color="danger"
                                                                size="sm"
                                                                onClick={() => deleteMail(selectedMail.id)}
                                                            >
                                                                Delete
                                                            </Button>
                                                        </div>

                                                        <hr />

                                                        <p>
                                                            <strong>From:</strong>{" "}
                                                            {selectedMail.sender_name || "Unknown"}
                                                        </p>

                                                        <p>
                                                            <strong>To:</strong>{" "}
                                                            {selectedMail.recipients_data
                                                                ?.map((user) => user.name)
                                                                .join(", ")}
                                                        </p>

                                                        <p>
                                                            <strong>Date:</strong>{" "}
                                                            {new Date(
                                                                selectedMail.created_at
                                                            ).toLocaleString()}
                                                        </p>

                                                        <hr />

                                                        <p style={{ whiteSpace: "pre-wrap" }}>
                                                            {selectedMail.message || "No message"}
                                                        </p>

                                                        {selectedMail.attachments?.length > 0 && (
                                                            <>
                                                                <hr />
                                                                <h6>Attachments</h6>

                                                                {selectedMail.attachments.map((file) => (
                                                                    <a
                                                                        key={file.id}
                                                                        href={file.document_url}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="btn btn-light btn-sm me-2 mb-2"
                                                                    >
                                                                        View Attachment
                                                                    </a>
                                                                ))}
                                                            </>
                                                        )}
                                                    </CardBody>
                                                </Card>
                                            ) : (
                                                <div className="text-center text-muted mt-5">
                                                    Select a mail to view details
                                                </div>
                                            )}
                                        </Col>
                                    </Row>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>

                <ToastContainer position="top-right" autoClose={3000} />
            </div>
        </React.Fragment>
    );
};

export default MailBox;