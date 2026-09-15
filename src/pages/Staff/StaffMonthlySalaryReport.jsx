import React, {
    useEffect,
    useMemo,
    useState,
} from "react";

import axios from "axios";

import {
    Card,
    CardBody,
    CardTitle,
    Col,
    Container,
    Input,
    Label,
    Row,
    Spinner,
    Table,
} from "reactstrap";

import { ToastContainer, toast } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";

import Breadcrumbs from "../../components/Common/Breadcrumb";

const StaffMonthlySalaryReport = () => {
    document.title =
        "Staff Monthly Salary Report | Beposoft";

    const token = localStorage.getItem("token");

    const currentDate = new Date();

    // ============================================================
    // STATE
    // ============================================================

    const [salaryList, setSalaryList] = useState([]);

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");

    const [selectedYear, setSelectedYear] = useState(
        String(currentDate.getFullYear())
    );

    const [selectedMonth, setSelectedMonth] = useState(
        String(currentDate.getMonth() + 1)
    );

    const [searchText, setSearchText] = useState("");

    // ============================================================
    // MONTHS
    // ============================================================

    const months = [
        {
            value: "1",
            label: "January",
        },
        {
            value: "2",
            label: "February",
        },
        {
            value: "3",
            label: "March",
        },
        {
            value: "4",
            label: "April",
        },
        {
            value: "5",
            label: "May",
        },
        {
            value: "6",
            label: "June",
        },
        {
            value: "7",
            label: "July",
        },
        {
            value: "8",
            label: "August",
        },
        {
            value: "9",
            label: "September",
        },
        {
            value: "10",
            label: "October",
        },
        {
            value: "11",
            label: "November",
        },
        {
            value: "12",
            label: "December",
        },
    ];

    // ============================================================
    // YEARS
    // ============================================================

    const currentYear = currentDate.getFullYear();

    const years = [];

    for (
        let year = currentYear - 10;
        year <= currentYear + 1;
        year++
    ) {
        years.push(year);
    }

    // ============================================================
    // CURRENCY FORMATTER
    // ============================================================

    const formatCurrency = (value) => {
        const number = Number(value || 0);

        return number.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    // ============================================================
    // NUMBER FORMATTER
    // ============================================================

    const formatNumber = (value) => {
        const number = Number(value || 0);

        if (Number.isInteger(number)) {
            return number.toString();
        }

        return number.toFixed(1);
    };

    // ============================================================
    // MONTH NAME
    // ============================================================

    const getMonthName = (monthNumber) => {
        const month = months.find(
            (item) =>
                Number(item.value) ===
                Number(monthNumber)
        );

        return month?.label || "-";
    };

    // ============================================================
    // FETCH MONTHLY SALARY
    // ============================================================

    const fetchMonthlySalary = async () => {
        try {
            setLoading(true);

            setError("");

            const baseUrl =
                import.meta.env.VITE_APP_KEY;

            const response = await axios.get(
                `${baseUrl}staff/monthly/salary/`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },

                    params: {
                        year: selectedYear,
                        month: selectedMonth,
                    },
                }
            );

            if (
                response?.data?.status ===
                "success"
            ) {
                const data =
                    response?.data?.data || [];

                setSalaryList(
                    Array.isArray(data)
                        ? data
                        : []
                );
            } else {
                const message =
                    response?.data?.message ||
                    "Failed to fetch monthly salary data.";

                setSalaryList([]);

                setError(message);

                toast.error(message);
            }
        } catch (err) {
            console.error(
                "Monthly salary fetch error:",
                err?.response?.data ||
                    err.message
            );

            const message =
                err?.response?.data?.message ||
                "Failed to fetch monthly salary data.";

            setSalaryList([]);

            setError(message);

            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // FETCH WHEN MONTH / YEAR CHANGES
    // ============================================================

    useEffect(() => {
        if (token) {
            fetchMonthlySalary();
        }
    }, [
        token,
        selectedYear,
        selectedMonth,
    ]);

    // ============================================================
    // SEARCH FILTER
    // ============================================================

    const filteredSalaryList = useMemo(() => {
        const search =
            searchText
                .toLowerCase()
                .trim();

        if (!search) {
            return salaryList;
        }

        return salaryList.filter(
            (item) => {
                const searchableText = [
                    item.staff_name,
                    item.staff_id,
                    item.month,
                    item.year,
                    item.note,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                return searchableText.includes(
                    search
                );
            }
        );
    }, [
        salaryList,
        searchText,
    ]);

    // ============================================================
    // SUMMARY
    // ============================================================

    const summary = useMemo(() => {
        return salaryList.reduce(
            (result, item) => {
                result.totalStaff += 1;

                result.totalBaseSalary +=
                    Number(
                        item.monthly_salary || 0
                    );

                result.totalBonus +=
                    Number(
                        item.bonus || 0
                    );

                result.totalIncentives +=
                    Number(
                        item.incentives || 0
                    );

                result.totalFines +=
                    Number(
                        item.fines || 0
                    );

                result.totalLateDeduction +=
                    Number(
                        item.late_come_deduction ||
                            0
                    );

                result.totalFinalSalary +=
                    Number(
                        item.final_salary || 0
                    );

                return result;
            },
            {
                totalStaff: 0,

                totalBaseSalary: 0,

                totalBonus: 0,

                totalIncentives: 0,

                totalFines: 0,

                totalLateDeduction: 0,

                totalFinalSalary: 0,
            }
        );
    }, [salaryList]);

    // ============================================================
    // RETURN
    // ============================================================

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <Breadcrumbs
                        title="Staff"
                        breadcrumbItem="Monthly Salary Report"
                    />

                    <ToastContainer />

                    {/* ================================================= */}
                    {/* FILTER CARD */}
                    {/* ================================================= */}

                    <Card className="mb-4">
                        <CardBody>
                            <CardTitle className="mb-4">
                                Monthly Salary Report
                            </CardTitle>

                            <Row>
                                {/* YEAR */}

                                <Col
                                    lg={3}
                                    md={4}
                                    className="mb-3"
                                >
                                    <Label>
                                        Year
                                    </Label>

                                    <Input
                                        type="select"
                                        value={
                                            selectedYear
                                        }
                                        onChange={(e) =>
                                            setSelectedYear(
                                                e.target.value
                                            )
                                        }
                                        disabled={
                                            loading
                                        }
                                    >
                                        {years.map(
                                            (year) => (
                                                <option
                                                    key={
                                                        year
                                                    }
                                                    value={
                                                        year
                                                    }
                                                >
                                                    {
                                                        year
                                                    }
                                                </option>
                                            )
                                        )}
                                    </Input>
                                </Col>

                                {/* MONTH */}

                                <Col
                                    lg={3}
                                    md={4}
                                    className="mb-3"
                                >
                                    <Label>
                                        Month
                                    </Label>

                                    <Input
                                        type="select"
                                        value={
                                            selectedMonth
                                        }
                                        onChange={(e) =>
                                            setSelectedMonth(
                                                e.target.value
                                            )
                                        }
                                        disabled={
                                            loading
                                        }
                                    >
                                        {months.map(
                                            (month) => (
                                                <option
                                                    key={
                                                        month.value
                                                    }
                                                    value={
                                                        month.value
                                                    }
                                                >
                                                    {
                                                        month.label
                                                    }
                                                </option>
                                            )
                                        )}
                                    </Input>
                                </Col>

                                {/* SEARCH */}

                                <Col
                                    lg={6}
                                    md={4}
                                    className="mb-3"
                                >
                                    <Label>
                                        Search Staff
                                    </Label>

                                    <Input
                                        type="text"
                                        value={
                                            searchText
                                        }
                                        onChange={(e) =>
                                            setSearchText(
                                                e.target.value
                                            )
                                        }
                                        placeholder="Search by staff name or staff ID"
                                    />
                                </Col>
                            </Row>

                            <div className="text-muted">
                                Showing salary records for{" "}
                                <strong>
                                    {getMonthName(
                                        selectedMonth
                                    )}{" "}
                                    {selectedYear}
                                </strong>
                            </div>
                        </CardBody>
                    </Card>

                    {/* ================================================= */}
                    {/* LOADING */}
                    {/* ================================================= */}

                    {loading && (
                        <Card className="mb-4">
                            <CardBody>
                                <div
                                    className="d-flex justify-content-center align-items-center"
                                    style={{
                                        minHeight:
                                            "200px",
                                    }}
                                >
                                    <Spinner
                                        color="primary"
                                    />

                                    <span className="ms-2">
                                        Loading monthly
                                        salary data...
                                    </span>
                                </div>
                            </CardBody>
                        </Card>
                    )}

                    {/* ================================================= */}
                    {/* ERROR */}
                    {/* ================================================= */}

                    {!loading &&
                        error && (
                            <div
                                className="alert alert-danger"
                                role="alert"
                            >
                                {error}
                            </div>
                        )}

                    {/* ================================================= */}
                    {/* DATA */}
                    {/* ================================================= */}

                    {!loading &&
                        !error && (
                            <>
                                {/* ===================================== */}
                                {/* SUMMARY CARDS */}
                                {/* ===================================== */}

                                <Row className="mb-4">
                                    {/* TOTAL STAFF */}

                                    <Col
                                        xl={3}
                                        md={6}
                                        className="mb-3"
                                    >
                                        <Card className="h-100">
                                            <CardBody>
                                                <div className="text-muted mb-2">
                                                    Total
                                                    Staff
                                                </div>

                                                <h3 className="mb-0">
                                                    {
                                                        summary.totalStaff
                                                    }
                                                </h3>
                                            </CardBody>
                                        </Card>
                                    </Col>

                                    {/* BASE SALARY */}

                                    <Col
                                        xl={3}
                                        md={6}
                                        className="mb-3"
                                    >
                                        <Card className="h-100">
                                            <CardBody>
                                                <div className="text-muted mb-2">
                                                    Total
                                                    Base
                                                    Salary
                                                </div>

                                                <h3 className="mb-0">
                                                    ₹
                                                    {formatCurrency(
                                                        summary.totalBaseSalary
                                                    )}
                                                </h3>
                                            </CardBody>
                                        </Card>
                                    </Col>

                                    {/* BONUS */}

                                    <Col
                                        xl={3}
                                        md={6}
                                        className="mb-3"
                                    >
                                        <Card className="h-100">
                                            <CardBody>
                                                <div className="text-muted mb-2">
                                                    Total
                                                    Bonus
                                                </div>

                                                <h3 className="mb-0 text-success">
                                                    ₹
                                                    {formatCurrency(
                                                        summary.totalBonus
                                                    )}
                                                </h3>
                                            </CardBody>
                                        </Card>
                                    </Col>

                                    {/* INCENTIVES */}

                                    <Col
                                        xl={3}
                                        md={6}
                                        className="mb-3"
                                    >
                                        <Card className="h-100">
                                            <CardBody>
                                                <div className="text-muted mb-2">
                                                    Total
                                                    Incentives
                                                </div>

                                                <h3 className="mb-0 text-success">
                                                    ₹
                                                    {formatCurrency(
                                                        summary.totalIncentives
                                                    )}
                                                </h3>
                                            </CardBody>
                                        </Card>
                                    </Col>

                                    {/* FINES */}

                                    <Col
                                        xl={3}
                                        md={6}
                                        className="mb-3"
                                    >
                                        <Card className="h-100">
                                            <CardBody>
                                                <div className="text-muted mb-2">
                                                    Total
                                                    Fines
                                                </div>

                                                <h3 className="mb-0 text-danger">
                                                    ₹
                                                    {formatCurrency(
                                                        summary.totalFines
                                                    )}
                                                </h3>
                                            </CardBody>
                                        </Card>
                                    </Col>

                                    {/* LATE DEDUCTION */}

                                    <Col
                                        xl={3}
                                        md={6}
                                        className="mb-3"
                                    >
                                        <Card className="h-100">
                                            <CardBody>
                                                <div className="text-muted mb-2">
                                                    Late
                                                    Come
                                                    Deduction
                                                </div>

                                                <h3 className="mb-0 text-danger">
                                                    ₹
                                                    {formatCurrency(
                                                        summary.totalLateDeduction
                                                    )}
                                                </h3>
                                            </CardBody>
                                        </Card>
                                    </Col>

                                    {/* FINAL SALARY */}

                                    <Col
                                        xl={6}
                                        md={12}
                                        className="mb-3"
                                    >
                                        <Card className="h-100">
                                            <CardBody>
                                                <div className="text-muted mb-2">
                                                    Total
                                                    Final
                                                    Salary
                                                </div>

                                                <h2 className="mb-0 text-success">
                                                    ₹
                                                    {formatCurrency(
                                                        summary.totalFinalSalary
                                                    )}
                                                </h2>
                                            </CardBody>
                                        </Card>
                                    </Col>
                                </Row>

                                {/* ===================================== */}
                                {/* SALARY TABLE */}
                                {/* ===================================== */}

                                <Card className="mb-4">
                                    <CardBody>
                                        <div className="d-flex justify-content-between align-items-center mb-4">
                                            <CardTitle className="mb-0">
                                                Staff
                                                Salary
                                                Details
                                            </CardTitle>

                                            <div className="text-muted">
                                                {
                                                    filteredSalaryList.length
                                                }{" "}
                                                Record
                                                {filteredSalaryList.length !==
                                                1
                                                    ? "s"
                                                    : ""}
                                            </div>
                                        </div>

                                        {filteredSalaryList.length ===
                                        0 ? (
                                            <div
                                                className="text-center text-muted"
                                                style={{
                                                    padding:
                                                        "50px 20px",
                                                }}
                                            >
                                                No monthly
                                                salary records
                                                found for{" "}
                                                {getMonthName(
                                                    selectedMonth
                                                )}{" "}
                                                {
                                                    selectedYear
                                                }
                                                .
                                            </div>
                                        ) : (
                                            <div
                                                className="table-responsive"
                                                style={{
                                                    maxHeight:
                                                        "650px",
                                                    overflowY:
                                                        "auto",
                                                }}
                                            >
                                                <Table
                                                    bordered
                                                    hover
                                                    className="align-middle mb-0"
                                                    style={{
                                                        whiteSpace:
                                                            "nowrap",
                                                    }}
                                                >
                                                    <thead
                                                        className="table-light"
                                                        style={{
                                                            position:
                                                                "sticky",
                                                            top: 0,
                                                            zIndex:
                                                                2,
                                                        }}
                                                    >
                                                        <tr>
                                                            <th>
                                                                SL
                                                            </th>

                                                            <th>
                                                                Staff
                                                                ID
                                                            </th>

                                                            <th>
                                                                Staff
                                                                Name
                                                            </th>

                                                            <th className="text-center">
                                                                Present
                                                            </th>

                                                            <th className="text-center">
                                                                Absent
                                                            </th>

                                                            <th className="text-center">
                                                                Half
                                                                Day
                                                            </th>

                                                            <th className="text-center">
                                                                Paid
                                                                Leave
                                                            </th>

                                                            <th className="text-end">
                                                                Monthly
                                                                Salary
                                                            </th>

                                                            <th className="text-end">
                                                                Per
                                                                Day
                                                            </th>

                                                            <th className="text-end">
                                                                Attendance
                                                                Payable
                                                            </th>

                                                            <th className="text-end">
                                                                Bonus
                                                            </th>

                                                            <th className="text-end">
                                                                Incentives
                                                            </th>

                                                            <th className="text-center">
                                                                Late
                                                                Comes
                                                            </th>

                                                            <th className="text-center">
                                                                Late
                                                                Leave
                                                            </th>

                                                            <th className="text-end">
                                                                Late
                                                                Deduction
                                                            </th>

                                                            <th className="text-end">
                                                                Fines
                                                            </th>

                                                            <th className="text-end">
                                                                Final
                                                                Salary
                                                            </th>

                                                            <th>
                                                                Note
                                                            </th>
                                                        </tr>
                                                    </thead>

                                                    <tbody>
                                                        {filteredSalaryList.map(
                                                            (
                                                                item,
                                                                index
                                                            ) => (
                                                                <tr
                                                                    key={
                                                                        item.id
                                                                    }
                                                                >
                                                                    {/* SL */}

                                                                    <td>
                                                                        {index +
                                                                            1}
                                                                    </td>

                                                                    {/* STAFF ID */}

                                                                    <td>
                                                                        <strong>
                                                                            {item.staff_id ||
                                                                                "-"}
                                                                        </strong>
                                                                    </td>

                                                                    {/* STAFF NAME */}

                                                                    <td>
                                                                        <strong>
                                                                            {item.staff_name ||
                                                                                "-"}
                                                                        </strong>

                                                                        <div
                                                                            className="text-muted"
                                                                            style={{
                                                                                fontSize:
                                                                                    "12px",
                                                                            }}
                                                                        >
                                                                            {getMonthName(
                                                                                item.month
                                                                            )}{" "}
                                                                            {
                                                                                item.year
                                                                            }
                                                                        </div>
                                                                    </td>

                                                                    {/* PRESENT */}

                                                                    <td className="text-center">
                                                                        <span className="text-success fw-bold">
                                                                            {formatNumber(
                                                                                item.present
                                                                            )}
                                                                        </span>
                                                                    </td>

                                                                    {/* ABSENT */}

                                                                    <td className="text-center">
                                                                        <span className="text-danger fw-bold">
                                                                            {formatNumber(
                                                                                item.absent
                                                                            )}
                                                                        </span>
                                                                    </td>

                                                                    {/* HALF DAY */}

                                                                    <td className="text-center">
                                                                        <span className="text-warning fw-bold">
                                                                            {formatNumber(
                                                                                item.half_day
                                                                            )}
                                                                        </span>
                                                                    </td>

                                                                    {/* PAID LEAVE */}

                                                                    <td className="text-center">
                                                                        {formatNumber(
                                                                            item.paid_leaves
                                                                        )}
                                                                    </td>

                                                                    {/* MONTHLY SALARY */}

                                                                    <td className="text-end">
                                                                        ₹
                                                                        {formatCurrency(
                                                                            item.monthly_salary
                                                                        )}
                                                                    </td>

                                                                    {/* PER DAY */}

                                                                    <td className="text-end">
                                                                        ₹
                                                                        {formatCurrency(
                                                                            item.per_day_salary
                                                                        )}
                                                                    </td>

                                                                    {/* ATTENDANCE PAYABLE */}

                                                                    <td className="text-end">
                                                                        ₹
                                                                        {formatCurrency(
                                                                            item.attendance_payable_salary
                                                                        )}
                                                                    </td>

                                                                    {/* BONUS */}

                                                                    <td className="text-end text-success fw-bold">
                                                                        + ₹
                                                                        {formatCurrency(
                                                                            item.bonus
                                                                        )}
                                                                    </td>

                                                                    {/* INCENTIVES */}

                                                                    <td className="text-end text-success fw-bold">
                                                                        + ₹
                                                                        {formatCurrency(
                                                                            item.incentives
                                                                        )}
                                                                    </td>

                                                                    {/* LATE COMES */}

                                                                    <td className="text-center">
                                                                        {
                                                                            item.late_comes
                                                                        }
                                                                    </td>

                                                                    {/* LATE LEAVE */}

                                                                    <td className="text-center">
                                                                        {formatNumber(
                                                                            item.late_leave_days
                                                                        )}
                                                                    </td>

                                                                    {/* LATE DEDUCTION */}

                                                                    <td className="text-end text-danger">
                                                                        - ₹
                                                                        {formatCurrency(
                                                                            item.late_come_deduction
                                                                        )}
                                                                    </td>

                                                                    {/* FINES */}

                                                                    <td className="text-end text-danger">
                                                                        - ₹
                                                                        {formatCurrency(
                                                                            item.fines
                                                                        )}
                                                                    </td>

                                                                    {/* FINAL SALARY */}

                                                                    <td className="text-end">
                                                                        <strong className="text-success">
                                                                            ₹
                                                                            {formatCurrency(
                                                                                item.final_salary
                                                                            )}
                                                                        </strong>
                                                                    </td>

                                                                    {/* NOTE */}

                                                                    <td
                                                                        style={{
                                                                            minWidth:
                                                                                "180px",
                                                                            maxWidth:
                                                                                "250px",
                                                                            whiteSpace:
                                                                                "normal",
                                                                        }}
                                                                    >
                                                                        {item.note ||
                                                                            "-"}
                                                                    </td>
                                                                </tr>
                                                            )
                                                        )}
                                                    </tbody>

                                                    {/* ================= */}
                                                    {/* TOTAL ROW */}
                                                    {/* ================= */}

                                                    <tfoot className="table-light">
                                                        <tr>
                                                            <th
                                                                colSpan={
                                                                    7
                                                                }
                                                                className="text-end"
                                                            >
                                                                TOTAL
                                                            </th>

                                                            <th className="text-end">
                                                                ₹
                                                                {formatCurrency(
                                                                    summary.totalBaseSalary
                                                                )}
                                                            </th>

                                                            <th />

                                                            <th />

                                                            <th className="text-end text-success">
                                                                + ₹
                                                                {formatCurrency(
                                                                    summary.totalBonus
                                                                )}
                                                            </th>

                                                            <th className="text-end text-success">
                                                                + ₹
                                                                {formatCurrency(
                                                                    summary.totalIncentives
                                                                )}
                                                            </th>

                                                            <th />

                                                            <th />

                                                            <th className="text-end text-danger">
                                                                - ₹
                                                                {formatCurrency(
                                                                    summary.totalLateDeduction
                                                                )}
                                                            </th>

                                                            <th className="text-end text-danger">
                                                                - ₹
                                                                {formatCurrency(
                                                                    summary.totalFines
                                                                )}
                                                            </th>

                                                            <th className="text-end text-success">
                                                                ₹
                                                                {formatCurrency(
                                                                    summary.totalFinalSalary
                                                                )}
                                                            </th>

                                                            <th />
                                                        </tr>
                                                    </tfoot>
                                                </Table>
                                            </div>
                                        )}
                                    </CardBody>
                                </Card>
                            </>
                        )}
                </Container>
            </div>
        </React.Fragment>
    );
};

export default StaffMonthlySalaryReport;