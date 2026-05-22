import React, { useEffect, useState } from "react";
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

const BasicTable = () => {
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newAttribute, setNewAttribute] = useState("");
  const [editingAttribute, setEditingAttribute] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const token = localStorage.getItem("token");

  const [currentPage, setCurrentPage] = useState(1);
  const [perPageData] = useState(25);

  document.title = "Product Attributes | Beposoft";

  const fetchAttributes = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${import.meta.env.VITE_APP_KEY}product/attributes/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }

      const data = await response.json();
      setAttributes(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Failed to fetch product attributes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttributes();
  }, [token]);

  const resetForm = () => {
    setNewAttribute("");
    setEditingAttribute(null);
  };

  const handleAddOrUpdateAttribute = async (e) => {
    e.preventDefault();

    if (!newAttribute.trim()) {
      toast.warning("Please enter attribute name");
      return;
    }

    const apiUrl = editingAttribute
      ? `${import.meta.env.VITE_APP_KEY}product/attribute/${
          editingAttribute.id
        }/delete/`
      : `${import.meta.env.VITE_APP_KEY}add/product/attributes/`;

    const method = editingAttribute ? "PUT" : "POST";

    try {
      const response = await fetch(apiUrl, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newAttribute,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to ${editingAttribute ? "update" : "add"} attribute`
        );
      }

      toast.success(
        editingAttribute
          ? "Attribute updated successfully!"
          : "Attribute added successfully!"
      );

      resetForm();
      fetchAttributes();
    } catch (err) {
      toast.error(
        editingAttribute
          ? "Failed to update attribute"
          : "Failed to add attribute"
      );
    }
  };

  const handleEditAttribute = (attribute) => {
    setEditingAttribute(attribute);
    setNewAttribute(attribute.name || "");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const filteredAttributes = attributes.filter((attribute) => {
    const search = searchTerm.toLowerCase();

    return attribute?.name?.toLowerCase().includes(search);
  });

  const indexOfLastItem = currentPage * perPageData;
  const indexOfFirstItem = indexOfLastItem - perPageData;

  const currentPageData = filteredAttributes.slice(
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
                        {editingAttribute
                          ? "Update Product Attribute"
                          : "Add New Product Attribute"}
                      </h4>

                      <p
                        className="mb-0"
                        style={{
                          color: "#475569",
                          fontSize: "14px",
                          fontWeight: "500",
                        }}
                      >
                        {editingAttribute
                          ? "Modify the selected product attribute details."
                          : "Create product attributes used for product specifications and filtering."}
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
                        Total Attributes: {attributes.length}
                      </Badge>

                      {editingAttribute && (
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

                  <Form onSubmit={handleAddOrUpdateAttribute}>
                    <Row className="g-3 align-items-end">
                      <Col md={10}>
                        <Label
                          htmlFor="attributeName"
                          style={{
                            fontSize: "14px",
                            fontWeight: "800",
                            color: "#111827",
                            marginBottom: "8px",
                          }}
                        >
                          Attribute Name
                        </Label>

                        <Input
                          type="text"
                          id="attributeName"
                          value={newAttribute}
                          onChange={(e) => setNewAttribute(e.target.value)}
                          placeholder="Example: Size, Color, Material"
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
                          {editingAttribute ? "Update" : "Add"}
                        </Button>
                      </Col>
                    </Row>

                    {editingAttribute && (
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
                        Product Attributes
                      </h4>

                      <p
                        className="mb-0"
                        style={{
                          color: "#475569",
                          fontSize: "14px",
                          fontWeight: "500",
                        }}
                      >
                        Manage all product attribute records from one place.
                      </p>
                    </Col>

                    <Col md={6}>
                      <Input
                        type="text"
                        placeholder="Search by attribute name..."
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
                            Attribute Name
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
                        {loading ? (
                          <tr>
                            <td colSpan="3">
                              <div className="text-center py-5">
                                <h5
                                  style={{
                                    fontWeight: "800",
                                    color: "#111827",
                                  }}
                                >
                                  Loading attributes...
                                </h5>

                                <p
                                  className="mb-0"
                                  style={{
                                    color: "#475569",
                                    fontWeight: "500",
                                  }}
                                >
                                  Please wait while product attributes are being
                                  loaded.
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) : currentPageData.length > 0 ? (
                          currentPageData.map((attribute, index) => (
                            <tr
                              key={attribute.id || index}
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
                                    {attribute?.name
                                      ? attribute.name
                                          .substring(0, 2)
                                          .toUpperCase()
                                      : "AT"}
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
                                      {attribute.name || "-"}
                                    </h6>

                                    <small
                                      style={{
                                        color: "#64748b",
                                        fontSize: "12px",
                                        fontWeight: "600",
                                      }}
                                    >
                                      Product attribute
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
                                  onClick={() => handleEditAttribute(attribute)}
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
                            <td colSpan="3">
                              <div className="text-center py-5">
                                <h5
                                  style={{
                                    fontWeight: "800",
                                    color: "#111827",
                                  }}
                                >
                                  No attributes found
                                </h5>

                                <p
                                  className="mb-0"
                                  style={{
                                    color: "#475569",
                                    fontWeight: "500",
                                  }}
                                >
                                  Try another search keyword or add a new
                                  product attribute.
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
                      data={filteredAttributes}
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

export default BasicTable;