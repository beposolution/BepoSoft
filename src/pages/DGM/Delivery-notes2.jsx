import React, { useState, useEffect } from "react";
import { Table, Row, Col, Card, CardBody, Input, Button } from "reactstrap";
import axios from "axios";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import * as XLSX from "xlsx";

const AverageAmountReport = () => {
    const [warehouseData, setWarehouseData] = useState([]);
    const [startDate, setStartDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split("T")[0];
    });
    const [endDate, setEndDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split("T")[0];
    });
    const [filteredData, setFilteredData] = useState([]);
    const token = localStorage.getItem("token");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}warehouse/get/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                let warehouses = [];
                response?.data?.results.forEach(order => {
                    if (Array.isArray(order.warehouses) && order.warehouses.length > 0) {
                        warehouses = warehouses.concat(order.warehouses);
                    }
                });
                setWarehouseData(warehouses);
            } catch (error) {
                console.error("Error fetching warehouse data:", error);
            }
        };

        fetchData();
    }, [token]);

    // Filter data between startDate and endDate and required fields, and calculate averageAmount
    const handleSearch = () => {
        const filtered = warehouseData
            .filter(item =>
                item.postoffice_date &&
                item.parcel_amount &&
                item.actual_weight &&
                item.postoffice_date >= startDate &&
                item.postoffice_date <= endDate
            )
            .map(item => ({
                ...item,
                averageAmount:
                    parseFloat(item.actual_weight) !== 0
                        ? (parseFloat(item.parcel_amount) / parseFloat(item.actual_weight)).toFixed(2)
                        : "0.00",
            }));
        setFilteredData(filtered);
    };

    // Show current date data by default on load
    useEffect(() => {
        handleSearch();
        // eslint-disable-next-line
    }, [warehouseData, startDate, endDate]);

    const exportToExcel = () => {
        const exportData = filteredData.map((item, index) => ({
            "#": index + 1,
            "Date": item.postoffice_date,
            "Parcel Service": item.parcel_service,
            "Average Amount (₹)": item.averageAmount,
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Parcel Report");

        XLSX.writeFile(workbook, "Parcel_Service_Report.xlsx");
    };

    return (
        <div className="page-content">
            <div className="container-fluid">
                <Breadcrumbs title="Forms" breadcrumbItem="PARCEL SERVICE REPORT" />
                <Row>
                    <Col xl={12}>
                        <Card>
                            <CardBody>
                                {/* Date Range Picker */}
                                <Row className="mb-3">
                                    <Col sm={3}>
                                        <Input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            placeholder="Start Date"
                                        />
                                    </Col>
                                    <Col sm={3}>
                                        <Input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            placeholder="End Date"
                                        />
                                    </Col>
                                    <Col sm={3}>
                                        <Button color="primary" onClick={handleSearch}>
                                            Search
                                        </Button>
                                    </Col >
                                    <Col sm={3}>
                                        <Button color="success" onClick={exportToExcel} className="ms-2">
                                            Export to Excel
                                        </Button>

                                    </Col>
                                </Row>

                                {/* Table */}
                                <div className="table-responsive">
                                    <Table className="table table-bordered table-sm text-center">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Date</th>
                                                <th>Parcel Service</th>
                                                <th>Average Amount (₹)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredData.length > 0 ? (
                                                filteredData.map((item, index) => (
                                                    <tr key={index}>
                                                        <th scope="row">{index + 1}</th>
                                                        <td>{item.postoffice_date}</td>
                                                        <td>{item.parcel_service}</td>
                                                        <td>₹ {item.averageAmount}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="4" className="text-center text-muted">
                                                        No data available for the selected date range
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default AverageAmountReport;