import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Select from "react-select";
import {
    Badge,
    Button,
    Card,
    CardBody,
    CardTitle,
    Col,
    Container,
    Input,
    InputGroup,
    InputGroupText,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    Row,
    Spinner,
    Table,
} from "reactstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Breadcrumbs from "../../components/Common/Breadcrumb";

const TeamLeaderSalesDetailedSummary = () => {
    document.title = "Team Leader Sales Detailed Summary | Beposoft";

    const token = localStorage.getItem("token");
    const baseUrl = import.meta.env.VITE_APP_KEY;
    const cleanBaseUrl = baseUrl?.endsWith("/") ? baseUrl : `${baseUrl}/`;

    const [loading, setLoading] = useState(true);
    const [tableLoading, setTableLoading] = useState(false);
    const [pageError, setPageError] = useState("");

    const [role, setRole] = useState("");
    const [rows, setRows] = useState([]);
    const [summary, setSummary] = useState({});

    const [searchText, setSearchText] = useState("");
    const [callStatusFilter, setCallStatusFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [createdByFilter, setCreatedByFilter] = useState("");
    const [stateFilter, setStateFilter] = useState("");
    const [districtFilter, setDistrictFilter] = useState("");
    const [startDateFilter, setStartDateFilter] = useState("");
    const [endDateFilter, setEndDateFilter] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const [count, setCount] = useState(0);
    const [nextPageUrl, setNextPageUrl] = useState(null);
    const [previousPageUrl, setPreviousPageUrl] = useState(null);
    const [pageSize, setPageSize] = useState(10);

    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [selectedRowForStatus, setSelectedRowForStatus] = useState(null);
    const [selectedNewStatus, setSelectedNewStatus] = useState("");
    const [statusUpdating, setStatusUpdating] = useState(false);

    const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
    const [selectedInvoiceDetails, setSelectedInvoiceDetails] = useState(null);

    const [staffOptions, setStaffOptions] = useState([]);
    const [stateOptions, setStateOptions] = useState([]);
    const [districtOptions, setDistrictOptions] = useState([]);

    useEffect(() => {
        const role = localStorage.getItem("active");
        setRole(role);
    }, []);

    const getAuthHeaders = () => ({
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    });

    const normalize = (value) => String(value ?? "").trim().toLowerCase();
    const normalizeRole = (value) => String(value ?? "").trim().toUpperCase();

    const extractArrayFromResponse = (response) => {
        const data = response?.data;
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.data)) return data.data;
        if (Array.isArray(data?.results)) return data.results;
        if (Array.isArray(data?.results?.data)) return data.results.data;
        if (Array.isArray(data?.results?.results)) return data.results.results;
        return [];
    };

    const parseResponse = (response) => {
        const data = response?.data;
        const teams = Array.isArray(data?.data) ? data.data : [];
        let allRows = [];
        let firstSummary = {};

        teams.forEach((teamItem) => {
            const teamName = teamItem?.team?.team_name || teamItem?.team?.name || teamItem?.team_name || "No Team";
            if (!firstSummary && teamItem?.summary) {
                firstSummary = teamItem.summary;
            }

            const members = Array.isArray(teamItem?.members) ? teamItem.members : [];

            members.forEach((member) => {
                const staffName = member?.staff_name || member?.name || member?.staff || "-";
                const memberReports = Array.isArray(member?.reports) ? member.reports : [];

                memberReports.forEach((report) => {
                    allRows.push({
                        ...report,
                        team_name: report?.team || teamName,
                        staff_name: staffName,
                        member_summary: member?.summary || {},
                    });
                });
            });
        });

        return {
            rows: allRows,
            count: allRows.length,
            next: null,
            previous: null,
            summary: teams[0]?.summary || firstSummary || {},
        };
    };

    const formatLabel = (value) => {
        const normalized = normalize(value);
        if (normalized === "dsr created") return "DSR Created";
        if (normalized === "dsr approved") return "DSR Approved";
        if (normalized === "dsr confirmed") return "DSR Confirmed";
        if (normalized === "dsr rejected") return "DSR Rejected";
        if (normalized === "active") return "Active";
        if (normalized === "productive") return "Productive";
        return value || "-";
    };

    const getBadgeColor = (value) => {
        switch (normalize(value)) {
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

    const getAllowedStatusOptions = (currentRole, currentStatus) => {
        const normalizedRoleValue = normalizeRole(currentRole);
        const normalizedStatusValue = normalize(currentStatus);

        if (normalizedRoleValue === "BDM" && normalizedStatusValue === "dsr created") {
            return [
                { label: "DSR Approved", value: "dsr approved" },
                { label: "DSR Rejected", value: "dsr rejected" },
            ];
        }

        if (normalizedRoleValue === "SD" && normalizedStatusValue === "dsr approved") {
            return [
                { label: "DSR Confirmed", value: "dsr confirmed" },
                { label: "DSR Rejected", value: "dsr rejected" },
            ];
        }

        return [];
    };

    const canUpdateStatus = (currentRoleValue, currentStatus) =>
        getAllowedStatusOptions(currentRoleValue, currentStatus).length > 0;

    const getRowValue = (item, keys, fallback = "-") => {
        for (const key of keys) {
            const value = item?.[key];
            if (value !== null && value !== undefined && String(value).trim() !== "") {
                return value;
            }
        }
        return fallback;
    };

    const getCustomerName = (item) => {
        return item?.customer_name || item?.invoice?.customer?.name || "-";
    };

    const getPhone = (item) => {
        return item?.phone || item?.invoice?.customer?.phone || "-";
    };

    const getInvoiceText = (item) => {
        if (item?.invoice?.invoice) return item.invoice.invoice;
        if (item?.invoice_number) return item.invoice_number;
        if (item?.invoice_details?.invoice) return item.invoice_details.invoice;
        if (item?.invoice_details?.invoice_number) return item.invoice_details.invoice_number;
        if (item?.invoice) return item.invoice;
        return "-";
    };

    const formatCreatedAt = (value) => {
        if (!value) return "-";
        try {
            return new Date(value).toLocaleString();
        } catch {
            return String(value);
        }
    };

    const getStatusOptionsForModal = useMemo(() => {
        return getAllowedStatusOptions(role, selectedRowForStatus?.status);
    }, [role, selectedRowForStatus]);

    const createdBySelectOptions = useMemo(() => {
        return staffOptions.map((staff) => {
            const label =
                staff?.name ||
                staff?.full_name ||
                staff?.username ||
                staff?.created_by_name ||
                `Staff ${staff?.id}`;
            return { value: label, label };
        });
    }, [staffOptions]);

    const stateSelectOptions = useMemo(() => {
        return stateOptions.map((state) => {
            const label = state?.name || `State ${state?.id}`;
            return { value: label, label };
        });
    }, [stateOptions]);

    const filteredDistrictOptions = useMemo(() => {
        if (!stateFilter) return [];
        return districtOptions.filter(
            (district) => normalize(district?.state_name) === normalize(stateFilter)
        );
    }, [districtOptions, stateFilter]);

    const districtSelectOptions = useMemo(() => {
        return filteredDistrictOptions.map((district) => {
            const label = district?.name || `District ${district?.id}`;
            return { value: label, label };
        });
    }, [filteredDistrictOptions]);

    useEffect(() => {
        if (!token) {
            setLoading(false);
            setPageError("Token not found");
            return;
        }

        const fetchReferenceOptions = async () => {
            try {
                const [staffRes, stateRes, districtRes] = await Promise.all([
                    axios.get(`${cleanBaseUrl}staffs/`, { headers: getAuthHeaders() }),
                    axios.get(`${cleanBaseUrl}states/`, { headers: getAuthHeaders() }),
                    axios.get(`${cleanBaseUrl}districts/add/`, { headers: getAuthHeaders() }),
                ]);

                const allStaffs = extractArrayFromResponse(staffRes).filter((item) => {
                    const designation = String(
                        item?.designation || item?.department || item?.active || item?.role || ""
                    )
                        .trim()
                        .toUpperCase();
                    return designation === "BDM" || designation === "BDO";
                });

                setStaffOptions(allStaffs);
                setStateOptions(extractArrayFromResponse(stateRes));
                setDistrictOptions(extractArrayFromResponse(districtRes));
            } catch (error) {
                const message =
                    error?.response?.data?.message ||
                    error?.response?.data?.error ||
                    error?.message ||
                    "Failed to fetch filter options";
                toast.error(message);
            }
        };

        fetchReferenceOptions();
    }, [cleanBaseUrl, token]);

    const fetchData = async (
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

            const response = await axios.get(
                `${cleanBaseUrl}my/sales/team/detailed/summary/?${params.toString()}`,
                { headers: getAuthHeaders() }
            );

            const parsed = parseResponse(response);

            setRows(parsed.rows);
            setSummary(parsed.summary || {});
            setCount(parsed.count || parsed.rows.length || 0);
            setNextPageUrl(parsed.next);
            setPreviousPageUrl(parsed.previous);
            setCurrentPage(page);
            setPageSize(parsed.rows.length || 10);

        } catch (error) {
            const message =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.response?.data?.detail ||
                error?.message ||
                "Failed to fetch team leader sales detailed summary";

            setRows([]);
            setSummary({});
            setCount(0);
            setNextPageUrl(null);
            setPreviousPageUrl(null);
            setPageError(message);
            toast.error(message);
        } finally {
            setTableLoading(false);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!token) return;
        fetchData(1);
    }, [token, cleanBaseUrl]);

    useEffect(() => {
        if (!stateFilter) {
            setDistrictFilter("");
            return;
        }

        const exists = filteredDistrictOptions.some(
            (district) => normalize(district?.name) === normalize(districtFilter)
        );

        if (!exists) setDistrictFilter("");
    }, [stateFilter, filteredDistrictOptions, districtFilter]);

    const filteredRows = useMemo(() => {
        return rows.filter((item) => {
            const haystack = [
                getRowValue(item, ["team_name"]),
                getRowValue(item, ["staff_name"]),
                getRowValue(item, ["created_by", "created_by_name"]),
                getRowValue(item, ["state", "state_name"]),
                getRowValue(item, ["district", "district_name"]),
                getCustomerName(item),
                getPhone(item),
                getInvoiceText(item),
                getRowValue(item, ["status"]),
                getRowValue(item, ["call_status"]),
            ]
                .join(" ")
                .toLowerCase();

            if (searchText.trim() && !haystack.includes(searchText.trim().toLowerCase())) {
                return false;
            }

            if (callStatusFilter && normalize(item?.call_status) !== normalize(callStatusFilter)) {
                return false;
            }

            if (statusFilter && normalize(item?.status) !== normalize(statusFilter)) {
                return false;
            }

            if (
                createdByFilter &&
                normalize(getRowValue(item, ["staff_name", "created_by", "created_by_name"])) !== normalize(createdByFilter)
            ) {
                return false;
            }

            if (stateFilter && normalize(getRowValue(item, ["state", "state_name"])) !== normalize(stateFilter)) {
                return false;
            }

            if (districtFilter && normalize(getRowValue(item, ["district", "district_name"])) !== normalize(districtFilter)) {
                return false;
            }

            if (startDateFilter || endDateFilter) {
                const createdAt = item?.created_at ? new Date(item.created_at) : null;
                if (!createdAt || Number.isNaN(createdAt.getTime())) return false;

                if (startDateFilter) {
                    const start = new Date(`${startDateFilter}T00:00:00`);
                    if (createdAt < start) return false;
                }

                if (endDateFilter) {
                    const end = new Date(`${endDateFilter}T23:59:59`);
                    if (createdAt > end) return false;
                }
            }

            return true;
        });
    }, [
        rows,
        searchText,
        callStatusFilter,
        statusFilter,
        createdByFilter,
        stateFilter,
        districtFilter,
        startDateFilter,
        endDateFilter,
    ]);

    const groupedRows = useMemo(() => {
        const grouped = {};

        filteredRows.forEach((item) => {
            const teamName = item?.team_name?.trim() || "No Team";
            if (!grouped[teamName]) grouped[teamName] = [];
            grouped[teamName].push(item);
        });

        return Object.entries(grouped);
    }, [filteredRows]);

    const totalPages = useMemo(() => {
        if (!count || !pageSize) return 1;
        return Math.ceil(count / pageSize);
    }, [count, pageSize]);

    const openStatusModal = (row) => {
        const allowed = getAllowedStatusOptions(role, row?.status);
        if (!allowed.length) {
            toast.warning("You are not allowed to update this status");
            return;
        }

        setSelectedRowForStatus(row);
        setSelectedNewStatus("");
        setStatusModalOpen(true);
    };

    const closeStatusModal = () => {
        if (statusUpdating) return;
        setStatusModalOpen(false);
        setSelectedRowForStatus(null);
        setSelectedNewStatus("");
    };

    const handleUpdateStatus = async () => {
        if (!selectedRowForStatus?.id) {
            toast.error("Invalid row selected");
            return;
        }

        if (!selectedNewStatus) {
            toast.error("Please select a new status");
            return;
        }

        const allowedValues = getAllowedStatusOptions(role, selectedRowForStatus?.status).map(
            (item) => item.value
        );

        if (!allowedValues.includes(selectedNewStatus)) {
            toast.error("This status change is not allowed for your role");
            return;
        }

        try {
            setStatusUpdating(true);

            await axios.patch(
                `${cleanBaseUrl}sales/team/member/daily/report/status/${selectedRowForStatus.id}/`,
                { status: selectedNewStatus },
                { headers: getAuthHeaders() }
            );

            setRows((prev) =>
                prev.map((item) =>
                    item.id === selectedRowForStatus.id ? { ...item, status: selectedNewStatus } : item
                )
            );

            toast.success(`Status updated to ${formatLabel(selectedNewStatus)} successfully`);
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

    const handleSearch = async () => {
        setCurrentPage(1);
        await fetchData(
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
        await fetchData(1, "", "", "", "", "", "", "", "");
    };

    const openInvoiceModal = (invoiceDetails) => {
        setSelectedInvoiceDetails(invoiceDetails || null);
        setInvoiceModalOpen(true);
    };

    const closeInvoiceModal = () => {
        setInvoiceModalOpen(false);
        setSelectedInvoiceDetails(null);
    };

    const searchableSelectStyles = {
        control: (provided, state) => ({
            ...provided,
            minHeight: "38px",
            borderColor: state.isFocused ? "#556ee6" : "#ced4da",
            boxShadow: state.isFocused ? "0 0 0 0.2rem rgba(85, 110, 230, 0.25)" : "none",
            "&:hover": {
                borderColor: state.isFocused ? "#556ee6" : "#adb5bd",
            },
        }),
        menu: (provided) => ({
            ...provided,
            zIndex: 9999,
        }),
    };

    const summaryStaffCount = Number(
        summary?.staff_count ?? summary?.total_bdo_count ?? summary?.total_staff ?? summary?.team_member_count ?? 0
    );
    const summaryCallDuration = summary?.total_call_duration ?? summary?.call_duration ?? "00:00:00";
    const summaryAverage = Number(
        summary?.call_duration_average_8hrs ?? summary?.call_duration_percentage_8hrs ?? summary?.avg_8hrs_percent ?? 0
    );
    const summaryTotalBill = Number(summary?.total_bill ?? 0);
    const summaryTotalVolume = Number(summary?.total_volume ?? 0);
    const summaryTotalCallCount = Number(summary?.total_call_count ?? 0);

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <Breadcrumbs title="Sales" breadcrumbItem="Team Leader Sales Detailed Summary" />

                    {loading ? (
                        <Row>
                            <Col xl={12}>
                                <Card>
                                    <CardBody className="text-center py-5">
                                        <Spinner color="primary" />
                                        <div className="mt-3">Loading team leader sales detailed summary...</div>
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
                                            <CardTitle className="mb-0">Team Leader Sales Detailed Summary</CardTitle>
                                            <div className="d-flex gap-2 flex-wrap">
                                                <Button color="primary" outline onClick={() => fetchData(currentPage)} disabled={tableLoading}>
                                                    {tableLoading ? "Refreshing..." : "Refresh"}
                                                </Button>
                                            </div>
                                        </div>

                                        {pageError ? <div className="alert alert-danger py-2">{pageError}</div> : null}

                                        <Row className="mb-3">
                                            <Col md={3}>
                                                <label htmlFor="search" className="form-label">Search</label>
                                                <InputGroup>
                                                    <InputGroupText>
                                                        <i className="bx bx-search" />
                                                    </InputGroupText>
                                                    <Input
                                                        id="search"
                                                        type="text"
                                                        placeholder="Search team, customer, phone, invoice..."
                                                        value={searchText}
                                                        onChange={(e) => setSearchText(e.target.value)}
                                                    />
                                                </InputGroup>
                                            </Col>

                                            <Col md={2}>
                                                <label htmlFor="call_status_filter" className="form-label">Call Status</label>
                                                <Input
                                                    id="call_status_filter"
                                                    type="select"
                                                    value={callStatusFilter}
                                                    onChange={(e) => setCallStatusFilter(e.target.value)}
                                                >
                                                    <option value="">All</option>
                                                    <option value="active">Active</option>
                                                    <option value="productive">Productive</option>
                                                </Input>
                                            </Col>

                                            <Col md={2}>
                                                <label htmlFor="status_filter" className="form-label">Status</label>
                                                <Input
                                                    id="status_filter"
                                                    type="select"
                                                    value={statusFilter}
                                                    onChange={(e) => setStatusFilter(e.target.value)}
                                                >
                                                    <option value="">All</option>
                                                    <option value="dsr created">DSR Created</option>
                                                    <option value="dsr approved">DSR Approved</option>
                                                    <option value="dsr confirmed">DSR Confirmed</option>
                                                    <option value="dsr rejected">DSR Rejected</option>
                                                </Input>
                                            </Col>

                                            <Col md={2}>
                                                <label htmlFor="created_by_filter" className="form-label">Created By</label>
                                                <Select
                                                    inputId="created_by_filter"
                                                    options={createdBySelectOptions}
                                                    value={createdBySelectOptions.find((o) => o.value === createdByFilter) || null}
                                                    onChange={(selected) => setCreatedByFilter(selected ? selected.value : "")}
                                                    isClearable
                                                    isSearchable
                                                    placeholder="Select Created By"
                                                    styles={searchableSelectStyles}
                                                />
                                            </Col>

                                            <Col md={3}>
                                                <label htmlFor="state_filter" className="form-label">State</label>
                                                <Select
                                                    inputId="state_filter"
                                                    options={stateSelectOptions}
                                                    value={stateSelectOptions.find((o) => o.value === stateFilter) || null}
                                                    onChange={(selected) => {
                                                        setStateFilter(selected ? selected.value : "");
                                                        setDistrictFilter("");
                                                    }}
                                                    isClearable
                                                    isSearchable
                                                    placeholder="Select State"
                                                    styles={searchableSelectStyles}
                                                />
                                            </Col>
                                        </Row>

                                        <Row className="mb-3">
                                            <Col md={3}>
                                                <label htmlFor="district_filter" className="form-label">District</label>
                                                <Select
                                                    inputId="district_filter"
                                                    options={districtSelectOptions}
                                                    value={districtSelectOptions.find((o) => o.value === districtFilter) || null}
                                                    onChange={(selected) => setDistrictFilter(selected ? selected.value : "")}
                                                    isClearable
                                                    isSearchable
                                                    placeholder={stateFilter ? "Select District" : "Select State First"}
                                                    isDisabled={!stateFilter}
                                                    styles={searchableSelectStyles}
                                                />
                                            </Col>

                                            <Col md={2}>
                                                <label htmlFor="start_date" className="form-label">Start Date</label>
                                                <Input
                                                    id="start_date"
                                                    type="date"
                                                    value={startDateFilter}
                                                    onChange={(e) => setStartDateFilter(e.target.value)}
                                                />
                                            </Col>

                                            <Col md={2}>
                                                <label htmlFor="end_date" className="form-label">End Date</label>
                                                <Input
                                                    id="end_date"
                                                    type="date"
                                                    value={endDateFilter}
                                                    onChange={(e) => setEndDateFilter(e.target.value)}
                                                />
                                            </Col>

                                            <Col md={2} className="d-flex align-items-end">
                                                <Button color="primary" onClick={handleSearch} disabled={tableLoading} className="w-100">
                                                    Search
                                                </Button>
                                            </Col>

                                            <Col md={3} className="d-flex align-items-end">
                                                <Button color="light" onClick={handleClearFilters} disabled={tableLoading} className="w-100">
                                                    Clear Filters
                                                </Button>
                                            </Col>
                                        </Row>

                                        <Row className="mb-3">
                                            <Col md={4} className="mb-3">
                                                <Card className="border shadow-none mb-0">
                                                    <CardBody className="py-3">
                                                        <h6 className="text-muted mb-1">Staff Count</h6>
                                                        <h4 className="mb-0">{summaryStaffCount}</h4>
                                                    </CardBody>
                                                </Card>
                                            </Col>

                                            <Col md={4} className="mb-3">
                                                <Card className="border shadow-none mb-0">
                                                    <CardBody className="py-3">
                                                        <h6 className="text-muted mb-1">Total Call Duration</h6>
                                                        <h4 className="mb-0">{summaryCallDuration}</h4>
                                                    </CardBody>
                                                </Card>
                                            </Col>

                                            <Col md={4} className="mb-3">
                                                <Card className="border shadow-none mb-0">
                                                    <CardBody className="py-3">
                                                        <h6 className="text-muted mb-1">Call Duration Average 8 Hours %</h6>
                                                        <h4 className="mb-0">{summaryAverage.toFixed(2)}%</h4>
                                                    </CardBody>
                                                </Card>
                                            </Col>

                                            <Col md={3} className="mb-3">
                                                <Card className="border shadow-none mb-0">
                                                    <CardBody className="py-3">
                                                        <h6 className="text-muted mb-1">Total Bill</h6>
                                                        <h4 className="mb-0">{summaryTotalBill}</h4>
                                                    </CardBody>
                                                </Card>
                                            </Col>

                                            <Col md={3} className="mb-3">
                                                <Card className="border shadow-none mb-0">
                                                    <CardBody className="py-3">
                                                        <h6 className="text-muted mb-1">Total Volume</h6>
                                                        <h4 className="mb-0">{summaryTotalVolume}</h4>
                                                    </CardBody>
                                                </Card>
                                            </Col>

                                            <Col md={3} className="mb-3">
                                                <Card className="border shadow-none mb-0">
                                                    <CardBody className="py-3">
                                                        <h6 className="text-muted mb-1">Total Call Count</h6>
                                                        <h4 className="mb-0">{summaryTotalCallCount}</h4>
                                                    </CardBody>
                                                </Card>
                                            </Col>

                                            <Col md={3} className="mb-3">
                                                <Card className="border shadow-none mb-0">
                                                    <CardBody className="py-3">
                                                        <h6 className="text-muted mb-1">Reports</h6>
                                                        <h4 className="mb-0">{count}</h4>
                                                    </CardBody>
                                                </Card>
                                            </Col>
                                        </Row>

                                        {tableLoading ? (
                                            <div className="text-center py-5">
                                                <Spinner color="primary" />
                                                <div className="mt-2">Loading summary...</div>
                                            </div>
                                        ) : filteredRows.length === 0 ? (
                                            <div className="text-center py-5 text-muted">No data found</div>
                                        ) : (
                                            <>
                                                <div className="table-responsive">
                                                    <Table className="table table-bordered align-middle mb-0" hover>
                                                        <tbody>
                                                            {groupedRows.map(([teamName, teamRows], teamIndex) => (
                                                                <React.Fragment key={`${teamName}-${teamIndex}`}>
                                                                    <tr className="table-primary">
                                                                        <td colSpan="13" className="fw-bold">
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
                                                                        for (let i = 0; i < teamIndex; i += 1) {
                                                                            serialNumber += groupedRows[i][1].length;
                                                                        }
                                                                        serialNumber += index + 1;

                                                                        const allowedToUpdate = canUpdateStatus(role, item?.status);
                                                                        const callDurationPercentage =
                                                                            item?.call_duration_percentage_8hrs ??
                                                                            item?.call_duration_avg_8hrs ??
                                                                            item?.member_summary?.call_duration_percentage_8hrs ??
                                                                            item?.member_summary?.call_duration_avg_8hrs ??
                                                                            null;

                                                                        return (
                                                                            <tr key={item?.id ?? `${teamName}-${index}`}>
                                                                                <td>{serialNumber}</td>
                                                                                <td>{item?.staff_name || item?.created_by || item?.created_by_name || "-"}</td>
                                                                                <td>{getRowValue(item, ["state", "state_name"])}</td>
                                                                                <td>{getRowValue(item, ["district", "district_name"])}</td>
                                                                                <td>
                                                                                    {item?.invoice ? (
                                                                                        <Button
                                                                                            color="link"
                                                                                            className="p-0 text-decoration-none fw-semibold"
                                                                                            onClick={() => openInvoiceModal(item.invoice)}
                                                                                        >
                                                                                            {getInvoiceText(item)}
                                                                                        </Button>
                                                                                    ) : (
                                                                                        getInvoiceText(item)
                                                                                    )}
                                                                                </td>
                                                                                <td>{getCustomerName(item)}</td>
                                                                                <td>{getPhone(item)}</td>
                                                                                <td>
                                                                                    <Badge color={getBadgeColor(item?.call_status)}>
                                                                                        {formatLabel(item?.call_status)}
                                                                                    </Badge>
                                                                                </td>
                                                                                <td>
                                                                                    <Badge color={getBadgeColor(item?.status)}>
                                                                                        {formatLabel(item?.status)}
                                                                                    </Badge>
                                                                                </td>
                                                                                <td>
                                                                                    {allowedToUpdate ? (
                                                                                        <Button color="primary" size="sm" onClick={() => openStatusModal(item)}>
                                                                                            Update
                                                                                        </Button>
                                                                                    ) : (
                                                                                        <span className="text-muted">No Action</span>
                                                                                    )}
                                                                                </td>
                                                                                <td>{item?.call_duration || "-"}</td>
                                                                                <td>
                                                                                    {(() => {
                                                                                        const value =
                                                                                            item?.call_duration_percentage_8hrs ??
                                                                                            item?.member_summary?.call_duration_percentage_8hrs;

                                                                                        if (value === null || value === undefined) return "-";

                                                                                        const num = Number(value);

                                                                                        if (Number.isNaN(num)) return "-";

                                                                                        return `${num.toFixed(2)}%`;
                                                                                    })()}
                                                                                </td>
                                                                                <td>{formatCreatedAt(item?.created_at)}</td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </React.Fragment>
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
                                                            onClick={() => fetchData(currentPage - 1)}
                                                        >
                                                            Previous
                                                        </Button>

                                                        <Button
                                                            color="light"
                                                            disabled={!nextPageUrl}
                                                            onClick={() => fetchData(currentPage + 1)}
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

                <Modal isOpen={statusModalOpen} toggle={closeStatusModal} centered>
                    <ModalHeader toggle={closeStatusModal}>Update DSR Status</ModalHeader>
                    <ModalBody>
                        <div className="mb-3">
                            <label className="form-label fw-semibold">Role</label>
                            <Input value={role || "-"} disabled />
                        </div>

                        <div className="mb-3">
                            <label className="form-label fw-semibold">Current Status</label>
                            <Input value={formatLabel(selectedRowForStatus?.status)} disabled />
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
                                {getStatusOptionsForModal.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </Input>
                        </div>

                        {selectedRowForStatus ? (
                            <div className="border rounded p-3 bg-light">
                                <div className="small text-muted mb-1">Invoice</div>
                                <div className="fw-semibold mb-2">{getInvoiceText(selectedRowForStatus)}</div>

                                <div className="small text-muted mb-1">Customer</div>
                                <div className="fw-semibold mb-2">{getCustomerName(selectedRowForStatus)}</div>

                                <div className="small text-muted mb-1">Created By</div>
                                <div className="fw-semibold">
                                    {selectedRowForStatus?.staff_name || selectedRowForStatus?.created_by || selectedRowForStatus?.created_by_name || "-"}
                                </div>
                            </div>
                        ) : null}
                    </ModalBody>
                    <ModalFooter>
                        <Button color="secondary" onClick={closeStatusModal} disabled={statusUpdating}>
                            Cancel
                        </Button>
                        <Button color="primary" onClick={handleUpdateStatus} disabled={statusUpdating || !selectedNewStatus}>
                            {statusUpdating ? "Updating..." : "Update Status"}
                        </Button>
                    </ModalFooter>
                </Modal>

                <Modal isOpen={invoiceModalOpen} toggle={closeInvoiceModal} size="lg" centered>
                    <ModalHeader toggle={closeInvoiceModal}>Invoice Details</ModalHeader>
                    <ModalBody>
                        {selectedInvoiceDetails ? (
                            <>
                                <Row className="mb-3">
                                    <Col md={3} className="mb-3">
                                        <div className="border rounded p-3 h-100">
                                            <div className="text-muted small mb-1">Invoice</div>
                                            <div className="fw-semibold">{selectedInvoiceDetails?.invoice || "-"}</div>
                                        </div>
                                    </Col>

                                    <Col md={3} className="mb-3">
                                        <div className="border rounded p-3 h-100">
                                            <div className="text-muted small mb-1">Customer Name</div>
                                            <div className="fw-semibold">
                                                {selectedInvoiceDetails?.customer?.name || selectedInvoiceDetails?.customer_name || "-"}
                                            </div>
                                        </div>
                                    </Col>

                                    <Col md={3} className="mb-3">
                                        <div className="border rounded p-3 h-100">
                                            <div className="text-muted small mb-1">Order Date</div>
                                            <div className="fw-semibold">{selectedInvoiceDetails?.order_date || "-"}</div>
                                        </div>
                                    </Col>

                                    <Col md={3} className="mb-3">
                                        <div className="border rounded p-3 h-100">
                                            <div className="text-muted small mb-1">Total Amount</div>
                                            <div className="fw-semibold">₹{selectedInvoiceDetails?.invoice_total ?? selectedInvoiceDetails?.total_amount ?? "-"}</div>
                                        </div>
                                    </Col>
                                </Row>

                                <div className="mt-3">
                                    <h6 className="mb-3">Products</h6>
                                    {Array.isArray(selectedInvoiceDetails?.items) && selectedInvoiceDetails.items.length > 0 ? (
                                        <div className="table-responsive">
                                            <Table bordered className="align-middle mb-0">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th style={{ minWidth: "80px" }}>Image</th>
                                                        <th style={{ minWidth: "180px" }}>Product Name</th>
                                                        <th style={{ minWidth: "100px" }}>Quantity</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedInvoiceDetails.items.map((product, index) => (
                                                        <tr key={index}>
                                                            <td>
                                                                {product?.product?.image ? (
                                                                    <img
                                                                        src={product.product.image}
                                                                        alt={product?.product?.name || "product"}
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
                                                            <td>{product?.product?.name || "-"}</td>
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
                            <div className="text-center text-muted py-4">No invoice details available</div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button color="secondary" onClick={closeInvoiceModal}>
                            Close
                        </Button>
                    </ModalFooter>
                </Modal>

                <ToastContainer />
            </div>
        </React.Fragment>
    );
};

export default TeamLeaderSalesDetailedSummary;
