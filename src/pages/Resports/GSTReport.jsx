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
  const [allData, setAllData] = useState([]);
  // console.log("allData", allData)
  const [gstData, setGSTData] = useState([]);
  // console.log("gstData", gstData)
  const [currentPage, setCurrentPage] = useState(1);
  const [perPageData] = useState(10);
  const token = localStorage.getItem("token");

  // date filter states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  document.title = "GST Report | Beposoft";

  // Fetch all data once
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_APP_KEY}gst/orders/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response?.data?.success) {
          setAllData(response.data.data);
          setGSTData(response.data.data);
        }
      } catch {
        toast.error("Error fetching GST data");
      }
    };
    fetchUserData();
  }, [token]);

  // Front-end filtering
  const handleFilter = () => {
    if (!startDate && !endDate) {
      setGSTData(allData);
      return;
    }

    const filtered = allData.filter((row) => {
      if (!row.order_date) return false;

      const orderDate = new Date(row.order_date);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (start && !end) return orderDate >= start;
      if (!start && end) return orderDate <= end;
      return orderDate >= start && orderDate <= end;
    });

    setGSTData(filtered);
    setCurrentPage(1);
  };

  const stateCodes = {
    "Jammu & Kashmir": "01", "Himachal Pradesh": "02", "Punjab": "03",
    "Chandigarh": "04", "Uttarakhand": "05", "Haryana": "06", "Delhi": "07",
    "Rajasthan": "08", "Uttar Pradesh": "09", "Bihar": "10", "Sikkim": "11",
    "Arunachal Pradesh": "12", "Nagaland": "13", "Manipur": "14",
    "Mizoram": "15", "Tripura": "16", "Meghalaya": "17", "Assam": "18",
    "West Bengal": "19", "Jharkhand": "20", "Odisha": "21",
    "Chhattisgarh": "22", "Madhya Pradesh": "23", "Gujarat": "24",
    "Daman & Diu": "25", "Dadra & Nagar Haveli": "26", "Maharashtra": "27",
    "Karnataka": "29", "Goa": "30", "Lakshadweep": "31", "Kerala": "32",
    "Tamil Nadu": "33", "Puducherry": "34", "Andaman & Nicobar Islands": "35",
    "Telangana": "36", "Andhra Pradesh": "37", "Ladakh": "38",
  };

  // Pagination
  const indexOfLastItem = currentPage * perPageData;
  const indexOfFirstItem = indexOfLastItem - perPageData;
  const currentData = gstData.slice(indexOfFirstItem, indexOfLastItem);

  // Excel Export
  // const exportToExcel = () => {
  //   if (!gstData.length) {
  //     toast.warning("No data to export");
  //     return;
  //   }

  //   const exportRows = [];
  //   gstData.forEach((row, index) => {
  //     const groupedByTax = row.items.reduce((acc, item) => {
  //       (acc[item.tax] = acc[item.tax] || []).push(item);
  //       return acc;
  //     }, {});
  //     Object.entries(groupedByTax).forEach(([taxRate]) => {
  //       exportRows.push({
  //         "#": index + 1,
  //         "GSTIN/UIN Number": row.gst,
  //         "Receiver Name": row.customerName,
  //         "Invoice Number": row.invoice,
  //         "Invoice Date": row.order_date
  //           ? new Date(row.order_date).toLocaleDateString("en-GB", {
  //             day: "2-digit",
  //             month: "short",
  //             year: "2-digit",
  //           }).replace(/ /g, "-")
  //           : "",
  //         "Invoice Value": "",
  //         "Place of Supply": stateCodes[row.address]
  //           ? `${stateCodes[row.address]}-${row.address}`
  //           : row.address,
  //         "Reverse Charge": "N",
  //         "Applicable % of Tax": "",
  //         "Invoice Type": "Regular B2B",
  //         "E-Commerce GSTIN": "",
  //         "Rate": `${taxRate}%`,
  //         "Taxable Value": "",
  //         "Cess Amount": "",
  //       });
  //     });
  //   });

  //   const worksheet = XLSX.utils.json_to_sheet(exportRows);
  //   const workbook = XLSX.utils.book_new();
  //   XLSX.utils.book_append_sheet(workbook, worksheet, "GST Report");
  //   const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  //   saveAs(new Blob([excelBuffer], { type: "application/octet-stream" }), "GST_Report.xlsx");
  // };

  // const exportToHSNSummary = () => {
  //   if (!gstData.length) {
  //     toast.warning("No data to export");
  //     return;
  //   }

  //   const summaryMap = {};

  //   gstData.forEach((row) => {
  //     row.items.forEach((item) => {
  //       const key = `${item.name}-${item.product}`;
  //       if (!summaryMap[key]) {
  //         summaryMap[key] = {
  //           Description: item.name,
  //           HSN: item.hsn || "",       // make sure your API gives HSN
  //           measurement: item.unit || "PCS", // adjust based on your model
  //           TotalQuantity: 0,
  //           TaxRate: item.tax,
  //           TotalTaxableValue: 0,
  //           IGST: 0,
  //           CentralTax: 0,
  //           StateTax: 0,
  //           Cess: 0,
  //           TOTAL: 0,
  //         };
  //       }

  //       const taxable = parseFloat(item.exclude_price) || 0;
  //       const qty = item.quantity || 0;
  //       const rate = parseFloat(item.tax) || 0;

  //       summaryMap[key].TotalQuantity += qty;
  //       summaryMap[key].TotalTaxableValue += taxable;
  //       const taxAmount = (taxable * rate) / 100;

  //       // assuming intra-state (CGST+SGST) if gst is available, else IGST
  //       if (row.gst) {
  //         summaryMap[key].IGST += taxAmount;
  //       } else {
  //         summaryMap[key].CentralTax += taxAmount / 2;
  //         summaryMap[key].StateTax += taxAmount / 2;
  //       }
  //       summaryMap[key].TOTAL =
  //         summaryMap[key].TotalTaxableValue +
  //         summaryMap[key].IGST +
  //         summaryMap[key].CentralTax +
  //         summaryMap[key].StateTax;
  //     });
  //   });

  //   const exportRows = Object.values(summaryMap);

  //   const worksheet = XLSX.utils.json_to_sheet(exportRows);
  //   const workbook = XLSX.utils.book_new();
  //   XLSX.utils.book_append_sheet(workbook, worksheet, "HSN Summary");
  //   const excelBuffer = XLSX.write(workbook, {
  //     bookType: "xlsx",
  //     type: "array",
  //   });
  //   saveAs(
  //     new Blob([excelBuffer], { type: "application/octet-stream" }),
  //     "HSN_Summary.xlsx"
  //   );
  // };
  const exportCombinedExcel = () => {
    if (!gstData.length) {
      toast.warning("No data to export");
      return;
    }

    // -------- GST Report Sheet --------
    const gstRows = [];
    gstData.forEach((row, index) => {
      const groupedByTax = row.items.reduce((acc, item) => {
        (acc[item.tax] = acc[item.tax] || []).push(item);
        return acc;
      }, {});
      Object.entries(groupedByTax).forEach(([taxRate]) => {
        gstRows.push({
          "#": index + 1,
          "GSTIN/UIN Number": row.gst,
          "Receiver Name": row.customerName,
          "Invoice Number": row.invoice,
          "Invoice Date": row.order_date
            ? new Date(row.order_date)
              .toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "2-digit",
              })
              .replace(/ /g, "-")
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
    const gstSheet = XLSX.utils.json_to_sheet(gstRows);

    // -------- HSN Summary Sheet --------
    const summaryMap = {};
    gstData.forEach((row) => {
      row.items.forEach((item) => {
        const key = `${item.name}-${item.product}`;
        if (!summaryMap[key]) {
          summaryMap[key] = {
            Description: item.name,
            HSN: item.hsn || "",
            measurement: item.unit || "PCS",
            TotalQuantity: 0,
            TaxRate: item.tax,
            TotalTaxableValue: 0,
            IGST: 0,
            CentralTax: 0,
            StateTax: 0,
            Cess: 0,
            TOTAL: 0,
          };
        }

        const taxable = parseFloat(item.exclude_price) || 0;
        const qty = item.quantity || 0;
        const rate = parseFloat(item.tax) || 0;

        summaryMap[key].TotalQuantity += qty;
        summaryMap[key].TotalTaxableValue += taxable;
        const taxAmount = (taxable * rate) / 100;

        if (row.gst) {
          summaryMap[key].IGST += taxAmount;
        } else {
          summaryMap[key].CentralTax += taxAmount / 2;
          summaryMap[key].StateTax += taxAmount / 2;
        }

        summaryMap[key].TOTAL =
          summaryMap[key].TotalTaxableValue +
          summaryMap[key].IGST +
          summaryMap[key].CentralTax +
          summaryMap[key].StateTax;
      });
    });

    const hsnRows = Object.values(summaryMap);
    const hsnSheet = XLSX.utils.json_to_sheet(hsnRows);

    // -------- Create Workbook with 2 Sheets --------
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, gstSheet, "GST Report");
    XLSX.utils.book_append_sheet(workbook, hsnSheet, "HSN Summary");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([excelBuffer], { type: "application/octet-stream" }),
      "GST_Report_With_HSN.xlsx"
    );
  };

  return (
    <div className="page-content">
      <div className="container-fluid">
        <Breadcrumbs title="Tables" breadcrumbItem="GST REPORT" />
        <Row>
          <Col lg={12}>
            <Card>
              <CardBody>
                <h4 className="mb-3">GST Report</h4>

                {/* Date filter controls */}
                <Row className="mb-3">
                  <Col md={3}>
                    <label>Start Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </Col>
                  <Col md={3}>
                    <label>End Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </Col>
                  <Col md={3} className="d-flex align-items-end">
                    <Button color="primary" onClick={handleFilter}>
                      Filter
                    </Button>
                  </Col>
                  {/* <Col md={3} className="d-flex align-items-end">
                    <Button color="success" onClick={exportToExcel}>
                      Export to Excel
                    </Button>
                  </Col>
                  <Col md={3} className="d-flex align-items-end">
                    <Button color="success" onClick={exportToExcel}>
                      Export GST Report
                    </Button>
                  </Col>
                  <Col md={3} className="d-flex align-items-end">
                    <Button color="info" onClick={exportToHSNSummary}>
                      Export HSN Summary
                    </Button>
                  </Col> */}
                  <Col md={3} className="d-flex align-items-end">
                    <Button color="success" onClick={exportCombinedExcel}>
                      Export GST + HSN Excel
                    </Button>
                  </Col>

                </Row>

                {/* Data Table */}
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
                      {currentData.length ? (
                        currentData.flatMap((row, index) => {
                          const grouped = row.items.reduce((acc, item) => {
                            (acc[item.tax] = acc[item.tax] || []).push(item);
                            return acc;
                          }, {});
                          return Object.entries(grouped).map(([taxRate], i) => (
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

                {/* Pagination */}
                <Paginations
                  perPageData={perPageData}
                  data={gstData}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  isShowingPageLength
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
  );
};

export default GSTReport;
