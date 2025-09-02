import React, { useState, useEffect } from "react";
import { Table, Row, Col, Card, CardBody, Input, Button } from "reactstrap";
import axios from "axios";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import Paginations from "../../components/Common/Pagination";

const AverageAmountReport = () => {
  const [warehouseData, setWarehouseData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const token = localStorage.getItem("token");
  const [currentPage, setCurrentPage] = useState(1);
  const perPageData = 15;

  const indexOfLastItem = currentPage * perPageData;
  const indexOfFirstItem = indexOfLastItem - perPageData;
  const currentData = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_APP_KEY}warehouse/get/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        let warehouses = [];
        response?.data?.results.forEach((order) => {
          if (Array.isArray(order.warehouses) && order.warehouses.length > 0) {
            warehouses = warehouses.concat(order.warehouses);
          }
        });

        setWarehouseData(warehouses);
        groupAndSetFilteredData(warehouses);
      } catch (error) {
        toast.error("Error fetching warehouse data");
      }
    };

    fetchData();
  }, [token]);

  const groupAndSetFilteredData = (data) => {
    const grouped = {};

    data.forEach((item) => {
      const date = item.postoffice_date;
      if (!grouped[date]) {
        grouped[date] = {
          date,
          count: 0,
          totalAmount: 0,
          totalWeight: 0,
          items: [],
        };
      }

      grouped[date].count += 1;
      grouped[date].totalAmount += parseFloat(item.parcel_amount || 0);
      grouped[date].totalWeight += parseFloat(item.actual_weight || 0) / 1000;
      grouped[date].items.push(item);
    });

    const sorted = Object.values(grouped).sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    setFilteredData(sorted);
  };

  // Helper: inclusive range check. Works with "YYYY-MM-DD" as string compare.
  const inRange = (dateStr, from, to) => {
    if (from && dateStr < from) return false;
    if (to && dateStr > to) return false;
    return true;
  };

  const handleRangeSearch = () => {
    if (!startDate && !endDate) {
      toast.warning("Please select a Start Date and/or End Date.");
      return;
    }
    if (startDate && endDate && startDate > endDate) {
      toast.error("Start Date cannot be after End Date.");
      return;
    }

    const filtered = warehouseData.filter((item) =>
      inRange(item.postoffice_date, startDate, endDate)
    );

    groupAndSetFilteredData(filtered);
    setCurrentPage(1);
  };

  const handleClear = () => {
    setStartDate("");
    setEndDate("");
    groupAndSetFilteredData(warehouseData);
    setCurrentPage(1);
  };

  const navigate = useNavigate();

  const handleView = (date, items) => {
    navigate(`/parcel/report/datewise/details/`, {
      state: { date, items },
    });
  };

  const totalCount = filteredData.reduce((sum, group) => sum + group.count, 0);
  const totalAmount = filteredData.reduce(
    (sum, group) => sum + group.totalAmount,
    0
  );
  const totalWeight = filteredData.reduce(
    (sum, group) => sum + group.totalWeight,
    0
  );
  const totalAverage =
    totalWeight !== 0 ? (totalAmount / totalWeight).toFixed(2) : "0.00";

  return (
    <div className="page-content">
      <div className="container-fluid">
        <Breadcrumbs title="Forms" breadcrumbItem="PARCEL SERVICE REPORT" />
        <Row>
          <Col xl={12}>
            <Card>
              <CardBody>
                <Row className="mb-3 align-items-end g-3">
                  <Col sm={4}>
                    <label className="form-label">Start Date</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      max={endDate || undefined}
                    />
                  </Col>
                  <Col sm={4}>
                    <label className="form-label">End Date</label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || undefined}
                    />
                  </Col>
                  <Col sm="auto">
                    <Button color="primary" onClick={handleRangeSearch}>
                      Search
                    </Button>
                  </Col>
                  <Col sm="auto">
                    <Button color="secondary" onClick={handleClear}>
                      Clear
                    </Button>
                  </Col>
                </Row>

                <div className="table-responsive">
                  <Table className="table table-bordered table-sm text-center">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Date</th>
                        <th>Count</th>
                        <th>Parcel Amount (₹)</th>
                        <th>Weight (kg)</th>
                        <th>Average</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentData.length > 0 ? (
                        <>
                          {currentData.map((group, index) => (
                            <tr key={group.date}>
                              <td>{indexOfFirstItem + index + 1}</td>
                              <td>{group.date}</td>
                              <td>{group.count}</td>
                              <td>₹ {group.totalAmount.toFixed(2)}</td>
                              <td>{group.totalWeight.toFixed(2)} kg</td>
                              <td>
                                {group.totalWeight !== 0
                                  ? (
                                      group.totalAmount / group.totalWeight
                                    ).toFixed(2)
                                  : "0.00"}
                              </td>
                              <td>
                                <Button
                                  size="sm"
                                  color="info"
                                  onClick={() =>
                                    handleView(group.date, group.items)
                                  }
                                >
                                  View
                                </Button>
                              </td>
                            </tr>
                          ))}

                          <tr className="fw-bold bg-light">
                            <td colSpan="2">Total</td>
                            <td>{totalCount}</td>
                            <td>₹ {totalAmount.toFixed(2)}</td>
                            <td>{totalWeight.toFixed(2)} kg</td>
                            <td>{totalAverage}</td>
                            <td>—</td>
                          </tr>
                        </>
                      ) : (
                        <tr>
                          <td colSpan="7" className="text-center text-muted">
                            No data available for the selected date range
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>

                  <Paginations
                    perPageData={perPageData}
                    data={filteredData}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    isShowingPageLength={true}
                    paginationDiv="col-auto"
                    paginationClass=""
                    indexOfFirstItem={indexOfFirstItem}
                    indexOfLastItem={indexOfLastItem}
                  />
                </div>
                <ToastContainer />
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default AverageAmountReport;
