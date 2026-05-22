import React, { useState, useEffect } from "react";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import {
  Card,
  CardBody,
  Col,
  Row,
  Table,
  Button,
  Form,
  Label,
  Input,
  Badge,
} from "reactstrap";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Pagination from "../../components/Common/Pagination";

const AddParcelService = () => {
  const [parcelServices, setParcelServices] = useState([]);
  const [name, setName] = useState("");
  const [label, setLabel] = useState("");
  const [editId, setEditId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");

  document.title = "Parcel Services | Beposoft";

  const token = localStorage.getItem("token");
  const apiBase = import.meta.env.VITE_APP_KEY;

  const [currentPage, setCurrentPage] = useState(1);
  const perPageData = 25;

  const axiosCfg = {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };

  const filteredParcelServices = parcelServices.filter((service) => {
    const search = searchTerm.toLowerCase();

    return (
      service?.name?.toLowerCase().includes(search) ||
      service?.label?.toLowerCase().includes(search)
    );
  });

  const indexOfLastItem = currentPage * perPageData;
  const indexOfFirstItem = indexOfLastItem - perPageData;
  const currentItems = filteredParcelServices.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const fetchParcelServices = async () => {
    try {
      const response = await axios.get(`${apiBase}parcal/service/`, axiosCfg);
      setParcelServices(response?.data?.data || []);
    } catch (error) {
      toast.error("Error fetching parcel services");
    }
  };

  const logCreation = async (created, { name, label }) => {
    try {
      const afterData = {
        ...(created?.id ? { id: created.id } : {}),
        name,
        label,
      };

      const payload = {
        before_data: { Action: "Parcel service creation" },
        after_data: afterData,
      };

      console.log("POST datalog/create/ payload:", payload);
      await axios.post(`${apiBase}datalog/create/`, payload, axiosCfg);
    } catch (err) {
      console.error("Failed to write datalog:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editId) {
        await axios.put(
          `${apiBase}parcal/${editId}/service/`,
          { name, label },
          axiosCfg
        );

        toast.success("Parcel service updated successfully!");
      } else {
        const createRes = await axios.post(
          `${apiBase}parcal/service/`,
          { name, label },
          axiosCfg
        );

        toast.success("Parcel service added successfully!");

        const created = createRes?.data?.data ?? createRes?.data ?? null;
        await logCreation(created, { name, label });
      }

      setName("");
      setLabel("");
      setEditId(null);
      fetchParcelServices();
    } catch (error) {
      toast.error("Failed to save parcel service");
    }
  };

  const handleEdit = (service) => {
    setName(service.name);
    setLabel(service.label);
    setEditId(service.id);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    fetchParcelServices();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <React.Fragment>
      <div className="page-content" style={{ backgroundColor: "#f3f6fb" }}>
        <ToastContainer />

        <div className="container-fluid">
          {/* <Breadcrumbs title="CRM Settings" breadcrumbItem="Parcel Services" /> */}

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
                        {editId
                          ? "Update Parcel Service"
                          : "Add New Parcel Service"}
                      </h4>

                      <p
                        className="mb-0"
                        style={{
                          color: "#475569",
                          fontSize: "14px",
                          fontWeight: "500",
                        }}
                      >
                        {editId
                          ? "Modify the selected parcel service details."
                          : "Create parcel services used for order and courier management."}
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
                        Total Services: {parcelServices.length}
                      </Badge>

                      {editId && (
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

                  <Form onSubmit={handleSubmit}>
                    <Row className="g-3 align-items-end">
                      <Col md={5}>
                        <Label
                          htmlFor="name"
                          style={{
                            fontSize: "14px",
                            fontWeight: "800",
                            color: "#111827",
                            marginBottom: "8px",
                          }}
                        >
                          Parcel Service Name
                        </Label>

                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          placeholder="Example: Speed Post"
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

                      <Col md={5}>
                        <Label
                          htmlFor="label"
                          style={{
                            fontSize: "14px",
                            fontWeight: "800",
                            color: "#111827",
                            marginBottom: "8px",
                          }}
                        >
                          Label
                        </Label>

                        <Input
                          id="label"
                          value={label}
                          onChange={(e) => setLabel(e.target.value)}
                          required
                          placeholder="Example: SPEED"
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
                          {editId ? "Update" : "Add"}
                        </Button>
                      </Col>
                    </Row>

                    {editId && (
                      <Button
                        className="mt-3"
                        color="secondary"
                        type="button"
                        style={{
                          borderRadius: "10px",
                          fontWeight: "700",
                          padding: "10px 24px",
                        }}
                        onClick={() => {
                          setEditId(null);
                          setName("");
                          setLabel("");
                        }}
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
                        Parcel Services
                      </h4>

                      <p
                        className="mb-0"
                        style={{
                          color: "#475569",
                          fontSize: "14px",
                          fontWeight: "500",
                        }}
                      >
                        Manage all parcel service records from one place.
                      </p>
                    </Col>

                    <Col md={6}>
                      <Input
                        type="text"
                        placeholder="Search by service name or label..."
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
                            Service Name
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
                            Label
                          </th>

                          <th
                            className="text-end"
                            style={{
                              width: "160px",
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
                        {currentItems.length > 0 ? (
                          currentItems.map((service, index) => (
                            <tr
                              key={service.id}
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
                                    {service?.name
                                      ? service.name
                                          .substring(0, 2)
                                          .toUpperCase()
                                      : "PS"}
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
                                      {service.name}
                                    </h6>

                                    <small
                                      style={{
                                        color: "#64748b",
                                        fontSize: "12px",
                                        fontWeight: "600",
                                      }}
                                    >
                                      Parcel service
                                    </small>
                                  </div>
                                </div>
                              </td>

                              <td style={{ padding: "16px 14px" }}>
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    minWidth: "82px",
                                    padding: "8px 16px",
                                    backgroundColor: "#2563eb",
                                    color: "#ffffff",
                                    border: "1.5px solid #1d4ed8",
                                    borderRadius: "10px",
                                    fontSize: "13px",
                                    fontWeight: "900",
                                    letterSpacing: "0.2px",
                                    boxShadow:
                                      "0 4px 10px rgba(37, 99, 235, 0.28)",
                                    textTransform: "uppercase",
                                  }}
                                >
                                  {service.label}
                                </span>
                              </td>

                              <td
                                className="text-end"
                                style={{ padding: "16px 14px" }}
                              >
                                <Button
                                  size="sm"
                                  onClick={() => handleEdit(service)}
                                  style={{
                                    backgroundColor: "#f59e0b",
                                    borderColor: "#f59e0b",
                                    color: "#111827",
                                    borderRadius: "8px",
                                    fontSize: "12px",
                                    fontWeight: "900",
                                    padding: "8px 18px",
                                  }}
                                >
                                  Edit
                                </Button>
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
                                  No parcel services found
                                </h5>

                                <p
                                  className="mb-0"
                                  style={{
                                    color: "#475569",
                                    fontWeight: "500",
                                  }}
                                >
                                  Try another search keyword or add a new parcel
                                  service.
                                </p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>

                  <div className="mt-3">
                    <Pagination
                      perPageData={perPageData}
                      data={filteredParcelServices}
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

export default AddParcelService;