import React, { useState, useEffect, useMemo } from "react";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { Card, CardBody, Col, Row, Table, Button } from "reactstrap";
import axios from "axios";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Paginations from "../../components/Common/Pagination";

const stateCodes = {
  "Jammu & Kashmir": "01",
  "Himachal Pradesh": "02",
  Punjab: "03",
  Chandigarh: "04",
  Uttarakhand: "05",
  Haryana: "06",
  Delhi: "07",
  Rajasthan: "08",
  "Uttar Pradesh": "09",
  Bihar: "10",
  Sikkim: "11",
  "Arunachal Pradesh": "12",
  Nagaland: "13",
  Manipur: "14",
  Mizoram: "15",
  Tripura: "16",
  Meghalaya: "17",
  Assam: "18",
  "West Bengal": "19",
  Jharkhand: "20",
  Odisha: "21",
  Chhattisgarh: "22",
  "Madhya Pradesh": "23",
  Gujarat: "24",
  "Daman & Diu": "25",
  "Dadra & Nagar Haveli": "26",
  Maharashtra: "27",
  Karnataka: "29",
  Goa: "30",
  Lakshadweep: "31",
  Kerala: "32",
  "Tamil Nadu": "33",
  Puducherry: "34",
  "Andaman & Nicobar Islands": "35",
  Telangana: "36",
  "Andhra Pradesh": "37",
  Ladakh: "38",
};

const GSTReport = () => {
  const token = localStorage.getItem("token");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(100);
  const [totalCount, setTotalCount] = useState(0);

  const [allGSTData, setAllGSTData] = useState([]);
  const [filteredGSTData, setFilteredGSTData] = useState([]);

  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  document.title = "GST Report | Beposoft";

  const baseURL = `${import.meta.env.VITE_APP_KEY}gst/orders/`;

  const formatDate = (dateValue) => {
    if (!dateValue) return "";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
      })
      .replace(/ /g, "-");
  };

  const getDateOnly = (dateValue) => {
    if (!dateValue) return null;

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  };

  const getInputDateOnly = (dateValue) => {
    if (!dateValue) return null;

    const parts = dateValue.split("-");

    if (parts.length !== 3) {
      return null;
    }

    const year = Number(parts[0]);
    const month = Number(parts[1]) - 1;
    const day = Number(parts[2]);

    return new Date(year, month, day);
  };

  const fetchAllGSTData = async () => {
    setLoading(true);

    try {
      const firstResponse = await axios.get(baseURL, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: 1,
          page_size: pageSize,
        },
      });

      const firstData = firstResponse.data;
      const total = Number(firstData?.count || 0);
      const totalPages = Math.ceil(total / pageSize);

      let allResults = Array.isArray(firstData?.results)
        ? [...firstData.results]
        : [];

      for (let page = 2; page <= totalPages; page++) {
        const { data } = await axios.get(baseURL, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            page,
            page_size: pageSize,
          },
        });

        if (Array.isArray(data?.results)) {
          allResults = [...allResults, ...data.results];
        }
      }

      setAllGSTData(allResults);
      setFilteredGSTData(allResults);
      setTotalCount(allResults.length);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
      toast.error("Error fetching GST data");
      setAllGSTData([]);
      setFilteredGSTData([]);
      setTotalCount(0);
      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllGSTData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleFilter = () => {
    const selectedStartDate = getInputDateOnly(startDate);
    const selectedEndDate = getInputDateOnly(endDate);

    if (selectedStartDate && selectedEndDate && selectedStartDate > selectedEndDate) {
      toast.error("Start date cannot be greater than end date");
      return;
    }

    const filtered = allGSTData.filter((row) => {
      const orderDate = getDateOnly(row.order_date);

      if (!orderDate) {
        return false;
      }

      let isValid = true;

      if (selectedStartDate) {
        isValid = isValid && orderDate >= selectedStartDate;
      }

      if (selectedEndDate) {
        isValid = isValid && orderDate <= selectedEndDate;
      }

      return isValid;
    });

    setFilteredGSTData(filtered);
    setTotalCount(filtered.length);
    setCurrentPage(1);
  };

  const handleClearFilter = () => {
    setStartDate("");
    setEndDate("");
    setFilteredGSTData(allGSTData);
    setTotalCount(allGSTData.length);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const paginatedGSTData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return filteredGSTData.slice(startIndex, endIndex);
  }, [filteredGSTData, currentPage, pageSize]);

  const tableRows = useMemo(() => {
    return paginatedGSTData.flatMap((row, idx) => {
      const grouped =
        row.items?.reduce((acc, item) => {
          const taxKey = item.tax ?? "0";
          acc[taxKey] = acc[taxKey] || [];
          acc[taxKey].push(item);
          return acc;
        }, {}) || {};

      return Object.entries(grouped).map(([taxRate], i) => ({
        key: `${row.id}-${taxRate}-${i}`,
        index: (currentPage - 1) * pageSize + idx + 1,
        gst: row.gst || "",
        receiver: row.customerName || "",
        invoice: row.invoice || "",
        date: formatDate(row.order_date),
        placeOfSupply: stateCodes[row.address]
          ? `${stateCodes[row.address]}-${row.address}`
          : row.address || "",
        taxRate: `${taxRate}%`,
        invoiceType:
          (row.gst_confirm || "").toString().trim().toUpperCase() === "YES"
            ? "Regular B2B"
            : "Regular B2C",
      }));
    });
  }, [paginatedGSTData, currentPage, pageSize]);

  const exportCombinedExcel = async () => {
    try {
      const allResults = [...filteredGSTData];

      if (!allResults.length) {
        toast.warning("No data to export");
        return;
      }

      const b2bRows = [];
      const b2cRows = [];

      allResults.forEach((row, index) => {
        const gstConfirm = (row.gst_confirm || "")
          .toString()
          .trim()
          .toUpperCase();

        const groupedByTax = (row.items || []).reduce((acc, item) => {
          const taxKey = item.tax ?? "0";
          acc[taxKey] = acc[taxKey] || [];
          acc[taxKey].push(item);
          return acc;
        }, {});

        Object.entries(groupedByTax).forEach(([taxRate]) => {
          const baseRow = {
            "#": index + 1,
            "GSTIN/UIN Number": row.gst || "",
            "Receiver Name": row.customerName || "",
            "Invoice Number": row.invoice || "",
            "Invoice Date": formatDate(row.order_date),
            "Invoice Value": "",
            "Place of Supply": stateCodes[row.address]
              ? `${stateCodes[row.address]}-${row.address}`
              : row.address || "",
            "Reverse Charge": "N",
            "Applicable % of Tax": "",
            "E-Commerce GSTIN": "",
            Rate: `${taxRate}%`,
            "Taxable Value": "",
            "Cess Amount": "",
          };

          if (gstConfirm === "YES") {
            b2bRows.push({
              ...baseRow,
              "Invoice Type": "Regular B2B",
            });
          } else if (gstConfirm === "NO GST") {
            b2cRows.push({
              ...baseRow,
              "Invoice Type": "Regular B2C",
            });
          } else {
            if (row.gst) {
              b2bRows.push({
                ...baseRow,
                "Invoice Type": "Regular B2B",
              });
            } else {
              b2cRows.push({
                ...baseRow,
                "Invoice Type": "Regular B2C",
              });
            }
          }
        });
      });

      const b2bSheet = XLSX.utils.json_to_sheet(b2bRows);
      const b2cSheet = XLSX.utils.json_to_sheet(b2cRows);

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
          const qty = parseFloat(item.quantity) || 0;
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

      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workbook, b2bSheet, "B2B (GST YES)");
      XLSX.utils.book_append_sheet(workbook, b2cSheet, "B2C (NO GST)");
      XLSX.utils.book_append_sheet(workbook, hsnSheet, "HSN Summary");

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      saveAs(
        new Blob([excelBuffer], { type: "application/octet-stream" }),
        "GST_Report_B2B_B2C_With_HSN.xlsx"
      );
    } catch (e) {
      console.error(e);
      toast.error("Export failed");
    }
  };

  const paginationDataProxy = useMemo(
    () => ({ length: totalCount }),
    [totalCount]
  );

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
                    <Button
                      color="primary"
                      onClick={handleFilter}
                      disabled={loading}
                    >
                      {loading ? "Filtering..." : "Filter"}
                    </Button>

                    <Button
                      color="secondary"
                      onClick={handleClearFilter}
                      disabled={loading}
                      className="ms-2"
                    >
                      Clear
                    </Button>
                  </Col>

                  <Col md={3} className="d-flex align-items-end">
                    <Button
                      color="success"
                      onClick={exportCombinedExcel}
                      disabled={loading || !totalCount}
                    >
                      Export GST + HSN Excel
                    </Button>
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col md={12}>
                    <div
                      style={{
                        background: "#f8f9fa",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        padding: "10px 14px",
                        fontSize: "14px",
                        fontWeight: 500,
                      }}
                    >
                      Showing{" "}
                      <span style={{ fontWeight: 700 }}>
                        {totalCount === 0
                          ? 0
                          : (currentPage - 1) * pageSize + 1}
                      </span>{" "}
                      to{" "}
                      <span style={{ fontWeight: 700 }}>
                        {Math.min(currentPage * pageSize, totalCount)}
                      </span>{" "}
                      of <span style={{ fontWeight: 700 }}>{totalCount}</span>{" "}
                      records
                    </div>
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
                            <td>{r.invoiceType}</td>
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
                  data={paginationDataProxy}
                  currentPage={currentPage}
                  setCurrentPage={handlePageChange}
                  isShowingPageLength
                  paginationDiv="col-auto"
                  paginationClass="pagination"
                  indexOfFirstItem={
                    totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1
                  }
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