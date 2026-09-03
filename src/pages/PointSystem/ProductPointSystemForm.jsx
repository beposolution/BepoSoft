import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  Card,
  Col,
  Container,
  Row,
  CardBody,
  CardTitle,
  Label,
  Form,
  Input,
  FormFeedback,
  Button,
} from "reactstrap";
import * as Yup from "yup";
import { useFormik } from "formik";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Breadcrumbs from "../../components/Common/Breadcrumb";

const ProductPointSystemForm = () => {
  document.title = "Product Point System | Beposoft";

  const token = localStorage.getItem("token");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [warehouseId, setWarehouseId] = useState(
    localStorage.getItem("warehouse_id") || "1"
  );
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [productLoading, setProductLoading] = useState(false);
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);

  const pointTypeOptions = [
    {
      value: "product",
      label: "Product",
    },
    {
      value: "md",
      label: "MD",
    },
    {
      value: "sd",
      label: "SD",
    },
    {
      value: "new_conversions",
      label: "New Conversions",
    },
    {
      value: "new_customers",
      label: "New Customers",
    },
    {
      value: "new_lead",
      label: "New Lead",
    },
  ];

  const formik = useFormik({
    initialValues: {
      point_type: "",
      product: "",
      quantity: "",
      point: "",
    },

    validationSchema: Yup.object({
      point_type: Yup.string().required("Please select point type"),

      product: Yup.mixed().when("point_type", {
        is: "product",
        then: () =>
          Yup.number()
            .typeError("Product ID must be a number")
            .integer("Product ID must be a whole number")
            .positive("Product ID must be greater than 0")
            .required("Product is required"),
        otherwise: () => Yup.mixed().nullable(),
      }),

      quantity: Yup.mixed().when("point_type", {
        is: "product",
        then: () =>
          Yup.number()
            .typeError("Quantity must be a number")
            .integer("Quantity must be a whole number")
            .positive("Quantity must be greater than 0")
            .required("Quantity is required"),
        otherwise: () => Yup.mixed().nullable(),
      }),

      point: Yup.number()
        .typeError("Point must be a number")
        .min(0, "Point cannot be negative")
        .required("Point is required"),
    }),

    onSubmit: async (values, { resetForm }) => {
      try {
        setLoading(true);
        setError(null);

        const payload = {
          point_type: values.point_type,
          product:
            values.point_type === "product" && values.product
              ? Number(values.product)
              : null,
          quantity:
            values.point_type === "product" && values.quantity
              ? Number(values.quantity)
              : null,
          point: Number(values.point),
        };

        const response = await axios.post(
          `${import.meta.env.VITE_APP_KEY}product/point/system/`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 201 || response.status === 200) {
          toast.success(
            response?.data?.message || "Point system created successfully!",
            {
              position: "top-right",
              autoClose: 4000,
              theme: "colored",
            }
          );

          resetForm();
        }
      } catch (error) {
        const responseData = error?.response?.data;

        let message =
          responseData?.message ||
          responseData?.detail ||
          "Something went wrong. Please try again.";

        const validationErrors =
          responseData?.errors && typeof responseData.errors === "object"
            ? responseData.errors
            : null;

        if (validationErrors) {
          const firstKey = Object.keys(validationErrors)[0];
          const firstError = validationErrors[firstKey];

          message = Array.isArray(firstError)
            ? firstError[0]
            : typeof firstError === "string"
              ? firstError
              : message;

          if (firstKey) {
            formik.setFieldTouched(firstKey, true, false);
            formik.setFieldError(firstKey, message);
          }
        }

        setError(message);

        toast.error(message, {
          position: "top-right",
          autoClose: 4000,
          theme: "colored",
        });
      } finally {
        setLoading(false);
      }
    },
  });



  const fetchProducts = async (search = "") => {
    if (!token || !warehouseId) {
      setProducts([]);
      return;
    }

    try {
      setProductLoading(true);

      const response = await axios.get(
        `${import.meta.env.VITE_APP_KEY}warehouse/products/gets/${warehouseId}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            search: search.trim(),
          },
        }
      );

      const responseData = response?.data;
      const productList =
        responseData?.data?.data ||
        responseData?.results?.data ||
        responseData?.data ||
        responseData?.results ||
        [];

      setProducts(Array.isArray(productList) ? productList : []);
    } catch (error) {
      const status = error?.response?.status;

      if (status === 404) {
        setProducts([]);
      } else {
        toast.error(
          error?.response?.data?.message || "Failed to load products",
          {
            position: "top-right",
            autoClose: 3000,
            theme: "colored",
          }
        );
      }
    } finally {
      setProductLoading(false);
    }
  };

  useEffect(() => {
    if (formik.values.point_type !== "product") {
      return;
    }

    const timer = setTimeout(() => {
      fetchProducts(productSearch);
    }, 350);

    return () => clearTimeout(timer);
  }, [productSearch, warehouseId, formik.values.point_type]);

  const handlePointTypeChange = (e) => {
    const selectedPointType = e.target.value;

    formik.setFieldValue("point_type", selectedPointType);

    if (selectedPointType !== "product") {
      formik.setFieldValue("product", "");
      formik.setFieldValue("quantity", "");
      setProductSearch("");
      setProducts([]);
      setProductDropdownOpen(false);

      formik.setFieldTouched("product", false, false);
      formik.setFieldTouched("quantity", false, false);

      formik.setFieldError("product", undefined);
      formik.setFieldError("quantity", undefined);
    }
  };

  return (
    <React.Fragment>
      <style>{`
        .product-select-wrap {
          position: relative;
        }

        .product-search-box {
          position: relative;
        }

        .product-search-icon {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 3;
          font-size: 20px;
          line-height: 1;
          color: #74788d;
          pointer-events: none;
        }

        .product-search-input {
          min-height: 38px;
          padding-left: 42px !important;
          padding-right: 42px !important;
          border-radius: 8px !important;
          transition: border-color 0.18s ease, box-shadow 0.18s ease;
        }

        .product-search-input:focus {
          border-color: #556ee6 !important;
          box-shadow: 0 0 0 3px rgba(85, 110, 230, 0.10) !important;
        }

        .product-clear-btn {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          width: 25px;
          height: 25px;
          border: 0;
          border-radius: 50%;
          background: #f1f3f7;
          color: #74788d;
          font-size: 18px;
          line-height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 4;
        }

        .product-clear-btn:hover {
          background: #e9ecf2;
          color: #343a40;
        }

        .product-dropdown-panel {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          z-index: 1060;
          overflow: hidden;
          background: #ffffff;
          border: 1px solid #e6e9ef;
          border-radius: 12px;
          box-shadow: 0 12px 32px rgba(30, 40, 60, 0.14);
          animation: productDropdownIn 0.16s ease-out;
        }

        @keyframes productDropdownIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .product-dropdown-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 13px 14px 11px;
          border-bottom: 1px solid #eef0f4;
          background: #fbfcfe;
        }

        .product-dropdown-title {
          color: #343a40;
          font-size: 13px;
          font-weight: 700;
        }

        .product-dropdown-subtitle {
          margin-top: 2px;
          color: #8b91a0;
          font-size: 11px;
        }

        .product-result-count {
          flex: 0 0 auto;
          padding: 4px 8px;
          border-radius: 999px;
          background: #eef1ff;
          color: #556ee6;
          font-size: 10px;
          font-weight: 700;
        }

        .product-dropdown-list {
          max-height: 320px;
          overflow-y: auto;
          overscroll-behavior: contain;
          scrollbar-width: thin;
          scrollbar-color: #c9ced8 transparent;
        }

        .product-dropdown-list::-webkit-scrollbar {
          width: 6px;
        }

        .product-dropdown-list::-webkit-scrollbar-track {
          background: transparent;
        }

        .product-dropdown-list::-webkit-scrollbar-thumb {
          background: #c9ced8;
          border-radius: 20px;
        }

        .product-option {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 11px 13px;
          border: 0;
          border-bottom: 1px solid #f1f3f6;
          background: #ffffff;
          text-align: left;
          cursor: pointer;
          transition: background 0.14s ease;
        }

        .product-option:last-child {
          border-bottom: 0;
        }

        .product-option:hover {
          background: #f7f8ff;
        }

        .product-option-selected {
          background: #f2f4ff;
        }

        .product-avatar {
          width: 34px;
          height: 34px;
          flex: 0 0 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          background: #eef1ff;
          color: #556ee6;
          font-size: 13px;
          font-weight: 800;
        }

        .product-option-content {
          min-width: 0;
          flex: 1 1 auto;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .product-option-name {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #343a40;
          font-size: 12px;
          font-weight: 700;
        }

        .product-option-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }

        .product-meta-pill {
          padding: 2px 6px;
          border-radius: 5px;
          background: #f3f5f8;
          color: #7b8190;
          font-size: 9px;
          font-weight: 600;
          line-height: 1.5;
        }

        .product-selected-check {
          width: 23px;
          height: 23px;
          flex: 0 0 23px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #556ee6;
          color: #ffffff;
          font-size: 12px;
          font-weight: 800;
        }

        .product-state-box {
          min-height: 90px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 18px;
        }

        .product-spinner {
          width: 24px;
          height: 24px;
          flex: 0 0 24px;
          border: 3px solid #e8eafd;
          border-top-color: #556ee6;
          border-radius: 50%;
          animation: productSpin 0.75s linear infinite;
        }

        @keyframes productSpin {
          to { transform: rotate(360deg); }
        }

        .product-empty-state {
          min-height: 125px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
          text-align: center;
        }

        .product-empty-icon {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
          border-radius: 10px;
          background: #f3f5f8;
          color: #7b8190;
          font-size: 21px;
        }

        .product-state-title {
          color: #495057;
          font-size: 12px;
          font-weight: 700;
        }

        .product-state-text {
          margin-top: 2px;
          color: #8b91a0;
          font-size: 10px;
        }
      `}</style>

      <div className="page-content">
        <Container fluid={true}>
          <Breadcrumbs
            title="Forms"
            breadcrumbItem="Product Point System"
          />

          <Row>
            <Col xl={12}>
              <Card>
                <CardBody>
                  <CardTitle className="mb-4">
                    Product Point System
                  </CardTitle>

                  {error && <p className="text-danger">{error}</p>}

                  {!token && (
                    <p className="text-danger">
                      Token not found. Please login again.
                    </p>
                  )}

                  <Form onSubmit={formik.handleSubmit}>
                    <Row>
                      <Col lg={4}>
                        <div className="mb-3">
                          <Label htmlFor="point_type">
                            Point Type
                          </Label>

                          <Input
                            type="select"
                            name="point_type"
                            id="point_type"
                            value={formik.values.point_type}
                            onChange={handlePointTypeChange}
                            onBlur={formik.handleBlur}
                            invalid={
                              formik.touched.point_type &&
                              !!formik.errors.point_type
                            }
                          >
                            <option value="">
                              Select Point Type
                            </option>

                            {pointTypeOptions.map((item) => (
                              <option
                                key={item.value}
                                value={item.value}
                              >
                                {item.label}
                              </option>
                            ))}
                          </Input>

                          {formik.errors.point_type &&
                          formik.touched.point_type ? (
                            <FormFeedback>
                              {formik.errors.point_type}
                            </FormFeedback>
                          ) : null}
                        </div>
                      </Col>

                      {formik.values.point_type === "product" && (
                        <>
                          <Col lg={4}>
                            <div className="mb-3">
                              <Label htmlFor="product_search">
                                Product
                              </Label>

                              <div className="product-select-wrap">
                                <div className="product-search-box">
                                  <span className="product-search-icon">⌕</span>

                                  <Input
                                    type="text"
                                    name="product_search"
                                    id="product_search"
                                    className="product-search-input"
                                    placeholder={
                                      warehouseId
                                        ? "Search by product name or HSN..."
                                        : "Warehouse ID not found"
                                    }
                                    value={productSearch}
                                    disabled={!warehouseId}
                                    autoComplete="off"
                                    onFocus={() => {
                                      setProductDropdownOpen(true);
                                      fetchProducts(productSearch);
                                    }}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setProductSearch(value);
                                      setProductDropdownOpen(true);
                                      formik.setFieldValue("product", "");
                                    }}
                                    onBlur={() => {
                                      setTimeout(() => {
                                        setProductDropdownOpen(false);
                                        formik.setFieldTouched(
                                          "product",
                                          true,
                                          false
                                        );
                                      }, 200);
                                    }}
                                    invalid={
                                      formik.touched.product &&
                                      !!formik.errors.product
                                    }
                                  />

                                  {productSearch && (
                                    <button
                                      type="button"
                                      className="product-clear-btn"
                                      onMouseDown={(e) => e.preventDefault()}
                                      onClick={() => {
                                        setProductSearch("");
                                        formik.setFieldValue("product", "");
                                        setProductDropdownOpen(true);
                                      }}
                                      aria-label="Clear product search"
                                    >
                                      ×
                                    </button>
                                  )}
                                </div>

                                {productDropdownOpen && warehouseId && (
                                  <div className="product-dropdown-panel">
                                    <div className="product-dropdown-header">
                                      <div>
                                        <div className="product-dropdown-title">
                                          Select Product
                                        </div>
                                        <div className="product-dropdown-subtitle">
                                          Search by product name or HSN code
                                        </div>
                                      </div>

                                      {!productLoading && products.length > 0 && (
                                        <span className="product-result-count">
                                          {products.length} result{products.length === 1 ? "" : "s"}
                                        </span>
                                      )}
                                    </div>

                                    <div className="product-dropdown-list">
                                      {productLoading ? (
                                        <div className="product-state-box">
                                          <div className="product-spinner" />
                                          <div>
                                            <div className="product-state-title">
                                              Loading products
                                            </div>
                                            <div className="product-state-text">
                                              Please wait a moment...
                                            </div>
                                          </div>
                                        </div>
                                      ) : products.length === 0 ? (
                                        <div className="product-empty-state">
                                          <div className="product-empty-icon">⌕</div>
                                          <div className="product-state-title">
                                            No products found
                                          </div>
                                          <div className="product-state-text">
                                            Try another product name or HSN code.
                                          </div>
                                        </div>
                                      ) : (
                                        products.map((product) => {
                                          const productName =
                                            product.name || `Product #${product.id}`;
                                          const isSelected =
                                            Number(formik.values.product) === Number(product.id);

                                          return (
                                            <button
                                              type="button"
                                              key={product.id}
                                              className={`product-option ${
                                                isSelected ? "product-option-selected" : ""
                                              }`}
                                              onMouseDown={(e) => e.preventDefault()}
                                              onClick={() => {
                                                formik.setFieldValue(
                                                  "product",
                                                  product.id
                                                );
                                                formik.setFieldTouched(
                                                  "product",
                                                  true,
                                                  false
                                                );
                                                setProductSearch(productName);
                                                setProductDropdownOpen(false);
                                              }}
                                            >
                                              <span className="product-avatar">
                                                {productName.charAt(0).toUpperCase()}
                                              </span>

                                              <span className="product-option-content">
                                                <span className="product-option-name">
                                                  {productName}
                                                </span>

                                                <span className="product-option-meta">
                                                  <span className="product-meta-pill">
                                                    ID {product.id}
                                                  </span>

                                                  {product.hsn_code && (
                                                    <span className="product-meta-pill">
                                                      HSN {product.hsn_code}
                                                    </span>
                                                  )}
                                                </span>
                                              </span>

                                              {isSelected && (
                                                <span className="product-selected-check">✓</span>
                                              )}
                                            </button>
                                          );
                                        })
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {formik.errors.product &&
                              formik.touched.product ? (
                                <FormFeedback>
                                  {formik.errors.product}
                                </FormFeedback>
                              ) : null}
                            </div>
                          </Col>

                          <Col lg={4}>
                            <div className="mb-3">
                              <Label htmlFor="quantity">
                                Quantity
                              </Label>

                              <Input
                                type="number"
                                name="quantity"
                                id="quantity"
                                min="1"
                                step="1"
                                placeholder="Enter Quantity"
                                value={formik.values.quantity}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                invalid={
                                  formik.touched.quantity &&
                                  !!formik.errors.quantity
                                }
                              />

                              {formik.errors.quantity &&
                              formik.touched.quantity ? (
                                <FormFeedback>
                                  {formik.errors.quantity}
                                </FormFeedback>
                              ) : null}
                            </div>
                          </Col>
                        </>
                      )}
                    </Row>

                    <Row>
                      <Col lg={4}>
                        <div className="mb-3">
                          <Label htmlFor="point">
                            Point
                          </Label>

                          <Input
                            type="number"
                            name="point"
                            id="point"
                            min="0"
                            step="0.01"
                            placeholder="Enter Point"
                            value={formik.values.point}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            invalid={
                              formik.touched.point &&
                              !!formik.errors.point
                            }
                          />

                          {formik.errors.point &&
                          formik.touched.point ? (
                            <FormFeedback>
                              {formik.errors.point}
                            </FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                    </Row>

                    <div className="mb-3 mt-4">
                      <Button
                        type="submit"
                        color="primary"
                        disabled={loading || !token}
                      >
                        {loading
                          ? "Submitting..."
                          : "Create Point System"}
                      </Button>
                    </div>
                  </Form>
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

export default ProductPointSystemForm;
