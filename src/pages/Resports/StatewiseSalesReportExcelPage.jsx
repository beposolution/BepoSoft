import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
    Container,
    Row,
    Col,
    Card,
    CardBody,
    Button,
    Input,
    Spinner,
} from "reactstrap";
import * as XLSX from "xlsx-js-style";
import {
    FaArrowLeft,
    FaFileExcel,
    FaFilter,
    FaSyncAlt,
    FaChartBar,
} from "react-icons/fa";

const localDate = (date = new Date()) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const firstDay = () => {
    const d = new Date();
    return localDate(new Date(d.getFullYear(), d.getMonth(), 1));
};

const lastDay = () => {
    const d = new Date();
    return localDate(new Date(d.getFullYear(), d.getMonth() + 1, 0));
};

const fmt = (n) =>
    Number(n || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 2,
    });

const BASE = String(import.meta.env.VITE_APP_KEY || "").replace(/\/+$/, "");

const apiUrl = (path) =>
    `${BASE}${BASE.endsWith("/api") ? "" : "/api"}/${path.replace(/^\/+/, "")}`;

const STATE_ORDER = [
    "Maharashtra",
    "Tamil Nadu",
    "Uttar Pradesh",
    "Karnataka",
    "Gujarat",
    "West Bengal",
    "Rajasthan",
    "Telangana",
    "Andhra Pradesh",
    "Madhya Pradesh",
    "Delhi",
    "Kerala",
    "Haryana",
    "Bihar",
    "Odisha",
    "Punjab",
    "Assam",
    "Chhattisgarh",
    "Jharkhand",
    "Uttarakhand",
    "Arunachal Pradesh",
    "Tripura",
    "Meghalaya",
    "Chandigarh",
    "Jammu and Kashmir",
    "Ladakh",
    "Goa",
    "Himachal Pradesh",
    "Manipur",
    "Mizoram",
    "Nagaland",
    "Sikkim",
    "Andaman and Nicobar Islands",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Puducherry",
];

const ALIASES = {
    andhrapradesh: "andhrapradesh",
    andrapradesh: "andhrapradesh",
    odisha: "odisha",
    orissa: "odisha",
    chattisgarh: "chhattisgarh",
    chhattisgarh: "chhattisgarh",
    jammukashmir: "jammuandkashmir",
    jammuandkashmir: "jammuandkashmir",
    pondicherry: "puducherry",
    puducherry: "puducherry",
    andaman: "andamanandnicobarislands",
    andamanandnicobarislands: "andamanandnicobarislands",
    damananddiu: "dadraandnagarhavelianddamananddiu",
    dadraandnagarhaveli: "dadraandnagarhavelianddamananddiu",
    dadraandnagarhavelianddamananddiu:
        "dadraandnagarhavelianddamananddiu",
};

const normalizeName = (value) => {
    const key = String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

    return ALIASES[key] || key;
};

const extractFamilies = (payload) => {
    const data = payload?.data;

    if (!Array.isArray(data)) {
        throw new Error("Unexpected family API response.");
    }

    return data
        .filter((f) => f && f.id != null && f.name != null)
        .map((f) => ({
            id: String(f.id),
            name: String(f.name),
        }));
};

const extractError = (error, fallback) => {
    const body = error?.response?.data;

    if (body && typeof body === "object") {
        const message = body.message || body.detail;

        if (message) {
            return typeof message === "string"
                ? message
                : JSON.stringify(message);
        }
    }

    return error?.message || fallback;
};

const parseNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const orderedRows = (data) => {
    const aggregated = new Map();

    for (const item of data) {
        const rawName = String(item?.state_name ?? "").trim();

        const name =
            !rawName || rawName.toLowerCase() === "none"
                ? "Unspecified"
                : rawName;

        const key = normalizeName(name);

        const existing = aggregated.get(key);

        const orderCount = Math.trunc(
            parseNumber(item?.order_count)
        );

        const volume = parseNumber(item?.volume);

        if (existing) {
            existing.order_count += orderCount;
            existing.volume += volume;
        } else {
            aggregated.set(key, {
                state_name: name,
                order_count: orderCount,
                volume,
            });
        }
    }

    const result = STATE_ORDER.map((name) => {
        const key = normalizeName(name);
        const existing = aggregated.get(key);

        aggregated.delete(key);

        return existing || {
            state_name: name,
            order_count: 0,
            volume: 0,
        };
    });

    const remaining = Array.from(aggregated.values()).sort(
        (a, b) =>
            a.state_name
                .toLowerCase()
                .localeCompare(b.state_name.toLowerCase())
    );

    return [...result, ...remaining];
};

const StatewiseSalesReportExcelPage = () => {
    const navigate = useNavigate();

    const [families, setFamilies] = useState([]);
    const [familyId, setFamilyId] = useState("");

    const [startDate, setStartDate] = useState(firstDay);
    const [endDate, setEndDate] = useState(lastDay);

    const [filters, setFilters] = useState(null);

    const [familyLoading, setFamilyLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);

    const [error, setError] = useState("");
    const [report, setReport] = useState(null);

    const fetchFamilies = useCallback(async (signal) => {
        setFamilyLoading(true);

        try {
            const token = localStorage.getItem("token")?.trim();

            if (!token) {
                throw new Error(
                    "Authentication token not found. Please log in again."
                );
            }

            if (!BASE) {
                throw new Error("VITE_APP_KEY is not configured.");
            }

            const response = await axios.get(
                apiUrl("familys/"),
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                    signal,
                    timeout: 30000,
                }
            );

            const items = extractFamilies(response.data);

            if (signal?.aborted) return;

            setFamilies(items);

            setFamilyId((previous) =>
                items.some((f) => f.id === previous)
                    ? previous
                    : ""
            );

            if (!items.length) {
                setError("No families found in the family API response.");
            }
        } catch (e) {
            if (!signal?.aborted) {
                setError(
                    extractError(e, "Failed to load families.")
                );
            }
        } finally {
            if (!signal?.aborted) {
                setFamilyLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        fetchFamilies(controller.signal);

        return () => controller.abort();
    }, [fetchFamilies]);

    useEffect(() => {
        if (!filters) return;

        const controller = new AbortController();

        const fetchReport = async () => {
            setLoading(true);
            setError("");
            setReport(null);

            try {
                const token = localStorage.getItem("token")?.trim();

                if (!token) {
                    throw new Error(
                        "Authentication token not found. Please log in again."
                    );
                }

                if (!BASE) {
                    throw new Error("VITE_APP_KEY is not configured.");
                }

                const response = await axios.get(
                    apiUrl("reports/state/wise/sales/"),
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            Accept: "application/json",
                        },
                        params: {
                            start_date: filters.start_date,
                            end_date: filters.end_date,
                            family_id: filters.family_id,
                        },
                        signal: controller.signal,
                        timeout: 45000,
                    }
                );

                const payload = response.data;

                if (
                    !payload ||
                    !Array.isArray(payload.data) ||
                    !payload.summary ||
                    typeof payload.summary !== "object" ||
                    Array.isArray(payload.summary)
                ) {
                    throw new Error(
                        "Unexpected report API response."
                    );
                }

                if (!controller.signal.aborted) {
                    setReport(payload);
                }
            } catch (e) {
                if (!controller.signal.aborted) {
                    setError(
                        extractError(e, "Unable to load report.")
                    );
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        fetchReport();

        return () => controller.abort();
    }, [filters]);

    const rows = useMemo(
        () => orderedRows(report?.data || []),
        [report]
    );

    const totalBills = report
        ? Math.trunc(parseNumber(report.summary?.total_orders))
        : 0;

    const totalVolume = report
        ? parseNumber(report.summary?.total_volume)
        : 0;

    const selectedFamilyName =
        families.find(
            (f) => f.id === String(filters?.family_id)
        )?.name || "Select family";

    const apply = () => {
        if (!familyId) {
            setError("Please select a family.");
            return;
        }

        if (!startDate || !endDate) {
            setError("Please select both dates.");
            return;
        }

        if (startDate > endDate) {
            setError("End date cannot be before start date.");
            return;
        }

        setError("");

        setFilters({
            family_id: familyId,
            start_date: startDate,
            end_date: endDate,
        });
    };

    const reset = () => {
        setStartDate(firstDay());
        setEndDate(lastDay());
        setFamilyId("");
        setFilters(null);
        setReport(null);
        setError("");
    };


    const exportExcel = useCallback(() => {
        if (!report || loading || exporting || !filters) return;

        setExporting(true);

        try {
            // SAME DATA AS THE UI TABLE
            const excelData = [
                [selectedFamilyName.toUpperCase(), "", ""],
                ["STATE", "NO. OF BILLS", "VOLUME"],

                ...rows.map((row) => [
                    row.state_name,
                    row.order_count !== 0 ? row.order_count : "",
                    row.volume !== 0 ? row.volume : "",
                ]),

                ["TOTAL", totalBills, totalVolume],
            ];

            const worksheet = XLSX.utils.aoa_to_sheet(excelData);

            // MERGE FAMILY NAME ACROSS THREE COLUMNS
            worksheet["!merges"] = [
                {
                    s: { r: 0, c: 0 },
                    e: { r: 0, c: 2 },
                },
            ];

            // COLUMN WIDTHS
            worksheet["!cols"] = [
                { wch: 46 },
                { wch: 20 },
                { wch: 24 },
            ];

            // ROW HEIGHTS
            worksheet["!rows"] = excelData.map((_, index) => ({
                hpt: index === 0 ? 36 : index === 1 ? 30 : 24,
            }));

            // EXACT UI TABLE COLORS
            const COLORS = {
                header: "B8F4F8",
                green: "CFE2C2",
                blue: "DCE5F4",
                yellow: "FFFF00",
                red: "D00000",
                white: "FFFFFF",
                black: "000000",
                border: "344054",
            };

            const lastRowIndex = excelData.length - 1;

            const border = {
                top: {
                    style: "thin",
                    color: { rgb: COLORS.border },
                },
                bottom: {
                    style: "thin",
                    color: { rgb: COLORS.border },
                },
                left: {
                    style: "thin",
                    color: { rgb: COLORS.border },
                },
                right: {
                    style: "thin",
                    color: { rgb: COLORS.border },
                },
            };

            // APPLY STYLES TO EVERY CELL
            excelData.forEach((row, rowIndex) => {
                row.forEach((value, colIndex) => {
                    const cellAddress = XLSX.utils.encode_cell({
                        r: rowIndex,
                        c: colIndex,
                    });

                    // CREATE EMPTY CELLS FOR RED BACKGROUND
                    if (!worksheet[cellAddress]) {
                        worksheet[cellAddress] = {
                            t: "s",
                            v: "",
                        };
                    }

                    const cell = worksheet[cellAddress];

                    let backgroundColor = COLORS.header;
                    let fontColor = COLORS.black;

                    const isTitle = rowIndex === 0;
                    const isHeader = rowIndex === 1;
                    const isTotal = rowIndex === lastRowIndex;

                    if (isTitle || isHeader || isTotal) {
                        // FAMILY NAME, HEADINGS AND TOTAL ROW
                        backgroundColor = COLORS.header;
                    } else if (colIndex === 0) {
                        // STATE COLUMN: ALTERNATING GREEN AND BLUE
                        const stateIndex = rowIndex - 2;

                        backgroundColor =
                            stateIndex % 2 === 0
                                ? COLORS.green
                                : COLORS.blue;
                    } else {
                        // SAME YELLOW / RED LOGIC AS UI
                        const state = rows[rowIndex - 2];

                        const hasValue =
                            colIndex === 1
                                ? state.order_count !== 0
                                : state.volume !== 0;

                        backgroundColor = hasValue
                            ? COLORS.yellow
                            : COLORS.red;

                        fontColor = hasValue
                            ? COLORS.black
                            : COLORS.white;
                    }

                    cell.s = {
                        font: {
                            name: "Arial",
                            sz: isTitle ? 17 : 11,
                            bold: isTitle || isHeader || isTotal,
                            color: {
                                rgb: fontColor,
                            },
                        },

                        fill: {
                            patternType: "solid",
                            fgColor: {
                                rgb: backgroundColor,
                            },
                        },

                        alignment: {
                            horizontal: "center",
                            vertical: "center",
                            wrapText: true,
                        },

                        border,
                    };

                    // KEEP NUMERIC CELLS AS NUMBERS
                    if (typeof value === "number") {
                        cell.t = "n";
                        cell.v = value;

                        cell.z =
                            colIndex === 2
                                ? "#,##0.##"
                                : "#,##0";
                    }
                });
            });

            // CREATE WORKBOOK
            const workbook = XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(
                workbook,
                worksheet,
                "STATE WISE SALES"
            );

            // FILE NAME
            const safeFamilyName = selectedFamilyName.replace(
                /[^a-zA-Z0-9_-]/g,
                "_"
            );

            const fileName =
                `STATE_WISE_SALES_${safeFamilyName}_` +
                `${filters.start_date}_TO_${filters.end_date}.xlsx`;

            // DOWNLOAD EXCEL
            XLSX.writeFile(workbook, fileName, {
                bookType: "xlsx",
                cellStyles: true,
            });
        } catch (error) {
            console.error("Excel export failed:", error);

            setError(
                error.message || "Failed to export Excel."
            );
        } finally {
            setExporting(false);
        }
    }, [
        report,
        loading,
        exporting,
        filters,
        selectedFamilyName,
        rows,
        totalBills,
        totalVolume,
    ]);


    const panel = {
        border: "1px solid #E5EDF7",
        borderRadius: 16,
        boxShadow: "0 4px 16px rgba(15,23,42,.04)",
    };

    const input = {
        borderRadius: 10,
        minHeight: 42,
        fontSize: 13,
    };

    return (
        <Container
            fluid
            style={{
                padding: "24px",
                minHeight: "100vh",
                background: "#F7F9FD",
            }}
        >
            <div
                className="d-flex align-items-center justify-content-between flex-wrap mb-4"
                style={{ gap: 14 }}
            >
                <div
                    className="d-flex align-items-center"
                    style={{ gap: 12 }}
                >
                    <Button
                        onClick={() => navigate(-1)}
                        style={{
                            background: "white",
                            color: "#2878F4",
                            border: "1px solid #E2E8F0",
                            borderRadius: 10,
                        }}
                        aria-label="Go back"
                    >
                        <FaArrowLeft />
                    </Button>

                    <div>
                        <h4
                            style={{
                                margin: 0,
                                color: "#153A73",
                                fontWeight: 800,
                            }}
                        >
                            Statewise Sales Report Excel
                        </h4>

                        <small style={{ color: "#64748B" }}>
                            Family-wise state sales and Excel export
                        </small>
                    </div>
                </div>
            </div>

            <Card
                style={{
                    ...panel,
                    marginBottom: 20,
                }}
            >
                <CardBody style={{ padding: 20 }}>
                    <h6
                        style={{
                            color: "#153A73",
                            fontWeight: 800,
                            marginBottom: 18,
                        }}
                    >
                        <FaFilter
                            style={{
                                marginRight: 8,
                                color: "#2878F4",
                            }}
                        />
                        Filter Sales
                    </h6>


                    <Row className="g-3 align-items-end">
                        {/* FAMILY */}
                        <Col lg={3} md={6}>
                            <label
                                className="d-block mb-2"
                                style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                }}
                            >
                                Family
                            </label>

                            <Input
                                type="select"
                                value={familyId}
                                onChange={(e) => setFamilyId(e.target.value)}
                                disabled={familyLoading}
                                style={input}
                            >
                                <option value="">Select Family</option>

                                {families.map((f) => (
                                    <option key={f.id} value={f.id}>
                                        {f.name}
                                    </option>
                                ))}
                            </Input>
                        </Col>

                        {/* FROM DATE */}
                        <Col lg={3} md={6}>
                            <label
                                className="d-block mb-2"
                                style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                }}
                            >
                                From Date
                            </label>

                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                style={input}
                            />
                        </Col>

                        {/* TO DATE */}
                        <Col lg={3} md={6}>
                            <label
                                className="d-block mb-2"
                                style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                }}
                            >
                                To Date
                            </label>

                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                style={input}
                            />
                        </Col>

                        {/* ACTION BUTTONS */}
                        <Col lg={3} md={6}>
                            <div
                                className="d-flex align-items-center"
                                style={{
                                    gap: 8,
                                    width: "100%",
                                }}
                            >
                                {/* APPLY */}
                                <Button
                                    onClick={apply}
                                    disabled={loading || familyLoading}
                                    style={{
                                        background: "#2878F4",
                                        border: 0,
                                        borderRadius: 9,
                                        padding: "10px 14px",
                                        fontWeight: 700,
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    Apply
                                </Button>

                                {/* RESET */}
                                <Button
                                    onClick={reset}
                                    disabled={loading || familyLoading}
                                    title="Reset filters"
                                    style={{
                                        background: "#EDF3FC",
                                        color: "#2878F4",
                                        border: 0,
                                        borderRadius: 9,
                                        padding: "10px 12px",
                                        flexShrink: 0,
                                    }}
                                >
                                    <FaSyncAlt />
                                </Button>

                                {/* EXPORT EXCEL */}
                                <Button
                                    onClick={exportExcel}
                                    disabled={!report || loading || exporting}
                                    style={{
                                        background: "#16834A",
                                        border: 0,
                                        borderRadius: 9,
                                        padding: "10px 12px",
                                        fontWeight: 700,
                                        whiteSpace: "nowrap",
                                        flexShrink: 0,
                                    }}
                                >
                                    {exporting ? (
                                        <Spinner size="sm" />
                                    ) : (
                                        <FaFileExcel
                                            style={{ marginRight: 6 }}
                                        />
                                    )}
                                    {" "}Export Excel
                                </Button>
                            </div>
                        </Col>
                    </Row>

                </CardBody>
            </Card>

            {error && (
                <div
                    role="alert"
                    style={{
                        padding: 14,
                        borderRadius: 10,
                        background: "#FEF2F2",
                        color: "#B91C1C",
                        marginBottom: 18,
                    }}
                >
                    {error}
                </div>
            )}

            <Row className="g-3 mb-4">
                {[
                    {
                        label: "Total Bills",
                        value: fmt(totalBills),
                    },
                    {
                        label: "Total Volume",
                        value: fmt(totalVolume),
                    },
                ].map((s) => (
                    <Col md={6} key={s.label}>
                        <div
                            style={{
                                background:
                                    "linear-gradient(120deg,#4BA3FA,#2878F4)",
                                borderRadius: 15,
                                padding: 20,
                                color: "white",
                            }}
                        >
                            <div
                                style={{
                                    opacity: 0.9,
                                    fontSize: 13,
                                }}
                            >
                                <FaChartBar
                                    style={{
                                        marginRight: 8,
                                    }}
                                />
                                {s.label}
                            </div>

                            <div
                                style={{
                                    fontSize: 28,
                                    fontWeight: 800,
                                    marginTop: 8,
                                }}
                            >
                                {loading ? "..." : s.value}
                            </div>
                        </div>
                    </Col>
                ))}
            </Row>

            <Card style={panel}>
                <CardBody style={{ padding: 20 }}>
                    <div
                        className="d-flex justify-content-between align-items-center flex-wrap mb-3"
                        style={{ gap: 10 }}
                    >
                        <div>
                            <h5
                                style={{
                                    color: "#153A73",
                                    fontWeight: 800,
                                    marginBottom: 3,
                                }}
                            >
                                {selectedFamilyName.toUpperCase()}
                            </h5>

                            <small
                                style={{
                                    color: "#64748B",
                                }}
                            >
                                {filters
                                    ? `${filters.start_date} to ${filters.end_date}`
                                    : "Select a family and dates"}
                            </small>
                        </div>
                    </div>

                    {loading || familyLoading ? (
                        <div className="text-center p-5">
                            <Spinner color="primary" />

                            <div className="mt-2">
                                Loading report...
                            </div>
                        </div>
                    ) : !report ? (
                        <div
                            className="text-center p-5"
                            style={{
                                color: "#64748B",
                            }}
                        >
                            No report loaded.
                        </div>
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <table
                                style={{
                                    width: "100%",
                                    borderCollapse: "collapse",
                                    minWidth: 480,
                                    textAlign: "center",
                                    fontSize: 13,
                                }}
                            >
                                <thead>
                                    <tr
                                        style={{
                                            background: "#B8F4F8",
                                        }}
                                    >
                                        {[
                                            "STATE",
                                            "NO. OF BILLS",
                                            "VOLUME",
                                        ].map((h) => (
                                            <th
                                                key={h}
                                                style={{
                                                    border:
                                                        "1px solid #344054",
                                                    padding: 12,
                                                }}
                                            >
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>

                                <tbody>
                                    {rows.map((r, i) => (
                                        <tr key={r.state_name}>
                                            <td
                                                style={{
                                                    border:
                                                        "1px solid #344054",
                                                    padding:
                                                        "7px 12px",
                                                    background:
                                                        i % 2 === 0
                                                            ? "#CFE2C2"
                                                            : "#DCE5F4",
                                                }}
                                            >
                                                {r.state_name}
                                            </td>

                                            <td
                                                style={{
                                                    border:
                                                        "1px solid #344054",
                                                    background:
                                                        r.order_count !== 0
                                                            ? "#FFFF00"
                                                            : "#D00000",
                                                    color:
                                                        r.order_count !== 0
                                                            ? "#000000"
                                                            : "#FFFFFF",
                                                }}
                                            >
                                                {r.order_count !== 0
                                                    ? r.order_count
                                                    : ""}
                                            </td>

                                            <td
                                                style={{
                                                    border:
                                                        "1px solid #344054",
                                                    background:
                                                        r.volume !== 0
                                                            ? "#FFFF00"
                                                            : "#D00000",
                                                    color:
                                                        r.volume !== 0
                                                            ? "#000000"
                                                            : "#FFFFFF",
                                                }}
                                            >
                                                {r.volume !== 0
                                                    ? fmt(r.volume)
                                                    : ""}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>

                                <tfoot>
                                    <tr
                                        style={{
                                            background: "#B8F4F8",
                                            fontWeight: 800,
                                        }}
                                    >
                                        <td
                                            style={{
                                                border:
                                                    "1px solid #344054",
                                                padding: 12,
                                            }}
                                        >
                                            TOTAL
                                        </td>

                                        <td
                                            style={{
                                                border:
                                                    "1px solid #344054",
                                            }}
                                        >
                                            {fmt(totalBills)}
                                        </td>

                                        <td
                                            style={{
                                                border:
                                                    "1px solid #344054",
                                            }}
                                        >
                                            {fmt(totalVolume)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </CardBody>
            </Card>
        </Container>
    );
};

export default StatewiseSalesReportExcelPage;
