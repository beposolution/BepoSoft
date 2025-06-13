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
        data.forEach((category) => {
            category.orders.forEach((order) => {
                order.warehouses.forEach((warehouse) => {
                    const serviceName = warehouse.parcel_service;
                    if (serviceName) {
                        countParcels[serviceName] = (countParcels[serviceName] || 0) + 1;
                    }
                });
            });
        });
        setParcelCounts(countParcels);
    }, [data]);

    return (
        <div style={{ padding: "20px", overflow: "auto", maxHeight: "90vh" }}>
            <h3 style={{ marginTop: "5rem", display: "flex", justifyContent: "center", alignItems: "center" }}>
                Goods-Movement - {id}
            </h3>
            {data.map((category, index) => (
                <div key={index} style={{ marginBottom: "30px" }}>
                    <h2 style={{ backgroundColor: "#4CAF50", color: "white", padding: "10px", borderRadius: "5px" }}>
                        {category.family}
                    </h2>
                    <table border="1" cellPadding="5" style={{ width: "100%", borderCollapse: "collapse", textAlign: "center" }}>
                        <thead style={{ backgroundColor: "#ddd", fontWeight: "bold" }}>
                            <tr>
                                <th>SL No</th>
                                <th>Invoice No</th>
                                <th>Customer</th>
                                <th>Box</th>
                                <th>Weight</th>
                                <th>Length (cm)</th>
                                <th>Breadth (cm)</th>
                                <th>Height (cm)</th>
                                <th>Tracking ID</th>
                                <th>Status</th>
                                <th>Shipped Date</th>
                                <th>Packed By</th>
                                <th>Verified By</th>
                                <th>Final Conformation</th>
                                <th>Actual Weight</th>
                                <th>Parcel Amount (₹)</th>
                                <th>Post Office Date</th>
                                <th>Parcel Service</th>
                            </tr>
                        </thead>
                        <tbody>
                            {category.orders.map((order, orderIndex) =>
                                order.warehouses.map((warehouse, warehouseIndex) => (
                                    <tr key={`${orderIndex}-${warehouseIndex}`} style={{ backgroundColor: warehouseIndex % 2 === 0 ? "#f9f9f9" : "white" }}>
                                        <td>{orderIndex + 1}</td>
                                        <td>{order.invoice}</td>
                                        <td>{warehouse.customer}</td>
                                        <td>{warehouse.box}</td>
                                        <td>{warehouse.weight}</td>
                                        <td>{warehouse.length}</td>
                                        <td>{warehouse.breadth}</td>
                                        <td>{warehouse.height}</td>
                                        <td>{warehouse.tracking_id}</td>
                                        <td>{warehouse.status}</td>
                                        <td>{warehouse.shipped_date}</td>
                                        <td>{warehouse.packed_by}</td>
                                        <td>{warehouse.verified_by || "N/A"}</td>
                                        <td>{warehouse.checked_by}</td>
                                        <td>{warehouse.actual_weight}</td>
                                        <td>{warehouse.parcel_amount}</td>
                                        <td>{warehouse.postoffice_date || "-"}</td>
                                        <td>{warehouse.parcel_service || "Unknown"}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            ))}

            <div style={{ marginTop: "30px", padding: "10px", border: "1px solid #ddd", borderRadius: "5px" }}>
                <h3>Parcel Services Total</h3>
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
                                <td>{serviceName}</td>
                                <td>{count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
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