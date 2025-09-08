import React, { useState, useEffect } from "react";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import {
    Card,
    CardBody,
    Col,
    Row,
    Table,
    Button,
} from "reactstrap";
import axios from "axios";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Paginations from "../../components/Common/Pagination";

const GSTReport = () => {
    const [gstData, setGSTData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPageData] = useState(10);
    const token = localStorage.getItem("token");

    document.title = "GST Report | Beposoft";

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_APP_KEY}gst/orders/`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (response?.data?.success) {
                    setGSTData(response?.data?.data);
                }
            } catch (error) {
                toast.error("Error fetching GST data");
            }
        };
        fetchUserData();
    }, []);

    const stateCodes = {
        "Jammu & Kashmir": "01",
        "Himachal Pradesh": "02",
        "Punjab": "03",
        "Chandigarh": "04",
        "Uttarakhand": "05",
        "Haryana": "06",
        "Delhi": "07",
        "Rajasthan": "08",
        "Uttar Pradesh": "09",
        "Bihar": "10",
        "Sikkim": "11",
        "Arunachal Pradesh": "12",
        "Nagaland": "13",
        "Manipur": "14",
        "Mizoram": "15",
        "Tripura": "16",
        "Meghalaya": "17",
        "Assam": "18",
        "West Bengal": "19",
        "Jharkhand": "20",
        "Odisha": "21",
        "Chhattisgarh": "22",
        "Madhya Pradesh": "23",
        "Gujarat": "24",
        "Daman & Diu": "25",
        "Dadra & Nagar Haveli": "26",
        "Maharashtra": "27",
        "Andhra Pradesh": "28",
        "Karnataka": "29",
        "Goa": "30",
        "Lakshadweep": "31",
        "Kerala": "32",
        "Tamil Nadu": "33",
        "Puducherry": "34",
        "Andaman & Nicobar Islands": "35",
        "Telangana": "36",
        "Andhra Pradesh": "37",
        "Ladakh": "38",
    };

    const indexOfLastItem = currentPage * perPageData;
    const indexOfFirstItem = indexOfLastItem - perPageData;
    const currentData = gstData.slice(indexOfFirstItem, indexOfLastItem);

    const exportToExcel = () => {
        if (gstData.length === 0) {
            toast.warning("No data to export");
            return;
        }

        const exportRows = [];

        gstData.forEach((row, index) => {
            const groupedByTax = row.items.reduce((acc, item) => {
                if (!acc[item.tax]) {
                    acc[item.tax] = [];
                }
                acc[item.tax].push(item);
                return acc;
            }, {});

            Object.entries(groupedByTax).forEach(([taxRate]) => {
                exportRows.push({
                    "#": index + 1,
                    "GSTIN/UIN Number": row.gst,
                    "Receiver Name": row.customerName,
                    "Invoice Number": row.invoice,
                    "Invoice Date": row.order_date
                        ? new Date(row.order_date).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "2-digit",
                        }).replace(/ /g, "-")
                        : "",
                    "Invoice Value": "",
                    "Place of Supply": stateCodes[row.address]
                        ? `${stateCodes[row.address]}-${row.address}`
                        : row.address,
                    "Reverse Charge": "N",
                    "Applicable % of Tax": "",
                    "Invoice Type": "Regular B2B",
                    "E-Commerce GSTIN": "",
                    "Rate": `${taxRate}%`,
                    "Taxable Value": "",
                    "Cess Amount": "",
                });
            });
        });

        const worksheet = XLSX.utils.json_to_sheet(exportRows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "GST Report");

        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const data = new Blob([excelBuffer], { type: "application/octet-stream" });
        saveAs(data, "GST_Report.xlsx");
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Tables" breadcrumbItem="GST REPORT" />

                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardBody>
                                    <h4 className="mb-3">GST Report</h4>
                                    <Row>
                                        <Col>
                                            <Button color="success" onClick={exportToExcel} className="mb-3">
                                                Export to Excel
                                            </Button>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <div className="table-responsive">
                                            <Table bordered striped hover>
                                                <thead>
                                                    <tr>
                                                        <th>#</th>
                                                        <th>GSTIN/UIN Number</th>
                                                        <th>Receiver Name</th>
                                                        <th>Invoice Number</th>
                                                        <th>Invoice Date</th>
                                                        <th>Invoice Value</th>
                                                        <th>Place of Supply</th>
                                                        <th>Reverse Charge</th>
                                                        <th>Applicable % of Tax</th>
                                                        <th>Invoice Type</th>
                                                        <th>E-Commerce GSTIN</th>
                                                        <th>Rate</th>
                                                        <th>Taxable Value</th>
                                                        <th>Cess Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {currentData.length > 0 ? (
                                                        currentData.map((row, index) => {
                                                            const groupedByTax = row.items.reduce((acc, item) => {
                                                                if (!acc[item.tax]) {
                                                                    acc[item.tax] = [];
                                                                }
                                                                acc[item.tax].push(item);
                                                                return acc;
                                                            }, {});
                                                            const taxGroups = Object.entries(groupedByTax);

                                                            return taxGroups.map(([taxRate, items], i) => (
                                                                <tr key={`${row.id}-${taxRate}-${i}`}>
                                                                    <td>{indexOfFirstItem + index + 1}</td>
                                                                    <td>{row.gst}</td>
                                                                    <td>{row.customerName}</td>
                                                                    <td>{row.invoice}</td>
                                                                    <td>
                                                                        {row.order_date
                                                                            ? new Date(row.order_date).toLocaleDateString("en-GB", {
                                                                                day: "2-digit",
                                                                                month: "short",
                                                                                year: "2-digit",
                                                                            }).replace(/ /g, "-")
                                                                            : ""}
                                                                    </td>
                                                                    <td></td>
                                                                    <td>
                                                                        {stateCodes[row.address]
                                                                            ? `${stateCodes[row.address]}-${row.address}`
                                                                            : row.address}
                                                                    </td>
                                                                    <td>N</td>
                                                                    <td></td>
                                                                    <td>Regular B2B</td>
                                                                    <td></td>
                                                                    <td>{taxRate}%</td>
                                                                    <td></td>
                                                                    <td></td>
                                                                </tr>
                                                            ));
                                                        })
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="14" className="text-center">
                                                                No records found
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </Table>
                                        </div>
                                    </Row>
                                    <Paginations
                                        perPageData={perPageData}
                                        data={gstData}
                                        currentPage={currentPage}
                                        setCurrentPage={setCurrentPage}
                                        isShowingPageLength={true}
                                        paginationDiv="col-auto"
                                        paginationClass="pagination"
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

export default GSTReport;
