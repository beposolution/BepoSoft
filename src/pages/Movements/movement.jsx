import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";

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

    .print-section {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        font-size: 10px;
        color: black;
    }

    .main-title {
        color:black;
    }

    table {
        page-break-inside: auto;
        break-inside: auto;
        width: 100%;
        font-size: 9px;
        border-collapse: collapse;
        color-adjust: exact;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }

    tr {
        page-break-inside: avoid;
        break-inside: avoid;
    }

    th, td {
        padding: 4px;
        border: 1px solid #000;
        word-break: break-word;
    }

    thead {
        background-color: #3399cc !important;
        color: white !important;
    }

    /* Apply yellow to all h2 and h3 inside print-section, EXCEPT the main-title */
    .print-section h2,
    .print-section h3:not(.main-title) {
        background-color: #ffeb3b !important; /* yellow */
        color: #000 !important;
        padding: 6px !important;
        text-align: center !important;
        margin: 4px 0 !important;
        border-radius: 4px;
    }

    /* Keep the main title (DAILY GOODS MOVEMENT) with Turkish blue */
    .print-section .main-title {
        background-color: #3399cc !important;
        color: white !important;
        padding: 6px !important;
        margin-top: 2rem !important;
        text-align: center !important;
        border-radius: 4px;
    }

    button, .no-print {
        display: none !important;
    }
}
    `}
            </style>
            <div style={{ marginTop: "3rem", display: "flex", justifyContent: "flex-end", padding: "10px" }}>
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
                {data.map((category, index) => (
                    <div key={index} style={{ marginBottom: "30px" }}>
                        <h4
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
                        <table border="1" cellPadding="5" style={{ width: "100%", borderCollapse: "collapse", textAlign: "center" }}>
                            <thead style={{ backgroundColor: "#ddd", fontWeight: "bold" }}>
                                <tr>
                                    <th>SL No</th>
                                    <th>Invoice No</th>
                                    <th>Customer</th>
                                    <th>Phone</th>
                                    <th>Pincode</th>
                                    <th>Box</th>
                                    <th>COD</th>
                                    <th>Weight (gram)</th>
                                    {/* <th>Length (cm)</th>
                                <th>Breadth (cm)</th>
                                <th>Height (cm)</th> */}
                                    <th>Volume (cm³)</th>
                                    <th>Tracking ID</th>
                                    {/* <th>Shipped Date</th> */}
                                    <th>Actual Weight (gram)</th>
                                    <th>Parcel Amount (₹)</th>
                                    <th>Post Office Date</th>
                                    <th>Parcel Service</th>
                                    <th>Packed By</th>
                                    <th>Verified By</th>
                                    <th>Final Conformation</th>
                                </tr>
                            </thead>
                            <tbody>
                                {category.orders.map((order, orderIndex) =>
                                    order.warehouses.map((warehouse, warehouseIndex) => (
                                        <tr key={`${orderIndex}-${warehouseIndex}`} style={{ backgroundColor: warehouseIndex % 2 === 0 ? "#f9f9f9" : "white" }}>
                                            <td>{orderIndex + 1}</td>
                                            <td><strong>{order.invoice}</strong></td>
                                            <td><strong>{warehouse.customer}</strong></td>
                                            <td><strong>{warehouse.phone}</strong></td>
                                            <td><strong>{warehouse.zip_code}</strong></td>
                                            <td><strong>{warehouse.box}</strong></td>
                                            <td><strong>{order.cod_amount}</strong></td>
                                            <td><strong>{warehouse.weight}</strong></td>
                                            {/* <td>{warehouse.length}</td>
                                        <td>{warehouse.breadth}</td>
                                        <td>{warehouse.height}</td> */}
                                            <td>
                                                <strong>
                                                    {warehouse.length && warehouse.breadth && warehouse.height
                                                        ? warehouse.length * warehouse.breadth * warehouse.height
                                                        : "N/A"}
                                                </strong>
                                            </td>
                                            <td><strong>{warehouse.tracking_id}</strong></td>
                                            {/* <td>{warehouse.shipped_date}</td> */}

                                            <td><strong>{warehouse.actual_weight}</strong></td>
                                            <td><strong>{warehouse.parcel_amount}</strong></td>
                                            <td><strong>{warehouse.postoffice_date || "-"}</strong></td>
                                            <td><strong>{warehouse.parcel_service || "Unknown"}</strong></td>
                                            <td><strong>{warehouse.packed_by}</strong></td>
                                            <td><strong>{warehouse.verified_by || "N/A"}</strong></td>
                                            <td><strong>{warehouse.checked_by}</strong></td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                ))}

                <div style={{ marginTop: "30px", padding: "10px", border: "1px solid #ddd", borderRadius: "5px" }}>
                    <h4 style={{ textAlign: "center" }}>PARCEL SERVICE TOTAL</h4>
                    <table border="1" cellPadding="5" style={{ width: "100%", borderCollapse: "collapse", textAlign: "center" }}>
                        <thead style={{ backgroundColor: "#ddd", fontWeight: "bold" }}>
                            <tr>
                                <th>Parcel Service</th>
                                <th>Total Count</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(parcelCounts).map(([serviceName, count]) => (
                                <tr key={serviceName}>
                                    <td><strong>{serviceName}</strong></td>
                                    <td><strong>{count}</strong></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="mt-3">
                        <h4 style={{ textAlign: "center" }}>TOTAL COD COUNT</h4>
                        <table border="1" cellPadding="5" style={{ width: "100%", borderCollapse: "collapse", textAlign: "center" }}>
                            <thead style={{ backgroundColor: "#ddd", fontWeight: "bold" }}>
                                <tr>
                                    <th>Label</th>
                                    <th>No of COD Orders</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><strong>Total COD Orders</strong></td>
                                    <td><strong>{codCount}</strong></td>
                                </tr>
                            </tbody>
                        </table>
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
        </div>
    );
};

export default Movement;