import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Select from "react-select";
import {
    Button,
    Card,
    CardBody,
    CardTitle,
    Col,
    Container,
    Form,
    FormGroup,
    Input,
    Label,
    Row,
    Spinner,
    Table,
    Alert,
} from "reactstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useParams } from "react-router-dom";
import Breadcrumbs from "../../components/Common/Breadcrumb";

const initialFilters = {
    search: "",
    start_date: "",
    end_date: "",
    staff_id: "",
    state_id: "",
    district_id: "",
    invoice_id: "",
    customer_id: "",
};
const TeamDetailsPage = () => {
    document.title = "Team Details | Beposoft";

    const { teamId } = useParams();

    const token = localStorage.getItem("token");
    const baseUrl = import.meta.env.VITE_APP_KEY;

    const [loading, setLoading] = useState(true);
    const [dropdownLoading, setDropdownLoading] = useState(false);
    const [error, setError] = useState("");

    const [team, setTeam] = useState({});
    const [summary, setSummary] = useState({});
    const [members, setMembers] = useState([]);
    const [filters, setFilters] = useState({ ...initialFilters });

    const [staffOptions, setStaffOptions] = useState([]);
    const [invoiceOptions, setInvoiceOptions] = useState([]);
    const [stateOptions, setStateOptions] = useState([]);
    const [districtOptions, setDistrictOptions] = useState([]);
    const [customerOptions, setCustomerOptions] = useState([]);

    const [staffSearch, setStaffSearch] = useState("");
    const [invoiceSearch, setInvoiceSearch] = useState("");
    const [customerSearch, setCustomerSearch] = useState("");
    const sectionHeader = {
        textAlign: "center",
        fontWeight: "700",
        fontSize: "18px",
        letterSpacing: "1px",
        color: "#344767",
        marginBottom: "20px",
        position: "relative"
    };

    const getHeaders = () => ({
        Authorization: `Bearer ${token}`,
    });

    const fetchStaff = async (search = "") => {
        try {
            const response = await axios.get(`${baseUrl}get/staffs/`, {
                headers: getHeaders(),
                params: { search },
            });

            const staffs = response?.data?.results?.data || [];

            const formattedStaffs = staffs.map(item => ({
                value: String(item?.id || ""),
                label: `${item?.name || ""} - ${item?.designation || ""}`, // ✅ name + designation
            }));

            setStaffOptions(formattedStaffs);

        } catch (err) {
            console.error("Staff API error:", err?.response?.data || err?.message);
            toast.error("Failed to load staff options");
            setStaffOptions([]);
        }
    };

    const fetchInvoices = async (search = "") => {
        try {
            const response = await axios.get(`${baseUrl}orders/`, {
                headers: getHeaders(),
                params: { search },
            });

            const invoices = response?.data?.results?.results || [];

            const formattedInvoices = invoices.map(item => ({
                value: item.invoice,
                label: `${item.invoice} - ${item.customer?.name || ""}`,
            }));

            setInvoiceOptions(formattedInvoices);

        } catch (err) {
            console.error(err);
            setInvoiceOptions([]);
        }
    };

    const fetchCustomers = async (search = "") => {
        try {
            const response = await axios.get(`${baseUrl}customers/`, {
                headers: getHeaders(),
                params: {
                    search: search || "",
                },
            });

            setCustomerOptions(response?.data?.results || []);
        } catch (err) {
            console.error("Customer API error:", err?.response?.data || err?.message);
            toast.error("Failed to load customer options");
            setCustomerOptions([]);
        }
    };

    const fetchDropdowns = async () => {
        setDropdownLoading(true);

        try {
            const [stateRes, districtRes] = await Promise.allSettled([
                axios.get(`${baseUrl}states/`, { headers: getHeaders() }),
                axios.get(`${baseUrl}districts/add/`, { headers: getHeaders() }),
            ]);

            if (stateRes.status === "fulfilled") {
                setStateOptions(stateRes.value?.data?.data || []);
            } else {
                setStateOptions([]);
            }

            if (districtRes.status === "fulfilled") {
                setDistrictOptions(districtRes.value?.data?.data || []);
            } else {
                setDistrictOptions([]);
            }

            await Promise.all([fetchStaff(), fetchInvoices(), fetchCustomers()]);
        } catch (err) {
            console.error("Dropdown error:", err);
            toast.error("Failed to load dropdown options");
        } finally {
            setDropdownLoading(false);
        }
    };

    const fetchData = async (appliedFilters = filters) => {
        if (!teamId) return;

        setLoading(true);
        setError("");

        try {
            const response = await axios.get(
                `${baseUrl}team/detailed/summary/${teamId}/`,
                {
                    headers: getHeaders(),
                    params: {
                        search: appliedFilters.search || "",
                        start_date: appliedFilters.start_date || "",
                        end_date: appliedFilters.end_date || "",
                        staff_id: appliedFilters.staff_id || "",
                        state_id: appliedFilters.state_id || "",
                        district_id: appliedFilters.district_id || "",
                        invoice_id: appliedFilters.invoice_id || "",
                        customer_id: appliedFilters.customer_id || "",
                    },
                }
            );

            const result = response?.data?.results || {};

            setTeam(result.team || {});
            setSummary(result.summary || {});
            setMembers(result.members || []);
        } catch (err) {
            const message =
                err?.response?.data?.message ||
                err?.response?.data?.detail ||
                "Failed to load team summary.";

            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!token || !teamId) {
            setLoading(false);
            return;
        }

        fetchDropdowns();
        fetchData();
    }, [teamId, token]);

    useEffect(() => {
        if (!staffSearch.trim()) return;

        const timer = setTimeout(() => {
            fetchStaff(staffSearch);
        }, 400);

        return () => clearTimeout(timer);
    }, [staffSearch]);

    useEffect(() => {
        if (!invoiceSearch.trim()) return;

        const timer = setTimeout(() => {
            fetchInvoices(invoiceSearch);
        }, 400);

        return () => clearTimeout(timer);
    }, [invoiceSearch]);

    useEffect(() => {
        if (!customerSearch.trim()) return;

        const timer = setTimeout(() => {
            fetchCustomers(customerSearch);
        }, 400);

        return () => clearTimeout(timer);
    }, [customerSearch]);

    const staffSelectOptions = useMemo(
        () => staffOptions, 
        [staffOptions]
    );

    const invoiceSelectOptions = useMemo(
        () => invoiceOptions, 
        [invoiceOptions]
    );

    const customerSelectOptions = useMemo(
        () =>
            customerOptions.map((item) => ({
                value: String(item?.id || ""),
                label: item?.name || `Customer #${item?.id || ""}`,
            })),
        [customerOptions]
    );

    const stateSelectOptions = useMemo(
        () =>
            stateOptions.map((state) => ({
                value: String(state?.id || state?.state_id || ""),
                label: state?.name || state?.state_name || `State #${state?.id || state?.state_id || ""}`,
            })),
        [stateOptions]
    );

    const selectedStateObj = useMemo(() => {
        if (!filters.state_id) return null;

        return (
            stateOptions.find(
                (state) => String(state?.id || state?.state_id || "") === String(filters.state_id)
            ) || null
        );
    }, [filters.state_id, stateOptions]);

    const filteredDistrictOptions = useMemo(() => {
        if (!filters.state_id) return [];

        const selectedStateName = String(
            selectedStateObj?.name || selectedStateObj?.state_name || ""
        )
            .trim()
            .toLowerCase();

        return districtOptions.filter((district) => {
            const districtStateId = String(district?.state_id || district?.state?.id || "");
            if (districtStateId && districtStateId === String(filters.state_id)) return true;

            return (
                String(district?.state_name || "")
                    .trim()
                    .toLowerCase() === selectedStateName
            );
        });
    }, [districtOptions, filters.state_id, selectedStateObj]);

    const districtSelectOptions = useMemo(
        () =>
            filteredDistrictOptions.map((district) => ({
                value: String(district?.id || district?.district_id || ""),
                label:
                    district?.name ||
                    district?.district_name ||
                    `District #${district?.id || district?.district_id || ""}`,
            })),
        [filteredDistrictOptions]
    );

    const selectedStaffOption = useMemo(
        () => staffSelectOptions.find((o) => o.value === filters.staff_id) || null,
        [filters.staff_id, staffSelectOptions]
    );

    const selectedInvoiceOption = useMemo(
        () => invoiceSelectOptions.find((o) => o.value === filters.invoice_id) || null,
        [filters.invoice_id, invoiceSelectOptions]
    );

    const selectedCustomerOption = useMemo(
        () => customerSelectOptions.find((o) => o.value === filters.customer_id) || null,
        [filters.customer_id, customerSelectOptions]
    );

    const selectedStateOption = useMemo(
        () => stateSelectOptions.find((o) => o.value === filters.state_id) || null,
        [filters.state_id, stateSelectOptions]
    );

    const selectedDistrictOption = useMemo(
        () => districtSelectOptions.find((o) => o.value === filters.district_id) || null,
        [districtSelectOptions, filters.district_id]
    );

    useEffect(() => {
        if (!filters.state_id && filters.district_id) {
            setFilters((prev) => ({ ...prev, district_id: "" }));
            return;
        }

        if (filters.state_id && filters.district_id) {
            const exists = filteredDistrictOptions.some(
                (d) => String(d?.id || d?.district_id || "") === String(filters.district_id)
            );

            if (!exists) {
                setFilters((prev) => ({ ...prev, district_id: "" }));
            }
        }
    }, [filteredDistrictOptions, filters.district_id, filters.state_id]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchData(filters);
    };

    const handleClearFilters = () => {
        const cleared = { ...initialFilters };
        setFilters(cleared);
        setStaffSearch("");
        setInvoiceSearch("");
        setCustomerSearch("");
        fetchData(cleared);
    };

    const { totalInvoiceAmount, memberRows } = useMemo(() => {
        const rows = members.map((member) => {
            const invoiceAmount =
                member?.reports?.reduce(
                    (sum, report) => sum + Number(report?.invoice?.invoice_total || 0),
                    0
                ) || 0;

            return { ...member, invoiceAmount };
        });

        const total = rows.reduce(
            (grandTotal, member) => grandTotal + Number(member.invoiceAmount || 0),
            0
        );

        return {
            totalInvoiceAmount: total,
            memberRows: rows,
        };
    }, [members]);

    const activeFilterCount = useMemo(
        () => Object.values(filters).filter((value) => String(value ?? "").trim() !== "").length,
        [filters]
    );

    const selectStyles = {
        control: (provided, state) => ({
            ...provided,
            minHeight: "38px",
            borderColor: state.isFocused ? "#556ee6" : "#ced4da",
            boxShadow: state.isFocused ? "0 0 0 0.2rem rgba(85,110,230,0.25)" : "none",
            "&:hover": { borderColor: state.isFocused ? "#556ee6" : "#adb5bd" },
        }),
        menu: (provided) => ({ ...provided, zIndex: 9999 }),
    };

    const statBox = {
        borderRadius: "14px",
        border: "1px solid #e5e7eb",
        background: "#fff",
        padding: "16px",
        height: "100%",
    };

    const rowItem = {
        display: "flex",
        justifyContent: "space-between",
        padding: "6px 0",
        borderBottom: "1px solid #f3f4f6",
    };

   const HourlyDurationsTable = ({ hourlyDurations }) => {
    if (!hourlyDurations || Object.keys(hourlyDurations).length === 0) return null;

    const slots = Object.keys(hourlyDurations);
    const values = Object.values(hourlyDurations);

    return (
        <div className="mt-3">
            <div className="fw-semibold text-muted mb-2 text-center">
                Hourly Durations (mins)
            </div>

            <div
                style={{
                    overflowX: "auto",
                    WebkitOverflowScrolling: "touch",
                    borderRadius: "10px",
                    border: "1px solid #e5e7eb"
                }}
            >
                <Table
                    bordered
                    size="sm"
                    className="mb-0"
                    style={{
                        minWidth: "600px", 
                        fontSize: "13px"
                    }}
                >
                    <thead className="table-light">
                        <tr>
                            {slots.map((slot) => (
                                <th
                                    key={slot}
                                    className="text-center"
                                    style={{
                                        whiteSpace: "nowrap",
                                        padding: "8px"
                                    }}
                                >
                                    {slot}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        <tr>
                            {values.map((val, i) => (
                                <td
                                    key={i}
                                    className="text-center"
                                    style={{
                                        padding: "8px",
                                        fontWeight: "500"
                                    }}
                                >
                                    {Number(val).toFixed(1)}
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </Table>
            </div>
        </div>
    );
};

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <Breadcrumbs title="Sales" breadcrumbItem="Team Details" />

                

                    {error ? (
                        <Alert color="danger" className="mb-4">
                            {error}
                        </Alert>
                    ) : null}

                    <Row>
                        <Col xl={12}>
                            <Card className="shadow-sm">
                                <CardBody>
                                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
                                        <CardTitle className="mb-0">
                                            {team?.team_name || "Team Details"}
                                        </CardTitle>
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="text-muted small">
                                                Active Filters: <strong>{activeFilterCount}</strong>
                                            </div>
                                            <Button
                                                color="primary"
                                                outline
                                                onClick={() => fetchData(filters)}
                                                disabled={loading || dropdownLoading}
                                            >
                                                {loading ? "Refreshing..." : "Refresh"}
                                            </Button>
                                        </div>
                                    </div>

                                    <Form onSubmit={handleSearch}>
                                        <Row className="g-3 mb-3">
                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label className="fw-semibold">Search</Label>
                                                    <Input
                                                        type="text"
                                                        name="search"
                                                        value={filters.search}
                                                        onChange={handleFilterChange}
                                                        placeholder="Search team, customer, phone, invoice..."
                                                        disabled={dropdownLoading}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label className="fw-semibold">Staff</Label>
                                                    <Select
                                                        inputId="staff_id"
                                                        options={staffSelectOptions}
                                                        value={selectedStaffOption}
                                                        onChange={(selected) =>
                                                            setFilters((prev) => ({
                                                                ...prev,
                                                                staff_id: selected ? selected.value : "",
                                                            }))
                                                        }
                                                        onInputChange={(val) => setStaffSearch(val)}
                                                        isClearable
                                                        isSearchable
                                                        placeholder="Search & select staff..."
                                                        styles={selectStyles}
                                                        isDisabled={dropdownLoading}
                                                        noOptionsMessage={() =>
                                                            dropdownLoading ? "Loading..." : "No staff found"
                                                        }
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label className="fw-semibold">Customer</Label>
                                                    <Select
                                                        inputId="customer_id"
                                                        options={customerSelectOptions}
                                                        value={selectedCustomerOption}
                                                        onChange={(selected) =>
                                                            setFilters((prev) => ({
                                                                ...prev,
                                                                customer_id: selected ? selected.value : "",
                                                            }))
                                                        }
                                                        onInputChange={(val) => setCustomerSearch(val)}
                                                        isClearable
                                                        isSearchable
                                                        placeholder="Search & select customer..."
                                                        styles={selectStyles}
                                                        isDisabled={dropdownLoading}
                                                        noOptionsMessage={() =>
                                                            dropdownLoading ? "Loading..." : "No customers found"
                                                        }
                                                    />
                                                </FormGroup>
                                            </Col>
                                        </Row>

                                        <Row className="g-3 mb-3">
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label className="fw-semibold">State</Label>
                                                    <Select
                                                        inputId="state_id"
                                                        options={stateSelectOptions}
                                                        value={selectedStateOption}
                                                        onChange={(selected) =>
                                                            setFilters((prev) => ({
                                                                ...prev,
                                                                state_id: selected ? selected.value : "",
                                                                district_id: "",
                                                            }))
                                                        }
                                                        isClearable
                                                        isSearchable
                                                        placeholder="Select State"
                                                        styles={selectStyles}
                                                        isDisabled={dropdownLoading}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label className="fw-semibold">District</Label>
                                                    <Select
                                                        inputId="district_id"
                                                        options={districtSelectOptions}
                                                        value={selectedDistrictOption}
                                                        onChange={(selected) =>
                                                            setFilters((prev) => ({
                                                                ...prev,
                                                                district_id: selected ? selected.value : "",
                                                            }))
                                                        }
                                                        isClearable
                                                        isSearchable
                                                        placeholder={
                                                            filters.state_id ? "Select District" : "Select State First"
                                                        }
                                                        isDisabled={!filters.state_id || dropdownLoading}
                                                        styles={selectStyles}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label className="fw-semibold">Invoice</Label>
                                                    <Select
                                                        inputId="invoice_id"
                                                        options={invoiceSelectOptions}
                                                        value={selectedInvoiceOption}
                                                        onChange={(selected) =>
                                                            setFilters((prev) => ({
                                                                ...prev,
                                                                invoice_id: selected ? selected.value : "",
                                                            }))
                                                        }
                                                        onInputChange={(val) => setInvoiceSearch(val)}
                                                        isClearable
                                                        isSearchable
                                                        placeholder="Search & select invoice..."
                                                        styles={selectStyles}
                                                        isDisabled={dropdownLoading}
                                                        noOptionsMessage={() =>
                                                            dropdownLoading ? "Loading..." : "No invoices found"
                                                        }
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <Row>
                                                    <Col md={6}>
                                                        <FormGroup>
                                                            <Label className="fw-semibold">Start Date</Label>
                                                            <Input
                                                                type="date"
                                                                name="start_date"
                                                                value={filters.start_date}
                                                                onChange={handleFilterChange}
                                                            />
                                                        </FormGroup>
                                                    </Col>
                                                    <Col md={6}>
                                                        <FormGroup>
                                                            <Label className="fw-semibold">End Date</Label>
                                                            <Input
                                                                type="date"
                                                                name="end_date"
                                                                value={filters.end_date}
                                                                onChange={handleFilterChange}
                                                            />
                                                        </FormGroup>
                                                    </Col>
                                                </Row>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col>
                                                <div className="d-flex gap-2">
                                                    <Button color="primary" type="submit" disabled={loading}>
                                                        Search
                                                    </Button>
                                                    <Button
                                                        color="secondary"
                                                        outline
                                                        type="button"
                                                        onClick={handleClearFilters}
                                                        disabled={loading}
                                                    >
                                                        Clear Filters
                                                    </Button>
                                                </div>
                                            </Col>
                                        </Row>
                                    </Form>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    <Card className="mb-4 border-0 shadow-sm">
                        <CardBody>
                            <div style={sectionHeader}>
                                TEAM SUMMARY
                                <div style={{
                                    width: "60px",
                                    height: "3px",
                                    background: "#556ee6",
                                    margin: "8px auto 0",
                                    borderRadius: "2px"
                                }} />
                            </div>                      
                            <Row className="g-3 mb-2">
                                <Col md={3}>
                                    <div style={statBox}>
                                        <div style={rowItem}>
                                            <span>Total Invoices</span>
                                            <strong>{summary.billing ?? 0}</strong>
                                        </div>
                                        <div style={rowItem}>
                                            <span>Invoice Amount</span>
                                            <strong>{totalInvoiceAmount.toFixed(2)}</strong>
                                        </div>
                                        <div style={rowItem}>
                                            <span>Total Billed</span>
                                            <strong>{summary.total_bill ?? 0}</strong>
                                        </div>
                                        <div style={{ ...rowItem, borderBottom: "none" }}>
                                            <span>Total Unbilled</span>
                                            <strong>{summary.total_unbilled ?? 0}</strong>
                                        </div>
                                    </div>
                                </Col>

                                <Col md={3}>
                                    <div style={statBox}>
                                        <div style={rowItem}>
                                            <span>Total Calls</span>
                                            <strong>{summary.total_call_count ?? 0}</strong>
                                        </div>
                                        <div style={rowItem}>
                                            <span>Duration</span>
                                            <strong>{summary.total_call_duration ?? 0}</strong>
                                        </div>
                                        <div style={rowItem}>
                                            <span>Avg</span>
                                            <strong>{summary.call_duration_average ?? 0}</strong>
                                        </div>
                                        <div style={{ ...rowItem, borderBottom: "none" }}>
                                            <span>8Hr%</span>
                                            <strong>{summary.call_duration_percentage_8hrs ?? 0}%</strong>
                                        </div>
                                    </div>
                                </Col>

                                <Col md={3}>
                                    <div style={statBox}>
                                        <div style={rowItem}>
                                            <span>BDO</span>
                                            <strong>{summary.total_bdo_count ?? 0}</strong>
                                        </div>
                                        <div style={rowItem}>
                                            <span>Active</span>
                                            <strong>{summary.active_count ?? 0}</strong>
                                        </div>
                                        <div style={{ ...rowItem, borderBottom: "none" }}>
                                            <span>Productive</span>
                                            <strong>{summary.productive_count ?? 0}</strong>
                                        </div>
                                    </div>
                                </Col>

                                <Col md={3}>
                                    <div style={statBox}>
                                        <div style={rowItem}>
                                            <span>New Customers</span>
                                            <strong>{summary.new_customers ?? 0}</strong>
                                        </div>
                                        <div style={{ ...rowItem, borderBottom: "none" }}>
                                            <span>New Conversions</span>
                                            <strong>{summary.new_conversions ?? 0}</strong>
                                        </div>
                                    </div>
                                </Col>
                            </Row>

                            <HourlyDurationsTable hourlyDurations={summary.hourly_durations} />

                            <hr className="my-4" />

                            <div style={{ ...sectionHeader, marginTop: "30px" }}>
                                STAFF SUMMARY
                                <div style={{
                                    width: "60px",
                                    height: "3px",
                                    background: "#34c38f",
                                    margin: "8px auto 0",
                                    borderRadius: "2px"
                                }} />
                            </div>
                            {memberRows.map((m) => (
                                <div
                                    key={m.staff_id || m.id}
                                    className="mb-4 p-3"
                                    style={{ background: "#f9fafb", borderRadius: "10px", border: "1px solid #e5e7eb" }}
                                >                                    <div className="fw-semibold mb-2" style={{ fontSize: "14px" }}>
                                        <h5 className="fw-bold text-primary mb-3"></h5>
                                        {m.staff_name || "Staff"}
                                    </div>
                                    <Row className="g-3 mb-2">
                                        <Col md={3}>
                                            <div style={statBox}>
                                                <div style={rowItem}>
                                                    <span>Total Invoices</span>
                                                    <strong>{m.summary?.billing ?? 0}</strong>
                                                </div>
                                                <div style={rowItem}>
                                                    <span>Invoice Amount</span>
                                                    <strong>{Number(m.invoiceAmount || 0).toFixed(2)}</strong>
                                                </div>
                                                <div style={rowItem}>
                                                    <span>Total Billed</span>
                                                    <strong>{m.summary?.total_bill ?? 0}</strong>
                                                </div>
                                                <div style={{ ...rowItem, borderBottom: "none" }}>
                                                    <span>Total Unbilled</span>
                                                    <strong>{m.summary?.total_unbilled ?? 0}</strong>
                                                </div>
                                            </div>
                                        </Col>

                                        <Col md={3}>
                                            <div style={statBox}>
                                                <div style={rowItem}>
                                                    <span>Total Calls</span>
                                                    <strong>{m.summary?.total_call_count ?? 0}</strong>
                                                </div>
                                                <div style={rowItem}>
                                                    <span>Duration</span>
                                                    <strong>{m.summary?.total_call_duration ?? 0}</strong>
                                                </div>
                                                <div style={rowItem}>
                                                    <span>Avg</span>
                                                    <strong>{m.summary?.call_duration_average ?? 0}</strong>
                                                </div>
                                                <div style={{ ...rowItem, borderBottom: "none" }}>
                                                    <span>8Hr%</span>
                                                    <strong>{m.summary?.call_duration_percentage_8hrs ?? 0}%</strong>
                                                </div>
                                            </div>
                                        </Col>

                                        <Col md={3}>
                                            <div style={statBox}>
                                                <div style={rowItem}>
                                                    <span>BDO</span>
                                                    <strong>{m.summary?.total_bdo_count ?? 0}</strong>
                                                </div>
                                                <div style={rowItem}>
                                                    <span>Active</span>
                                                    <strong>{m.summary?.active_count ?? 0}</strong>
                                                </div>
                                                <div style={{ ...rowItem, borderBottom: "none" }}>
                                                    <span>Productive</span>
                                                    <strong>{m.summary?.productive_count ?? 0}</strong>
                                                </div>
                                            </div>
                                        </Col>

                                        <Col md={3}>
                                            <div style={statBox}>
                                                <div style={rowItem}>
                                                    <span>New Customers</span>
                                                    <strong>{m.summary?.new_customers ?? 0}</strong>
                                                </div>
                                                <div style={{ ...rowItem, borderBottom: "none" }}>
                                                    <span>New Conversions</span>
                                                    <strong>{m.summary?.new_conversions ?? 0}</strong>
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>

                                    <HourlyDurationsTable hourlyDurations={m.summary?.hourly_durations} />
                                </div>
                            ))}
                        </CardBody>
                    </Card>
                    <div style={{ ...sectionHeader, marginTop: "30px" }}>
                        STAFF DETAILS
                        <div style={{
                            width: "60px",
                            height: "3px",
                            background: "#f46a6a",
                            margin: "8px auto 0",
                            borderRadius: "2px"
                        }} />
                    </div>
                    <Card className="border-0 shadow-sm mb-4">
                        <CardBody>
                            {loading ? (
                                <div className="text-center py-5">
                                    <Spinner />
                                </div>
                            ) : (
                                <Table bordered responsive hover className="align-middle">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Staff</th>
                                            <th>Calls</th>
                                            <th>Duration</th>
                                            <th>Invoices</th>
                                            <th>Invoice Amount</th>
                                            <th>Customers</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {memberRows.length > 0 ? (
                                            memberRows.map((m, i) => (
                                                <tr key={m.staff_id || m.id || i}>
                                                    <td>{i + 1}</td>
                                                    <td>{m.staff_name || "-"}</td>
                                                    <td>{m.summary?.total_call_count ?? 0}</td>
                                                    <td>{m.summary?.total_call_duration ?? 0}</td>
                                                    <td>{m.summary?.billing ?? 0}</td>
                                                    <td>{Number(m.invoiceAmount || 0).toFixed(2)}</td>
                                                    <td>{m.summary?.new_customers ?? 0}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="7" className="text-center py-4">
                                                    No data found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            )}
                        </CardBody>
                    </Card>
                    <h4
                        style={{
                            textAlign: "center",
                            fontWeight: "700",
                            letterSpacing: "1px",
                            color: "#344767",
                            marginBottom: "20px",
                            position: "relative"
                        }}
                    >
                        DETAILED STAFF SUMMARY
                        <div
                            style={{
                                width: "60px",
                                height: "3px",
                                background: "#556ee6",
                                margin: "8px auto 0",
                                borderRadius: "2px"
                            }}
                        />
                    </h4>
                    {!loading &&
                        memberRows.map((m) => (

                            <Card key={m.staff_id || m.id} className="mb-4 shadow-sm border-0">
                                <CardBody>
                                    <h5 className="fw-bold text-dark border-bottom pb-2 mb-3">
                                        {m.staff_name || "Staff"}
                                    </h5>
                                    <Table responsive hover bordered>
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Customer</th>
                                                <th>Phone</th>
                                                <th>Status</th>
                                                <th>Duration</th>
                                                <th>Invoice</th>
                                                <th>Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {m.reports?.length > 0 ? (
                                                m.reports.map((r) => (
                                                    <tr key={r.id}>
                                                        <td>{r.id}</td>
                                                        <td>{r.customer_name || "-"}</td>
                                                        <td>{r.phone || "-"}</td>
                                                        <td>{r.call_status || "-"}</td>
                                                        <td>{r.call_duration || "-"}</td>
                                                        <td>{r.invoice?.invoice || "-"}</td>
                                                        <td>{Number(r?.invoice?.invoice_total || 0).toFixed(2)}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="7" className="text-center py-4">
                                                        No reports found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </CardBody>
                            </Card>
                        ))}
                </Container>
            </div>

            <ToastContainer />
        </React.Fragment>
    );
};

export default TeamDetailsPage;