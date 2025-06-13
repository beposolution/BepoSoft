import React, { useEffect, useState } from "react";
import { Table, Row, Col, Card, CardBody, FormGroup, Label, Input } from "reactstrap";
import { useParams } from "react-router-dom";
import Breadcrumbs from "../../components/Common/Breadcrumb";

const BasicTable = () => {
    document.title = "Basic Tables | Skote - Vite React Admin & Dashboard Template";

    const [data, setData] = useState([]);
    const { date } = useParams();
    const [states, setStates] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [selectedState, setSelectedState] = useState(""); // State filter
    const [selectedCompany, setSelectedCompany] = useState(""); // Company filter
    const token = localStorage.getItem('token');

    const approvedStatuses = [
        "Approved",
        "Shipped",
        "Invoice Created",
        "Invoice Approved",
        "Waiting For Confirmation",
        "To Print",
        "Processing",
        "Completed",
    ];

    const rejectedStatuses = ["Invoice Rejected", "Cancelled", "Refunded", "Return"];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_APP_KEY}invoice/report/${date}/`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const result = await response.json();

                if (result.status === "success") {
                    let processedData = result.data.map((staff) => {
                        let totalOrders = 0;
                        let totalAmount = 0;
                        let approvedCount = 0;
                        let approvedTotal = 0;
                        let rejectedCount = 0;
                        let rejectedTotal = 0;

                        staff.orders_details.forEach((order) => {
                            totalOrders += 1;
                            totalAmount += order.total_amount || 0;

                            if (approvedStatuses.includes(order.status)) {
                                approvedCount += 1;
                                approvedTotal += order.total_amount || 0;
                            } else if (rejectedStatuses.includes(order.status)) {
                                rejectedCount += 1;
                                rejectedTotal += order.total_amount || 0;
                            }
                        });

                        return {
                            ...staff,
                            totalOrders,
                            totalAmount,
                            approvedCount,
                            approvedTotal,
                            rejectedCount,
                            rejectedTotal,
                        };
                    });

                    // Apply state and company filtering
                    if (selectedState) {
                        processedData = processedData.filter((staff) =>
                            staff.orders_details.some((order) => order.state === selectedState)
                        );
                    }

                    if (selectedCompany) {
                        processedData = processedData.filter((staff) =>
                            staff.orders_details.some((order) => order.company === selectedCompany)
                        );
                    }

                    setData(processedData);
                } else {
                    console.error("Failed to fetch data:", result.message);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, [date, selectedState, selectedCompany, token]);

    // Fetch states
    useEffect(() => {
        const fetchStates = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_APP_KEY}states/`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await response.json();

                if (data.message === "State list successfully retrieved") {
                    setStates(data.data);
                } else {
                    console.error("Failed to fetch states:", data.message);
                }
            } catch (error) {
                console.error("Error fetching states:", error);
            }
        };

        fetchStates();
    }, [token]);

    // Fetch companies
    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_APP_KEY}company/data/`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await response.json();

                if (data.status === "success") {
                    setCompanies(data.data);
                } else {
                    console.error("Failed to fetch companies:", data.message);
                }
            } catch (error) {
                console.error("Error fetching companies:", error);
            }
        };

        fetchCompanies();
    }, [token]);

    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Tables" breadcrumbItem="Basic Tables" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <div className="table-responsive">
                                        <h4 className="card-title text-center">INVOICE REPORT</h4>
                                        <div className="table-responsive">
                                            <Row>
                                                <Col xl={4}>
                                                    <FormGroup>
                                                        <Input
                                                            type="select"
                                                            name="state"
                                                            id="state"
                                                            onChange={(e) => setSelectedState(e.target.value)}
                                                        >
                                                            <option value="">Select State</option>
                                                            {states.map((state) => (
                                                                <option key={state.id} value={state.name}>
                                                                    {state.name}
                                                                </option>
                                                            ))}
                                                        </Input>
                                                    </FormGroup>
                                                </Col>
                                                <Col xl={4}>
                                                    <FormGroup>
                                                        <Input
                                                            type="select"
                                                            name="company"
                                                            id="company"
                                                            onChange={(e) => setSelectedCompany(e.target.value)}
                                                        >
                                                            <option value="">Select Company</option>
                                                            {companies.map((company) => (
                                                                <option key={company.id} value={company.name}>
                                                                    {company.name}
                                                                </option>
                                                            ))}
                                                        </Input>
                                                    </FormGroup>
                                                </Col>
                                            </Row>
                                            <Table className="align-middle mb-0">
                                                <thead>
                                                    <tr
                                                        style={{
                                                            background: "linear-gradient(90deg, #007bff, #0056b3)",
                                                            color: "#ffffff",
                                                            fontSize: "16px",
                                                            fontWeight: "bold",
                                                            borderTopLeftRadius: "8px",
                                                            borderTopRightRadius: "8px",
                                                        }}
                                                    >
                                                        <th className="text-center" style={{ padding: "14px", border: "1px solid #dee2e6" }}>#</th>
                                                        <th className="text-center" style={{ padding: "14px", border: "1px solid #dee2e6" }}>Staff</th>
                                                        <th colSpan="2" className="text-center" style={{ padding: "14px", border: "1px solid #dee2e6" }}>Invoice</th>
                                                        <th colSpan="2" className="text-center" style={{ padding: "14px", border: "1px solid #dee2e6" }}>Approved</th>
                                                        <th colSpan="2" className="text-center" style={{ padding: "14px", border: "1px solid #dee2e6" }}>Rejected</th>
                                                        <th className="text-center" style={{ padding: "14px", border: "1px solid #dee2e6" }}>Action</th>
                                                    </tr>
                                                    <tr
                                                        style={{
                                                            backgroundColor: "#f8f9fa",
                                                            fontWeight: "bold",
                                                            boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
                                                        }}
                                                    >
                                                        <th className="text-center" style={{ border: "1px solid #dee2e6" }}>No</th>
                                                        <th className="text-center" style={{ border: "1px solid #dee2e6" }}>Name</th>
                                                        <th className="text-center" style={{ border: "1px solid #dee2e6" }}>Bill</th>
                                                        <th className="text-center" style={{ border: "1px solid #dee2e6" }}>Amount</th>
                                                        <th className="text-center" style={{ border: "1px solid #dee2e6" }}>Bill</th>
                                                        <th className="text-center" style={{ border: "1px solid #dee2e6" }}>Amount</th>
                                                        <th className="text-center" style={{ border: "1px solid #dee2e6" }}>Bill</th>
                                                        <th className="text-center" style={{ border: "1px solid #dee2e6" }}>Amount</th>
                                                        <th className="text-center" style={{ border: "1px solid #dee2e6" }}>Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data && Array.isArray(data) && data.map((item, index) => (
                                                        <tr key={index}>
                                                            <td className="text-center" style={{ border: "1px solid #dee2e6", padding: "12px" }}>
                                                                {index + 1}
                                                            </td>
                                                            <td className="text-center" style={{ border: "1px solid #dee2e6", padding: "12px" }}>
                                                                {item.name} ({item.family})
                                                            </td>
                                                            <td className="text-center" style={{ border: "1px solid #dee2e6", padding: "12px" }}>
                                                                {item.totalOrders}
                                                            </td>
                                                            <td className="text-center" style={{ border: "1px solid #dee2e6", padding: "12px" }}>
                                                                {item.totalAmount.toFixed(2)}
                                                            </td>
                                                            <td className="text-center" style={{ border: "1px solid #dee2e6", padding: "12px" }}>
                                                                {item.approvedCount}
                                                            </td>
                                                            <td className="text-center" style={{ border: "1px solid #dee2e6", padding: "12px" }}>
                                                                {item.approvedTotal.toFixed(2)}
                                                            </td>
                                                            <td className="text-center" style={{ border: "1px solid #dee2e6", padding: "12px" }}>
                                                                {item.rejectedCount}
                                                            </td>
                                                            <td className="text-center" style={{ border: "1px solid #dee2e6", padding: "12px" }}>
                                                                {item.rejectedTotal.toFixed(2)}
                                                            </td>
                                                            <td className="text-center" style={{ border: "1px solid #dee2e6", padding: "12px" }}>
                                                                <a href={`/sales/resport/${item.id}/staff/${date}/${item.name}/`} style={{ color: "#007bff", textDecoration: "none", fontWeight: "bold" }}>View</a>

                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </div>
        </React.Fragment>
    );
};

export default BasicTable;
