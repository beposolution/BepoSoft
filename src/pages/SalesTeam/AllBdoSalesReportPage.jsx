import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx-js-style";

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
    Row,
    Spinner,
    Table,
} from "reactstrap";

import Select from "react-select";

import {
    ToastContainer,
    toast,
} from "react-toastify";

import "react-toastify/dist/ReactToastify.css";

import Breadcrumbs from "../../components/Common/Breadcrumb";

const AllBdoSalesReportPage = () => {
    document.title = "BDO Sales Report | Beposoft";

    const token = localStorage.getItem("token");
    const baseUrl = import.meta.env.VITE_APP_KEY;

    const cleanBaseUrl = baseUrl?.endsWith("/")
        ? baseUrl
        : `${baseUrl}/`;

    // =========================================================
    // LOADING
    // =========================================================

    const [loading, setLoading] = useState(true);
    const [tableLoading, setTableLoading] = useState(false);
    const [excelLoading, setExcelLoading] = useState(false);

    const [pageError, setPageError] = useState("");

    // =========================================================
    // DATA
    // =========================================================

    const [reports, setReports] = useState([]);

    const [summary, setSummary] = useState({
        total_reports: 0,
        staff_count: 0,
        total_call_duration: "00:00:00",
        call_duration_average_8hrs: 0,

        call_status: {
            active: 0,
            productive: 0,
        },

        status: {
            dsr_created: 0,
            dsr_approved: 0,
            dsr_confirmed: 0,
            dsr_rejected: 0,
        },
    });

    // =========================================================
    // PAGINATION
    // =========================================================

    const [currentPage, setCurrentPage] = useState(1);

    const [count, setCount] = useState(0);

    const [nextPageUrl, setNextPageUrl] = useState(null);
    const [previousPageUrl, setPreviousPageUrl] = useState(null);

    const [pageSize, setPageSize] = useState(10);

    // =========================================================
    // FILTERS
    // =========================================================

    const [searchText, setSearchText] = useState("");

    const [teamFilter, setTeamFilter] = useState("");

    const [staffFilter, setStaffFilter] = useState("");

    const [callStatusFilter, setCallStatusFilter] =
        useState("");

    const [statusFilter, setStatusFilter] =
        useState("");

    const [stateFilter, setStateFilter] =
        useState("");

    const [districtFilter, setDistrictFilter] =
        useState("");

    const [startDateFilter, setStartDateFilter] =
        useState("");

    const [endDateFilter, setEndDateFilter] =
        useState("");

    // =========================================================
    // AUTH HEADER
    // =========================================================

    const getAuthHeaders = () => ({
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    });

    // =========================================================
    // NORMALIZE
    // =========================================================

    const normalize = (value) =>
        String(value ?? "")
            .trim()
            .toLowerCase();

    // =========================================================
    // RESPONSE PARSER
    // =========================================================

    const parseResponse = (response) => {
        const responseData =
            response?.data || {};

        const resultData =
            responseData?.results || {};

        const summaryData =
            resultData?.summary || {};

        const rows =
            Array.isArray(resultData?.data)
                ? resultData.data
                : [];

        return {
            rows,

            count: Number(
                responseData?.count || 0
            ),

            next:
                responseData?.next || null,

            previous:
                responseData?.previous || null,

            summary: {
                total_reports: Number(
                    summaryData?.total_reports || 0
                ),

                staff_count: Number(
                    summaryData?.staff_count ||
                    resultData?.staff_count ||
                    0
                ),

                total_call_duration:
                    summaryData?.total_call_duration ||
                    "00:00:00",

                call_duration_average_8hrs:
                    Number(
                        summaryData
                            ?.call_duration_average_8hrs ||
                        0
                    ),

                call_status: {
                    active: Number(
                        summaryData?.call_status
                            ?.active || 0
                    ),

                    productive: Number(
                        summaryData?.call_status
                            ?.productive || 0
                    ),
                },

                status: {
                    dsr_created: Number(
                        summaryData?.status
                            ?.dsr_created || 0
                    ),

                    dsr_approved: Number(
                        summaryData?.status
                            ?.dsr_approved || 0
                    ),

                    dsr_confirmed: Number(
                        summaryData?.status
                            ?.dsr_confirmed || 0
                    ),

                    dsr_rejected: Number(
                        summaryData?.status
                            ?.dsr_rejected || 0
                    ),
                },
            },
        };
    };

    // =========================================================
    // BUILD FILTER PARAMS
    // =========================================================

    const buildParams = ({
        page = 1,
        search = searchText,
        team = teamFilter,
        staff = staffFilter,
        callStatus = callStatusFilter,
        status = statusFilter,
        state = stateFilter,
        district = districtFilter,
        startDate = startDateFilter,
        endDate = endDateFilter,
    } = {}) => {
        const params =
            new URLSearchParams();

        if (page) {
            params.append(
                "page",
                String(page)
            );
        }

        if (search?.trim()) {
            params.append(
                "search",
                search.trim()
            );
        }

        if (team) {
            params.append(
                "team",
                team
            );
        }

        if (staff) {
            params.append(
                "created_by",
                staff
            );
        }

        if (callStatus) {
            params.append(
                "call_status",
                callStatus
            );
        }

        if (status) {
            params.append(
                "status",
                status
            );
        }

        if (state) {
            params.append(
                "state",
                state
            );
        }

        if (district) {
            params.append(
                "district",
                district
            );
        }

        if (startDate) {
            params.append(
                "start_date",
                startDate
            );
        }

        if (endDate) {
            params.append(
                "end_date",
                endDate
            );
        }

        return params;
    };

    // =========================================================
    // FETCH REPORTS
    // =========================================================

    const fetchReports = async (
        page = 1,
        customFilters = {}
    ) => {
        try {
            setTableLoading(true);
            setPageError("");

            const params =
                buildParams({
                    page,
                    ...customFilters,
                });

            const url =
                `${cleanBaseUrl}` +
                `sales/team/member/daily/report/all/` +
                `?${params.toString()}`;

            console.log(
                "ALL BDO REPORT API:",
                url
            );

            const response =
                await axios.get(
                    url,
                    {
                        headers:
                            getAuthHeaders(),
                    }
                );

            console.log(
                "ALL BDO REPORT RESPONSE:",
                response?.data
            );

            const parsed =
                parseResponse(response);

            setReports(
                parsed.rows
            );

            setCount(
                parsed.count
            );

            setNextPageUrl(
                parsed.next
            );

            setPreviousPageUrl(
                parsed.previous
            );

            setSummary(
                parsed.summary
            );

            setCurrentPage(
                page
            );

            if (
                parsed.rows.length > 0
            ) {
                setPageSize(
                    parsed.rows.length
                );
            } else {
                setPageSize(10);
            }
        } catch (error) {
            console.error(
                "FETCH REPORT ERROR:",
                error
            );

            const message =
                error?.response?.data
                    ?.message ||
                error?.response?.data
                    ?.error ||
                error?.response?.data
                    ?.detail ||
                error?.message ||
                "Failed to fetch BDO sales reports";

            setReports([]);

            setCount(0);

            setNextPageUrl(null);

            setPreviousPageUrl(null);

            setPageError(
                message
            );

            toast.error(
                message
            );
        } finally {
            setTableLoading(false);
            setLoading(false);
        }
    };

    // =========================================================
    // INITIAL LOAD
    // =========================================================

    useEffect(() => {
        if (!token) {
            setLoading(false);
            setPageError(
                "Token not found"
            );

            return;
        }

        fetchReports(1);
    }, [token]);

    // =========================================================
    // TEAM OPTIONS
    // =========================================================

    const teamOptions =
        useMemo(() => {
            const map =
                new Map();

            reports.forEach(
                (item) => {
                    if (
                        item?.team &&
                        item?.team_name
                    ) {
                        map.set(
                            String(
                                item.team
                            ),
                            item.team_name
                        );
                    }
                }
            );

            return Array.from(
                map.entries()
            ).map(
                ([value, label]) => ({
                    value,
                    label,
                })
            );
        }, [reports]);

    // =========================================================
    // STAFF OPTIONS
    // =========================================================

    const staffOptions =
        useMemo(() => {
            const map =
                new Map();

            reports.forEach(
                (item) => {
                    if (
                        item?.created_by &&
                        item?.created_by_name
                    ) {
                        map.set(
                            String(
                                item.created_by
                            ),
                            item.created_by_name
                        );
                    }
                }
            );

            return Array.from(
                map.entries()
            ).map(
                ([value, label]) => ({
                    value,
                    label,
                })
            );
        }, [reports]);

    // =========================================================
    // STATE OPTIONS
    // =========================================================

    const stateOptions =
        useMemo(() => {
            const map =
                new Map();

            reports.forEach(
                (item) => {
                    if (
                        item?.state &&
                        item?.state_name
                    ) {
                        map.set(
                            String(
                                item.state
                            ),
                            item.state_name
                        );
                    }
                }
            );

            return Array.from(
                map.entries()
            ).map(
                ([value, label]) => ({
                    value,
                    label,
                })
            );
        }, [reports]);

    // =========================================================
    // DISTRICT OPTIONS
    // =========================================================

    const districtOptions =
        useMemo(() => {
            const map =
                new Map();

            reports.forEach(
                (item) => {
                    if (
                        item?.district &&
                        item?.district_name
                    ) {
                        if (
                            stateFilter &&
                            String(
                                item.state
                            ) !==
                                String(
                                    stateFilter
                                )
                        ) {
                            return;
                        }

                        map.set(
                            String(
                                item.district
                            ),
                            item.district_name
                        );
                    }
                }
            );

            return Array.from(
                map.entries()
            ).map(
                ([value, label]) => ({
                    value,
                    label,
                })
            );
        }, [
            reports,
            stateFilter,
        ]);

    // =========================================================
    // GET INVOICE NUMBER
    // =========================================================

    const getInvoiceNumber = (
        item
    ) => {
        return (
            item?.invoice_number ||
            item?.invoice_details
                ?.invoice ||
            ""
        );
    };

    // =========================================================
    // GET INVOICE AMOUNT
    // =========================================================

    const getInvoiceAmount = (
        item
    ) => {
        const value =
            item?.invoice_details
                ?.total_amount ??
            item?.invoice_amount ??
            item?.total_amount ??
            0;

        const amount =
            Number(value);

        return Number.isFinite(
            amount
        )
            ? amount
            : 0;
    };

    // =========================================================
    // FORMAT AMOUNT
    // =========================================================

    const formatAmount = (
        value
    ) => {
        return Number(
            value || 0
        ).toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }
        );
    };

    // =========================================================
    // FORMAT DATE
    // =========================================================

    const formatDateTime = (
        value
    ) => {
        if (!value) {
            return "-";
        }

        try {
            return new Date(
                value
            ).toLocaleString(
                "en-IN"
            );
        } catch {
            return value;
        }
    };

    // =========================================================
    // STATUS LABEL
    // =========================================================

    const getStatusLabel = (
        value
    ) => {
        switch (
            normalize(value)
        ) {
            case "dsr created":
                return "DSR Created";

            case "dsr approved":
                return "DSR Approved";

            case "dsr confirmed":
                return "DSR Confirmed";

            case "dsr rejected":
                return "DSR Rejected";

            case "active":
                return "Active";

            case "productive":
                return "Productive";

            default:
                return value || "-";
        }
    };

    // =========================================================
    // BADGE COLOR
    // =========================================================

    const getBadgeColor = (
        value
    ) => {
        switch (
            normalize(value)
        ) {
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

    // =========================================================
    // GROUP PAGE DATA TEAM WISE
    // =========================================================

    const groupedReports =
        useMemo(() => {
            const grouped = {};

            reports.forEach(
                (item) => {
                    const teamName =
                        item?.team_name ||
                        "No Team";

                    if (
                        !grouped[
                            teamName
                        ]
                    ) {
                        grouped[
                            teamName
                        ] = [];
                    }

                    grouped[
                        teamName
                    ].push(item);
                }
            );

            return Object.entries(
                grouped
            ).sort(
                (
                    [teamA],
                    [teamB]
                ) =>
                    teamA.localeCompare(
                        teamB
                    )
            );
        }, [reports]);

    // =========================================================
    // SEARCH
    // =========================================================

    const handleSearch =
        async () => {
            setCurrentPage(1);

            await fetchReports(
                1
            );
        };

    // =========================================================
    // CLEAR FILTERS
    // =========================================================

    const handleClearFilters =
        async () => {
            setSearchText("");

            setTeamFilter("");

            setStaffFilter("");

            setCallStatusFilter("");

            setStatusFilter("");

            setStateFilter("");

            setDistrictFilter("");

            setStartDateFilter("");

            setEndDateFilter("");

            setCurrentPage(1);

            await fetchReports(
                1,
                {
                    search: "",
                    team: "",
                    staff: "",
                    callStatus: "",
                    status: "",
                    state: "",
                    district: "",
                    startDate: "",
                    endDate: "",
                }
            );
        };

    // =========================================================
    // TOTAL PAGE INVOICE
    // =========================================================

    const pageInvoiceTotal =
        useMemo(() => {
            return reports.reduce(
                (
                    total,
                    item
                ) =>
                    total +
                    getInvoiceAmount(
                        item
                    ),
                0
            );
        }, [reports]);

    // =========================================================
    // TOTAL PAGE PRODUCTIVE
    // =========================================================

    const pageProductiveCount =
        useMemo(() => {
            return reports.filter(
                (item) =>
                    normalize(
                        item?.call_status
                    ) ===
                    "productive"
            ).length;
        }, [reports]);

    // =========================================================
    // FETCH ALL DATA FOR EXCEL
    // =========================================================

    const fetchAllReportsForExcel =
        async () => {
            const allRows = [];

            let page = 1;
            let hasNext = true;

            while (hasNext) {
                const params =
                    buildParams({
                        page,
                    });

                const response =
                    await axios.get(
                        `${cleanBaseUrl}sales/team/member/daily/report/all/?${params.toString()}`,
                        {
                            headers:
                                getAuthHeaders(),
                        }
                    );

                console.log(
                    `EXCEL API PAGE ${page}:`,
                    response?.data
                );

                const parsed =
                    parseResponse(
                        response
                    );

                allRows.push(
                    ...parsed.rows
                );

                if (
                    parsed.next
                ) {
                    page += 1;
                } else {
                    hasNext = false;
                }
            }

            return allRows;
        };

    // =========================================================
    // EXCEL DATE
    // =========================================================

    const formatExcelDate = (
        value
    ) => {
        if (!value) {
            return "";
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return value;
        }

        return date.toLocaleDateString(
            "en-GB"
        );
    };

    // =========================================================
    // DOWNLOAD TEAM-WISE EXCEL
    // =========================================================

    const downloadTeamWiseExcel =
        async () => {
            try {
                setExcelLoading(
                    true
                );

                toast.info(
                    "Preparing team-wise Excel..."
                );

                const allRows =
                    await fetchAllReportsForExcel();

                if (
                    allRows.length ===
                    0
                ) {
                    toast.warning(
                        "No data available to export"
                    );

                    return;
                }

                // =============================================
                // GROUP ALL DATA TEAM WISE
                // =============================================

                const teamMap = {};

                allRows.forEach(
                    (item) => {
                        const teamName =
                            item?.team_name ||
                            "No Team";

                        if (
                            !teamMap[
                                teamName
                            ]
                        ) {
                            teamMap[
                                teamName
                            ] = [];
                        }

                        teamMap[
                            teamName
                        ].push(item);
                    }
                );

                // =============================================
                // DATE TEXT
                // =============================================

                let dateText = "";

                if (
                    startDateFilter &&
                    endDateFilter
                ) {
                    if (
                        startDateFilter ===
                        endDateFilter
                    ) {
                        dateText =
                            formatExcelDate(
                                startDateFilter
                            );
                    } else {
                        dateText =
                            `${formatExcelDate(
                                startDateFilter
                            )} TO ` +
                            `${formatExcelDate(
                                endDateFilter
                            )}`;
                    }
                } else if (
                    startDateFilter
                ) {
                    dateText =
                        formatExcelDate(
                            startDateFilter
                        );
                } else if (
                    endDateFilter
                ) {
                    dateText =
                        formatExcelDate(
                            endDateFilter
                        );
                } else {
                    dateText =
                        new Date().toLocaleDateString(
                            "en-GB"
                        );
                }

                // =============================================
                // WORKSHEET DATA
                // =============================================

                const excelData = [];

                // Main title
                excelData.push([
                    "BDO SALES REPORT",
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    `DATE : ${dateText}`,
                    "",
                    "",
                ]);

                excelData.push([
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                ]);

                const teamTitleRows =
                    [];

                const headerRows =
                    [];

                const totalRows =
                    [];

                const dataRows =
                    [];

                let grandInvoiceTotal =
                    0;

                let grandProductive =
                    0;

                let grandReportCount =
                    0;

                const sortedTeams =
                    Object.entries(
                        teamMap
                    ).sort(
                        (
                            [teamA],
                            [teamB]
                        ) =>
                            teamA.localeCompare(
                                teamB
                            )
                    );

                sortedTeams.forEach(
                    (
                        [
                            teamName,
                            teamRows,
                        ]
                    ) => {
                        // TEAM TITLE ROW
                        teamTitleRows.push(
                            excelData.length
                        );

                        excelData.push([
                            `TEAM : ${teamName}`,
                            "",
                            "",
                            "",
                            "",
                            "",
                            "",
                            "",
                            "",
                            "",
                        ]);

                        // HEADER
                        headerRows.push(
                            excelData.length
                        );

                        excelData.push([
                            "SL",
                            "SALES PERSON (BDO)",
                            "CONTACT PERSON",
                            "CONTACT NO",
                            "STATE",
                            "DIST",
                            "CD",
                            "PC",
                            "INV NO",
                            "INV AMT",
                        ]);

                        let teamInvoiceTotal =
                            0;

                        let teamProductive =
                            0;

                        teamRows.forEach(
                            (
                                item,
                                index
                            ) => {
                                const amount =
                                    getInvoiceAmount(
                                        item
                                    );

                                const isProductive =
                                    normalize(
                                        item?.call_status
                                    ) ===
                                    "productive";

                                teamInvoiceTotal +=
                                    amount;

                                if (
                                    isProductive
                                ) {
                                    teamProductive +=
                                        1;
                                }

                                dataRows.push(
                                    excelData.length
                                );

                                excelData.push([
                                    index +
                                        1,

                                    item?.created_by_name ||
                                        "",

                                    item?.customer_name ||
                                        "",

                                    item?.phone ||
                                        "",

                                    item?.state_name ||
                                        "",

                                    item?.district_name ||
                                        "",

                                    item?.call_duration ||
                                        "",

                                    isProductive
                                        ? 1
                                        : "",

                                    getInvoiceNumber(
                                        item
                                    ),

                                    amount,
                                ]);
                            }
                        );

                        grandInvoiceTotal +=
                            teamInvoiceTotal;

                        grandProductive +=
                            teamProductive;

                        grandReportCount +=
                            teamRows.length;

                        totalRows.push(
                            excelData.length
                        );

                        excelData.push([
                            "TOTAL",
                            "",
                            "",
                            "",
                            "",
                            "",
                            "",
                            teamProductive,
                            "",
                            teamInvoiceTotal,
                        ]);

                        // BLANK ROW AFTER TEAM
                        excelData.push([
                            "",
                            "",
                            "",
                            "",
                            "",
                            "",
                            "",
                            "",
                            "",
                            "",
                        ]);
                    }
                );

                // =============================================
                // GRAND TOTAL
                // =============================================

                const grandTotalRow =
                    excelData.length;

                excelData.push([
                    "GRAND TOTAL",
                    "",
                    "",
                    "",
                    "",
                    "",
                    `REPORTS : ${grandReportCount}`,
                    grandProductive,
                    "",
                    grandInvoiceTotal,
                ]);

                // =============================================
                // CREATE SHEET
                // =============================================

                const worksheet =
                    XLSX.utils.aoa_to_sheet(
                        excelData
                    );

                // =============================================
                // MERGES
                // =============================================

                const merges = [
                    {
                        s: {
                            r: 0,
                            c: 0,
                        },
                        e: {
                            r: 0,
                            c: 6,
                        },
                    },
                    {
                        s: {
                            r: 0,
                            c: 7,
                        },
                        e: {
                            r: 0,
                            c: 9,
                        },
                    },
                ];

                teamTitleRows.forEach(
                    (row) => {
                        merges.push({
                            s: {
                                r: row,
                                c: 0,
                            },
                            e: {
                                r: row,
                                c: 9,
                            },
                        });
                    }
                );

                worksheet["!merges"] =
                    merges;

                // =============================================
                // WIDTH
                // =============================================

                worksheet["!cols"] = [
                    { wch: 7 },
                    { wch: 26 },
                    { wch: 28 },
                    { wch: 18 },
                    { wch: 20 },
                    { wch: 22 },
                    { wch: 15 },
                    { wch: 10 },
                    { wch: 20 },
                    { wch: 18 },
                ];

                // =============================================
                // BORDER
                // =============================================

                const thinBorder = {
                    top: {
                        style: "thin",
                        color: {
                            rgb: "000000",
                        },
                    },
                    bottom: {
                        style: "thin",
                        color: {
                            rgb: "000000",
                        },
                    },
                    left: {
                        style: "thin",
                        color: {
                            rgb: "000000",
                        },
                    },
                    right: {
                        style: "thin",
                        color: {
                            rgb: "000000",
                        },
                    },
                };

                // =============================================
                // MAIN TITLE
                // =============================================

                for (
                    let col = 0;
                    col <= 9;
                    col++
                ) {
                    const address =
                        XLSX.utils.encode_cell(
                            {
                                r: 0,
                                c: col,
                            }
                        );

                    if (
                        !worksheet[
                            address
                        ]
                    ) {
                        worksheet[
                            address
                        ] = {
                            t: "s",
                            v: "",
                        };
                    }

                    worksheet[
                        address
                    ].s = {
                        font: {
                            bold: true,
                            sz: 12,
                            color: {
                                rgb: "000000",
                            },
                        },

                        fill: {
                            patternType:
                                "solid",

                            fgColor: {
                                rgb: "D9EAF7",
                            },
                        },

                        alignment: {
                            horizontal:
                                col <= 6
                                    ? "center"
                                    : "left",

                            vertical:
                                "center",
                        },

                        border:
                            thinBorder,
                    };
                }

                // =============================================
                // TEAM TITLE STYLE
                // =============================================

                teamTitleRows.forEach(
                    (row) => {
                        for (
                            let col = 0;
                            col <= 9;
                            col++
                        ) {
                            const address =
                                XLSX.utils.encode_cell(
                                    {
                                        r: row,
                                        c: col,
                                    }
                                );

                            if (
                                !worksheet[
                                    address
                                ]
                            ) {
                                worksheet[
                                    address
                                ] = {
                                    t: "s",
                                    v: "",
                                };
                            }

                            worksheet[
                                address
                            ].s = {
                                font: {
                                    bold: true,
                                    sz: 12,
                                    color: {
                                        rgb: "000000",
                                    },
                                },

                                fill: {
                                    patternType:
                                        "solid",

                                    fgColor: {
                                        rgb: "BDD7EE",
                                    },
                                },

                                alignment: {
                                    horizontal:
                                        "left",

                                    vertical:
                                        "center",
                                },

                                border:
                                    thinBorder,
                            };
                        }
                    }
                );

                // =============================================
                // HEADER STYLE
                // =============================================

                headerRows.forEach(
                    (row) => {
                        for (
                            let col = 0;
                            col <= 9;
                            col++
                        ) {
                            const address =
                                XLSX.utils.encode_cell(
                                    {
                                        r: row,
                                        c: col,
                                    }
                                );

                            worksheet[
                                address
                            ].s = {
                                font: {
                                    bold: true,

                                    color: {
                                        rgb: "FFFFFF",
                                    },

                                    sz: 11,
                                },

                                fill: {
                                    patternType:
                                        "solid",

                                    fgColor: {
                                        rgb: "FF0000",
                                    },
                                },

                                alignment: {
                                    horizontal:
                                        "center",

                                    vertical:
                                        "center",

                                    wrapText:
                                        true,
                                },

                                border:
                                    thinBorder,
                            };
                        }
                    }
                );

                // =============================================
                // DATA STYLE
                // =============================================

                dataRows.forEach(
                    (row) => {
                        for (
                            let col = 0;
                            col <= 9;
                            col++
                        ) {
                            const address =
                                XLSX.utils.encode_cell(
                                    {
                                        r: row,
                                        c: col,
                                    }
                                );

                            if (
                                !worksheet[
                                    address
                                ]
                            ) {
                                worksheet[
                                    address
                                ] = {
                                    t: "s",
                                    v: "",
                                };
                            }

                            worksheet[
                                address
                            ].s = {
                                font: {
                                    color: {
                                        rgb: "000000",
                                    },

                                    sz: 10,
                                },

                                alignment: {
                                    horizontal:
                                        col ===
                                            0 ||
                                        col ===
                                            6 ||
                                        col ===
                                            7 ||
                                        col ===
                                            9
                                            ? "center"
                                            : "left",

                                    vertical:
                                        "center",

                                    wrapText:
                                        true,
                                },

                                border:
                                    thinBorder,
                            };

                            if (
                                col === 9
                            ) {
                                worksheet[
                                    address
                                ].z =
                                    "#,##0.00";
                            }
                        }
                    }
                );

                // =============================================
                // TEAM TOTAL STYLE
                // =============================================

                totalRows.forEach(
                    (row) => {
                        for (
                            let col = 0;
                            col <= 9;
                            col++
                        ) {
                            const address =
                                XLSX.utils.encode_cell(
                                    {
                                        r: row,
                                        c: col,
                                    }
                                );

                            if (
                                !worksheet[
                                    address
                                ]
                            ) {
                                worksheet[
                                    address
                                ] = {
                                    t: "s",
                                    v: "",
                                };
                            }

                            worksheet[
                                address
                            ].s = {
                                font: {
                                    bold: true,

                                    color: {
                                        rgb:
                                            col ===
                                            0
                                                ? "FF0000"
                                                : "000000",
                                    },
                                },

                                fill: {
                                    patternType:
                                        "solid",

                                    fgColor: {
                                        rgb: "FFFF00",
                                    },
                                },

                                alignment: {
                                    horizontal:
                                        "center",

                                    vertical:
                                        "center",
                                },

                                border:
                                    thinBorder,
                            };

                            if (
                                col === 9
                            ) {
                                worksheet[
                                    address
                                ].z =
                                    "#,##0.00";
                            }
                        }
                    }
                );

                // =============================================
                // GRAND TOTAL
                // =============================================

                for (
                    let col = 0;
                    col <= 9;
                    col++
                ) {
                    const address =
                        XLSX.utils.encode_cell(
                            {
                                r: grandTotalRow,
                                c: col,
                            }
                        );

                    if (
                        !worksheet[
                            address
                        ]
                    ) {
                        worksheet[
                            address
                        ] = {
                            t: "s",
                            v: "",
                        };
                    }

                    worksheet[
                        address
                    ].s = {
                        font: {
                            bold: true,

                            color: {
                                rgb: "FFFFFF",
                            },

                            sz: 11,
                        },

                        fill: {
                            patternType:
                                "solid",

                            fgColor: {
                                rgb: "1F4E78",
                            },
                        },

                        alignment: {
                            horizontal:
                                "center",

                            vertical:
                                "center",
                        },

                        border:
                            thinBorder,
                    };

                    if (
                        col === 9
                    ) {
                        worksheet[
                            address
                        ].z =
                            "#,##0.00";
                    }
                }

                // =============================================
                // WORKBOOK
                // =============================================

                const workbook =
                    XLSX.utils.book_new();

                XLSX.utils.book_append_sheet(
                    workbook,
                    worksheet,
                    "BDO Sales Report"
                );

                // =============================================
                // FILE NAME
                // =============================================

                const now =
                    new Date();

                const today =
                    [
                        now.getFullYear(),

                        String(
                            now.getMonth() +
                                1
                        ).padStart(
                            2,
                            "0"
                        ),

                        String(
                            now.getDate()
                        ).padStart(
                            2,
                            "0"
                        ),
                    ].join("-");

                let fileDate =
                    today;

                if (
                    startDateFilter &&
                    endDateFilter
                ) {
                    fileDate =
                        startDateFilter ===
                        endDateFilter
                            ? startDateFilter
                            : `${startDateFilter}_to_${endDateFilter}`;
                }

                XLSX.writeFile(
                    workbook,
                    `BDO SALES REPORT - ${fileDate}.xlsx`
                );

                toast.success(
                    "Team-wise Excel downloaded successfully"
                );
            } catch (error) {
                console.error(
                    "EXCEL ERROR:",
                    error
                );

                toast.error(
                    error?.response?.data
                        ?.message ||
                        error?.response?.data
                            ?.error ||
                        error?.message ||
                        "Failed to download Excel"
                );
            } finally {
                setExcelLoading(
                    false
                );
            }
        };

    // =========================================================
    // TOTAL PAGES
    // =========================================================

    const totalPages =
        useMemo(() => {
            if (
                !count ||
                !pageSize
            ) {
                return 1;
            }

            return Math.ceil(
                count /
                    pageSize
            );
        }, [
            count,
            pageSize,
        ]);

    // =========================================================
    // SELECT STYLE
    // =========================================================

    const selectStyles = {
        control: (
            provided,
            state
        ) => ({
            ...provided,

            minHeight: "38px",

            borderColor:
                state.isFocused
                    ? "#556ee6"
                    : "#ced4da",

            boxShadow:
                state.isFocused
                    ? "0 0 0 0.2rem rgba(85,110,230,.20)"
                    : "none",

            "&:hover": {
                borderColor:
                    state.isFocused
                        ? "#556ee6"
                        : "#adb5bd",
            },
        }),

        menu: (
            provided
        ) => ({
            ...provided,
            zIndex: 9999,
        }),

        menuPortal: (
            provided
        ) => ({
            ...provided,
            zIndex: 9999,
        }),
    };

    // =========================================================
    // UI
    // =========================================================

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <Breadcrumbs
                        title="Sales"
                        breadcrumbItem="BDO Sales Report"
                    />

                    {loading ? (
                        <Row>
                            <Col xl={12}>
                                <Card>
                                    <CardBody className="text-center py-5">
                                        <Spinner color="primary" />

                                        <div className="mt-3">
                                            Loading BDO sales report...
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
                                        {/* ================================================= */}
                                        {/* TOP */}
                                        {/* ================================================= */}

                                        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
                                            <div>
                                                <CardTitle className="mb-1">
                                                    BDO Sales Report
                                                </CardTitle>

                                                <div className="text-muted">
                                                    Team-wise sales and daily call report
                                                </div>
                                            </div>

                                            <div className="d-flex gap-2 flex-wrap">
                                                <Button
                                                    color="success"
                                                    onClick={
                                                        downloadTeamWiseExcel
                                                    }
                                                    disabled={
                                                        excelLoading
                                                    }
                                                >
                                                    {excelLoading ? (
                                                        <>
                                                            <Spinner
                                                                size="sm"
                                                                className="me-1"
                                                            />
                                                            Preparing Excel...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <i className="bx bx-download me-1"></i>
                                                            Download Excel
                                                        </>
                                                    )}
                                                </Button>

                                                <Button
                                                    color="primary"
                                                    outline
                                                    onClick={() =>
                                                        fetchReports(
                                                            currentPage
                                                        )
                                                    }
                                                    disabled={
                                                        tableLoading
                                                    }
                                                >
                                                    {tableLoading
                                                        ? "Refreshing..."
                                                        : "Refresh"}
                                                </Button>
                                            </div>
                                        </div>

                                        {/* ================================================= */}
                                        {/* ERROR */}
                                        {/* ================================================= */}

                                        {pageError ? (
                                            <div className="alert alert-danger">
                                                {pageError}
                                            </div>
                                        ) : null}

                                        {/* ================================================= */}
                                        {/* FILTERS ROW 1 */}
                                        {/* ================================================= */}

                                        <Row className="mb-3">
                                            <Col
                                                lg={3}
                                                md={6}
                                                className="mb-3"
                                            >
                                                <label className="form-label">
                                                    Search
                                                </label>

                                                <InputGroup>
                                                    <InputGroupText>
                                                        <i className="bx bx-search" />
                                                    </InputGroupText>

                                                    <Input
                                                        value={
                                                            searchText
                                                        }
                                                        placeholder="Customer, phone, BDO, invoice..."
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            setSearchText(
                                                                e
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                    />
                                                </InputGroup>
                                            </Col>

                                            <Col
                                                lg={3}
                                                md={6}
                                                className="mb-3"
                                            >
                                                <label className="form-label">
                                                    Team
                                                </label>

                                                <Select
                                                    options={
                                                        teamOptions
                                                    }
                                                    value={
                                                        teamOptions.find(
                                                            (
                                                                item
                                                            ) =>
                                                                item.value ===
                                                                String(
                                                                    teamFilter
                                                                )
                                                        ) ||
                                                        null
                                                    }
                                                    onChange={(
                                                        selected
                                                    ) =>
                                                        setTeamFilter(
                                                            selected
                                                                ? selected.value
                                                                : ""
                                                        )
                                                    }
                                                    isClearable
                                                    isSearchable
                                                    placeholder="Select Team"
                                                    styles={
                                                        selectStyles
                                                    }
                                                />
                                            </Col>

                                            <Col
                                                lg={3}
                                                md={6}
                                                className="mb-3"
                                            >
                                                <label className="form-label">
                                                    Sales Person (BDO)
                                                </label>

                                                <Select
                                                    options={
                                                        staffOptions
                                                    }
                                                    value={
                                                        staffOptions.find(
                                                            (
                                                                item
                                                            ) =>
                                                                item.value ===
                                                                String(
                                                                    staffFilter
                                                                )
                                                        ) ||
                                                        null
                                                    }
                                                    onChange={(
                                                        selected
                                                    ) =>
                                                        setStaffFilter(
                                                            selected
                                                                ? selected.value
                                                                : ""
                                                        )
                                                    }
                                                    isClearable
                                                    isSearchable
                                                    placeholder="Select BDO"
                                                    styles={
                                                        selectStyles
                                                    }
                                                />
                                            </Col>

                                            <Col
                                                lg={3}
                                                md={6}
                                                className="mb-3"
                                            >
                                                <label className="form-label">
                                                    Call Status
                                                </label>

                                                <Input
                                                    type="select"
                                                    value={
                                                        callStatusFilter
                                                    }
                                                    onChange={(
                                                        e
                                                    ) =>
                                                        setCallStatusFilter(
                                                            e
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                >
                                                    <option value="">
                                                        All
                                                    </option>

                                                    <option value="active">
                                                        Active
                                                    </option>

                                                    <option value="productive">
                                                        Productive
                                                    </option>
                                                </Input>
                                            </Col>
                                        </Row>

                                        {/* ================================================= */}
                                        {/* FILTERS ROW 2 */}
                                        {/* ================================================= */}

                                        <Row className="mb-3">
                                            <Col
                                                lg={3}
                                                md={6}
                                                className="mb-3"
                                            >
                                                <label className="form-label">
                                                    DSR Status
                                                </label>

                                                <Input
                                                    type="select"
                                                    value={
                                                        statusFilter
                                                    }
                                                    onChange={(
                                                        e
                                                    ) =>
                                                        setStatusFilter(
                                                            e
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                >
                                                    <option value="">
                                                        All
                                                    </option>

                                                    <option value="dsr created">
                                                        DSR Created
                                                    </option>

                                                    <option value="dsr approved">
                                                        DSR Approved
                                                    </option>

                                                    <option value="dsr confirmed">
                                                        DSR Confirmed
                                                    </option>

                                                    <option value="dsr rejected">
                                                        DSR Rejected
                                                    </option>
                                                </Input>
                                            </Col>

                                            <Col
                                                lg={3}
                                                md={6}
                                                className="mb-3"
                                            >
                                                <label className="form-label">
                                                    State
                                                </label>

                                                <Select
                                                    options={
                                                        stateOptions
                                                    }
                                                    value={
                                                        stateOptions.find(
                                                            (
                                                                item
                                                            ) =>
                                                                item.value ===
                                                                String(
                                                                    stateFilter
                                                                )
                                                        ) ||
                                                        null
                                                    }
                                                    onChange={(
                                                        selected
                                                    ) => {
                                                        setStateFilter(
                                                            selected
                                                                ? selected.value
                                                                : ""
                                                        );

                                                        setDistrictFilter(
                                                            ""
                                                        );
                                                    }}
                                                    isClearable
                                                    isSearchable
                                                    placeholder="Select State"
                                                    styles={
                                                        selectStyles
                                                    }
                                                />
                                            </Col>

                                            <Col
                                                lg={3}
                                                md={6}
                                                className="mb-3"
                                            >
                                                <label className="form-label">
                                                    District
                                                </label>

                                                <Select
                                                    options={
                                                        districtOptions
                                                    }
                                                    value={
                                                        districtOptions.find(
                                                            (
                                                                item
                                                            ) =>
                                                                item.value ===
                                                                String(
                                                                    districtFilter
                                                                )
                                                        ) ||
                                                        null
                                                    }
                                                    onChange={(
                                                        selected
                                                    ) =>
                                                        setDistrictFilter(
                                                            selected
                                                                ? selected.value
                                                                : ""
                                                        )
                                                    }
                                                    isClearable
                                                    isSearchable
                                                    placeholder="Select District"
                                                    styles={
                                                        selectStyles
                                                    }
                                                />
                                            </Col>

                                            <Col
                                                lg={3}
                                                md={6}
                                                className="mb-3"
                                            >
                                                <label className="form-label">
                                                    Start Date
                                                </label>

                                                <Input
                                                    type="date"
                                                    value={
                                                        startDateFilter
                                                    }
                                                    onChange={(
                                                        e
                                                    ) =>
                                                        setStartDateFilter(
                                                            e
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                />
                                            </Col>
                                        </Row>

                                        {/* ================================================= */}
                                        {/* FILTER ROW 3 */}
                                        {/* ================================================= */}

                                        <Row className="mb-4">
                                            <Col
                                                lg={3}
                                                md={6}
                                                className="mb-3"
                                            >
                                                <label className="form-label">
                                                    End Date
                                                </label>

                                                <Input
                                                    type="date"
                                                    value={
                                                        endDateFilter
                                                    }
                                                    onChange={(
                                                        e
                                                    ) =>
                                                        setEndDateFilter(
                                                            e
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                />
                                            </Col>

                                            <Col
                                                lg={3}
                                                md={6}
                                                className="d-flex align-items-end mb-3"
                                            >
                                                <Button
                                                    color="primary"
                                                    className="w-100"
                                                    onClick={
                                                        handleSearch
                                                    }
                                                    disabled={
                                                        tableLoading
                                                    }
                                                >
                                                    <i className="bx bx-search me-1"></i>
                                                    Search
                                                </Button>
                                            </Col>

                                            <Col
                                                lg={3}
                                                md={6}
                                                className="d-flex align-items-end mb-3"
                                            >
                                                <Button
                                                    color="light"
                                                    className="w-100"
                                                    onClick={
                                                        handleClearFilters
                                                    }
                                                    disabled={
                                                        tableLoading
                                                    }
                                                >
                                                    Clear Filters
                                                </Button>
                                            </Col>
                                        </Row>

                                        {/* ================================================= */}
                                        {/* SUMMARY */}
                                        {/* ================================================= */}

                                        <Row className="mb-4">
                                            <Col
                                                xl={3}
                                                md={6}
                                                className="mb-3"
                                            >
                                                <Card className="border shadow-none h-100">
                                                    <CardBody>
                                                        <div className="text-muted mb-2">
                                                            Total Reports
                                                        </div>

                                                        <h3 className="mb-0">
                                                            {
                                                                summary.total_reports
                                                            }
                                                        </h3>
                                                    </CardBody>
                                                </Card>
                                            </Col>

                                            <Col
                                                xl={3}
                                                md={6}
                                                className="mb-3"
                                            >
                                                <Card className="border shadow-none h-100">
                                                    <CardBody>
                                                        <div className="text-muted mb-2">
                                                            Staff Count
                                                        </div>

                                                        <h3 className="mb-0">
                                                            {
                                                                summary.staff_count
                                                            }
                                                        </h3>
                                                    </CardBody>
                                                </Card>
                                            </Col>

                                            <Col
                                                xl={3}
                                                md={6}
                                                className="mb-3"
                                            >
                                                <Card className="border shadow-none h-100">
                                                    <CardBody>
                                                        <div className="text-muted mb-2">
                                                            Active Calls
                                                        </div>

                                                        <h3 className="mb-0">
                                                            {
                                                                summary
                                                                    .call_status
                                                                    .active
                                                            }
                                                        </h3>
                                                    </CardBody>
                                                </Card>
                                            </Col>

                                            <Col
                                                xl={3}
                                                md={6}
                                                className="mb-3"
                                            >
                                                <Card className="border shadow-none h-100">
                                                    <CardBody>
                                                        <div className="text-muted mb-2">
                                                            Productive Calls
                                                        </div>

                                                        <h3 className="mb-0">
                                                            {
                                                                summary
                                                                    .call_status
                                                                    .productive
                                                            }
                                                        </h3>
                                                    </CardBody>
                                                </Card>
                                            </Col>

                                            <Col
                                                xl={4}
                                                md={6}
                                                className="mb-3"
                                            >
                                                <Card className="border shadow-none h-100">
                                                    <CardBody>
                                                        <div className="text-muted mb-2">
                                                            Total Call Duration
                                                        </div>

                                                        <h4 className="mb-0">
                                                            {
                                                                summary.total_call_duration
                                                            }
                                                        </h4>
                                                    </CardBody>
                                                </Card>
                                            </Col>

                                            <Col
                                                xl={4}
                                                md={6}
                                                className="mb-3"
                                            >
                                                <Card className="border shadow-none h-100">
                                                    <CardBody>
                                                        <div className="text-muted mb-2">
                                                            Call Duration Avg 8 Hrs %
                                                        </div>

                                                        <h4 className="mb-0">
                                                            {Number(
                                                                summary.call_duration_average_8hrs ||
                                                                    0
                                                            ).toFixed(
                                                                2
                                                            )}
                                                            %
                                                        </h4>
                                                    </CardBody>
                                                </Card>
                                            </Col>

                                            <Col
                                                xl={4}
                                                md={6}
                                                className="mb-3"
                                            >
                                                <Card className="border shadow-none h-100">
                                                    <CardBody>
                                                        <div className="text-muted mb-2">
                                                            Current Page Invoice Amount
                                                        </div>

                                                        <h4 className="mb-0">
                                                            ₹
                                                            {formatAmount(
                                                                pageInvoiceTotal
                                                            )}
                                                        </h4>
                                                    </CardBody>
                                                </Card>
                                            </Col>
                                        </Row>

                                        {/* ================================================= */}
                                        {/* LOADING */}
                                        {/* ================================================= */}

                                        {tableLoading ? (
                                            <div className="text-center py-5">
                                                <Spinner color="primary" />

                                                <div className="mt-2">
                                                    Loading reports...
                                                </div>
                                            </div>
                                        ) : groupedReports.length ===
                                          0 ? (
                                            <div className="text-center text-muted py-5">
                                                No reports found
                                            </div>
                                        ) : (
                                            <>
                                                {/* ========================================= */}
                                                {/* TEAM WISE DATA */}
                                                {/* ========================================= */}

                                                {groupedReports.map(
                                                    ([
                                                        teamName,
                                                        teamRows,
                                                    ]) => {
                                                        const teamProductive =
                                                            teamRows.filter(
                                                                (
                                                                    item
                                                                ) =>
                                                                    normalize(
                                                                        item?.call_status
                                                                    ) ===
                                                                    "productive"
                                                            )
                                                                .length;

                                                        const teamInvoiceTotal =
                                                            teamRows.reduce(
                                                                (
                                                                    total,
                                                                    item
                                                                ) =>
                                                                    total +
                                                                    getInvoiceAmount(
                                                                        item
                                                                    ),
                                                                0
                                                            );

                                                        const uniqueStaff =
                                                            new Set(
                                                                teamRows
                                                                    .map(
                                                                        (
                                                                            item
                                                                        ) =>
                                                                            item?.created_by_name
                                                                    )
                                                                    .filter(
                                                                        Boolean
                                                                    )
                                                            )
                                                                .size;

                                                        return (
                                                            <Card
                                                                key={
                                                                    teamName
                                                                }
                                                                className="border shadow-none mb-4"
                                                            >
                                                                {/* ================================= */}
                                                                {/* TEAM HEADER */}
                                                                {/* ================================= */}

                                                                <div
                                                                    style={{
                                                                        background:
                                                                            "#d9eaf7",
                                                                        borderBottom:
                                                                            "1px solid #c8d6e5",
                                                                        padding:
                                                                            "14px 18px",
                                                                    }}
                                                                >
                                                                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                                                                        <div>
                                                                            <h5 className="mb-1 fw-bold">
                                                                                {
                                                                                    teamName
                                                                                }
                                                                            </h5>

                                                                            <div className="text-muted small">
                                                                                Team-wise
                                                                                BDO
                                                                                Sales
                                                                                Report
                                                                            </div>
                                                                        </div>

                                                                        <div className="d-flex flex-wrap gap-2">
                                                                            <Badge
                                                                                color="light"
                                                                                className="text-dark p-2"
                                                                            >
                                                                                Reports:{" "}
                                                                                {
                                                                                    teamRows.length
                                                                                }
                                                                            </Badge>

                                                                            <Badge
                                                                                color="primary"
                                                                                className="p-2"
                                                                            >
                                                                                BDOs:{" "}
                                                                                {
                                                                                    uniqueStaff
                                                                                }
                                                                            </Badge>

                                                                            <Badge
                                                                                color="success"
                                                                                className="p-2"
                                                                            >
                                                                                PC:{" "}
                                                                                {
                                                                                    teamProductive
                                                                                }
                                                                            </Badge>

                                                                            <Badge
                                                                                color="warning"
                                                                                className="text-dark p-2"
                                                                            >
                                                                                Invoice:
                                                                                ₹
                                                                                {formatAmount(
                                                                                    teamInvoiceTotal
                                                                                )}
                                                                            </Badge>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <CardBody className="p-0">
                                                                    <div className="table-responsive">
                                                                        <Table
                                                                            bordered
                                                                            hover
                                                                            className="align-middle mb-0"
                                                                        >
                                                                            <thead
                                                                                style={{
                                                                                    background:
                                                                                        "#ff0000",
                                                                                }}
                                                                            >
                                                                                <tr>
                                                                                    <th
                                                                                        className="text-white text-center"
                                                                                        style={{
                                                                                            minWidth:
                                                                                                "65px",
                                                                                        }}
                                                                                    >
                                                                                        SL
                                                                                    </th>

                                                                                    <th
                                                                                        className="text-white"
                                                                                        style={{
                                                                                            minWidth:
                                                                                                "180px",
                                                                                        }}
                                                                                    >
                                                                                        SALES
                                                                                        PERSON
                                                                                        (BDO)
                                                                                    </th>

                                                                                    <th
                                                                                        className="text-white"
                                                                                        style={{
                                                                                            minWidth:
                                                                                                "180px",
                                                                                        }}
                                                                                    >
                                                                                        CONTACT
                                                                                        PERSON
                                                                                    </th>

                                                                                    <th
                                                                                        className="text-white"
                                                                                        style={{
                                                                                            minWidth:
                                                                                                "150px",
                                                                                        }}
                                                                                    >
                                                                                        CONTACT
                                                                                        NO
                                                                                    </th>

                                                                                    <th
                                                                                        className="text-white"
                                                                                        style={{
                                                                                            minWidth:
                                                                                                "130px",
                                                                                        }}
                                                                                    >
                                                                                        STATE
                                                                                    </th>

                                                                                    <th
                                                                                        className="text-white"
                                                                                        style={{
                                                                                            minWidth:
                                                                                                "140px",
                                                                                        }}
                                                                                    >
                                                                                        DIST
                                                                                    </th>

                                                                                    <th
                                                                                        className="text-white text-center"
                                                                                        style={{
                                                                                            minWidth:
                                                                                                "110px",
                                                                                        }}
                                                                                    >
                                                                                        CD
                                                                                    </th>

                                                                                    <th
                                                                                        className="text-white text-center"
                                                                                        style={{
                                                                                            minWidth:
                                                                                                "70px",
                                                                                        }}
                                                                                    >
                                                                                        PC
                                                                                    </th>

                                                                                    <th
                                                                                        className="text-white"
                                                                                        style={{
                                                                                            minWidth:
                                                                                                "130px",
                                                                                        }}
                                                                                    >
                                                                                        INV
                                                                                        NO
                                                                                    </th>

                                                                                    <th
                                                                                        className="text-white text-end"
                                                                                        style={{
                                                                                            minWidth:
                                                                                                "130px",
                                                                                        }}
                                                                                    >
                                                                                        INV
                                                                                        AMT
                                                                                    </th>

                                                                                    <th
                                                                                        className="text-white"
                                                                                        style={{
                                                                                            minWidth:
                                                                                                "120px",
                                                                                        }}
                                                                                    >
                                                                                        CALL
                                                                                        STATUS
                                                                                    </th>

                                                                                    <th
                                                                                        className="text-white"
                                                                                        style={{
                                                                                            minWidth:
                                                                                                "130px",
                                                                                        }}
                                                                                    >
                                                                                        DSR
                                                                                        STATUS
                                                                                    </th>

                                                                                    <th
                                                                                        className="text-white"
                                                                                        style={{
                                                                                            minWidth:
                                                                                                "170px",
                                                                                        }}
                                                                                    >
                                                                                        CREATED
                                                                                        AT
                                                                                    </th>
                                                                                </tr>
                                                                            </thead>

                                                                            <tbody>
                                                                                {teamRows.map(
                                                                                    (
                                                                                        item,
                                                                                        index
                                                                                    ) => (
                                                                                        <tr
                                                                                            key={
                                                                                                item.id
                                                                                            }
                                                                                        >
                                                                                            <td className="text-center">
                                                                                                {index +
                                                                                                    1}
                                                                                            </td>

                                                                                            <td className="fw-semibold">
                                                                                                {item?.created_by_name ||
                                                                                                    "-"}
                                                                                            </td>

                                                                                            <td>
                                                                                                {item?.customer_name ||
                                                                                                    "-"}
                                                                                            </td>

                                                                                            <td>
                                                                                                {item?.phone ||
                                                                                                    "-"}
                                                                                            </td>

                                                                                            <td>
                                                                                                {item?.state_name ||
                                                                                                    "-"}
                                                                                            </td>

                                                                                            <td>
                                                                                                {item?.district_name ||
                                                                                                    "-"}
                                                                                            </td>

                                                                                            <td className="text-center">
                                                                                                {item?.call_duration ||
                                                                                                    "-"}
                                                                                            </td>

                                                                                            <td className="text-center fw-bold">
                                                                                                {normalize(
                                                                                                    item?.call_status
                                                                                                ) ===
                                                                                                "productive"
                                                                                                    ? 1
                                                                                                    : ""}
                                                                                            </td>

                                                                                            <td>
                                                                                                {getInvoiceNumber(
                                                                                                    item
                                                                                                ) ||
                                                                                                    "-"}
                                                                                            </td>

                                                                                            <td className="text-end fw-semibold">
                                                                                                {getInvoiceAmount(
                                                                                                    item
                                                                                                ) >
                                                                                                0
                                                                                                    ? `₹${formatAmount(
                                                                                                          getInvoiceAmount(
                                                                                                              item
                                                                                                          )
                                                                                                      )}`
                                                                                                    : "-"}
                                                                                            </td>

                                                                                            <td>
                                                                                                <Badge
                                                                                                    color={getBadgeColor(
                                                                                                        item?.call_status
                                                                                                    )}
                                                                                                >
                                                                                                    {getStatusLabel(
                                                                                                        item?.call_status
                                                                                                    )}
                                                                                                </Badge>
                                                                                            </td>

                                                                                            <td>
                                                                                                <Badge
                                                                                                    color={getBadgeColor(
                                                                                                        item?.status
                                                                                                    )}
                                                                                                >
                                                                                                    {getStatusLabel(
                                                                                                        item?.status
                                                                                                    )}
                                                                                                </Badge>
                                                                                            </td>

                                                                                            <td>
                                                                                                {formatDateTime(
                                                                                                    item?.created_at
                                                                                                )}
                                                                                            </td>
                                                                                        </tr>
                                                                                    )
                                                                                )}

                                                                                {/* ============================= */}
                                                                                {/* TEAM TOTAL */}
                                                                                {/* ============================= */}

                                                                                <tr
                                                                                    style={{
                                                                                        background:
                                                                                            "#ffff00",
                                                                                    }}
                                                                                >
                                                                                    <td className="fw-bold text-danger text-center">
                                                                                        TOTAL
                                                                                    </td>

                                                                                    <td></td>
                                                                                    <td></td>
                                                                                    <td></td>
                                                                                    <td></td>
                                                                                    <td></td>
                                                                                    <td></td>

                                                                                    <td className="text-center fw-bold">
                                                                                        {
                                                                                            teamProductive
                                                                                        }
                                                                                    </td>

                                                                                    <td></td>

                                                                                    <td className="text-end fw-bold">
                                                                                        ₹
                                                                                        {formatAmount(
                                                                                            teamInvoiceTotal
                                                                                        )}
                                                                                    </td>

                                                                                    <td></td>
                                                                                    <td></td>
                                                                                    <td></td>
                                                                                </tr>
                                                                            </tbody>
                                                                        </Table>
                                                                    </div>
                                                                </CardBody>
                                                            </Card>
                                                        );
                                                    }
                                                )}

                                                {/* ========================================= */}
                                                {/* PAGE TOTAL */}
                                                {/* ========================================= */}

                                                <Card className="border shadow-none">
                                                    <CardBody>
                                                        <Row>
                                                            <Col
                                                                md={
                                                                    4
                                                                }
                                                                className="mb-2"
                                                            >
                                                                <div className="text-muted">
                                                                    Page
                                                                    Reports
                                                                </div>

                                                                <h5>
                                                                    {
                                                                        reports.length
                                                                    }
                                                                </h5>
                                                            </Col>

                                                            <Col
                                                                md={
                                                                    4
                                                                }
                                                                className="mb-2"
                                                            >
                                                                <div className="text-muted">
                                                                    Page
                                                                    Productive
                                                                    Calls
                                                                </div>

                                                                <h5>
                                                                    {
                                                                        pageProductiveCount
                                                                    }
                                                                </h5>
                                                            </Col>

                                                            <Col
                                                                md={
                                                                    4
                                                                }
                                                                className="mb-2"
                                                            >
                                                                <div className="text-muted">
                                                                    Page
                                                                    Invoice
                                                                    Total
                                                                </div>

                                                                <h5>
                                                                    ₹
                                                                    {formatAmount(
                                                                        pageInvoiceTotal
                                                                    )}
                                                                </h5>
                                                            </Col>
                                                        </Row>
                                                    </CardBody>
                                                </Card>

                                                {/* ========================================= */}
                                                {/* PAGINATION */}
                                                {/* ========================================= */}

                                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mt-4">
                                                    <div className="text-muted">
                                                        Showing{" "}
                                                        {
                                                            reports.length
                                                        }{" "}
                                                        records
                                                        on
                                                        page{" "}
                                                        {
                                                            currentPage
                                                        }{" "}
                                                        of{" "}
                                                        {
                                                            totalPages
                                                        }
                                                        .
                                                        Total{" "}
                                                        {
                                                            count
                                                        }{" "}
                                                        records.
                                                    </div>

                                                    <div className="d-flex gap-2">
                                                        <Button
                                                            color="light"
                                                            disabled={
                                                                !previousPageUrl ||
                                                                currentPage <=
                                                                    1 ||
                                                                tableLoading
                                                            }
                                                            onClick={() =>
                                                                fetchReports(
                                                                    currentPage -
                                                                        1
                                                                )
                                                            }
                                                        >
                                                            <i className="bx bx-chevron-left me-1"></i>
                                                            Previous
                                                        </Button>

                                                        <Button
                                                            color="light"
                                                            disabled={
                                                                !nextPageUrl ||
                                                                tableLoading
                                                            }
                                                            onClick={() =>
                                                                fetchReports(
                                                                    currentPage +
                                                                        1
                                                                )
                                                            }
                                                        >
                                                            Next
                                                            <i className="bx bx-chevron-right ms-1"></i>
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

export default AllBdoSalesReportPage;