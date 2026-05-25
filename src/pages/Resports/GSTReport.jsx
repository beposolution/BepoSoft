import React, { useState, useEffect, useMemo } from "react";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { Card, CardBody, Col, Row, Table, Button } from "reactstrap";
import axios from "axios";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Paginations from "../../components/Common/Pagination";

const stateCodes = {
  "Jammu Kashmir": "01",
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
  Pondicherry: "34",
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
  const [companyList, setCompanyList] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  document.title = "GST Report | Beposoft";

  const apiBase = import.meta.env.VITE_APP_KEY;

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

  const normalizeCompanyList = (data) => {
    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.data)) {
      return data.data;
    }

    if (Array.isArray(data?.results)) {
      return data.results;
    }

    return [];
  };

  const getCompanyName = (company) => {
    return (
      company?.name ||
      company?.company_name ||
      company?.companyName ||
      company?.title ||
      `Company ${company?.id || ""}`
    );
  };

  const fetchCompanies = async () => {
    setCompanyLoading(true);

    try {
      const { data } = await axios.get(`${apiBase}company/data/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const companies = normalizeCompanyList(data);
      setCompanyList(companies);
    } catch (err) {
      // console.error(err);
      toast.error("Error fetching companies");
      setCompanyList([]);
    } finally {
      setCompanyLoading(false);
    }
  };

  const fetchGSTReport = async () => {
    if (!startDate) {
      toast.error("Please select start date");
      return;
    }

    if (!endDate) {
      toast.error("Please select end date");
      return;
    }

    if (startDate > endDate) {
      toast.error("Start date cannot be greater than end date");
      return;
    }

    setLoading(true);

    try {
      const url = `${apiBase}gst/orders/report/${startDate}/${endDate}/`;

      const params = {};

      if (selectedCompany) {
        params.company = selectedCompany;
      }

      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      const results = Array.isArray(data?.results) ? data.results : [];

      setAllGSTData(results);
      setFilteredGSTData(results);
      setTotalCount(results.length);
      setCurrentPage(1);
    } catch (err) {
      // console.error(err);
      toast.error("Error fetching GST report");
      setAllGSTData([]);
      setFilteredGSTData([]);
      setTotalCount(0);
      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleFilter = () => {
    fetchGSTReport();
  };

  const handleClearFilter = () => {
    setStartDate("");
    setEndDate("");
    setSelectedCompany("");
    setAllGSTData([]);
    setFilteredGSTData([]);
    setTotalCount(0);
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

      // return Object.entries(grouped).map(([taxRate, items], i) => {
      //   const numericTaxRate = parseFloat(taxRate) || 0;

      //   const taxableValue = items.reduce((sum, item) => {
      //     const excludePrice = parseFloat(item.exclude_price) || 0;
      //     const quantity = parseFloat(item.quantity) || 0;
      //     return sum + excludePrice * quantity;
      //   }, 0);

      //   const invoiceValue =
      //     numericTaxRate > 0
      //       ? taxableValue + (taxableValue * numericTaxRate) / 100
      //       : taxableValue;

      //   return {
      //     key: `${row.id}-${taxRate}-${i}`,
      //     index: (currentPage - 1) * pageSize + idx + 1,
      //     gst: row.gst || "",
      //     receiver: row.customerName || "",
      //     invoice: row.invoice || "",
      //     date: formatDate(row.order_date),
      //     total_amount: Number(invoiceValue.toFixed(2)),
      //     taxable_value: Number(taxableValue.toFixed(2)),
      //     placeOfSupply: stateCodes[row.address]
      //       ? `${stateCodes[row.address]}-${row.address}`
      //       : row.address || "",
      //     taxRate: `${taxRate}%`,
      //     invoiceType:
      //       (row.gst_confirm || "").toString().trim().toUpperCase() === "YES"
      //         ? "Regular B2B"
      //         : "Regular B2C",
      //   };
      // });


      return Object.entries(grouped).map(([taxRate, items], i) => {
        const numericTaxRate = parseFloat(taxRate) || 0;

        const taxableValue = items.reduce((sum, item) => {
          const excludePrice = parseFloat(item.exclude_price) || 0;
          const quantity = parseFloat(item.quantity) || 0;

          return sum + excludePrice * quantity;
        }, 0);

        const invoiceValue =
          numericTaxRate > 0
            ? taxableValue + (taxableValue * numericTaxRate) / 100
            : taxableValue;

        return {
          key: `${row.id}-${taxRate}-${i}`,
          index: (currentPage - 1) * pageSize + idx + 1,
          gst: row.gst || "",
          receiver: row.customerName || "",
          invoice: row.invoice || "",
          date: formatDate(row.order_date),
          total_amount: Number(invoiceValue.toFixed(2)),
          placeOfSupply: stateCodes[row.address]
            ? `${stateCodes[row.address]}-${row.address}`
            : row.address || "",
          taxRate: `${taxRate}%`,
          taxableValue: Number(taxableValue.toFixed(2)),
          invoiceType:
            (row.gst_confirm || "").toString().trim().toUpperCase() === "YES"
              ? "Regular B2B"
              : "Regular B2C",
        };
      });


    });
  }, [paginatedGSTData, currentPage, pageSize]);



  const getExportFileBaseName = () => {
    const selectedCompanyName = selectedCompany
      ? getCompanyName(
        companyList.find((c) => String(c.id) === String(selectedCompany))
      )
      : "All_Companies";

    const cleanCompanyName = selectedCompanyName
      .toString()
      .replace(/[^a-zA-Z0-9]/g, "_");

    return `${cleanCompanyName}_${startDate || "start"}_to_${endDate || "end"}`;
  };

  const downloadSingleExcel = (rows, sheetName, fileName) => {
    if (!rows.length) {
      toast.warning(`No data found for ${sheetName}`);
      return;
    }

    const sheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, sheet, sheetName);

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    saveAs(
      new Blob([excelBuffer], { type: "application/octet-stream" }),
      fileName
    );
  };


  const buildB2BB2CRows = () => {
    const allResults = [...filteredGSTData];

    const b2bRows = [];
    const b2cRows = [];

    allResults.forEach((row) => {
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

      Object.entries(groupedByTax).forEach(([taxRate, items]) => {
        // const invoiceValue = parseFloat(row.total_amount) || 0;
        // const numericTaxRate = parseFloat(taxRate) || 0;

        // const taxableValue =
        //   numericTaxRate > 0
        //     ? (invoiceValue * 100) / (100 + numericTaxRate)
        //     : invoiceValue;

        const numericTaxRate = parseFloat(taxRate) || 0;

        const taxableValue = items.reduce((sum, item) => {
          const excludePrice = parseFloat(item.exclude_price) || 0;
          const quantity = parseFloat(item.quantity) || 0;
          return sum + excludePrice * quantity;
        }, 0);

        const invoiceValue =
          numericTaxRate > 0
            ? taxableValue + (taxableValue * numericTaxRate) / 100
            : taxableValue;

        const baseRow = {
          "GSTIN/UIN of Recipient": row.gst || "",
          "Receiver Name": row.customerName || "",
          "Invoice Number": row.invoice || "",
          "Invoice date": formatDate(row.order_date),
          // "Invoice Value": row.total_amount || 0,
          "Invoice Value": Number(invoiceValue.toFixed(2)),
          "Place Of Supply": stateCodes[row.address]
            ? `${stateCodes[row.address]}-${row.address}`
            : row.address || "",
          "Reverse Charge": "N",
          "Applicable % of Tax Rate": "",
          "Invoice Type": "",
          "E-Commerce GSTIN": "",
          Rate: `${taxRate}`,
          "Taxable Value": Number(taxableValue.toFixed(4)),
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

    return { b2bRows, b2cRows };
  };

  const exportB2BExcel = () => {
    try {
      if (!filteredGSTData.length) {
        toast.warning("No data to export");
        return;
      }

      const { b2bRows } = buildB2BB2CRows();
      const fileBaseName = getExportFileBaseName();

      downloadSingleExcel(b2bRows, "B2B", `GST_B2B_${fileBaseName}.xlsx`);
    } catch (e) {
      // console.error(e);
      toast.error("B2B export failed");
    }
  };

  const exportB2CDetailedExcel = () => {
    try {
      if (!filteredGSTData.length) {
        toast.warning("No data to export");
        return;
      }

      const { b2cRows } = buildB2BB2CRows();
      const fileBaseName = getExportFileBaseName();

      downloadSingleExcel(b2cRows, "B2C", `GST_B2C_${fileBaseName}.xlsx`);
    } catch (e) {
      // console.error(e);
      toast.error("B2C export failed");
    }
  };

  const exportB2CExcel = () => {
    try {
      if (!filteredGSTData.length) {
        toast.warning("No data to export");
        return;
      }

      const { b2cRows } = buildB2BB2CRows();

      if (!b2cRows.length) {
        toast.warning("No B2C data found");
        return;
      }

      const summaryMap = {};

      b2cRows.forEach((row) => {
        const placeOfSupply = row["Place Of Supply"] || "";
        const rate = row.Rate || "0";
        const taxableValue = parseFloat(row["Taxable Value"]) || 0;

        const key = `${placeOfSupply}-${rate}`;

        if (!summaryMap[key]) {
          summaryMap[key] = {
            Type: "OE",
            "Place Of Supply": placeOfSupply,
            "Applicable % of Tax Rate": "",
            Rate: rate,
            "Taxable Value": 0,
            "Cess Amount": "",
            "E-Commerce GSTIN": "",
          };
        }

        summaryMap[key]["Taxable Value"] += taxableValue;
      });

      const summaryRows = Object.values(summaryMap)
        .map((row) => ({
          ...row,
          "Taxable Value": Number(row["Taxable Value"].toFixed(4)),
        }))
        .sort((a, b) => {
          const placeA = (a["Place Of Supply"] || "").toString().toLowerCase();
          const placeB = (b["Place Of Supply"] || "").toString().toLowerCase();

          if (placeA < placeB) return -1;
          if (placeA > placeB) return 1;

          const rateA = parseFloat(a.Rate) || 0;
          const rateB = parseFloat(b.Rate) || 0;

          return rateA - rateB;
        });

      const selectedCompanyName = selectedCompany
        ? getCompanyName(
          companyList.find((c) => String(c.id) === String(selectedCompany))
        )
        : "BEPOSITIVE";

      const titleCompany = selectedCompanyName.toString().toUpperCase();

      const fromDate = startDate ? new Date(startDate) : null;
      const monthYear = fromDate
        ? fromDate
          .toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          })
          .toUpperCase()
        : "";

      const title = `B2C ${titleCompany} ${monthYear}`;

      const sheetData = [
        [title],
        [
          "Type",
          "Place Of Supply",
          "Applicable % of Tax Rate",
          "Rate",
          "Taxable Value",
          "Cess Amount",
          "E-Commerce GSTIN",
        ],
        ...summaryRows.map((row) => [
          row.Type,
          row["Place Of Supply"],
          row["Applicable % of Tax Rate"],
          row.Rate,
          row["Taxable Value"],
          row["Cess Amount"],
          row["E-Commerce GSTIN"],
        ]),
      ];

      const sheet = XLSX.utils.aoa_to_sheet(sheetData);

      sheet["!merges"] = [
        {
          s: { r: 0, c: 0 },
          e: { r: 0, c: 6 },
        },
      ];

      sheet["!cols"] = [
        { wch: 10 },
        { wch: 28 },
        { wch: 28 },
        { wch: 10 },
        { wch: 18 },
        { wch: 18 },
        { wch: 25 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, sheet, "B2C");

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      const fileBaseName = getExportFileBaseName();

      saveAs(
        new Blob([excelBuffer], { type: "application/octet-stream" }),
        `GST_B2C_${fileBaseName}.xlsx`
      );
    } catch (e) {
      // console.error(e);
      toast.error("B2C export failed");
    }
  };

  const exportHSNExcel = () => {
    try {
      const allResults = [...filteredGSTData];

      if (!allResults.length) {
        toast.warning("No data to export");
        return;
      }

      const summaryMap = {};

      allResults.forEach((row) => {
        (row.items || []).forEach((item) => {
          const key = `${item.name}-${item.product}-${item.hsn}-${item.tax}`;

          if (!summaryMap[key]) {
            summaryMap[key] = {
              Description: item.name,
              HSN: item.hsn || "",
              Measurement: item.unit || "PCS",
              "Total Quantity": 0,
              "Tax Rate": item.tax || 0,
              "Total Taxable Value": 0,
              IGST: 0,
              "Central Tax": 0,
              "State Tax": 0,
              Cess: 0,
              TOTAL: 0,
            };
          }

          const taxable = parseFloat(item.exclude_price) || 0;
          const qty = parseFloat(item.quantity) || 0;
          const rate = parseFloat(item.tax) || 0;

          summaryMap[key]["Total Quantity"] += qty;
          // summaryMap[key]["Total Taxable Value"] += taxable;
          summaryMap[key]["Total Taxable Value"] += taxable * qty;

          // const taxAmount = (taxable * rate) / 100;
          const taxAmount = (taxable * qty * rate) / 100;

          if (row.gst) {
            summaryMap[key].IGST += taxAmount;
          } else {
            summaryMap[key]["Central Tax"] += taxAmount / 2;
            summaryMap[key]["State Tax"] += taxAmount / 2;
          }

          summaryMap[key].TOTAL =
            summaryMap[key]["Total Taxable Value"] +
            summaryMap[key].IGST +
            summaryMap[key]["Central Tax"] +
            summaryMap[key]["State Tax"] +
            summaryMap[key].Cess;
        });
      });

      const hsnRows = Object.values(summaryMap).map((row) => ({
        ...row,
        "Total Quantity": Number(row["Total Quantity"].toFixed(2)),
        "Total Taxable Value": Number(row["Total Taxable Value"].toFixed(2)),
        IGST: Number(row.IGST.toFixed(2)),
        "Central Tax": Number(row["Central Tax"].toFixed(2)),
        "State Tax": Number(row["State Tax"].toFixed(2)),
        Cess: Number(row.Cess.toFixed(2)),
        TOTAL: Number(row.TOTAL.toFixed(2)),
      }));

      const fileBaseName = getExportFileBaseName();

      downloadSingleExcel(
        hsnRows,
        "HSN Summary",
        `GST_HSN_${fileBaseName}.xlsx`
      );
    } catch (e) {
      // console.error(e);
      toast.error("HSN export failed");
    }
  };


  const paginationDataProxy = useMemo(
    () => ({ length: totalCount }),
    [totalCount]
  );

  return (
    <div className="page-content">
      <div className="container-fluid">
        {/* <Breadcrumbs title="Tables" breadcrumbItem="GST REPORT" /> */}

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

                  <Col md={3}>
                    <label>Company</label>
                    <select
                      className="form-control"
                      value={selectedCompany}
                      onChange={(e) => setSelectedCompany(e.target.value)}
                      disabled={companyLoading}
                    >
                      <option value="">All Companies</option>

                      {companyList.map((company) => (
                        <option key={company.id} value={company.id}>
                          {getCompanyName(company)}
                        </option>
                      ))}
                    </select>
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
                </Row>

                <Row className="mb-3">
                  <Col md={12} className="d-flex align-items-end gap-2 flex-wrap">
                    <Button
                      color="success"
                      onClick={exportB2BExcel}
                      disabled={loading || !totalCount}
                    >
                      Export B2B Excel
                    </Button>

                    <Button
                      color="primary"
                      onClick={exportB2CExcel}
                      disabled={loading || !totalCount}
                    >
                      Export B2C Excel
                    </Button>

                    <Button
                      color="info"
                      onClick={exportB2CDetailedExcel}
                      disabled={loading || !totalCount}
                    >
                      Export B2C Detailed Excel
                    </Button>

                    <Button
                      color="warning"
                      onClick={exportHSNExcel}
                      disabled={loading || !totalCount}
                    >
                      Export HSN Excel
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
                            <td>{r.total_amount}</td>
                            <td>{r.placeOfSupply}</td>
                            <td>N</td>
                            <td></td>
                            <td>{r.invoiceType}</td>
                            <td></td>
                            <td>{r.taxRate}</td>
                            <td>{r.taxableValue}</td>
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