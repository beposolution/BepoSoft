import React, { useEffect, useState } from "react";
import { Table, Row, Col, Card, CardBody, FormGroup, Label, Input } from "reactstrap";
import { useParams } from "react-router-dom";
import axios from "axios";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Paginations from "../../components/Common/Pagination";

const BasicTable = () => {
    document.title = "Basic Tables | Skote - Vite React Admin & Dashboard Template";

    const [data, setData] = useState([]);
    const { date } = useParams();
    const [states, setStates] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [selectedState, setSelectedState] = useState(""); // State filter
    const [selectedCompany, setSelectedCompany] = useState(""); // Company filter
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('active');
    const [staffs, setStaffs] = useState([]);
    const [selectedStaffId, setSelectedStaffId] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const perPageData = 10;

    const approvedStatuses = [
        "Approved",
        "Shipped",
        "Invoice Created",
        "Invoice Approved",
        "Waiting For Confirmation",
        "To Print",
        "Processing",
        "Completed",
        "Packing under progress",
        "Ready to ship",
    ];

    const rejectedStatuses = ["Invoice Rejected", "Cancelled", "Refunded", "Return"];

    const fetchStaffs = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_APP_KEY}staffs/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setStaffs(response.data.data);
        } catch (error) {
            toast.error("Error fetching staffs:");
        }
    };

    useEffect(() => {
        fetchStaffs();
    }, [token]);

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
                    let processedData = result.data
                        .filter(staff => role !== "CSO" || staff.family?.toLowerCase() !== "bepocart") // <- NEW LINE
                        .map((staff) => {
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

                    if (selectedStaffId) {
                        processedData = processedData.filter((staff) =>
                            String(staff.id) === String(selectedStaffId)
                        );
                    }

                    setData(processedData);
                } else {
                    toast.error("Failed to fetch data:");
                }
            } catch (error) {
                toast.error("Error fetching data:");
            }
        };

        fetchData();
    }, [date, selectedState, selectedCompany, selectedStaffId, token]);

    const grandTotalApprovedCount = data.reduce((sum, item) => sum + item.approvedCount, 0);
    const grandTotalApprovedAmount = data.reduce((sum, item) => sum + item.approvedTotal, 0);

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
                    toast.error("Failed to fetch states");
                }
            } catch (error) {
                toast.error("Error fetching states");
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
                    toast.error("Failed to fetch companies:");
                }
            } catch (error) {
                toast.error("Error fetching companies:");
            }
        };

        fetchCompanies();
    }, [token]);

    const indexOfLastItem = currentPage * perPageData;
    const indexOfFirstItem = indexOfLastItem - perPageData;
    const currentData = data.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Tables" breadcrumbItem="INVOICE REPORT" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <div className="table-responsive">
                                        {/* <h4 className="card-title text-center">INVOICE REPORT</h4> */}
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
                                                <Col xl={4}>
                                                    <FormGroup>
                                                        <Input
                                                            type="select"
                                                            name="staff"
                                                            id="staff"
                                                            onChange={(e) => setSelectedStaffId(e.target.value)}
                                                        >
                                                            <option value="">Select Staff</option>
                                                            {staffs.map((staff) => (
                                                                <option key={staff.id} value={staff.id}>
                                                                    {staff.name} ({staff.family_name})
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
                                                        {/* <th colSpan="2" className="text-center" style={{ padding: "14px", border: "1px solid #dee2e6" }}>Invoice</th> */}
                                                        <th colSpan="2" className="text-center" style={{ padding: "14px", border: "1px solid #dee2e6" }}>Approved</th>
                                                        {/* <th colSpan="2" className="text-center" style={{ padding: "14px", border: "1px solid #dee2e6" }}>Rejected</th> */}
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
                                                        {/* <th className="text-center" style={{ border: "1px solid #dee2e6" }}>Bill</th> */}
                                                        {/* <th className="text-center" style={{ border: "1px solid #dee2e6" }}>Amount</th> */}
                                                        <th className="text-center" style={{ border: "1px solid #dee2e6" }}>Bill</th>
                                                        <th className="text-center" style={{ border: "1px solid #dee2e6" }}>Amount</th>
                                                        {/* <th className="text-center" style={{ border: "1px solid #dee2e6" }}>Bill</th> */}
                                                        {/* <th className="text-center" style={{ border: "1px solid #dee2e6" }}>Amount</th> */}
                                                        <th className="text-center" style={{ border: "1px solid #dee2e6" }}>Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {currentData && Array.isArray(currentData) && currentData.map((item, index) => (
                                                        <tr key={index}>
                                                            <td className="text-center" style={{ border: "1px solid #dee2e6", padding: "12px" }}>
                                                                {indexOfFirstItem + index + 1}
                                                            </td>
                                                            <td className="text-center" style={{ border: "1px solid #dee2e6", padding: "12px" }}>
                                                                {item.name} ({item.family})
                                                            </td>
                                                            {/* <td className="text-center" style={{ border: "1px solid #dee2e6", padding: "12px" }}>
                                                                {item.totalOrders}
                                                            </td> */}
                                                            {/* <td className="text-center" style={{ border: "1px solid #dee2e6", padding: "12px" }}>
                                                                {item.totalAmount.toFixed(2)}
                                                            </td> */}
                                                            <td className="text-center" style={{ border: "1px solid #dee2e6", padding: "12px" }}>
                                                                {item.approvedCount}
                                                            </td>
                                                            <td className="text-center" style={{ border: "1px solid #dee2e6", padding: "12px" }}>
                                                                {item.approvedTotal.toFixed(2)}
                                                            </td>
                                                            {/* <td className="text-center" style={{ border: "1px solid #dee2e6", padding: "12px" }}>
                                                                {item.rejectedCount}
                                                            </td>
                                                            <td className="text-center" style={{ border: "1px solid #dee2e6", padding: "12px" }}>
                                                                {item.rejectedTotal.toFixed(2)}
                                                            </td> */}
                                                            <td className="text-center" style={{ border: "1px solid #dee2e6", padding: "12px" }}>
                                                                <a href={`/sales/resport/${item.id}/staff/${date}/${item.name}/`} style={{ color: "#007bff", textDecoration: "none", fontWeight: "bold" }}>View</a>

                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot>
                                                    <tr style={{ backgroundColor: "#f1f1f1", fontWeight: "bold" }}>
                                                        <td colSpan="2" className="text-end" style={{ border: "1px solid #dee2e6", padding: "12px" }}>Grand Total</td>
                                                        <td className="text-center" style={{ border: "1px solid #dee2e6", padding: "12px" }}>{grandTotalApprovedCount}</td>
                                                        <td className="text-center" style={{ border: "1px solid #dee2e6", padding: "12px" }}>{grandTotalApprovedAmount.toFixed(2)}</td>
                                                        <td className="text-center" style={{ border: "1px solid #dee2e6", padding: "12px" }}>-</td>
                                                    </tr>
                                                </tfoot>
                                            </Table>
                                            <Paginations
                                                perPageData={perPageData}
                                                data={data}
                                                currentPage={currentPage}
                                                setCurrentPage={setCurrentPage}
                                                isShowingPageLength={true}
                                                paginationDiv="mt-3"
                                                paginationClass="pagination pagination-rounded"
                                                indexOfFirstItem={indexOfFirstItem}
                                                indexOfLastItem={indexOfLastItem}
                                            />  
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
