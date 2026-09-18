import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
    Card,
    CardBody,
    Row,
    Col,
    Button,
    Table,
    Input,
} from "reactstrap";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ReactApexChart from "react-apexcharts";
import {
    FaArrowLeft,
    FaChevronLeft,
    FaChevronRight,
    FaSearch,
} from "react-icons/fa";

const HourlyFamilyOrderDetails = () => {

    const token = localStorage.getItem("token");

    const navigate = useNavigate();
    const location = useLocation();
    const { familyId } = useParams();

    const passedState = location.state || {};

    const getLocalDateString = () => {
        const date = new Date();

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    const [startDate, setStartDate] = useState(
        passedState.startDate || getLocalDateString()
    );

    const [endDate, setEndDate] = useState(
        passedState.endDate || getLocalDateString()
    );

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    const [page, setPage] = useState(1);

    const [search, setSearch] = useState("");

    // =====================================================
    // FETCH FAMILY HOURLY ORDER DETAILS
    // =====================================================

    useEffect(() => {

        const fetchHourlyFamilyDetails = async () => {

            if (!token || !familyId) {
                return;
            }

            if (!startDate || !endDate) {
                return;
            }

            if (startDate > endDate) {
                toast.error("Start date cannot be after end date");
                return;
            }

            try {

                setLoading(true);

                const response = await axios.get(
                    `${import.meta.env.VITE_APP_KEY}orders/hourly/family/${familyId}/`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        params: {
                            start_date: startDate,
                            end_date: endDate,
                            page: page,
                        },
                    }
                );

                console.log(
                    "Hourly Family Order Details Response:",
                    response.data
                );

                setData(response?.data || null);

            } catch (error) {

                console.error(
                    "Error fetching hourly family details:",
                    error
                );

                setData(null);

                toast.error(
                    "Failed to fetch hourly family order details"
                );

            } finally {

                setLoading(false);
            }
        };

        fetchHourlyFamilyDetails();

    }, [
        token,
        familyId,
        startDate,
        endDate,
        page
    ]);

    // =====================================================
    // FORMAT HOUR
    // =====================================================

    const formatHourRange = (hourRange) => {

        if (!hourRange) return "";

        const [start, end] = hourRange.split("-");

        const startHour = Number(
            start?.split(":")[0] || 0
        );

        const endHour = Number(
            end?.split(":")[0] || 0
        );

        const formatHour = (hour) => {

            if (hour === 0) return "12";

            if (hour > 12) {
                return String(hour - 12);
            }

            return String(hour);
        };

        const startPeriod =
            startHour >= 12 ? "PM" : "AM";

        const endPeriod =
            endHour >= 12 ? "PM" : "AM";

        if (startPeriod === endPeriod) {

            return `${formatHour(startHour)}–${formatHour(endHour)} ${endPeriod}`;
        }

        return `${formatHour(startHour)} ${startPeriod}–${formatHour(endHour)} ${endPeriod}`;
    };

    // =====================================================
    // FORMAT DATE/TIME
    // =====================================================

    const formatDateTime = (value) => {

        if (!value) return "-";

        const date = new Date(value);

        return date.toLocaleString("en-IN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    // =====================================================
    // FORMAT AMOUNT
    // =====================================================

    const formatAmount = (amount) => {

        return Number(amount || 0).toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }
        );
    };

    // =====================================================
    // HOURLY SUMMARY
    // =====================================================

    const hourlyOrders =
        data?.summary?.hourly_orders || [];

    const visibleHourlyOrders =
        hourlyOrders.filter(
            (item) =>
                Number(item?.orders || 0) > 0
        );

    const chartCategories =
        visibleHourlyOrders.map(
            (item) => item.hour
        );

    const chartSeries = [
        {
            name: "Orders",
            data: visibleHourlyOrders.map(
                (item) =>
                    Number(item?.orders || 0)
            ),
        },
    ];

    // =====================================================
    // CHART
    // =====================================================

    const chartOptions = {

        chart: {
            type: "bar",
            toolbar: {
                show: false,
            },
            zoom: {
                enabled: false,
            },
            fontFamily:
                "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        },

        colors: [
            "#2563EB",
        ],

        plotOptions: {
            bar: {
                borderRadius: 5,
                columnWidth: "45%",
                dataLabels: {
                    position: "top",
                },
            },
        },

        dataLabels: {

            enabled: true,

            formatter: function (value) {

                if (Number(value || 0) <= 0) {
                    return "";
                }

                return Number(value).toLocaleString(
                    "en-IN"
                );
            },

            offsetY: -18,

            style: {
                fontSize: "12px",
                fontWeight: 700,
                colors: ["#1E293B"],
            },

            background: {
                enabled: false,
            },
        },

        xaxis: {

            categories: chartCategories,

            labels: {

                formatter: function (value) {
                    return formatHourRange(value);
                },

                style: {
                    fontSize: "11px",
                    colors: "#64748B",
                },
            },

            axisBorder: {
                color: "#E2E8F0",
            },

            axisTicks: {
                show: false,
            },
        },

        yaxis: {

            min: 0,

            labels: {

                formatter: function (value) {

                    const number =
                        Number(value || 0);

                    if (number >= 1000000) {
                        return `${(
                            number / 1000000
                        ).toFixed(1)}M`;
                    }

                    if (number >= 1000) {
                        return `${(
                            number / 1000
                        ).toFixed(1)}K`;
                    }

                    return Math.round(
                        number
                    ).toString();
                },

                style: {
                    colors: "#94A3B8",
                },
            },
        },

        grid: {
            borderColor: "#EEF2F7",
            strokeDashArray: 4,
        },

        tooltip: {

            y: {
                formatter: function (value) {
                    return `${Number(
                        value || 0
                    ).toLocaleString(
                        "en-IN"
                    )} orders`;
                },
            },
        },

        legend: {
            show: false,
        },
    };

    // =====================================================
    // FLATTEN CURRENT PAGE ORDERS
    // =====================================================

    const allCurrentPageOrders = useMemo(() => {

        const groups =
            Array.isArray(data?.data)
                ? data.data
                : [];

        const rows = [];

        groups.forEach((group) => {

            const groupOrders =
                Array.isArray(group?.data)
                    ? group.data
                    : [];

            groupOrders.forEach((order) => {

                rows.push({
                    ...order,
                    hour: group.hour,
                });
            });
        });

        return rows;

    }, [data]);

    // =====================================================
    // SEARCH
    // =====================================================

    const filteredOrders = useMemo(() => {

        const query =
            search.trim().toLowerCase();

        if (!query) {
            return allCurrentPageOrders;
        }

        return allCurrentPageOrders.filter(
            (order) => {

                const values = [
                    order?.invoice,
                    order?.customer?.name,
                    order?.manage_staff?.name,
                    order?.company?.name,
                    order?.status,
                    order?.amount,
                ];

                return values.some(
                    (value) =>
                        String(value || "")
                            .toLowerCase()
                            .includes(query)
                );
            }
        );

    }, [
        allCurrentPageOrders,
        search
    ]);

    // =====================================================
    // TOTAL AMOUNT CURRENT PAGE
    // =====================================================

    const currentPageAmount =
        allCurrentPageOrders.reduce(
            (sum, order) =>
                sum +
                Number(order?.amount || 0),
            0
        );

    // =====================================================
    // PEAK HOUR
    // =====================================================

    const peakHour = useMemo(() => {

        if (
            !Array.isArray(hourlyOrders) ||
            hourlyOrders.length === 0
        ) {
            return null;
        }

        return hourlyOrders.reduce(
            (peak, current) => {

                if (
                    Number(current?.orders || 0) >
                    Number(peak?.orders || 0)
                ) {
                    return current;
                }

                return peak;
            },
            hourlyOrders[0]
        );

    }, [hourlyOrders]);

    // =====================================================
    // PAGINATION
    // =====================================================

    const pagination =
        data?.pagination || {};

    const totalPages =
        Number(
            pagination?.total_pages || 1
        );

    const currentPage =
        Number(
            pagination?.current_page || page
        );

    const handlePreviousPage = () => {

        if (currentPage <= 1) {
            return;
        }

        setPage(
            currentPage - 1
        );

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    const handleNextPage = () => {

        if (
            currentPage >= totalPages
        ) {
            return;
        }

        setPage(
            currentPage + 1
        );

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    // =====================================================
    // DATE CHANGE
    // =====================================================

    const handleStartDateChange = (e) => {

        setStartDate(
            e.target.value
        );

        setPage(1);
    };

    const handleEndDateChange = (e) => {

        setEndDate(
            e.target.value
        );

        setPage(1);
    };

    // =====================================================
    // TODAY
    // =====================================================

    const handleToday = () => {

        const today =
            getLocalDateString();

        setStartDate(today);
        setEndDate(today);

        setPage(1);
    };

    // =====================================================
    // FAMILY COLOR
    // =====================================================

    const familyKey =
        String(
            data?.family_name ||
            passedState.familyName ||
            ""
        )
            .trim()
            .toLowerCase();

    const familyColor =
        familyKey === "cycling"
            ? "#10B981"
            : familyKey === "skating"
                ? "#F59E0B"
                : "#2563EB";

    const familyBackground =
        familyKey === "cycling"
            ? "#ECFDF5"
            : familyKey === "skating"
                ? "#FFFBEB"
                : "#EFF6FF";

    return (

        <React.Fragment>

            <ToastContainer />

            <div
                style={{
                    marginTop: "70px",
                    background: "#F8FAFC",
                    minHeight: "100vh",
                    padding: "24px",
                }}
            >

                {/* =====================================================
                    HEADER
                ===================================================== */}

                <Card
                    className="border-0 shadow-sm mb-4"
                    style={{
                        borderRadius: "16px",
                    }}
                >

                    <CardBody
                        style={{
                            padding: "24px",
                        }}
                    >

                        <Row
                            className="
                                align-items-center
                                g-3
                            "
                        >

                            <Col
                                xl={6}
                                lg={6}
                                md={12}
                            >

                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "14px",
                                    }}
                                >

                                    <Button
                                        color="light"
                                        onClick={() =>
                                            navigate(-1)
                                        }
                                        style={{
                                            width: "42px",
                                            height: "42px",
                                            borderRadius: "10px",
                                            border:
                                                "1px solid #E2E8F0",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent:
                                                "center",
                                        }}
                                    >

                                        <FaArrowLeft />

                                    </Button>

                                    <div>

                                        <h4
                                            style={{
                                                margin: 0,
                                                fontWeight: 800,
                                                color: "#0F172A",
                                            }}
                                        >
                                            Hourly Order Details
                                        </h4>

                                        <div
                                            style={{
                                                marginTop: "5px",
                                                fontSize: "13px",
                                                color: "#94A3B8",
                                            }}
                                        >
                                            Detailed hourly order
                                            information
                                        </div>

                                    </div>

                                </div>

                            </Col>

                            <Col
                                xl={6}
                                lg={6}
                                md={12}
                            >

                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent:
                                            "flex-end",
                                        gap: "10px",
                                        flexWrap: "wrap",
                                    }}
                                >

                                    <div>

                                        <div
                                            style={{
                                                fontSize: "10px",
                                                fontWeight: 700,
                                                color: "#64748B",
                                                marginBottom: "5px",
                                            }}
                                        >
                                            FROM
                                        </div>

                                        <Input
                                            type="date"
                                            value={startDate}
                                            onChange={
                                                handleStartDateChange
                                            }
                                            style={{
                                                minWidth: "145px",
                                            }}
                                        />

                                    </div>

                                    <div>

                                        <div
                                            style={{
                                                fontSize: "10px",
                                                fontWeight: 700,
                                                color: "#64748B",
                                                marginBottom: "5px",
                                            }}
                                        >
                                            TO
                                        </div>

                                        <Input
                                            type="date"
                                            value={endDate}
                                            onChange={
                                                handleEndDateChange
                                            }
                                            style={{
                                                minWidth: "145px",
                                            }}
                                        />

                                    </div>

                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "flex-end",
                                        }}
                                    >

                                        <Button
                                            outline
                                            color="primary"
                                            onClick={handleToday}
                                            style={{
                                                height: "38px",
                                                borderRadius: "9px",
                                                fontWeight: 600,
                                            }}
                                        >
                                            Today
                                        </Button>

                                    </div>

                                </div>

                            </Col>

                        </Row>

                    </CardBody>

                </Card>

                {/* =====================================================
                    SUMMARY CARDS
                ===================================================== */}

                <Row className="g-3 mb-4">

                    <Col
                        xl={3}
                        lg={6}
                        md={6}
                        xs={12}
                    >

                        <Card
                            className="border-0 shadow-sm h-100"
                            style={{
                                borderRadius: "14px",
                                background:
                                    familyBackground,
                            }}
                        >

                            <CardBody>

                                <div
                                    style={{
                                        fontSize: "12px",
                                        color: "#64748B",
                                        fontWeight: 600,
                                    }}
                                >
                                    Division
                                </div>

                                <div
                                    style={{
                                        fontSize: "24px",
                                        fontWeight: 800,
                                        color: familyColor,
                                        marginTop: "5px",
                                        textTransform:
                                            "capitalize",
                                    }}
                                >
                                    {
                                        data?.family_name ||
                                        passedState.familyName ||
                                        "-"
                                    }
                                </div>

                            </CardBody>

                        </Card>

                    </Col>

                    <Col
                        xl={3}
                        lg={6}
                        md={6}
                        xs={12}
                    >

                        <Card
                            className="border-0 shadow-sm h-100"
                            style={{
                                borderRadius: "14px",
                            }}
                        >

                            <CardBody>

                                <div
                                    style={{
                                        fontSize: "12px",
                                        color: "#64748B",
                                        fontWeight: 600,
                                    }}
                                >
                                    Total Orders
                                </div>

                                <div
                                    style={{
                                        fontSize: "28px",
                                        fontWeight: 800,
                                        color: "#0F172A",
                                        marginTop: "5px",
                                    }}
                                >
                                    {Number(
                                        data?.summary
                                            ?.total_orders ||
                                        0
                                    ).toLocaleString(
                                        "en-IN"
                                    )}
                                </div>

                            </CardBody>

                        </Card>

                    </Col>

                    <Col
                        xl={3}
                        lg={6}
                        md={6}
                        xs={12}
                    >

                        <Card
                            className="border-0 shadow-sm h-100"
                            style={{
                                borderRadius: "14px",
                            }}
                        >

                            <CardBody>

                                <div
                                    style={{
                                        fontSize: "12px",
                                        color: "#64748B",
                                        fontWeight: 600,
                                    }}
                                >
                                    Peak Hour
                                </div>

                                <div
                                    style={{
                                        fontSize: "20px",
                                        fontWeight: 800,
                                        color: "#0F172A",
                                        marginTop: "5px",
                                    }}
                                >
                                    {peakHour
                                        ? formatHourRange(
                                            peakHour.hour
                                        )
                                        : "-"}
                                </div>

                                <div
                                    style={{
                                        fontSize: "12px",
                                        color: "#64748B",
                                        marginTop: "3px",
                                    }}
                                >
                                    {Number(
                                        peakHour?.orders || 0
                                    ).toLocaleString(
                                        "en-IN"
                                    )}{" "}
                                    orders
                                </div>

                            </CardBody>

                        </Card>

                    </Col>

                    <Col
                        xl={3}
                        lg={6}
                        md={6}
                        xs={12}
                    >

                        <Card
                            className="border-0 shadow-sm h-100"
                            style={{
                                borderRadius: "14px",
                            }}
                        >

                            <CardBody>

                                <div
                                    style={{
                                        fontSize: "12px",
                                        color: "#64748B",
                                        fontWeight: 600,
                                    }}
                                >
                                    Current Page Amount
                                </div>

                                <div
                                    style={{
                                        fontSize: "24px",
                                        fontWeight: 800,
                                        color: "#0F172A",
                                        marginTop: "5px",
                                    }}
                                >
                                    ₹{" "}
                                    {formatAmount(
                                        currentPageAmount
                                    )}
                                </div>

                            </CardBody>

                        </Card>

                    </Col>

                </Row>

                {/* =====================================================
                    CHART
                ===================================================== */}

                <Card
                    className="border-0 shadow-sm mb-4"
                    style={{
                        borderRadius: "16px",
                    }}
                >

                    <CardBody
                        style={{
                            padding: "24px",
                        }}
                    >

                        <div
                            style={{
                                marginBottom: "15px",
                            }}
                        >

                            <h5
                                style={{
                                    margin: 0,
                                    fontWeight: 800,
                                    color: "#0F172A",
                                }}
                            >
                                Orders by Hour
                            </h5>

                            <div
                                style={{
                                    marginTop: "4px",
                                    fontSize: "12px",
                                    color: "#94A3B8",
                                }}
                            >
                                Hourly distribution for{" "}
                                <span
                                    style={{
                                        textTransform:
                                            "capitalize",
                                    }}
                                >
                                    {
                                        data?.family_name ||
                                        passedState.familyName
                                    }
                                </span>
                            </div>

                        </div>

                        {loading ? (

                            <div
                                style={{
                                    height: "350px",
                                    display: "flex",
                                    justifyContent:
                                        "center",
                                    alignItems: "center",
                                }}
                            >

                                <div
                                    className="
                                        spinner-border
                                        text-primary
                                    "
                                />

                            </div>

                        ) : chartCategories.length > 0 ? (

                            <ReactApexChart
                                options={
                                    chartOptions
                                }
                                series={
                                    chartSeries
                                }
                                type="bar"
                                height={350}
                            />

                        ) : (

                            <div
                                style={{
                                    height: "250px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent:
                                        "center",
                                    color: "#94A3B8",
                                }}
                            >
                                No hourly order data
                                available
                            </div>
                        )}

                    </CardBody>

                </Card>

                {/* =====================================================
                    ORDERS TABLE
                ===================================================== */}

                <Card
                    className="border-0 shadow-sm"
                    style={{
                        borderRadius: "16px",
                    }}
                >

                    <CardBody
                        style={{
                            padding: "24px",
                        }}
                    >

                        <Row
                            className="
                                align-items-center
                                g-3
                                mb-3
                            "
                        >

                            <Col
                                lg={6}
                                md={12}
                            >

                                <h5
                                    style={{
                                        margin: 0,
                                        fontWeight: 800,
                                        color: "#0F172A",
                                    }}
                                >
                                    Order Details
                                </h5>

                                <div
                                    style={{
                                        fontSize: "12px",
                                        color: "#94A3B8",
                                        marginTop: "4px",
                                    }}
                                >
                                    Page{" "}
                                    {currentPage} of{" "}
                                    {totalPages} •{" "}
                                    {Number(
                                        pagination?.count ||
                                        0
                                    ).toLocaleString(
                                        "en-IN"
                                    )}{" "}
                                    total orders
                                </div>

                            </Col>

                            <Col
                                lg={6}
                                md={12}
                            >

                                <div
                                    style={{
                                        position:
                                            "relative",
                                        maxWidth: "330px",
                                        marginLeft: "auto",
                                    }}
                                >

                                    <FaSearch
                                        style={{
                                            position:
                                                "absolute",
                                            left: "12px",
                                            top: "50%",
                                            transform:
                                                "translateY(-50%)",
                                            color: "#94A3B8",
                                            fontSize: "13px",
                                        }}
                                    />

                                    <Input
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(
                                                e.target.value
                                            )
                                        }
                                        placeholder="Search current page..."
                                        style={{
                                            paddingLeft:
                                                "36px",
                                            borderRadius:
                                                "9px",
                                        }}
                                    />

                                </div>

                            </Col>

                        </Row>

                        <div
                            style={{
                                overflowX: "auto",
                            }}
                        >

                            <Table
                                responsive
                                hover
                                className="align-middle"
                            >

                                <thead>

                                    <tr>

                                        <th>#</th>

                                        <th>
                                            Hour
                                        </th>

                                        <th>
                                            Invoice
                                        </th>

                                        <th>
                                            Customer
                                        </th>

                                        <th>
                                            Staff
                                        </th>

                                        <th>
                                            Amount
                                        </th>

                                        <th>
                                            Company
                                        </th>

                                        <th>
                                            Status
                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {loading ? (

                                        <tr>

                                            <td
                                                colSpan="9"
                                                className="
                                                    text-center
                                                    py-5
                                                "
                                            >

                                                <div
                                                    className="
                                                        spinner-border
                                                        text-primary
                                                    "
                                                />

                                            </td>

                                        </tr>

                                    ) : filteredOrders.length > 0 ? (

                                        filteredOrders.map(
                                            (
                                                order,
                                                index
                                            ) => (

                                                <tr
                                                    key={
                                                        order?.id ||
                                                        index
                                                    }
                                                >

                                                    <td>
                                                        {
                                                            (
                                                                currentPage -
                                                                1
                                                            ) *
                                                            Number(
                                                                pagination?.page_size ||
                                                                50
                                                            ) +
                                                            index +
                                                            1
                                                        }
                                                    </td>

                                                    <td
                                                        style={{
                                                            whiteSpace:
                                                                "nowrap",
                                                            fontWeight:
                                                                600,
                                                        }}
                                                    >
                                                        {formatHourRange(
                                                            order.hour
                                                        )}
                                                    </td>

                                                    <td>
                                                        {order?.id && order?.invoice ? (
                                                            <Link
                                                                to={`/order/${order.id}/items/`}
                                                                state={{
                                                                    orderIds: filteredOrders.map((o) => o.id),
                                                                }}
                                                                style={{
                                                                    fontWeight: 700,
                                                                    color: "#2563EB",
                                                                    textDecoration: "none",
                                                                }}
                                                            >
                                                                {order.invoice}
                                                            </Link>
                                                        ) : (
                                                            "-"
                                                        )}
                                                    </td>

                                                    <td>
                                                        {
                                                            order
                                                                ?.customer
                                                                ?.name ||
                                                            "-"
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            order
                                                                ?.manage_staff
                                                                ?.name ||
                                                            "-"
                                                        }
                                                    </td>

                                                    <td
                                                        style={{
                                                            whiteSpace:
                                                                "nowrap",
                                                            fontWeight:
                                                                700,
                                                        }}
                                                    >
                                                        ₹{" "}
                                                        {formatAmount(
                                                            order?.amount
                                                        )}
                                                    </td>

                                                    <td
                                                        style={{
                                                            minWidth:
                                                                "220px",
                                                        }}
                                                    >
                                                        {
                                                            order
                                                                ?.company
                                                                ?.name ||
                                                            "-"
                                                        }
                                                    </td>

                                                    <td>

                                                        <span
                                                            style={{
                                                                display:
                                                                    "inline-block",
                                                                padding:
                                                                    "5px 9px",
                                                                borderRadius:
                                                                    "20px",
                                                                background:
                                                                    "#F1F5F9",
                                                                color:
                                                                    "#475569",
                                                                fontSize:
                                                                    "11px",
                                                                fontWeight:
                                                                    700,
                                                                whiteSpace:
                                                                    "nowrap",
                                                            }}
                                                        >
                                                            {
                                                                order?.status ||
                                                                "-"
                                                            }
                                                        </span>

                                                    </td>

                                                </tr>
                                            )
                                        )

                                    ) : (

                                        <tr>

                                            <td
                                                colSpan="9"
                                                className="
                                                    text-center
                                                    text-muted
                                                    py-5
                                                "
                                            >
                                                No orders
                                                found
                                            </td>

                                        </tr>
                                    )}

                                </tbody>

                            </Table>

                        </div>

                        {/* =====================================================
                            PAGINATION
                        ===================================================== */}

                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent:
                                    "space-between",
                                gap: "15px",
                                marginTop: "20px",
                                flexWrap: "wrap",
                            }}
                        >

                            <div
                                style={{
                                    fontSize: "13px",
                                    color: "#64748B",
                                }}
                            >
                                Showing page{" "}
                                <strong>
                                    {currentPage}
                                </strong>{" "}
                                of{" "}
                                <strong>
                                    {totalPages}
                                </strong>
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    gap: "8px",
                                }}
                            >

                                <Button
                                    outline
                                    color="primary"
                                    disabled={
                                        currentPage <=
                                        1 ||
                                        loading
                                    }
                                    onClick={
                                        handlePreviousPage
                                    }
                                    style={{
                                        borderRadius:
                                            "8px",
                                    }}
                                >

                                    <FaChevronLeft
                                        style={{
                                            marginRight:
                                                "6px",
                                        }}
                                    />

                                    Previous

                                </Button>

                                <Button
                                    outline
                                    color="primary"
                                    disabled={
                                        currentPage >=
                                        totalPages ||
                                        loading
                                    }
                                    onClick={
                                        handleNextPage
                                    }
                                    style={{
                                        borderRadius:
                                            "8px",
                                    }}
                                >

                                    Next

                                    <FaChevronRight
                                        style={{
                                            marginLeft:
                                                "6px",
                                        }}
                                    />

                                </Button>

                            </div>

                        </div>

                    </CardBody>

                </Card>

            </div>

        </React.Fragment>
    );
};

export default HourlyFamilyOrderDetails;