import React, { useState, useEffect } from "react";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import {
    Card, CardBody, Col, Row, Table,
    Input, Label, Button
} from "reactstrap";
import axios from "axios";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import Paginations from "../../components/Common/Pagination";

const TrackingReport = () => {
    const token = localStorage.getItem("token");
    const [data, setData] = useState([]);
    const [parcelServices, setParcelServices] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [selectedParcelService, setSelectedParcelService] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const perPageData = 10;

    useEffect(() => {
        axios
            .get(`${import.meta.env.VITE_APP_KEY}parcal/service/`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then((response) => setParcelServices(response.data.data))
            .catch(() => toast.error("Error fetching parcel services"));
    }, [token]);

    useEffect(() => {
        const fetchTrackingData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}orders/tracking/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setData(response?.data?.results || []);
            } catch (error) {
                toast.error("Error fetching order data");
            }
        };
        fetchTrackingData();
    }, []);

    const handleSearch = (e) => setSearchTerm(e.target.value.toLowerCase());
    const handleFromDate = (e) => setFromDate(e.target.value);
    const handleToDate = (e) => setToDate(e.target.value);

    const filteredData = data.filter((tracking) => {
        const matchesSearch = tracking.invoice?.toLowerCase().includes(searchTerm) ||
            tracking.customerName?.toLowerCase().includes(searchTerm) ||
            tracking.warehouse_data?.some((w) =>
                w.tracking_id?.toLowerCase().includes(searchTerm) ||
                w.parcel_service?.toLowerCase().includes(searchTerm)
            );

        const filteredWarehouses = (tracking.warehouse_data || []).filter((w) => {
            if (!w.shipped_date) return false;

            const shippedDate = new Date(w.shipped_date);
            const isAfterFromDate = fromDate ? shippedDate >= new Date(fromDate) : true;
            const isBeforeToDate = toDate ? shippedDate <= new Date(toDate) : true;
            const matchesParcelService = selectedParcelService ? w.parcel_service === selectedParcelService : true;

            return isAfterFromDate && isBeforeToDate && matchesParcelService;
        });

        return matchesSearch && filteredWarehouses.length > 0;
    });

    const flattenedData = filteredData.flatMap((tracking) => {
        const filteredWarehouses = (tracking.warehouse_data || []).filter((w) => {
            if (!w.shipped_date) return false;

            const shippedDate = new Date(w.shipped_date);
            const isAfterFromDate = fromDate ? shippedDate >= new Date(fromDate) : true;
            const isBeforeToDate = toDate ? shippedDate <= new Date(toDate) : true;
            const matchesParcelService = selectedParcelService ? w.parcel_service === selectedParcelService : true;

            return w.tracking_id && w.tracking_id.trim() !== "0" && w.tracking_id.trim() !== "" &&
                isAfterFromDate && isBeforeToDate && matchesParcelService;
        });

        return filteredWarehouses.map((warehouse) => ({
            tracking,
            warehouse,
        }));
    });

    const totals = flattenedData.reduce(
        (acc, { tracking, warehouse }) => {
            acc.invoiceAmount += parseFloat(tracking.total_amount || 0);
            acc.trackingAmount += parseFloat(warehouse.parcel_amount || 0);
            acc.postWeight += parseFloat(warehouse.weight || 0);
            acc.actualWeight += parseFloat(warehouse.actual_weight || 0);
            acc.volumeWeight += parseFloat(warehouse.volume_weight || 0);
            acc.totalAverage += parseFloat(warehouse.average || 0);

            if (warehouse.box) acc.boxCount += 1;

            if (warehouse.parcel_service) {
                acc.parcelServices[warehouse.parcel_service] =
                    (acc.parcelServices[warehouse.parcel_service] || 0) + 1;
            }

            return acc;
        },
        {
            invoiceAmount: 0,
            trackingAmount: 0,
            postWeight: 0,
            actualWeight: 0,
            volumeWeight: 0,
            totalAverage: 0,
            boxCount: 0,
            parcelServices: {},
        }
    );

    const totalParcelServiceCount = Object.values(totals.parcelServices).reduce(
        (sum, count) => sum + count,
        0
    );

    const indexOfLastItem = currentPage * perPageData;
    const indexOfFirstItem = indexOfLastItem - perPageData;
    const currentData = flattenedData.slice(indexOfFirstItem, indexOfLastItem);

    const exportToExcel = () => {
        const excelData = flattenedData.map(({ tracking, warehouse }, i) => ({
            "#": i + 1,
            Date: tracking.order_date,
            Invoice: tracking.invoice,
            Customer: tracking.customerName,
            "Invoice Amount": tracking.total_amount,
            "Tracking Amount": warehouse?.parcel_amount || "--",
            "Tracking ID": warehouse?.tracking_id || "--",
            "Parcel Service": warehouse?.parcel_service || "--",
            "Post Office Weight": warehouse?.weight || "0.00",
            "Actual Weight": warehouse?.actual_weight || "0.00",
            "Volume Weight": warehouse?.volume_weight || "0.00",
            Box: warehouse?.box || "--",
            Average: warehouse?.average || "--",
        }));

        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Tracking Report");
        XLSX.writeFile(workbook, "Tracking_Report.xlsx");
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Tables" breadcrumbItem="ORDER TRACKING REPORT" />

                    {/* Filters */}
                    <Row className="mb-3">
                        <Col md={4}>
                            <Label>Search</Label>
                            <Input
                                type="text"
                                placeholder="Search by Invoice, Customer, Tracking ID, Parcel Service"
                                value={searchTerm}
                                onChange={handleSearch}
                            />
                        </Col>
                        <Col md={2}>
                            <Label>From Date</Label>
                            <Input type="date" value={fromDate} onChange={handleFromDate} />
                        </Col>
                        <Col md={2}>
                            <Label>To Date</Label>
                            <Input type="date" value={toDate} onChange={handleToDate} />
                        </Col>
                        <Col md={2}>
                            <Label>Parcel Service</Label>
                            <Input
                                type="select"
                                value={selectedParcelService}
                                onChange={(e) => setSelectedParcelService(e.target.value)}
                            >
                                <option value="">All</option>
                                {parcelServices?.map((service) => (
                                    <option key={service?.id} value={service?.name}>
                                        {service?.name}
                                    </option>
                                ))}
                            </Input>
                        </Col>
                        <Col md={2} className="d-flex align-items-end">
                            <Button color="success" onClick={exportToExcel}>Export to Excel</Button>
                        </Col>
                    </Row>

                    {/* Table */}
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <div className="table-responsive">
                                        <Table className="table mb-0">
                                            <thead>
                                                <tr>
                                                    <th style={{ border: "1px solid black", backgroundColor: "#30D5C8" }}><strong>#</strong></th>
                                                    <th style={{ border: "1px solid black", backgroundColor: "#30D5C8" }}><strong>Date</strong></th>
                                                    <th style={{ border: "1px solid black", backgroundColor: "#30D5C8" }}><strong>Invoice</strong></th>
                                                    <th style={{ border: "1px solid black", backgroundColor: "#30D5C8" }}><strong>Customer</strong></th>
                                                    <th style={{ border: "1px solid black", backgroundColor: "#30D5C8" }}><strong>Invoice Amount</strong></th>
                                                    <th style={{ border: "1px solid black", backgroundColor: "#30D5C8" }}><strong>Tracking Amount</strong></th>
                                                    <th style={{ border: "1px solid black", backgroundColor: "#30D5C8" }}><strong>Tracking ID</strong></th>
                                                    <th style={{ border: "1px solid black", backgroundColor: "#30D5C8" }}><strong>Parcel Service</strong></th>
                                                    <th style={{ border: "1px solid black", backgroundColor: "#30D5C8" }}><strong>Post Office Weight</strong></th>
                                                    <th style={{ border: "1px solid black", backgroundColor: "#30D5C8" }}><strong>Actual Weight</strong></th>
                                                    <th style={{ border: "1px solid black", backgroundColor: "#30D5C8" }}><strong>Volume Weight</strong></th>
                                                    <th style={{ border: "1px solid black", backgroundColor: "#30D5C8" }}><strong>Box</strong></th>
                                                    <th style={{ border: "1px solid black", backgroundColor: "#30D5C8" }}><strong>Average</strong></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentData?.map(({ tracking, warehouse }, index) => (
                                                    <tr key={`${tracking?.invoice}-${index}`}>
                                                        <td style={{ border: "1px solid black" }}><strong>{indexOfFirstItem + index + 1}</strong></td>
                                                        <td style={{ border: "1px solid black" }}><strong>{warehouse?.shipped_date || "--"}</strong></td>
                                                        <td style={{ border: "1px solid black" }}><strong>{tracking?.invoice}</strong></td>
                                                        <td style={{ border: "1px solid black" }}><strong>{tracking?.customerName}</strong></td>
                                                        <td style={{ border: "1px solid black" }}><strong>{tracking?.total_amount?.toFixed(2)}</strong></td>
                                                        <td style={{ border: "1px solid black" }}><strong>{warehouse?.parcel_amount || "--"}</strong></td>
                                                        <td style={{ border: "1px solid black" }}><strong>{warehouse?.tracking_id || "--"}</strong></td>
                                                        <td style={{ border: "1px solid black" }}><strong>{warehouse?.parcel_service || "--"}</strong></td>
                                                        <td style={{ border: "1px solid black" }}><strong>{warehouse?.weight || "--"}</strong></td>
                                                        <td style={{ border: "1px solid black" }}><strong>{warehouse?.actual_weight || "--"}</strong></td>
                                                        <td style={{ border: "1px solid black" }}><strong>{warehouse?.volume_weight || "--"}</strong></td>
                                                        <td style={{ border: "1px solid black" }}><strong>{warehouse?.box || "--"}</strong></td>
                                                        <td style={{ border: "1px solid black" }}><strong>{warehouse?.average || "--"}</strong></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                        <hr />
                                        <Row className="mt-4">
                                            {/* Summary Section (Left) */}
                                            <Col md={8}>
                                                <h4 style={{ textAlign: "center" }}>Summary</h4>
                                                <Table bordered>
                                                    <tbody>
                                                        <tr>
                                                            <td style={{ border: "1px solid black" }}><strong>Total Invoice Amount</strong></td>
                                                            <td style={{ border: "1px solid black" }}><strong>₹ {totals.invoiceAmount.toFixed(2)}</strong></td>
                                                            <td style={{ border: "1px solid black" }}><strong>Total Tracking Amount</strong></td>
                                                            <td style={{ border: "1px solid black" }}><strong>₹ {totals.trackingAmount.toFixed(2)}</strong></td>
                                                        </tr>
                                                        <tr>
                                                            <td style={{ border: "1px solid black" }}><strong>Total Post Office Weight</strong></td>
                                                            <td style={{ border: "1px solid black" }}><strong>{totals.postWeight.toFixed(2)}</strong></td>
                                                            <td style={{ border: "1px solid black" }}><strong>Total Actual Weight</strong></td>
                                                            <td style={{ border: "1px solid black" }}><strong>{totals.actualWeight.toFixed(2)}</strong></td>
                                                        </tr>
                                                        <tr>
                                                            <td style={{ border: "1px solid black" }}><strong>Total Volume Weight</strong></td>
                                                            <td style={{ border: "1px solid black" }}><strong>{totals.volumeWeight.toFixed(2)}</strong></td>
                                                            <td style={{ border: "1px solid black" }}><strong>Total Average</strong></td>
                                                            <td style={{ border: "1px solid black" }}><strong>{totals.totalAverage.toFixed(2)}</strong></td>
                                                        </tr>
                                                        <tr>
                                                            <td style={{ border: "1px solid black" }}><strong>Total Boxes</strong></td>
                                                            <td style={{ border: "1px solid black" }}><strong>{totals.boxCount}</strong></td>
                                                            <td style={{ border: "1px solid black" }}><strong>Total Parcel Services</strong></td>
                                                            <td style={{ border: "1px solid black" }}><strong>{Object.keys(totals.parcelServices).length}</strong></td>
                                                        </tr>
                                                    </tbody>
                                                </Table>
                                            </Col>

                                            {/* Parcel Service Count Section (Right) */}
                                            <Col md={4}>
                                                <h4 style={{ textAlign: "center" }}>Parcel Service-wise Count</h4>
                                                <Table bordered responsive>
                                                    <thead>
                                                        <tr>
                                                            <th style={{ border: "1px solid black", backgroundColor: "#30D5C8" }}>Parcel Service</th>
                                                            <th style={{ border: "1px solid black", backgroundColor: "#30D5C8" }}>Count</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {Object.entries(totals.parcelServices).map(([service, count]) => (
                                                            <tr key={service}>
                                                                <td style={{ border: "1px solid black" }}><strong>{service}</strong></td>
                                                                <td style={{ border: "1px solid black" }}><strong>{count}</strong></td>
                                                            </tr>
                                                        ))}
                                                        <tr>
                                                            <td style={{ border: "1px solid black" }}><strong>Total</strong></td>
                                                            <td style={{ border: "1px solid black" }}><strong>{totalParcelServiceCount}</strong></td>
                                                        </tr>
                                                    </tbody>
                                                </Table>
                                            </Col>
                                        </Row>
                                    </div>

                                    {/* Pagination */}
                                    <Paginations
                                        perPageData={perPageData}
                                        data={flattenedData}
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
        </React.Fragment>
    );
};

export default TrackingReport;
