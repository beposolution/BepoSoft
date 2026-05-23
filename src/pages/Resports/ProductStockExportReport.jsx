import React, { useMemo, useState } from "react";
import { Card, CardBody, Col, Row, Table, Button, Input } from "reactstrap";
import axios from "axios";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const ProductStockExportReport = () => {
  const token = localStorage.getItem("token");
  const apiBase = import.meta.env.VITE_APP_KEY;

  const [warehouseId] = useState("1");
  const [warehouseName, setWarehouseName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [stockData, setStockData] = useState([]);
  const [apiSearch, setApiSearch] = useState("");

  document.title = "Product Stock Export Report | Beposoft";

  const formatNumber = (value) => {
    const numberValue = Number(value || 0);

    return numberValue.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });
  };

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

  const filteredStockData = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) {
      return stockData;
    }

    return stockData.filter((item) =>
      (item.product_name || "").toString().toLowerCase().includes(searchValue)
    );
  }, [stockData, search]);

  const fetchProductStockReport = async () => {
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
      const url = `${apiBase}product/stock/excel/export/${warehouseId}/${startDate}/${endDate}/`;

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

      setStockData(results);
      setWarehouseName(data?.warehouse_name || "");
      setApiSearch(data?.search || "");
    } catch (err) {
      console.error(err);
      toast.error("Error fetching product stock report");

      setStockData([]);
      setWarehouseName("");
      setApiSearch("");
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    fetchProductStockReport();
  };

  const handleClearFilter = () => {
    setWarehouseName("");
    setStartDate("");
    setEndDate("");
    setSearch("");
    setApiSearch("");
    setStockData([]);
  };

  const handleSearchChange = (value) => {
    setSearch(value);
  };

  const getExportFileName = () => {
    const cleanWarehouseName = warehouseName
      ? warehouseName.toString().replace(/[^a-zA-Z0-9]/g, "_")
      : `Warehouse_${warehouseId}`;

    return `Product_Stock_${cleanWarehouseName}_${startDate || "start"}_to_${
      endDate || "end"
    }.xlsx`;
  };

  const exportExcel = () => {
    try {
      if (!filteredStockData.length) {
        toast.warning("No data to export");
        return;
      }

      const exportRows = filteredStockData.map((item) => ({
        Name: item.product_name || "",
        Units: item.units || "",
        "Opening Balance - Quantity": Number(item.stock || 0),
      }));

      const sheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workbook, sheet, "Product Stock");

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
                    <h4 className="mb-1">Product Stock Export Report</h4>
                    <div style={{ color: "#64748b", fontSize: "13px" }}>
                      View product stock with product name search.
                    </div>
                  </div>

                  <Button
                    color="success"
                    onClick={exportExcel}
                    disabled={loading || !filteredStockData.length}
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

                  <Col md={3}>
                    <label>Search Product Name</label>
                    <Input
                      type="text"
                      className="form-control"
                      value={search}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      placeholder="Search by product name"
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
                            {filteredStockData.length}
                          </span>
                        </div>
                      </div>

                      {apiSearch ? (
                        <div
                          style={{
                            marginTop: "6px",
                            color: "#475569",
                            fontSize: "13px",
                            fontWeight: 600,
                          }}
                        >
                          Search Applied: {apiSearch}
                        </div>
                      ) : null}
                    </div>
                  </Col>
                </Row>

                <div className="table-responsive">
                  <Table bordered striped hover>
                    <thead>
                      <tr>
                        <th style={{ width: "70px" }}>#</th>
                        <th>Name</th>
                        <th style={{ width: "160px" }}>Units</th>
                        <th style={{ width: "240px" }}>
                          Opening Balance - Quantity
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {!loading && filteredStockData.length ? (
                        filteredStockData.map((item, index) => (
                          <tr key={`${item.product_name}-${index}`}>
                            <td>{index + 1}</td>
                            <td style={{ fontWeight: 600 }}>
                              {item.product_name || "-"}
                            </td>
                            <td>{item.units || "-"}</td>
                            <td style={{ fontWeight: 700 }}>
                              {formatNumber(item.stock)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center">
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

export default ProductStockExportReport;