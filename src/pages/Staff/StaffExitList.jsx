import axios from "axios";
import React, { useEffect, useState } from "react";
import {
    Card,
    Col,
    Container,
    Row,
    CardBody,
    CardTitle,
    Table,
    Input,
    Button,
    Label,
} from "reactstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { useNavigate } from "react-router-dom";

const StaffExitList = () => {
    document.title = "Staff Exit List | Beposoft";

    const token = localStorage.getItem("token");
    const navigate = useNavigate();

    const [exitList, setExitList] = useState([]);
    const [departmentList, setDepartmentList] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [employeeDepartment, setEmployeeDepartment] = useState("");
    const [exitDateFrom, setExitDateFrom] = useState("");
    const [exitDateTo, setExitDateTo] = useState("");

    const [page, setPage] = useState(1);
    const [count, setCount] = useState(0);
    const [nextPageUrl, setNextPageUrl] = useState(null);
    const [previousPageUrl, setPreviousPageUrl] = useState(null);

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString("en-GB");
    };

    const formatReasonType = (value) => {
        if (!value) return "-";
        return value.charAt(0).toUpperCase() + value.slice(1);
    };

    const fetchDepartments = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}departments/`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.status === 200) {
                setDepartmentList(response?.data?.data || []);
            } else {
                toast.error("Failed to fetch departments");
            }
        } catch (error) {
            console.error("Error fetching departments:", error);
            toast.error(
                error?.response?.data?.message ||
                    error?.response?.data?.detail ||
                    "Error fetching departments"
            );
        }
    };

    const fetchExitList = async (pageNumber = 1) => {
        try {
            setLoading(true);

            const params = {
                page: pageNumber,
            };

            if (search.trim()) {
                params.search = search.trim();
            }

            if (employeeDepartment) {
                params.employee_department = employeeDepartment;
            }

            if (exitDateFrom) {
                params.exit_date_from = exitDateFrom;
            }

            if (exitDateTo) {
                params.exit_date_to = exitDateTo;
            }

            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}employee/exit/add/`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    params,
                }
            );

            if (response.status === 200) {
                const responseData = response?.data || {};
                const resultsObject = responseData?.results || {};
                const rows = Array.isArray(resultsObject?.data)
                    ? resultsObject.data
                    : [];

                setExitList(rows);
                setCount(responseData?.count || 0);
                setNextPageUrl(responseData?.next || null);
                setPreviousPageUrl(responseData?.previous || null);
                setPage(pageNumber);
            } else {
                toast.error("Failed to fetch exit list");
            }
        } catch (error) {
            console.error("Error fetching exit list:", error);
            toast.error(
                error?.response?.data?.message ||
                    error?.response?.data?.detail ||
                    "Error fetching exit list"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchDepartments();
            fetchExitList(1);
        } else {
            toast.error("Token not found");
            setLoading(false);
        }
    }, [token]);

    const handleSearch = () => {
        fetchExitList(1);
    };

    const handleReset = () => {
        setSearch("");
        setEmployeeDepartment("");
        setExitDateFrom("");
        setExitDateTo("");

        setTimeout(() => {
            fetchExitList(1);
        }, 0);
    };

    const handlePrevious = () => {
        if (previousPageUrl && page > 1) {
            fetchExitList(page - 1);
        }
    };

    const handleNext = () => {
        if (nextPageUrl) {
            fetchExitList(page + 1);
        }
    };

    const handleView = (id) => {
        if (!id) {
            toast.error("ID not found for this record");
            return;
        }
        navigate(`/staff/exit/view/${id}`);
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid={true}>
                    <Breadcrumbs title="Tables" breadcrumbItem="Staff Exit List" />

                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                                        <CardTitle className="mb-0">
                                            Staff Exit List
                                        </CardTitle>
                                    </div>

                                    <Row className="mb-4">
                                        <Col lg={3}>
                                            <div className="mb-3">
                                                <Label>Search</Label>
                                                <Input
                                                    type="text"
                                                    placeholder="Search employee name"
                                                    value={search}
                                                    onChange={(e) => setSearch(e.target.value)}
                                                />
                                            </div>
                                        </Col>

                                        <Col lg={3}>
                                            <div className="mb-3">
                                                <Label>Department</Label>
                                                <select
                                                    className="form-control"
                                                    value={employeeDepartment}
                                                    onChange={(e) =>
                                                        setEmployeeDepartment(e.target.value)
                                                    }
                                                >
                                                    <option value="">Select Department</option>
                                                    {departmentList.length > 0 ? (
                                                        departmentList.map((dept) => (
                                                            <option key={dept.id} value={dept.id}>
                                                                {dept.name}
                                                            </option>
                                                        ))
                                                    ) : (
                                                        <option disabled>
                                                            No departments available
                                                        </option>
                                                    )}
                                                </select>
                                            </div>
                                        </Col>

                                        <Col lg={3}>
                                            <div className="mb-3">
                                                <Label>Exit Date From</Label>
                                                <Input
                                                    type="date"
                                                    value={exitDateFrom}
                                                    onChange={(e) =>
                                                        setExitDateFrom(e.target.value)
                                                    }
                                                />
                                            </div>
                                        </Col>

                                        <Col lg={3}>
                                            <div className="mb-3">
                                                <Label>Exit Date To</Label>
                                                <Input
                                                    type="date"
                                                    value={exitDateTo}
                                                    onChange={(e) => setExitDateTo(e.target.value)}
                                                />
                                            </div>
                                        </Col>
                                    </Row>

                                    <Row className="mb-4">
                                        <Col lg={8}>
                                            <div className="d-flex flex-wrap gap-2">
                                                <Button color="primary" onClick={handleSearch}>
                                                    Search
                                                </Button>
                                                <Button
                                                    color="secondary"
                                                    outline
                                                    onClick={handleReset}
                                                >
                                                    Reset
                                                </Button>
                                                <Button
                                                    color="info"
                                                    onClick={() => fetchExitList(page)}
                                                >
                                                    Refresh
                                                </Button>
                                            </div>
                                        </Col>
                                        <Col>
                                            <div className="text-end">
                                                Total Records: <strong>{count}</strong>
                                            </div>
                                        </Col>
                                    </Row>

                                    {loading ? (
                                        <p>Loading...</p>
                                    ) : (
                                        <div className="table-responsive">
                                            <Table className="table table-bordered table-striped align-middle mb-0">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>#</th>
                                                        <th>Employee ID</th>
                                                        <th>Employee Name</th>
                                                        <th>Department</th>
                                                        <th>Designation</th>
                                                        <th>Date Of Joining</th>
                                                        <th>Exit Date</th>
                                                        <th>Reason Type</th>
                                                        <th>Handover To</th>
                                                        <th>Exit Form Date</th>
                                                        <th>Created By</th>
                                                        <th>Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {exitList.length > 0 ? (
                                                        exitList.map((item, index) => (
                                                            <tr key={item.id || index}>
                                                                <td>{index + 1}</td>
                                                                <td>{item.employee_id || "-"}</td>
                                                                <td>{item.employee_name || "-"}</td>
                                                                <td>
                                                                    {item.employee_department || "-"}
                                                                </td>
                                                                <td>
                                                                    {item.employee_designation || "-"}
                                                                </td>
                                                                <td>
                                                                    {formatDate(
                                                                        item.employee_date_of_joining
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    {formatDate(item.exit_date)}
                                                                </td>
                                                                <td>
                                                                    {formatReasonType(
                                                                        item.reason_type
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    {item.handover_to_name || "-"}
                                                                </td>
                                                                <td>
                                                                    {formatDate(item.exit_form_date)}
                                                                </td>
                                                                <td>
                                                                    {item.created_by_name || "-"}
                                                                </td>
                                                                <td>
                                                                    <Button
                                                                        color="primary"
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            handleView(item.id)
                                                                        }
                                                                    >
                                                                        View
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="12" className="text-center">
                                                                No staff exit data found
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </Table>
                                        </div>
                                    )}

                                    <div className="mt-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
                                        <div></div>

                                        <div className="d-flex gap-2">
                                            <Button
                                                color="secondary"
                                                onClick={handlePrevious}
                                                disabled={!previousPageUrl}
                                            >
                                                Previous
                                            </Button>

                                            <Button color="light" disabled>
                                                Page {page}
                                            </Button>

                                            <Button
                                                color="secondary"
                                                onClick={handleNext}
                                                disabled={!nextPageUrl}
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
                <ToastContainer />
            </div>
        </React.Fragment>
    );
};

export default StaffExitList;