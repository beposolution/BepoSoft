import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import * as XLSX from "xlsx-js-style";
import { useMemo } from "react";

const Movement = () => {
    const { id } = useParams();
    const [data, setData] = useState([]);
    const [parcelServices, setParcelServices] = useState([]);
    const [parcelCounts, setParcelCounts] = useState({});
    const [parcelInvoiceCounts, setParcelInvoiceCounts] = useState({});
    const token = localStorage.getItem("token");
    const [userData, setUserData] = useState();
    const [isVerified, setIsVerified] = useState(false);
    const [checkedBy, setCheckedBy] = useState("");
    const [codCount, setCodCount] = useState(0);
    const [parcelAmounts, setParcelAmounts] = useState({});
    const [parcelActualWeights, setParcelActualWeights] = useState({});
    const [codParcelAmount, setCodParcelAmount] = useState(0);
    const [codActualWeightG, setCodActualWeightG] = useState(0);


    const roundRupee = (value) => {
        return Math.round(Number(value || 0));
    };

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}profile/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUserData(response?.data?.data?.id);
            } catch (error) {
                toast.error('Error fetching user data:', error);
            }
        };
        fetchUserData();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            if (id) {
                try {
                    const response = await axios.get(
                        `${import.meta.env.VITE_APP_KEY}warehousesdataget/${id}/`,
                        {
                            headers: { Authorization: `Bearer ${token}` },
                        }
                    );
                    setData(response.data.results);

                    // Check if any warehouse is already verified (checked_by exists)
                    let foundCheckedBy = "";
                    response.data.results.forEach(category => {
                        category.orders.forEach(order => {

                            order.warehouses.forEach(warehouse => {
                                if (warehouse.box) boxTotal += 1;

                                weightTotal += parseFloat(warehouse.weight || 0);
                                actualWeightTotal += parseFloat(warehouse.actual_weight || 0);
                                parcelAmountTotal += parseFloat(warehouse.parcel_amount || 0);

                                if (warehouse.length && warehouse.breadth && warehouse.height) {
                                    volumeTotal +=
                                        (warehouse.length * warehouse.breadth * warehouse.height) / 6000;
                                }
                            });
                        });
                    });
                    if (foundCheckedBy) {
                        setIsVerified(true);
                        setCheckedBy(foundCheckedBy);
                    } else {
                        setIsVerified(false);
                        setCheckedBy("");
                    }
                } catch (error) {
                    toast.error("Error fetching data:", error);
                }
            }
        };
        fetchData();
    }, [id]);

    useEffect(() => {
        axios
            .get(`${import.meta.env.VITE_APP_KEY}parcal/service/`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((response) => {
                setParcelServices(response.data.data);
            })
            .catch((error) => {
                toast.error("Error fetching parcel services:", error);
            });
    }, [token]);


    const verifyButton = async () => {
        if (!id) {
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
            return;
        }

        if (!userData) {
            toast.error("User ID not found");
            return;
        }

        try {
            const response = await axios.put(
                `${import.meta.env.VITE_APP_IMAGE}/warehouse/update-checked-by/${id}/`,
                { checked_by: userData },
                {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                    },
                    withCredentials: true,
                }
            );
            toast.success("Successfully verified");
            // After successful verification, fetch data again to update checked_by
            setIsVerified(true);
            // Try to get the user's name from the data or just show userData (id)
            // If your API returns the name, you can set it here, otherwise fallback to id
            setCheckedBy(response?.data?.checked_by);
        } catch (error) {
            toast.error("Failed to verify");
        }
    };

    useEffect(() => {
        const countParcels = {};
        const totalAmounts = {};
        const totalActualWeights = {};
        const invoiceSets = {};
        let codOrderCount = 0;

        // NEW: COD totals
        let codAmtSum = 0;       // ₹
        let codActualWSumG = 0;  // grams

        data.forEach((category) => {
            category.orders.forEach((order) => {
                const isCOD = order.cod_amount && parseFloat(order.cod_amount) > 0;
                if (isCOD) codOrderCount += 1;

                order.warehouses.forEach((warehouse) => {
                    const serviceName = warehouse.parcel_service_name;
                    if (!serviceName) return;

                    if (!invoiceSets[serviceName]) {
                        invoiceSets[serviceName] = new Set();
                    }

                    const invoiceKey = order.invoice_id ?? order.invoice;

                    if (invoiceKey != null && invoiceKey !== "") {
                        invoiceSets[serviceName].add(String(invoiceKey));
                    }

                    countParcels[serviceName] = (countParcels[serviceName] || 0) + 1;
                    totalAmounts[serviceName] =
                        (totalAmounts[serviceName] || 0) + parseFloat(warehouse.parcel_amount || 0);

                    totalActualWeights[serviceName] =
                        (totalActualWeights[serviceName] || 0) + parseFloat(warehouse.actual_weight || 0);

                    // NEW: If this order is COD, add this warehouse’s amounts/weights to COD totals
                    if (isCOD) {
                        codAmtSum += parseFloat(warehouse.parcel_amount || 0);
                        codActualWSumG += parseFloat(warehouse.actual_weight || 0);
                    }
                });
            });
        });

        setParcelCounts(countParcels);
        setParcelAmounts(totalAmounts);
        setParcelInvoiceCounts(
            Object.fromEntries(
                Object.entries(invoiceSets).map(([service, invoices]) => [
                    service,
                    invoices.size,
                ])
            )
        );
        setParcelActualWeights(totalActualWeights);
        setCodCount(codOrderCount);

        // NEW: persist COD totals
        setCodParcelAmount(codAmtSum);
        setCodActualWeightG(codActualWSumG);
    }, [data]);

    const totalUniqueInvoices = useMemo(() => {
        const invoices = new Set();

        data.forEach((category) => {
            (category.orders || []).forEach((order) => {
                const hasParcelService = (order.warehouses || []).some(
                    (warehouse) => warehouse.parcel_service_name
                );

                const invoiceKey = order.invoice_id ?? order.invoice;

                if (hasParcelService && invoiceKey != null && invoiceKey !== "") {
                    invoices.add(String(invoiceKey));
                }
            });
        });

        return invoices.size;
    }, [data]);

    const totalCODInvoices = useMemo(() => {
        const invoices = new Set();

        data.forEach((category) => {
            (category.orders || []).forEach((order) => {
                const isCOD = Number(order.cod_amount || 0) > 0;

                const hasCODService = (order.warehouses || []).some(
                    (warehouse) =>
                        (warehouse.parcel_service_name || "")
                            .trim()
                            .toUpperCase()
                            .includes("COD")
                );

                const invoiceKey = order.invoice_id ?? order.invoice;

                if (
                    isCOD &&
                    hasCODService &&
                    invoiceKey != null &&
                    invoiceKey !== ""
                ) {
                    invoices.add(String(invoiceKey));
                }
            });
        });

        return invoices.size;
    }, [data]);

    const codActualWeightKg = useMemo(
        () => codActualWeightG / 1000,
        [codActualWeightG]
    );

    const codAverage = useMemo(
        () => (codActualWeightKg > 0 ? codParcelAmount / codActualWeightKg : 0),
        [codParcelAmount, codActualWeightKg]
    );

    const codRollup = useMemo(() => {
        let boxes = 0;
        let amount = 0;
        let weightG = 0;

        Object.keys(parcelCounts).forEach((name) => {
            const norm = (name || '').trim().toUpperCase();
            if (norm.includes('COD')) {
                boxes += parcelCounts[name] || 0;
                amount = +(amount + (parcelAmounts[name] || 0)).toFixed(2);
                weightG += parcelActualWeights[name] || 0;
            }
        });

        const weightKg = weightG / 1000;
        const avg = weightKg > 0 ? amount / weightKg : 0;

        return { boxes, amount, weightG, weightKg, avg };
    }, [parcelCounts, parcelAmounts, parcelActualWeights]);

    const {
        totalParcelAmountAllServices,
        totalActualWeightAllServices, // in grams
        globalAverageAllServices      // ₹ per kg (weighted)
    } = useMemo(() => {
        const amt = Object.values(parcelAmounts).reduce((s, v) => s + (+v || 0), 0);
        const wtG = Object.values(parcelActualWeights).reduce((s, v) => s + (+v || 0), 0);
        const wtKg = wtG / 1000;
        const avg = wtKg > 0 ? amt / wtKg : 0; // ₹/kg
        return {
            totalParcelAmountAllServices: amt,
            totalActualWeightAllServices: wtG, // grams
            globalAverageAllServices: avg
        };
    }, [parcelAmounts, parcelActualWeights]);

    const totalActualWeightAllServicesKg = useMemo(
        () => totalActualWeightAllServices / 1000,
        [totalActualWeightAllServices]
    );

    const serviceAverages = useMemo(() => {
        return Object.entries(parcelCounts).map(([serviceName, count]) => {
            const amount = parcelAmounts[serviceName] || 0;
            const actualW = parcelActualWeights[serviceName] || 0;
            const actualKg = actualW / 1000;
            const avg = actualKg > 0 ? amount / actualKg : 0;
            return { serviceName, count, amount, actualW, avg };
        });
    }, [parcelCounts, parcelAmounts, parcelActualWeights]);

    const overallAverageAllServices = useMemo(() => {
        return totalParcelAmountAllServices / totalActualWeightAllServicesKg;
    }, [totalParcelAmountAllServices, totalActualWeightAllServicesKg]);

    const aggregatedParcelCounts = {
        BEPARCEL: (parcelCounts['BEPARCEL'] || 0) + (parcelCounts['BEPARCEL COD'] || 0),
        SPEED: (parcelCounts['SPEED POST'] || 0) + (parcelCounts['SPEED COD'] || 0),
    };

    const aggregatedParcelAmounts = {
        BEPARCEL: (parcelAmounts['BEPARCEL'] || 0) + (parcelAmounts['BEPARCEL COD'] || 0),
        SPEED: (parcelAmounts['SPEED POST'] || 0) + (parcelAmounts['SPEED COD'] || 0),
    };

    const getRoundedCODSplit = (order) => {
        const total = parseFloat(order.cod_amount || 0);

        // Use box_count only if it is > 0
        const boxes =
            order.box_count && Number(order.box_count) > 0
                ? Number(order.box_count)
                : (order.warehouses?.length || 0);

        if (total <= 0 || boxes === 0) return [];

        // Equal split rounded DOWN to 2 decimals
        const base = Math.floor((total / boxes) * 100) / 100;
        const arr = Array(boxes).fill(base);

        // Adjust rounding difference in last box
        const diff = +(total - base * boxes).toFixed(2);
        arr[boxes - 1] = +(arr[boxes - 1] + diff).toFixed(2);

        return arr;
    };

    const exportToExcel = () => {
        const wb = XLSX.utils.book_new();
        const wsData = [];
        const merges = [];
        const styles = {};
        const rowHeights = {};

        // ======================================================
        // COLORS - MATCH PDF PRINT COLORS
        // ======================================================

        const COLORS = {
            yellow: "FFEB3B",
            turquoise: "40E0D0",
            red: "FF0000",
            white: "FFFFFF",
            black: "000000",
        };

        const HEADERS = [
            "SL No",
            "Invoice No",
            "Customer",
            "Phone",
            "State",
            "Pincode",
            "Box",
            "COD (₹)",
            "Weight (gram)",
            "Length (cm)",
            "Breadth (cm)",
            "Height (cm)",
            "Volume (cm³)",
            "Actual Weight (gram)",
            "Parcel Amount (₹)",
            "Tracking ID",
            "Parcel Service",
            "Packed By",
            "Verified By",
        ];

        const border = {
            top: { style: "thin", color: { rgb: COLORS.black } },
            bottom: { style: "thin", color: { rgb: COLORS.black } },
            left: { style: "thin", color: { rgb: COLORS.black } },
            right: { style: "thin", color: { rgb: COLORS.black } },
        };

        const makeStyle = (
            bg = COLORS.white,
            fontColor = COLORS.black,
            bold = false,
            align = "center"
        ) => ({
            fill: {
                patternType: "solid",
                fgColor: { rgb: bg },
            },
            font: {
                name: "Arial",
                sz: 10,
                bold,
                color: { rgb: fontColor },
            },
            alignment: {
                horizontal: align,
                vertical: "center",
                wrapText: true,
            },
            border,
        });

        const setStyle = (row, col, style) => {
            styles[`${row}:${col}`] = style;
        };

        const addRow = (values = [], height = 25) => {
            const row = wsData.length;
            wsData.push(values);
            rowHeights[row] = height;
            return row;
        };

        const addMergedCell = (
            row,
            startCol,
            endCol,
            value,
            bg = COLORS.white,
            fontColor = COLORS.black,
            bold = true
        ) => {
            while (wsData[row].length <= endCol) {
                wsData[row].push("");
            }

            wsData[row][startCol] = value;

            if (endCol > startCol) {
                merges.push({
                    s: { r: row, c: startCol },
                    e: { r: row, c: endCol },
                });
            }

            for (let col = startCol; col <= endCol; col++) {
                setStyle(
                    row,
                    col,
                    makeStyle(bg, fontColor, bold)
                );
            }
        };

        const addMergedTitle = (
            title,
            bg = COLORS.yellow,
            fontColor = COLORS.black,
            endCol = 18
        ) => {
            const row = addRow([], 30);

            addMergedCell(
                row,
                0,
                endCol,
                title,
                bg,
                fontColor,
                true
            );

            return row;
        };

        const toNumber = (value) => {
            const num = Number(value);
            return Number.isFinite(num) ? num : 0;
        };

        const round2 = (value) =>
            Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;

        // ======================================================
        // MAIN TITLE
        // ======================================================

        addMergedTitle(
            `DAILY GOODS MOVEMENT (DGM) ON ${id}`,
            COLORS.yellow
        );

        addRow([], 12);

        // ======================================================
        // FAMILY-WISE MOVEMENT DETAILS
        // ======================================================

        data.forEach((category) => {
            addMergedTitle(
                `${String(category.family || "").toUpperCase()} FAMILY`,
                COLORS.yellow
            );

            const headerRow = addRow(HEADERS, 42);

            HEADERS.forEach((_, col) => {
                setStyle(
                    headerRow,
                    col,
                    makeStyle(
                        col === 7 ? COLORS.yellow : COLORS.turquoise,
                        COLORS.black,
                        true
                    )
                );
            });

            let serialNo = 1;
            let boxTotal = 0;
            let codTotal = 0;
            let weightTotal = 0;
            let volumeTotal = 0;
            let actualWeightTotal = 0;
            let parcelAmountTotal = 0;

            (category.orders || []).forEach((order) => {
                const codSplit = getRoundedCODSplit(order);

                codSplit.forEach((value) => {
                    codTotal = round2(codTotal + toNumber(value));
                });

                (order.warehouses || []).forEach((warehouse, idx) => {
                    const hasDimensions =
                        warehouse.length &&
                        warehouse.breadth &&
                        warehouse.height;

                    const volumeWeight = hasDimensions
                        ? (
                            toNumber(warehouse.length) *
                            toNumber(warehouse.breadth) *
                            toNumber(warehouse.height)
                        ) / 6000
                        : 0;

                    const row = addRow(
                        [
                            serialNo++,
                            order.invoice || "",
                            warehouse.customer || "",
                            warehouse.phone == null
                                ? ""
                                : String(warehouse.phone),
                            warehouse.order_state || "",
                            warehouse.zip_code == null
                                ? ""
                                : String(warehouse.zip_code),
                            warehouse.box ?? "",
                            roundRupee(codSplit[idx] || 0),
                            toNumber(warehouse.weight),
                            warehouse.length ?? "",
                            warehouse.breadth ?? "",
                            warehouse.height ?? "",
                            hasDimensions
                                ? round2(volumeWeight)
                                : "N/A",
                            toNumber(warehouse.actual_weight),
                            toNumber(warehouse.parcel_amount),
                            warehouse.tracking_id || "",
                            warehouse.parcel_service_name || "Unknown",
                            warehouse.packed_by || "",
                            warehouse.verified_by || "N/A",
                        ],
                        32
                    );

                    for (let col = 0; col < 19; col++) {
                        setStyle(
                            row,
                            col,
                            makeStyle(
                                col === 7 ? COLORS.yellow : COLORS.white,
                                COLORS.black,
                                true
                            )
                        );
                    }

                    if (warehouse.box) {
                        boxTotal++;
                    }

                    weightTotal += toNumber(warehouse.weight);
                    volumeTotal += volumeWeight;
                    actualWeightTotal += toNumber(warehouse.actual_weight);
                    parcelAmountTotal += toNumber(warehouse.parcel_amount);
                });
            });

            // FAMILY TOTAL ROW

            const totalRow = addRow([], 30);

            addMergedCell(
                totalRow,
                0,
                5,
                "TOTAL",
                COLORS.yellow,
                COLORS.red
            );

            const totalValues = {
                6: boxTotal,
                7: roundRupee(codTotal),
                8: weightTotal,
                12: round2(volumeTotal),
                13: actualWeightTotal,
                14: round2(parcelAmountTotal),
            };

            for (let col = 6; col < 19; col++) {
                while (wsData[totalRow].length <= col) {
                    wsData[totalRow].push("");
                }

                wsData[totalRow][col] = totalValues[col] ?? "";

                setStyle(
                    totalRow,
                    col,
                    makeStyle(COLORS.yellow, COLORS.red, true)
                );
            }

            addRow([], 12);
            addRow([], 12);
        });

        // ======================================================
        // PARCEL SERVICE TOTAL - EXPANDED TABLE
        // ======================================================

        addMergedTitle(
            "PARCEL SERVICE TOTAL",
            COLORS.yellow,
            COLORS.black,
            13
        );

        const addParcelSummaryRow = (
            values,
            bg = COLORS.white,
            fontColor = COLORS.black,
            height = 30
        ) => {
            const row = addRow([], height);

            addMergedCell(row, 0, 2, values[0], bg, fontColor);
            addMergedCell(row, 3, 4, values[1], bg, fontColor);
            addMergedCell(row, 5, 6, values[2], bg, fontColor);
            addMergedCell(row, 7, 9, values[3], bg, fontColor);
            addMergedCell(row, 10, 11, values[4], bg, fontColor);
            addMergedCell(row, 12, 13, values[5], bg, fontColor);

            return row;
        };

        addParcelSummaryRow(
            [
                "Parcel Service",
                "Total Invoices",
                "Total Box",
                "Total Parcel Amount (₹)",
                "Total Actual Weight (kg)",
                "Average (₹/kg)",
            ],
            COLORS.turquoise,
            COLORS.black,
            38
        );

        Object.entries(parcelCounts).forEach(
            ([serviceName, count]) => {
                const amount = toNumber(
                    parcelAmounts[serviceName]
                );

                const actualWeightKg =
                    toNumber(parcelActualWeights[serviceName]) / 1000;

                const average =
                    actualWeightKg > 0
                        ? amount / actualWeightKg
                        : 0;

                addParcelSummaryRow([
                    serviceName,
                    parcelInvoiceCounts[serviceName] || 0,
                    count,
                    round2(amount),
                    round2(actualWeightKg),
                    round2(average),
                ]);
            }
        );

        const totalBoxes = Object.values(parcelCounts).reduce(
            (sum, value) => sum + toNumber(value),
            0
        );

        const overallAverage =
            totalActualWeightAllServicesKg > 0
                ? totalParcelAmountAllServices /
                totalActualWeightAllServicesKg
                : 0;

        addParcelSummaryRow(
            [
                "TOTAL",
                totalUniqueInvoices,
                totalBoxes,
                round2(totalParcelAmountAllServices),
                round2(totalActualWeightAllServicesKg),
                round2(overallAverage),
            ],
            COLORS.red,
            COLORS.white
        );

        addParcelSummaryRow(
            [
                "TOTAL COD ORDERS",
                totalCODInvoices,
                codRollup.boxes,
                roundRupee(codRollup.amount),
                round2(codRollup.weightKg),
                round2(codRollup.avg),
            ],
            COLORS.red,
            COLORS.white
        );

        addRow([], 12);
        addRow([], 12);

        // ======================================================
        // PARCEL COUNT SUMMARY - EXPANDED TABLE
        // ======================================================

        addMergedTitle(
            "PARCEL COUNT SUMMARY",
            COLORS.yellow,
            COLORS.black,
            6
        );

        const addTwoColumnSummary = (
            label,
            value,
            bg,
            height = 30
        ) => {
            const row = addRow([], height);

            const fontColor =
                bg === COLORS.red
                    ? COLORS.white
                    : COLORS.black;

            addMergedCell(
                row,
                0,
                3,
                label,
                bg,
                fontColor
            );

            addMergedCell(
                row,
                4,
                6,
                value,
                bg,
                fontColor
            );

            return row;
        };

        addTwoColumnSummary(
            "Parcel Service",
            "Total Count",
            COLORS.turquoise,
            35
        );

        addTwoColumnSummary(
            "BEPARCEL",
            aggregatedParcelCounts.BEPARCEL,
            COLORS.yellow
        );

        addTwoColumnSummary(
            "SPEED",
            aggregatedParcelCounts.SPEED,
            COLORS.turquoise
        );

        addTwoColumnSummary(
            "TOTAL",
            aggregatedParcelCounts.BEPARCEL +
            aggregatedParcelCounts.SPEED,
            COLORS.red
        );

        addRow([], 12);
        addRow([], 12);

        // ======================================================
        // PARCEL AMOUNT SUMMARY - EXPANDED TABLE
        // ======================================================

        addMergedTitle(
            "PARCEL AMOUNT SUMMARY",
            COLORS.yellow,
            COLORS.black,
            6
        );

        addTwoColumnSummary(
            "Parcel Service",
            "Total Parcel Amount (₹)",
            COLORS.turquoise,
            35
        );

        addTwoColumnSummary(
            "BEPARCEL AMOUNT",
            round2(aggregatedParcelAmounts.BEPARCEL),
            COLORS.yellow
        );

        addTwoColumnSummary(
            "SPEED AMOUNT",
            round2(aggregatedParcelAmounts.SPEED),
            COLORS.turquoise
        );

        addTwoColumnSummary(
            "TOTAL",
            round2(
                aggregatedParcelAmounts.BEPARCEL +
                aggregatedParcelAmounts.SPEED
            ),
            COLORS.red
        );

        addRow([], 12);
        addRow([], 12);

        // ======================================================
        // FINAL CONFIRMATION
        // ======================================================

        addMergedTitle(
            isVerified
                ? `Final Confirmation by: ${checkedBy || "N/A"}`
                : "Final Confirmation: Pending",
            COLORS.turquoise
        );

        // ======================================================
        // CREATE WORKSHEET
        // ======================================================

        const ws = XLSX.utils.aoa_to_sheet(wsData);

        ws["!merges"] = merges;

        ws["!cols"] = [
            { wch: 12 },
            { wch: 18 },
            { wch: 28 },
            { wch: 18 },
            { wch: 20 },
            { wch: 14 },
            { wch: 12 },
            { wch: 16 },
            { wch: 18 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 },
            { wch: 18 },
            { wch: 23 },
            { wch: 22 },
            { wch: 25 },
            { wch: 28 },
            { wch: 22 },
            { wch: 22 },
        ];

        ws["!rows"] = wsData.map((_, row) => ({
            hpt: rowHeights[row] || 25,
        }));

        // ======================================================
        // APPLY ALL STYLES
        // ======================================================

        Object.entries(styles).forEach(([key, style]) => {
            const [r, c] = key.split(":").map(Number);

            const cellAddress = XLSX.utils.encode_cell({
                r,
                c,
            });

            if (!ws[cellAddress]) {
                ws[cellAddress] = {
                    t: "s",
                    v: "",
                };
            }

            ws[cellAddress].s = style;
        });

        // ======================================================
        // NUMBER FORMATTING
        // ======================================================

        wsData.forEach((row, r) => {
            row.forEach((value, c) => {
                const cellAddress = XLSX.utils.encode_cell({
                    r,
                    c,
                });

                const cell = ws[cellAddress];

                if (!cell) return;

                if (typeof cell.v === "number") {
                    if ([7, 14].includes(c)) {
                        cell.z = '"₹"#,##0.00';
                    } else if ([8, 12, 13].includes(c)) {
                        cell.z = "#,##0.00";
                    }
                }
            });
        });

        // ======================================================
        // PRINT MARGINS
        // ======================================================

        ws["!margins"] = {
            left: 0.25,
            right: 0.25,
            top: 0.5,
            bottom: 0.5,
            header: 0.2,
            footer: 0.2,
        };

        // ======================================================
        // EXPORT SINGLE EXCEL WORKSHEET
        // ======================================================

        XLSX.utils.book_append_sheet(
            wb,
            ws,
            "DGM Report"
        );

        XLSX.writeFile(
            wb,
            `DGM_Report_${id}.xlsx`
        );
    };

    return (
        <div style={{ padding: "20px", overflow: "auto", maxHeight: "90vh" }}>
            <style>
                {`
                td.cod-column, th.cod-column { background-color: #ffeb3b !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    .volume-col {
                    width: 80px !important;
                    max-width: 80px;
                    text-align: center;
                    white-space: nowrap;
                    }
                    @media print {
                            body * {
                            visibility: hidden;
                        }

                        .print-section, .print-section * {
                            visibility: visible;
                        }
                        .family-title {
                            // width: 200px !important;         
                            margin: auto !important;   
                            padding: 6px !important;  
                            font-size: 12px !important;
                            background-color: #ffeb3b !important;
                            color: black !important;
                            text-align: center !important;
                            border-radius: 4px !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }

                        .print-section {
                            position: absolute;
                            top: 0;
                            left: 0;
                            width: 100%;
                            font-size: 10px;
                            color: black;
                        }

                        .cod-column{
                            background-color: #ffeb3b !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }

                        .total-row{
                            background-color: #ffeb3b !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        .total-row2{
                            background-color: #40E0D0  !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        .total-row1{
                            background-color: red !important;
                            color: white !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        .small-col {
                            width: 60px !important;
                            min-width: 60px !important;
                            max-width: 60px !important;
                            font-size: 10px !important;
                            word-break: break-word !important;
                        }

                        table, th, td, tr {
                            border: 1px solid black !important;
                            border-collapse: collapse !important;
                        }

                        tr {
                            page-break-inside: avoid;
                        }

                        th, td {
                            padding: 4px;
                            word-break: break-word;
                        }

                        thead.printdata-header {
                            background-color: #40E0D0 !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                            color: black !important;
                        }

                        .print-header {
                            background-color: #ffeb3b !important;
                            color: black !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }

                        button, .no-print {
                            display: none !important;
                        }
                    }
                `}
            </style>
            <div style={{ marginTop: "3rem", display: "flex", justifyContent: "flex-end", padding: "10px" }}>
                <button
                    onClick={exportToExcel}
                    style={{
                        padding: "10px 20px",
                        fontSize: "16px",
                        cursor: "pointer",
                        border: "none",
                        background: "#007bff",
                        color: "white"
                    }}
                >
                    Export to Excel
                </button>
                <button
                    onClick={() => window.print()}
                    style={{
                        padding: "10px 20px",
                        fontSize: "16px",
                        cursor: "pointer",
                        border: "none",
                        background: "#4CAF50",
                        color: "white",
                        // marginBottom: "10px"
                    }}
                >
                    Print PDF
                </button>
            </div>
            <div className="print-section">
                <h3
                    className="main-title"
                    style={{
                        marginTop: "2rem",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center"
                    }}
                >
                    DAILY GOODS MOVEMENT (DGM) ON {id}
                </h3>
                {data.map((category, index) => {
                    let boxTotal = 0;
                    let codTotal = 0;
                    let weightTotal = 0;
                    let volumeTotal = 0;
                    let actualWeightTotal = 0;
                    let parcelAmountTotal = 0;

                    category.orders.forEach(order => {
                        const codSplit = getRoundedCODSplit(order);

                        // TOTAL COD = sum of split values
                        codSplit.forEach(v => {
                            codTotal = +(codTotal + v).toFixed(2);
                        });

                        order.warehouses.forEach(warehouse => {
                            if (warehouse.box) boxTotal += 1;

                            weightTotal += parseFloat(warehouse.weight || 0);
                            actualWeightTotal += parseFloat(warehouse.actual_weight || 0);
                            parcelAmountTotal += parseFloat(warehouse.parcel_amount || 0);

                            if (warehouse.length && warehouse.breadth && warehouse.height) {
                                volumeTotal +=
                                    (warehouse.length * warehouse.breadth * warehouse.height) / 6000;
                            }
                        });
                    });
                    return (
                        <div key={index} style={{ marginBottom: "30px" }}>
                            <h4
                                className="print-header family-title"
                                style={{
                                    backgroundColor: "#4CAF50", // used only for screen
                                    color: "white",
                                    padding: "10px",
                                    borderRadius: "5px",
                                    textAlign: "center"
                                }}
                            >
                                {category.family?.toUpperCase()}
                            </h4>
                            <table
                                border="1"
                                cellPadding="5"
                                style={{
                                    width: "100%",
                                    borderCollapse: "collapse",
                                    textAlign: "left",
                                    border: "1px solid black"
                                }}
                            >
                                <thead className="printdata-header">
                                    <tr>
                                        <th style={{ border: "1px solid black" }}>SL No</th>
                                        <th style={{ border: "1px solid black" }}>Invoice No</th>
                                        <th style={{ border: "1px solid black" }}>Customer</th>
                                        <th style={{ border: "1px solid black" }}>Phone</th>
                                        <th style={{ border: "1px solid black" }}>State</th>
                                        <th style={{ border: "1px solid black" }}>Pincode</th>
                                        <th style={{ border: "1px solid black" }}>Box</th>
                                        <th className="cod-column" style={{ border: "1px solid black", backgroundColor: "#ffeb3b" }}>COD (₹)</th>
                                        <th className="small-col" style={{ border: "1px solid black" }}>Weight (gram)</th>
                                        <th style={{ border: "1px solid black" }}>Length (cm)</th>
                                        <th style={{ border: "1px solid black" }}>Breadth (cm)</th>
                                        <th style={{ border: "1px solid black" }}>Height (cm)</th>
                                        <th className="volume-col small-col" style={{ border: "1px solid black" }}>Volume<br /> (cm³)</th>
                                        {/* <th>Shipped Date</th> */}
                                        <th className="small-col" style={{ border: "1px solid black" }}>Actual Weight (gram)</th>
                                        <th style={{ border: "1px solid black" }}>Parcel Amount (₹)</th>
                                        <th style={{ border: "1px solid black" }}>Tracking ID</th>
                                        {/* <th>Post Office Date</th> */}
                                        <th style={{ border: "1px solid black" }}>Parcel Service</th>
                                        <th style={{ border: "1px solid black" }}>Packed By</th>
                                        <th style={{ border: "1px solid black" }}>Verified By</th>
                                        {/* <th style={{ border: "1px solid black" }}>Final Conformation</th> */}
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        let serialNo = 1; // RESET ONCE PER FAMILY

                                        return category.orders.map(order => {
                                            const codSplit = getRoundedCODSplit(order);

                                            return order.warehouses.map((warehouse, idx) => (
                                                <tr key={`${order.invoice}-${idx}`}>
                                                    <td style={{ border: "1px solid black" }}>{serialNo++}</td>

                                                    <td style={{ border: "1px solid black" }}>
                                                        <strong>{order.invoice}</strong>
                                                    </td>
                                                    <td style={{ border: "1px solid black" }}>
                                                        <strong>{warehouse.customer}</strong>
                                                    </td>
                                                    <td style={{ border: "1px solid black" }}>
                                                        <strong>{warehouse.phone}</strong>
                                                    </td>
                                                    <td style={{ border: "1px solid black" }}>
                                                        <strong>{warehouse.order_state}</strong>
                                                    </td>
                                                    <td style={{ border: "1px solid black" }}>
                                                        <strong>{warehouse.zip_code}</strong>
                                                    </td>
                                                    <td style={{ border: "1px solid black" }}>
                                                        <strong>{warehouse.box}</strong>
                                                    </td>
                                                    <td className="cod-column" style={{ border: "1px solid black" }}>
                                                        <strong>{roundRupee(codSplit[idx])}</strong>
                                                    </td>
                                                    <td className="small-col" style={{ border: "1px solid black" }}>
                                                        <strong>{warehouse.weight}</strong>
                                                    </td>
                                                    <td style={{ border: "1px solid black" }}>
                                                        <strong>{warehouse.length}</strong>
                                                    </td>
                                                    <td style={{ border: "1px solid black" }}>
                                                        <strong>{warehouse.breadth}</strong>
                                                    </td>
                                                    <td style={{ border: "1px solid black" }}>
                                                        <strong>{warehouse.height}</strong>
                                                    </td>
                                                    <td className="volume-col small-col" style={{ border: "1px solid black" }}>
                                                        <strong>
                                                            {warehouse.length && warehouse.breadth && warehouse.height
                                                                ? (warehouse.length * warehouse.breadth * warehouse.height / 6000).toFixed(2)
                                                                : "N/A"}
                                                        </strong>
                                                    </td>
                                                    <td className="small-col" style={{ border: "1px solid black" }}>
                                                        <strong>{warehouse.actual_weight}</strong>
                                                    </td>
                                                    <td style={{ border: "1px solid black" }}>
                                                        <strong>{warehouse.parcel_amount}</strong>
                                                    </td>
                                                    <td style={{ border: "1px solid black" }}>
                                                        <strong>{warehouse.tracking_id}</strong>
                                                    </td>
                                                    <td style={{ border: "1px solid black" }}>
                                                        <strong>{warehouse.parcel_service_name || "Unknown"}</strong>
                                                    </td>
                                                    <td style={{ border: "1px solid black" }}>
                                                        <strong>{warehouse.packed_by}</strong>
                                                    </td>
                                                    <td style={{ border: "1px solid black" }}>
                                                        <strong>{warehouse.verified_by || "N/A"}</strong>
                                                    </td>
                                                </tr>
                                            ));
                                        });
                                    })()}
                                    <tr className="total-row" style={{ backgroundColor: "#f0f0f0", color: "red", fontWeight: "bold", textAlign: "left" }}>
                                        <td colSpan={6} style={{ border: "1px solid black" }}><strong>Total</strong></td>
                                        <td style={{ border: "1px solid black" }}>{boxTotal}</td>
                                        <td style={{ border: "1px solid black" }}>
                                            {roundRupee(codTotal)}
                                        </td>
                                        <td style={{ border: "1px solid black" }}>{weightTotal}</td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td style={{ border: "1px solid black" }}>{volumeTotal.toFixed(2)}</td>
                                        <td style={{ border: "1px solid black" }}>{actualWeightTotal}</td>
                                        <td style={{ border: "1px solid black" }}>{parcelAmountTotal.toFixed(2)}</td>
                                        <td ></td>
                                        <td></td>
                                        <td></td>
                                        {/* <td style={{ border: "1px solid black" }}></td> */}
                                        <td></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )
                })}

                <div style={{ display: "flex", justifyContent: "flex-start", marginTop: "30px" }}>
                    <div style={{ width: "66%", padding: "10px", border: "1px solid #ddd", borderRadius: "5px" }}>
                        <h4 style={{ textAlign: "center" }}>PARCEL SERVICE TOTAL</h4>
                        <table border="1" cellPadding="5" style={{ width: "100%", borderCollapse: "collapse", textAlign: "center" }}>
                            <thead className="printdata-header">
                                <tr>
                                    <th style={{ border: "1px solid black" }}>Parcel Service</th>
                                    <th style={{ border: "1px solid black" }}>Total Invoices</th>
                                    <th style={{ border: "1px solid black" }}>Total Box</th>
                                    <th style={{ border: "1px solid black" }}>Total Parcel Amount</th>
                                    <th style={{ border: "1px solid black" }}>Total Actual Weight</th>
                                    <th style={{ border: "1px solid black" }}>Average</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(parcelCounts).map(([serviceName, count]) => {
                                    const amount = parcelAmounts[serviceName] || 0;
                                    const actualWkg = (parcelActualWeights[serviceName] || 0) / 1000;
                                    const avg = actualWkg > 0 ? amount / actualWkg : 0; // ₹/kg
                                    return (
                                        <tr key={serviceName}>
                                            <td style={{ border: "1px solid black" }}><strong>{serviceName}</strong></td>
                                            <td style={{ border: "1px solid black" }}>
                                                <strong>{parcelInvoiceCounts[serviceName] || 0}</strong>
                                            </td>
                                            <td style={{ border: "1px solid black" }}><strong>{count}</strong></td>
                                            <td style={{ border: "1px solid black" }}><strong>₹{amount.toFixed(2)}</strong></td>
                                            <td style={{ border: "1px solid black" }}><strong>{actualWkg.toFixed(2)}</strong></td>
                                            <td style={{ border: "1px solid black" }}><strong>₹{avg.toFixed(2)}</strong></td>
                                        </tr>
                                    );
                                })}
                                <tr className="total-row1" style={{ backgroundColor: '#e0e0e0' }}>
                                    <td style={{ border: "1px solid black" }}><strong>TOTAL</strong></td>
                                    <td style={{ border: "1px solid black" }}>
                                        <strong>{totalUniqueInvoices}</strong>
                                    </td>
                                    <td style={{ border: "1px solid black" }}>
                                        <strong>
                                            {Object.values(parcelCounts).reduce((acc, curr) => acc + curr, 0)}
                                        </strong>
                                    </td>
                                    <td style={{ border: "1px solid black" }}><strong>₹{totalParcelAmountAllServices.toFixed(2)}</strong></td>
                                    <td style={{ border: "1px solid black" }}><strong>{totalActualWeightAllServicesKg.toFixed(2)}</strong></td>
                                    <td style={{ border: "1px solid black" }}><strong>₹{overallAverageAllServices.toFixed(2)}</strong></td>
                                </tr>
                                <tr className="total-row1" style={{ backgroundColor: '#f0f0f0' }}>
                                    <td style={{ border: "1px solid black" }}><strong>TOTAL COD ORDERS</strong></td>
                                    <td style={{ border: "1px solid black" }}>
                                        <strong>{totalCODInvoices}</strong>
                                    </td>
                                    <td style={{ border: "1px solid black" }}><strong>{codRollup.boxes}</strong></td>
                                    <td style={{ border: "1px solid black" }}><strong>₹{roundRupee(codRollup.amount)}</strong></td>
                                    <td style={{ border: "1px solid black" }}><strong>{codRollup.weightKg.toFixed(2)}</strong></td>
                                    <td style={{ border: "1px solid black" }}><strong>₹{codRollup.avg.toFixed(2)}</strong></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div style={{ width: "30%", padding: "10px", border: "1px solid #ddd", borderRadius: "5px" }}>
                        <table border="1" cellPadding="5" style={{ width: "100%", borderCollapse: "collapse", textAlign: "center", marginTop: "30px" }}>
                            <tbody>
                                <tr>
                                    <td className="total-row" style={{ border: "1px solid black" }}><strong>BEPARCEL</strong></td>
                                    <td className="total-row" style={{ border: "1px solid black" }}><strong>{aggregatedParcelCounts.BEPARCEL}</strong></td>
                                </tr>
                                <tr>
                                    <td className="total-row2" style={{ border: "1px solid black" }}><strong>SPEED</strong></td>
                                    <td className="total-row2" style={{ border: "1px solid black" }}><strong>{aggregatedParcelCounts.SPEED}</strong></td>
                                </tr>
                                <tr>
                                    <td className="total-row1" style={{ border: "1px solid black" }}><strong>TOTAL</strong></td>
                                    <td className="total-row1" style={{ border: "1px solid black" }}><strong>{Object.values(aggregatedParcelCounts).reduce((acc, curr) => acc + curr, 0)}</strong></td>
                                </tr>
                            </tbody>
                        </table>
                        <table border="1" cellPadding="5" style={{ width: "100%", borderCollapse: "collapse", textAlign: "center", marginTop: "30px" }}>
                            <tbody>
                                <tr>
                                    <td className="total-row" style={{ border: "1px solid black" }}><strong>BEPARCEL AMOUNT</strong></td>
                                    <td className="total-row" style={{ border: "1px solid black" }}><strong>₹{aggregatedParcelAmounts.BEPARCEL.toFixed(2)}</strong></td>
                                </tr>
                                <tr>
                                    <td className="total-row2" style={{ border: "1px solid black" }}><strong>SPEED AMOUNT</strong></td>
                                    <td className="total-row2" style={{ border: "1px solid black" }}><strong>₹{aggregatedParcelAmounts.SPEED.toFixed(2)}</strong></td>
                                </tr>
                                <tr>
                                    <td className="total-row1" style={{ border: "1px solid black" }}><strong>TOTAL</strong></td>
                                    <td className="total-row1" style={{ border: "1px solid black" }}><strong>₹{(aggregatedParcelAmounts.BEPARCEL + aggregatedParcelAmounts.SPEED).toFixed(2)}</strong></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", margin: "10px 0px" }}>
                    {isVerified ? (
                        <span style={{ fontWeight: "bold", color: "#000", fontSize: "18px" }}>
                            Final Confirmation by: <span style={{ color: "#28837a" }}>{checkedBy}</span>
                        </span>
                    ) : (
                        <button
                            onClick={verifyButton}
                            style={{
                                padding: "10px 20px",
                                fontSize: "16px",
                                cursor: "pointer",
                                border: "none",
                                background: "#28837a",
                                color: "white"
                            }}
                            disabled={isVerified}
                        >
                            Verify Now
                        </button>
                    )}
                </div>
                <ToastContainer />
            </div>
        </div>
    );
};

export default Movement;