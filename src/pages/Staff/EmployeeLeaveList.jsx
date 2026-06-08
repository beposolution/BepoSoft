import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  Card,
  CardBody,
  CardTitle,
  Col,
  Container,
  Row,
  Table,
  Badge,
} from "reactstrap";
import { ToastContainer, toast } from "react-toastify";
import Breadcrumbs from "../../components/Common/Breadcrumb";

const EmployeeLeaveList = () => {
  document.title = "My Leave List | Beposoft";

  const token = localStorage.getItem("token");

  const [leaveList, setLeaveList] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLeaveList = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${import.meta.env.VITE_APP_KEY}employee/leaves/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data =
        response?.data?.data ||
        response?.data?.results?.data ||
        response?.data?.results ||
        [];

      setLeaveList(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to fetch leave data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchLeaveList();
    }
  }, [token]);

  const getStatusBadge = (status) => {
    if (status === "approved") return "success";
    if (status === "rejected") return "danger";
    return "warning";
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="Leave" breadcrumbItem="My Leave List" />

          <Row>
            <Col xl={12}>
              <Card>
                <CardBody>
                  <CardTitle className="mb-4">My Leave List</CardTitle>

                  {loading ? (
                    <p>Loading...</p>
                  ) : (
                    <div className="table-responsive">
                      <Table className="table-bordered table-striped">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Leave Type</th>
                            <th>No Of Days</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Reason</th>
                            <th>Manager</th>
                            <th>Status</th>
                            <th>Manager Note</th>
                          </tr>
                        </thead>

                        <tbody>
                          {leaveList.length > 0 ? (
                            leaveList.map((item, index) => (
                              <tr key={item.id}>
                                <td>{index + 1}</td>
                                <td>{item.leave_type}</td>
                                <td>{item.no_of_days || "-"}</td>
                                <td>{item.start_date}</td>
                                <td>{item.end_date}</td>
                                <td>{item.reason || "-"}</td>
                                <td>
                                  {item.manager_name ||
                                    item.manager ||
                                    "-"}
                                </td>
                                <td>
                                  <Badge color={getStatusBadge(item.approval_status)}>
                                    {item.approval_status}
                                  </Badge>
                                </td>
                                <td>{item.manager_note || "-"}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="9" className="text-center">
                                No leave data found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>

        <ToastContainer />
      </div>
    </React.Fragment>
  );
};

export default EmployeeLeaveList;