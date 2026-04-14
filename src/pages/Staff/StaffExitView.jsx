import axios from "axios";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Card,
    Col,
    Container,
    Row,
    CardBody,
    CardTitle,
    Button,
    Badge,
    Spinner,
    Input,
    Label,
    Form,
    FormGroup,
} from "reactstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { useNavigate, useParams } from "react-router-dom";
import Select from "react-select";

const searchableSelectStyles = {
    container: (provided) => ({
        ...provided,
        width: "100%",
    }),
    control: (provided, state) => ({
        ...provided,
        minHeight: "38px",
        borderRadius: "0.375rem",
        borderColor: state.isFocused ? "#556ee6" : "#ced4da",
        boxShadow: state.isFocused
            ? "0 0 0 0.1rem rgba(85, 110, 230, 0.15)"
            : "none",
        "&:hover": {
            borderColor: state.isFocused ? "#556ee6" : "#b8c1ce",
        },
    }),
    valueContainer: (provided) => ({
        ...provided,
        padding: "2px 8px",
    }),
    input: (provided) => ({
        ...provided,
        margin: 0,
        padding: 0,
    }),
    placeholder: (provided) => ({
        ...provided,
        color: "#6c757d",
    }),
    singleValue: (provided) => ({
        ...provided,
        color: "#212529",
    }),
    menuPortal: (provided) => ({
        ...provided,
        zIndex: 99999,
    }),
    menu: (provided) => ({
        ...provided,
        zIndex: 99999,
        borderRadius: "10px",
        overflow: "hidden",
    }),
    menuList: (provided) => ({
        ...provided,
        maxHeight: "220px",
    }),
};

const SectionCard = ({ title, children, icon }) => (
    <Card
        className="h-100 border-0"
        style={{
            borderRadius: "16px",
            boxShadow: "0 4px 20px rgba(18, 38, 63, 0.08)",
            overflow: "visible",
        }}
    >
        <CardBody style={{ overflow: "visible" }}>
            <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                    <h5 className="mb-1 fw-bold">{title}</h5>
                </div>
                {icon ? (
                    <div
                        style={{
                            width: "42px",
                            height: "42px",
                            borderRadius: "12px",
                            background: "#f5f7ff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "18px",
                        }}
                    >
                        {icon}
                    </div>
                ) : null}
            </div>
            {children}
        </CardBody>
    </Card>
);

const DetailItem = ({ label, value, fullWidth = false }) => (
    <Col md={fullWidth ? 12 : 6} className="mb-3">
        <div
            className="p-3 h-100"
            style={{
                border: "1px solid #eef1f7",
                borderRadius: "12px",
                background: "#fbfcfe",
            }}
        >
            <div
                className="text-muted mb-1"
                style={{ fontSize: "12px", fontWeight: 600 }}
            >
                {label}
            </div>
            <div
                className="fw-semibold text-dark"
                style={{
                    fontSize: "15px",
                    wordBreak: "break-word",
                    lineHeight: "1.5",
                }}
            >
                {value}
            </div>
        </div>
    </Col>
);

const ClearanceCard = ({
    title,
    cleared,
    by,
    date,
    note,
    signature,
    getYesNoBadge,
    getValue,
    formatDate,
    renderSignatureImage,
}) => (
    <Col xl={6} lg={6} md={12} className="mb-4">
        <div
            className="h-100 p-3"
            style={{
                border: "1px solid #eef1f7",
                borderRadius: "14px",
                background: "#ffffff",
                boxShadow: "0 2px 10px rgba(18, 38, 63, 0.04)",
            }}
        >
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <h6 className="mb-0 fw-bold">{title}</h6>
                {getYesNoBadge(cleared)}
            </div>

            <Row>
                <DetailItem label="Cleared By" value={getValue(by)} />
                <DetailItem label="Clearance Date" value={formatDate(date)} />
                <DetailItem
                    label="Note"
                    value={getValue(note)}
                    fullWidth={true}
                />
                <DetailItem
                    label="Signature"
                    value={renderSignatureImage(signature, `${title} Signature`)}
                    fullWidth={true}
                />
            </Row>
        </div>
    </Col>
);

const StaffExitView = () => {
    document.title = "Staff Exit View | Beposoft";

    const { id } = useParams();
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [details, setDetails] = useState({});
    const [staffs, setStaffs] = useState([]);
    const [staffLoading, setStaffLoading] = useState(false);

    const [formData, setFormData] = useState({
        exit_date: "",
        reason_type: "resignation",
        exit_reason_note: "",
        asset_responsibility: "",
        handover_to: "",
        handover_date: "",
        logistics_clearance: false,
        logistics_clearance_date: "",
        logistics_clearance_by: "",
        logistics_clearance_note: "",
        finance_clearance: false,
        finance_clearance_date: "",
        finance_clearance_by: "",
        finance_clearance_note: "",
        hr_clearance: false,
        hr_clearance_date: "",
        hr_clearance_by: "",
        hr_clearance_note: "",
        sales_clearance: false,
        sales_clearance_date: "",
        sales_clearance_by: "",
        sales_clearance_note: "",
        it_clearance: false,
        it_clearance_date: "",
        it_clearance_by: "",
        it_clearance_note: "",
        exit_form_date: "",
        logistics_clearance_signature: null,
        finance_clearance_signature: null,
        hr_clearance_signature: null,
        sales_clearance_signature: null,
        it_clearance_signature: null,
        employee_signature: null,
    });

    const imageBaseUrl = import.meta.env.VITE_APP_IMAGE || "";

    const getMediaUrl = (filePath) => {
        if (!filePath) return "";
        if (
            filePath.startsWith("http://") ||
            filePath.startsWith("https://")
        ) {
            return filePath;
        }

        const cleanedBase = imageBaseUrl.endsWith("/")
            ? imageBaseUrl
            : `${imageBaseUrl}/`;

        const cleanedPath = filePath.startsWith("/")
            ? filePath.slice(1)
            : filePath;

        return `${cleanedBase}${cleanedPath}`;
    };

    const getLogisticsSignature = (data) => {
        return (
            data?.logistics_clearance_signature ||
            data?.logistics_clearence_signature ||
            ""
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString("en-GB");
    };

    const formatInputDate = (dateString) => {
        if (!dateString) return "";
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return dateString;
            }
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
        } catch (e) {
            return "";
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toLocaleString("en-GB");
    };

    const formatReasonType = (value) => {
        if (!value) return "-";
        return value
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    const getValue = (value) => {
        if (value === null || value === undefined || value === "") return "-";
        return value;
    };

    const getBadgeColor = (value) => {
        return value ? "success" : "danger";
    };

    const getYesNoBadge = (value) => {
        return (
            <Badge
                color={getBadgeColor(value)}
                pill
                className="px-3 py-2 fs-6"
            >
                {value ? "Yes" : "No"}
            </Badge>
        );
    };

    const renderSignatureImage = (filePath, label = "Signature") => {
        if (!filePath) {
            return <span className="text-muted">-</span>;
        }

        const imageUrl = getMediaUrl(filePath);

        return (
            <div className="d-flex flex-column gap-2">
                <div
                    style={{
                        width: "100%",
                        minHeight: "160px",
                        border: "1px solid #eef1f7",
                        borderRadius: "12px",
                        background: "#fff",
                        padding: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                    }}
                >
                    <img
                        src={imageUrl}
                        alt={label}
                        style={{
                            maxWidth: "100%",
                            maxHeight: "140px",
                            objectFit: "contain",
                            display: "block",
                        }}
                        onError={(e) => {
                            e.currentTarget.style.display = "none";
                        }}
                    />
                </div>

                <a
                    href={imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-soft-primary btn-sm align-self-start"
                    style={{
                        border: "1px solid #dbe4ff",
                        background: "#f8fbff",
                        color: "#556ee6",
                        fontWeight: 500,
                    }}
                >
                    Open Image
                </a>
            </div>
        );
    };

    const getStaffId = (staff) => {
        if (!staff) return "";
        const id =
            staff.id ??
            staff.staff_id ??
            staff.user_id ??
            staff.employee_id ??
            staff.employee ??
            "";

        return id !== null && id !== undefined ? String(id).trim() : "";
    };

    const getStaffLabel = (staff) => {
        if (!staff) return "";

        return (
            staff.name ||
            staff.username ||
            staff.full_name ||
            staff.employee_name ||
            `${staff.first_name || ""} ${staff.last_name || ""}`.trim() ||
            `Staff ${getStaffId(staff)}` ||
            "Unnamed"
        );
    };

    const setFormFromDetails = (data) => {
        setFormData({
            exit_date: formatInputDate(data?.exit_date),
            reason_type: data?.reason_type || "resignation",
            exit_reason_note: data?.exit_reason_note || "",
            asset_responsibility: data?.asset_responsibility || "",
            handover_to:
                data?.handover_to !== null && data?.handover_to !== undefined
                    ? String(data.handover_to).trim()
                    : "",
            handover_date: formatInputDate(data?.handover_date),

            logistics_clearance: !!data?.logistics_clearance,
            logistics_clearance_date: formatInputDate(
                data?.logistics_clearance_date
            ),
            logistics_clearance_by:
                data?.logistics_clearance_by !== null &&
                data?.logistics_clearance_by !== undefined
                    ? String(data.logistics_clearance_by).trim()
                    : "",
            logistics_clearance_note: data?.logistics_clearance_note || "",

            finance_clearance: !!data?.finance_clearance,
            finance_clearance_date: formatInputDate(
                data?.finance_clearance_date
            ),
            finance_clearance_by:
                data?.finance_clearance_by !== null &&
                data?.finance_clearance_by !== undefined
                    ? String(data.finance_clearance_by).trim()
                    : "",
            finance_clearance_note: data?.finance_clearance_note || "",

            hr_clearance: !!data?.hr_clearance,
            hr_clearance_date: formatInputDate(data?.hr_clearance_date),
            hr_clearance_by:
                data?.hr_clearance_by !== null &&
                data?.hr_clearance_by !== undefined
                    ? String(data.hr_clearance_by).trim()
                    : "",
            hr_clearance_note: data?.hr_clearance_note || "",

            sales_clearance: !!data?.sales_clearance,
            sales_clearance_date: formatInputDate(data?.sales_clearance_date),
            sales_clearance_by:
                data?.sales_clearance_by !== null &&
                data?.sales_clearance_by !== undefined
                    ? String(data.sales_clearance_by).trim()
                    : "",
            sales_clearance_note: data?.sales_clearance_note || "",

            it_clearance: !!data?.it_clearance,
            it_clearance_date: formatInputDate(data?.it_clearance_date),
            it_clearance_by:
                data?.it_clearance_by !== null &&
                data?.it_clearance_by !== undefined
                    ? String(data.it_clearance_by).trim()
                    : "",
            it_clearance_note: data?.it_clearance_note || "",

            exit_form_date: formatInputDate(data?.exit_form_date),

            logistics_clearance_signature: null,
            finance_clearance_signature: null,
            hr_clearance_signature: null,
            sales_clearance_signature: null,
            it_clearance_signature: null,
            employee_signature: null,
        });
    };

    const fetchStaffs = useCallback(async () => {
        try {
            setStaffLoading(true);

            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}staffs/`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const responseData = response?.data || {};
            let finalData = [];

            if (Array.isArray(responseData)) {
                finalData = responseData;
            } else if (Array.isArray(responseData.data)) {
                finalData = responseData.data;
            } else if (Array.isArray(responseData.results)) {
                finalData = responseData.results;
            } else if (Array.isArray(responseData.results?.data)) {
                finalData = responseData.results.data;
            }

            setStaffs(finalData);
        } catch (error) {
            console.error("Error fetching staffs:", error);
            toast.error(
                error?.response?.data?.message ||
                    error?.response?.data?.detail ||
                    "Error fetching staff list"
            );
            setStaffs([]);
        } finally {
            setStaffLoading(false);
        }
    }, [token]);

    const fetchExitDetails = useCallback(async () => {
        try {
            setLoading(true);

            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}employee/exit/edit/${id}/`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            console.log("Exit details response:", response);

            if (response.status === 200) {
                const responseData = response?.data || {};
                const finalData =
                    responseData?.data ||
                    responseData?.results ||
                    responseData ||
                    {};

                setDetails(finalData);
                setFormFromDetails(finalData);
            } else {
                toast.error("Failed to fetch exit details");
            }
        } catch (error) {
            console.error("Error fetching exit details:", error);
            toast.error(
                error?.response?.data?.message ||
                    error?.response?.data?.detail ||
                    "Error fetching exit details"
            );
        } finally {
            setLoading(false);
        }
    }, [id, token]);

    useEffect(() => {
        if (token && id) {
            fetchExitDetails();
            fetchStaffs();
        } else {
            toast.error("Token or ID not found");
            setLoading(false);
        }
    }, [token, id, fetchExitDetails, fetchStaffs]);

    const clearanceCount = useMemo(() => {
        const clearances = [
            details.hr_clearance,
            details.finance_clearance,
            details.it_clearance,
            details.sales_clearance,
            details.logistics_clearance,
        ];

        const completed = clearances.filter(Boolean).length;
        return {
            completed,
            total: clearances.length,
        };
    }, [details]);

    const handleChange = useCallback((e) => {
        const { name, value, type, checked, files } = e.target;

        if (type === "checkbox") {
            setFormData((prev) => ({
                ...prev,
                [name]: checked,
            }));
            return;
        }

        if (type === "file") {
            setFormData((prev) => ({
                ...prev,
                [name]: files && files[0] ? files[0] : null,
            }));
            return;
        }

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    }, []);

    const handleCancelEdit = useCallback(() => {
        setEditMode(false);
        setFormFromDetails(details);
    }, [details]);

    const handleUpdate = async (e) => {
        e.preventDefault();

        try {
            setUpdating(true);

            const payload = new FormData();

            Object.keys(formData).forEach((key) => {
                const value = formData[key];

                if (key === "logistics_clearance_signature") {
                    return;
                }

                if (typeof value === "boolean") {
                    payload.append(key, value ? "true" : "false");
                } else if (value !== null && value !== undefined && value !== "") {
                    payload.append(key, value);
                }
            });

            if (formData.logistics_clearance_signature) {
                payload.append(
                    "logistics_clearence_signature",
                    formData.logistics_clearance_signature
                );
            }

            const response = await axios.put(
                `${import.meta.env.VITE_APP_KEY}employee/exit/edit/${id}/`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            if (response.status === 200) {
                toast.success(
                    response?.data?.message || "Employee exit updated successfully"
                );
                setEditMode(false);
                await fetchExitDetails();
            } else {
                toast.error("Failed to update employee exit");
            }
        } catch (error) {
            console.error("Error updating employee exit:", error);
            toast.error(
                error?.response?.data?.message ||
                    error?.response?.data?.detail ||
                    JSON.stringify(error?.response?.data?.errors) ||
                    "Error updating employee exit"
            );
        } finally {
            setUpdating(false);
        }
    };

    const handleDelete = async () => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this employee exit record?"
        );

        if (!confirmDelete) {
            return;
        }

        try {
            setDeleting(true);

            const response = await axios.delete(
                `${import.meta.env.VITE_APP_KEY}employee/exit/edit/${id}/`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.status === 200 || response.status === 204) {
                toast.success(
                    response?.data?.message || "Employee exit deleted successfully"
                );

                setTimeout(() => {
                    navigate(-1);
                }, 1000);
            } else {
                toast.error("Failed to delete employee exit");
            }
        } catch (error) {
            console.error("Error deleting employee exit:", error);
            toast.error(
                error?.response?.data?.message ||
                    error?.response?.data?.detail ||
                    "Error deleting employee exit"
            );
        } finally {
            setDeleting(false);
        }
    };

    const staffOptions = useMemo(() => {
        return (staffs || [])
            .map((staff) => {
                const id = getStaffId(staff);
                const label = getStaffLabel(staff);

                if (!id) return null;

                return {
                    value: id,
                    label,
                    raw: staff,
                };
            })
            .filter(Boolean);
    }, [staffs]);

    const getSelectedStaffOption = useCallback(
        (value) => {
            if (value === null || value === undefined || value === "") return null;

            const normalizedValue = String(value).trim();

            return (
                staffOptions.find(
                    (option) => String(option.value).trim() === normalizedValue
                ) || null
            );
        },
        [staffOptions]
    );

    const commonSelectProps = useMemo(
        () => ({
            isClearable: true,
            isSearchable: true,
            isLoading: staffLoading,
            styles: searchableSelectStyles,
            menuPortalTarget:
                typeof document !== "undefined" ? document.body : null,
            classNamePrefix: "react-select",
            noOptionsMessage: () =>
                staffLoading ? "Loading staffs..." : "No staff found",
        }),
        [staffLoading]
    );

    const handleStaffSelectChange = useCallback((fieldName, selectedOption) => {
        setFormData((prev) => ({
            ...prev,
            [fieldName]: selectedOption?.value
                ? String(selectedOption.value).trim()
                : "",
        }));
    }, []);

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid={true}>
                    <Breadcrumbs title="HR" breadcrumbItem="Staff Exit View" />

                    <Row>
                        <Col xl={12}>
                            <Card
                                className="border-0 mb-4"
                                style={{
                                    borderRadius: "18px",
                                    background:
                                        "linear-gradient(135deg, #2a3042 0%, #2a3042 100%)",
                                    boxShadow: "0 10px 30px rgba(85, 110, 230, 0.25)",
                                    overflow: "visible",
                                }}
                            >
                                <CardBody className="text-white p-4">
                                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                                        <div>
                                            <div
                                                className="text-white-50 mb-1"
                                                style={{ fontSize: "13px" }}
                                            >
                                                Staff Exit Management
                                            </div>
                                            <h3 className="mb-1 text-white fw-bold">
                                                Staff Exit Details
                                            </h3>
                                            <div className="text-white-50">
                                                View and update complete employee exit
                                                form, clearance status, signatures and
                                                audit details
                                            </div>
                                        </div>

                                        <div className="d-flex gap-2 flex-wrap">
                                            <Button
                                                color="light"
                                                className="fw-semibold"
                                                onClick={() => navigate(-1)}
                                                disabled={updating || deleting}
                                            >
                                                Back
                                            </Button>

                                            <Button
                                                color="info"
                                                className="fw-semibold text-white"
                                                onClick={() => {
                                                    fetchExitDetails();
                                                    fetchStaffs();
                                                }}
                                                disabled={updating || deleting}
                                            >
                                                Refresh
                                            </Button>

                                            {!editMode ? (
                                                <>
                                                    <Button
                                                        color="warning"
                                                        className="fw-semibold text-white"
                                                        onClick={() => setEditMode(true)}
                                                        disabled={deleting}
                                                    >
                                                        Edit
                                                    </Button>

                                                    <Button
                                                        color="danger"
                                                        className="fw-semibold"
                                                        onClick={handleDelete}
                                                        disabled={deleting || updating}
                                                    >
                                                        {deleting ? "Deleting..." : "Delete"}
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    <Button
                                                        color="secondary"
                                                        className="fw-semibold"
                                                        onClick={handleCancelEdit}
                                                        disabled={updating || deleting}
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        color="success"
                                                        className="fw-semibold"
                                                        onClick={handleUpdate}
                                                        disabled={updating || deleting}
                                                    >
                                                        {updating ? "Updating..." : "Save Update"}
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    {loading ? (
                        <Row>
                            <Col xl={12}>
                                <Card
                                    className="border-0"
                                    style={{
                                        borderRadius: "16px",
                                        boxShadow: "0 4px 20px rgba(18, 38, 63, 0.08)",
                                    }}
                                >
                                    <CardBody
                                        className="d-flex flex-column justify-content-center align-items-center"
                                        style={{ minHeight: "300px" }}
                                    >
                                        <Spinner
                                            color="primary"
                                            style={{ width: "3rem", height: "3rem" }}
                                        />
                                        <h5 className="mt-3 mb-1">
                                            Loading exit details...
                                        </h5>
                                        <p className="text-muted mb-0">
                                            Please wait while we fetch the data
                                        </p>
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>
                    ) : (
                        <>
                            <Row className="mb-4">
                                <Col xl={3} md={6} className="mb-3">
                                    <Card
                                        className="border-0 h-100"
                                        style={{
                                            borderRadius: "16px",
                                            boxShadow: "0 4px 20px rgba(18, 38, 63, 0.08)",
                                        }}
                                    >
                                        <CardBody>
                                            <div className="text-muted mb-1">
                                                Employee Name
                                            </div>
                                            <h5 className="mb-0 fw-bold">
                                                {getValue(details.employee_name)}
                                            </h5>
                                        </CardBody>
                                    </Card>
                                </Col>

                                <Col xl={3} md={6} className="mb-3">
                                    <Card
                                        className="border-0 h-100"
                                        style={{
                                            borderRadius: "16px",
                                            boxShadow: "0 4px 20px rgba(18, 38, 63, 0.08)",
                                        }}
                                    >
                                        <CardBody>
                                            <div className="text-muted mb-1">
                                                Employee ID
                                            </div>
                                            <h5 className="mb-0 fw-bold">
                                                {getValue(
                                                    details.employee_id ??
                                                        details.employee ??
                                                        "-"
                                                )}
                                            </h5>
                                        </CardBody>
                                    </Card>
                                </Col>

                                <Col xl={3} md={6} className="mb-3">
                                    <Card
                                        className="border-0 h-100"
                                        style={{
                                            borderRadius: "16px",
                                            boxShadow: "0 4px 20px rgba(18, 38, 63, 0.08)",
                                        }}
                                    >
                                        <CardBody>
                                            <div className="text-muted mb-1">
                                                Exit Date
                                            </div>
                                            <h5 className="mb-0 fw-bold">
                                                {formatDate(details.exit_date)}
                                            </h5>
                                        </CardBody>
                                    </Card>
                                </Col>

                                <Col xl={3} md={6} className="mb-3">
                                    <Card
                                        className="border-0 h-100"
                                        style={{
                                            borderRadius: "16px",
                                            boxShadow: "0 4px 20px rgba(18, 38, 63, 0.08)",
                                        }}
                                    >
                                        <CardBody>
                                            <div className="text-muted mb-1">
                                                Clearance Progress
                                            </div>
                                            <h5 className="mb-0 fw-bold">
                                                {clearanceCount.completed}/
                                                {clearanceCount.total}
                                            </h5>
                                        </CardBody>
                                    </Card>
                                </Col>
                            </Row>

                            {editMode ? (
                                <Form onSubmit={handleUpdate}>
                                    <Row className="mb-4">
                                        <Col xl={6} className="mb-4">
                                            <SectionCard
                                                title="Employee Information"
                                                icon="👤"
                                            >
                                                <Row>
                                                    <Col md={6} className="mb-3">
                                                        <FormGroup>
                                                            <Label>Employee Name</Label>
                                                            <Input
                                                                type="text"
                                                                value={details.employee_name || ""}
                                                                disabled
                                                            />
                                                        </FormGroup>
                                                    </Col>

                                                    <Col md={6} className="mb-3">
                                                        <FormGroup>
                                                            <Label>Employee ID</Label>
                                                            <Input
                                                                type="text"
                                                                value={
                                                                    details.employee_id ||
                                                                    details.employee ||
                                                                    ""
                                                                }
                                                                disabled
                                                            />
                                                        </FormGroup>
                                                    </Col>

                                                    <Col md={6} className="mb-3">
                                                        <FormGroup>
                                                            <Label>Department</Label>
                                                            <Input
                                                                type="text"
                                                                value={
                                                                    details.employee_department || ""
                                                                }
                                                                disabled
                                                            />
                                                        </FormGroup>
                                                    </Col>

                                                    <Col md={6} className="mb-3">
                                                        <FormGroup>
                                                            <Label>Designation</Label>
                                                            <Input
                                                                type="text"
                                                                value={
                                                                    details.employee_designation || ""
                                                                }
                                                                disabled
                                                            />
                                                        </FormGroup>
                                                    </Col>
                                                </Row>
                                            </SectionCard>
                                        </Col>

                                        <Col xl={6} className="mb-4">
                                            <SectionCard
                                                title="Exit & Handover Details"
                                                icon="📄"
                                            >
                                                <Row>
                                                    <Col md={6} className="mb-3">
                                                        <FormGroup>
                                                            <Label>Exit Date</Label>
                                                            <Input
                                                                type="date"
                                                                name="exit_date"
                                                                value={formData.exit_date}
                                                                onChange={handleChange}
                                                            />
                                                        </FormGroup>
                                                    </Col>

                                                    <Col md={6} className="mb-3">
                                                        <FormGroup>
                                                            <Label>Reason Type</Label>
                                                            <Input
                                                                type="select"
                                                                name="reason_type"
                                                                value={formData.reason_type}
                                                                onChange={handleChange}
                                                            >
                                                                <option value="resignation">
                                                                    Resignation
                                                                </option>
                                                                <option value="termination">
                                                                    Termination
                                                                </option>
                                                                <option value="absconding">
                                                                    Absconding
                                                                </option>
                                                            </Input>
                                                        </FormGroup>
                                                    </Col>

                                                    <Col md={6} className="mb-3">
                                                        <FormGroup>
                                                            <Label>Handover To</Label>
                                                            <Select
                                                                inputId="handover_to"
                                                                instanceId="handover_to"
                                                                name="handover_to"
                                                                options={staffOptions}
                                                                value={getSelectedStaffOption(
                                                                    formData.handover_to
                                                                )}
                                                                onChange={(selectedOption) =>
                                                                    handleStaffSelectChange(
                                                                        "handover_to",
                                                                        selectedOption
                                                                    )
                                                                }
                                                                placeholder={
                                                                    staffLoading
                                                                        ? "Loading staffs..."
                                                                        : "Select Handover To"
                                                                }
                                                                {...commonSelectProps}
                                                            />
                                                        </FormGroup>
                                                    </Col>

                                                    <Col md={6} className="mb-3">
                                                        <FormGroup>
                                                            <Label>Handover Date</Label>
                                                            <Input
                                                                type="date"
                                                                name="handover_date"
                                                                value={formData.handover_date}
                                                                onChange={handleChange}
                                                            />
                                                        </FormGroup>
                                                    </Col>

                                                    <Col md={12} className="mb-3">
                                                        <FormGroup>
                                                            <Label>Asset Responsibility</Label>
                                                            <Input
                                                                type="textarea"
                                                                name="asset_responsibility"
                                                                value={formData.asset_responsibility}
                                                                onChange={handleChange}
                                                                rows="3"
                                                            />
                                                        </FormGroup>
                                                    </Col>

                                                    <Col md={12} className="mb-3">
                                                        <FormGroup>
                                                            <Label>Exit Reason Note</Label>
                                                            <Input
                                                                type="textarea"
                                                                name="exit_reason_note"
                                                                value={formData.exit_reason_note}
                                                                onChange={handleChange}
                                                                rows="4"
                                                            />
                                                        </FormGroup>
                                                    </Col>

                                                    <Col md={12} className="mb-3">
                                                        <FormGroup>
                                                            <Label>Exit Form Date</Label>
                                                            <Input
                                                                type="date"
                                                                name="exit_form_date"
                                                                value={formData.exit_form_date}
                                                                onChange={handleChange}
                                                            />
                                                        </FormGroup>
                                                    </Col>
                                                </Row>
                                            </SectionCard>
                                        </Col>

                                        <Col xl={6} className="mb-4">
                                            <SectionCard
                                                title="HR Clearance"
                                                icon="✅"
                                            >
                                                <Row>
                                                    <Col md={12} className="mb-3">
                                                        <FormGroup check>
                                                            <Input
                                                                type="checkbox"
                                                                name="hr_clearance"
                                                                checked={formData.hr_clearance}
                                                                onChange={handleChange}
                                                            />
                                                            <Label check className="ms-2">
                                                                HR Clearance Completed
                                                            </Label>
                                                        </FormGroup>
                                                    </Col>

                                                    <Col md={6} className="mb-3">
                                                        <Label>HR Clearance Date</Label>
                                                        <Input
                                                            type="date"
                                                            name="hr_clearance_date"
                                                            value={formData.hr_clearance_date}
                                                            onChange={handleChange}
                                                        />
                                                    </Col>

                                                    <Col md={6} className="mb-3">
                                                        <FormGroup>
                                                            <Label>HR Cleared By</Label>
                                                            <Select
                                                                inputId="hr_clearance_by"
                                                                instanceId="hr_clearance_by"
                                                                name="hr_clearance_by"
                                                                options={staffOptions}
                                                                value={getSelectedStaffOption(
                                                                    formData.hr_clearance_by
                                                                )}
                                                                onChange={(selectedOption) =>
                                                                    handleStaffSelectChange(
                                                                        "hr_clearance_by",
                                                                        selectedOption
                                                                    )
                                                                }
                                                                placeholder={
                                                                    staffLoading
                                                                        ? "Loading staffs..."
                                                                        : "Select HR Cleared By"
                                                                }
                                                                {...commonSelectProps}
                                                            />
                                                        </FormGroup>
                                                    </Col>

                                                    <Col md={12} className="mb-3">
                                                        <Label>HR Note</Label>
                                                        <Input
                                                            type="textarea"
                                                            name="hr_clearance_note"
                                                            value={formData.hr_clearance_note}
                                                            onChange={handleChange}
                                                            rows="3"
                                                        />
                                                    </Col>

                                                    <Col md={12} className="mb-3">
                                                        <Label>HR Signature</Label>
                                                        <Input
                                                            type="file"
                                                            name="hr_clearance_signature"
                                                            onChange={handleChange}
                                                            accept="image/*"
                                                        />
                                                    </Col>
                                                </Row>
                                            </SectionCard>
                                        </Col>

                                        <Col xl={6} className="mb-4">
                                            <SectionCard
                                                title="Finance Clearance"
                                                icon="💰"
                                            >
                                                <Row>
                                                    <Col md={12} className="mb-3">
                                                        <FormGroup check>
                                                            <Input
                                                                type="checkbox"
                                                                name="finance_clearance"
                                                                checked={formData.finance_clearance}
                                                                onChange={handleChange}
                                                            />
                                                            <Label check className="ms-2">
                                                                Finance Clearance Completed
                                                            </Label>
                                                        </FormGroup>
                                                    </Col>

                                                    <Col md={6} className="mb-3">
                                                        <Label>Finance Clearance Date</Label>
                                                        <Input
                                                            type="date"
                                                            name="finance_clearance_date"
                                                            value={formData.finance_clearance_date}
                                                            onChange={handleChange}
                                                        />
                                                    </Col>

                                                    <Col md={6} className="mb-3">
                                                        <FormGroup>
                                                            <Label>Finance Cleared By</Label>
                                                            <Select
                                                                inputId="finance_clearance_by"
                                                                instanceId="finance_clearance_by"
                                                                name="finance_clearance_by"
                                                                options={staffOptions}
                                                                value={getSelectedStaffOption(
                                                                    formData.finance_clearance_by
                                                                )}
                                                                onChange={(selectedOption) =>
                                                                    handleStaffSelectChange(
                                                                        "finance_clearance_by",
                                                                        selectedOption
                                                                    )
                                                                }
                                                                placeholder={
                                                                    staffLoading
                                                                        ? "Loading staffs..."
                                                                        : "Select Finance Cleared By"
                                                                }
                                                                {...commonSelectProps}
                                                            />
                                                        </FormGroup>
                                                    </Col>

                                                    <Col md={12} className="mb-3">
                                                        <Label>Finance Note</Label>
                                                        <Input
                                                            type="textarea"
                                                            name="finance_clearance_note"
                                                            value={formData.finance_clearance_note}
                                                            onChange={handleChange}
                                                            rows="3"
                                                        />
                                                    </Col>

                                                    <Col md={12} className="mb-3">
                                                        <Label>Finance Signature</Label>
                                                        <Input
                                                            type="file"
                                                            name="finance_clearance_signature"
                                                            onChange={handleChange}
                                                            accept="image/*"
                                                        />
                                                    </Col>
                                                </Row>
                                            </SectionCard>
                                        </Col>

                                        <Col xl={6} className="mb-4">
                                            <SectionCard
                                                title="Sales Clearance"
                                                icon="📈"
                                            >
                                                <Row>
                                                    <Col md={12} className="mb-3">
                                                        <FormGroup check>
                                                            <Input
                                                                type="checkbox"
                                                                name="sales_clearance"
                                                                checked={formData.sales_clearance}
                                                                onChange={handleChange}
                                                            />
                                                            <Label check className="ms-2">
                                                                Sales Clearance Completed
                                                            </Label>
                                                        </FormGroup>
                                                    </Col>

                                                    <Col md={6} className="mb-3">
                                                        <Label>Sales Clearance Date</Label>
                                                        <Input
                                                            type="date"
                                                            name="sales_clearance_date"
                                                            value={formData.sales_clearance_date}
                                                            onChange={handleChange}
                                                        />
                                                    </Col>

                                                    <Col md={6} className="mb-3">
                                                        <FormGroup>
                                                            <Label>Sales Cleared By</Label>
                                                            <Select
                                                                inputId="sales_clearance_by"
                                                                instanceId="sales_clearance_by"
                                                                name="sales_clearance_by"
                                                                options={staffOptions}
                                                                value={getSelectedStaffOption(
                                                                    formData.sales_clearance_by
                                                                )}
                                                                onChange={(selectedOption) =>
                                                                    handleStaffSelectChange(
                                                                        "sales_clearance_by",
                                                                        selectedOption
                                                                    )
                                                                }
                                                                placeholder={
                                                                    staffLoading
                                                                        ? "Loading staffs..."
                                                                        : "Select Sales Cleared By"
                                                                }
                                                                {...commonSelectProps}
                                                            />
                                                        </FormGroup>
                                                    </Col>

                                                    <Col md={12} className="mb-3">
                                                        <Label>Sales Note</Label>
                                                        <Input
                                                            type="textarea"
                                                            name="sales_clearance_note"
                                                            value={formData.sales_clearance_note}
                                                            onChange={handleChange}
                                                            rows="3"
                                                        />
                                                    </Col>

                                                    <Col md={12} className="mb-3">
                                                        <Label>Sales Signature</Label>
                                                        <Input
                                                            type="file"
                                                            name="sales_clearance_signature"
                                                            onChange={handleChange}
                                                            accept="image/*"
                                                        />
                                                    </Col>
                                                </Row>
                                            </SectionCard>
                                        </Col>

                                        <Col xl={6} className="mb-4">
                                            <SectionCard
                                                title="IT Clearance"
                                                icon="💻"
                                            >
                                                <Row>
                                                    <Col md={12} className="mb-3">
                                                        <FormGroup check>
                                                            <Input
                                                                type="checkbox"
                                                                name="it_clearance"
                                                                checked={formData.it_clearance}
                                                                onChange={handleChange}
                                                            />
                                                            <Label check className="ms-2">
                                                                IT Clearance Completed
                                                            </Label>
                                                        </FormGroup>
                                                    </Col>

                                                    <Col md={6} className="mb-3">
                                                        <Label>IT Clearance Date</Label>
                                                        <Input
                                                            type="date"
                                                            name="it_clearance_date"
                                                            value={formData.it_clearance_date}
                                                            onChange={handleChange}
                                                        />
                                                    </Col>

                                                    <Col md={6} className="mb-3">
                                                        <FormGroup>
                                                            <Label>IT Cleared By</Label>
                                                            <Select
                                                                inputId="it_clearance_by"
                                                                instanceId="it_clearance_by"
                                                                name="it_clearance_by"
                                                                options={staffOptions}
                                                                value={getSelectedStaffOption(
                                                                    formData.it_clearance_by
                                                                )}
                                                                onChange={(selectedOption) =>
                                                                    handleStaffSelectChange(
                                                                        "it_clearance_by",
                                                                        selectedOption
                                                                    )
                                                                }
                                                                placeholder={
                                                                    staffLoading
                                                                        ? "Loading staffs..."
                                                                        : "Select IT Cleared By"
                                                                }
                                                                {...commonSelectProps}
                                                            />
                                                        </FormGroup>
                                                    </Col>

                                                    <Col md={12} className="mb-3">
                                                        <Label>IT Note</Label>
                                                        <Input
                                                            type="textarea"
                                                            name="it_clearance_note"
                                                            value={formData.it_clearance_note}
                                                            onChange={handleChange}
                                                            rows="3"
                                                        />
                                                    </Col>

                                                    <Col md={12} className="mb-3">
                                                        <Label>IT Signature</Label>
                                                        <Input
                                                            type="file"
                                                            name="it_clearance_signature"
                                                            onChange={handleChange}
                                                            accept="image/*"
                                                        />
                                                    </Col>
                                                </Row>
                                            </SectionCard>
                                        </Col>

                                        <Col xl={6} className="mb-4">
                                            <SectionCard
                                                title="Logistics Clearance"
                                                icon="🚚"
                                            >
                                                <Row>
                                                    <Col md={12} className="mb-3">
                                                        <FormGroup check>
                                                            <Input
                                                                type="checkbox"
                                                                name="logistics_clearance"
                                                                checked={formData.logistics_clearance}
                                                                onChange={handleChange}
                                                            />
                                                            <Label check className="ms-2">
                                                                Logistics Clearance Completed
                                                            </Label>
                                                        </FormGroup>
                                                    </Col>

                                                    <Col md={6} className="mb-3">
                                                        <Label>Logistics Clearance Date</Label>
                                                        <Input
                                                            type="date"
                                                            name="logistics_clearance_date"
                                                            value={formData.logistics_clearance_date}
                                                            onChange={handleChange}
                                                        />
                                                    </Col>

                                                    <Col md={6} className="mb-3">
                                                        <FormGroup>
                                                            <Label>Logistics Cleared By</Label>
                                                            <Select
                                                                inputId="logistics_clearance_by"
                                                                instanceId="logistics_clearance_by"
                                                                name="logistics_clearance_by"
                                                                options={staffOptions}
                                                                value={getSelectedStaffOption(
                                                                    formData.logistics_clearance_by
                                                                )}
                                                                onChange={(selectedOption) =>
                                                                    handleStaffSelectChange(
                                                                        "logistics_clearance_by",
                                                                        selectedOption
                                                                    )
                                                                }
                                                                placeholder={
                                                                    staffLoading
                                                                        ? "Loading staffs..."
                                                                        : "Select Logistics Cleared By"
                                                                }
                                                                {...commonSelectProps}
                                                            />
                                                        </FormGroup>
                                                    </Col>

                                                    <Col md={12} className="mb-3">
                                                        <Label>Logistics Note</Label>
                                                        <Input
                                                            type="textarea"
                                                            name="logistics_clearance_note"
                                                            value={formData.logistics_clearance_note}
                                                            onChange={handleChange}
                                                            rows="3"
                                                        />
                                                    </Col>

                                                    <Col md={12} className="mb-3">
                                                        <Label>Logistics Signature</Label>
                                                        <Input
                                                            type="file"
                                                            name="logistics_clearance_signature"
                                                            onChange={handleChange}
                                                            accept="image/*"
                                                        />
                                                    </Col>
                                                </Row>
                                            </SectionCard>
                                        </Col>

                                        <Col xl={6} className="mb-4">
                                            <SectionCard
                                                title="Employee Signature"
                                                icon="✍️"
                                            >
                                                <Row>
                                                    <Col md={12} className="mb-3">
                                                        <Label>Employee Signature</Label>
                                                        <Input
                                                            type="file"
                                                            name="employee_signature"
                                                            onChange={handleChange}
                                                            accept="image/*"
                                                        />
                                                    </Col>
                                                </Row>
                                            </SectionCard>
                                        </Col>
                                    </Row>
                                </Form>
                            ) : (
                                <>
                                    <Row className="mb-4">
                                        <Col xl={6} className="mb-4">
                                            <SectionCard
                                                title="Employee Information"
                                                icon="👤"
                                            >
                                                <Row>
                                                    <DetailItem
                                                        label="Employee Name"
                                                        value={getValue(details.employee_name)}
                                                    />
                                                    <DetailItem
                                                        label="Employee ID"
                                                        value={getValue(
                                                            details.employee_id ??
                                                                details.employee ??
                                                                "-"
                                                        )}
                                                    />
                                                    <DetailItem
                                                        label="Department"
                                                        value={getValue(
                                                            details.employee_department
                                                        )}
                                                    />
                                                    <DetailItem
                                                        label="Designation"
                                                        value={getValue(
                                                            details.employee_designation
                                                        )}
                                                    />
                                                    <DetailItem
                                                        label="Date of Joining"
                                                        value={formatDate(
                                                            details.employee_date_of_joining
                                                        )}
                                                    />
                                                    <DetailItem
                                                        label="Exit Form Date"
                                                        value={formatDate(
                                                            details.exit_form_date
                                                        )}
                                                    />
                                                </Row>
                                            </SectionCard>
                                        </Col>

                                        <Col xl={6} className="mb-4">
                                            <SectionCard
                                                title="Exit & Handover Details"
                                                icon="📄"
                                            >
                                                <Row>
                                                    <DetailItem
                                                        label="Exit Date"
                                                        value={formatDate(details.exit_date)}
                                                    />
                                                    <DetailItem
                                                        label="Reason Type"
                                                        value={formatReasonType(
                                                            details.reason_type
                                                        )}
                                                    />
                                                    <DetailItem
                                                        label="Handover To"
                                                        value={getValue(
                                                            details.handover_to_name
                                                        )}
                                                    />
                                                    <DetailItem
                                                        label="Handover Date"
                                                        value={formatDate(
                                                            details.handover_date
                                                        )}
                                                    />
                                                    <DetailItem
                                                        label="Asset Responsibility"
                                                        value={getValue(
                                                            details.asset_responsibility
                                                        )}
                                                        fullWidth={true}
                                                    />
                                                    <DetailItem
                                                        label="Exit Reason Note"
                                                        value={getValue(
                                                            details.exit_reason_note
                                                        )}
                                                        fullWidth={true}
                                                    />
                                                </Row>
                                            </SectionCard>
                                        </Col>
                                    </Row>

                                    <Row className="mb-2">
                                        <Col xl={12}>
                                            <Card
                                                className="border-0"
                                                style={{
                                                    borderRadius: "16px",
                                                    boxShadow:
                                                        "0 4px 20px rgba(18, 38, 63, 0.08)",
                                                }}
                                            >
                                                <CardBody>
                                                    <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                                                        <div>
                                                            <CardTitle className="mb-1 fw-bold">
                                                                Department Clearances
                                                            </CardTitle>
                                                            <div className="text-muted">
                                                                Status, approver, note and
                                                                signature for each department
                                                            </div>
                                                        </div>
                                                        <Badge
                                                            color="primary"
                                                            pill
                                                            className="px-3 py-2 fs-6"
                                                        >
                                                            {clearanceCount.completed} Completed
                                                        </Badge>
                                                    </div>

                                                    <Row>
                                                        <ClearanceCard
                                                            title="HR Clearance"
                                                            cleared={details.hr_clearance}
                                                            by={details.hr_clearance_by_name}
                                                            date={details.hr_clearance_date}
                                                            note={details.hr_clearance_note}
                                                            signature={
                                                                details.hr_clearance_signature
                                                            }
                                                            getYesNoBadge={getYesNoBadge}
                                                            getValue={getValue}
                                                            formatDate={formatDate}
                                                            renderSignatureImage={
                                                                renderSignatureImage
                                                            }
                                                        />

                                                        <ClearanceCard
                                                            title="Finance Clearance"
                                                            cleared={details.finance_clearance}
                                                            by={
                                                                details.finance_clearance_by_name
                                                            }
                                                            date={
                                                                details.finance_clearance_date
                                                            }
                                                            note={
                                                                details.finance_clearance_note
                                                            }
                                                            signature={
                                                                details.finance_clearance_signature
                                                            }
                                                            getYesNoBadge={getYesNoBadge}
                                                            getValue={getValue}
                                                            formatDate={formatDate}
                                                            renderSignatureImage={
                                                                renderSignatureImage
                                                            }
                                                        />

                                                        <ClearanceCard
                                                            title="IT Clearance"
                                                            cleared={details.it_clearance}
                                                            by={details.it_clearance_by_name}
                                                            date={details.it_clearance_date}
                                                            note={details.it_clearance_note}
                                                            signature={
                                                                details.it_clearance_signature
                                                            }
                                                            getYesNoBadge={getYesNoBadge}
                                                            getValue={getValue}
                                                            formatDate={formatDate}
                                                            renderSignatureImage={
                                                                renderSignatureImage
                                                            }
                                                        />

                                                        <ClearanceCard
                                                            title="Sales Clearance"
                                                            cleared={details.sales_clearance}
                                                            by={details.sales_clearance_by_name}
                                                            date={
                                                                details.sales_clearance_date
                                                            }
                                                            note={
                                                                details.sales_clearance_note
                                                            }
                                                            signature={
                                                                details.sales_clearance_signature
                                                            }
                                                            getYesNoBadge={getYesNoBadge}
                                                            getValue={getValue}
                                                            formatDate={formatDate}
                                                            renderSignatureImage={
                                                                renderSignatureImage
                                                            }
                                                        />

                                                        <ClearanceCard
                                                            title="Logistics Clearance"
                                                            cleared={
                                                                details.logistics_clearance
                                                            }
                                                            by={
                                                                details.logistics_clearance_by_name
                                                            }
                                                            date={
                                                                details.logistics_clearance_date
                                                            }
                                                            note={
                                                                details.logistics_clearance_note
                                                            }
                                                            signature={getLogisticsSignature(details)}
                                                            getYesNoBadge={getYesNoBadge}
                                                            getValue={getValue}
                                                            formatDate={formatDate}
                                                            renderSignatureImage={
                                                                renderSignatureImage
                                                            }
                                                        />
                                                    </Row>
                                                </CardBody>
                                            </Card>
                                        </Col>
                                    </Row>

                                    <Row className="mt-4">
                                        <Col xl={6} className="mb-4">
                                            <SectionCard
                                                title="Employee Signature"
                                                icon="✍️"
                                            >
                                                <Row>
                                                    <DetailItem
                                                        label="Employee Signature"
                                                        value={renderSignatureImage(
                                                            details.employee_signature,
                                                            "Employee Signature"
                                                        )}
                                                        fullWidth={true}
                                                    />
                                                </Row>
                                            </SectionCard>
                                        </Col>

                                        <Col xl={6} className="mb-4">
                                            <SectionCard
                                                title="Audit Information"
                                                icon="🕒"
                                            >
                                                <Row>
                                                    <DetailItem
                                                        label="Created By"
                                                        value={getValue(
                                                            details.created_by_name
                                                        )}
                                                    />
                                                    <DetailItem
                                                        label="Created At"
                                                        value={formatDateTime(
                                                            details.created_at
                                                        )}
                                                    />
                                                    <DetailItem
                                                        label="Updated At"
                                                        value={formatDateTime(
                                                            details.updated_at
                                                        )}
                                                        fullWidth={true}
                                                    />
                                                </Row>
                                            </SectionCard>
                                        </Col>
                                    </Row>
                                </>
                            )}
                        </>
                    )}
                </Container>
                <ToastContainer />
            </div>
        </React.Fragment>
    );
};

export default StaffExitView;