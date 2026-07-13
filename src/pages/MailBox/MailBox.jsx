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

    const [allUsers, setAllUsers] = useState([]);
    const [loadingAllUsers, setLoadingAllUsers] = useState(false);
    const [allRecipientsSelected, setAllRecipientsSelected] = useState(false);

    // Reply/thread state
    const [mailThread, setMailThread] = useState([]);
    const [replyRecipients, setReplyRecipients] = useState([]);
    const [replyRecipientUsers, setReplyRecipientUsers] = useState([]);
    const [replyUserSearch, setReplyUserSearch] = useState("");
    const [replyMessage, setReplyMessage] = useState("");
    const [replyDocuments, setReplyDocuments] = useState([]);
    const [replySending, setReplySending] = useState(false);

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

    const getRecipientId = (user) => {
        // Supports different staff API response structures.
        return Number(
            user?.user_id ??
            user?.user?.id ??
            user?.id
        );
    };

    const isApprovedRecipient = (user) => {
        /*
         * When approval_status is returned, allow only approved users.
         * When the field is absent, keep the user because the API may already
         * return only approved staff.
         */
        if (user?.approval_status === undefined || user?.approval_status === null) {
            return true;
        }

        return String(user.approval_status).toLowerCase() === "approved";
    };

    const fetchAllUsers = async () => {
        try {
            setLoadingAllUsers(true);

            let page = 1;
            let hasNextPage = true;
            let completeUserList = [];

            while (hasNextPage) {
                const response = await axios.get(
                    `${import.meta.env.VITE_APP_KEY}get/staffs/`,
                    {
                        headers,
                        params: {
                            page,
                            approval_status: "approved",
                        },
                    }
                );

                const responseData = response?.data;

                const currentPageUsers =
                    responseData?.results?.data ||
                    responseData?.data ||
                    [];

                completeUserList = [
                    ...completeUserList,
                    ...currentPageUsers,
                ];

                const nextPageUrl =
                    responseData?.next ||
                    responseData?.results?.next ||
                    responseData?.links?.next ||
                    null;

                const totalCount =
                    responseData?.count ||
                    responseData?.results?.count ||
                    responseData?.total ||
                    responseData?.results?.total ||
                    null;

                if (nextPageUrl) {
                    page += 1;
                } else if (
                    totalCount !== null &&
                    completeUserList.length < Number(totalCount)
                ) {
                    page += 1;
                } else {
                    /*
                     * Stop when there is no confirmed next page.
                     *
                     * Do not use:
                     * currentPageUsers.length === 50
                     *
                     * because if the API ignores the page parameter, it may
                     * repeatedly return the same first 50 users.
                     */
                    hasNextPage = false;
                }
            }

            const validUsers = completeUserList.filter((user) => {
                const recipientId = getRecipientId(user);

                return (
                    Number.isInteger(recipientId) &&
                    recipientId > 0 &&
                    isApprovedRecipient(user)
                );
            });

            /*
             * Remove duplicates according to the actual User ID expected
             * by InternalMailView.
             */
            const uniqueUsers = Array.from(
                new Map(
                    validUsers.map((user) => [
                        getRecipientId(user),
                        user,
                    ])
                ).values()
            );

            setAllUsers(uniqueUsers);

            return uniqueUsers;
        } catch (error) {
            console.error("Error fetching all recipients:", error);

            toast.error(
                error?.response?.data?.message ||
                "Failed to fetch all recipients"
            );

            return [];
        } finally {
            setLoadingAllUsers(false);
        }
    };

    const handleSelectAllRecipients = async () => {
        try {
            let completeUserList = allUsers;

            if (completeUserList.length === 0) {
                completeUserList = await fetchAllUsers();
            }

            const recipientUsers = completeUserList.filter((user) => {
                const recipientId = getRecipientId(user);

                return (
                    Number.isInteger(recipientId) &&
                    recipientId > 0 &&
                    isApprovedRecipient(user)
                );
            });

            const uniqueRecipientUsers = Array.from(
                new Map(
                    recipientUsers.map((user) => [
                        getRecipientId(user),
                        user,
                    ])
                ).values()
            );

            const recipientIds = uniqueRecipientUsers.map((user) =>
                getRecipientId(user)
            );

            if (recipientIds.length === 0) {
                toast.error("No approved recipients found");
                return;
            }

            formik.setFieldValue("recipients", recipientIds);
            formik.setFieldTouched("recipients", true, false);

            setSelectedRecipientUsers(uniqueRecipientUsers);
            setAllRecipientsSelected(true);
            setUserSearch("");

            toast.success(
                `${recipientIds.length} approved recipients selected`
            );
        } catch (error) {
            console.error("Select all recipients error:", error);
            toast.error("Failed to select all recipients");
        }
    };

    const handleClearAllRecipients = () => {
        formik.setFieldValue("recipients", []);
        setSelectedRecipientUsers([]);
        setAllRecipientsSelected(false);
        setUserSearch("");
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
        setMailThread([]);
        resetReplyForm();
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
                setAllRecipientsSelected(false);
                setUserSearch("");

                formik.setFieldValue("recipients", []);
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

    const resetReplyForm = () => {
        setReplyRecipients([]);
        setReplyRecipientUsers([]);
        setReplyUserSearch("");
        setReplyMessage("");
        setReplyDocuments([]);
    };

    const prepareDefaultReplyRecipients = (mailData) => {
        if (!mailData) return;

        const currentUserId = Number(localStorage.getItem("user_id"));
        const defaultUsers = [];
        const seenIds = new Set();

        const addUser = (user) => {
            const id = Number(user?.id);

            if (
                Number.isInteger(id) &&
                id > 0 &&
                id !== currentUserId &&
                !seenIds.has(id)
            ) {
                seenIds.add(id);
                defaultUsers.push(user);
            }
        };

        // Reply to the original sender.
        if (mailData.sender) {
            addUser({
                id: Number(mailData.sender),
                name: mailData.sender_name || "Sender",
            });
        }

        // Also keep the other conversation participants available by default.
        (mailData.recipients_data || []).forEach(addUser);

        setReplyRecipientUsers(defaultUsers);
        setReplyRecipients(defaultUsers.map((user) => Number(user.id)));
    };

    const openMail = async (mailId) => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}internal/mails/${mailId}/`,
                { headers }
            );

            const mailData = response?.data?.data || null;
            const threadData = response?.data?.thread || (mailData ? [mailData] : []);

            setSelectedMail(mailData);
            setMailThread(threadData);
            resetReplyForm();
            prepareDefaultReplyRecipients(mailData);
        } catch (error) {
            toast.error(
                error?.response?.data?.message || "Failed to open mail"
            );
        }
    };

    const handleReplyFiles = (e) => {
        const files = Array.from(e.target.files || []);
        const totalSize = files.reduce((sum, file) => sum + file.size, 0);

        if (totalSize > 1024 * 1024) {
            toast.error("Maximum 1 MB total attachments can be uploaded");
            e.target.value = "";
            setReplyDocuments([]);
            return;
        }

        setReplyDocuments(files);
    };

    const sendReply = async () => {
        if (!selectedMail?.id) {
            toast.error("Select a mail first");
            return;
        }

        if (replyRecipients.length === 0) {
            toast.error("Select at least one reply recipient");
            return;
        }

        if (!replyMessage.trim() && replyDocuments.length === 0) {
            toast.error("Reply message or attachment is required");
            return;
        }

        const formData = new FormData();

        replyRecipients.forEach((id) => {
            formData.append("recipients", id);
        });

        formData.append("message", replyMessage.trim());

        replyDocuments.forEach((file) => {
            formData.append("documents", file);
        });

        try {
            setReplySending(true);

            await axios.post(
                `${import.meta.env.VITE_APP_KEY}internal/mails/${selectedMail.id}/reply/`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            toast.success("Reply sent successfully");
            setReplyMessage("");
            setReplyDocuments([]);

            // Reload both the thread and current mailbox list.
            await openMail(selectedMail.id);
            await fetchMails();
        } catch (error) {
            toast.error(
                error?.response?.data?.message || "Failed to send reply"
            );
        } finally {
            setReplySending(false);
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

    const filteredUsers = users.filter((user) => {
        const recipientId = getRecipientId(user);
        const userName = String(user?.name || "");

        return (
            Number.isInteger(recipientId) &&
            recipientId > 0 &&
            isApprovedRecipient(user) &&
            !formik.values.recipients.includes(recipientId) &&
            userName.toLowerCase().includes(userSearch.toLowerCase())
        );
    });

    const filteredReplyUsers = users.filter((user) => {
        const recipientId = getRecipientId(user);
        const userName = String(user?.name || "");

        return (
            Number.isInteger(recipientId) &&
            recipientId > 0 &&
            isApprovedRecipient(user) &&
            !replyRecipients.includes(recipientId) &&
            userName.toLowerCase().includes(replyUserSearch.toLowerCase())
        );
    });

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
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <Label className="fw-medium mb-0">
                                                    Recipients
                                                </Label>

                                                <div className="d-flex gap-2">
                                                    <Button
                                                        type="button"
                                                        color="primary"
                                                        size="sm"
                                                        outline
                                                        disabled={loadingAllUsers}
                                                        onClick={handleSelectAllRecipients}
                                                    >
                                                        {loadingAllUsers
                                                            ? "Loading..."
                                                            : "Select All"}
                                                    </Button>

                                                    {formik.values.recipients.length > 0 && (
                                                        <Button
                                                            type="button"
                                                            color="danger"
                                                            size="sm"
                                                            outline
                                                            onClick={handleClearAllRecipients}
                                                        >
                                                            Clear
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>

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
                                                                    const userId = getRecipientId(user);

                                                                    if (!Number.isInteger(userId) || userId <= 0) {
                                                                        toast.error("This employee does not have a valid user ID");
                                                                        return;
                                                                    }

                                                                    if (!isApprovedRecipient(user)) {
                                                                        toast.error("This employee is not approved");
                                                                        return;
                                                                    }

                                                                    if (formik.values.recipients.includes(userId)) {
                                                                        setUserSearch("");
                                                                        return;
                                                                    }

                                                                    formik.setFieldValue("recipients", [
                                                                        ...formik.values.recipients,
                                                                        userId,
                                                                    ]);

                                                                    setSelectedRecipientUsers((previousUsers) => [
                                                                        ...previousUsers,
                                                                        user,
                                                                    ]);

                                                                    setAllRecipientsSelected(false);
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
                                                                    const userId = getRecipientId(user);

                                                                    formik.setFieldValue(
                                                                        "recipients",
                                                                        formik.values.recipients.filter(
                                                                            (id) => Number(id) !== userId
                                                                        )
                                                                    );

                                                                    setSelectedRecipientUsers((prev) =>
                                                                        prev.filter((item) => Number(item.id) !== userId)
                                                                    );

                                                                    setAllRecipientsSelected(false);
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
                                                                <div className="d-flex align-items-center justify-content-between gap-2">
                                                                    <h6 className="mb-1 text-truncate">
                                                                        {mail.subject}
                                                                    </h6>

                                                                    {Number(mail.reply_count) > 0 && (
                                                                        <Badge
                                                                            color="primary"
                                                                            pill
                                                                            title={`${mail.reply_count} replies`}
                                                                            className="d-flex align-items-center gap-1"
                                                                        >
                                                                            ↩ {mail.reply_count}
                                                                        </Badge>
                                                                    )}
                                                                </div>

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
                                                <div>
                                                    <Card className="border mb-3">
                                                        <CardBody>
                                                            <div className="d-flex justify-content-between align-items-start">
                                                                <div>
                                                                    <h5 className="mb-1">
                                                                        {selectedMail.subject}
                                                                    </h5>
                                                                    <small className="text-muted">
                                                                        Conversation thread
                                                                    </small>
                                                                </div>

                                                                <Button
                                                                    color="danger"
                                                                    size="sm"
                                                                    onClick={() => deleteMail(selectedMail.id)}
                                                                >
                                                                    Delete
                                                                </Button>
                                                            </div>
                                                        </CardBody>
                                                    </Card>

                                                    <div
                                                        style={{
                                                            maxHeight: "430px",
                                                            overflowY: "auto",
                                                            paddingRight: "4px",
                                                        }}
                                                    >
                                                        {(mailThread.length > 0
                                                            ? mailThread
                                                            : [selectedMail]
                                                        ).map((threadMail) => (
                                                            <Card
                                                                key={threadMail.id}
                                                                className="border mb-3"
                                                            >
                                                                <CardBody>
                                                                    <div className="d-flex justify-content-between gap-3">
                                                                        <div>
                                                                            <div className="fw-semibold">
                                                                                {threadMail.sender_name || "Unknown"}
                                                                            </div>

                                                                            <small className="text-muted">
                                                                                To:{" "}
                                                                                {threadMail.recipients_data
                                                                                    ?.map((user) => user.name)
                                                                                    .join(", ") || "Unknown"}
                                                                            </small>
                                                                        </div>

                                                                        <small className="text-muted text-nowrap">
                                                                            {new Date(
                                                                                threadMail.created_at
                                                                            ).toLocaleString()}
                                                                        </small>
                                                                    </div>

                                                                    <hr />

                                                                    <p
                                                                        className="mb-2"
                                                                        style={{ whiteSpace: "pre-wrap" }}
                                                                    >
                                                                        {threadMail.message || "No message"}
                                                                    </p>

                                                                    {threadMail.attachments?.length > 0 && (
                                                                        <div className="mt-3">
                                                                            <h6 className="small fw-semibold">
                                                                                Attachments
                                                                            </h6>

                                                                            {threadMail.attachments.map((file) => (
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
                                                                        </div>
                                                                    )}
                                                                </CardBody>
                                                            </Card>
                                                        ))}
                                                    </div>

                                                    <Card className="border mt-3">
                                                        <CardBody>
                                                            <h6 className="fw-semibold mb-3">
                                                                Reply
                                                            </h6>

                                                            <div className="mb-3 position-relative">
                                                                <Label className="fw-medium">
                                                                    Reply recipients
                                                                </Label>

                                                                <Input
                                                                    type="text"
                                                                    placeholder="Search and add recipients..."
                                                                    value={replyUserSearch}
                                                                    onChange={(e) => {
                                                                        setReplyUserSearch(e.target.value);
                                                                        fetchUsers(e.target.value);
                                                                    }}
                                                                    style={{
                                                                        borderRadius: "10px",
                                                                        height: "40px",
                                                                    }}
                                                                />

                                                                {replyUserSearch &&
                                                                    filteredReplyUsers.length > 0 && (
                                                                        <Card
                                                                            className="shadow-sm border position-absolute w-100 mt-1"
                                                                            style={{
                                                                                zIndex: 1000,
                                                                                maxHeight: 180,
                                                                                overflowY: "auto",
                                                                                borderRadius: 10,
                                                                            }}
                                                                        >
                                                                            <CardBody className="p-0">
                                                                                {filteredReplyUsers.map((user) => {
                                                                                    const userId =
                                                                                        getRecipientId(user);

                                                                                    return (
                                                                                        <div
                                                                                            key={userId}
                                                                                            onClick={() => {
                                                                                                setReplyRecipients(
                                                                                                    (previous) => [
                                                                                                        ...previous,
                                                                                                        userId,
                                                                                                    ]
                                                                                                );

                                                                                                setReplyRecipientUsers(
                                                                                                    (previous) => [
                                                                                                        ...previous,
                                                                                                        {
                                                                                                            ...user,
                                                                                                            id: userId,
                                                                                                        },
                                                                                                    ]
                                                                                                );

                                                                                                setReplyUserSearch("");
                                                                                            }}
                                                                                            style={{
                                                                                                padding: "10px 14px",
                                                                                                cursor: "pointer",
                                                                                                borderBottom:
                                                                                                    "1px solid #f2f2f2",
                                                                                            }}
                                                                                        >
                                                                                            <div className="fw-semibold">
                                                                                                {user.name}
                                                                                            </div>
                                                                                            <small className="text-muted">
                                                                                                {user.department_name ||
                                                                                                    user.department}
                                                                                            </small>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </CardBody>
                                                                        </Card>
                                                                    )}

                                                                {replyRecipientUsers.length > 0 && (
                                                                    <div className="d-flex flex-wrap gap-2 mt-2">
                                                                        {replyRecipientUsers.map((user) => (
                                                                            <Badge
                                                                                key={Number(user.id)}
                                                                                color="primary"
                                                                                pill
                                                                                className="px-3 py-2"
                                                                            >
                                                                                {user.name}

                                                                                <span
                                                                                    onClick={() => {
                                                                                        const id = Number(user.id);

                                                                                        setReplyRecipients(
                                                                                            (previous) =>
                                                                                                previous.filter(
                                                                                                    (item) =>
                                                                                                        Number(item) !== id
                                                                                                )
                                                                                        );

                                                                                        setReplyRecipientUsers(
                                                                                            (previous) =>
                                                                                                previous.filter(
                                                                                                    (item) =>
                                                                                                        Number(item.id) !== id
                                                                                                )
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
                                                            </div>

                                                            <div className="mb-3">
                                                                <Label className="fw-medium">
                                                                    Message
                                                                </Label>

                                                                <Input
                                                                    type="textarea"
                                                                    rows="4"
                                                                    value={replyMessage}
                                                                    onChange={(e) =>
                                                                        setReplyMessage(e.target.value)
                                                                    }
                                                                    placeholder="Write your reply..."
                                                                    style={{
                                                                        borderRadius: "10px",
                                                                        resize: "none",
                                                                    }}
                                                                />
                                                            </div>

                                                            <div className="mb-3">
                                                                <Label className="fw-medium">
                                                                    Attachments
                                                                </Label>

                                                                <Input
                                                                    type="file"
                                                                    multiple
                                                                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                                                                    onChange={handleReplyFiles}
                                                                    style={{ borderRadius: "10px" }}
                                                                />

                                                                <small className="text-muted">
                                                                    Maximum total upload size: 1 MB.
                                                                </small>
                                                            </div>

                                                            <Button
                                                                color="primary"
                                                                onClick={sendReply}
                                                                disabled={replySending}
                                                                className="w-100"
                                                                style={{
                                                                    height: "42px",
                                                                    borderRadius: "10px",
                                                                }}
                                                            >
                                                                {replySending
                                                                    ? "Sending..."
                                                                    : "Send Reply"}
                                                            </Button>
                                                        </CardBody>
                                                    </Card>
                                                </div>
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