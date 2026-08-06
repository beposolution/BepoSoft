import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    Table,
    Row,
    Col,
    Card,
    CardBody,
    CardTitle,
    Input,
    Label,
    Button,
    Spinner,
} from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { Link } from "react-router-dom";
import axios from "axios";
import Select from "react-select";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const BasicTable = () => {
    const apiBase = import.meta.env.VITE_APP_KEY;
    const token = localStorage.getItem("token");

    /*
     * This must match the page size configured in StandardPagination.
     * Change it only if your Django pagination page_size is different.
     */
    const PAGE_SIZE = 50;

    const [role, setRole] = useState("");

    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [searchTerm, setSearchTerm] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [totalCount, setTotalCount] = useState(0);
    const [nextPageUrl, setNextPageUrl] = useState(null);
    const [previousPageUrl, setPreviousPageUrl] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerSearch, setCustomerSearch] = useState("");
    const [customerLoading, setCustomerLoading] = useState(false);

    const [staffs, setStaffs] = useState([]);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [staffSearch, setStaffSearch] = useState("");
    const [staffLoading, setStaffLoading] = useState(false);

    /*
     * Abort controllers prevent older dropdown API calls from replacing
     * newer search results.
     */
    const customerAbortController = useRef(null);
    const staffAbortController = useRef(null);

    document.title = "BEPOSOFT | PROFORMA INVOICE";

    useEffect(() => {
        const activeRole = localStorage.getItem("active") || "";
        setRole(activeRole);
    }, []);

    const getInvoiceBaseUrl = useCallback(() => {
        const endpoint =
            role === "ADMIN"
                ? "perfoma/invoices/new/"
                : "performa/invoice/staff/new/";

        return `${apiBase}${endpoint}`;
    }, [apiBase, role]);

    const getPageNumberFromUrl = useCallback((url) => {
        if (!url) {
            return 1;
        }

        try {
            const parsedUrl = new URL(
                url,
                window.location.origin
            );

            const page = Number(
                parsedUrl.searchParams.get("page") || 1
            );

            return Number.isFinite(page) && page > 0
                ? page
                : 1;
        } catch (error) {
            console.error("Unable to read page number:", error);
            return 1;
        }
    }, []);

    const fetchCustomers = useCallback(
        async (search = "") => {
            if (!token) {
                setCustomers([]);
                return;
            }

            if (customerAbortController.current) {
                customerAbortController.current.abort();
            }

            const controller = new AbortController();
            customerAbortController.current = controller;

            try {
                setCustomerLoading(true);

                const params = {};

                if (search.trim()) {
                    params.search = search.trim();
                }

                const response = await axios.get(
                    `${apiBase}customers/`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        params,
                        signal: controller.signal,
                    }
                );

                let customerList = [];

                if (Array.isArray(response?.data?.results)) {
                    customerList = response.data.results;
                } else if (
                    Array.isArray(response?.data?.results?.data)
                ) {
                    customerList =
                        response.data.results.data;
                } else if (
                    Array.isArray(response?.data?.data)
                ) {
                    customerList = response.data.data;
                } else if (Array.isArray(response?.data)) {
                    customerList = response.data;
                }

                setCustomers(customerList);
            } catch (error) {
                if (
                    error?.code === "ERR_CANCELED" ||
                    axios.isCancel(error)
                ) {
                    return;
                }

                console.error(
                    "Customer search API error:",
                    error
                );

                setCustomers([]);
                toast.error("Error fetching customers");
            } finally {
                if (
                    customerAbortController.current ===
                    controller
                ) {
                    setCustomerLoading(false);
                }
            }
        },
        [apiBase, token]
    );

    const fetchStaffData = useCallback(
        async (search = "") => {
            if (!token || role !== "ADMIN") {
                setStaffs([]);
                return;
            }

            if (staffAbortController.current) {
                staffAbortController.current.abort();
            }

            const controller = new AbortController();
            staffAbortController.current = controller;

            try {
                setStaffLoading(true);

                const params = {};

                if (search.trim()) {
                    params.search = search.trim();
                }

                const response = await axios.get(
                    `${apiBase}get/staffs/`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        params,
                        signal: controller.signal,
                    }
                );

                let staffList = [];

                if (
                    Array.isArray(
                        response?.data?.results?.data
                    )
                ) {
                    staffList =
                        response.data.results.data;
                } else if (
                    Array.isArray(response?.data?.data)
                ) {
                    staffList = response.data.data;
                } else if (
                    Array.isArray(response?.data?.results)
                ) {
                    staffList = response.data.results;
                } else if (Array.isArray(response?.data)) {
                    staffList = response.data;
                }

                setStaffs(staffList);
            } catch (error) {
                if (
                    error?.code === "ERR_CANCELED" ||
                    axios.isCancel(error)
                ) {
                    return;
                }

                console.error("Staff API error:", error);

                setStaffs([]);
                toast.error("Error fetching staffs");
            } finally {
                if (
                    staffAbortController.current ===
                    controller
                ) {
                    setStaffLoading(false);
                }
            }
        },
        [apiBase, role, token]
    );

    /*
     * Initial customer data.
     */
    useEffect(() => {
        if (!token) {
            return;
        }

        fetchCustomers("");

        return () => {
            if (customerAbortController.current) {
                customerAbortController.current.abort();
            }
        };
    }, [fetchCustomers, token]);

    /*
     * Initial staff data only for ADMIN.
     */
    useEffect(() => {
        if (!token || role !== "ADMIN") {
            return;
        }

        fetchStaffData("");

        return () => {
            if (staffAbortController.current) {
                staffAbortController.current.abort();
            }
        };
    }, [fetchStaffData, role, token]);

    /*
     * Customer dropdown server-side search.
     */
    useEffect(() => {
        if (!token) {
            return undefined;
        }

        const timer = setTimeout(() => {
            fetchCustomers(customerSearch);
        }, 500);

        return () => clearTimeout(timer);
    }, [customerSearch, fetchCustomers, token]);

    /*
     * Staff dropdown server-side search.
     */
    useEffect(() => {
        if (!token || role !== "ADMIN") {
            return undefined;
        }

        const timer = setTimeout(() => {
            fetchStaffData(staffSearch);
        }, 500);

        return () => clearTimeout(timer);
    }, [
        staffSearch,
        fetchStaffData,
        role,
        token,
    ]);

    const buildFilterUrl = useCallback(
        ({
            search = "",
            fromDate = "",
            toDate = "",
            customer = "",
            staff = "",
        } = {}) => {
            const baseUrl = getInvoiceBaseUrl();
            const params = new URLSearchParams();

            if (search.trim()) {
                params.append(
                    "search",
                    search.trim()
                );
            }

            if (fromDate) {
                params.append(
                    "start_date",
                    fromDate
                );
            }

            if (toDate) {
                params.append(
                    "end_date",
                    toDate
                );
            }

            if (customer) {
                params.append(
                    "customer",
                    customer.toString()
                );
            }

            if (role === "ADMIN" && staff) {
                params.append(
                    "manage_staff",
                    staff.toString()
                );
            }

            const queryString = params.toString();

            return queryString
                ? `${baseUrl}?${queryString}`
                : baseUrl;
        },
        [getInvoiceBaseUrl, role]
    );

    const fetchInvoices = useCallback(
        async ({
            directUrl = null,
            search = "",
            fromDate = "",
            toDate = "",
            customer = "",
            staff = "",
        } = {}) => {
            if (!role || !token) {
                return;
            }

            setLoading(true);
            setError("");

            try {
                const url =
                    directUrl ||
                    buildFilterUrl({
                        search,
                        fromDate,
                        toDate,
                        customer,
                        staff,
                    });

                const response = await axios.get(url, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const responseData =
                    response?.data || {};

                const results = Array.isArray(
                    responseData.results
                )
                    ? responseData.results
                    : [];

                setInvoices(results);
                setTotalCount(
                    Number(responseData.count || 0)
                );
                setNextPageUrl(
                    responseData.next || null
                );
                setPreviousPageUrl(
                    responseData.previous || null
                );

                setCurrentPage(
                    getPageNumberFromUrl(url)
                );
            } catch (error) {
                console.error(
                    "Proforma invoice API error:",
                    error
                );

                setInvoices([]);
                setTotalCount(0);
                setNextPageUrl(null);
                setPreviousPageUrl(null);
                setCurrentPage(1);

                const message =
                    error?.response?.data?.detail ||
                    error?.response?.data?.message ||
                    "Error fetching proforma invoice data.";

                setError(message);
                toast.error(message);
            } finally {
                setLoading(false);
            }
        },
        [
            role,
            token,
            buildFilterUrl,
            getPageNumberFromUrl,
        ]
    );

    /*
     * Initial invoice request.
     */
    useEffect(() => {
        if (!role || !token) {
            return;
        }

        fetchInvoices({
            search: "",
            fromDate: "",
            toDate: "",
            customer: "",
            staff: "",
        });
    }, [role, token, fetchInvoices]);

    const handleFilter = () => {
        if (
            (startDate && !endDate) ||
            (!startDate && endDate)
        ) {
            toast.error(
                "Please select both start and end dates."
            );
            return;
        }

        if (
            startDate &&
            endDate &&
            startDate > endDate
        ) {
            toast.error(
                "Start date cannot be greater than end date."
            );
            return;
        }

        fetchInvoices({
            search: searchTerm,
            fromDate: startDate,
            toDate: endDate,
            customer:
                selectedCustomer?.value || "",
            staff:
                role === "ADMIN"
                    ? selectedStaff?.value || ""
                    : "",
        });
    };

    const handleSearchKeyDown = (event) => {
        if (event.key === "Enter") {
            handleFilter();
        }
    };

    const handleClearFilter = () => {
        setSearchTerm("");
        setStartDate("");
        setEndDate("");

        setSelectedCustomer(null);
        setCustomerSearch("");

        setSelectedStaff(null);
        setStaffSearch("");

        fetchInvoices({
            search: "",
            fromDate: "",
            toDate: "",
            customer: "",
            staff: "",
        });
    };

    const handlePreviousPage = () => {
        if (!previousPageUrl || loading) {
            return;
        }

        fetchInvoices({
            directUrl: previousPageUrl,
        });
    };

    const handleNextPage = () => {
        if (!nextPageUrl || loading) {
            return;
        }

        fetchInvoices({
            directUrl: nextPageUrl,
        });
    };

    const getStatusStyle = (status) => {
        switch ((status || "").toLowerCase()) {
            case "pending":
                return {
                    color: "#dc3545",
                    fontWeight: 600,
                };

            case "approved":
                return {
                    color: "#0d6efd",
                    fontWeight: 600,
                };

            case "shipped":
                return {
                    color: "#b8860b",
                    fontWeight: 600,
                };

            case "processing":
                return {
                    color: "#fd7e14",
                    fontWeight: 600,
                };

            case "completed":
                return {
                    color: "#198754",
                    fontWeight: 600,
                };

            case "cancelled":
            case "canceled":
            case "rejected":
                return {
                    color: "#6c757d",
                    fontWeight: 600,
                };

            default:
                return {
                    color: "#212529",
                    fontWeight: 600,
                };
        }
    };

    const calculateBillAmount = (
        items = [],
        totalAmount = 0
    ) => {
        if (
            Array.isArray(items) &&
            items.length > 0
        ) {
            return items.reduce((sum, item) => {
                const rate = Number(
                    item?.rate || 0
                );

                const quantity = Number(
                    item?.quantity || 0
                );

                return sum + rate * quantity;
            }, 0);
        }

        return Number(totalAmount || 0);
    };

    const customerOptions = useMemo(
        () =>
            customers.map((customer) => {
                const name =
                    customer?.name ||
                    "Unnamed Customer";

                const phone =
                    customer?.phone || "";

                const city =
                    customer?.city || "";

                let label = name;

                if (phone) {
                    label += ` - ${phone}`;
                }

                if (city) {
                    label += ` - ${city}`;
                }

                return {
                    value: customer.id,
                    label,
                    raw: customer,
                };
            }),
        [customers]
    );

    const staffOptions = useMemo(
        () =>
            staffs.map((staff) => {
                const name =
                    staff?.name ||
                    staff?.full_name ||
                    staff?.staff_name ||
                    staff?.username ||
                    staff?.email ||
                    `Staff ${staff?.id}`;

                const department =
                    staff?.department_name ||
                    staff?.department?.name ||
                    staff?.department ||
                    "";

                return {
                    value: staff.id,
                    label: department
                        ? `${name} - ${department}`
                        : name,
                    raw: staff,
                };
            }),
        [staffs]
    );

    const firstVisibleRecord =
        totalCount === 0
            ? 0
            : (currentPage - 1) *
                  PAGE_SIZE +
              1;

    const lastVisibleRecord = Math.min(
        (currentPage - 1) * PAGE_SIZE +
            invoices.length,
        totalCount
    );

    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs
                        title="Tables"
                        breadcrumbItem="PROFORMA INVOICES"
                    />

                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <Row className="mb-3">
                                        <Col md={8}>
                                            <CardTitle className="h4 mb-1">
                                                BEPOSOFT PROFORMA
                                                INVOICES
                                            </CardTitle>

                                            <div className="text-muted">
                                                Total invoices:{" "}
                                                <strong>
                                                    {totalCount}
                                                </strong>
                                            </div>
                                        </Col>
                                    </Row>

                                    <Row className="align-items-end mb-4">
                                        <Col
                                            xl={3}
                                            lg={4}
                                            md={6}
                                            className="mb-3"
                                        >
                                            <Label>
                                                Invoice Search
                                            </Label>

                                            <Input
                                                type="text"
                                                placeholder="Search invoice number..."
                                                value={
                                                    searchTerm
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    setSearchTerm(
                                                        event
                                                            .target
                                                            .value
                                                    )
                                                }
                                                onKeyDown={
                                                    handleSearchKeyDown
                                                }
                                            />
                                        </Col>

                                        <Col
                                            xl={3}
                                            lg={4}
                                            md={6}
                                            className="mb-3"
                                        >
                                            <Label>
                                                Customer
                                            </Label>

                                            <Select
                                                value={
                                                    selectedCustomer
                                                }
                                                onChange={(
                                                    option
                                                ) => {
                                                    setSelectedCustomer(
                                                        option
                                                    );
                                                }}
                                                onInputChange={(
                                                    value,
                                                    actionMeta
                                                ) => {
                                                    if (
                                                        actionMeta.action ===
                                                        "input-change"
                                                    ) {
                                                        setCustomerSearch(
                                                            value
                                                        );
                                                    }

                                                    return value;
                                                }}
                                                options={
                                                    customerOptions
                                                }
                                                isLoading={
                                                    customerLoading
                                                }
                                                isClearable
                                                isSearchable
                                                filterOption={
                                                    null
                                                }
                                                placeholder="Search and select customer..."
                                                noOptionsMessage={() =>
                                                    customerLoading
                                                        ? "Searching customers..."
                                                        : "No customers found"
                                                }
                                            />
                                        </Col>

                                        {role ===
                                            "ADMIN" && (
                                            <Col
                                                xl={3}
                                                lg={4}
                                                md={6}
                                                className="mb-3"
                                            >
                                                <Label>
                                                    Staff
                                                </Label>

                                                <Select
                                                    value={
                                                        selectedStaff
                                                    }
                                                    onChange={(
                                                        option
                                                    ) => {
                                                        setSelectedStaff(
                                                            option
                                                        );
                                                    }}
                                                    onInputChange={(
                                                        value,
                                                        actionMeta
                                                    ) => {
                                                        if (
                                                            actionMeta.action ===
                                                            "input-change"
                                                        ) {
                                                            setStaffSearch(
                                                                value
                                                            );
                                                        }

                                                        return value;
                                                    }}
                                                    options={
                                                        staffOptions
                                                    }
                                                    isLoading={
                                                        staffLoading
                                                    }
                                                    isClearable
                                                    isSearchable
                                                    filterOption={
                                                        null
                                                    }
                                                    placeholder="Search and select staff..."
                                                    noOptionsMessage={() =>
                                                        staffLoading
                                                            ? "Searching staffs..."
                                                            : "No staffs found"
                                                    }
                                                />
                                            </Col>
                                        )}

                                        <Col
                                            xl={2}
                                            lg={3}
                                            md={6}
                                            className="mb-3"
                                        >
                                            <Label>
                                                Start Date
                                            </Label>

                                            <Input
                                                type="date"
                                                value={
                                                    startDate
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    setStartDate(
                                                        event
                                                            .target
                                                            .value
                                                    )
                                                }
                                            />
                                        </Col>

                                        <Col
                                            xl={2}
                                            lg={3}
                                            md={6}
                                            className="mb-3"
                                        >
                                            <Label>
                                                End Date
                                            </Label>

                                            <Input
                                                type="date"
                                                value={
                                                    endDate
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    setEndDate(
                                                        event
                                                            .target
                                                            .value
                                                    )
                                                }
                                            />
                                        </Col>

                                        <Col
                                            xl={2}
                                            lg={3}
                                            md={3}
                                            className="mb-3"
                                        >
                                            <Button
                                                color="primary"
                                                className="w-100"
                                                onClick={
                                                    handleFilter
                                                }
                                                disabled={
                                                    loading
                                                }
                                            >
                                                {loading ? (
                                                    <>
                                                        <Spinner
                                                            size="sm"
                                                            className="me-2"
                                                        />
                                                        Loading
                                                    </>
                                                ) : (
                                                    "Apply Filter"
                                                )}
                                            </Button>
                                        </Col>

                                        <Col
                                            xl={2}
                                            lg={3}
                                            md={3}
                                            className="mb-3"
                                        >
                                            <Button
                                                color="secondary"
                                                outline
                                                className="w-100"
                                                onClick={
                                                    handleClearFilter
                                                }
                                                disabled={
                                                    loading
                                                }
                                            >
                                                Clear
                                            </Button>
                                        </Col>
                                    </Row>

                                    <div className="table-responsive">
                                        {loading ? (
                                            <div className="text-center py-5">
                                                <Spinner color="primary" />

                                                <div className="mt-2">
                                                    Loading
                                                    proforma
                                                    invoices...
                                                </div>
                                            </div>
                                        ) : error ? (
                                            <div className="text-danger text-center py-4">
                                                {error}
                                            </div>
                                        ) : invoices.length ===
                                          0 ? (
                                            <div className="text-center text-muted py-5">
                                                No matching
                                                records found.
                                            </div>
                                        ) : (
                                            <Table
                                                hover
                                                bordered
                                                responsive
                                                className="align-middle mb-0"
                                            >
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>
                                                            #
                                                        </th>
                                                        <th>
                                                            Invoice
                                                            No.
                                                        </th>
                                                        <th>
                                                            Staff
                                                        </th>
                                                        <th>
                                                            Customer
                                                        </th>
                                                        <th>
                                                            Status
                                                        </th>
                                                        <th className="text-end">
                                                            Bill
                                                            Amount
                                                        </th>
                                                        <th>
                                                            Created
                                                            At
                                                        </th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {invoices.map(
                                                        (
                                                            item,
                                                            index
                                                        ) => {
                                                            const staffName =
                                                                item?.manage_staff_name ||
                                                                item?.staffname ||
                                                                "N/A";

                                                            const familyName =
                                                                item?.familyname ||
                                                                "";

                                                            const customerName =
                                                                item
                                                                    ?.customer
                                                                    ?.name ||
                                                                item?.customermame ||
                                                                item?.customer_name ||
                                                                "N/A";

                                                            const billAmount =
                                                                calculateBillAmount(
                                                                    item?.perfoma_items,
                                                                    item?.total_amount
                                                                );

                                                            const serialNumber =
                                                                (currentPage -
                                                                    1) *
                                                                    PAGE_SIZE +
                                                                index +
                                                                1;

                                                            return (
                                                                <tr
                                                                    key={
                                                                        item.id ||
                                                                        `${item.invoice}-${index}`
                                                                    }
                                                                >
                                                                    <th scope="row">
                                                                        {
                                                                            serialNumber
                                                                        }
                                                                    </th>

                                                                    <td>
                                                                        <Link
                                                                            to={`/perfoma/invoice/${item.invoice}/view/`}
                                                                            className="fw-semibold"
                                                                        >
                                                                            {item.invoice ||
                                                                                "N/A"}
                                                                        </Link>
                                                                    </td>

                                                                    <td>
                                                                        {
                                                                            staffName
                                                                        }

                                                                        {familyName && (
                                                                            <div className="small text-muted">
                                                                                {
                                                                                    familyName
                                                                                }
                                                                            </div>
                                                                        )}
                                                                    </td>

                                                                    <td>
                                                                        {
                                                                            customerName
                                                                        }
                                                                    </td>

                                                                    <td
                                                                        style={getStatusStyle(
                                                                            item.status
                                                                        )}
                                                                    >
                                                                        {item.status ||
                                                                            "N/A"}
                                                                    </td>

                                                                    <td className="text-end fw-semibold">
                                                                        ₹{" "}
                                                                        {billAmount.toLocaleString(
                                                                            "en-IN",
                                                                            {
                                                                                minimumFractionDigits: 2,
                                                                                maximumFractionDigits: 2,
                                                                            }
                                                                        )}
                                                                    </td>

                                                                    <td>
                                                                        {item.order_date ||
                                                                            "N/A"}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        }
                                                    )}
                                                </tbody>
                                            </Table>
                                        )}
                                    </div>

                                    {totalCount > 0 && (
                                        <Row className="align-items-center mt-4">
                                            <Col md={6}>
                                                <div className="text-muted">
                                                    Showing{" "}
                                                    <strong>
                                                        {
                                                            firstVisibleRecord
                                                        }
                                                    </strong>{" "}
                                                    to{" "}
                                                    <strong>
                                                        {
                                                            lastVisibleRecord
                                                        }
                                                    </strong>{" "}
                                                    of{" "}
                                                    <strong>
                                                        {
                                                            totalCount
                                                        }
                                                    </strong>{" "}
                                                    records
                                                </div>
                                            </Col>

                                            <Col md={6}>
                                                <div className="d-flex justify-content-md-end align-items-center gap-2 mt-3 mt-md-0">
                                                    <Button
                                                        color="secondary"
                                                        outline
                                                        onClick={
                                                            handlePreviousPage
                                                        }
                                                        disabled={
                                                            !previousPageUrl ||
                                                            loading
                                                        }
                                                    >
                                                        Previous
                                                    </Button>

                                                    <span className="text-muted px-2">
                                                        Page{" "}
                                                        <strong>
                                                            {
                                                                currentPage
                                                            }
                                                        </strong>
                                                    </span>

                                                    <Button
                                                        color="primary"
                                                        onClick={
                                                            handleNextPage
                                                        }
                                                        disabled={
                                                            !nextPageUrl ||
                                                            loading
                                                        }
                                                    >
                                                        Next
                                                    </Button>
                                                </div>
                                            </Col>
                                        </Row>
                                    )}
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </div>

            <ToastContainer />
        </React.Fragment>
    );
};

export default BasicTable;