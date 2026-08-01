import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import axios from "axios";
import Select from "react-select";

import Breadcrumbs from "../../components/Common/Breadcrumb";

import {
    Button,
    Card,
    CardBody,
    CardTitle,
    Col,
    Input,
    Row,
    Spinner,
    Table,
} from "reactstrap";

import {
    ToastContainer,
    toast,
} from "react-toastify";

import "react-toastify/dist/ReactToastify.css";


const OtherReceipt = () => {
    const apiBase = import.meta.env.VITE_APP_KEY;
    const token = localStorage.getItem("token");
    const [receipts, setReceipts] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [nextPage, setNextPage] = useState(null);
    const [previousPage, setPreviousPage] = useState(null);
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [banks, setBanks] = useState([]);
    const [staffs, setStaffs] = useState([]);
    const [orderSearch, setOrderSearch] = useState("");
    const [customerSearch, setCustomerSearch] = useState("");
    const [bankSearch, setBankSearch] = useState("");
    const [staffSearch, setStaffSearch] = useState("");
    const [orderLoading, setOrderLoading] = useState(false);
    const [customerLoading, setCustomerLoading] = useState(false);
    const [bankLoading, setBankLoading] = useState(false);
    const [staffLoading, setStaffLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [filterLoading, setFilterLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [selectedBank, setSelectedBank] = useState(null);
    const [selectedStaff, setSelectedStaff] = useState(null);

    const [appliedFilters, setAppliedFilters] = useState({
        search: "",
        start_date: "",
        end_date: "",
        created_by: "",
        bank: "",
        customer: "",
        order: "",
    });

    const authHeaders = useMemo(
        () => ({
            Authorization: `Bearer ${token}`,
        }),
        [token]
    );

    const extractArray = (responseData, paths = []) => {
        for (const path of paths) {
            const value = path
                .split(".")
                .reduce(
                    (current, key) => current?.[key],
                    responseData
                );

            if (Array.isArray(value)) {
                return value;
            }
        }

        if (Array.isArray(responseData)) {
            return responseData;
        }

        return [];
    };

    const fetchReceiptData = useCallback(
        async ({
            page = 1,
            filters = appliedFilters,
            showMainLoader = false,
        } = {}) => {
            if (!token) {
                toast.error("Authentication token not found.");
                return;
            }

            try {
                if (showMainLoader) {
                    setLoading(true);
                } else {
                    setFilterLoading(true);
                }

                const params = {
                    page,
                };

                if (filters.search) {
                    params.search = filters.search;
                }

                if (filters.created_by) {
                    params.created_by = filters.created_by;
                }

                if (filters.bank) {
                    params.bank = filters.bank;
                }

                if (filters.customer) {
                    params.customer = filters.customer;
                }

                if (filters.order) {
                    params.order = filters.order;
                }

                if (filters.start_date) {
                    params.start_date = filters.start_date;
                }

                if (filters.end_date) {
                    params.end_date = filters.end_date;
                }

                const response = await axios.get(
                    `${apiBase}allreceipts/view/`,
                    {
                        headers: authHeaders,
                        params,
                    }
                );

                const responseData = response?.data || {};
                const resultData = responseData?.results || {};

                setReceipts(
                    Array.isArray(resultData?.receipts)
                        ? resultData.receipts
                        : []
                );

                setTotalCount(
                    Number(responseData?.count || 0)
                );

                setNextPage(
                    responseData?.next || null
                );

                setPreviousPage(
                    responseData?.previous || null
                );
            } catch (error) {
                console.error(
                    "Receipt API error:",
                    error?.response?.data || error?.message
                );

                setReceipts([]);
                setTotalCount(0);
                setNextPage(null);
                setPreviousPage(null);

                const message =
                    error?.response?.data?.message ||
                    error?.response?.data?.detail ||
                    "Failed to fetch receipt data.";

                toast.error(message);
            } finally {
                setLoading(false);
                setFilterLoading(false);
            }
        },
        [
            apiBase,
            token,
            authHeaders,
            appliedFilters,
        ]
    );

    const fetchOrders = useCallback(
        async (search = "") => {
            if (!token) return;

            try {
                setOrderLoading(true);

                const params = {
                    page: 1,
                    page_size: 50,
                };

                if (search.trim()) {
                    params.search = search.trim();
                }

                const response = await axios.get(
                    `${apiBase}orders/`,
                    {
                        headers: authHeaders,
                        params,
                    }
                );

                const orderData =
                    response?.data?.results?.results || [];

                setOrders(
                    Array.isArray(orderData)
                        ? orderData
                        : []
                );
            } catch (error) {
                console.error(
                    "Orders API error:",
                    error?.response?.data || error?.message
                );

                setOrders([]);

                toast.error(
                    error?.response?.data?.message ||
                    "Failed to fetch orders."
                );
            } finally {
                setOrderLoading(false);
            }
        },
        [apiBase, authHeaders, token]
    );

    const fetchCustomers = useCallback(
        async (search = "") => {
            if (!token) return;

            try {
                setCustomerLoading(true);

                const response = await axios.get(
                    `${apiBase}customers/`,
                    {
                        headers: authHeaders,
                        params: {
                            search:
                                search.trim() ||
                                undefined,
                            page: 1,
                            page_size: 50,
                        },
                    }
                );

                const customerData = extractArray(
                    response?.data,
                    [
                        "results",
                        "results.data",
                        "data",
                        "customers",
                    ]
                );

                setCustomers(customerData);
            } catch (error) {
                console.error(
                    "Customer API error:",
                    error?.response?.data || error?.message
                );

                setCustomers([]);
            } finally {
                setCustomerLoading(false);
            }
        },
        [apiBase, authHeaders, token]
    );

    const fetchStaffs = useCallback(
        async (search = "") => {
            if (!token) return;

            try {
                setStaffLoading(true);

                const response = await axios.get(
                    `${apiBase}get/staffs/`,
                    {
                        headers: authHeaders,
                        params: {
                            search:
                                search.trim() ||
                                undefined,
                            page: 1,
                            page_size: 50,
                        },
                    }
                );

                const staffData = extractArray(
                    response?.data,
                    [
                        "results.data",
                        "results",
                        "data",
                        "staffs",
                    ]
                );

                setStaffs(staffData);
            } catch (error) {
                console.error(
                    "Staff API error:",
                    error?.response?.data || error?.message
                );

                setStaffs([]);
            } finally {
                setStaffLoading(false);
            }
        },
        [apiBase, authHeaders, token]
    );

    const fetchBanks = useCallback(
        async (search = "") => {
            if (!token) return;

            try {
                setBankLoading(true);

                const response = await axios.get(
                    `${apiBase}banks/`,
                    {
                        headers: authHeaders,
                        params: {
                            search:
                                search.trim() ||
                                undefined,
                            page: 1,
                            page_size: 50,
                        },
                    }
                );

                const bankData = extractArray(
                    response?.data,
                    [
                        "data",
                        "results",
                        "results.data",
                        "banks",
                    ]
                );

                setBanks(bankData);
            } catch (error) {
                console.error(
                    "Bank API error:",
                    error?.response?.data || error?.message
                );

                setBanks([]);
            } finally {
                setBankLoading(false);
            }
        },
        [apiBase, authHeaders, token]
    );

    useEffect(() => {
        fetchOrders("");
        fetchCustomers("");
        fetchStaffs("");
        fetchBanks("");
    }, [
        fetchOrders,
        fetchCustomers,
        fetchStaffs,
        fetchBanks,
    ]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchOrders(orderSearch);
        }, 500);

        return () => clearTimeout(timer);
    }, [orderSearch, fetchOrders]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCustomers(customerSearch);
        }, 500);

        return () => clearTimeout(timer);
    }, [customerSearch, fetchCustomers]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchStaffs(staffSearch);
        }, 500);

        return () => clearTimeout(timer);
    }, [staffSearch, fetchStaffs]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchBanks(bankSearch);
        }, 500);

        return () => clearTimeout(timer);
    }, [bankSearch, fetchBanks]);

    useEffect(() => {
        fetchReceiptData({
            page: currentPage,
            filters: appliedFilters,
            showMainLoader: currentPage === 1,
        });
    }, [
        currentPage,
        appliedFilters,
        fetchReceiptData,
    ]);

    const orderOptions = useMemo(
        () =>
            orders.map((order) => {
                const invoice =
                    order.invoice ||
                    order.order_id ||
                    order.invoice_number ||
                    `Order ${order.id}`;

                const customerName =
                    order.customer_name ||
                    order.customer?.name ||
                    "";

                return {
                    value: order.id,
                    label: customerName
                        ? `${invoice} - ${customerName}`
                        : invoice,
                };
            }),
        [orders]
    );

    const customerOptions = useMemo(
        () =>
            customers.map((customer) => ({
                value: customer.id,
                label:
                    customer.name ||
                    customer.customer_name ||
                    `Customer ${customer.id}`,
            })),
        [customers]
    );

    const staffOptions = useMemo(
        () =>
            staffs.map((staff) => ({
                value: staff.id,
                label:
                    staff.name ||
                    staff.full_name ||
                    staff.username ||
                    `Staff ${staff.id}`,
            })),
        [staffs]
    );

    const bankOptions = useMemo(
        () =>
            banks.map((bank) => ({
                value: bank.id,
                label:
                    bank.name ||
                    bank.bank_name ||
                    `Bank ${bank.id}`,
            })),
        [banks]
    );

    const handleApplyFilters = () => {
        if (
            startDate &&
            endDate &&
            startDate > endDate
        ) {
            toast.warning(
                "Start date cannot be greater than end date."
            );

            return;
        }

        const newFilters = {
            search: searchTerm.trim(),
            start_date: startDate,
            end_date: endDate,
            created_by: selectedStaff?.value || "",
            bank: selectedBank?.value || "",
            customer: selectedCustomer?.value || "",
            order: selectedOrder?.value || "",
        };

        setCurrentPage(1);
        setAppliedFilters(newFilters);
    };

    const handleResetFilters = () => {
        setSearchTerm("");
        setStartDate("");
        setEndDate("");

        setSelectedOrder(null);
        setSelectedCustomer(null);
        setSelectedBank(null);
        setSelectedStaff(null);

        setOrderSearch("");
        setCustomerSearch("");
        setBankSearch("");
        setStaffSearch("");

        setCurrentPage(1);

        setAppliedFilters({
            search: "",
            start_date: "",
            end_date: "",
            created_by: "",
            bank: "",
            customer: "",
            order: "",
        });
    };

    const handleSearchKeyDown = (event) => {
        if (event.key === "Enter") {
            handleApplyFilters();
        }
    };

    const handlePreviousPage = () => {
        if (previousPage && !filterLoading) {
            setCurrentPage((previous) =>
                Math.max(previous - 1, 1)
            );
        }
    };

    const handleNextPage = () => {
        if (nextPage && !filterLoading) {
            setCurrentPage((previous) => previous + 1);
        }
    };

    const formatAmount = (amount) => {
        const parsedAmount = Number(amount);

        if (Number.isNaN(parsedAmount)) {
            return amount || "N/A";
        }

        return parsedAmount.toLocaleString(
            "en-IN",
            {
                style: "currency",
                currency: "INR",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }
        );
    };

    const getReceiptTypeLabel = (
        receiptType
    ) => {
        switch (receiptType) {
            case "advance":
                return "Advance Receipt";

            case "bank":
                return "Bank Receipt";

            case "payment":
                return "Payment Receipt";

            default:
                return "Receipt";
        }
    };

    const selectStyles = {
        control: (provided) => ({
            ...provided,
            minHeight: "38px",
        }),

        menu: (provided) => ({
            ...provided,
            zIndex: 99999,
        }),

        menuPortal: (provided) => ({
            ...provided,
            zIndex: 99999,
        }),
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs
                        title="PAYMENTS"
                        breadcrumbItem="ALL RECEIPT LIST"
                    />

                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
                                        <CardTitle className="mb-0">
                                            ALL RECEIPT LIST
                                        </CardTitle>

                                        <div className="text-muted">
                                            Total Receipts:{" "}
                                            <strong>
                                                {totalCount}
                                            </strong>
                                        </div>
                                    </div>

                                    <Row className="g-3 mb-4">
                                        <Col
                                            xl={3}
                                            lg={4}
                                            md={6}
                                        >
                                            <label className="form-label">
                                                Receipt Search
                                            </label>

                                            <Input
                                                type="text"
                                                placeholder="Receipt, remark, reference or amount"
                                                value={searchTerm}
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
                                        >
                                            <label className="form-label">
                                                Order ID /
                                                Invoice
                                            </label>

                                            <Select
                                                value={
                                                    selectedOrder
                                                }
                                                options={
                                                    orderOptions
                                                }
                                                isClearable
                                                isSearchable
                                                isLoading={
                                                    orderLoading
                                                }
                                                filterOption={() =>
                                                    true
                                                }
                                                placeholder="Search order or invoice"
                                                noOptionsMessage={() =>
                                                    orderLoading
                                                        ? "Searching orders..."
                                                        : "No orders found"
                                                }
                                                onInputChange={(
                                                    value,
                                                    action
                                                ) => {
                                                    if (
                                                        action.action ===
                                                        "input-change"
                                                    ) {
                                                        setOrderSearch(
                                                            value
                                                        );
                                                    }
                                                }}
                                                onChange={(
                                                    option
                                                ) =>
                                                    setSelectedOrder(
                                                        option
                                                    )
                                                }
                                                styles={
                                                    selectStyles
                                                }
                                                menuPortalTarget={
                                                    document.body
                                                }
                                                menuPosition="fixed"
                                                maxMenuHeight={220}
                                            />
                                        </Col>

                                        <Col
                                            xl={3}
                                            lg={4}
                                            md={6}
                                        >
                                            <label className="form-label">
                                                Created By
                                            </label>

                                            <Select
                                                value={
                                                    selectedStaff
                                                }
                                                options={
                                                    staffOptions
                                                }
                                                isClearable
                                                isSearchable
                                                isLoading={
                                                    staffLoading
                                                }
                                                filterOption={() =>
                                                    true
                                                }
                                                placeholder="Search staff"
                                                noOptionsMessage={() =>
                                                    staffLoading
                                                        ? "Searching staff..."
                                                        : "No staff found"
                                                }
                                                onInputChange={(
                                                    value,
                                                    action
                                                ) => {
                                                    if (
                                                        action.action ===
                                                        "input-change"
                                                    ) {
                                                        setStaffSearch(
                                                            value
                                                        );
                                                    }
                                                }}
                                                onChange={(
                                                    option
                                                ) =>
                                                    setSelectedStaff(
                                                        option
                                                    )
                                                }
                                                styles={
                                                    selectStyles
                                                }
                                                menuPortalTarget={
                                                    document.body
                                                }
                                                menuPosition="fixed"
                                                maxMenuHeight={220}
                                            />
                                        </Col>

                                        <Col
                                            xl={3}
                                            lg={4}
                                            md={6}
                                        >
                                            <label className="form-label">
                                                Customer
                                            </label>

                                            <Select
                                                value={
                                                    selectedCustomer
                                                }
                                                options={
                                                    customerOptions
                                                }
                                                isClearable
                                                isSearchable
                                                isLoading={
                                                    customerLoading
                                                }
                                                filterOption={() =>
                                                    true
                                                }
                                                placeholder="Search customer"
                                                noOptionsMessage={() =>
                                                    customerLoading
                                                        ? "Searching customers..."
                                                        : "No customers found"
                                                }
                                                onInputChange={(
                                                    value,
                                                    action
                                                ) => {
                                                    if (
                                                        action.action ===
                                                        "input-change"
                                                    ) {
                                                        setCustomerSearch(
                                                            value
                                                        );
                                                    }
                                                }}
                                                onChange={(
                                                    option
                                                ) =>
                                                    setSelectedCustomer(
                                                        option
                                                    )
                                                }
                                                styles={
                                                    selectStyles
                                                }
                                                menuPortalTarget={
                                                    document.body
                                                }
                                                menuPosition="fixed"
                                                maxMenuHeight={220}
                                            />
                                        </Col>

                                        <Col
                                            xl={3}
                                            lg={4}
                                            md={6}
                                        >
                                            <label className="form-label">
                                                Bank
                                            </label>

                                            <Select
                                                value={
                                                    selectedBank
                                                }
                                                options={
                                                    bankOptions
                                                }
                                                isClearable
                                                isSearchable
                                                isLoading={
                                                    bankLoading
                                                }
                                                filterOption={() =>
                                                    true
                                                }
                                                placeholder="Search bank"
                                                noOptionsMessage={() =>
                                                    bankLoading
                                                        ? "Searching banks..."
                                                        : "No banks found"
                                                }
                                                onInputChange={(
                                                    value,
                                                    action
                                                ) => {
                                                    if (
                                                        action.action ===
                                                        "input-change"
                                                    ) {
                                                        setBankSearch(
                                                            value
                                                        );
                                                    }
                                                }}
                                                onChange={(
                                                    option
                                                ) =>
                                                    setSelectedBank(
                                                        option
                                                    )
                                                }
                                                styles={
                                                    selectStyles
                                                }
                                                menuPortalTarget={
                                                    document.body
                                                }
                                                menuPosition="fixed"
                                                maxMenuHeight={220}
                                            />
                                        </Col>

                                        <Col
                                            xl={3}
                                            lg={4}
                                            md={6}
                                        >
                                            <label className="form-label">
                                                Start Date
                                            </label>

                                            <Input
                                                type="date"
                                                value={startDate}
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
                                            xl={3}
                                            lg={4}
                                            md={6}
                                        >
                                            <label className="form-label">
                                                End Date
                                            </label>

                                            <Input
                                                type="date"
                                                value={endDate}
                                                min={
                                                    startDate ||
                                                    undefined
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
                                            xl={3}
                                            lg={4}
                                            md={6}
                                            className="d-flex align-items-end"
                                        >
                                            <div className="d-flex gap-2 w-100">
                                                <Button
                                                    color="primary"
                                                    className="flex-grow-1"
                                                    disabled={
                                                        filterLoading
                                                    }
                                                    onClick={
                                                        handleApplyFilters
                                                    }
                                                >
                                                    {filterLoading ? (
                                                        <>
                                                            <Spinner
                                                                size="sm"
                                                                className="me-2"
                                                            />

                                                            Filtering
                                                        </>
                                                    ) : (
                                                        "Filter"
                                                    )}
                                                </Button>

                                                <Button
                                                    color="secondary"
                                                    outline
                                                    disabled={
                                                        filterLoading
                                                    }
                                                    onClick={
                                                        handleResetFilters
                                                    }
                                                >
                                                    Reset
                                                </Button>
                                            </div>
                                        </Col>
                                    </Row>

                                    {loading ? (
                                        <div className="text-center py-5">
                                            <Spinner color="primary" />

                                            <div className="mt-2 text-muted">
                                                Loading
                                                receipts...
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="table-responsive">
                                                <Table
                                                    striped
                                                    bordered
                                                    hover
                                                    responsive
                                                    className="align-middle"
                                                >
                                                    <thead>
                                                        <tr>
                                                            <th>
                                                                #
                                                            </th>

                                                            <th>
                                                                Date
                                                            </th>

                                                            <th>
                                                                Receipt
                                                                No.
                                                            </th>

                                                            <th>
                                                                Type
                                                            </th>

                                                            <th>
                                                                Invoice
                                                            </th>

                                                            <th>
                                                                Customer
                                                            </th>

                                                            <th>
                                                                Bank
                                                            </th>

                                                            <th>
                                                                Created
                                                                By
                                                            </th>

                                                            <th>
                                                                Amount
                                                            </th>

                                                            <th>
                                                                Reference
                                                            </th>

                                                            <th>
                                                                Remark
                                                            </th>
                                                        </tr>
                                                    </thead>

                                                    <tbody>
                                                        {receipts.length >
                                                            0 ? (
                                                            receipts.map(
                                                                (
                                                                    receipt,
                                                                    index
                                                                ) => (
                                                                    <tr
                                                                        key={`${receipt.receipt_type}-${receipt.id}`}
                                                                    >
                                                                        <td>
                                                                            {(currentPage - 1) * 50 + index + 1}
                                                                        </td>

                                                                        <td>
                                                                            {receipt.received_at ||
                                                                                "N/A"}
                                                                        </td>

                                                                        <td>
                                                                            {receipt.payment_receipt ||
                                                                                "N/A"}
                                                                        </td>

                                                                        <td>
                                                                            {getReceiptTypeLabel(
                                                                                receipt.receipt_type
                                                                            )}
                                                                        </td>

                                                                        <td>
                                                                            {receipt.order_name ||
                                                                                "N/A"}
                                                                        </td>

                                                                        <td>
                                                                            {receipt.customer_name ||
                                                                                "N/A"}
                                                                        </td>

                                                                        <td>
                                                                            {receipt.bank_name ||
                                                                                "N/A"}
                                                                        </td>

                                                                        <td>
                                                                            {receipt.created_by_name ||
                                                                                "N/A"}
                                                                        </td>

                                                                        <td className="text-nowrap">
                                                                            {formatAmount(
                                                                                receipt.amount
                                                                            )}
                                                                        </td>

                                                                        <td>
                                                                            {receipt.transactionID ||
                                                                                "N/A"}
                                                                        </td>

                                                                        <td>
                                                                            {receipt.remark ||
                                                                                "N/A"}
                                                                        </td>
                                                                    </tr>
                                                                )
                                                            )
                                                        ) : (
                                                            <tr>
                                                                <td
                                                                    colSpan="11"
                                                                    className="text-center py-4"
                                                                >
                                                                    No
                                                                    receipts
                                                                    found.
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </Table>
                                            </div>

                                            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mt-3">
                                                <div className="text-muted">
                                                    {totalCount > 0
                                                        ? `Total receipts: ${totalCount}`
                                                        : "No receipt records"}
                                                </div>

                                                <div className="d-flex align-items-center gap-2">
                                                    <Button
                                                        color="primary"
                                                        outline
                                                        disabled={
                                                            !previousPage ||
                                                            filterLoading
                                                        }
                                                        onClick={
                                                            handlePreviousPage
                                                        }
                                                    >
                                                        Previous
                                                    </Button>

                                                    <span className="px-2">
                                                        Page{" "}
                                                        <strong>{currentPage}</strong>
                                                    </span>

                                                    <Button
                                                        color="primary"
                                                        outline
                                                        disabled={
                                                            !nextPage ||
                                                            filterLoading
                                                        }
                                                        onClick={
                                                            handleNextPage
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
                </div>
            </div>

            <ToastContainer />
        </React.Fragment>
    );
};

export default OtherReceipt;