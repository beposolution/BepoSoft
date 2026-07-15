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
  Spinner,
} from "reactstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Pagination from "../../components/Common/Pagination";

const MainCategoryPage = () => {
  const [mainCategoryData, setMainCategoryData] = useState({
    name: "",
  });

  const [mainCategories, setMainCategories] = useState([]);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const perPageData = 25;

  document.title = "Main Categories | Beposoft";

  const token = localStorage.getItem("token");
  const apiBase = import.meta.env.VITE_APP_KEY;

  const axiosCfg = {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };

  const inputStyle = {
    height: "48px",
    borderRadius: "10px",
    border: "1.5px solid #b8c2d6",
    color: "#111827",
    fontSize: "14px",
    fontWeight: "600",
    backgroundColor: "#ffffff",
  };

  const labelStyle = {
    fontSize: "14px",
    fontWeight: "800",
    color: "#111827",
    marginBottom: "8px",
  };

  const tableHeaderStyle = {
    padding: "16px 14px",
    color: "#1e293b",
    fontSize: "13px",
    fontWeight: "800",
    borderBottom: "1.5px solid #cbd5e1",
    whiteSpace: "nowrap",
  };

  const fetchMainCategories = async () => {
    setIsLoading(true);

    try {
      const response = await axios.get(
        `${apiBase}main/categories/add/`,
        axiosCfg
      );

      const responseData = response?.data;

      if (responseData?.status === "success") {
        setMainCategories(
          Array.isArray(responseData?.data) ? responseData.data : []
        );
      } else {
        setMainCategories([]);
        toast.error(
          responseData?.message || "Failed to fetch main categories."
        );
      }
    } catch (error) {
      console.error("Fetch main categories error:", error);

      setMainCategories([]);

      toast.error(
        error?.response?.data?.message ||
          "An error occurred while fetching main categories."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMainCategories();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setMainCategoryData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setMainCategoryData({
      name: "",
    });

    setEditId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const categoryName = mainCategoryData.name.trim();

    if (!categoryName) {
      toast.warning("Please enter the main category name.");
      return;
    }

    const payload = {
      name: categoryName,
    };

    setIsSubmitting(true);

    try {
      if (editId) {
        const response = await axios.put(
          `${apiBase}main/categories/edit/${editId}/`,
          payload,
          axiosCfg
        );

        if (response?.data?.status === "success") {
          toast.success(
            response?.data?.message ||
              "Main category updated successfully."
          );
        } else {
          toast.error(
            response?.data?.message ||
              "Failed to update main category."
          );
          return;
        }
      } else {
        const response = await axios.post(
          `${apiBase}main/categories/add/`,
          payload,
          axiosCfg
        );

        if (response?.data?.status === "success") {
          toast.success(
            response?.data?.message ||
              "Main category created successfully."
          );
        } else {
          toast.error(
            response?.data?.message ||
              "Failed to create main category."
          );
          return;
        }
      }

      resetForm();
      await fetchMainCategories();
    } catch (error) {
      console.error("Save main category error:", error);

      const responseData = error?.response?.data;
      const validationErrors = responseData?.errors;

      if (validationErrors?.name) {
        const nameError = Array.isArray(validationErrors.name)
          ? validationErrors.name[0]
          : validationErrors.name;

        toast.error(nameError);
      } else {
        toast.error(
          responseData?.message ||
            (editId
              ? "An error occurred while updating main category."
              : "An error occurred while creating main category.")
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const editMainCategory = (category) => {
    setEditId(category.id);

    setMainCategoryData({
      name: category.name || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const filteredMainCategories = mainCategories.filter((category) => {
    const searchValue = searchTerm.trim().toLowerCase();

    if (!searchValue) {
      return true;
    }

    return (
      category?.name?.toLowerCase().includes(searchValue) ||
      String(category?.id || "").includes(searchValue)
    );
  });

  const indexOfLastItem = currentPage * perPageData;
  const indexOfFirstItem = indexOfLastItem - perPageData;

  const currentMainCategories = filteredMainCategories.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const formatDateTime = (dateValue) => {
    if (!dateValue) {
      return "-";
    }

    const parsedDate = new Date(dateValue);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <React.Fragment>
      <div
        className="page-content"
        style={{
          backgroundColor: "#f3f6fb",
          minHeight: "100vh",
        }}
      >
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
                        {editId
                          ? "Update Main Category"
                          : "Add New Main Category"}
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
                          ? "Modify the selected main category."
                          : "Create and manage the main categories used for your products."}
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
                        Total Categories: {mainCategories.length}
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
                      <Col lg={8} md={8}>
                        <Label
                          htmlFor="main-category-name"
                          style={labelStyle}
                        >
                          Main Category Name
                        </Label>

                        <Input
                          id="main-category-name"
                          type="text"
                          name="name"
                          value={mainCategoryData.name}
                          onChange={handleChange}
                          placeholder="Example: Bicycles"
                          autoComplete="off"
                          maxLength={100}
                          disabled={isSubmitting}
                          style={inputStyle}
                        />
                      </Col>

                      <Col lg={2} md={4}>
                        <Button
                          color="primary"
                          type="submit"
                          className="w-100"
                          disabled={isSubmitting}
                          style={{
                            height: "48px",
                            borderRadius: "10px",
                            fontSize: "14px",
                            fontWeight: "800",
                            backgroundColor: "#1d4ed8",
                            borderColor: "#1d4ed8",
                            boxShadow:
                              "0 8px 18px rgba(29, 78, 216, 0.30)",
                          }}
                        >
                          {isSubmitting ? (
                            <>
                              <Spinner
                                size="sm"
                                className="me-2"
                              />
                              {editId ? "Updating..." : "Adding..."}
                            </>
                          ) : editId ? (
                            "Update"
                          ) : (
                            "Add"
                          )}
                        </Button>
                      </Col>

                      <Col lg={2} md={12}>
                        {editId && (
                          <Button
                            color="secondary"
                            type="button"
                            className="w-100"
                            disabled={isSubmitting}
                            onClick={resetForm}
                            style={{
                              height: "48px",
                              borderRadius: "10px",
                              fontSize: "14px",
                              fontWeight: "800",
                            }}
                          >
                            Cancel Edit
                          </Button>
                        )}
                      </Col>
                    </Row>
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
                        Main Categories
                      </h4>

                      <p
                        className="mb-0"
                        style={{
                          color: "#475569",
                          fontSize: "14px",
                          fontWeight: "500",
                        }}
                      >
                        View and update all main category records.
                      </p>
                    </Col>

                    <Col md={6}>
                      <Input
                        type="text"
                        placeholder="Search by category name or ID..."
                        value={searchTerm}
                        onChange={(event) =>
                          setSearchTerm(event.target.value)
                        }
                        style={inputStyle}
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
                              ...tableHeaderStyle,
                              width: "80px",
                            }}
                          >
                            #
                          </th>

                          <th style={tableHeaderStyle}>
                            Main Category
                          </th>

                          <th style={tableHeaderStyle}>
                            Created At
                          </th>

                          <th style={tableHeaderStyle}>
                            Updated At
                          </th>

                          <th
                            className="text-end"
                            style={{
                              ...tableHeaderStyle,
                              width: "160px",
                            }}
                          >
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {isLoading ? (
                          <tr>
                            <td colSpan="5">
                              <div className="text-center py-5">
                                <Spinner color="primary" />

                                <p
                                  className="mb-0 mt-3"
                                  style={{
                                    color: "#475569",
                                    fontWeight: "600",
                                  }}
                                >
                                  Loading main categories...
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) : currentMainCategories.length > 0 ? (
                          currentMainCategories.map(
                            (category, index) => (
                              <tr
                                key={category.id || index}
                                style={{
                                  borderBottom:
                                    "1px solid #dfe6f1",
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

                                <td
                                  style={{
                                    padding: "16px 14px",
                                  }}
                                >
                                  <div className="d-flex align-items-center gap-3">
                                    <div
                                      className="rounded-circle d-flex align-items-center justify-content-center"
                                      style={{
                                        width: "42px",
                                        height: "42px",
                                        minWidth: "42px",
                                        backgroundColor: "#dbeafe",
                                        color: "#1d4ed8",
                                        fontWeight: "900",
                                        fontSize: "14px",
                                        border:
                                          "1px solid #bfdbfe",
                                      }}
                                    >
                                      {category?.name
                                        ? category.name
                                            .substring(0, 2)
                                            .toUpperCase()
                                        : "MC"}
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
                                        {category.name || "-"}
                                      </h6>

                                      <small
                                        style={{
                                          color: "#64748b",
                                          fontSize: "12px",
                                          fontWeight: "600",
                                        }}
                                      >
                                        Main Category ID:{" "}
                                        {category.id || "-"}
                                      </small>
                                    </div>
                                  </div>
                                </td>

                                <td
                                  style={{
                                    padding: "16px 14px",
                                    color: "#334155",
                                    fontSize: "13px",
                                    fontWeight: "700",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {formatDateTime(
                                    category.created_at
                                  )}
                                </td>

                                <td
                                  style={{
                                    padding: "16px 14px",
                                    color: "#334155",
                                    fontSize: "13px",
                                    fontWeight: "700",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {formatDateTime(
                                    category.updated_at
                                  )}
                                </td>

                                <td
                                  className="text-end"
                                  style={{
                                    padding: "16px 14px",
                                  }}
                                >
                                  <Button
                                    size="sm"
                                    type="button"
                                    onClick={() =>
                                      editMainCategory(category)
                                    }
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
                            )
                          )
                        ) : (
                          <tr>
                            <td colSpan="5">
                              <div className="text-center py-5">
                                <h5
                                  style={{
                                    fontWeight: "800",
                                    color: "#111827",
                                  }}
                                >
                                  No main categories found
                                </h5>

                                <p
                                  className="mb-0"
                                  style={{
                                    color: "#475569",
                                    fontWeight: "500",
                                  }}
                                >
                                  Try another search keyword or add a
                                  new main category.
                                </p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>

                  {!isLoading &&
                    filteredMainCategories.length > 0 && (
                      <div className="mt-3">
                        <Pagination
                          perPageData={perPageData}
                          data={filteredMainCategories}
                          currentPage={currentPage}
                          setCurrentPage={setCurrentPage}
                          isShowingPageLength={true}
                          paginationDiv="col-auto"
                          paginationClass="pagination-rounded"
                          indexOfFirstItem={indexOfFirstItem}
                          indexOfLastItem={indexOfLastItem}
                        />
                      </div>
                    )}
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default MainCategoryPage;