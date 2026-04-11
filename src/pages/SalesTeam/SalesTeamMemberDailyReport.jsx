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
    Badge,
} from "reactstrap";
import { useFormik } from "formik";
import * as Yup from "yup";
import Select from "react-select";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Breadcrumbs from "../../components/Common/Breadcrumb";

const SalesTeamMemberDailyReportPage = () => {
    document.title = "Sales Team Member Daily Report | Beposoft";

    const token = localStorage.getItem("token");
    const baseUrl = import.meta.env.VITE_APP_KEY;

    const [loading, setLoading] = useState(false);
    const [tableLoading, setTableLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [pageError, setPageError] = useState("");

    const [reports, setReports] = useState([]);
    const [teams, setTeams] = useState([]);
    const [states, setStates] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [allocatedStateIds, setAllocatedStateIds] = useState([]);

    const [summary, setSummary] = useState({
        total_reports: 0,
        active_count: 0,
        productive_count: 0,
        dsr_created_count: 0,
        dsr_approved_count: 0,
        dsr_confirmed_count: 0,
        dsr_rejected_count: 0,
        total_call_duration: "00:00:00",
        call_duration_average_8hrs: 0,
    });

    const [teamsLoading, setTeamsLoading] = useState(false);
    const [statesLoading, setStatesLoading] = useState(false);
    const [districtsLoading, setDistrictsLoading] = useState(false);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [profileLoading, setProfileLoading] = useState(false);

    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedReportId, setSelectedReportId] = useState(null);
    const [viewLoadingId, setViewLoadingId] = useState(null);
    const [deleteLoadingId, setDeleteLoadingId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const [searchText, setSearchText] = useState("");
    const [callStatusFilter, setCallStatusFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [startDateFilter, setStartDateFilter] = useState("");
    const [endDateFilter, setEndDateFilter] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const [count, setCount] = useState(0);
    const [nextPageUrl, setNextPageUrl] = useState(null);
    const [previousPageUrl, setPreviousPageUrl] = useState(null);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        const activeRole = localStorage.getItem("active");
    }, []);

    const getAuthHeaders = () => ({
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    });

    const parsePaginatedResponse = (response) => {
        const responseData = response?.data || {};
        const results = responseData?.results || {};
        const summaryData = results?.summary || {};

        return {
            rows: Array.isArray(results?.data) ? results.data : [],
            count: Number(responseData?.count || 0),
            next: responseData?.next || null,
            previous: responseData?.previous || null,
            summary: {
                total_reports: Number(summaryData?.total_reports || 0),
                active_count: Number(summaryData?.active_count || 0),
                productive_count: Number(summaryData?.productive_count || 0),
                dsr_created_count: Number(summaryData?.dsr_created_count || 0),
                dsr_approved_count: Number(summaryData?.dsr_approved_count || 0),
                dsr_confirmed_count: Number(summaryData?.dsr_confirmed_count || 0),
                dsr_rejected_count: Number(summaryData?.dsr_rejected_count || 0),
                total_call_duration: summaryData?.total_call_duration || "00:00:00",
                call_duration_average_8hrs: Number(
                    summaryData?.call_duration_average_8hrs || 0
                ),
            },
        };
    };

    const getDisplayId = (value) => {
        if (value === null || value === undefined) return "";
        if (typeof value === "object") {
            return value.id ?? "";
        }
        return value;
    };

    const normalizeAllocatedStateIds = (allocatedStates) => {
        if (!Array.isArray(allocatedStates)) return [];

        const ids = allocatedStates
            .map((item) => {
                if (item === null || item === undefined) return null;

                if (typeof item === "object") {
                    return item.id ?? item.state_id ?? item.value ?? null;
                }

                return item;
            })
            .filter((item) => item !== null && item !== undefined && item !== "");

        return [...new Set(ids.map((item) => String(item)))];
    };

    const fetchProfile = async () => {
        try {
            setProfileLoading(true);

            const response = await axios.get(`${baseUrl}profile/`, {
                headers: getAuthHeaders(),
            });

            const profileData =
                response?.data?.data ||
                response?.data?.results?.data ||
                response?.data?.results ||
                response?.data ||
                {};

            const allocatedStates =
                profileData?.allocated_states ||
                profileData?.user?.allocated_states ||
                [];

            const normalizedIds = normalizeAllocatedStateIds(allocatedStates);
            setAllocatedStateIds(normalizedIds);
        } catch (error) {
            const message =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                "Failed to fetch profile";
            setAllocatedStateIds([]);
            toast.error(message);
        } finally {
            setProfileLoading(false);
        }
    };

    const fetchReports = async (
        page = 1,
        customSearch = searchText,
        customCallStatus = callStatusFilter,
        customStatus = statusFilter,
        customStartDate = startDateFilter,
        customEndDate = endDateFilter
    ) => {
        try {
            setTableLoading(true);
            setPageError("");

            const params = new URLSearchParams();

            if (page) params.append("page", page);
            if (customSearch?.trim()) params.append("search", customSearch.trim());
            if (customCallStatus) params.append("call_status", customCallStatus);
            if (customStatus) params.append("status", customStatus);
            if (customStartDate) params.append("start_date", customStartDate);
            if (customEndDate) params.append("end_date", customEndDate);

            const response = await axios.get(
                `${baseUrl}sales/team/member/daily/report/add/?${params.toString()}`,
                {
                    headers: getAuthHeaders(),
                }
            );

            const parsed = parsePaginatedResponse(response);

            setReports(parsed.rows);
            setCount(parsed.count);
            setNextPageUrl(parsed.next);
            setPreviousPageUrl(parsed.previous);
            setSummary(parsed.summary);
            setCurrentPage(page);

            if (parsed.rows.length > 0) {
                setPageSize(parsed.rows.length);
            } else {
                setPageSize(10);
            }
        } catch (error) {
            const message =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                "Failed to fetch sales team member daily reports";

            setReports([]);
            setCount(0);
            setNextPageUrl(null);
            setPreviousPageUrl(null);
            setSummary({
                total_reports: 0,
                active_count: 0,
                productive_count: 0,
                dsr_created_count: 0,
                dsr_approved_count: 0,
                dsr_confirmed_count: 0,
                dsr_rejected_count: 0,
                total_call_duration: "00:00:00",
                call_duration_average_8hrs: 0,
            });
            setPageError(message);
            toast.error(message);
        } finally {
            setTableLoading(false);
        }
    };

    const fetchTeams = async () => {
        try {
            setTeamsLoading(true);

            const response = await axios.get(`${baseUrl}my/sales/team/memberships/`, {
                headers: getAuthHeaders(),
            });

            const data =
                response?.data?.data ||
                response?.data?.results?.data ||
                response?.data?.results ||
                [];

            setTeams(Array.isArray(data) ? data : []);
        } catch (error) {
            const message =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                "Failed to fetch teams";
            setTeams([]);
            toast.error(message);
        } finally {
            setTeamsLoading(false);
        }
    };

    const fetchStates = async () => {
        try {
            setStatesLoading(true);

            const response = await axios.get(`${baseUrl}states/`, {
                headers: getAuthHeaders(),
            });

            const data =
                response?.data?.data ||
                response?.data?.results?.data ||
                response?.data?.results ||
                [];

            setStates(Array.isArray(data) ? data : []);
        } catch (error) {
            const message =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                "Failed to fetch states";
            setStates([]);
            toast.error(message);
        } finally {
            setStatesLoading(false);
        }
    };

    const fetchDistricts = async () => {
        try {
            setDistrictsLoading(true);

            const response = await axios.get(`${baseUrl}districts/add/`, {
                headers: getAuthHeaders(),
            });

            const data =
                response?.data?.data ||
                response?.data?.results?.data ||
                response?.data?.results ||
                [];

            setDistricts(Array.isArray(data) ? data : []);
        } catch (error) {
            const message =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                "Failed to fetch districts";
            setDistricts([]);
            toast.error(message);
        } finally {
            setDistrictsLoading(false);
        }
    };

    const fetchOrders = async () => {
        try {
            setOrdersLoading(true);

            const response = await axios.get(`${baseUrl}my/orders/`, {
                headers: getAuthHeaders(),
            });

            const data = response?.data;
            setOrders(Array.isArray(data) ? data : []);
        } catch (error) {
            const message =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                "Failed to fetch invoices";
            setOrders([]);
            toast.error(message);
        } finally {
            setOrdersLoading(false);
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
                fetchProfile(),
                fetchReports(1),
                fetchTeams(),
                fetchStates(),
                fetchDistricts(),
                fetchOrders(),
            ]);
            setLoading(false);
        };

        init();
    }, [token]);

    const filteredStates = useMemo(() => {
        if (!allocatedStateIds.length) return [];
        return states.filter((item) => allocatedStateIds.includes(String(item.id)));
    }, [states, allocatedStateIds]);

    const teamOptions = useMemo(() => {
        return teams.map((item) => ({
            value: String(item.team?.id ?? item.team_id ?? item.id),
            label:
                item.team?.name ||
                item.team_name ||
                item.name ||
                `Team ${item.team?.id ?? item.team_id ?? item.id}`,
        }));
    }, [teams]);

    const stateOptions = useMemo(() => {
        return filteredStates.map((item) => ({
            value: String(item.id),
            label: item.name || `State ${item.id}`,
        }));
    }, [filteredStates]);

    const invoiceOptions = useMemo(() => {
        return orders.map((item) => ({
            value: String(item.id),
            label:
                (item.invoice || item.invoice_number || `Invoice ${item.id}`) +
                (item.total_amount ? ` - ₹${item.total_amount}` : ""),
        }));
    }, [orders]);

    const callStatusOptions = [
        { value: "active", label: "Active" },
        { value: "productive", label: "Productive" },
    ];

    const dsrStatusOptions = [{ value: "dsr created", label: "DSR Created" }];

    const formik = useFormik({
        initialValues: {
            team: "",
            state: "",
            district: "",
            invoice: "",
            phone: "",
            customer_name: "",
            call_status: "active",
            status: "dsr created",
            call_duration: "",
            note: "",
        },
        validationSchema: Yup.object({
            team: Yup.string().required("Please select team"),
            state: Yup.string().required("Please select state"),
            district: Yup.string().required("Please select district"),
            phone: Yup.string()
                .required("Please enter phone number")
                .matches(/^\d{10}$/, "Phone number must be exactly 10 digits"),
            call_status: Yup.string().required("Please select call status"),
            status: Yup.string().required("Please select status"),
            call_duration: Yup.string()
                .matches(
                    /^$|^\d{2}:\d{2}:\d{2}$/,
                    "Call duration must be in HH:MM:SS format"
                )
                .nullable(),
            note: Yup.string().nullable(),
            customer_name: Yup.string().when("call_status", {
                is: "active",
                then: (schema) => schema.required("Please enter customer name"),
                otherwise: (schema) => schema.nullable(),
            }),
            invoice: Yup.string().when("call_status", {
                is: "productive",
                then: (schema) => schema.required("Please select invoice"),
                otherwise: (schema) => schema.nullable(),
            }),
        }),
        onSubmit: async (values, { resetForm }) => {
            try {
                setSubmitting(true);
                setPageError("");

                const payload = {
                    team: Number(values.team),
                    state: Number(values.state),
                    district: Number(values.district),
                    invoice:
                        values.call_status === "productive" && values.invoice
                            ? Number(values.invoice)
                            : null,
                    phone: values.phone || "",
                    customer_name:
                        values.call_status === "active"
                            ? values.customer_name || ""
                            : "",
                    call_status: values.call_status,
                    status: values.status,
                    call_duration: values.call_duration || "",
                    note: values.note || "",
                };

                let response;

                if (isEditMode && selectedReportId) {
                    response = await axios.put(
                        `${baseUrl}sales/team/member/daily/report/edit/${selectedReportId}/`,
                        payload,
                        {
                            headers: getAuthHeaders(),
                        }
                    );
                } else {
                    response = await axios.post(
                        `${baseUrl}sales/team/member/daily/report/add/`,
                        payload,
                        {
                            headers: getAuthHeaders(),
                        }
                    );
                }

                if (response.status === 200 || response.status === 201) {
                    toast.success(
                        isEditMode
                            ? "Sales team member daily report updated successfully"
                            : "Sales team member daily report created successfully"
                    );

                    resetForm();
                    setIsEditMode(false);
                    setSelectedReportId(null);
                    setShowForm(false);
                    await fetchReports(currentPage);
                } else {
                    toast.error(
                        isEditMode
                            ? "Failed to update report"
                            : "Failed to create report"
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
                        responseData?.message ||
                        responseData?.error ||
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

    const filteredDistrictOptions = useMemo(() => {
        const selectedStateId = String(formik.values.state || "");

        if (!selectedStateId) return [];

        const filteredDistricts = districts.filter((item) => {
            const districtStateId = String(
                item?.state?.id ?? item?.state_id ?? item?.state ?? ""
            );

            return (
                allocatedStateIds.includes(districtStateId) &&
                districtStateId === selectedStateId
            );
        });

        return filteredDistricts.map((item) => ({
            value: String(item.id),
            label: item.name || `District ${item.id}`,
        }));
    }, [districts, allocatedStateIds, formik.values.state]);

    const clearFormAndMode = () => {
        setIsEditMode(false);
        setSelectedReportId(null);
        setPageError("");
        setShowForm(false);
        formik.resetForm();
    };

    const handleAddButtonClick = () => {
        setIsEditMode(false);
        setSelectedReportId(null);
        setPageError("");
        formik.resetForm();
        formik.setFieldValue("call_status", "active");
        formik.setFieldValue("status", "dsr created");
        setShowForm(true);

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    useEffect(() => {
        if (!formik.values.state) {
            if (formik.values.district) {
                formik.setFieldValue("district", "");
            }
            return;
        }

        const isDistrictStillValid = filteredDistrictOptions.some(
            (option) => String(option.value) === String(formik.values.district)
        );

        if (formik.values.district && !isDistrictStillValid) {
            formik.setFieldValue("district", "");
        }
    }, [formik.values.state, filteredDistrictOptions]);

    useEffect(() => {
        if (!formik.values.state) return;

        const selectedStateExists = stateOptions.some(
            (option) => String(option.value) === String(formik.values.state)
        );

        if (!selectedStateExists) {
            formik.setFieldValue("state", "");
            formik.setFieldValue("district", "");
        }
    }, [stateOptions]);

    useEffect(() => {
        if (formik.values.call_status === "active") {
            if (formik.values.invoice) {
                formik.setFieldValue("invoice", "");
            }
        }

        if (formik.values.call_status === "productive") {
            if (formik.values.customer_name) {
                formik.setFieldValue("customer_name", "");
            }
        }
    }, [formik.values.call_status]);

    const handleEdit = async (id) => {
        try {
            setViewLoadingId(id);
            setPageError("");

            const response = await axios.get(
                `${baseUrl}sales/team/member/daily/report/edit/${id}/`,
                {
                    headers: getAuthHeaders(),
                }
            );

            const data =
                response?.data?.data ||
                response?.data?.results?.data ||
                response?.data?.results ||
                response?.data ||
                {};

            const editStateId = String(getDisplayId(data?.state) || "");
            const editDistrictId = String(getDisplayId(data?.district) || "");
            const stateAllowed = allocatedStateIds.includes(editStateId);

            formik.setValues({
                team: String(getDisplayId(data?.team) || ""),
                state: stateAllowed ? editStateId : "",
                district: stateAllowed ? editDistrictId : "",
                invoice: String(getDisplayId(data?.invoice) || ""),
                phone: data?.phone || "",
                customer_name: data?.customer_name || "",
                call_status: data?.call_status || "active",
                status: data?.status || "dsr created",
                call_duration: data?.call_duration || "",
                note: data?.note || "",
            });

            setSelectedReportId(id);
            setIsEditMode(true);
            setShowForm(true);

            window.scrollTo({
                top: 0,
                behavior: "smooth",
            });

            if (!stateAllowed && editStateId) {
                toast.warning("This report state is not in your allocated states");
            } else {
                toast.success("Report details loaded successfully");
            }
        } catch (error) {
            const message =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                "Failed to fetch report details";
            setPageError(message);
            toast.error(message);
        } finally {
            setViewLoadingId(null);
        }
    };

    const handleDelete = async (id) => {
        try {
            const confirmDelete = window.confirm(
                "Are you sure you want to delete this report?"
            );

            if (!confirmDelete) return;

            setDeleteLoadingId(id);
            setPageError("");

            const response = await axios.delete(
                `${baseUrl}sales/team/member/daily/report/edit/${id}/`,
                {
                    headers: getAuthHeaders(),
                }
            );

            if (response.status === 200) {
                toast.success("Report deleted successfully");

                if (reports.length === 1 && currentPage > 1) {
                    await fetchReports(currentPage - 1);
                } else {
                    await fetchReports(currentPage);
                }
            } else {
                toast.error("Failed to delete report");
            }
        } catch (error) {
            const message =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                "Failed to delete report";
            setPageError(message);
            toast.error(message);
        } finally {
            setDeleteLoadingId(null);
        }
    };

    const handleSearch = async () => {
        setCurrentPage(1);
        await fetchReports(
            1,
            searchText,
            callStatusFilter,
            statusFilter,
            startDateFilter,
            endDateFilter
        );
    };

    const handleClearFilters = async () => {
        setSearchText("");
        setCallStatusFilter("");
        setStatusFilter("");
        setStartDateFilter("");
        setEndDateFilter("");
        setCurrentPage(1);
        await fetchReports(1, "", "", "", "", "");
    };

    const totalPages = useMemo(() => {
        if (!count || !pageSize) return 1;
        return Math.ceil(count / pageSize);
    }, [count, pageSize]);

    const getStatusBadgeColor = (value) => {
        switch (value) {
            case "active":
                return "warning";
            case "productive":
                return "success";
            case "dsr created":
                return "secondary";
            case "dsr approved":
                return "primary";
            case "dsr confirmed":
                return "success";
            case "dsr rejected":
                return "danger";
            default:
                return "light";
        }
    };

    const formatCreatedAt = (value) => {
        if (!value) return "-";
        try {
            return new Date(value).toLocaleString();
        } catch {
            return value;
        }
    };

    const getInvoiceText = (item) => {
        if (item?.invoice_number) return item.invoice_number;
        if (item?.invoice_details?.invoice) return item.invoice_details.invoice;
        if (item?.invoice_details?.invoice_number) return item.invoice_details.invoice_number;
        if (item?.invoice) return item.invoice;
        return "-";
    };

    const commonSelectStyles = {
        control: (provided, state) => ({
            ...provided,
            minHeight: "38px",
            height: "38px",
            borderColor: state.isFocused ? "#556ee6" : "#ced4da",
            boxShadow: state.isFocused ? "0 0 0 1px #556ee6" : "none",
            "&:hover": {
                borderColor: state.isFocused ? "#556ee6" : "#b1bbc4",
            },
        }),
        valueContainer: (provided) => ({
            ...provided,
            height: "38px",
            padding: "0 12px",
            display: "flex",
            alignItems: "center",
            overflow: "hidden",
        }),
        input: (provided) => ({
            ...provided,
            margin: "0px",
            padding: "0px",
        }),
        singleValue: (provided) => ({
            ...provided,
            margin: "0px",
            top: "50%",
            transform: "translateY(-50%)",
            position: "absolute",
            maxWidth: "calc(100% - 16px)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
        }),
        placeholder: (provided) => ({
            ...provided,
            margin: "0px",
            top: "50%",
            transform: "translateY(-50%)",
            position: "absolute",
            color: "#6c757d",
        }),
        indicatorsContainer: (provided) => ({
            ...provided,
            height: "38px",
        }),
        clearIndicator: (provided) => ({
            ...provided,
            padding: "8px",
        }),
        dropdownIndicator: (provided) => ({
            ...provided,
            padding: "8px",
        }),
        menu: (provided) => ({
            ...provided,
            zIndex: 9999,
        }),
        menuPortal: (provided) => ({
            ...provided,
            zIndex: 9999,
        }),
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <Breadcrumbs
                        title="Sales"
                        breadcrumbItem="Sales Team Member Daily Report"
                    />

                    {loading ? (
                        <Row>
                            <Col xl={12}>
                                <Card>
                                    <CardBody className="text-center py-5">
                                        <Spinner color="primary" />
                                        <div className="mt-3">
                                            Loading sales team member daily report page...
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>
                    ) : (
                        <Row>
                            <Col xl={12}>
                                <Card className="shadow-sm">
                                    <CardBody>
                                        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
                                            <CardTitle className="mb-0">
                                                Sales Team Member Daily Report List
                                            </CardTitle>

                                            <div className="d-flex gap-2 flex-wrap">
                                                <Button
                                                    color="primary"
                                                    onClick={handleAddButtonClick}
                                                >
                                                    Add
                                                </Button>

                                                <Button
                                                    color="primary"
                                                    outline
                                                    onClick={() => fetchReports(currentPage)}
                                                    disabled={tableLoading}
                                                >
                                                    {tableLoading ? "Refreshing..." : "Refresh"}
                                                </Button>
                                            </div>
                                        </div>

                                        {showForm ? (
                                            <Card className="border mb-4">
                                                <CardBody>
                                                    <CardTitle className="mb-4">
                                                        {isEditMode
                                                            ? "Update Sales Team Member Daily Report"
                                                            : "Create Sales Team Member Daily Report"}
                                                    </CardTitle>

                                                    {pageError ? (
                                                        <div className="alert alert-danger py-2">
                                                            {pageError}
                                                        </div>
                                                    ) : null}

                                                    <Form onSubmit={formik.handleSubmit}>
                                                        <Row>
                                                            <Col xl={3}>
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
                                                                        styles={commonSelectStyles}
                                                                        menuPortalTarget={document.body}
                                                                        className={
                                                                            formik.touched.team &&
                                                                                formik.errors.team
                                                                                ? "is-invalid"
                                                                                : ""
                                                                        }
                                                                        noOptionsMessage={() =>
                                                                            "No teams found"
                                                                        }
                                                                    />
                                                                    {formik.touched.team &&
                                                                        formik.errors.team ? (
                                                                        <div className="invalid-feedback d-block">
                                                                            {formik.errors.team}
                                                                        </div>
                                                                    ) : null}
                                                                </div>
                                                            </Col>

                                                            <Col xl={3}>
                                                                <div className="mb-3">
                                                                    <Label htmlFor="state">State</Label>
                                                                    <Select
                                                                        inputId="state"
                                                                        name="state"
                                                                        options={stateOptions}
                                                                        placeholder={
                                                                            statesLoading || profileLoading
                                                                                ? "Loading states..."
                                                                                : "Search and select state"
                                                                        }
                                                                        value={
                                                                            stateOptions.find(
                                                                                (option) =>
                                                                                    String(option.value) ===
                                                                                    String(formik.values.state)
                                                                            ) || null
                                                                        }
                                                                        onChange={(selectedOption) => {
                                                                            formik.setFieldValue(
                                                                                "state",
                                                                                selectedOption
                                                                                    ? String(selectedOption.value)
                                                                                    : ""
                                                                            );
                                                                            formik.setFieldValue("district", "");
                                                                        }}
                                                                        onBlur={() =>
                                                                            formik.setFieldTouched("state", true)
                                                                        }
                                                                        isClearable
                                                                        isSearchable
                                                                        isDisabled={
                                                                            statesLoading ||
                                                                            profileLoading
                                                                        }
                                                                        classNamePrefix="react-select"
                                                                        styles={commonSelectStyles}
                                                                        menuPortalTarget={document.body}
                                                                        className={
                                                                            formik.touched.state &&
                                                                                formik.errors.state
                                                                                ? "is-invalid"
                                                                                : ""
                                                                        }
                                                                        noOptionsMessage={() =>
                                                                            allocatedStateIds.length === 0
                                                                                ? "No allocated states found"
                                                                                : "No states found"
                                                                        }
                                                                    />
                                                                    {formik.touched.state &&
                                                                        formik.errors.state ? (
                                                                        <div className="invalid-feedback d-block">
                                                                            {formik.errors.state}
                                                                        </div>
                                                                    ) : null}
                                                                </div>
                                                            </Col>

                                                            <Col xl={3}>
                                                                <div className="mb-3">
                                                                    <Label htmlFor="district">
                                                                        District
                                                                    </Label>
                                                                    <Select
                                                                        inputId="district"
                                                                        name="district"
                                                                        options={filteredDistrictOptions}
                                                                        placeholder={
                                                                            !formik.values.state
                                                                                ? "Select state first"
                                                                                : districtsLoading
                                                                                    ? "Loading districts..."
                                                                                    : "Search and select district"
                                                                        }
                                                                        value={
                                                                            filteredDistrictOptions.find(
                                                                                (option) =>
                                                                                    String(option.value) ===
                                                                                    String(formik.values.district)
                                                                            ) || null
                                                                        }
                                                                        onChange={(selectedOption) => {
                                                                            formik.setFieldValue(
                                                                                "district",
                                                                                selectedOption
                                                                                    ? String(selectedOption.value)
                                                                                    : ""
                                                                            );
                                                                        }}
                                                                        onBlur={() =>
                                                                            formik.setFieldTouched(
                                                                                "district",
                                                                                true
                                                                            )
                                                                        }
                                                                        isClearable
                                                                        isSearchable
                                                                        isDisabled={
                                                                            !formik.values.state ||
                                                                            districtsLoading
                                                                        }
                                                                        classNamePrefix="react-select"
                                                                        styles={commonSelectStyles}
                                                                        menuPortalTarget={document.body}
                                                                        className={
                                                                            formik.touched.district &&
                                                                                formik.errors.district
                                                                                ? "is-invalid"
                                                                                : ""
                                                                        }
                                                                        noOptionsMessage={() =>
                                                                            !formik.values.state
                                                                                ? "Select state first"
                                                                                : "No districts found"
                                                                        }
                                                                    />
                                                                    {formik.touched.district &&
                                                                        formik.errors.district ? (
                                                                        <div className="invalid-feedback d-block">
                                                                            {formik.errors.district}
                                                                        </div>
                                                                    ) : null}
                                                                </div>
                                                            </Col>

                                                            <Col xl={3}>
                                                                <div className="mb-3">
                                                                    <Label htmlFor="call_status">
                                                                        Call Status
                                                                    </Label>
                                                                    <Select
                                                                        inputId="call_status"
                                                                        name="call_status"
                                                                        options={callStatusOptions}
                                                                        value={
                                                                            callStatusOptions.find(
                                                                                (option) =>
                                                                                    option.value ===
                                                                                    formik.values.call_status
                                                                            ) || null
                                                                        }
                                                                        onChange={(selectedOption) => {
                                                                            formik.setFieldValue(
                                                                                "call_status",
                                                                                selectedOption
                                                                                    ? selectedOption.value
                                                                                    : ""
                                                                            );
                                                                        }}
                                                                        onBlur={() =>
                                                                            formik.setFieldTouched(
                                                                                "call_status",
                                                                                true
                                                                            )
                                                                        }
                                                                        classNamePrefix="react-select"
                                                                        styles={commonSelectStyles}
                                                                        isSearchable={false}
                                                                        menuPortalTarget={document.body}
                                                                    />
                                                                    {formik.touched.call_status &&
                                                                        formik.errors.call_status ? (
                                                                        <div className="invalid-feedback d-block">
                                                                            {formik.errors.call_status}
                                                                        </div>
                                                                    ) : null}
                                                                </div>
                                                            </Col>
                                                        </Row>

                                                        <Row>
                                                            {formik.values.call_status === "productive" && (
                                                                <Col xl={3}>
                                                                    <div className="mb-3">
                                                                        <Label htmlFor="invoice">
                                                                            Invoice
                                                                        </Label>
                                                                        <Select
                                                                            inputId="invoice"
                                                                            name="invoice"
                                                                            options={invoiceOptions}
                                                                            placeholder={
                                                                                ordersLoading
                                                                                    ? "Loading invoices..."
                                                                                    : "Search and select invoice"
                                                                            }
                                                                            value={
                                                                                invoiceOptions.find(
                                                                                    (option) =>
                                                                                        String(option.value) ===
                                                                                        String(formik.values.invoice)
                                                                                ) || null
                                                                            }
                                                                            onChange={(selectedOption) => {
                                                                                formik.setFieldValue(
                                                                                    "invoice",
                                                                                    selectedOption
                                                                                        ? String(selectedOption.value)
                                                                                        : ""
                                                                                );
                                                                            }}
                                                                            onBlur={() =>
                                                                                formik.setFieldTouched(
                                                                                    "invoice",
                                                                                    true
                                                                                )
                                                                            }
                                                                            isClearable
                                                                            isSearchable
                                                                            isDisabled={ordersLoading}
                                                                            classNamePrefix="react-select"
                                                                            styles={commonSelectStyles}
                                                                            menuPortalTarget={document.body}
                                                                            className={
                                                                                formik.touched.invoice &&
                                                                                    formik.errors.invoice
                                                                                    ? "is-invalid"
                                                                                    : ""
                                                                            }
                                                                            noOptionsMessage={() =>
                                                                                "No invoices found"
                                                                            }
                                                                        />
                                                                        {formik.touched.invoice &&
                                                                            formik.errors.invoice ? (
                                                                            <div className="invalid-feedback d-block">
                                                                                {formik.errors.invoice}
                                                                            </div>
                                                                        ) : null}
                                                                    </div>
                                                                </Col>
                                                            )}

                                                            {formik.values.call_status === "active" && (
                                                                <Col xl={3}>
                                                                    <div className="mb-3">
                                                                        <Label htmlFor="customer_name">
                                                                            Customer Name
                                                                        </Label>
                                                                        <Input
                                                                            id="customer_name"
                                                                            name="customer_name"
                                                                            type="text"
                                                                            value={formik.values.customer_name}
                                                                            onChange={formik.handleChange}
                                                                            onBlur={formik.handleBlur}
                                                                            invalid={
                                                                                formik.touched.customer_name &&
                                                                                !!formik.errors.customer_name
                                                                            }
                                                                        />
                                                                        {formik.touched.customer_name &&
                                                                            formik.errors.customer_name ? (
                                                                            <FormFeedback>
                                                                                {formik.errors.customer_name}
                                                                            </FormFeedback>
                                                                        ) : null}
                                                                    </div>
                                                                </Col>
                                                            )}

                                                            <Col xl={3}>
                                                                <div className="mb-3">
                                                                    <Label htmlFor="phone">Phone</Label>
                                                                    <Input
                                                                        id="phone"
                                                                        name="phone"
                                                                        type="text"
                                                                        placeholder="Enter 10 digit phone number"
                                                                        maxLength={10}
                                                                        value={formik.values.phone}
                                                                        onChange={(e) => {
                                                                            const onlyNumbers = e.target.value
                                                                                .replace(/\D/g, "")
                                                                                .slice(0, 10);
                                                                            formik.setFieldValue(
                                                                                "phone",
                                                                                onlyNumbers
                                                                            );
                                                                        }}
                                                                        onBlur={formik.handleBlur}
                                                                        invalid={
                                                                            formik.touched.phone &&
                                                                            !!formik.errors.phone
                                                                        }
                                                                    />
                                                                    {formik.touched.phone &&
                                                                        formik.errors.phone ? (
                                                                        <FormFeedback>
                                                                            {formik.errors.phone}
                                                                        </FormFeedback>
                                                                    ) : null}
                                                                </div>
                                                            </Col>

                                                            <Col xl={3}>
                                                                <div className="mb-3">
                                                                    <Label htmlFor="status">Status</Label>
                                                                    <Select
                                                                        inputId="status"
                                                                        name="status"
                                                                        options={dsrStatusOptions}
                                                                        value={
                                                                            dsrStatusOptions.find(
                                                                                (option) =>
                                                                                    option.value ===
                                                                                    formik.values.status
                                                                            ) || null
                                                                        }
                                                                        onChange={(selectedOption) => {
                                                                            formik.setFieldValue(
                                                                                "status",
                                                                                selectedOption
                                                                                    ? selectedOption.value
                                                                                    : ""
                                                                            );
                                                                        }}
                                                                        onBlur={() =>
                                                                            formik.setFieldTouched("status", true)
                                                                        }
                                                                        classNamePrefix="react-select"
                                                                        styles={commonSelectStyles}
                                                                        isSearchable={false}
                                                                        menuPortalTarget={document.body}
                                                                    />
                                                                    {formik.touched.status &&
                                                                        formik.errors.status ? (
                                                                        <div className="invalid-feedback d-block">
                                                                            {formik.errors.status}
                                                                        </div>
                                                                    ) : null}
                                                                </div>
                                                            </Col>

                                                            <Col xl={3}>
                                                                <div className="mb-3">
                                                                    <Label htmlFor="call_duration">
                                                                        Call Duration
                                                                    </Label>
                                                                    <Input
                                                                        id="call_duration"
                                                                        name="call_duration"
                                                                        type="time"
                                                                        step="1"
                                                                        value={formik.values.call_duration || ""}
                                                                        onChange={(e) => {
                                                                            formik.setFieldValue(
                                                                                "call_duration",
                                                                                e.target.value
                                                                            );
                                                                        }}
                                                                        onBlur={formik.handleBlur}
                                                                        invalid={
                                                                            formik.touched.call_duration &&
                                                                            !!formik.errors.call_duration
                                                                        }
                                                                    />
                                                                    {formik.touched.call_duration &&
                                                                        formik.errors.call_duration ? (
                                                                        <FormFeedback>
                                                                            {formik.errors.call_duration}
                                                                        </FormFeedback>
                                                                    ) : null}
                                                                </div>
                                                            </Col>
                                                        </Row>

                                                        <Row>
                                                            <Col xl={12}>
                                                                <div className="mb-3">
                                                                    <Label htmlFor="note">Note</Label>
                                                                    <Input
                                                                        id="note"
                                                                        name="note"
                                                                        type="textarea"
                                                                        rows="4"
                                                                        value={formik.values.note}
                                                                        onChange={formik.handleChange}
                                                                        onBlur={formik.handleBlur}
                                                                        invalid={
                                                                            formik.touched.note &&
                                                                            !!formik.errors.note
                                                                        }
                                                                    />
                                                                    {formik.touched.note &&
                                                                        formik.errors.note ? (
                                                                        <FormFeedback>
                                                                            {formik.errors.note}
                                                                        </FormFeedback>
                                                                    ) : null}
                                                                </div>
                                                            </Col>
                                                        </Row>

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
                                                                        ? "Update Report"
                                                                        : "Create Report"}
                                                            </Button>

                                                            <Button
                                                                color="light"
                                                                type="button"
                                                                onClick={clearFormAndMode}
                                                                disabled={submitting}
                                                            >
                                                                {isEditMode ? "Cancel" : "Close"}
                                                            </Button>
                                                        </div>
                                                    </Form>
                                                </CardBody>
                                            </Card>
                                        ) : null}

                                        <Row className="mb-3">
                                            <Col md={3}>
                                                <Label htmlFor="search">Search</Label>
                                                <InputGroup>
                                                    <InputGroupText>
                                                        <i className="bx bx-search" />
                                                    </InputGroupText>
                                                    <Input
                                                        id="search"
                                                        type="text"
                                                        placeholder="Search customer, phone, note, invoice..."
                                                        value={searchText}
                                                        onChange={(e) =>
                                                            setSearchText(e.target.value)
                                                        }
                                                    />
                                                </InputGroup>
                                            </Col>

                                            <Col md={2}>
                                                <Label htmlFor="call_status_filter">
                                                    Call Status
                                                </Label>
                                                <Input
                                                    id="call_status_filter"
                                                    type="select"
                                                    value={callStatusFilter}
                                                    onChange={(e) =>
                                                        setCallStatusFilter(e.target.value)
                                                    }
                                                >
                                                    <option value="">All</option>
                                                    <option value="active">Active</option>
                                                    <option value="productive">
                                                        Productive
                                                    </option>
                                                </Input>
                                            </Col>

                                            <Col md={2}>
                                                <Label htmlFor="status_filter">Status</Label>
                                                <Input
                                                    id="status_filter"
                                                    type="select"
                                                    value={statusFilter}
                                                    onChange={(e) =>
                                                        setStatusFilter(e.target.value)
                                                    }
                                                >
                                                    <option value="">All</option>
                                                    <option value="dsr created">
                                                        DSR Created
                                                    </option>
                                                    <option value="dsr approved">
                                                        DSR Approved
                                                    </option>
                                                    <option value="dsr confirmed">
                                                        DSR Confirmed
                                                    </option>
                                                    <option value="dsr rejected">
                                                        DSR Rejected
                                                    </option>
                                                </Input>
                                            </Col>

                                            <Col md={2}>
                                                <Label htmlFor="start_date">Start Date</Label>
                                                <Input
                                                    id="start_date"
                                                    type="date"
                                                    value={startDateFilter}
                                                    onChange={(e) =>
                                                        setStartDateFilter(e.target.value)
                                                    }
                                                />
                                            </Col>

                                            <Col md={2}>
                                                <Label htmlFor="end_date">End Date</Label>
                                                <Input
                                                    id="end_date"
                                                    type="date"
                                                    value={endDateFilter}
                                                    onChange={(e) =>
                                                        setEndDateFilter(e.target.value)
                                                    }
                                                />
                                            </Col>

                                            <Col md={1} className="d-flex align-items-end">
                                                <div className="d-flex gap-2 w-100">
                                                    <Button
                                                        color="primary"
                                                        onClick={handleSearch}
                                                        disabled={tableLoading}
                                                        className="w-100"
                                                    >
                                                        Search
                                                    </Button>
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row className="mb-3">
                                            <Col md={12}>
                                                <Button
                                                    color="light"
                                                    onClick={handleClearFilters}
                                                    disabled={tableLoading}
                                                >
                                                    Clear Filters
                                                </Button>
                                            </Col>
                                        </Row>

                                        <Row className="mb-3">
                                            <Col md={2}>
                                                <Card className="border shadow-none mb-0">
                                                    <CardBody className="py-3">
                                                        <h6 className="text-muted mb-1">
                                                            Total Reports
                                                        </h6>
                                                        <h4 className="mb-0">
                                                            {summary.total_reports}
                                                        </h4>
                                                    </CardBody>
                                                </Card>
                                            </Col>

                                            <Col md={2}>
                                                <Card className="border shadow-none mb-0">
                                                    <CardBody className="py-3">
                                                        <h6 className="text-muted mb-1">
                                                            Active
                                                        </h6>
                                                        <h4 className="mb-0">
                                                            {summary.active_count}
                                                        </h4>
                                                    </CardBody>
                                                </Card>
                                            </Col>

                                            <Col md={2}>
                                                <Card className="border shadow-none mb-0">
                                                    <CardBody className="py-3">
                                                        <h6 className="text-muted mb-1">
                                                            Productive
                                                        </h6>
                                                        <h4 className="mb-0">
                                                            {summary.productive_count}
                                                        </h4>
                                                    </CardBody>
                                                </Card>
                                            </Col>

                                            <Col md={2}>
                                                <Card className="border shadow-none mb-0">
                                                    <CardBody className="py-3">
                                                        <h6 className="text-muted mb-1">
                                                            Total Call Duration
                                                        </h6>
                                                        <h4 className="mb-0">
                                                            {summary.total_call_duration || "00:00:00"}
                                                        </h4>
                                                    </CardBody>
                                                </Card>
                                            </Col>

                                            <Col md={2}>
                                                <Card className="border shadow-none mb-0">
                                                    <CardBody className="py-3">
                                                        <h6 className="text-muted mb-1">
                                                            8 Hours %
                                                        </h6>
                                                        <h4 className="mb-0">
                                                            {Number(summary.call_duration_average_8hrs || 0).toFixed(2)}%
                                                        </h4>
                                                    </CardBody>
                                                </Card>
                                            </Col>

                                            <Col md={2}>
                                                <Card className="border shadow-none mb-0">
                                                    <CardBody className="py-3">
                                                        <h6 className="text-muted mb-1">
                                                            DSR Created
                                                        </h6>
                                                        <h4 className="mb-0">
                                                            {summary.dsr_created_count}
                                                        </h4>
                                                    </CardBody>
                                                </Card>
                                            </Col>
                                        </Row>

                                        <Row className="mb-3">
                                            <Col md={2}>
                                                <Card className="border shadow-none mb-0">
                                                    <CardBody className="py-3">
                                                        <h6 className="text-muted mb-1">
                                                            DSR Approved
                                                        </h6>
                                                        <h4 className="mb-0">
                                                            {summary.dsr_approved_count}
                                                        </h4>
                                                    </CardBody>
                                                </Card>
                                            </Col>

                                            <Col md={2}>
                                                <Card className="border shadow-none mb-0">
                                                    <CardBody className="py-3">
                                                        <h6 className="text-muted mb-1">
                                                            DSR Confirmed
                                                        </h6>
                                                        <h4 className="mb-0">
                                                            {summary.dsr_confirmed_count}
                                                        </h4>
                                                    </CardBody>
                                                </Card>
                                            </Col>

                                            <Col md={2}>
                                                <Card className="border shadow-none mb-0">
                                                    <CardBody className="py-3">
                                                        <h6 className="text-muted mb-1">
                                                            DSR Rejected
                                                        </h6>
                                                        <h4 className="mb-0">
                                                            {summary.dsr_rejected_count}
                                                        </h4>
                                                    </CardBody>
                                                </Card>
                                            </Col>
                                        </Row>

                                        {tableLoading ? (
                                            <div className="text-center py-5">
                                                <Spinner color="primary" />
                                                <div className="mt-2">Loading reports...</div>
                                            </div>
                                        ) : reports.length === 0 ? (
                                            <div className="text-center py-5 text-muted">
                                                No reports found
                                            </div>
                                        ) : (
                                            <>
                                                <div className="table-responsive">
                                                    <Table
                                                        className="table table-bordered align-middle mb-0"
                                                        hover
                                                    >
                                                        <thead className="table-light">
                                                            <tr>
                                                                <th style={{ minWidth: "70px" }}>#</th>
                                                                <th style={{ minWidth: "140px" }}>Team</th>
                                                                <th style={{ minWidth: "130px" }}>Division</th>
                                                                <th style={{ minWidth: "130px" }}>State</th>
                                                                <th style={{ minWidth: "130px" }}>District</th>
                                                                <th style={{ minWidth: "150px" }}>Invoice</th>
                                                                <th style={{ minWidth: "150px" }}>Customer</th>
                                                                <th style={{ minWidth: "130px" }}>Phone</th>
                                                                <th style={{ minWidth: "130px" }}>Call Status</th>
                                                                <th style={{ minWidth: "130px" }}>Status</th>
                                                                <th style={{ minWidth: "130px" }}>Call Duration</th>
                                                                <th style={{ minWidth: "150px" }}>8 Hours %</th>
                                                                <th style={{ minWidth: "160px" }}>Created By</th>
                                                                <th style={{ minWidth: "180px" }}>Created At</th>
                                                                <th style={{ minWidth: "170px" }}>Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {reports.map((item, index) => (
                                                                <tr key={item.id}>
                                                                    <td>
                                                                        {(currentPage - 1) * pageSize + index + 1}
                                                                    </td>
                                                                    <td>{item?.team_name || "-"}</td>
                                                                    <td>{item?.division_name || "-"}</td>
                                                                    <td>{item?.state_name || "-"}</td>
                                                                    <td>{item?.district_name || "-"}</td>
                                                                    <td>{getInvoiceText(item)}</td>
                                                                    <td>{item?.customer_name || "-"}</td>
                                                                    <td>{item?.phone || "-"}</td>
                                                                    <td>
                                                                        <Badge
                                                                            color={getStatusBadgeColor(item?.call_status)}
                                                                        >
                                                                            {item?.call_status || "-"}
                                                                        </Badge>
                                                                    </td>
                                                                    <td>
                                                                        <Badge
                                                                            color={getStatusBadgeColor(item?.status)}
                                                                        >
                                                                            {item?.status || "-"}
                                                                        </Badge>
                                                                    </td>
                                                                    <td>{item?.call_duration || "-"}</td>
                                                                    <td>
                                                                        {item?.call_duration_percentage_8hrs !== null &&
                                                                            item?.call_duration_percentage_8hrs !== undefined
                                                                            ? `${Number(item.call_duration_percentage_8hrs).toFixed(2)}%`
                                                                            : "-"}
                                                                    </td>
                                                                    <td>{item?.created_by_name || "-"}</td>
                                                                    <td>{formatCreatedAt(item?.created_at)}</td>
                                                                    <td>
                                                                        <div className="d-flex gap-2">
                                                                            {item?.call_status === "active" && (
                                                                                <Button
                                                                                    color="info"
                                                                                    size="sm"
                                                                                    onClick={() => handleEdit(item.id)}
                                                                                    disabled={viewLoadingId === item.id}
                                                                                >
                                                                                    {viewLoadingId === item.id
                                                                                        ? "Loading..."
                                                                                        : "Edit"}
                                                                                </Button>
                                                                            )}

                                                                            {item?.status === "dsr created" && (
                                                                                <Button
                                                                                    color="danger"
                                                                                    size="sm"
                                                                                    onClick={() => handleDelete(item.id)}
                                                                                    disabled={deleteLoadingId === item.id}
                                                                                >
                                                                                    {deleteLoadingId === item.id
                                                                                        ? "Deleting..."
                                                                                        : "Delete"}
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </Table>
                                                </div>

                                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-3">
                                                    <div className="text-muted">
                                                        Page {currentPage} of {totalPages}
                                                    </div>

                                                    <div className="d-flex gap-2">
                                                        <Button
                                                            color="light"
                                                            disabled={!previousPageUrl || currentPage <= 1}
                                                            onClick={() => fetchReports(currentPage - 1)}
                                                        >
                                                            Previous
                                                        </Button>

                                                        <Button
                                                            color="light"
                                                            disabled={!nextPageUrl}
                                                            onClick={() => fetchReports(currentPage + 1)}
                                                        >
                                                            Next
                                                        </Button>
                                                    </div>
                                                </div>
                                            </>
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

export default SalesTeamMemberDailyReportPage;