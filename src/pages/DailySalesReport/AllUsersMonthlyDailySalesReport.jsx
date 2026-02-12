import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import * as XLSX from "xlsx-js-style";
import Select from "react-select";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Card,
  CardBody,
  Col,
  Row,
  Label,
  CardTitle,
  Form,
  Input,
  Button,
} from "reactstrap";


const AllUsersMonthlyDailySalesReport = () => {
  const token = localStorage.getItem("token");
  const [stateList, setStateList] = useState([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [stateId, setStateId] = useState("");
  const [staffList, setStaffList] = useState([]);
  const [userId, setUserId] = useState("");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStates = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_KEY}states/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStateList(response?.data?.data || []);
    } catch (error) {
      toast.error("Failed to load States");
    }
  };

  const fetchStaffs = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_KEY}staffs/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStaffList(response?.data?.data || []);
    } catch (error) {
      toast.error("Failed to load Staffs");
    }
  };

  useEffect(() => {
    fetchStates();
    fetchStaffs();
  }, []);

  const fetchReport = async () => {
    try {
      if (!month || !year) {
        toast.error("Please select Month and Year");
        return;
      }

      if (!stateId && !userId) {
        toast.error("Please select either State or Staff");
        return;
      }

      setLoading(true);

      let apiUrl = `${import.meta.env.VITE_APP_KEY}daily/sales/report/all/users/?month=${month}&year=${year}`;

      if (stateId) {
        apiUrl += `&state_id=${stateId}`;
      }

      if (userId) {
        apiUrl += `&user_id=${userId}`;
      }

      const response = await axios.get(apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setReportData(response.data);
    } catch (error) {
      toast.error("Failed to load Report");
    } finally {
      setLoading(false);
    }
  };

  // Overall Grand Total
  const overallGrandTotal = useMemo(() => {
    if (!reportData || !reportData.users) return 0;
    return reportData.users.reduce((sum, u) => sum + (u.grand_total || 0), 0);
  }, [reportData]);


  const exportToExcel = () => {
    try {
      if (!reportData || !reportData.users) {
        toast.error("No data to export");
        return;
      }

      const wb = XLSX.utils.book_new();

      reportData.users.forEach((user) => {
        const wsData = [];

        // Title Row
        wsData.push([`${reportData.state} - ${reportData.month} - ${user.user_name}`]);
        wsData.push([]);

        // Header Row
        wsData.push(["District", ...reportData.dates, "Total"]);

        // State wise districts
        user.districts.forEach((stateBlock) => {
          // State Heading Row
          wsData.push([stateBlock.state.toUpperCase()]);
          wsData.push([]);

          // District rows
          stateBlock.districts.forEach((dist) => {
            const row = [dist.district];

            reportData.dates.forEach((d) => {
              row.push(dist.daily_counts[d.toString()] || 0);
            });

            row.push(dist.total || 0);
            wsData.push(row);
          });

          wsData.push([]);
        });

        // Total Row
        const totalRow = ["TOTAL"];
        reportData.dates.forEach((d) => {
          totalRow.push(user.column_totals[d.toString()] || 0);
        });
        totalRow.push(user.grand_total || 0);
        wsData.push(totalRow);

        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Column widths
        ws["!cols"] = [
          { wch: 25 },
          ...reportData.dates.map(() => ({ wch: 8 })),
          { wch: 12 },
        ];

        // Merge Title row
        ws["!merges"] = [
          {
            s: { r: 0, c: 0 },
            e: { r: 0, c: reportData.dates.length + 1 },
          },
        ];

        // Apply styles
        const range = XLSX.utils.decode_range(ws["!ref"]);

        for (let R = range.s.r; R <= range.e.r; R++) {
          for (let C = range.s.c; C <= range.e.c; C++) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            const cell = ws[cellAddress];

            if (!cell) continue;

            // Default style
            cell.s = {
              font: { name: "Calibri", sz: 11 },
              alignment: { horizontal: "center", vertical: "center", wrapText: true },
              border: {
                top: { style: "thin", color: { rgb: "AAAAAA" } },
                bottom: { style: "thin", color: { rgb: "AAAAAA" } },
                left: { style: "thin", color: { rgb: "AAAAAA" } },
                right: { style: "thin", color: { rgb: "AAAAAA" } },
              },
            };

            // Title row styling
            if (R === 0) {
              cell.s = {
                font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
                alignment: { horizontal: "center", vertical: "center" },
                fill: { fgColor: { rgb: "1F4E79" } }, // dark blue
              };
            }

            // Header row styling (Row index 2)
            if (R === 2) {
              cell.s = {
                font: { bold: true, color: { rgb: "FFFFFF" } },
                alignment: { horizontal: "center", vertical: "center" },
                fill: { fgColor: { rgb: "28837A" } }, // teal
                border: {
                  top: { style: "thin", color: { rgb: "000000" } },
                  bottom: { style: "thin", color: { rgb: "000000" } },
                  left: { style: "thin", color: { rgb: "000000" } },
                  right: { style: "thin", color: { rgb: "000000" } },
                },
              };
            }

            // State heading rows (when first column has state name and others empty)
            if (cell.v && typeof cell.v === "string" && C === 0 && R > 2) {
              const nextCell = ws[XLSX.utils.encode_cell({ r: R, c: 1 })];
              if (!nextCell) {
                cell.s = {
                  font: { bold: true, color: { rgb: "FFFFFF" } },
                  alignment: { horizontal: "center", vertical: "center" },
                  fill: { fgColor: { rgb: "0B4F6C" } }, // dark teal
                };

                // Merge state heading across all columns
                ws["!merges"].push({
                  s: { r: R, c: 0 },
                  e: { r: R, c: reportData.dates.length + 1 },
                });
              }
            }

            // Total column styling
            if (C === reportData.dates.length + 1 && R > 2 && R < range.e.r) {
              cell.s = {
                font: { bold: true, color: { rgb: "000000" } },
                alignment: { horizontal: "center", vertical: "center" },
                fill: { fgColor: { rgb: "FFF3CD" } }, // yellow
                border: {
                  top: { style: "thin", color: { rgb: "AAAAAA" } },
                  bottom: { style: "thin", color: { rgb: "AAAAAA" } },
                  left: { style: "thin", color: { rgb: "AAAAAA" } },
                  right: { style: "thin", color: { rgb: "AAAAAA" } },
                },
              };
            }

            // TOTAL row styling (last row)
            if (R === range.e.r) {
              cell.s = {
                font: { bold: true, color: { rgb: "FFFFFF" } },
                alignment: { horizontal: "center", vertical: "center" },
                fill: { fgColor: { rgb: "28A745" } }, // green
                border: {
                  top: { style: "thin", color: { rgb: "000000" } },
                  bottom: { style: "thin", color: { rgb: "000000" } },
                  left: { style: "thin", color: { rgb: "000000" } },
                  right: { style: "thin", color: { rgb: "000000" } },
                },
              };
            }
          }
        }

        const sheetName = user.user_name.substring(0, 31);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      });

      XLSX.writeFile(
        wb,
        `AllUsersDailySalesReport_${reportData.month}_${reportData.state}.xlsx`
      );

      toast.success("Excel Exported Successfully");
    } catch (error) {
      console.log(error);
      toast.error("Excel export failed");
    }
  };

  const exportToPDF = () => {
    try {
      if (!reportData || !reportData.users) {
        toast.error("No data to export");
        return;
      }

      const doc = new jsPDF("landscape");

      reportData.users.forEach((user, userIndex) => {
        if (userIndex !== 0) doc.addPage();

        doc.setFontSize(14);
        doc.text(
          `${reportData.month} - ${reportData.state} - ${user.user_name}`,
          14,
          15
        );

        let tableBody = [];

        // Header row
        const tableHead = [["District", ...reportData.dates, "Total"]];

        // State wise districts
        user.districts.forEach((stateBlock) => {
          // State heading row
          tableBody.push([
            {
              content: stateBlock.state,
              colSpan: reportData.dates.length + 2,
              styles: {
                fillColor: [40, 131, 122],
                textColor: [255, 255, 255],
                fontStyle: "bold",
                halign: "left",
              },
            },
          ]);

          // District rows
          stateBlock.districts.forEach((dist) => {
            const row = [dist.district];

            reportData.dates.forEach((d) => {
              row.push(dist.daily_counts[d.toString()] || 0);
            });

            row.push(dist.total || 0);
            tableBody.push(row);
          });
        });

        // Total Row
        const totalRow = ["TOTAL"];
        reportData.dates.forEach((d) => {
          totalRow.push(user.column_totals[d.toString()] || 0);
        });
        totalRow.push(user.grand_total || 0);

        tableBody.push(totalRow);

        autoTable(doc, {
          startY: 25,
          head: tableHead,
          body: tableBody,
          styles: {
            fontSize: 8,
            halign: "center",
            valign: "middle",
          },
          headStyles: {
            fillColor: [40, 131, 122],
            textColor: [255, 255, 255],
            fontStyle: "bold",
          },
          didParseCell: function (data) {
            // TOTAL row styling
            if (data.row.index === tableBody.length - 1) {
              data.cell.styles.fillColor = [40, 167, 69];
              data.cell.styles.textColor = [255, 255, 255];
              data.cell.styles.fontStyle = "bold";
            }
          },
        });

        // Add Grand Total text
        doc.setFontSize(12);
        doc.text(
          `Grand Total: ${user.grand_total}`,
          14,
          doc.lastAutoTable.finalY + 10
        );
      });

      doc.save(`AllUsersDailySalesReport_${reportData.month}_${reportData.state}.pdf`);
      toast.success("PDF Exported Successfully");
    } catch (error) {
      console.log(error);
      toast.error("PDF export failed");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      {/* PAGE HEADER */}
      <Card
        style={{
          borderRadius: "15px",
          boxShadow: "0px 4px 12px rgba(0,0,0,0.15)",
          marginBottom: "20px",
          marginTop: "60px",
          background: "linear-gradient(90deg, #0f2027, #203a43, #2c5364)",
          color: "white",
        }}
      >
        <CardBody className="m-1">
          <Row className="align-items-center">
            <Col md="8">
              <h2 style={{ margin: 0, fontWeight: "bold" }}>
                All Staff's Monthly Daily Sales Report
              </h2>
              <p style={{ margin: 0, opacity: 0.8 }}>
                View monthly daily sales of all staff's and export to Excel / PDF
              </p>
            </Col>

            <Col md="4" className="text-end">
              <Button
                color="primary"
                style={{ marginRight: "10px", fontWeight: "bold" }}
                onClick={exportToExcel}
              >
                Export Excel
              </Button>

              <Button
                color="success"
                style={{ fontWeight: "bold" }}
                onClick={exportToPDF}
              >
                Export PDF
              </Button>

            </Col>
          </Row>
        </CardBody>
      </Card>

      {/* FILTER SECTION */}
      <Card
        style={{
          borderRadius: "12px",
          boxShadow: "0px 3px 10px rgba(0,0,0,0.12)",
          marginBottom: "20px",
        }}
      >
        <CardBody>
          <CardTitle tag="h5" style={{ fontWeight: "bold", marginBottom: "15px" }}>
            Search Filters
          </CardTitle>

          <Form>
            <Row>
              <Col md="2">
                <Label style={{ fontWeight: "bold" }}>Month</Label>
                <Input
                  type="select"
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                >
                  <option value="1">January</option>
                  <option value="2">February</option>
                  <option value="3">March</option>
                  <option value="4">April</option>
                  <option value="5">May</option>
                  <option value="6">June</option>
                  <option value="7">July</option>
                  <option value="8">August</option>
                  <option value="9">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </Input>
              </Col>

              <Col md="2">
                <Label style={{ fontWeight: "bold" }}>Year</Label>
                <Input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                />
              </Col>

              <Col md="3">
                <Label style={{ fontWeight: "bold" }}>State</Label>

                <Select
                  options={stateList.map((state) => ({
                    value: state.id,
                    label: state.name,
                  }))}
                  value={
                    stateId
                      ? {
                        value: stateId,
                        label: stateList.find((s) => s.id == stateId)?.name,
                      }
                      : null
                  }
                  onChange={(selected) => setStateId(selected ? selected.value : "")}
                  placeholder="Select State"
                  isClearable
                  isSearchable
                />
              </Col>

              <Col md="3">
                <Label style={{ fontWeight: "bold" }}>Staff</Label>

                <Select
                  options={staffList.map((staff) => ({
                    value: staff.id,
                    label: staff.name,
                  }))}
                  value={
                    userId
                      ? {
                        value: userId,
                        label: staffList.find((u) => u.id == userId)?.name,
                      }
                      : null
                  }
                  onChange={(selected) => setUserId(selected ? selected.value : "")}
                  placeholder="Select Staff"
                  isClearable
                  isSearchable
                />
              </Col>

              <Col md="2" className="d-flex align-items-end">
                <Button
                  color="info"
                  style={{
                    width: "100%",
                    fontWeight: "bold",
                    color: "white",
                  }}
                  onClick={fetchReport}
                >
                  {loading ? "Searching..." : "Search"}
                </Button>
              </Col>
            </Row>
          </Form>
        </CardBody>
      </Card>

      {/* REPORT SECTION */}
      <Card
        className="print-section"
        style={{
          borderRadius: "12px",
          boxShadow: "0px 3px 10px rgba(0,0,0,0.12)",
        }}
      >
        <CardBody>
          {loading ? (
            <h4 style={{ textAlign: "center" }}>Loading...</h4>
          ) : reportData ? (
            <>
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <h3 style={{ fontWeight: "bold", marginBottom: "5px" }}>
                  All Staff's Monthly Sales Report
                </h3>

                <h5 style={{ color: "#28837a", fontWeight: "bold" }}>
                  {reportData.state.toUpperCase()} ({reportData.month})
                </h5>

                <h4 style={{ marginTop: "10px", fontWeight: "bold" }}>
                  Overall Grand Total :{" "}
                  <span style={{ color: "red" }}>{overallGrandTotal}</span>
                </h4>
              </div>

              {/* USER WISE TABLES */}
              {reportData.users && reportData.users.length > 0 ? (
                reportData.users.map((user, userIndex) => (
                  <Card
                    key={userIndex}
                    style={{
                      marginBottom: "25px",
                      borderRadius: "12px",
                      boxShadow: "0px 3px 10px rgba(0,0,0,0.12)",
                      border: "2px solid #28837a",
                    }}
                  >
                    <CardBody>
                      <div
                        style={{
                          background: "linear-gradient(90deg, #28837a, #40E0D0)",
                          padding: "12px",
                          borderRadius: "10px",
                          color: "white",
                          fontWeight: "bold",
                          fontSize: "16px",
                          marginBottom: "15px",
                        }}
                      >
                        {user.user_name} (Grand Total: {user.grand_total})
                      </div>

                      <div style={{ overflowX: "auto" }}>
                        <table
                          className="table table-bordered table-striped"
                          style={{
                            width: "100%",
                            textAlign: "center",
                            borderCollapse: "collapse",
                          }}
                        >
                          <thead
                            style={{
                              background: "linear-gradient(90deg, #28837a, #40E0D0)",
                              color: "white",
                            }}
                          >
                            <tr>
                              <th style={{ minWidth: "180px" }}>District</th>
                              {reportData.dates.map((d) => (
                                <th key={d}>{d}</th>
                              ))}
                              <th>Total</th>
                            </tr>
                          </thead>

                          <tbody>
                            {user.districts.map((stateBlock, sIndex) => (
                              <React.Fragment key={sIndex}>

                                {/* STATE HEADER ROW */}
                                <tr>
                                  <td
                                    colSpan={reportData.dates.length + 2}
                                    style={{
                                      backgroundColor: "#28837a",
                                      color: "black",
                                      fontWeight: "bold",
                                      padding: "10px",
                                      textAlign: "center",
                                    }}
                                  >
                                    {stateBlock?.state?.toUpperCase()}
                                  </td>
                                </tr>

                                {/* DISTRICTS UNDER THAT STATE */}
                                {stateBlock.districts.map((dist, index) => (
                                  <tr key={index}>
                                    <td style={{ textAlign: "left", fontWeight: "bold" }}>
                                      {dist.district}
                                    </td>

                                    {reportData.dates.map((d) => {
                                      const value = dist.daily_counts[d.toString()] || 0;

                                      return (
                                        <td
                                          key={d}
                                          style={{
                                            fontWeight: value > 0 ? "bold" : "normal",
                                            backgroundColor: value > 0 ? "#d1f7ff" : "white",
                                            color: value > 0 ? "#0b4f6c" : "black",
                                          }}
                                        >
                                          {value}
                                        </td>
                                      );
                                    })}

                                    <td
                                      style={{
                                        fontWeight: "bold",
                                        backgroundColor: "#fff3cd",
                                        color: "#856404",
                                      }}
                                    >
                                      {dist.total}
                                    </td>
                                  </tr>
                                ))}
                              </React.Fragment>
                            ))}

                            {/* TOTAL ROW */}
                            <tr style={{ fontWeight: "bold" }}>
                              <td
                                style={{
                                  backgroundColor: "#d4edda",
                                  color: "#155724",
                                }}
                              >
                                TOTAL
                              </td>

                              {reportData.dates.map((d) => {
                                const totalValue = user.column_totals[d.toString()] || 0;

                                return (
                                  <td
                                    key={d}
                                    style={{
                                      backgroundColor:
                                        totalValue > 0 ? "#c3f7c9" : "#d4edda",
                                      color: totalValue > 0 ? "#0b6623" : "#155724",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    {totalValue}
                                  </td>
                                );
                              })}

                              <td
                                style={{
                                  backgroundColor: "#28a745",
                                  color: "white",
                                  fontSize: "16px",
                                  fontWeight: "bold",
                                }}
                              >
                                {user.grand_total}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </CardBody>
                  </Card>
                ))
              ) : (
                <h4 style={{ textAlign: "center", marginTop: "30px" }}>
                  No User Data Found
                </h4>
              )}
            </>
          ) : (
            <h4 style={{ textAlign: "center", marginTop: "30px" }}>
              No Data Found
            </h4>
          )}
        </CardBody>
      </Card>

      <ToastContainer />
    </div>
  );
};

export default AllUsersMonthlyDailySalesReport;
