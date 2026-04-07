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
import Select from "react-select";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Breadcrumbs from "../../components/Common/Breadcrumb";

const SalesData = () => {
    document.title = "Sales Team Daily Report | Beposoft";

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
    const [allocatedStateIds, setAllocatedStateIds] = useState([]);

    const [teamsLoading, setTeamsLoading] = useState(false);
    const [statesLoading, setStatesLoading] = useState(false);
    const [districtsLoading, setDistrictsLoading] = useState(false);
    const [profileLoading, setProfileLoading] = useState(false);

    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedReportId, setSelectedReportId] = useState(null);
    const [viewLoadingId, setViewLoadingId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const [searchText, setSearchText] = useState("");
    const [startDateFilter, setStartDateFilter] = useState("");
    const [endDateFilter, setEndDateFilter] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const [count, setCount] = useState(0);
    const [nextPageUrl, setNextPageUrl] = useState(null);
    const [previousPageUrl, setPreviousPageUrl] = useState(null);
    const [pageSize, setPageSize] = useState(10);

    const getAuthHeaders = () => ({
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    });

    const parsePaginatedResponse = (response) => {
        const responseData = response?.data || {};

        return {
            rows: Array.isArray(responseData?.results?.data)
                ? responseData.results.data
                : [],
            count: Number(responseData?.count || 0),
            next: responseData?.next || null,
            previous: responseData?.previous || null,
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
        customStartDate = startDateFilter,
        customEndDate = endDateFilter
    ) => {
        try {
            setTableLoading(true);
            setPageError("");

            const params = new URLSearchParams();

            if (page) params.append("page", page);
            if (customSearch?.trim()) params.append("search", customSearch.trim());
            if (customStartDate) params.append("start_date", customStartDate);
            if (customEndDate) params.append("end_date", customEndDate);

            const response = await axios.get(
                `${baseUrl}sales/team/daily/report/add/?${params.toString()}`,
                {
                    headers: getAuthHeaders(),
                }
            );

            const parsed = parsePaginatedResponse(response);

            setReports(parsed.rows);
            setCount(parsed.count);
            setNextPageUrl(parsed.next);
            setPreviousPageUrl(parsed.previous);
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
                "Failed to fetch sales team daily reports";
            setReports([]);
            setCount(0);
            setNextPageUrl(null);
            setPreviousPageUrl(null);
            setPageError(message);
            toast.error(message);
        } finally {
            setTableLoading(false);
        }
    };

    const fetchTeams = async () => {
        try {
            setTeamsLoading(true);

            const response = await axios.get(`${baseUrl}sales/teams/add/`, {
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
            ]);
            setLoading(false);
        };

        init();
    }, [token]);

    const filteredStates = useMemo(() => {
        if (!allocatedStateIds.length) return [];
        return states.filter((item) =>
            allocatedStateIds.includes(String(item.id))
        );
    }, [states, allocatedStateIds]);

    const teamOptions = useMemo(() => {
        return teams.map((item) => ({
            value: String(item.id),
            label: item.name || `Team ${item.id}`,
        }));
    }, [teams]);

    const stateOptions = useMemo(() => {
        return filteredStates.map((item) => ({
            value: String(item.id),
            label: item.name || `State ${item.id}`,
        }));
    }, [filteredStates]);

    const formik = useFormik({
        initialValues: {
            team: "",
            state: "",
            district: "",
            unbilled: 0,
            billed: 0,
            new_customers: 0,
            new_conversions: 0,
        },
        validationSchema: Yup.object({
            team: Yup.string().required("Please select team"),
            state: Yup.string().required("Please select state"),
            district: Yup.string().required("Please select district"),
            unbilled: Yup.number()
                .typeError("Unbilled must be a number")
                .min(0, "Unbilled cannot be negative")
                .required("Unbilled is required"),
            billed: Yup.number()
                .typeError("Billed must be a number")
                .min(0, "Billed cannot be negative")
                .required("Billed is required"),
            new_customers: Yup.number()
                .typeError("New customers must be a number")
                .min(0, "New customers cannot be negative")
                .required("New customers is required"),
            new_conversions: Yup.number()
                .typeError("New conversions must be a number")
                .min(0, "New conversions cannot be negative")
                .required("New conversions is required"),
        }),
        onSubmit: async (values, { resetForm }) => {
            try {
                setSubmitting(true);
                setPageError("");

                const payload = {
                    team: Number(values.team),
                    state: Number(values.state),
                    district: Number(values.district),
                    unbilled: Number(values.unbilled) || 0,
                    billed: Number(values.billed) || 0,
                    new_customers: Number(values.new_customers) || 0,
                    new_conversions: Number(values.new_conversions) || 0,
                };

                let response;

                if (isEditMode && selectedReportId) {
                    response = await axios.put(
                        `${baseUrl}sales/team/daily/report/edit/${selectedReportId}/`,
                        payload,
                        {
                            headers: getAuthHeaders(),
                        }
                    );
                } else {
                    response = await axios.post(
                        `${baseUrl}sales/team/daily/report/add/`,
                        payload,
                        {
                            headers: getAuthHeaders(),
                        }
                    );
                }

                if (response.status === 200 || response.status === 201) {
                    toast.success(
                        isEditMode
                            ? "Sales team daily report updated successfully"
                            : "Sales team daily report created successfully"
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

    const handleEdit = async (id) => {
        try {
            setViewLoadingId(id);
            setPageError("");

            const response = await axios.get(
                `${baseUrl}sales/team/daily/report/edit/${id}/`,
                {
                    headers: getAuthHeaders(),
                }
            );

            const data = response?.data?.data || {};

            const editStateId = String(getDisplayId(data?.state) || "");
            const editDistrictId = String(getDisplayId(data?.district) || "");
            const stateAllowed = allocatedStateIds.includes(editStateId);

            formik.setValues({
                team: String(getDisplayId(data?.team) || ""),
                state: stateAllowed ? editStateId : "",
                district: stateAllowed ? editDistrictId : "",
                unbilled: data?.unbilled ?? 0,
                billed: data?.billed ?? 0,
                new_customers: data?.new_customers ?? 0,
                new_conversions: data?.new_conversions ?? 0,
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

    const handleSearch = async () => {
        setCurrentPage(1);
        await fetchReports(1, searchText, startDateFilter, endDateFilter);
    };

    const handleClearFilters = async () => {
        setSearchText("");
        setStartDateFilter("");
        setEndDateFilter("");
        setCurrentPage(1);
        await fetchReports(1, "", "", "");
    };

    const totalPages = useMemo(() => {
        if (!count || !pageSize) return 1;
        return Math.ceil(count / pageSize);
    }, [count, pageSize]);

    const pageSummary = useMemo(() => {
        let totalUnbilled = 0;
        let totalBilled = 0;
        let totalNewCustomers = 0;
        let totalNewConversions = 0;

        reports.forEach((item) => {
            totalUnbilled += Number(item?.unbilled || 0);
            totalBilled += Number(item?.billed || 0);
            totalNewCustomers += Number(item?.new_customers || 0);
            totalNewConversions += Number(item?.new_conversions || 0);
        });

        return {
            totalUnbilled,
            totalBilled,
            totalNewCustomers,
            totalNewConversions,
        };
    }, [reports]);

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <Breadcrumbs
                        title="Sales"
                        breadcrumbItem="Sales Team Daily Report"
                    />

                    {loading ? (
                        <Row>
                            <Col xl={12}>
                                <Card>
                                    <CardBody className="text-center py-5">
                                        <Spinner color="primary" />
                                        <div className="mt-3">
                                            Loading sales team daily report page...
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
                                                Sales Team Daily Report List
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
                                                            ? "Update Sales Team Daily Report"
                                                            : "Create Sales Team Daily Report"}
                                                    </CardTitle>

                                                    {pageError ? (
                                                        <div className="alert alert-danger py-2">
                                                            {pageError}
                                                        </div>
                                                    ) : null}

                                                    <Form onSubmit={formik.handleSubmit}>
                                                        <Row>
                                                            <Col xl={4}>
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
                                                                                    ? String(
                                                                                          selectedOption.value
                                                                                      )
                                                                                    : ""
                                                                            );
                                                                        }}
                                                                        onBlur={() =>
                                                                            formik.setFieldTouched(
                                                                                "team",
                                                                                true
                                                                            )
                                                                        }
                                                                        isClearable
                                                                        isSearchable
                                                                        isDisabled={teamsLoading}
                                                                        classNamePrefix="react-select"
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

                                                            <Col xl={4}>
                                                                <div className="mb-3">
                                                                    <Label htmlFor="state">
                                                                        State
                                                                    </Label>
                                                                    <Select
                                                                        inputId="state"
                                                                        name="state"
                                                                        options={stateOptions}
                                                                        placeholder={
                                                                            statesLoading ||
                                                                            profileLoading
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
                                                                                    ? String(
                                                                                          selectedOption.value
                                                                                      )
                                                                                    : ""
                                                                            );
                                                                            formik.setFieldValue(
                                                                                "district",
                                                                                ""
                                                                            );
                                                                        }}
                                                                        onBlur={() =>
                                                                            formik.setFieldTouched(
                                                                                "state",
                                                                                true
                                                                            )
                                                                        }
                                                                        isClearable
                                                                        isSearchable
                                                                        isDisabled={
                                                                            statesLoading ||
                                                                            profileLoading
                                                                        }
                                                                        classNamePrefix="react-select"
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

                                                            <Col xl={4}>
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
                                                                                    ? String(
                                                                                          selectedOption.value
                                                                                      )
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
                                                        </Row>

                                                        <Row>
                                                            <Col md={3}>
                                                                <div className="mb-3">
                                                                    <Label htmlFor="unbilled">
                                                                        Unbilled
                                                                    </Label>
                                                                    <Input
                                                                        id="unbilled"
                                                                        name="unbilled"
                                                                        type="number"
                                                                        min="0"
                                                                        value={formik.values.unbilled}
                                                                        onChange={formik.handleChange}
                                                                        onBlur={formik.handleBlur}
                                                                        invalid={
                                                                            formik.touched.unbilled &&
                                                                            !!formik.errors.unbilled
                                                                        }
                                                                    />
                                                                    {formik.touched.unbilled &&
                                                                    formik.errors.unbilled ? (
                                                                        <FormFeedback>
                                                                            {formik.errors.unbilled}
                                                                        </FormFeedback>
                                                                    ) : null}
                                                                </div>
                                                            </Col>

                                                            <Col md={3}>
                                                                <div className="mb-3">
                                                                    <Label htmlFor="billed">
                                                                        Billed
                                                                    </Label>
                                                                    <Input
                                                                        id="billed"
                                                                        name="billed"
                                                                        type="number"
                                                                        min="0"
                                                                        value={formik.values.billed}
                                                                        onChange={formik.handleChange}
                                                                        onBlur={formik.handleBlur}
                                                                        invalid={
                                                                            formik.touched.billed &&
                                                                            !!formik.errors.billed
                                                                        }
                                                                    />
                                                                    {formik.touched.billed &&
                                                                    formik.errors.billed ? (
                                                                        <FormFeedback>
                                                                            {formik.errors.billed}
                                                                        </FormFeedback>
                                                                    ) : null}
                                                                </div>
                                                            </Col>

                                                            <Col md={3}>
                                                                <div className="mb-3">
                                                                    <Label htmlFor="new_customers">
                                                                        New Customers
                                                                    </Label>
                                                                    <Input
                                                                        id="new_customers"
                                                                        name="new_customers"
                                                                        type="number"
                                                                        min="0"
                                                                        value={formik.values.new_customers}
                                                                        onChange={formik.handleChange}
                                                                        onBlur={formik.handleBlur}
                                                                        invalid={
                                                                            formik.touched.new_customers &&
                                                                            !!formik.errors.new_customers
                                                                        }
                                                                    />
                                                                    {formik.touched.new_customers &&
                                                                    formik.errors.new_customers ? (
                                                                        <FormFeedback>
                                                                            {formik.errors.new_customers}
                                                                        </FormFeedback>
                                                                    ) : null}
                                                                </div>
                                                            </Col>

                                                            <Col md={3}>
                                                                <div className="mb-3">
                                                                    <Label htmlFor="new_conversions">
                                                                        New Conversions
                                                                    </Label>
                                                                    <Input
                                                                        id="new_conversions"
                                                                        name="new_conversions"
                                                                        type="number"
                                                                        min="0"
                                                                        value={
                                                                            formik.values.new_conversions
                                                                        }
                                                                        onChange={formik.handleChange}
                                                                        onBlur={formik.handleBlur}
                                                                        invalid={
                                                                            formik.touched
                                                                                .new_conversions &&
                                                                            !!formik.errors
                                                                                .new_conversions
                                                                        }
                                                                    />
                                                                    {formik.touched
                                                                        .new_conversions &&
                                                                    formik.errors
                                                                        .new_conversions ? (
                                                                        <FormFeedback>
                                                                            {
                                                                                formik.errors
                                                                                    .new_conversions
                                                                            }
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
                                            {/* <Col md={4}>
                                                <Label htmlFor="search">Search</Label>
                                                <InputGroup>
                                                    <InputGroupText>
                                                        <i className="bx bx-search" />
                                                    </InputGroupText>
                                                    <Input
                                                        id="search"
                                                        type="text"
                                                        placeholder="Search team or created by..."
                                                        value={searchText}
                                                        onChange={(e) =>
                                                            setSearchText(e.target.value)
                                                        }
                                                    />
                                                </InputGroup>
                                            </Col> */}

                                            <Col md={3}>
                                                <Label htmlFor="start_date">
                                                    Start Date
                                                </Label>
                                                <Input
                                                    id="start_date"
                                                    type="date"
                                                    value={startDateFilter}
                                                    onChange={(e) =>
                                                        setStartDateFilter(e.target.value)
                                                    }
                                                />
                                            </Col>

                                            <Col md={3}>
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

                                            <Col md={2} className="d-flex align-items-end">
                                                <div className="d-flex gap-2 w-100">
                                                    <Button
                                                        color="primary"
                                                        onClick={handleSearch}
                                                        disabled={tableLoading}
                                                        className="w-100"
                                                    >
                                                        Search
                                                    </Button>
                                                    <Button
                                                        color="light"
                                                        onClick={handleClearFilters}
                                                        disabled={tableLoading}
                                                        className="w-100"
                                                    >
                                                        Clear
                                                    </Button>
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row className="mb-3">
                                            <Col md={3}>
                                                <Card className="border shadow-none mb-0">
                                                    <CardBody className="py-3">
                                                        <h6 className="text-muted mb-1">
                                                            Total Records
                                                        </h6>
                                                        <h4 className="mb-0">{count}</h4>
                                                    </CardBody>
                                                </Card>
                                            </Col>
                                            <Col md={3}>
                                                <Card className="border shadow-none mb-0">
                                                    <CardBody className="py-3">
                                                        <h6 className="text-muted mb-1">
                                                            Page Unbilled
                                                        </h6>
                                                        <h4 className="mb-0">
                                                            {pageSummary.totalUnbilled}
                                                        </h4>
                                                    </CardBody>
                                                </Card>
                                            </Col>
                                            <Col md={3}>
                                                <Card className="border shadow-none mb-0">
                                                    <CardBody className="py-3">
                                                        <h6 className="text-muted mb-1">
                                                            Page Billed
                                                        </h6>
                                                        <h4 className="mb-0">
                                                            {pageSummary.totalBilled}
                                                        </h4>
                                                    </CardBody>
                                                </Card>
                                            </Col>
                                            <Col md={3}>
                                                <Card className="border shadow-none mb-0">
                                                    <CardBody className="py-3">
                                                        <h6 className="text-muted mb-1">
                                                            New Conversions
                                                        </h6>
                                                        <h4 className="mb-0">
                                                            {pageSummary.totalNewConversions}
                                                        </h4>
                                                    </CardBody>
                                                </Card>
                                            </Col>
                                        </Row>

                                        {tableLoading ? (
                                            <div className="text-center py-5">
                                                <Spinner color="primary" />
                                                <div className="mt-2">
                                                    Loading reports...
                                                </div>
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
                                                                <th style={{ minWidth: "70px" }}>
                                                                    #
                                                                </th>
                                                                <th style={{ minWidth: "160px" }}>
                                                                    Team
                                                                </th>
                                                                <th style={{ minWidth: "140px" }}>
                                                                    State
                                                                </th>
                                                                <th style={{ minWidth: "140px" }}>
                                                                    District
                                                                </th>
                                                                <th style={{ minWidth: "100px" }}>
                                                                    Unbilled
                                                                </th>
                                                                <th style={{ minWidth: "100px" }}>
                                                                    Billed
                                                                </th>
                                                                <th style={{ minWidth: "130px" }}>
                                                                    New Customers
                                                                </th>
                                                                <th style={{ minWidth: "140px" }}>
                                                                    New Conversions
                                                                </th>
                                                                <th style={{ minWidth: "120px" }}>
                                                                    Action
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {reports.map((item, index) => (
                                                                <tr key={item.id}>
                                                                    <td>
                                                                        {(currentPage - 1) *
                                                                            pageSize +
                                                                            index +
                                                                            1}
                                                                    </td>
                                                                    <td>{item?.team_name || "-"}</td>
                                                                    <td>{item?.state_name || "-"}</td>
                                                                    <td>{item?.district_name || "-"}</td>
                                                                    <td>{item?.unbilled ?? 0}</td>
                                                                    <td>{item?.billed ?? 0}</td>
                                                                    <td>{item?.new_customers ?? 0}</td>
                                                                    <td>{item?.new_conversions ?? 0}</td>
                                                                    <td>
                                                                        <Button
                                                                            color="info"
                                                                            size="sm"
                                                                            onClick={() =>
                                                                                handleEdit(item.id)
                                                                            }
                                                                            disabled={
                                                                                viewLoadingId ===
                                                                                item.id
                                                                            }
                                                                        >
                                                                            {viewLoadingId === item.id
                                                                                ? "Loading..."
                                                                                : "Edit"}
                                                                        </Button>
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
                                                            disabled={
                                                                !previousPageUrl ||
                                                                currentPage <= 1
                                                            }
                                                            onClick={() =>
                                                                fetchReports(currentPage - 1)
                                                            }
                                                        >
                                                            Previous
                                                        </Button>

                                                        <Button
                                                            color="light"
                                                            disabled={!nextPageUrl}
                                                            onClick={() =>
                                                                fetchReports(currentPage + 1)
                                                            }
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

export default SalesData;