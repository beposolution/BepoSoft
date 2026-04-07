import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Select from "react-select";
import {
    Card,
    CardBody,
    CardTitle,
    Col,
    Container,
    Row,
    Input,
    Button,
    Table,
    Spinner,
    InputGroup,
    InputGroupText,
    Badge,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from "reactstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Breadcrumbs from "../../components/Common/Breadcrumb";

const SalesTeamDivisionDailyReportPage = () => {
    document.title = "Sales Team Division Daily Report | Beposoft";

    const token = localStorage.getItem("token");
    const baseUrl = import.meta.env.VITE_APP_KEY;

    const [loading, setLoading] = useState(true);
    const [tableLoading, setTableLoading] = useState(false);
    const [filterLoading, setFilterLoading] = useState(false);
    const [pageError, setPageError] = useState("");
    const [familyId, setFamilyId] = useState(null);
    const [reports, setReports] = useState([]);

    const [summary, setSummary] = useState({
        staff_count: 0,
        total_call_duration: "00:00:00",
        call_duration_average_8hrs: 0,
    });

    const [searchText, setSearchText] = useState("");
    const [callStatusFilter, setCallStatusFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [createdByFilter, setCreatedByFilter] = useState("");
    const [stateFilter, setStateFilter] = useState("");
    const [districtFilter, setDistrictFilter] = useState("");
    const [startDateFilter, setStartDateFilter] = useState("");
    const [endDateFilter, setEndDateFilter] = useState("");

    const [staffOptions, setStaffOptions] = useState([]);
    const [stateOptions, setStateOptions] = useState([]);
    const [districtOptions, setDistrictOptions] = useState([]);

    const [currentPage, setCurrentPage] = useState(1);
    const [count, setCount] = useState(0);
    const [nextPageUrl, setNextPageUrl] = useState(null);
    const [previousPageUrl, setPreviousPageUrl] = useState(null);
    const [pageSize, setPageSize] = useState(10);

    const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
    const [selectedInvoiceDetails, setSelectedInvoiceDetails] = useState(null);

    const [role, setRole] = useState("");

    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [selectedReportForStatus, setSelectedReportForStatus] = useState(null);
    const [selectedNewStatus, setSelectedNewStatus] = useState("");
    const [statusUpdating, setStatusUpdating] = useState(false);

    useEffect(() => {
        const storedRole =
            localStorage.getItem("active") ||
            localStorage.getItem("department") ||
            localStorage.getItem("role") ||
            "";
        setRole(String(storedRole).trim().toUpperCase());
    }, []);

    const getAuthHeaders = () => ({
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    });

    const parsePaginatedResponse = (response) => {
        const responseData = response?.data || {};
        const results = responseData?.results || {};

        return {
            rows: Array.isArray(results?.data) ? results.data : [],
            count: Number(responseData?.count || 0),
            next: responseData?.next || null,
            previous: responseData?.previous || null,
            summary: {
                staff_count: Number(results?.staff_count || 0),
                total_call_duration: results?.total_call_duration || "00:00:00",
                call_duration_average_8hrs: Number(
                    results?.call_duration_average_8hrs || 0
                ),
            },
        };
    };

    const extractArrayFromResponse = (response) => {
        const data = response?.data;

        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.data)) return data.data;
        if (Array.isArray(data?.results)) return data.results;
        if (Array.isArray(data?.results?.data)) return data.results.data;

        return [];
    };

    const normalizeStatus = (value) => String(value || "").trim().toLowerCase();
    const normalizeRole = (value) => String(value || "").trim().toUpperCase();

    const formatStatusLabel = (value) => {
        const normalized = normalizeStatus(value);

        if (normalized === "dsr created") return "DSR Created";
        if (normalized === "dsr approved") return "DSR Approved";
        if (normalized === "dsr confirmed") return "DSR Confirmed";
        if (normalized === "dsr rejected") return "DSR Rejected";
        if (normalized === "active") return "Active";
        if (normalized === "productive") return "Productive";

        return value || "-";
    };

    const getAllowedStatusOptions = (currentRole, currentStatus) => {
        const normalizedRoleValue = normalizeRole(currentRole);
        const normalizedStatusValue = normalizeStatus(currentStatus);

        if (
            normalizedRoleValue === "BDM" &&
            normalizedStatusValue === "dsr created"
        ) {
            return [
                { label: "DSR Approved", value: "dsr approved" },
                { label: "DSR Rejected", value: "dsr rejected" },
            ];
        }

        if (
            normalizedRoleValue === "SD" &&
            normalizedStatusValue === "dsr approved"
        ) {
            return [
                { label: "DSR Confirmed", value: "dsr confirmed" },
                { label: "DSR Rejected", value: "dsr rejected" },
            ];
        }

        return [];
    };

    const canUpdateStatus = (currentRole, currentStatus) => {
        return getAllowedStatusOptions(currentRole, currentStatus).length > 0;
    };

    const fetchUserData = async () => {
        try {
            const response = await axios.get(`${baseUrl}profile/`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setFamilyId(response?.data?.data?.family_id || "");
        } catch (error) {
            toast.error("Error fetching user data");
            setLoading(false);
        }
    };

    const fetchStaffs = async () => {
        try {
            const response = await axios.get(`${baseUrl}staffs/`, {
                headers: getAuthHeaders(),
            });

            const data = extractArrayFromResponse(response);
            const allStaffs = Array.isArray(data) ? data : [];

            const filteredStaffs = allStaffs.filter((item) => {
                const designation = String(
                    item?.designation ||
                    item?.department ||
                    item?.active ||
                    item?.role ||
                    ""
                )
                    .trim()
                    .toUpperCase();

                return designation === "BDM" || designation === "BDO";
            });

            setStaffOptions(filteredStaffs);
        } catch (error) {
            const message =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                "Failed to fetch staffs";

            setStaffOptions([]);
            toast.error(message);
        }
    };

    const fetchStates = async () => {
        try {
            const response = await axios.get(`${baseUrl}states/`, {
                headers: getAuthHeaders(),
            });

            const data = extractArrayFromResponse(response);
            setStateOptions(Array.isArray(data) ? data : []);
        } catch (error) {
            const message =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                "Failed to fetch states";

            setStateOptions([]);
            toast.error(message);
        }
    };

    const fetchDistricts = async () => {
        try {
            const response = await axios.get(`${baseUrl}districts/add/`, {
                headers: getAuthHeaders(),
            });

            const data = extractArrayFromResponse(response);
            setDistrictOptions(Array.isArray(data) ? data : []);
        } catch (error) {
            const message =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                "Failed to fetch districts";

            setDistrictOptions([]);
            toast.error(message);
        }
    };

    const fetchAllFilterOptions = async () => {
        try {
            setFilterLoading(true);
            await Promise.all([fetchStaffs(), fetchStates(), fetchDistricts()]);
        } catch (error) {
            console.log("Filter loading error:", error);
        } finally {
            setFilterLoading(false);
        }
    };

    useEffect(() => {
        if (!token) {
            setLoading(false);
            setPageError("Token not found");
            return;
        }

        fetchUserData();
        fetchAllFilterOptions();
    }, [token]);

    const fetchReports = async (
        page = 1,
        customSearch = searchText,
        customCallStatus = callStatusFilter,
        customStatus = statusFilter,
        customCreatedBy = createdByFilter,
        customState = stateFilter,
        customDistrict = districtFilter,
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
            if (customCreatedBy?.trim()) params.append("created_by", customCreatedBy.trim());
            if (customState?.trim()) params.append("state", customState.trim());
            if (customDistrict?.trim()) params.append("district", customDistrict.trim());
            if (customStartDate) params.append("start_date", customStartDate);
            if (customEndDate) params.append("end_date", customEndDate);

            const url = `${baseUrl}sales/team/division/daily/report/all/${familyId}/?${params.toString()}`;

            const response = await axios.get(url, {
                headers: getAuthHeaders(),
            });
            console.log("API Response:", response);

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
                error?.response?.data?.detail ||
                error?.message ||
                "Failed to fetch sales team division daily reports";

            setReports([]);
            setCount(0);
            setNextPageUrl(null);
            setPreviousPageUrl(null);
            setSummary({
                staff_count: 0,
                total_call_duration: "00:00:00",
                call_duration_average_8hrs: 0,
            });
            setPageError(message);
            toast.error(message);
        } finally {
            setTableLoading(false);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!token) {
            setLoading(false);
            setPageError("Token not found");
            return;
        }

        if (!familyId) {
            return;
        }

        fetchReports(1);
    }, [token, familyId]);

    const filteredDistrictOptions = useMemo(() => {
        if (!stateFilter) return [];

        return districtOptions.filter((district) => {
            return (
                String(district?.state_name || "")
                    .trim()
                    .toLowerCase() === String(stateFilter).trim().toLowerCase()
            );
        });
    }, [districtOptions, stateFilter]);

    useEffect(() => {
        if (!stateFilter) {
            setDistrictFilter("");
            return;
        }

        const districtExists = filteredDistrictOptions.some(
            (district) =>
                String(district?.name || "").trim().toLowerCase() ===
                String(districtFilter).trim().toLowerCase()
        );

        if (!districtExists) {
            setDistrictFilter("");
        }
    }, [stateFilter, filteredDistrictOptions, districtFilter]);

    const groupedReports = useMemo(() => {
        const grouped = {};

        reports.forEach((item) => {
            const teamName = item?.team_name?.trim() || "No Team";
            if (!grouped[teamName]) {
                grouped[teamName] = [];
            }
            grouped[teamName].push(item);
        });

        return Object.entries(grouped);
    }, [reports]);

    const handleSearch = async () => {
        setCurrentPage(1);
        await fetchReports(
            1,
            searchText,
            callStatusFilter,
            statusFilter,
            createdByFilter,
            stateFilter,
            districtFilter,
            startDateFilter,
            endDateFilter
        );
    };

    const handleClearFilters = async () => {
        setSearchText("");
        setCallStatusFilter("");
        setStatusFilter("");
        setCreatedByFilter("");
        setStateFilter("");
        setDistrictFilter("");
        setStartDateFilter("");
        setEndDateFilter("");
        setCurrentPage(1);

        await fetchReports(1, "", "", "", "", "", "", "", "");
    };

    const totalPages = useMemo(() => {
        if (!count || !pageSize) return 1;
        return Math.ceil(count / pageSize);
    }, [count, pageSize]);

    const getStatusBadgeColor = (value) => {
        switch ((value || "").toLowerCase()) {
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
        } catch (error) {
            return value;
        }
    };

    const getInvoiceText = (item) => {
        if (item?.invoice_number) return item.invoice_number;
        if (item?.invoice_details?.invoice) return item.invoice_details.invoice;
        if (item?.invoice_details?.invoice_number) {
            return item.invoice_details.invoice_number;
        }
        if (item?.invoice) return item.invoice;
        return "-";
    };

    const getStaffOptionLabel = (staff) => {
        return (
            staff?.name ||
            staff?.full_name ||
            staff?.username ||
            staff?.created_by_name ||
            `Staff ${staff?.id}`
        );
    };

    const getStateOptionLabel = (state) => {
        return state?.name || `State ${state?.id}`;
    };

    const getDistrictOptionLabel = (district) => {
        return district?.name || `District ${district?.id}`;
    };

    const createdBySelectOptions = useMemo(() => {
        return staffOptions.map((staff) => ({
            value: getStaffOptionLabel(staff),
            label: getStaffOptionLabel(staff),
        }));
    }, [staffOptions]);

    const stateSelectOptions = useMemo(() => {
        return stateOptions.map((state) => ({
            value: getStateOptionLabel(state),
            label: getStateOptionLabel(state),
        }));
    }, [stateOptions]);

    const districtSelectOptions = useMemo(() => {
        return filteredDistrictOptions.map((district) => ({
            value: getDistrictOptionLabel(district),
            label: getDistrictOptionLabel(district),
        }));
    }, [filteredDistrictOptions]);

    const searchableSelectStyles = {
        control: (provided, state) => ({
            ...provided,
            minHeight: "38px",
            borderColor: state.isFocused ? "#556ee6" : "#ced4da",
            boxShadow: state.isFocused
                ? "0 0 0 0.2rem rgba(85, 110, 230, 0.25)"
                : "none",
            "&:hover": {
                borderColor: state.isFocused ? "#556ee6" : "#adb5bd",
            },
        }),
        menu: (provided) => ({
            ...provided,
            zIndex: 9999,
        }),
    };

    const openInvoiceModal = (invoiceDetails) => {
        setSelectedInvoiceDetails(invoiceDetails || null);
        setInvoiceModalOpen(true);
    };

    const closeInvoiceModal = () => {
        setInvoiceModalOpen(false);
        setSelectedInvoiceDetails(null);
    };

    const openStatusModal = (reportItem) => {
        const allowedOptions = getAllowedStatusOptions(role, reportItem?.status);

        if (allowedOptions.length === 0) {
            toast.warning("You are not allowed to update this status");
            return;
        }

        setSelectedReportForStatus(reportItem);
        setSelectedNewStatus("");
        setStatusModalOpen(true);
    };

    const closeStatusModal = () => {
        if (statusUpdating) return;

        setStatusModalOpen(false);
        setSelectedReportForStatus(null);
        setSelectedNewStatus("");
    };

    const handleUpdateStatus = async () => {
        if (!selectedReportForStatus?.id) {
            toast.error("Invalid report selected");
            return;
        }

        if (!selectedNewStatus) {
            toast.error("Please select a new status");
            return;
        }

        const allowedOptions = getAllowedStatusOptions(
            role,
            selectedReportForStatus?.status
        ).map((item) => item.value);

        if (!allowedOptions.includes(selectedNewStatus)) {
            toast.error("This status change is not allowed for your role");
            return;
        }

        try {
            setStatusUpdating(true);

            const payload = {
                status: selectedNewStatus,
            };

            const response = await axios.patch(
                `${baseUrl}sales/team/member/daily/report/status/${selectedReportForStatus.id}/`,
                payload,
                {
                    headers: getAuthHeaders(),
                }
            );

            console.log("STATUS UPDATE RESPONSE:", response?.data);

            setReports((prevReports) =>
                prevReports.map((item) =>
                    item.id === selectedReportForStatus.id
                        ? {
                              ...item,
                              status: selectedNewStatus,
                          }
                        : item
                )
            );

            toast.success(
                `Status updated to ${formatStatusLabel(selectedNewStatus)} successfully`
            );

            closeStatusModal();
        } catch (error) {
            const message =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.response?.data?.detail ||
                error?.message ||
                "Failed to update status";

            toast.error(message);
        } finally {
            setStatusUpdating(false);
        }
    };

    const statusOptionsForModal = useMemo(() => {
        return getAllowedStatusOptions(
            role,
            selectedReportForStatus?.status
        );
    }, [role, selectedReportForStatus]);

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <Breadcrumbs
                        title="Sales"
                        breadcrumbItem="Sales Team Division Daily Report"
                    />

                    {loading ? (
                        <Row>
                            <Col xl={12}>
                                <Card>
                                    <CardBody className="text-center py-5">
                                        <Spinner color="primary" />
                                        <div className="mt-3">
                                            Loading sales team division daily report page...
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
                                                Sales Team Division Daily Report List
                                            </CardTitle>

                                            <div className="d-flex gap-2 flex-wrap">
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

                                        {pageError ? (
                                            <div className="alert alert-danger py-2">
                                                {pageError}
                                            </div>
                                        ) : null}

                                        <Row className="mb-3">
                                            <Col md={3}>
                                                <label htmlFor="search" className="form-label">
                                                    Search
                                                </label>
                                                <InputGroup>
                                                    <InputGroupText>
                                                        <i className="bx bx-search" />
                                                    </InputGroupText>
                                                    <Input
                                                        id="search"
                                                        type="text"
                                                        placeholder="Search customer, phone, invoice, note..."
                                                        value={searchText}
                                                        onChange={(e) =>
                                                            setSearchText(e.target.value)
                                                        }
                                                    />
                                                </InputGroup>
                                            </Col>

                                            <Col md={2}>
                                                <label
                                                    htmlFor="call_status_filter"
                                                    className="form-label"
                                                >
                                                    Call Status
                                                </label>
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
                                                    <option value="productive">Productive</option>
                                                </Input>
                                            </Col>

                                            <Col md={2}>
                                                <label
                                                    htmlFor="status_filter"
                                                    className="form-label"
                                                >
                                                    Status
                                                </label>
                                                <Input
                                                    id="status_filter"
                                                    type="select"
                                                    value={statusFilter}
                                                    onChange={(e) =>
                                                        setStatusFilter(e.target.value)
                                                    }
                                                >
                                                    <option value="">All</option>
                                                    <option value="dsr created">DSR Created</option>
                                                    <option value="dsr approved">DSR Approved</option>
                                                    <option value="dsr confirmed">DSR Confirmed</option>
                                                    <option value="dsr rejected">DSR Rejected</option>
                                                </Input>
                                            </Col>

                                            <Col md={2}>
                                                <label
                                                    htmlFor="created_by_filter"
                                                    className="form-label"
                                                >
                                                    Created By
                                                </label>
                                                <Select
                                                    inputId="created_by_filter"
                                                    options={createdBySelectOptions}
                                                    value={
                                                        createdBySelectOptions.find(
                                                            (option) =>
                                                                option.value === createdByFilter
                                                        ) || null
                                                    }
                                                    onChange={(selectedOption) =>
                                                        setCreatedByFilter(
                                                            selectedOption ? selectedOption.value : ""
                                                        )
                                                    }
                                                    isClearable
                                                    isSearchable
                                                    placeholder="Select Created By"
                                                    isDisabled={filterLoading}
                                                    styles={searchableSelectStyles}
                                                />
                                            </Col>

                                            <Col md={3}>
                                                <label
                                                    htmlFor="state_filter"
                                                    className="form-label"
                                                >
                                                    State
                                                </label>
                                                <Select
                                                    inputId="state_filter"
                                                    options={stateSelectOptions}
                                                    value={
                                                        stateSelectOptions.find(
                                                            (option) =>
                                                                option.value === stateFilter
                                                        ) || null
                                                    }
                                                    onChange={(selectedOption) => {
                                                        const selectedState = selectedOption
                                                            ? selectedOption.value
                                                            : "";
                                                        setStateFilter(selectedState);
                                                        setDistrictFilter("");
                                                    }}
                                                    isClearable
                                                    isSearchable
                                                    placeholder="Select State"
                                                    isDisabled={filterLoading}
                                                    styles={searchableSelectStyles}
                                                />
                                            </Col>
                                        </Row>

                                        <Row className="mb-3">
                                            <Col md={3}>
                                                <label
                                                    htmlFor="district_filter"
                                                    className="form-label"
                                                >
                                                    District
                                                </label>
                                                <Select
                                                    inputId="district_filter"
                                                    options={districtSelectOptions}
                                                    value={
                                                        districtSelectOptions.find(
                                                            (option) =>
                                                                option.value === districtFilter
                                                        ) || null
                                                    }
                                                    onChange={(selectedOption) =>
                                                        setDistrictFilter(
                                                            selectedOption ? selectedOption.value : ""
                                                        )
                                                    }
                                                    isClearable
                                                    isSearchable
                                                    placeholder={
                                                        stateFilter
                                                            ? "Select District"
                                                            : "Select State First"
                                                    }
                                                    isDisabled={filterLoading || !stateFilter}
                                                    styles={searchableSelectStyles}
                                                />
                                            </Col>

                                            <Col md={2}>
                                                <label htmlFor="start_date" className="form-label">
                                                    Start Date
                                                </label>
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
                                                <label htmlFor="end_date" className="form-label">
                                                    End Date
                                                </label>
                                                <Input
                                                    id="end_date"
                                                    type="date"
                                                    value={endDateFilter}
                                                    onChange={(e) =>
                                                        setEndDateFilter(e.target.value)
                                                    }
                                                />
                                            </Col>

                                            <Col md={2} className="d-flex align-items-end">
                                                <Button
                                                    color="primary"
                                                    onClick={handleSearch}
                                                    disabled={tableLoading}
                                                    className="w-100"
                                                >
                                                    Search
                                                </Button>
                                            </Col>

                                            <Col md={3} className="d-flex align-items-end">
                                                <Button
                                                    color="light"
                                                    onClick={handleClearFilters}
                                                    disabled={tableLoading}
                                                    className="w-100"
                                                >
                                                    Clear Filters
                                                </Button>
                                            </Col>
                                        </Row>

                                        <Row className="mb-3">
                                            <Col md={4}>
                                                <Card className="border shadow-none mb-0">
                                                    <CardBody className="py-3">
                                                        <h6 className="text-muted mb-1">
                                                            Staff Count
                                                        </h6>
                                                        <h4 className="mb-0">{summary.staff_count}</h4>
                                                    </CardBody>
                                                </Card>
                                            </Col>

                                            <Col md={4}>
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

                                            <Col md={4}>
                                                <Card className="border shadow-none mb-0">
                                                    <CardBody className="py-3">
                                                        <h6 className="text-muted mb-1">
                                                            Call Duration Average 8 Hours %
                                                        </h6>
                                                        <h4 className="mb-0">
                                                            {Number(
                                                                summary.call_duration_average_8hrs || 0
                                                            ).toFixed(2)}
                                                            %
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
                                                        <tbody>
                                                            {groupedReports.map(
                                                                ([teamName, teamRows], teamIndex) => (
                                                                    <React.Fragment key={`${teamName}-${teamIndex}`}>
                                                                        <tr className="table-primary">
                                                                            <td
                                                                                colSpan="13"
                                                                                className="fw-bold"
                                                                            >
                                                                                Team: {teamName} ({teamRows.length})
                                                                            </td>
                                                                        </tr>

                                                                        <tr className="table-light">
                                                                            <th style={{ minWidth: "70px" }}>#</th>
                                                                            <th style={{ minWidth: "150px" }}>BDO</th>
                                                                            <th style={{ minWidth: "120px" }}>State</th>
                                                                            <th style={{ minWidth: "120px" }}>District</th>
                                                                            <th style={{ minWidth: "140px" }}>Invoice Details</th>
                                                                            <th style={{ minWidth: "150px" }}>Customer</th>
                                                                            <th style={{ minWidth: "130px" }}>Phone</th>
                                                                            <th style={{ minWidth: "130px" }}>Call Status</th>
                                                                            <th style={{ minWidth: "130px" }}>Status</th>
                                                                            <th style={{ minWidth: "140px" }}>Update Status</th>
                                                                            <th style={{ minWidth: "130px" }}>Call Duration</th>
                                                                            <th style={{ minWidth: "120px" }}>8 Hours %</th>
                                                                            <th style={{ minWidth: "180px" }}>Created At</th>
                                                                        </tr>

                                                                        {teamRows.map((item, index) => {
                                                                            let serialNumber = 0;

                                                                            for (
                                                                                let i = 0;
                                                                                i < teamIndex;
                                                                                i += 1
                                                                            ) {
                                                                                serialNumber +=
                                                                                    groupedReports[i][1].length;
                                                                            }

                                                                            serialNumber += index + 1;

                                                                            const allowedToUpdate = canUpdateStatus(
                                                                                role,
                                                                                item?.status
                                                                            );

                                                                            return (
                                                                                <tr key={item.id}>
                                                                                    <td>{serialNumber}</td>
                                                                                    <td>{item?.created_by_name || "-"}</td>
                                                                                    <td>{item?.state_name || "-"}</td>
                                                                                    <td>{item?.district_name || "-"}</td>
                                                                                    <td>
                                                                                        {item?.invoice_details ? (
                                                                                            <Button
                                                                                                color="link"
                                                                                                className="p-0 text-decoration-none fw-semibold"
                                                                                                onClick={() =>
                                                                                                    openInvoiceModal(
                                                                                                        item.invoice_details
                                                                                                    )
                                                                                                }
                                                                                            >
                                                                                                {getInvoiceText(item)}
                                                                                            </Button>
                                                                                        ) : (
                                                                                            getInvoiceText(item)
                                                                                        )}
                                                                                    </td>
                                                                                    <td>{item?.customer_name || "-"}</td>
                                                                                    <td>{item?.phone || "-"}</td>
                                                                                    <td>
                                                                                        <Badge
                                                                                            color={getStatusBadgeColor(
                                                                                                item?.call_status
                                                                                            )}
                                                                                        >
                                                                                            {formatStatusLabel(item?.call_status)}
                                                                                        </Badge>
                                                                                    </td>
                                                                                    <td>
                                                                                        <Badge
                                                                                            color={getStatusBadgeColor(
                                                                                                item?.status
                                                                                            )}
                                                                                        >
                                                                                            {formatStatusLabel(item?.status)}
                                                                                        </Badge>
                                                                                    </td>
                                                                                    <td>
                                                                                        {allowedToUpdate ? (
                                                                                            <Button
                                                                                                color="primary"
                                                                                                size="sm"
                                                                                                onClick={() =>
                                                                                                    openStatusModal(item)
                                                                                                }
                                                                                            >
                                                                                                Update
                                                                                            </Button>
                                                                                        ) : (
                                                                                            <span className="text-muted">
                                                                                                No Action
                                                                                            </span>
                                                                                        )}
                                                                                    </td>
                                                                                    <td>{item?.call_duration || "-"}</td>
                                                                                    <td>
                                                                                        {item?.call_duration_percentage_8hrs !==
                                                                                            null &&
                                                                                        item?.call_duration_percentage_8hrs !==
                                                                                            undefined
                                                                                            ? `${Number(
                                                                                                  item.call_duration_percentage_8hrs
                                                                                              ).toFixed(2)}%`
                                                                                            : "-"}
                                                                                    </td>
                                                                                    <td>{formatCreatedAt(item?.created_at)}</td>
                                                                                </tr>
                                                                            );
                                                                        })}
                                                                    </React.Fragment>
                                                                )
                                                            )}
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

                <Modal isOpen={invoiceModalOpen} toggle={closeInvoiceModal} size="lg" centered>
                    <ModalHeader toggle={closeInvoiceModal}>Invoice Details</ModalHeader>
                    <ModalBody>
                        {selectedInvoiceDetails ? (
                            <>
                                <Row className="mb-3">
                                    <Col md={3} className="mb-3">
                                        <div className="border rounded p-3 h-100">
                                            <div className="text-muted small mb-1">Invoice</div>
                                            <div className="fw-semibold">
                                                {selectedInvoiceDetails?.invoice || "-"}
                                            </div>
                                        </div>
                                    </Col>

                                    <Col md={3} className="mb-3">
                                        <div className="border rounded p-3 h-100">
                                            <div className="text-muted small mb-1">Customer Name</div>
                                            <div className="fw-semibold">
                                                {selectedInvoiceDetails?.customer_name || "-"}
                                            </div>
                                        </div>
                                    </Col>

                                    <Col md={3} className="mb-3">
                                        <div className="border rounded p-3 h-100">
                                            <div className="text-muted small mb-1">Order Date</div>
                                            <div className="fw-semibold">
                                                {selectedInvoiceDetails?.order_date || "-"}
                                            </div>
                                        </div>
                                    </Col>

                                    <Col md={3} className="mb-3">
                                        <div className="border rounded p-3 h-100">
                                            <div className="text-muted small mb-1">Total Amount</div>
                                            <div className="fw-semibold">
                                                ₹{selectedInvoiceDetails?.total_amount ?? "-"}
                                            </div>
                                        </div>
                                    </Col>
                                </Row>

                                <div className="mt-3">
                                    <h6 className="mb-3">Products</h6>

                                    {Array.isArray(selectedInvoiceDetails?.items) &&
                                    selectedInvoiceDetails.items.length > 0 ? (
                                        <div className="table-responsive">
                                            <Table bordered className="align-middle mb-0">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th style={{ minWidth: "80px" }}>Image</th>
                                                        <th style={{ minWidth: "180px" }}>Product Name</th>
                                                        <th style={{ minWidth: "120px" }}>Product ID</th>
                                                        <th style={{ minWidth: "100px" }}>Quantity</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedInvoiceDetails.items.map((product, index) => (
                                                        <tr key={index}>
                                                            <td>
                                                                {product?.image ? (
                                                                    <img
                                                                        src={product.image}
                                                                        alt={product?.name || "product"}
                                                                        style={{
                                                                            width: "50px",
                                                                            height: "50px",
                                                                            objectFit: "cover",
                                                                            borderRadius: "8px",
                                                                            border: "1px solid #e9ecef",
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    "-"
                                                                )}
                                                            </td>
                                                            <td>{product?.name || "-"}</td>
                                                            <td>{product?.product_id || "-"}</td>
                                                            <td>{product?.quantity || "-"}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </div>
                                    ) : (
                                        <div className="text-muted">No product items found</div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="text-center text-muted py-4">
                                No invoice details available
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button color="secondary" onClick={closeInvoiceModal}>
                            Close
                        </Button>
                    </ModalFooter>
                </Modal>

                <Modal isOpen={statusModalOpen} toggle={closeStatusModal} centered>
                    <ModalHeader toggle={closeStatusModal}>
                        Update DSR Status
                    </ModalHeader>
                    <ModalBody>
                        <div className="mb-3">
                            <label className="form-label fw-semibold">Role</label>
                            <Input value={role || "-"} disabled />
                        </div>

                        <div className="mb-3">
                            <label className="form-label fw-semibold">Current Status</label>
                            <Input
                                value={formatStatusLabel(selectedReportForStatus?.status)}
                                disabled
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label fw-semibold">New Status</label>
                            <Input
                                type="select"
                                value={selectedNewStatus}
                                onChange={(e) => setSelectedNewStatus(e.target.value)}
                                disabled={statusUpdating}
                            >
                                <option value="">Select Status</option>
                                {statusOptionsForModal.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </Input>
                        </div>

                        {selectedReportForStatus ? (
                            <div className="border rounded p-3 bg-light">
                                <div className="small text-muted mb-1">Invoice</div>
                                <div className="fw-semibold mb-2">
                                    {getInvoiceText(selectedReportForStatus)}
                                </div>

                                <div className="small text-muted mb-1">Customer</div>
                                <div className="fw-semibold mb-2">
                                    {selectedReportForStatus?.customer_name || "-"}
                                </div>

                                <div className="small text-muted mb-1">Created By</div>
                                <div className="fw-semibold">
                                    {selectedReportForStatus?.created_by_name || "-"}
                                </div>
                            </div>
                        ) : null}
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            color="secondary"
                            onClick={closeStatusModal}
                            disabled={statusUpdating}
                        >
                            Cancel
                        </Button>
                        <Button
                            color="primary"
                            onClick={handleUpdateStatus}
                            disabled={statusUpdating || !selectedNewStatus}
                        >
                            {statusUpdating ? "Updating..." : "Update Status"}
                        </Button>
                    </ModalFooter>
                </Modal>

                <ToastContainer />
            </div>
        </React.Fragment>
    );
};

export default SalesTeamDivisionDailyReportPage;