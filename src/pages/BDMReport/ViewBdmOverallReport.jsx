import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import {
    Card,
    CardBody,
    Col,
    Row,
    Table,
    CardTitle,
    Spinner,
    Button,
    Input,
    Label,
} from "reactstrap";
import * as XLSX from "xlsx-js-style";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "react-toastify/dist/ReactToastify.css";

const ViewBdmOverallReport = () => {
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState([]);

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [search, setSearch] = useState("");

    const [nextPage, setNextPage] = useState(null);
    const [previousPage, setPreviousPage] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    const token = localStorage.getItem("token");
    const baseUrl = import.meta.env.VITE_APP_KEY;

    const fetchReport = async (page = 1) => {
        try {
            setLoading(true);

            const response = await axios.get(`${baseUrl}bdm/daily/overall/report/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                params: {
                    start_date: startDate || "",
                    end_date: endDate || "",
                    page: page,
                },
            });

            const root = response?.data || {};
            const payload = root?.results || {};
            const mainData = payload?.data || [];

            setReportData(Array.isArray(mainData) ? mainData : []);
            setNextPage(root?.next || null);
            setPreviousPage(root?.previous || null);
            setCurrentPage(page);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load BDM overall report");
            setReportData([]);
            setNextPage(null);
            setPreviousPage(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport(1);
    }, []);

    const formatDate = (date) => {
        if (!date) return "-";

        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) return date;

        return parsedDate.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const formatNumber = (value) => {
        const num = Number(value || 0);
        return Number.isInteger(num) ? num : num.toFixed(2);
    };

    const timeToSeconds = (timeString) => {
        if (!timeString || typeof timeString !== "string") return 0;
        const parts = timeString.split(":").map(Number);
        if (parts.length !== 3 || parts.some(isNaN)) return 0;
        return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
    };

    const secondsToTime = (seconds) => {
        const totalSeconds = Number(seconds || 0);
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;

        return [
            String(hrs).padStart(2, "0"),
            String(mins).padStart(2, "0"),
            String(secs).padStart(2, "0"),
        ].join(":");
    };

    const getAverageFromRows = (rows) => {
        if (!rows || rows.length === 0) return 0;
        const total = rows.reduce((sum, row) => sum + Number(row.call_duration_average || 0), 0);
        return Number((total / rows.length).toFixed(2));
    };

    const normalizeSearch = (value) => String(value || "").toLowerCase().trim();

    const isWithinSelectedDateRange = (dateValue) => {
        if (!dateValue) return false;

        const itemDate = new Date(dateValue);
        if (isNaN(itemDate.getTime())) return false;

        const itemOnly = new Date(
            itemDate.getFullYear(),
            itemDate.getMonth(),
            itemDate.getDate()
        );

        let startOnly = null;
        let endOnly = null;

        if (startDate) {
            const s = new Date(startDate);
            startOnly = new Date(s.getFullYear(), s.getMonth(), s.getDate());
        }

        if (endDate) {
            const e = new Date(endDate);
            endOnly = new Date(e.getFullYear(), e.getMonth(), e.getDate());
        }

        if (startOnly && itemOnly < startOnly) return false;
        if (endOnly && itemOnly > endOnly) return false;

        return true;
    };

    const dateFilteredReportData = useMemo(() => {
        return (reportData || []).filter((item) =>
            isWithinSelectedDateRange(item.created_date)
        );
    }, [reportData, startDate, endDate]);

    const flattenedRows = useMemo(() => {
        const rows = [];

        dateFilteredReportData.forEach((dayItem) => {
            (dayItem.family_data || []).forEach((familyItem) => {
                (familyItem.bdm_data || []).forEach((bdmItem) => {
                    rows.push({
                        created_date: dayItem.created_date || "-",
                        bdo_present_count: dayItem.bdo_present_count || 0,
                        bdo_absent_count: dayItem.bdo_absent_count || 0,
                        bdo_half_day_count: dayItem.bdo_half_day_count || 0,
                        family_id: familyItem.family_id || "-",
                        family_name: familyItem.family_name || "-",
                        family_bdm_count: familyItem.bdm_count || 0,
                        family_total_order_count: familyItem.total_order_count || 0,
                        family_total_volume: familyItem.total_volume || 0,
                        family_total_call_duration: familyItem.total_call_duration || "00:00:00",
                        family_call_duration_average: familyItem.call_duration_average || 0,
                        bdm_id: bdmItem.bdm_id || "-",
                        bdm_name: bdmItem.bdm_name || "-",
                        total_order_count: bdmItem.total_order_count || 0,
                        total_volume: bdmItem.total_volume || 0,
                        total_call_duration: bdmItem.total_call_duration || "00:00:00",
                        call_duration_average: bdmItem.call_duration_average || 0,
                    });
                });
            });
        });

        return rows;
    }, [reportData]);

    const filteredRows = useMemo(() => {
        const query = normalizeSearch(search);
        if (!query) return flattenedRows;

        return flattenedRows.filter((row) => {
            return (
                normalizeSearch(row.created_date).includes(query) ||
                normalizeSearch(formatDate(row.created_date)).includes(query) ||
                normalizeSearch(row.family_name).includes(query) ||
                normalizeSearch(row.bdm_name).includes(query)
            );
        });
    }, [flattenedRows, search]);

    const overallSummary = useMemo(() => {
        if (!filteredRows.length) {
            return {
                bdo_present_count: 0,
                bdo_absent_count: 0,
                bdo_half_day_count: 0,
                total_volume: 0,
                total_call_duration: "00:00:00",
                call_duration_average: 0,
                family_count: 0,
                total_bdm_count: 0,
                total_order_count: 0,
                dates_count: 0,
            };
        }

        const uniqueDates = new Map();
        const uniqueFamilies = new Map();
        const uniqueBdms = new Map();

        let totalVolume = 0;
        let totalOrderCount = 0;
        let totalDurationSeconds = 0;

        filteredRows.forEach((row) => {
            if (!uniqueDates.has(row.created_date)) {
                uniqueDates.set(row.created_date, {
                    bdo_present_count: Number(row.bdo_present_count || 0),
                    bdo_absent_count: Number(row.bdo_absent_count || 0),
                    bdo_half_day_count: Number(row.bdo_half_day_count || 0),
                });
            }

            uniqueFamilies.set(row.family_id, row.family_name);
            uniqueBdms.set(row.bdm_id, row.bdm_name);

            totalVolume += Number(row.total_volume || 0);
            totalOrderCount += Number(row.total_order_count || 0);
            totalDurationSeconds += timeToSeconds(row.total_call_duration);
        });

        let bdoPresent = 0;
        let bdoAbsent = 0;
        let bdoHalfDay = 0;

        uniqueDates.forEach((item) => {
            bdoPresent += item.bdo_present_count;
            bdoAbsent += item.bdo_absent_count;
            bdoHalfDay += item.bdo_half_day_count;
        });

        return {
            bdo_present_count: bdoPresent,
            bdo_absent_count: bdoAbsent,
            bdo_half_day_count: bdoHalfDay,
            total_volume: totalVolume,
            total_call_duration: secondsToTime(totalDurationSeconds),
            call_duration_average: getAverageFromRows(filteredRows),
            family_count: uniqueFamilies.size,
            total_bdm_count: uniqueBdms.size,
            total_order_count: totalOrderCount,
            dates_count: uniqueDates.size,
        };
    }, [filteredRows]);

    const dateWiseSections = useMemo(() => {
        const query = normalizeSearch(search);

        const mapped = dateFilteredReportData
            .map((dayItem) => {
                const matchedFamilies = (dayItem.family_data || [])
                    .map((familyItem) => {
                        const matchedBdms = (familyItem.bdm_data || []).filter((bdmItem) => {
                            if (!query) return true;

                            return (
                                normalizeSearch(dayItem.created_date).includes(query) ||
                                normalizeSearch(formatDate(dayItem.created_date)).includes(query) ||
                                normalizeSearch(familyItem.family_name).includes(query) ||
                                normalizeSearch(bdmItem.bdm_name).includes(query)
                            );
                        });

                        if (!matchedBdms.length) return null;

                        const familyVolume = matchedBdms.reduce(
                            (sum, item) => sum + Number(item.total_volume || 0),
                            0
                        );
                        const familyOrders = matchedBdms.reduce(
                            (sum, item) => sum + Number(item.total_order_count || 0),
                            0
                        );
                        const familyDurationSeconds = matchedBdms.reduce(
                            (sum, item) => sum + timeToSeconds(item.total_call_duration),
                            0
                        );

                        return {
                            family_id: familyItem.family_id,
                            family_name: familyItem.family_name,
                            bdm_count: matchedBdms.length,
                            total_order_count: familyOrders,
                            total_volume: familyVolume,
                            total_call_duration: secondsToTime(familyDurationSeconds),
                            call_duration_average: getAverageFromRows(matchedBdms),
                            bdm_data: matchedBdms,
                        };
                    })
                    .filter(Boolean);

                if (!matchedFamilies.length) return null;

                const dayRows = matchedFamilies.flatMap((family) =>
                    family.bdm_data.map((bdm) => ({
                        ...bdm,
                        family_name: family.family_name,
                        family_id: family.family_id,
                    }))
                );

                const totalVolume = dayRows.reduce(
                    (sum, item) => sum + Number(item.total_volume || 0),
                    0
                );
                const totalOrderCount = dayRows.reduce(
                    (sum, item) => sum + Number(item.total_order_count || 0),
                    0
                );
                const totalDurationSeconds = dayRows.reduce(
                    (sum, item) => sum + timeToSeconds(item.total_call_duration),
                    0
                );

                const uniqueBdmIds = new Set(dayRows.map((item) => item.bdm_id));

                return {
                    created_date: dayItem.created_date,
                    bdo_present_count: dayItem.bdo_present_count || 0,
                    bdo_absent_count: dayItem.bdo_absent_count || 0,
                    bdo_half_day_count: dayItem.bdo_half_day_count || 0,
                    family_count: matchedFamilies.length,
                    total_bdm_count: uniqueBdmIds.size,
                    total_order_count: totalOrderCount,
                    total_volume: totalVolume,
                    total_call_duration: secondsToTime(totalDurationSeconds),
                    call_duration_average: getAverageFromRows(dayRows),
                    family_data: matchedFamilies,
                    rows: dayRows,
                };
            })
            .filter(Boolean);

        return mapped;
    }, [reportData, search]);

    const familyWiseSections = useMemo(() => {
        if (!filteredRows.length) return [];

        const familyMap = new Map();

        filteredRows.forEach((row) => {
            if (!familyMap.has(row.family_id)) {
                familyMap.set(row.family_id, {
                    family_id: row.family_id,
                    family_name: row.family_name,
                    dates: new Set(),
                    bdms: new Map(),
                    total_order_count: 0,
                    total_volume: 0,
                    total_duration_seconds: 0,
                });
            }

            const family = familyMap.get(row.family_id);
            family.dates.add(row.created_date);
            family.total_order_count += Number(row.total_order_count || 0);
            family.total_volume += Number(row.total_volume || 0);
            family.total_duration_seconds += timeToSeconds(row.total_call_duration);

            if (!family.bdms.has(row.bdm_id)) {
                family.bdms.set(row.bdm_id, {
                    bdm_id: row.bdm_id,
                    bdm_name: row.bdm_name,
                    dates: new Set(),
                    total_order_count: 0,
                    total_volume: 0,
                    total_duration_seconds: 0,
                    avg_values: [],
                });
            }

            const bdm = family.bdms.get(row.bdm_id);
            bdm.dates.add(row.created_date);
            bdm.total_order_count += Number(row.total_order_count || 0);
            bdm.total_volume += Number(row.total_volume || 0);
            bdm.total_duration_seconds += timeToSeconds(row.total_call_duration);
            bdm.avg_values.push(Number(row.call_duration_average || 0));
        });

        return Array.from(familyMap.values()).map((family) => {
            const bdm_data = Array.from(family.bdms.values()).map((bdm) => ({
                bdm_id: bdm.bdm_id,
                bdm_name: bdm.bdm_name,
                dates_count: bdm.dates.size,
                total_order_count: bdm.total_order_count,
                total_volume: bdm.total_volume,
                total_call_duration: secondsToTime(bdm.total_duration_seconds),
                call_duration_average: Number(
                    (
                        bdm.avg_values.reduce((sum, val) => sum + val, 0) /
                        (bdm.avg_values.length || 1)
                    ).toFixed(2)
                ),
            }));

            return {
                family_id: family.family_id,
                family_name: family.family_name,
                dates_count: family.dates.size,
                bdm_count: bdm_data.length,
                total_order_count: family.total_order_count,
                total_volume: family.total_volume,
                total_call_duration: secondsToTime(family.total_duration_seconds),
                call_duration_average: getAverageFromRows(bdm_data),
                bdm_data,
            };
        });
    }, [filteredRows]);

    const exportToExcel = () => {
        try {
            if (!filteredRows || filteredRows.length === 0) {
                toast.error("No data to export");
                return;
            }

            const wb = XLSX.utils.book_new();
            const wsData = [];

            wsData.push(["BDM DAILY OVERALL REPORT"]);
            wsData.push([]);

            wsData.push(["OVERALL SUMMARY"]);
            wsData.push(["Metric", "Value"]);
            wsData.push(["Total Dates", overallSummary.dates_count]);
            wsData.push(["BDO Present", overallSummary.bdo_present_count]);
            wsData.push(["BDO Absent", overallSummary.bdo_absent_count]);
            wsData.push(["BDO Half Day", overallSummary.bdo_half_day_count]);
            wsData.push(["Family Count", overallSummary.family_count]);
            wsData.push(["Total BDM Count", overallSummary.total_bdm_count]);
            wsData.push(["Total Order Count", overallSummary.total_order_count]);
            wsData.push(["Total Volume", overallSummary.total_volume]);
            wsData.push(["Total Call Duration", overallSummary.total_call_duration]);
            wsData.push(["Avg Call Duration", overallSummary.call_duration_average]);
            wsData.push([]);

            wsData.push(["DATE WISE DATA"]);
            wsData.push([
                "#",
                "Date",
                "Family",
                "BDM Name",
                "Order Count",
                "Volume",
                "Call Duration",
                "Avg Duration",
            ]);

            filteredRows.forEach((item, index) => {
                wsData.push([
                    index + 1,
                    formatDate(item.created_date),
                    item.family_name,
                    item.bdm_name,
                    item.total_order_count,
                    item.total_volume,
                    item.total_call_duration,
                    item.call_duration_average,
                ]);
            });

            const ws = XLSX.utils.aoa_to_sheet(wsData);

            ws["!merges"] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
                { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } },
                { s: { r: 15, c: 0 }, e: { r: 15, c: 7 } },
            ];

            ws["!cols"] = [
                { wch: 8 },
                { wch: 16 },
                { wch: 20 },
                { wch: 24 },
                { wch: 14 },
                { wch: 16 },
                { wch: 18 },
                { wch: 16 },
            ];

            XLSX.utils.book_append_sheet(wb, ws, "BDM Overall Report");
            XLSX.writeFile(wb, "BDM_Daily_Overall_Report.xlsx");
            toast.success("Excel exported successfully");
        } catch (error) {
            console.error(error);
            toast.error("Excel export failed");
        }
    };

    const exportToPDF = () => {
        try {
            if (!filteredRows || filteredRows.length === 0) {
                toast.error("No data to export");
                return;
            }

            const doc = new jsPDF("landscape");

            doc.setFontSize(18);
            doc.setTextColor(31, 78, 121);
            doc.text("BDM DAILY OVERALL REPORT", 14, 15);

            autoTable(doc, {
                startY: 24,
                head: [["Metric", "Value"]],
                body: [
                    ["Total Dates", overallSummary.dates_count],
                    ["BDO Present", overallSummary.bdo_present_count],
                    ["BDO Absent", overallSummary.bdo_absent_count],
                    ["BDO Half Day", overallSummary.bdo_half_day_count],
                    ["Family Count", overallSummary.family_count],
                    ["Total BDM Count", overallSummary.total_bdm_count],
                    ["Total Order Count", overallSummary.total_order_count],
                    ["Total Volume", overallSummary.total_volume],
                    ["Total Call Duration", overallSummary.total_call_duration],
                    ["Avg Call Duration", overallSummary.call_duration_average],
                ],
                theme: "grid",
                styles: {
                    fontSize: 9,
                    halign: "left",
                    valign: "middle",
                },
                headStyles: {
                    fillColor: [32, 58, 67],
                    textColor: [255, 255, 255],
                    fontStyle: "bold",
                },
                margin: { left: 14, right: 14 },
                tableWidth: 100,
            });

            const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : 80;

            autoTable(doc, {
                startY: finalY,
                head: [[
                    "#",
                    "Date",
                    "Family",
                    "BDM Name",
                    "Order Count",
                    "Volume",
                    "Call Duration",
                    "Avg Duration",
                ]],
                body: filteredRows.map((item, index) => [
                    index + 1,
                    formatDate(item.created_date),
                    item.family_name,
                    item.bdm_name,
                    item.total_order_count,
                    item.total_volume,
                    item.total_call_duration,
                    item.call_duration_average,
                ]),
                theme: "grid",
                styles: {
                    fontSize: 8,
                    halign: "center",
                    valign: "middle",
                    cellPadding: 2,
                },
                headStyles: {
                    fillColor: [40, 131, 122],
                    textColor: [255, 255, 255],
                    fontStyle: "bold",
                },
            });

            doc.save("BDM_Daily_Overall_Report.pdf");
            toast.success("PDF exported successfully");
        } catch (error) {
            console.error(error);
            toast.error("PDF export failed");
        }
    };

    const SummaryCard = ({ title, value, bg, border, color }) => (
        <Col md="2">
            <div
                style={{
                    background: bg,
                    borderRadius: "10px",
                    padding: "14px 16px",
                    border: `1px solid ${border}`,
                    minHeight: "78px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                }}
            >
                <span style={{ fontSize: "13px", color }}>{title}</span>
                <span style={{ fontSize: "20px", color, fontWeight: "bold" }}>{value}</span>
            </div>
        </Col>
    );

    return (
        <React.Fragment>
            <div className="page-content">
                <ToastContainer />

                <Card
                    style={{
                        borderRadius: "15px",
                        boxShadow: "0px 4px 12px rgba(0,0,0,0.15)",
                        marginBottom: "20px",
                        background: "linear-gradient(90deg, #0f2027, #203a43, #2c5364)",
                        color: "white",
                    }}
                >
                    <CardBody className="m-1">
                        <Row className="align-items-center">
                            <Col md="8">
                                <h2 style={{ margin: 0, fontWeight: "bold" }}>
                                    BDM Daily Overall Report
                                </h2>
                                <p style={{ margin: 0, opacity: 0.85 }}>
                                    View overall summary, date-wise summary, family-wise summary and export
                                </p>
                            </Col>

                            <Col md="4" className="text-end">
                                <Button
                                    color="primary"
                                    style={{ marginRight: "10px", fontWeight: "bold" }}
                                    onClick={exportToExcel}
                                    disabled={loading || filteredRows.length === 0}
                                >
                                    Export Excel
                                </Button>

                                <Button
                                    color="success"
                                    style={{ fontWeight: "bold" }}
                                    onClick={exportToPDF}
                                    disabled={loading || filteredRows.length === 0}
                                >
                                    Export PDF
                                </Button>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>

                <Row>
                    <Col lg="12">
                        <Card
                            style={{
                                borderRadius: "12px",
                                boxShadow: "0px 3px 10px rgba(0,0,0,0.12)",
                                marginBottom: "20px",
                            }}
                        >
                            <CardBody>
                                <CardTitle tag="h5" style={{ fontWeight: "bold", marginBottom: "15px" }}>
                                    Search Filters
                                </CardTitle>

                                <Row className="mb-3 g-3">
                                    <Col md={4}>
                                        <Label style={{ fontWeight: "bold" }}>Search</Label>
                                        <Input
                                            placeholder="Search Family / BDM / Date..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                        />
                                    </Col>

                                    <Col md={2}>
                                        <Label style={{ fontWeight: "bold" }}>Start Date</Label>
                                        <Input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                        />
                                    </Col>

                                    <Col md={2}>
                                        <Label style={{ fontWeight: "bold" }}>End Date</Label>
                                        <Input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                        />
                                    </Col>

                                    <Col md={2} className="d-flex align-items-end">
                                        <Button
                                            color="secondary"
                                            style={{ width: "100%", fontWeight: "bold" }}
                                            onClick={() => {
                                                setSearch("");
                                                setStartDate("");
                                                setEndDate("");
                                                setTimeout(() => fetchReport(1), 0);
                                            }}
                                        >
                                            Reset
                                        </Button>
                                    </Col>

                                    <Col md={2} className="d-flex align-items-end">
                                        <Button
                                            color="secondary"
                                            style={{ width: "100%", fontWeight: "bold" }}
                                            onClick={() => {
                                                setSearch("");
                                                setStartDate("");
                                                setEndDate("");
                                                setTimeout(fetchReport, 0);
                                            }}
                                        >
                                            Reset
                                        </Button>
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>

                        <Card
                            style={{
                                borderRadius: "12px",
                                boxShadow: "0px 3px 10px rgba(0,0,0,0.12)",
                                marginBottom: "20px",
                            }}
                        >
                            <CardBody>
                                <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
                                    <CardTitle className="h4 mb-0">OVERALL SUMMARY</CardTitle>
                                    <div style={{ fontSize: "14px", color: "#6c757d", fontWeight: "600" }}>
                                        {startDate || endDate
                                            ? `Range: ${startDate ? formatDate(startDate) : "-"} to ${endDate ? formatDate(endDate) : "-"}`
                                            : "All Available Dates"}
                                    </div>
                                </div>

                                <Row className="g-3">
                                    <SummaryCard
                                        title="BDO Present"
                                        value={overallSummary.bdo_present_count}
                                        bg="#fff3cd"
                                        border="#ffe69c"
                                        color="#856404"
                                    />
                                    <SummaryCard
                                        title="BDO Absent"
                                        value={overallSummary.bdo_absent_count}
                                        bg="#f8d7da"
                                        border="#f1aeb5"
                                        color="#842029"
                                    />
                                    <SummaryCard
                                        title="BDO Half Day"
                                        value={overallSummary.bdo_half_day_count}
                                        bg="#e2d9f3"
                                        border="#cbbbe9"
                                        color="#5a3d8a"
                                    />
                                    <SummaryCard
                                        title="Total Volume"
                                        value={formatNumber(overallSummary.total_volume)}
                                        bg="#e0f7fa"
                                        border="#80deea"
                                        color="#006064"
                                    />
                                    <SummaryCard
                                        title="Call Duration"
                                        value={overallSummary.total_call_duration}
                                        bg="#d1ecf1"
                                        border="#abdde5"
                                        color="#0c5460"
                                    />
                                    <SummaryCard
                                        title="Avg Call Duration"
                                        value={overallSummary.call_duration_average}
                                        bg="#fff8e1"
                                        border="#ffe082"
                                        color="#ff8f00"
                                    />
                                    <SummaryCard
                                        title="Families"
                                        value={overallSummary.family_count}
                                        bg="#f8f9fa"
                                        border="#e9ecef"
                                        color="#495057"
                                    />
                                    <SummaryCard
                                        title="Total BDM"
                                        value={overallSummary.total_bdm_count}
                                        bg="#d4edda"
                                        border="#a3cfbb"
                                        color="#155724"
                                    />
                                    <SummaryCard
                                        title="Total Orders"
                                        value={overallSummary.total_order_count}
                                        bg="#f3e8ff"
                                        border="#d8b4fe"
                                        color="#6b21a8"
                                    />
                                    <SummaryCard
                                        title="Dates"
                                        value={overallSummary.dates_count}
                                        bg="#ede9fe"
                                        border="#c4b5fd"
                                        color="#5b21b6"
                                    />
                                </Row>
                            </CardBody>
                        </Card>

                        <Card
                            style={{
                                borderRadius: "12px",
                                boxShadow: "0px 3px 10px rgba(0,0,0,0.12)",
                                marginBottom: "20px",
                            }}
                        >
                            <Card
                                style={{
                                    borderRadius: "12px",
                                    boxShadow: "0px 3px 10px rgba(0,0,0,0.12)",
                                    marginBottom: "20px",
                                }}
                            >
                                <CardBody>
                                    <CardTitle className="h4 mb-4">DATE-WISE SUMMARY & DATA</CardTitle>

                                    {loading ? (
                                        <div className="text-center my-5">
                                            <Spinner color="primary" />
                                        </div>
                                    ) : dateWiseSections.length === 0 ? (
                                        <div className="text-center my-4">
                                            <p className="mb-0">No date-wise report data found</p>
                                        </div>
                                    ) : (
                                        dateWiseSections.map((dateItem, dateIndex) => (
                                            <Card
                                                key={`${dateItem.created_date}-${dateIndex}`}
                                                style={{
                                                    borderRadius: "12px",
                                                    border: "1px solid #e9ecef",
                                                    marginBottom: "20px",
                                                    boxShadow: "0px 2px 8px rgba(0,0,0,0.08)",
                                                }}
                                            >
                                                <CardBody>
                                                    <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
                                                        <h5 className="mb-0" style={{ fontWeight: "700" }}>
                                                            Date: {formatDate(dateItem.created_date)}
                                                        </h5>
                                                    </div>

                                                    <Row className="g-3 mb-4">
                                                        <SummaryCard
                                                            title="BDO Present"
                                                            value={dateItem.bdo_present_count}
                                                            bg="#fff3cd"
                                                            border="#ffe69c"
                                                            color="#856404"
                                                        />
                                                        <SummaryCard
                                                            title="BDO Absent"
                                                            value={dateItem.bdo_absent_count}
                                                            bg="#f8d7da"
                                                            border="#f1aeb5"
                                                            color="#842029"
                                                        />
                                                        <SummaryCard
                                                            title="BDO Half Day"
                                                            value={dateItem.bdo_half_day_count}
                                                            bg="#e2d9f3"
                                                            border="#cbbbe9"
                                                            color="#5a3d8a"
                                                        />
                                                        <SummaryCard
                                                            title="Families"
                                                            value={dateItem.family_count}
                                                            bg="#f8f9fa"
                                                            border="#e9ecef"
                                                            color="#495057"
                                                        />
                                                        <SummaryCard
                                                            title="Total BDM"
                                                            value={dateItem.total_bdm_count}
                                                            bg="#d4edda"
                                                            border="#a3cfbb"
                                                            color="#155724"
                                                        />
                                                        <SummaryCard
                                                            title="Total Orders"
                                                            value={dateItem.total_order_count}
                                                            bg="#f3e8ff"
                                                            border="#d8b4fe"
                                                            color="#6b21a8"
                                                        />
                                                        <SummaryCard
                                                            title="Total Volume"
                                                            value={formatNumber(dateItem.total_volume)}
                                                            bg="#e0f7fa"
                                                            border="#80deea"
                                                            color="#006064"
                                                        />
                                                        <SummaryCard
                                                            title="Call Duration"
                                                            value={dateItem.total_call_duration}
                                                            bg="#d1ecf1"
                                                            border="#abdde5"
                                                            color="#0c5460"
                                                        />
                                                        <SummaryCard
                                                            title="Avg Duration"
                                                            value={dateItem.call_duration_average}
                                                            bg="#fff8e1"
                                                            border="#ffe082"
                                                            color="#ff8f00"
                                                        />
                                                    </Row>

                                                    {/* <Table bordered responsive hover className="align-middle mb-4">
                                                        <thead className="table-light">
                                                            <tr>
                                                                <th>#</th>
                                                                <th>Family</th>
                                                                <th>BDM Name</th>
                                                                <th>Order Count</th>
                                                                <th>Volume</th>
                                                                <th>Call Duration</th>
                                                                <th>Avg Duration</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {dateItem.rows.map((item, index) => (
                                                                <tr
                                                                    key={`${dateItem.created_date}-${item.family_id}-${item.bdm_id}-${index}`}
                                                                >
                                                                    <td>{index + 1}</td>
                                                                    <td>{item.family_name || "-"}</td>
                                                                    <td>{item.bdm_name || "-"}</td>
                                                                    <td>{item.total_order_count || 0}</td>
                                                                    <td>{formatNumber(item.total_volume)}</td>
                                                                    <td>{item.total_call_duration || "00:00:00"}</td>
                                                                    <td>{item.call_duration_average || 0}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </Table> */}

                                                    <div className="mt-4">
                                                        <h5 style={{ fontWeight: "700", marginBottom: "16px" }}>
                                                            FAMILY-WISE SUMMARY & DATA
                                                        </h5>

                                                        {dateItem.family_data.map((familyItem, familyIndex) => (
                                                            <Card
                                                                key={`${dateItem.created_date}-${familyItem.family_id}-${familyIndex}`}
                                                                style={{
                                                                    borderRadius: "12px",
                                                                    border: "1px solid #e9ecef",
                                                                    marginBottom: "20px",
                                                                    boxShadow: "0px 2px 8px rgba(0,0,0,0.08)",
                                                                }}
                                                            >
                                                                <CardBody>
                                                                    <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
                                                                        <h5 className="mb-0" style={{ fontWeight: "700" }}>
                                                                            Family: {familyItem.family_name}
                                                                        </h5>
                                                                    </div>

                                                                    <Row className="g-3 mb-4">
                                                                        <SummaryCard
                                                                            title="Total BDM"
                                                                            value={familyItem.bdm_count}
                                                                            bg="#d4edda"
                                                                            border="#a3cfbb"
                                                                            color="#155724"
                                                                        />
                                                                        <SummaryCard
                                                                            title="Total Orders"
                                                                            value={familyItem.total_order_count}
                                                                            bg="#f3e8ff"
                                                                            border="#d8b4fe"
                                                                            color="#6b21a8"
                                                                        />
                                                                        <SummaryCard
                                                                            title="Total Volume"
                                                                            value={formatNumber(familyItem.total_volume)}
                                                                            bg="#e0f7fa"
                                                                            border="#80deea"
                                                                            color="#006064"
                                                                        />
                                                                        <SummaryCard
                                                                            title="Call Duration"
                                                                            value={familyItem.total_call_duration}
                                                                            bg="#d1ecf1"
                                                                            border="#abdde5"
                                                                            color="#0c5460"
                                                                        />
                                                                        <SummaryCard
                                                                            title="Avg Duration"
                                                                            value={familyItem.call_duration_average}
                                                                            bg="#fff8e1"
                                                                            border="#ffe082"
                                                                            color="#ff8f00"
                                                                        />
                                                                    </Row>

                                                                    <Table bordered responsive hover className="align-middle">
                                                                        <thead className="table-light">
                                                                            <tr>
                                                                                <th>#</th>
                                                                                <th>BDM Name</th>
                                                                                <th>Order Count</th>
                                                                                <th>Volume</th>
                                                                                <th>Call Duration</th>
                                                                                <th>Avg Duration</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {(familyItem.bdm_data || []).map((bdm, index) => (
                                                                                <tr
                                                                                    key={`${dateItem.created_date}-${familyItem.family_id}-${bdm.bdm_id}-${index}`}
                                                                                >
                                                                                    <td>{index + 1}</td>
                                                                                    <td>{bdm.bdm_name || "-"}</td>
                                                                                    <td>{bdm.total_order_count || 0}</td>
                                                                                    <td>{formatNumber(bdm.total_volume)}</td>
                                                                                    <td>{bdm.total_call_duration || "00:00:00"}</td>
                                                                                    <td>{bdm.call_duration_average || 0}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </Table>
                                                                </CardBody>
                                                            </Card>
                                                        ))}
                                                    </div>
                                                </CardBody>
                                            </Card>
                                        ))
                                    )}

                                    <Row className="mt-3">
                                        <Col className="d-flex justify-content-end gap-2">
                                            <Button
                                                color="secondary"
                                                disabled={!previousPage || loading}
                                                onClick={() => fetchReport(currentPage - 1)}
                                            >
                                                Previous
                                            </Button>

                                            <Button color="light" disabled>
                                                Page {currentPage}
                                            </Button>

                                            <Button
                                                color="primary"
                                                disabled={!nextPage || loading}
                                                onClick={() => fetchReport(currentPage + 1)}
                                            >
                                                Next
                                            </Button>
                                        </Col>
                                    </Row>
                                </CardBody>
                            </Card>
                        </Card>
                    </Col>
                </Row>
            </div>
        </React.Fragment>
    );
};

export default ViewBdmOverallReport;