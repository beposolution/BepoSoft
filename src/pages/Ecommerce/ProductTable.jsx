import React, { useEffect, useState } from "react";
import axios from 'axios';
import { Table, Row, Col, Card, CardBody, CardTitle, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem, UncontrolledTooltip, Input, Button } from "reactstrap";
import { FaSearch } from 'react-icons/fa';
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { useNavigate } from 'react-router-dom';

const truncateText = (text, length) => {
  return text.length > length ? `${text.substring(0, length)}...` : text;
};

const BasicTable = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch(`${import.meta.env.VITE_APP_KEY}products/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        if (data && Array.isArray(data.data)) {
          setProducts(data.data);
          setFilteredProducts(data.data);
        } else {
          setError("No data found or unexpected response structure");
        }

        setLoading(false);
      } catch (err) {
        setError(err.message || "Unknown error occurred");
        setLoading(false);
      }
    };

    fetchProducts();
  }, [token, navigate]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  };

  const handleResetSearch = () => {
    setSearchTerm("");
    setFilteredProducts(products);
  };

  const handleAddProduct = () => {
    navigate('/ecommerce-add-product');
  };


  const handleEditVie = (productId) => {
    navigate(`/ecommerce-product-edit/${productId}/`);
  };

  const handleProductClick = (productId, productType) => {
    navigate(`/ecommerce-product-variant/${productId}/${productType}/`);
  };

  const handleViewProduct = (productId, productType) => {
    navigate(`/ecommerce-product-detail/${productId}/${productType}/`); // Adjust this path as per your view product route
  };

  const onClickDelete = async (productId) => {
    try {
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.delete(`${import.meta.env.VITE_APP_KEY}product/update/${productId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        setProducts(products.filter(product => product.id !== productId));
        setFilteredProducts(filteredProducts.filter(product => product.id !== productId));
      } else {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
    } catch (err) {
      setError(err.message || "Failed to delete product");
    }
  };

  document.title = "Product Tables | Beposoft";

  return (
    <React.Fragment>
      <div className="page-content">
        <div className="container-fluid">
          <Breadcrumbs title="Tables" breadcrumbItem="Product Tables" />
          <Row>
            <Col xl={12}>
              <Card>
                <CardBody>
                  <Row className="mb-3">
                    <Col md={8}>
                      <div className="hstack gap-3">
                        <Input
                          className="form-control me-auto"
                          type="text"
                          placeholder="Search products..."
                          aria-label="Search products"
                          value={searchTerm}
                          onChange={handleSearchChange}
                        />
                        <Button color="secondary" onClick={handleSearchSubmit}>
                          <FaSearch />
                        </Button>
                        <div className="vr"></div>
                        <Button color="outline-danger" onClick={handleResetSearch}>
                          Reset
                        </Button>
                      </div>
                    </Col>
                    <Col md={4} className="text-end">
                      <Button color="primary" onClick={handleAddProduct}>
                        Add Product
                      </Button>
                    </Col>
                  </Row>
                  <CardTitle className="h4 text-center">Product Table</CardTitle>
                  {loading ? (
                    <p>Loading...</p>
                  ) : error ? (
                    <p className="text-danger">Error: {error}</p>
                  ) : (
                    <div className="table-responsive">
                      <Table className="table mb-0">
                        <thead>
                          <tr className="text-center">
                            <th>#</th>
                            <th>Image</th>
                            <th>Name</th>
                            <th>HSN CODE</th>
                            <th>TYPE</th>
                            <th>UNIT</th>
                            <th>PURCHASE RATE</th>
                            <th>TAX %</th>
                            <th>EXCLUDED PRICE</th>
                            <th>SELLING PRICE</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProducts.length > 0 ? (
                            filteredProducts.map((product, index) => (
                              <tr key={product.id} className="text-center">
                                <th scope="row">{index + 1}</th>
                                <td>
                                  <img
                                    src={product.image}
                                    alt={product.name}
                                    style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "5px" }}
                                  />
                                </td>
                                <td style={{ cursor: 'pointer' }} onClick={() => handleProductClick(product.id, product.type)}>
                                  {truncateText(product.name, 30)}
                                </td>
                                <td>{product.hsn_code}</td>
                                <td>{product.type}</td>
                                <td>{product.unit}</td>
                                <td>{product.purchase_rate}</td>
                                <td>{product.tax}%</td>
                                <td>{Math.floor(product.exclude_price)}</td>
                                <td>{product.selling_price}</td>
                                <td>
                                  <UncontrolledDropdown>
                                    <DropdownToggle tag="a" className="card-drop">
                                      <i className="mdi mdi-dots-horizontal font-size-18"></i>
                                    </DropdownToggle>
                                    <DropdownMenu className="dropdown-menu-end">
                                      <DropdownItem onClick={() => handleEditVie(product.id)}>
                                        <i className="mdi mdi-pencil font-size-16 text-success me-1" id={`edittooltip-${product.id}`}></i>
                                        Edit
                                        <UncontrolledTooltip placement="top" target={`edittooltip-${product.id}`}>
                                          Edit
                                        </UncontrolledTooltip>
                                      </DropdownItem>
                                      <DropdownItem onClick={() => onClickDelete(product.id)}>
                                        <i className="mdi mdi-trash-can font-size-16 text-danger me-1" id={`deletetooltip-${product.id}`}></i>
                                        Delete
                                        <UncontrolledTooltip placement="top" target={`deletetooltip-${product.id}`}>
                                          Delete
                                        </UncontrolledTooltip>
                                      </DropdownItem>
                                      <DropdownItem onClick={() => handleViewProduct(product.id, product.type)}>
                                        <i className="mdi mdi-eye font-size-16 text-info me-1" id={`viewtooltip-${product.id}`}></i>
                                        View
                                        <UncontrolledTooltip placement="top" target={`viewtooltip-${product.id}`}>
                                          View Product
                                        </UncontrolledTooltip>
                                      </DropdownItem>
                                    </DropdownMenu>
                                  </UncontrolledDropdown>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="11">No products available</td>
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
        </div>
      </div>
    </React.Fragment>
  );
};

export default BasicTable;
