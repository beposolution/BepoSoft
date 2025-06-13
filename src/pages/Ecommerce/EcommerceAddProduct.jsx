import React, { useState, useEffect } from "react";
import { Button, Card, CardBody, CardTitle, Col, Container, Form, Input, Label, Row, FormFeedback } from "reactstrap";
import Dropzone from "react-dropzone";
import * as yup from "yup";
import { useFormik } from "formik";
import Select from "react-select";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import axios from "axios"; // Ensure axios is imported

const EcommerenceAddProduct = () => {
  document.title = "Add Product | Skote - Vite React Admin & Dashboard Template";

  const [selectedFiles, setselectedFiles] = useState([]);
  const [productFamilies, setProductFamilies] = useState([]);
  const token = localStorage.getItem('token');
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchProductFamilies = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_APP_KEY}familys/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        setProductFamilies(response.data.data); // Adjust based on actual response structure
      } catch (error) {
        console.error('Error fetching product families:', error);
      }
    };

    fetchProductFamilies();
  }, [token]);

  const UNIT_TYPES = [
    { value: 'NOS', label: 'NOS' },
    { value: 'PRS', label: 'PRS' },
    { value: 'BOX', label: 'BOX' },
    { value: 'SET', label: 'SET' },
    { value: 'SET OF 12', label: 'SET OF 12' },
    { value: 'SET OF 16', label: 'SET OF 16' },
    { value: 'SET OF 6', label: 'SET OF 6' },
    { value: 'SET OF 8', label: 'SET OF 8' },
  ];

  const types = [
    { value: 'single', label: 'single' },
    { value: 'variant', label: 'variant' },
  ];

  const handleAcceptedFiles = (files) => {
    files.map(file =>
      Object.assign(file, {
        preview: URL.createObjectURL(file),
        formattedSize: formatBytes(file.size),
      })
    );

    setselectedFiles(files);
  };



  const formik = useFormik({
    initialValues: {
      name: '',
      hsn_code: '',
      family: [],
      purchase_rate: '',
      type: '',
      tax: '',
      unit: "",
      selling_price: '',
      stock: '',
      image: null
    },


    
    validationSchema: yup.object().shape({
      name: yup.string().required('Please Enter Your Product Name'),
      hsn_code: yup.string().required('Please Enter Your HSN Code'),
      family: yup.array().min(1, 'Please select at least one Family'),
      purchase_rate: yup.number().required('Please Enter Your Purchase Rate'),
      type: yup.string().required('Please Enter Your Product Type'),
      tax: yup.string().required('Please Enter Your Tax'),
      unit: yup.string().required('Please Enter Your Product Unit'),
      selling_price: yup.number().required('Please Enter Your Selling Price'),
      // stock: yup.number().required('Please Enter Your Stock'),
      image: yup.mixed()
        .nullable()
        .required('Please upload an image')
        .test('fileSize', 'File size is too large', (value) => {
          return value ? value.size <= 5 * 1024 * 1024 : true;
        })
    }),
 
    onSubmit: async (values) => {
      const formData = new FormData();
    
      // Log initial formik values
      console.log("Formik Values:", values);
    
      // Append form values to FormData
      formData.append("name", values.name);
      console.log("After appending name:", [...formData.entries()]);
    
      formData.append("hsn_code", values.hsn_code);
      console.log("After appending HSN Code:", [...formData.entries()]);
    
      // Handle family array
      values.family.forEach(familyId => {
        formData.append("family[]", familyId);
      });
      console.log("After appending family:", [...formData.entries()]);
    
      formData.append("purchase_rate", values.purchase_rate);
      console.log("After appending purchase rate:", [...formData.entries()]);
    
      formData.append("type", values.type);
      console.log("After appending type:", [...formData.entries()]);
    
      formData.append("tax", values.tax);
      console.log("After appending tax:", [...formData.entries()]);
    
      formData.append("unit", values.unit);
      console.log("After appending unit:", [...formData.entries()]);
    
      formData.append("selling_price", values.selling_price);
      console.log("After appending selling price:", [...formData.entries()]);
    
      // Conditionally append stock for 'single' type
      if (values.type === 'single') {
        formData.append("stock", values.stock);
        console.log("After appending stock:", [...formData.entries()]);
      }
    
      // Append image if exists
      if (values.image) {
        formData.append("image", values.image);
        console.log("After appending image:", [...formData.entries()]);
      }
    
      try {
        const response = await axios.post(
         `${import.meta.env.VITE_APP_KEY}add/product/`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        setSuccessMessage("Product added successfully!");
        setErrorMessage("");
        formik.resetForm();
      } catch (error) {
        console.error("Error adding product:", error);
        setErrorMessage("Failed to add product. Please try again.");
        setSuccessMessage("");
      }
    },
    
  });



  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="Ecommerce" breadcrumbItem="Add Product" />

          <Row>
            <Col xs="12">
              <Card>
                <CardBody>
                  <CardTitle tag="h4">Basic Information</CardTitle>
                  <p className="card-title-desc mb-4">
                    Fill all information below
                  </p>

                  {successMessage && (
                    <div className="alert alert-success" role="alert">
                      {successMessage}
                    </div>
                  )}

                  <Form onSubmit={formik.handleSubmit} autoComplete="off">
                    <Row>
                      <Col sm="6">
                        <div className="mb-3">
                          <Label htmlFor="name">Product Name</Label>
                          <Input
                            id="name"
                            name="name"
                            type="text"
                            placeholder="Product Name"
                            value={formik.values.name}
                            onChange={formik.handleChange}
                            invalid={formik.touched.name && formik.errors.name ? true : false}
                          />
                          {formik.errors.name && formik.touched.name ? (
                            <FormFeedback type="invalid">{formik.errors.name}</FormFeedback>
                          ) : null}
                        </div>

                        <div className="mb-3">
                          <Label htmlFor="hsn_code">HSN CODE</Label>
                          <Input
                            id="hsn_code"
                            name="hsn_code"
                            type="text"
                            placeholder="HSN CODE"
                            value={formik.values.hsn_code}
                            onChange={formik.handleChange}
                            invalid={formik.touched.hsn_code && formik.errors.hsn_code ? true : false}
                          />
                          {formik.errors.hsn_code && formik.touched.hsn_code ? (
                            <FormFeedback type="invalid">{formik.errors.hsn_code}</FormFeedback>
                          ) : null}
                        </div>

                        {/* Purchase Rate */}
                        <div className="mb-3">
                          <Label htmlFor="purchase_rate">Purchase Rate</Label>
                          <Input
                            id="purchase_rate"
                            name="purchase_rate"
                            type="number"
                            placeholder="Purchase Rate"
                            value={formik.values.purchase_rate}
                            onChange={formik.handleChange}
                            invalid={formik.touched.purchase_rate && formik.errors.purchase_rate ? true : false}
                          />
                          {formik.errors.purchase_rate && formik.touched.purchase_rate ? (
                            <FormFeedback type="invalid">{formik.errors.purchase_rate}</FormFeedback>
                          ) : null}
                        </div>

                        {/* Tax */}
                        <div className="mb-3">
                          <Label htmlFor="tax">Tax</Label>
                          <Input
                            id="tax"
                            name="tax"
                            type="number"
                            placeholder="Tax"
                            value={formik.values.tax}
                            onChange={formik.handleChange}
                            invalid={formik.touched.tax && formik.errors.tax ? true : false}
                          />
                          {formik.errors.tax && formik.touched.tax ? (
                            <FormFeedback type="invalid">{formik.errors.tax}</FormFeedback>
                          ) : null}
                        </div>

                        <div className="mb-3">
                          <div className="control-label" style={{ marginBottom: "0.5rem" }}>Image</div>
                          <Input
                            id="image"
                            name="image"
                            type="file"
                            accept="image/*"
                            onChange={(event) => {
                              formik.setFieldValue("image", event.currentTarget.files[0]);
                            }}
                            invalid={formik.touched.image && formik.errors.image ? true : false}
                          />
                        </div>

                      </Col>


                      <Col sm="6">
                        {/* Unit Type */}
                        <div className="mb-3">
                          <div className="control-label" style={{ marginBottom: "0.5rem" }}>Unit Type</div>
                          <Select
                            name="unit"
                            options={UNIT_TYPES}
                            className="select2"
                            value={UNIT_TYPES.find((option) => option.value === formik.values.unit)}
                            onChange={(selectedOption) => formik.setFieldValue("unit", selectedOption.value)}
                          />
                          {formik.errors.unit && formik.touched.unit ? (
                            <span className="text-danger">{formik.errors.unit}</span>
                          ) : null}
                        </div>

                        {/* Product Type */}
                        <div className="mb-3">
                          <div className="control-label" style={{ marginBottom: "0.5rem" }}>Product Type</div>
                          <Select
                            name="type"
                            options={types}
                            className="select2"
                            value={types.find((option) => option.value === formik.values.type)}
                            onChange={(selectedOption) => formik.setFieldValue("type", selectedOption.value)}
                          />
                          {formik.errors.type && formik.touched.type ? (
                            <span className="text-danger">{formik.errors.type}</span>
                          ) : null}
                        </div>

                        {/* Conditionally Render Stock Field for "single" Product Type */}
                        {formik.values.type === 'single' && (
                          <div className="mb-3">
                            <Label htmlFor="stock">Stock</Label>
                            <Input
                              id="stock"
                              name="stock"
                              type="number"
                              placeholder="Stock"
                              value={formik.values.stock}
                              onChange={formik.handleChange}
                              invalid={formik.touched.stock && formik.errors.stock ? true : false}
                            />
                            {formik.errors.stock && formik.touched.stock ? (
                              <FormFeedback type="invalid">{formik.errors.stock}</FormFeedback>
                            ) : null}
                          </div>
                        )}

                        {/* Product Family */}
                        <div className="mb-3">
                          <div className="control-label" style={{ marginBottom: "0.5rem" }}>Product Family</div>
                          <Select
                            classNamePrefix="select2-selection"
                            name="family"
                            placeholder="Choose..."
                            options={productFamilies.map(family => ({
                              value: family.id,
                              label: family.name
                            }))}
                            isMulti
                            value={productFamilies.filter(family =>
                              formik.values.family.includes(family.id)
                            ).map(family => ({
                              value: family.id,
                              label: family.name
                            }))}
                            onChange={selectedOptions =>
                              formik.setFieldValue(
                                "family",
                                selectedOptions.map(option => option.value)
                              )
                            }
                          />
                          {formik.errors.family && formik.touched.family ? (
                            <span className="text-danger">{formik.errors.family}</span>
                          ) : null}
                        </div>

                        <div className="mb-3">
                          <Label htmlFor="selling_price">Selling Price</Label>
                          <Input
                            id="selling_price"
                            name="selling_price"
                            type="number"
                            placeholder="Selling Price"
                            value={formik.values.selling_price}
                            onChange={formik.handleChange}
                            invalid={formik.touched.selling_price && formik.errors.selling_price ? true : false}
                          />
                          {formik.errors.selling_price && formik.touched.selling_price ? (
                            <FormFeedback type="invalid">{formik.errors.selling_price}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                    </Row>

                    {/* Action Buttons */}
                    <div className="d-flex flex-wrap gap-2">
                      <Button type="submit" color="primary">Save Changes</Button>
                      <Button type="button" color="secondary" onClick={() => formik.resetForm()}>Cancel</Button>
                    </div>
                  </Form>

                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
}

export default EcommerenceAddProduct;
