import React, { useState, useEffect, useMemo } from "react";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import {
  Card,
  CardBody,
  Col,
  Row,
  Table,
  Input,
  Label,
  Button,
} from "reactstrap";
import axios from "axios";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import Paginations from "../../components/Common/Pagination";

const TrackingReport = () => {
  const token = localStorage.getItem("token");

  // Flat list of items from the grouped API (services[].items -> flattened)
  const [items, setItems] = useState([]);
  // For dropdown, derive from API services or keep your old endpoint if you prefer
  const [parcelServices, setParcelServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedParcelService, setSelectedParcelService] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const perPageData = 10;

  // Fetch grouped parcel data
  const fetchData = async () => {
    try {
      const params = {};
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;

      const res = await axios.get(
        `${import.meta.env.VITE_APP_KEY}orders/parcel/service/data/`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params,
        }
      );

      const services = res?.data?.services || [];

      // Build parcel service dropdown values from response
      const ps = services
        .map((s) => ({
          id: s.parcel_service_id,
          name: s.parcel_service_name,
        }))
        .filter((s) => !!s.name);

      setParcelServices(ps);

      // Flatten items with service name/id attached
      const flat = services.flatMap((svc) =>
        (svc.items || []).map((it) => ({
          ...it,
          parcel_service_id: svc.parcel_service_id,
          parcel_service_name: svc.parcel_service_name,
        }))
      );

      setItems(flat);
      setCurrentPage(1);
    } catch (e) {
      console.error(e);
      toast.error("Error fetching parcel service data");
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate]); // re-fetch when date range changes

  // Handlers
  const handleSearch = (e) => setSearchTerm(e.target.value.toLowerCase());
  const handleFromDate = (e) => setFromDate(e.target.value);
  const handleToDate = (e) => setToDate(e.target.value);

  // Helpers
  const parseNum = (v) => {
    if (v === null || v === undefined || v === "") return 0;
    const n = typeof v === "string" ? parseFloat(v) : Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const matchesSearch = (it, term) => {
    if (!term) return true;
    const t = term.toLowerCase();
    return (
      (it.invoice || "").toLowerCase().includes(t) ||
      (it.customerName || "").toLowerCase().includes(t) ||
      (it.tracking_id || "").toLowerCase().includes(t) ||
      (it.parcel_service || it.parcel_service_name || "")
        .toLowerCase()
        .includes(t)
    );
  };

  const withinDateRange = (it) => {
    if (!it.shipped_date) return false;
    const d = new Date(it.shipped_date);
    const okFrom = fromDate ? d >= new Date(fromDate) : true;
    const okTo = toDate ? d <= new Date(toDate) : true;
    return okFrom && okTo;
  };

  const matchesService = (it) => {
    if (!selectedParcelService) return true;
    const name = it.parcel_service || it.parcel_service_name || "";
    return name === selectedParcelService;
  };

  // Client-side filtered data (you’re also filtering server-side by dates already)
  const filtered = useMemo(() => {
    return items.filter(
      (it) => withinDateRange(it) && matchesService(it) && matchesSearch(it, searchTerm)
    );
  }, [items, searchTerm, fromDate, toDate, selectedParcelService]);

  // Totals (based on filtered)
  const totals = filtered.reduce(
    (acc, it) => {
      acc.invoiceAmount += parseNum(it.total_amount);
      acc.trackingAmount += parseNum(it.parcel_amount);
      acc.postWeight += parseNum(it.weight);
      acc.actualWeight += parseNum(it.actual_weight);
      acc.volumeWeight += parseNum(it.volume_weight);
      acc.totalAverage += parseNum(it.average);

      if (it.box) acc.boxCount += 1;

      const svc = it.parcel_service || it.parcel_service_name || "UNKNOWN";
      acc.parcelServices[svc] = (acc.parcelServices[svc] || 0) + 1;

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

  // Pagination
  const indexOfLastItem = currentPage * perPageData;
  const indexOfFirstItem = indexOfLastItem - perPageData;
  const currentData = filtered.slice(indexOfFirstItem, indexOfLastItem);

  // Excel export
  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();
    const sheetData = [];

    // Title
    sheetData.push(["ORDER TRACKING REPORT"]);
    sheetData.push([]);

    // Headers
    const tableHeaders = [
      "#",
      "Date",
      "Invoice",
      "Customer",
      "Invoice Amount",
      "Tracking Amount",
      "Tracking ID",
      "Parcel Service",
      "Post Office Weight",
      "Actual Weight",
      "Volume Weight",
      "Box",
      "Average",
    ];

    // Group by service
    const grouped = filtered.reduce((acc, it) => {
      const svc = it.parcel_service || it.parcel_service_name || "UNKNOWN";
      if (!acc[svc]) acc[svc] = [];
      acc[svc].push(it);
      return acc;
    }, {});

    Object.entries(grouped).forEach(([service, entries]) => {
      sheetData.push([service]);
      sheetData.push(tableHeaders);
      entries.forEach((it, idx) => {
        sheetData.push([
          idx + 1,
          it.shipped_date || "--",
          it.invoice || "--",
          it.customerName || "--",
          (parseNum(it.total_amount) || 0).toFixed(2),
          it.parcel_amount ?? "--",
          it.tracking_id || "--",
          it.parcel_service || it.parcel_service_name || "--",
          it.weight ?? "0.00",
          it.actual_weight ?? "0.00",
          it.volume_weight ?? "0.00",
          it.box || "--",
          it.average ?? "--",
        ]);
      });
      sheetData.push([]);
    });

    // Summary
    sheetData.push([]);
    sheetData.push(["Summary"]);
    sheetData.push([
      "Total Invoice Amount",
      totals.invoiceAmount.toFixed(2),
      "Total Tracking Amount",
      totals.trackingAmount.toFixed(2),
    ]);
    sheetData.push([
      "Total Post Office Weight",
      totals.postWeight.toFixed(2),
      "Total Actual Weight",
      totals.actualWeight.toFixed(2),
    ]);
    sheetData.push([
      "Total Volume Weight",
      totals.volumeWeight.toFixed(2),
      "Total Average",
      totals.totalAverage.toFixed(2),
    ]);
    sheetData.push([
      "Total Boxes",
      totals.boxCount,
      "Total Parcel Services",
      Object.keys(totals.parcelServices).length,
    ]);

    // Service-wise count
    sheetData.push([]);
    sheetData.push(["Parcel Service-wise Count"]);
    sheetData.push(["Parcel Service", "Count"]);
    Object.entries(totals.parcelServices).forEach(([service, count]) => {
      sheetData.push([service, count]);
    });
    sheetData.push(["Total", totalParcelServiceCount]);

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
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
                onChange={(e) => {
                  setSelectedParcelService(e.target.value);
                  setCurrentPage(1);
                }}
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
              <Button color="success" onClick={exportToExcel}>
                Export to Excel
              </Button>
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
                          {[
                            "#",
                            "Date",
                            "Invoice",
                            "Customer",
                            "Invoice Amount",
                            "Tracking Amount",
                            "Tracking ID",
                            "Parcel Service",
                            "Post Office Weight",
                            "Actual Weight",
                            "Volume Weight",
                            "Box",
                            "Average",
                          ].map((h) => (
                            <th
                              key={h}
                              style={{
                                border: "1px solid black",
                                backgroundColor: "#30D5C8",
                              }}
                            >
                              <strong>{h}</strong>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {currentData?.map((it, index) => (
                          <tr key={`${it.invoice}-${it.tracking_id}-${index}`}>
                            <td style={{ border: "1px solid black" }}>
                              <strong>{indexOfFirstItem + index + 1}</strong>
                            </td>
                            <td style={{ border: "1px solid black" }}>
                              <strong>{it.shipped_date || "--"}</strong>
                            </td>
                            <td style={{ border: "1px solid black" }}>
                              <strong>{it.invoice || "--"}</strong>
                            </td>
                            <td style={{ border: "1px solid black" }}>
                              <strong>{it.customerName || "--"}</strong>
                            </td>
                            <td style={{ border: "1px solid black" }}>
                              <strong>
                                {(parseNum(it.total_amount) || 0).toFixed(2)}
                              </strong>
                            </td>
                            <td style={{ border: "1px solid black" }}>
                              <strong>{it.parcel_amount ?? "--"}</strong>
                            </td>
                            <td style={{ border: "1px solid black" }}>
                              <strong>{it.tracking_id || "--"}</strong>
                            </td>
                            <td style={{ border: "1px solid black" }}>
                              <strong>
                                {it.parcel_service ||
                                  it.parcel_service_name ||
                                  "--"}
                              </strong>
                            </td>
                            <td style={{ border: "1px solid black" }}>
                              <strong>{it.weight ?? "--"}</strong>
                            </td>
                            <td style={{ border: "1px solid black" }}>
                              <strong>{it.actual_weight ?? "--"}</strong>
                            </td>
                            <td style={{ border: "1px solid black" }}>
                              <strong>{it.volume_weight ?? "--"}</strong>
                            </td>
                            <td style={{ border: "1px solid black" }}>
                              <strong>{it.box || "--"}</strong>
                            </td>
                            <td style={{ border: "1px solid black" }}>
                              <strong>{it.average ?? "--"}</strong>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>

                    <hr />
                    <Row className="mt-4">
                      {/* Summary */}
                      <Col md={8}>
                        <h4 style={{ textAlign: "center" }}>Summary</h4>
                        <Table bordered>
                          <tbody>
                            <tr>
                              <td style={{ border: "1px solid black" }}>
                                <strong>Total Invoice Amount</strong>
                              </td>
                              <td style={{ border: "1px solid black" }}>
                                <strong>
                                  ₹ {totals.invoiceAmount.toFixed(2)}
                                </strong>
                              </td>
                              <td style={{ border: "1px solid black" }}>
                                <strong>Total Tracking Amount</strong>
                              </td>
                              <td style={{ border: "1px solid black" }}>
                                <strong>
                                  ₹ {totals.trackingAmount.toFixed(2)}
                                </strong>
                              </td>
                            </tr>
                            <tr>
                              <td style={{ border: "1px solid black" }}>
                                <strong>Total Post Office Weight</strong>
                              </td>
                              <td style={{ border: "1px solid black" }}>
                                <strong>{totals.postWeight.toFixed(2)}</strong>
                              </td>
                              <td style={{ border: "1px solid black" }}>
                                <strong>Total Actual Weight</strong>
                              </td>
                              <td style={{ border: "1px solid black" }}>
                                <strong>
                                  {totals.actualWeight.toFixed(2)}
                                </strong>
                              </td>
                            </tr>
                            <tr>
                              <td style={{ border: "1px solid black" }}>
                                <strong>Total Volume Weight</strong>
                              </td>
                              <td style={{ border: "1px solid black" }}>
                                <strong>
                                  {totals.volumeWeight.toFixed(2)}
                                </strong>
                              </td>
                              <td style={{ border: "1px solid black" }}>
                                <strong>Total Average</strong>
                              </td>
                              <td style={{ border: "1px solid black" }}>
                                <strong>
                                  {totals.totalAverage.toFixed(2)}
                                </strong>
                              </td>
                            </tr>
                            <tr>
                              <td style={{ border: "1px solid black" }}>
                                <strong>Total Boxes</strong>
                              </td>
                              <td style={{ border: "1px solid black" }}>
                                <strong>{totals.boxCount}</strong>
                              </td>
                              <td style={{ border: "1px solid black" }}>
                                <strong>Total Parcel Services</strong>
                              </td>
                              <td style={{ border: "1px solid black" }}>
                                <strong>
                                  {Object.keys(totals.parcelServices).length}
                                </strong>
                              </td>
                            </tr>
                          </tbody>
                        </Table>
                      </Col>

                      {/* Service counts */}
                      <Col md={4}>
                        <h4 style={{ textAlign: "center" }}>
                          Parcel Service-wise Count
                        </h4>
                        <Table bordered responsive>
                          <thead>
                            <tr>
                              <th
                                style={{
                                  border: "1px solid black",
                                  backgroundColor: "#30D5C8",
                                }}
                              >
                                Parcel Service
                              </th>
                              <th
                                style={{
                                  border: "1px solid black",
                                  backgroundColor: "#30D5C8",
                                }}
                              >
                                Count
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(totals.parcelServices).map(
                              ([service, count]) => (
                                <tr key={service}>
                                  <td style={{ border: "1px solid black" }}>
                                    <strong>{service}</strong>
                                  </td>
                                  <td style={{ border: "1px solid black" }}>
                                    <strong>{count}</strong>
                                  </td>
                                </tr>
                              )
                            )}
                            <tr>
                              <td style={{ border: "1px solid black" }}>
                                <strong>Total</strong>
                              </td>
                              <td style={{ border: "1px solid black" }}>
                                <strong>{totalParcelServiceCount}</strong>
                              </td>
                            </tr>
                          </tbody>
                        </Table>
                      </Col>
                    </Row>
                  </div>

                  {/* Pagination */}
                  <Paginations
                    perPageData={perPageData}
                    data={filtered}
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
