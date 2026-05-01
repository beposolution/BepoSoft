import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  CardBody,
  Col,
  Row,
  Label,
  Input,
  Container,
  Button,
  Table,
  Badge,
} from "reactstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Select from "react-select";
import Pagination from "../../components/Common/Pagination";

const AddWarehousePage = () => {
  const [warehouseData, setWarehouseData] = useState({
    name: "",
    address: "",
    location: "",
    country_code: "",
  });

  const [warehouseDetails, setWarehouseDetails] = useState([]);
  const [countryCodes, setCountryCodes] = useState([]);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const perPageData = 25;

  document.title = "Warehouses | Beposoft";

  const token = localStorage.getItem("token");
  const apiBase = import.meta.env.VITE_APP_KEY;

  const axiosCfg = {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };

  const selectStyles = {
    control: (provided, state) => ({
      ...provided,
      minHeight: "48px",
      borderRadius: "10px",
      borderColor: state.isFocused ? "#1d4ed8" : "#b8c2d6",
      boxShadow: state.isFocused ? "0 0 0 1px #1d4ed8" : "none",
      fontSize: "14px",
      fontWeight: "600",
      backgroundColor: "#ffffff",
      color: "#111827",
      "&:hover": {
        borderColor: "#1d4ed8",
      },
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: "#ffffff",
      zIndex: 9999,
      borderRadius: "10px",
      overflow: "hidden",
    }),
    option: (provided, state) => ({
      ...provided,
      fontSize: "14px",
      fontWeight: "600",
      backgroundColor: state.isSelected
        ? "#1d4ed8"
        : state.isFocused
        ? "#eaf0fb"
        : "#ffffff",
      color: state.isSelected ? "#ffffff" : "#111827",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "#111827",
      fontWeight: "700",
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#64748b",
      fontWeight: "600",
    }),
  };

  const countryOptions = countryCodes.map((country) => ({
    value: country.id,
    label: country.country_code,
  }));

  const selectedCountryOption =
    countryOptions.find((option) => option.value === warehouseData.country_code) ||
    null;

  const fetchCountryCodes = async () => {
    try {
      const response = await axios.get(`${apiBase}country/codes/`, axiosCfg);

      if (response?.data?.status === "success") {
        setCountryCodes(response?.data?.data || []);
      } else {
        toast.error("Failed to fetch country codes.");
      }
    } catch (error) {
      toast.error("Error fetching country codes.");
    }
  };

  const viewWarehouse = async () => {
    try {
      const res = await axios.get(`${apiBase}warehouse/add/`, axiosCfg);
      setWarehouseDetails(Array.isArray(res?.data) ? res.data : []);
    } catch (error) {
      toast.error("Error fetching warehouses");
    }
  };

  useEffect(() => {
    fetchCountryCodes();
    viewWarehouse();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setWarehouseData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setWarehouseData({
      name: "",
      address: "",
      location: "",
      country_code: "",
    });
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!warehouseData.name.trim()) {
      toast.warning("Please enter warehouse name");
      return;
    }

    if (!warehouseData.address.trim()) {
      toast.warning("Please enter warehouse address");
      return;
    }

    if (!warehouseData.location.trim()) {
      toast.warning("Please enter warehouse location");
      return;
    }

    if (!warehouseData.country_code) {
      toast.warning("Please select country");
      return;
    }

    try {
      if (editId) {
        await axios.put(
          `${apiBase}warehouse/update/${editId}/`,
          warehouseData,
          axiosCfg
        );

        toast.success("Warehouse updated successfully!");
      } else {
        await axios.post(`${apiBase}warehouse/add/`, warehouseData, axiosCfg);

        toast.success("Warehouse added successfully!");
      }

      resetForm();
      viewWarehouse();
    } catch (error) {
      toast.error(editId ? "Error updating warehouse" : "Error adding warehouse");
    }
  };

  const editWarehouse = (warehouse) => {
    setEditId(warehouse.id);

    setWarehouseData({
      name: warehouse.name || "",
      address: warehouse.address || "",
      location: warehouse.location || "",
      country_code: warehouse.country_code || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const filteredWarehouses = warehouseDetails.filter((warehouse) => {
    const search = searchTerm.toLowerCase();

    return (
      warehouse?.name?.toLowerCase().includes(search) ||
      warehouse?.address?.toLowerCase().includes(search) ||
      warehouse?.location?.toLowerCase().includes(search) ||
      warehouse?.country?.toLowerCase().includes(search) ||
      String(warehouse?.country_code || "").toLowerCase().includes(search)
    );
  });

  const indexOfLastItem = currentPage * perPageData;
  const indexOfFirstItem = indexOfLastItem - perPageData;

  const currentWarehouses = filteredWarehouses.slice(
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

        <Container fluid={true}>
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
                        {editId ? "Update Warehouse" : "Add New Warehouse"}
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
                          ? "Modify the selected warehouse details."
                          : "Create warehouses used for stock, order and dispatch management."}
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
                        Total Warehouses: {warehouseDetails.length}
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

                  <form onSubmit={handleSubmit}>
                    <Row className="g-3 align-items-end">
                      <Col lg={3} md={6}>
                        <Label
                          htmlFor="warehouse-name"
                          style={{
                            fontSize: "14px",
                            fontWeight: "800",
                            color: "#111827",
                            marginBottom: "8px",
                          }}
                        >
                          Warehouse Name
                        </Label>

                        <Input
                          id="warehouse-name"
                          name="name"
                          value={warehouseData.name}
                          onChange={handleChange}
                          placeholder="Example: Main Warehouse"
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

                      <Col lg={3} md={6}>
                        <Label
                          htmlFor="warehouse-address"
                          style={{
                            fontSize: "14px",
                            fontWeight: "800",
                            color: "#111827",
                            marginBottom: "8px",
                          }}
                        >
                          Warehouse Address
                        </Label>

                        <Input
                          id="warehouse-address"
                          type="text"
                          name="address"
                          value={warehouseData.address}
                          onChange={handleChange}
                          placeholder="Enter warehouse address"
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

                      <Col lg={2} md={6}>
                        <Label
                          htmlFor="warehouse-location"
                          style={{
                            fontSize: "14px",
                            fontWeight: "800",
                            color: "#111827",
                            marginBottom: "8px",
                          }}
                        >
                          Location
                        </Label>

                        <Input
                          id="warehouse-location"
                          type="text"
                          name="location"
                          value={warehouseData.location}
                          onChange={handleChange}
                          placeholder="Enter location"
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

                      <Col lg={2} md={6}>
                        <Label
                          htmlFor="warehouse-country"
                          style={{
                            fontSize: "14px",
                            fontWeight: "800",
                            color: "#111827",
                            marginBottom: "8px",
                          }}
                        >
                          Country
                        </Label>

                        <Select
                          inputId="warehouse-country"
                          name="country_code"
                          options={countryOptions}
                          value={selectedCountryOption}
                          onChange={(selected) =>
                            setWarehouseData((prev) => ({
                              ...prev,
                              country_code: selected ? selected.value : "",
                            }))
                          }
                          isClearable
                          placeholder="Select Country"
                          styles={selectStyles}
                        />
                      </Col>

                      <Col lg={2} md={12}>
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
                        onClick={resetForm}
                      >
                        Cancel Edit
                      </Button>
                    )}
                  </form>
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
                        Warehouses
                      </h4>

                      <p
                        className="mb-0"
                        style={{
                          color: "#475569",
                          fontSize: "14px",
                          fontWeight: "500",
                        }}
                      >
                        Manage all warehouse records from one place.
                      </p>
                    </Col>

                    <Col md={6}>
                      <Input
                        type="text"
                        placeholder="Search by warehouse, address, location or country..."
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
                            Warehouse
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
                            Address
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
                            Location
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
                            Country
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
                        {currentWarehouses.length > 0 ? (
                          currentWarehouses.map((data, index) => (
                            <tr
                              key={data.id || index}
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
                                    {data?.name
                                      ? data.name.substring(0, 2).toUpperCase()
                                      : "WH"}
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
                                      {data.name || "-"}
                                    </h6>

                                    <small
                                      style={{
                                        color: "#64748b",
                                        fontSize: "12px",
                                        fontWeight: "600",
                                      }}
                                    >
                                      Warehouse
                                    </small>
                                  </div>
                                </div>
                              </td>

                              <td
                                style={{
                                  padding: "16px 14px",
                                  color: "#334155",
                                  fontSize: "14px",
                                  fontWeight: "700",
                                  maxWidth: "280px",
                                  whiteSpace: "normal",
                                }}
                              >
                                {data.address || "-"}
                              </td>

                              <td
                                style={{
                                  padding: "16px 14px",
                                  color: "#334155",
                                  fontSize: "14px",
                                  fontWeight: "700",
                                }}
                              >
                                {data.location || "-"}
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
                                  {data.country || data.country_code || "-"}
                                </span>
                              </td>

                              <td
                                className="text-end"
                                style={{ padding: "16px 14px" }}
                              >
                                <Button
                                  size="sm"
                                  onClick={() => editWarehouse(data)}
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
                            <td colSpan="6">
                              <div className="text-center py-5">
                                <h5
                                  style={{
                                    fontWeight: "800",
                                    color: "#111827",
                                  }}
                                >
                                  No warehouses found
                                </h5>

                                <p
                                  className="mb-0"
                                  style={{
                                    color: "#475569",
                                    fontWeight: "500",
                                  }}
                                >
                                  Try another search keyword or add a new
                                  warehouse.
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
                      data={filteredWarehouses}
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
        </Container>
      </div>
    </React.Fragment>
  );
};

export default AddWarehousePage;