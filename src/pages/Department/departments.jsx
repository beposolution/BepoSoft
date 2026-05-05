import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import {
  Table,
  Row,
  Col,
  Card,
  CardBody,
  Button,
  Form,
  Input,
  Label,
  Badge,
} from "reactstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Paginations from "../../components/Common/Pagination";

const DepartmentTable = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newDepartment, setNewDepartment] = useState("");
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const token = localStorage.getItem("token");

  const [currentPage, setCurrentPage] = useState(1);
  const [perPageData] = useState(25);

  document.title = "Beposoft | Department Information";

  const resetForm = () => {
    setNewDepartment("");
    setEditingDepartment(null);
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${import.meta.env.VITE_APP_KEY}departments/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        const departmentsData = Array.isArray(response.data?.data)
          ? response.data.data
          : Array.isArray(response.data)
          ? response.data
          : [];

        setData(departmentsData);
      } else {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
    } catch (error) {
      toast.error("Failed to fetch departments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleAddOrUpdateDepartment = async (e) => {
    e.preventDefault();

    if (!newDepartment.trim()) {
      toast.warning("Please enter department name");
      return;
    }

    const payload = {
      name: newDepartment.trim(),
    };

    try {
      if (editingDepartment) {
        await axios.put(
          `${import.meta.env.VITE_APP_KEY}department/update/${
            editingDepartment.id
          }/`,
          {
            ...editingDepartment,
            name: newDepartment.trim(),
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        toast.success("Department updated successfully!");
      } else {
        await axios.post(`${import.meta.env.VITE_APP_KEY}add/department/`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        toast.success("Department added successfully!");
      }

      resetForm();
      await fetchData();
    } catch (error) {
      toast.error(
        editingDepartment
          ? "Failed to update department"
          : "Failed to add department"
      );
    }
  };

  const handleEditDepartment = (department) => {
    setEditingDepartment(department);
    setNewDepartment(department.name || "");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDeleteDepartment = async (id) => {
    const originalData = [...data];

    setData(data.filter((department) => department.id !== id));

    try {
      await axios.delete(
        `${import.meta.env.VITE_APP_KEY}department/update/${id}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Department deleted successfully!");
      await fetchData();
    } catch (error) {
      setData(originalData);
      toast.error("Failed to delete department");
    }
  };

  const filteredDepartments = data.filter((department) => {
    const search = searchTerm.toLowerCase();
    const departmentName = department?.name?.toLowerCase() || "";
    const departmentId = String(department?.id || "").toLowerCase();

    return departmentName.includes(search) || departmentId.includes(search);
  });

  const indexOfLastItem = currentPage * perPageData;
  const indexOfFirstItem = indexOfLastItem - perPageData;

  const currentPageDepartments = filteredDepartments.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <React.Fragment>
      <div className="page-content" style={{ backgroundColor: "#f3f6fb" }}>
        <ToastContainer />

        <div className="container-fluid">
          <Row>
            <Col xl={12}>
              <Card
                className="border-0"
                style={{
                  borderRadius: "18px",
                  boxShadow: "0 8px 25px rgba(15, 23, 42, 0.10)",
                }}
              >
                <CardBody className="p-4">
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
                    <div>
                      <h4
                        className="mb-1"
                        style={{
                          fontWeight: "800",
                          color: "#111827",
                          fontSize: "22px",
                        }}
                      >
                        {editingDepartment
                          ? "Update Department"
                          : "Add New Department"}
                      </h4>

                      <p
                        className="mb-0"
                        style={{
                          color: "#475569",
                          fontSize: "14px",
                          fontWeight: "500",
                        }}
                      >
                        {editingDepartment
                          ? "Modify the selected department information."
                          : "Create and manage company departments from one place."}
                      </p>
                    </div>

                    <div className="d-flex gap-2 flex-wrap">
                      <Badge
                        color="primary"
                        pill
                        className="px-3 py-2"
                        style={{
                          fontSize: "13px",
                          fontWeight: "700",
                        }}
                      >
                        Total Departments: {data.length}
                      </Badge>

                      {editingDepartment && (
                        <Badge
                          color="warning"
                          pill
                          className="px-3 py-2"
                          style={{
                            fontSize: "13px",
                            fontWeight: "700",
                            color: "#111827",
                          }}
                        >
                          Edit Mode
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Form onSubmit={handleAddOrUpdateDepartment}>
                    <Row className="g-3 align-items-end">
                      <Col md={10}>
                        <Label
                          htmlFor="departmentName"
                          style={{
                            fontSize: "14px",
                            fontWeight: "800",
                            color: "#111827",
                            marginBottom: "8px",
                          }}
                        >
                          Department Name
                        </Label>

                        <Input
                          type="text"
                          id="departmentName"
                          name="name"
                          value={newDepartment}
                          onChange={(e) => setNewDepartment(e.target.value)}
                          placeholder="Example: Sales, Accounts, Warehouse"
                          style={{
                            height: "48px",
                            borderRadius: "10px",
                            border: "1.5px solid #b8c2d6",
                            color: "#111827",
                            fontSize: "14px",
                            fontWeight: "600",
                            backgroundColor: "#ffffff",
                          }}
                        />
                      </Col>

                      <Col md={2}>
                        <Button
                          color="primary"
                          type="submit"
                          className="w-100"
                          style={{
                            height: "48px",
                            borderRadius: "10px",
                            fontSize: "14px",
                            fontWeight: "800",
                            backgroundColor: "#1d4ed8",
                            borderColor: "#1d4ed8",
                            boxShadow: "0 8px 18px rgba(29, 78, 216, 0.30)",
                          }}
                        >
                          {editingDepartment ? "Update" : "Add"}
                        </Button>
                      </Col>
                    </Row>

                    {editingDepartment && (
                      <Button
                        className="mt-3"
                        color="secondary"
                        type="button"
                        style={{
                          borderRadius: "10px",
                          fontWeight: "700",
                          padding: "10px 24px",
                        }}
                        onClick={resetForm}
                      >
                        Cancel Edit
                      </Button>
                    )}
                  </Form>
                </CardBody>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col xl={12}>
              <Card
                className="border-0 mt-0"
                style={{
                  borderRadius: "18px",
                  boxShadow: "0 8px 25px rgba(15, 23, 42, 0.10)",
                }}
              >
                <CardBody className="p-4">
                  <Row className="mb-4 align-items-center g-3">
                    <Col md={6}>
                      <h4
                        className="mb-1"
                        style={{
                          fontWeight: "800",
                          color: "#111827",
                          fontSize: "22px",
                        }}
                      >
                        Department Information
                      </h4>

                      <p
                        className="mb-0"
                        style={{
                          color: "#475569",
                          fontSize: "14px",
                          fontWeight: "500",
                        }}
                      >
                        View, search and update all departments.
                      </p>
                    </Col>

                    <Col md={6}>
                      <Input
                        type="text"
                        placeholder="Search by department name or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                          height: "48px",
                          borderRadius: "10px",
                          border: "1.5px solid #b8c2d6",
                          color: "#111827",
                          fontSize: "14px",
                          fontWeight: "600",
                          backgroundColor: "#ffffff",
                        }}
                      />
                    </Col>
                  </Row>

                  <div
                    className="table-responsive"
                    style={{
                      border: "1.5px solid #d7deea",
                      borderRadius: "14px",
                      overflow: "hidden",
                      backgroundColor: "#ffffff",
                    }}
                  >
                    <Table className="table mb-0 align-middle">
                      <thead>
                        <tr style={{ backgroundColor: "#eaf0fb" }}>
                          <th
                            style={{
                              width: "80px",
                              padding: "16px 14px",
                              color: "#1e293b",
                              fontSize: "13px",
                              fontWeight: "800",
                              borderBottom: "1.5px solid #cbd5e1",
                            }}
                          >
                            #
                          </th>

                         

                          <th
                            style={{
                              padding: "16px 14px",
                              color: "#1e293b",
                              fontSize: "13px",
                              fontWeight: "800",
                              borderBottom: "1.5px solid #cbd5e1",
                            }}
                          >
                            Department Name
                          </th>

                          <th
                            className="text-end"
                            style={{
                              width: "180px",
                              padding: "16px 14px",
                              color: "#1e293b",
                              fontSize: "13px",
                              fontWeight: "800",
                              borderBottom: "1.5px solid #cbd5e1",
                            }}
                          >
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan="4">
                              <div className="text-center py-5">
                                <h5
                                  style={{
                                    fontWeight: "800",
                                    color: "#111827",
                                  }}
                                >
                                  Loading departments...
                                </h5>

                                <p
                                  className="mb-0"
                                  style={{
                                    color: "#475569",
                                    fontWeight: "500",
                                  }}
                                >
                                  Please wait while department information is
                                  being loaded.
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) : currentPageDepartments.length > 0 ? (
                          currentPageDepartments.map((department, index) => (
                            <tr
                              key={department.id || index}
                              style={{
                                borderBottom: "1px solid #dfe6f1",
                              }}
                            >
                              <td
                                style={{
                                  padding: "16px 14px",
                                  color: "#334155",
                                  fontSize: "14px",
                                  fontWeight: "700",
                                }}
                              >
                                {indexOfFirstItem + index + 1}
                              </td>

                              

                              <td style={{ padding: "16px 14px" }}>
                                <div className="d-flex align-items-center gap-3">
                                  <div
                                    className="rounded-circle d-flex align-items-center justify-content-center"
                                    style={{
                                      width: "42px",
                                      height: "42px",
                                      backgroundColor: "#dbeafe",
                                      color: "#1d4ed8",
                                      fontWeight: "900",
                                      fontSize: "14px",
                                      border: "1px solid #bfdbfe",
                                    }}
                                  >
                                    {department?.name
                                      ? department.name
                                          .substring(0, 3)
                                          .toUpperCase()
                                      : "DP"}
                                  </div>

                                  <div>
                                    <h6
                                      className="mb-1"
                                      style={{
                                        fontSize: "14px",
                                        fontWeight: "900",
                                        color: "#0f172a",
                                        letterSpacing: "0.2px",
                                      }}
                                    >
                                      {department?.name || "-"}
                                    </h6>

                                    <small
                                      style={{
                                        color: "#64748b",
                                        fontSize: "12px",
                                        fontWeight: "600",
                                      }}
                                    >
                                      Department name
                                    </small>
                                  </div>
                                </div>
                              </td>

                              <td
                                className="text-end"
                                style={{ padding: "16px 14px" }}
                              >
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleEditDepartment(department)
                                  }
                                  style={{
                                    backgroundColor: "#f59e0b",
                                    borderColor: "#f59e0b",
                                    color: "#111827",
                                    borderRadius: "8px",
                                    fontSize: "12px",
                                    fontWeight: "900",
                                    padding: "8px 18px",
                                    marginRight: "8px",
                                  }}
                                >
                                  Edit
                                </Button>

                                {/* <Button
                                  size="sm"
                                  onClick={() =>
                                    handleDeleteDepartment(department.id)
                                  }
                                  style={{
                                    backgroundColor: "#ef4444",
                                    borderColor: "#ef4444",
                                    color: "#ffffff",
                                    borderRadius: "8px",
                                    fontSize: "12px",
                                    fontWeight: "900",
                                    padding: "8px 18px",
                                  }}
                                >
                                  Delete
                                </Button> */}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4">
                              <div className="text-center py-5">
                                <h5
                                  style={{
                                    fontWeight: "800",
                                    color: "#111827",
                                  }}
                                >
                                  No departments found
                                </h5>

                                <p
                                  className="mb-0"
                                  style={{
                                    color: "#475569",
                                    fontWeight: "500",
                                  }}
                                >
                                  Try another search keyword or add a new
                                  department.
                                </p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>

                  <div className="mt-3">
                    <Paginations
                      perPageData={perPageData}
                      data={filteredDepartments}
                      currentPage={currentPage}
                      setCurrentPage={setCurrentPage}
                      isShowingPageLength={true}
                      paginationDiv="col-auto"
                      paginationClass="pagination-rounded"
                      indexOfFirstItem={indexOfFirstItem}
                      indexOfLastItem={indexOfLastItem}
                    />
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    </React.Fragment>
  );
};

DepartmentTable.propTypes = {
  preGlobalFilteredRows: PropTypes.any,
};

export default DepartmentTable;