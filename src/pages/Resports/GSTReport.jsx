import React, { useState, useEffect, useMemo } from "react";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { Card, CardBody, Col, Row, Table, Button } from "reactstrap";
import axios from "axios";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Paginations from "../../components/Common/Pagination";

const stateCodes = {
  "Jammu & Kashmir": "01","Himachal Pradesh": "02","Punjab": "03","Chandigarh": "04","Uttarakhand": "05","Haryana": "06","Delhi": "07",
  "Rajasthan": "08","Uttar Pradesh": "09","Bihar": "10","Sikkim": "11","Arunachal Pradesh": "12","Nagaland": "13","Manipur": "14",
  "Mizoram": "15","Tripura": "16","Meghalaya": "17","Assam": "18","West Bengal": "19","Jharkhand": "20","Odisha": "21",
  "Chhattisgarh": "22","Madhya Pradesh": "23","Gujarat": "24","Daman & Diu": "25","Dadra & Nagar Haveli": "26","Maharashtra": "27",
  "Karnataka": "29","Goa": "30","Lakshadweep": "31","Kerala": "32","Tamil Nadu": "33","Puducherry": "34","Andaman & Nicobar Islands": "35",
  "Telangana": "36","Andhra Pradesh": "37","Ladakh": "38",
};

const GSTReport = () => {
  const token = localStorage.getItem("token");

  // server-side paging states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(100); // backend default/limit; change if you want a selector
  const [totalCount, setTotalCount] = useState(0);

  // current page data (what table shows)
  const [gstData, setGSTData] = useState([]);
  const [loading, setLoading] = useState(false);

  // date filter states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  document.title = "GST Report | Beposoft";

  const baseURL = `${import.meta.env.VITE_APP_KEY}gst/orders/`;

  const fetchPage = async (page = 1, sDate = startDate, eDate = endDate) => {
    setLoading(true);
    try {
      const params = { page, page_size: pageSize };
      // if your Django view later supports these, they'll Just Work™
      if (sDate) params.start_date = sDate;
      if (eDate) params.end_date = eDate;

      const { data } = await axios.get(baseURL, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      // expects: { page, page_size, count, results }
      if (data && Array.isArray(data.results)) {
        setGSTData(data.results);
        setTotalCount(Number(data.count || 0));
        setCurrentPage(Number(data.page || page));
      } else {
        setGSTData([]);
        setTotalCount(0);
      }
    } catch (err) {
      toast.error("Error fetching GST data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleFilter = () => {
    // reset to page 1 with date params
    fetchPage(1, startDate, endDate);
  };

  // table rows per current page (group items by tax per order)
  const tableRows = useMemo(() => {
    return gstData.flatMap((row, idx) => {
      const grouped = row.items?.reduce((acc, item) => {
        (acc[item.tax] = acc[item.tax] || []).push(item);
        return acc;
      }, {}) || {};
      return Object.entries(grouped).map(([taxRate], i) => ({
        key: `${row.id}-${taxRate}-${i}`,
        index: idx + 1, // index within the page
        gst: row.gst || "",
        receiver: row.customerName || "",
        invoice: row.invoice || "",
        date: row.order_date
          ? new Date(row.order_date)
              .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })
              .replace(/ /g, "-")
          : "",
        placeOfSupply: stateCodes[row.address]
          ? `${stateCodes[row.address]}-${row.address}`
          : (row.address || ""),
        taxRate: `${taxRate}%`,
      }));
    });
  }, [gstData]);

  // Export: fetch all pages (respecting filters) and then create 2 sheets
  const exportCombinedExcel = async () => {
    try {
      // first: get page 1 to learn totalCount
      const first = await axios.get(baseURL, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: 1,
          page_size: pageSize,
          ...(startDate ? { start_date: startDate } : {}),
          ...(endDate ? { end_date: endDate } : {}),
        },
      });

      const total = Number(first.data?.count || 0);
      if (!total) {
        toast.warning("No data to export");
        return;
      }

      const totalPages = Math.ceil(total / pageSize);
      const allResults = [...(first.data?.results || [])];

      // pull remaining pages (2..N)
      for (let p = 2; p <= totalPages; p++) {
        // eslint-disable-next-line no-await-in-loop
        const { data } = await axios.get(baseURL, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            page: p,
            page_size: pageSize,
            ...(startDate ? { start_date: startDate } : {}),
            ...(endDate ? { end_date: endDate } : {}),
          },
        });
        if (Array.isArray(data?.results)) allResults.push(...data.results);
      }

      // -------- GST Report Sheet --------
      const gstRows = [];
      allResults.forEach((row, index) => {
        const groupedByTax = (row.items || []).reduce((acc, item) => {
          (acc[item.tax] = acc[item.tax] || []).push(item);
          return acc;
        }, {});
        Object.entries(groupedByTax).forEach(([taxRate]) => {
          gstRows.push({
            "#": index + 1,
            "GSTIN/UIN Number": row.gst || "",
            "Receiver Name": row.customerName || "",
            "Invoice Number": row.invoice || "",
            "Invoice Date": row.order_date
              ? new Date(row.order_date)
                  .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })
                  .replace(/ /g, "-")
              : "",
            "Invoice Value": "",
            "Place of Supply": stateCodes[row.address]
              ? `${stateCodes[row.address]}-${row.address}`
              : (row.address || ""),
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
      allResults.forEach((row) => {
        (row.items || []).forEach((item) => {
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

          // If buyer GST present treat as interstate (IGST). Adjust if you need actual place-of-supply vs your GST.
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

      // -------- Write workbook --------
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, gstSheet, "GST Report");
      XLSX.utils.book_append_sheet(workbook, hsnSheet, "HSN Summary");

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      saveAs(new Blob([excelBuffer], { type: "application/octet-stream" }), "GST_Report_With_HSN.xlsx");
    } catch (e) {
      toast.error("Export failed");
    }
  };

  // helper for Paginations: your component expects a "data" prop to know total pages.
  // We pass a lightweight object exposing only a .length equal to totalCount.
  const paginationDataProxy = useMemo(() => ({ length: totalCount }), [totalCount]);

  // when user clicks a page in Paginations, load that page from server
  const handlePageChange = (p) => {
    // some Paginations implementations pass the raw page index; adapt if needed
    fetchPage(p);
  };

  return (
    <div className="page-content">
      <div className="container-fluid">
        <Breadcrumbs title="Tables" breadcrumbItem="GST REPORT" />
        <Row>
          <Col lg={12}>
            <Card>
              <CardBody>
                <h4 className="mb-3">GST Report: B2B, B2C</h4>

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
                    <Button color="primary" onClick={handleFilter} disabled={loading}>
                      {loading ? "Filtering..." : "Filter"}
                    </Button>
                  </Col>
                  <Col md={3} className="d-flex align-items-end">
                    <Button color="success" onClick={exportCombinedExcel} disabled={loading || !totalCount}>
                      Export GST + HSN Excel
                    </Button>
                  </Col>
                </Row>

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
                      {!loading && tableRows.length ? (
                        tableRows.map((r) => (
                          <tr key={r.key}>
                            <td>{r.index}</td>
                            <td>{r.gst}</td>
                            <td>{r.receiver}</td>
                            <td>{r.invoice}</td>
                            <td>{r.date}</td>
                            <td></td>
                            <td>{r.placeOfSupply}</td>
                            <td>N</td>
                            <td></td>
                            <td>Regular B2B</td>
                            <td></td>
                            <td>{r.taxRate}</td>
                            <td></td>
                            <td></td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="14" className="text-center">
                            {loading ? "Loading..." : "No records found"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>

                <Paginations
                  perPageData={pageSize}
                  data={paginationDataProxy}   // proxy with .length = totalCount
                  currentPage={currentPage}
                  setCurrentPage={handlePageChange}
                  isShowingPageLength
                  paginationDiv="col-auto"
                  paginationClass="pagination"
                  indexOfFirstItem={(currentPage - 1) * pageSize + 1}
                  indexOfLastItem={Math.min(currentPage * pageSize, totalCount)}
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
