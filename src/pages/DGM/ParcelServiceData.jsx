import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { Table, Row, Col, Card, CardBody, Input, Button } from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import Paginations from "../../components/Common/Pagination";
import * as XLSX from "xlsx";

const ParcelServiceData = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { date, items } = location.state || {};
    const [parcelServices, setParcelServices] = useState([]);
    const token = localStorage.getItem("token");
    const [selectedService, setSelectedService] = useState("");
    const [filteredItems, setFilteredItems] = useState(items || []);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPageData, setPerPageData] = useState(15);

    const indexOfLastItem = currentPage * perPageData;
    const indexOfFirstItem = indexOfLastItem - perPageData;
    const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);

    useEffect(() => {
        axios
            .get(`${import.meta.env.VITE_APP_KEY}parcal/service/`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then((response) => setParcelServices(response.data.data))
            .catch(() => toast.error("Error fetching parcel services"));
    }, [token]);

    useEffect(() => {
        if (!selectedService) {
            setFilteredItems(items || []);
        } else {
            setFilteredItems(
                (items || []).filter(
                    (item) => item.parcel_service === selectedService
                )
            );
        }
    }, [selectedService, items]);

    // Totals calculation
    const totalCount = filteredItems.length;
    const totalParcelAmount = filteredItems.reduce((sum, item) => sum + parseFloat(item.parcel_amount || 0), 0);
    const totalWeight = filteredItems.reduce((sum, item) => sum + parseFloat(item.actual_weight || 0), 0);

    const exportToExcel = () => {
        const workbook = XLSX.utils.book_new();
        const sheetData = [];

        // Title row
        sheetData.push(["Parcel Service Report"]);
        sheetData.push(["Date:", date || "--"]);
        sheetData.push([]);

        // Table headers
        const headers = ["#", "Invoice", "Customer", "State", "Parcel Service", "Parcel Amount (₹)", "Weight", "Tracking ID"];
        sheetData.push(headers);

        // Data rows
        filteredItems.forEach((item, index) => {
            sheetData.push([
                index + 1,
                item.invoice,
                item.customer,
                item.order_state,
                item.parcel_service,
                parseFloat(item.parcel_amount || 0).toFixed(2),
                parseFloat(item.actual_weight || 0).toFixed(2),
                item.tracking_id
            ]);
        });

        // Totals row
        sheetData.push([]);
        sheetData.push([
            "Totals",
            "",
            "",
            "",
            totalCount,
            `₹ ${totalParcelAmount.toFixed(2)}`,
            `${totalWeight.toFixed(2)} kg`,
            ""
        ]);

        const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
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
                                <Row className="mb-3">
                                    <Col sm={4}>
                                        <label className="form-label">Filter by Parcel Service</label>
                                        <Input
                                            type="select"
                                            value={selectedService}
                                            onChange={(e) => setSelectedService(e.target.value)}
                                        >
                                            <option value="">All</option>
                                            {parcelServices.map((service) => (
                                                <option key={service.id} value={service.name}>
                                                    {service.name}
                                                </option>
                                            ))}
                                        </Input>
                                    </Col>
                                    <Col sm={2} className="d-flex align-items-end">
                                        <Button color="secondary" onClick={() => setSelectedService("")}>
                                            Clear
                                        </Button>
                                    </Col>
                                    <Col sm={2} className="d-flex align-items-end">
                                        <Button color="success" onClick={exportToExcel}>
                                            Export to Excel
                                        </Button>
                                    </Col>
                                </Row>
                                <div className="table-responsive">
                                    <Table className="table table-bordered table-sm text-center">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Invoice</th>
                                                <th>Customer</th>
                                                <th>State</th>
                                                <th>Parcel Service</th>
                                                <th>Parcel Amount (₹)</th>
                                                <th>Weight</th>
                                                <th>Tracking ID</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentItems?.map((item, index) => (
                                                <tr key={index}>
                                                    <td>{indexOfFirstItem + index + 1}</td>
                                                    <td>{item.invoice}</td>
                                                    <td>{item.customer}</td>
                                                    <td>{item.order_state}</td>
                                                    <td>{item.parcel_service}</td>
                                                    <td>₹ {item.parcel_amount}</td>
                                                    <td>{item.actual_weight}</td>
                                                    <td>{item.tracking_id}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <td colSpan="4"><strong>Totals</strong></td>
                                                <td><strong>{totalCount}</strong></td>
                                                <td><strong>₹ {totalParcelAmount.toFixed(2)}</strong></td>
                                                <td><strong>{totalWeight.toFixed(2)} kg</strong></td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </Table>
                                </div>
                                <Paginations
                                    perPageData={perPageData}
                                    data={filteredItems}
                                    currentPage={currentPage}
                                    setCurrentPage={setCurrentPage}
                                    isShowingPageLength={true}
                                    paginationDiv="col-auto"
                                    paginationClass="pagination-rounded"
                                    indexOfFirstItem={indexOfFirstItem}
                                    indexOfLastItem={indexOfLastItem}
                                />
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default ParcelServiceData;
