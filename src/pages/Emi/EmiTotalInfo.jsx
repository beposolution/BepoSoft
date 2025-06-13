import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const EmiTotalInfo = () => {
    const { id } = useParams(); // Correctly extracting the "id" parameter
    const token = localStorage.getItem("token");
    const [totalInfo, setTotalInfo] = useState("");

    // Define the fetch function inside the component
    const fetchFullOrderDetails = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_APP_IMAGE}/apis/emiexpense/${id}/`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setTotalInfo(response.data)
            // toast.success("EMI data fetched successfully!");
        } catch (error) {
            toast.error("Error fetching data:", error);
        }
    };

    // useEffect to call fetchFullOrderDetails on mount
    useEffect(() => {
        fetchFullOrderDetails();
    }, [id]);

    // Helper to generate all EMI months
    function getAllEmiMonths(startDate, tenure) {
        if (!startDate || !tenure) return [];
        const months = [];
        const [startYear, startMonth] = startDate.split('-').map(Number);

        // Get current year and month
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // JS months are 0-based

        for (let i = 0; i < tenure; i++) {
            let year = startYear + Math.floor((startMonth - 1 + i) / 12);
            let month = ((startMonth - 1 + i) % 12) + 1;

            // Stop if the month is after the current month
            if (year > currentYear || (year === currentYear && month > currentMonth)) {
                break;
            }

            months.push({
                year,
                month,
                label: `${year}-${month.toString().padStart(2, '0')}`
            });
        }
        return months;
    }

    // Map payments to months
    function getEmiPaymentRows(totalInfo) {
        const emiMonths = getAllEmiMonths(totalInfo.startdate, totalInfo.tenure_months);
        // Group payments by month
        const paymentsByMonth = {};
        (totalInfo.emidata || []).forEach(item => {
            const [y, m] = item.date.split('-');
            const key = `${y}-${m}`;
            if (!paymentsByMonth[key]) paymentsByMonth[key] = [];
            paymentsByMonth[key].push(item);
        });

        // For each month, return all payments (or a "Not Paid" row if none)
        let rows = [];
        emiMonths.forEach(({ label }) => {
            const payments = paymentsByMonth[label];
            if (payments && payments.length > 0) {
                payments.forEach(payment => {
                    rows.push({
                        month: label,
                        date: payment.date || "",
                        amount: payment.amount || 0,
                        status: payment.status || "Paid"
                    });
                });
            } else {
                rows.push({
                    month: label,
                    date: "",
                    amount: 0,
                    status: "Not Paid"
                });
            }
        });
        return rows;
    }

    return (
        <>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginTop: "70px", marginBottom:"4rem" }}>

                {/* Table Container */}
                <div style={{ display: "flex", justifyContent: "center", marginTop: "20px", width: "100%" }}>
                    <table style={{ borderCollapse: "collapse", width: "60%", textAlign: "center" }}>
                        <thead>
                            <tr>
                                <th style={{ border: "1px solid black", padding: "15px", textAlign: "center", background: "#3840d1", color: "white" }} colSpan="3">
                                    EMI INFORMATION
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ border: "1px solid black", padding: "10px" }}>Emi Name</td>
                                <td style={{ border: "1px solid black", padding: "10px", fontWeight: "bolder", textTransform: "uppercase" }}>{totalInfo?.emi_name}</td>
                            </tr>
                            <tr>
                                <td style={{ border: "1px solid black", padding: "10px" }}>principal</td>
                                <td style={{ border: "1px solid black", padding: "10px" }}> ₹{totalInfo.principal}</td>
                            </tr>
                            <tr>
                                <td style={{ border: "1px solid black", padding: "10px" }}>Annual Intrust</td>
                                <td style={{ border: "1px solid black", padding: "10px" }}>{totalInfo.annual_interest_rate}%</td>
                            </tr>
                            <tr>
                                <td style={{ border: "1px solid black", padding: "10px" }}>Down Payment</td>
                                <td style={{ border: "1px solid black", padding: "10px" }}> ₹{totalInfo.down_payment}</td>
                            </tr>

                            <tr>
                                <td style={{ border: "1px solid black", padding: "10px" }}>Total Amount Paid</td>
                                <td style={{ border: "1px solid black", padding: "10px" }}> ₹{totalInfo.total_amount_paid}</td>
                            </tr>
                            <tr>
                                <td style={{ border: "1px solid black", padding: "10px" }}>Total Emi Paid</td>
                                <td style={{ border: "1px solid black", padding: "10px" }}> ₹{totalInfo.total_emi_paid}</td>
                            </tr>
                            <tr>
                                <td style={{ border: "1px solid black", padding: "10px" }}>Tenure Month</td>
                                <td style={{ border: "1px solid black", padding: "10px" }}> ₹{totalInfo.tenure_months}</td>
                            </tr>

                        </tbody>
                    </table>

                </div>
                <div style={{ padding: "20px" }}>
                    <h3 style={{ display: "flex", justifyContent: "center", textAlign: "center", }}>PAYMENT INFORMATION</h3>
                    {totalInfo.startdate && totalInfo.tenure_months ? (
                        <table style={{ borderCollapse: "collapse", width: "100%", padding: "10px 30px", textAlign: "center", maxWidth: "400px", minWidth: "100px" }}>
                            <thead>
                                <tr style={{ background: "green", color: "white" }}>
                                    <td style={{ border: "1px solid black", padding: "10px" }}>Payment Month</td>
                                    <td style={{ border: "1px solid black", padding: "10px" }}>Payment Date</td>
                                    <td style={{ border: "1px solid black", padding: "10px" }}>Payment Amount</td>
                                    <td style={{ border: "1px solid black", padding: "10px" }}>Payment Status</td>
                                </tr>
                            </thead>
                            <tbody>
                                {getEmiPaymentRows(totalInfo)
                                    .reverse()
                                    .map((row, idx) => (
                                        <tr key={idx}>
                                            <td style={{ border: "1px solid black", padding: "10px" }}>{row.month}</td>
                                            <td style={{ border: "1px solid black", padding: "10px" }}>{row.date || "-"}</td>
                                            <td style={{ border: "1px solid black", padding: "10px" }}>₹{row.amount}</td>
                                            <td style={{ border: "1px solid black", padding: "10px", color: row.status === "Not Paid" ? "red" : "green" }}>{row.status}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    ) : (
                        <div style={{ color: "gray", textAlign: "center" }}>No EMI data available.</div>
                    )}
                </div>
            </div>
        </>

    );
};

export default EmiTotalInfo;
