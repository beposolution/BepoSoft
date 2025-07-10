import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import * as XLSX from "xlsx";

const Movement = () => {
    const { id } = useParams();
    const [data, setData] = useState([]);
    const [parcelServices, setParcelServices] = useState([]);
    const [parcelCounts, setParcelCounts] = useState({});
    const token = localStorage.getItem("token");
    const [userData, setUserData] = useState();
    const [isVerified, setIsVerified] = useState(false);
    const [checkedBy, setCheckedBy] = useState("");
    const [codCount, setCodCount] = useState(0);

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
                                if (warehouse.checked_by) {
                                    foundCheckedBy = warehouse.checked_by;
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
        let codOrderCount = 0;

        data.forEach((category) => {
            category.orders.forEach((order) => {
                order.warehouses.forEach((warehouse) => {
                    const serviceName = warehouse.parcel_service;
                    if (serviceName) {
                        countParcels[serviceName] = (countParcels[serviceName] || 0) + 1;
                    }

                    // Count COD orders
                    if (order.cod_amount && parseFloat(order.cod_amount) > 0) {
                        codOrderCount += 1;
                    }
                });
            });
        });

        setParcelCounts(countParcels);
        setCodCount(codOrderCount); // new state for COD
    }, [data]);

    const aggregatedParcelCounts = {
        BEPARCEL: (parcelCounts['BEPARCEL'] || 0) + (parcelCounts['BEPARCEL COD'] || 0),
        SPEED: (parcelCounts['SPEED POST'] || 0) + (parcelCounts['SPEED COD'] || 0),
    };

    const exportToExcel = () => {
        const wb = XLSX.utils.book_new();
        const wsData = [];

        let globalSerial = 1;

        data.forEach((category) => {
            // Title row
            wsData.push([`${category.family?.toUpperCase()} FAMILY`]);
            // Header
            wsData.push([
                "SL No", "Invoice No", "Customer", "Phone", "Pincode", "Box", "COD (₹)", "Weight (g)",
                "Volume Weight (kg)", "Actual Weight (g)", "Parcel Amount (₹)", "Tracking ID",
                "Parcel Service", "Packed By", "Verified By"
            ]);

            let boxTotal = 0;
            let codTotal = 0;
            let weightTotal = 0;
            let volumeTotal = 0;
            let actualWeightTotal = 0;
            let parcelAmountTotal = 0;

            category.orders.forEach((order) => {
                order.warehouses.forEach((warehouse) => {
                    const volumeWeight = warehouse.length && warehouse.breadth && warehouse.height
                        ? (warehouse.length * warehouse.breadth * warehouse.height) / 6000
                        : 0;

                    wsData.push([
                        globalSerial++,
                        order.invoice,
                        warehouse.customer,
                        warehouse.phone,
                        warehouse.zip_code,
                        warehouse.box,
                        order.cod_amount,
                        warehouse.weight,
                        volumeWeight.toFixed(2),
                        warehouse.actual_weight,
                        warehouse.parcel_amount,
                        warehouse.tracking_id,
                        warehouse.parcel_service,
                        warehouse.packed_by,
                        warehouse.verified_by || "N/A"
                    ]);

                    // Accumulate totals
                    boxTotal += warehouse.box ? 1 : 0;
                    codTotal += parseFloat(order.cod_amount || 0);
                    weightTotal += parseFloat(warehouse.weight || 0);
                    volumeTotal += volumeWeight;
                    actualWeightTotal += parseFloat(warehouse.actual_weight || 0);
                    parcelAmountTotal += parseFloat(warehouse.parcel_amount || 0);
                });
            });

            // Family Total Row
            wsData.push([
                "TOTAL", "", "", "", "", boxTotal, codTotal.toFixed(2), weightTotal.toFixed(2),
                volumeTotal.toFixed(2), actualWeightTotal.toFixed(2), parcelAmountTotal.toFixed(2),
                "", "", "", ""
            ]);
            wsData.push([]); // Blank row between families
        });

        // Create sheet for details
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, "Movement Summary");

        // === Summary Sheet (Parcel Services) ===
        const wsSummaryData = [
            ["Parcel Service", "Total Count"],
            ...Object.entries(parcelCounts).map(([service, count]) => [service, count]),
            ["", ""],
            ["TOTAL PARCEL COUNT", Object.values(parcelCounts).reduce((a, b) => a + b, 0)],
            ["TOTAL COD ORDERS", codCount],
            ["", ""],
            ["Grouped Summary", ""],
            ["BEPARCEL", aggregatedParcelCounts.BEPARCEL],
            ["SPEED", aggregatedParcelCounts.SPEED],
            ["TOTAL", aggregatedParcelCounts.BEPARCEL + aggregatedParcelCounts.SPEED]
        ];

        const wsSummary = XLSX.utils.aoa_to_sheet(wsSummaryData);
        XLSX.utils.book_append_sheet(wb, wsSummary, "Parcel Totals");

        // Write the file
        XLSX.writeFile(wb, `DGM_Report_${id}.xlsx`);
    };

    return (
        <div style={{ padding: "20px", overflow: "auto", maxHeight: "90vh" }}>
            <style>
                {`
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
                    let serialNo = 1;
                    let boxTotal = 0;
                    let codTotal = 0;
                    let weightTotal = 0;
                    let volumeTotal = 0;
                    let actualWeightTotal = 0;
                    let parcelAmountTotal = 0;

                    category.orders.forEach(order => {
                        order.warehouses.forEach(warehouse => {
                            if (warehouse.box) {
                                boxTotal += 1;
                            }
                            codTotal += parseFloat(order.cod_amount || 0);
                            weightTotal += parseFloat(warehouse.weight || 0);
                            actualWeightTotal += parseFloat(warehouse.actual_weight || 0);
                            parcelAmountTotal += parseFloat(warehouse.parcel_amount || 0);

                            if (warehouse.length && warehouse.breadth && warehouse.height) {
                                volumeTotal += warehouse.length * warehouse.breadth * warehouse.height / 6000;
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
                                        <th style={{ border: "1px solid black" }}>Pincode</th>
                                        <th style={{ border: "1px solid black" }}>Box</th>
                                        <th style={{ border: "1px solid black" }}>COD (₹)</th>
                                        <th className="small-col" style={{ border: "1px solid black" }}>Weight (gram)</th>
                                        {/* <th>Length (cm)</th>
                                <th>Breadth (cm)</th>
                                <th>Height (cm)</th> */}
                                        <th className="small-col" style={{ border: "1px solid black" }}>Volume (cm³)</th>
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
                                    {category.orders.map((order) =>
                                        order.warehouses.map((warehouse) => (
                                            <tr key={serialNo}>
                                                <td style={{ border: "1px solid black" }}>{serialNo++}</td>
                                                <td style={{ border: "1px solid black" }}><strong>{order.invoice}</strong></td>
                                                <td style={{ border: "1px solid black" }}><strong>{warehouse.customer}</strong></td>
                                                <td style={{ border: "1px solid black" }}><strong>{warehouse.phone}</strong></td>
                                                <td style={{ border: "1px solid black" }}><strong>{warehouse.zip_code}</strong></td>
                                                <td style={{ border: "1px solid black" }}><strong>{warehouse.box}</strong></td>
                                                <td style={{ border: "1px solid black" }}><strong>{order.cod_amount}</strong></td>
                                                <td className="small-col" style={{ border: "1px solid black" }}><strong>{warehouse.weight}</strong></td>
                                                {/* <td>{warehouse.length}</td>
                                        <td>{warehouse.breadth}</td>
                                        <td>{warehouse.height}</td> */}
                                                <td className="small-col" style={{ border: "1px solid black" }}>
                                                    <strong>
                                                        {warehouse.length && warehouse.breadth && warehouse.height
                                                            ? warehouse.length * warehouse.breadth * warehouse.height / 6000
                                                            : "N/A"}
                                                    </strong>
                                                </td>
                                                {/* <td>{warehouse.shipped_date}</td> */}

                                                <td className="small-col" style={{ border: "1px solid black" }}><strong>{warehouse.actual_weight}</strong></td>
                                                <td style={{ border: "1px solid black" }}><strong>{warehouse.parcel_amount}</strong></td>
                                                <td style={{ border: "1px solid black" }}><strong>{warehouse.tracking_id}</strong></td>
                                                {/* <td><strong>{warehouse.postoffice_date || "-"}</strong></td> */}
                                                <td style={{ border: "1px solid black" }}><strong>{warehouse.parcel_service || "Unknown"}</strong></td>
                                                <td style={{ border: "1px solid black" }}><strong>{warehouse.packed_by}</strong></td>
                                                <td style={{ border: "1px solid black" }}><strong>{warehouse.verified_by || "N/A"}</strong></td>
                                                {/* <td style={{ border: "1px solid black" }}><strong>{warehouse.checked_by}</strong></td> */}
                                            </tr>
                                        ))
                                    )}
                                    <tr className="total-row" style={{ backgroundColor: "#f0f0f0", color: "red", fontWeight: "bold", textAlign: "left" }}>
                                        <td colSpan={5} style={{ border: "1px solid black" }}><strong>Total</strong></td>
                                        <td style={{ border: "1px solid black" }}>{boxTotal}</td>
                                        <td style={{ border: "1px solid black" }}>{codTotal}</td>
                                        <td style={{ border: "1px solid black" }}>{weightTotal}</td>
                                        <td style={{ border: "1px solid black" }}>{volumeTotal.toFixed(2)}</td>
                                        <td style={{ border: "1px solid black" }}>{actualWeightTotal}</td>
                                        <td style={{ border: "1px solid black" }}>{parcelAmountTotal}</td>
                                        <td style={{ border: "1px solid black" }}></td>
                                        <td style={{ border: "1px solid black" }}></td>
                                        <td style={{ border: "1px solid black" }}></td>
                                        {/* <td style={{ border: "1px solid black" }}></td> */}
                                        <td colSpan={4}></td>
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
                                    <th style={{ border: "1px solid black" }}>Total Count</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(parcelCounts).map(([serviceName, count]) => (
                                    <tr key={serviceName}>
                                        <td style={{ border: "1px solid black" }}><strong>{serviceName}</strong></td>
                                        <td style={{ border: "1px solid black" }}><strong>{count}</strong></td>
                                    </tr>
                                ))}
                                <tr className="total-row1" style={{ backgroundColor: '#e0e0e0' }}>
                                    <td style={{ border: "1px solid black" }}><strong>TOTAL PARCEL COUNT</strong></td>
                                    <td style={{ border: "1px solid black" }}>
                                        <strong>
                                            {Object.values(parcelCounts).reduce((acc, curr) => acc + curr, 0)}
                                        </strong>
                                    </td>
                                </tr>
                                <tr className="total-row1" style={{ backgroundColor: '#f0f0f0' }}>
                                    <td style={{ border: "1px solid black" }}><strong>TOTAL COD ORDERS</strong></td>
                                    <td style={{ border: "1px solid black" }}><strong>{codCount}</strong></td>
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