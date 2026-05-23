import React, { useState } from "react";
import { Card, CardBody, Col, Row, Table, Button, Input } from "reactstrap";
import axios from "axios";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const ShippingAddressExcelExportReport = () => {
  const token = localStorage.getItem("token");
  const apiBase = import.meta.env.VITE_APP_KEY;

  const [warehouseId] = useState("1");
  const [warehouseName, setWarehouseName] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);

  document.title = "Shipping Address Excel Export Report | Beposoft";

  const formatDateForDisplay = (dateValue) => {
    if (!dateValue) return "";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .replace(/ /g, "-");
  };

  const fetchShippingAddressReport = async () => {
    if (!warehouseId) {
      toast.error("Warehouse id is missing");
      return;
    }

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
      const url = `${apiBase}shipping/address/excel/export/${warehouseId}/${startDate}/${endDate}/`;

      const params = {};

      if (search.trim()) {
        params.search = search.trim();
      }

      const { data } = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params,
      });

      const results = Array.isArray(data?.results) ? data.results : [];

      setReportData(results);
      setWarehouseName(data?.warehouse_name || "");
    } catch (err) {
      console.error(err);
      toast.error("Error fetching shipping address report");

      setReportData([]);
      setWarehouseName("");
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    fetchShippingAddressReport();
  };

  const handleClearFilter = () => {
    setStartDate("");
    setEndDate("");
    setSearch("");
    setWarehouseName("");
    setReportData([]);
  };

  const getExportFileName = () => {
    const cleanWarehouseName = warehouseName
      ? warehouseName.toString().replace(/[^a-zA-Z0-9]/g, "_")
      : `Warehouse_${warehouseId}`;

    return `Shipping_Address_${cleanWarehouseName}_${startDate || "start"}_to_${
      endDate || "end"
    }.xlsx`;
  };

  const exportExcel = () => {
    try {
      if (!reportData.length) {
        toast.warning("No data to export");
        return;
      }

      const exportRows = reportData.map((item) => ({
        Name: item.name || "",
        "Bill - Name": item.bill_name || "",
        Address: item.address || "",
        State: item.state || "",
        Country: item.country || "",
        Pincode: item.pin_code || "",
      }));

      const sheet = XLSX.utils.json_to_sheet(exportRows, {
        header: ["Name", "Bill - Name", "Address", "State", "Country", "Pincode"],
      });

      sheet["!cols"] = [
        { wch: 30 },
        { wch: 30 },
        { wch: 80 },
        { wch: 25 },
        { wch: 18 },
        { wch: 15 },
      ];

      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workbook, sheet, "Shipping Address");

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      saveAs(
        new Blob([excelBuffer], { type: "application/octet-stream" }),
        getExportFileName()
      );
    } catch (err) {
      console.error(err);
      toast.error("Excel export failed");
    }
  };

  return (
    <div className="page-content">
      <div className="container-fluid">
        <Row>
          <Col lg={12}>
            <Card>
              <CardBody>
                <div
                  className="d-flex align-items-center justify-content-between flex-wrap gap-2"
                  style={{ marginBottom: "18px" }}
                >
                  <div>
                    <h4 className="mb-1">Shipping Address Excel Export Report</h4>
                    <div style={{ color: "#64748b", fontSize: "13px" }}>
                      Search shipping address details by name, bill name, address,
                      state, country, or pincode.
                    </div>
                  </div>

                  <Button
                    color="success"
                    onClick={exportExcel}
                    disabled={loading || !reportData.length}
                  >
                    Export Excel
                  </Button>
                </div>

                <Row className="mb-3">
                  <Col md={2}>
                    <label>Start Date</label>
                    <Input
                      type="date"
                      className="form-control"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </Col>

                  <Col md={2}>
                    <label>End Date</label>
                    <Input
                      type="date"
                      className="form-control"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </Col>

                  <Col md={4}>
                    <label>Search</label>
                    <Input
                      type="text"
                      className="form-control"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search name, bill name, address, state, country, pincode"
                    />
                  </Col>

                  <Col md={4} className="d-flex align-items-end">
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
                  <Col md={12}>
                    <div
                      style={{
                        background: "#f8f9fa",
                        border: "1px solid #e5e7eb",
                        borderRadius: "10px",
                        padding: "12px 14px",
                        fontSize: "14px",
                        fontWeight: 500,
                      }}
                    >
                      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                        <div>
                          Date:{" "}
                          <span style={{ fontWeight: 800 }}>
                            {formatDateForDisplay(startDate) || "-"} to{" "}
                            {formatDateForDisplay(endDate) || "-"}
                          </span>
                        </div>

                        <div>
                          Total Records:{" "}
                          <span style={{ fontWeight: 800 }}>
                            {reportData.length}
                          </span>
                        </div>
                      </div>

                      {warehouseName ? (
                        <div
                          style={{
                            marginTop: "6px",
                            color: "#475569",
                            fontSize: "13px",
                            fontWeight: 600,
                          }}
                        >
                          Warehouse: {warehouseName}
                        </div>
                      ) : null}
                    </div>
                  </Col>
                </Row>

                <div className="table-responsive">
                  <Table bordered striped hover>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Bill - Name</th>
                        <th>Address</th>
                        <th>State</th>
                        <th>Country</th>
                        <th>Pincode</th>
                      </tr>
                    </thead>

                    <tbody>
                      {!loading && reportData.length ? (
                        reportData.map((item, index) => (
                          <tr key={`${item.name}-${item.pin_code}-${index}`}>
                            <td>{item.name || "-"}</td>
                            <td>{item.bill_name || "-"}</td>
                            <td>{item.address || "-"}</td>
                            <td>{item.state || "-"}</td>
                            <td>{item.country || "-"}</td>
                            <td>{item.pin_code || "-"}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center">
                            {loading ? "Loading..." : "No records found"}
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

export default ShippingAddressExcelExportReport;