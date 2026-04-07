import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
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
} from "reactstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Breadcrumbs from "../../components/Common/Breadcrumb";

const SalesDataAll = () => {
    document.title = "All Sales Team Daily Reports | Beposoft";

    const token = localStorage.getItem("token");
    const baseUrl = import.meta.env.VITE_APP_KEY;

    const [loading, setLoading] = useState(false);
    const [tableLoading, setTableLoading] = useState(false);
    const [pageError, setPageError] = useState("");

    const [reports, setReports] = useState([]);

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
                `${baseUrl}sales/team/daily/report/all/?${params.toString()}`,
                {
                    headers: getAuthHeaders(),
                }
            );

            console.log("API Response:", response);

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
                "Failed to fetch all sales team daily reports";

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

    useEffect(() => {
        if (!token) {
            setPageError("Token not found");
            return;
        }

        const init = async () => {
            setLoading(true);
            await fetchReports(1);
            setLoading(false);
        };

        init();
    }, [token]);

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
                        breadcrumbItem="All Sales Team Daily Reports"
                    />

                    {loading ? (
                        <Row>
                            <Col xl={12}>
                                <Card>
                                    <CardBody className="text-center py-5">
                                        <Spinner color="primary" />
                                        <div className="mt-3">
                                            Loading all sales team daily reports...
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
                                                All Sales Team Daily Reports
                                            </CardTitle>

                                            <Button
                                                color="primary"
                                                outline
                                                onClick={() => fetchReports(currentPage)}
                                                disabled={tableLoading}
                                            >
                                                {tableLoading ? "Refreshing..." : "Refresh"}
                                            </Button>
                                        </div>

                                        {pageError ? (
                                            <div className="alert alert-danger py-2">
                                                {pageError}
                                            </div>
                                        ) : null}

                                        <Row className="mb-3">
                                            <Col md={4}>
                                                <label className="form-label" htmlFor="search">
                                                    Search
                                                </label>
                                                <InputGroup>
                                                    <InputGroupText>
                                                        <i className="bx bx-search" />
                                                    </InputGroupText>
                                                    <Input
                                                        id="search"
                                                        type="text"
                                                        placeholder="Search team or BDO..."
                                                        value={searchText}
                                                        onChange={(e) =>
                                                            setSearchText(e.target.value)
                                                        }
                                                    />
                                                </InputGroup>
                                            </Col>

                                            <Col md={3}>
                                                <label className="form-label" htmlFor="start_date">
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

                                            <Col md={3}>
                                                <label className="form-label" htmlFor="end_date">
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
                                                            Page Conversions
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
                                                                <th style={{ minWidth: "70px" }}>#</th>
                                                                <th style={{ minWidth: "170px" }}>
                                                                    Team
                                                                </th>
                                                                <th style={{ minWidth: "170px" }}>
                                                                    BDO
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
                                                                <th style={{ minWidth: "180px" }}>
                                                                    Created At
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
                                                                    <td>{item?.created_by_name || "-"}</td>
                                                                    <td>{item?.state_name || "-"}</td>
                                                                    <td>{item?.district_name || "-"}</td>
                                                                    <td>{item?.unbilled ?? 0}</td>
                                                                    <td>{item?.billed ?? 0}</td>
                                                                    <td>{item?.new_customers ?? 0}</td>
                                                                    <td>{item?.new_conversions ?? 0}</td>
                                                                    <td>
                                                                        {item?.created_at
                                                                            ? new Date(
                                                                                  item.created_at
                                                                              ).toLocaleString()
                                                                            : "-"}
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

export default SalesDataAll;