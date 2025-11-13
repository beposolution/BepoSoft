import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { Dropdown } from "react-bootstrap";
import {
  Table,
  Row,
  Col,
  Card,
  CardBody,
  CardTitle,
  CardSubtitle,
  Button,
  Input,
  FormGroup,
  Label,
} from "reactstrap";
import { useNavigate } from "react-router-dom";
import Paginations from "../../components/Common/Pagination";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const BasicTable = () => {
  const [data, setData] = useState([]);
  const [states, setStates] = useState([]);
  const [managers, setManager] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedFamily, setSelectedFamily] = useState("");
  const [selectedManager, setSelectedManager] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPageData] = useState(10);

  const [familyData, setFamilyData] = useState([]);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFamilyData = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_APP_KEY}familys/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setFamilyData(response?.data?.data || []);
      } catch (error) {
        toast.error("Error fetching family data.");
      }
    };
    if (token) fetchFamilyData();
  }, [token]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const customerResponse = await axios.get(
          `${import.meta.env.VITE_APP_KEY}customers/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (customerResponse.status === 200) {
          setData(customerResponse.data.data || []);

          const [responseState, responseManager] = await Promise.all([
            axios.get(`${import.meta.env.VITE_APP_KEY}states/`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get(`${import.meta.env.VITE_APP_KEY}staffs/`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);

          if (responseState.status === 200)
            setStates(responseState.data.data || []);
          if (responseManager.status === 200)
            setManager(responseManager.data.data || []);
        }
      } catch (error) {
        setError(error.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchData();
  }, [token]);

  const handleSearch = (e) => setSearchTerm(e.target.value);
  const handleStateFilter = (e) => setSelectedState(e.target.value);
  const handleFamilyFilter = (e) => setSelectedFamily(e.target.value);
  const handleManagerFilter = (e) => setSelectedManager(e.target.value);

  // quick lookup map for manager id -> manager name (used in exports / display)
  const managerMap = useMemo(() => {
    const map = {};
    (managers || []).forEach((m) => {
      map[m.id] = m.name || m.username || `#${m.id}`;
    });
    return map;
  }, [managers]);

  // Build a fast text search target per customer
  const filteredData = useMemo(() => {
    const term = (searchTerm || "").trim().toLowerCase();

    return (data || [])
      .filter((customer) => {
        if (selectedFamily) {
          const fam = (customer.family || "").toString().toLowerCase();
          if (fam !== selectedFamily.toLowerCase()) return false;
        }

        // state filter
        if (selectedState) {
          const st = (customer.state_name || "").toLowerCase();
          if (st !== selectedState.toLowerCase()) return false;
        }

        // manager filter (customer.manager is an id)
        if (selectedManager) {
          // compare as strings to avoid type issues
          if ((customer.manager || "").toString() !== selectedManager) return false;
        }

        if (!term) return true;

        const name = (customer.name || "").toLowerCase();
        const phone = (customer.phone || "").toLowerCase();
        const gst = (customer.gst || "").toLowerCase();
        const email = (customer.email || "").toLowerCase();
        const stateName = (customer.state_name || "").toLowerCase();

        return (
          name.includes(term) ||
          phone.includes(term) ||
          gst.includes(term) ||
          email.includes(term) ||
          stateName.includes(term)
        );
      })
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [data, searchTerm, selectedState, selectedFamily, selectedManager]);

  const handleUpdate = (customerId) => navigate(`/customer/${customerId}/edit/`);
  const handleAddress = (customerId) =>
    navigate(`/customer/address/${customerId}/add/`);
  const handleLedger = (customerId) =>
    navigate(`/customer/${customerId}/ledger/`);

  const exportToExcel = () => {
    const formattedData = filteredData.map((customer, index) => ({
      "#": index + 1,
      Name: customer.name,
      Manager: managerMap[customer.manager] || customer.manager || "N/A",
      GST: customer.gst || "N/A",
      Email: customer.email || "N/A",
      Phone: customer.phone || "N/A",
      "Alt Phone": customer.alt_phone || "N/A",
      City: customer.city || "N/A",
      State: customer.state_name || "N/A",
      Zip: customer.zip_code || "N/A",
      Address: customer.address || "N/A",
      Family: customer.family || "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
    XLSX.writeFile(workbook, "Customer_List.xlsx");
  };

  // Pagination
  const indexOfLastItem = currentPage * perPageData;
  const indexOfFirstItem = indexOfLastItem - perPageData;
  const currentPageData = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  document.title = "Customer List | BEPOSOFT";

  return (
    <React.Fragment>
      <div className="page-content">
        <div className="container-fluid">
          <Row>
            <Col xl={12}>
              <Card>
                <CardBody>
                  <CardTitle className="h4">Customer List</CardTitle>
                  <CardSubtitle className="card-title-desc">
                    Filter and view customer data.
                  </CardSubtitle>

                  <Row className="align-items-end mb-3 g-3">
                    <Col md={3}>
                      <FormGroup className="mb-0">
                        <Label className="mb-1">Search</Label>
                        <Input
                          type="text"
                          placeholder="Search by Name, Phone, GST, Email, State"
                          value={searchTerm}
                          onChange={handleSearch}
                          className="w-100"
                        />
                      </FormGroup>
                    </Col>

                    <Col md={2}>
                      <FormGroup className="mb-0">
                        <Label className="mb-1">Family</Label>
                        <Input
                          type="select"
                          value={selectedFamily}
                          onChange={handleFamilyFilter}
                          className="w-100"
                        >
                          <option value="">All Families</option>
                          {familyData.map((fam) => (
                            <option key={fam.id} value={fam.name}>
                              {fam.name}
                            </option>
                          ))}
                        </Input>
                      </FormGroup>
                    </Col>

                    <Col md={2}>
                      <FormGroup className="mb-0">
                        <Label className="mb-1">State</Label>
                        <Input
                          type="select"
                          value={selectedState}
                          onChange={handleStateFilter}
                          className="w-100"
                        >
                          <option value="">All States</option>
                          {states.map((state) => (
                            <option key={state.id} value={state.name}>
                              {state.name}
                            </option>
                          ))}
                        </Input>
                      </FormGroup>
                    </Col>

                    <Col md={2}>
                      <FormGroup className="mb-0">
                        <Label className="mb-1">Manager</Label>
                        <Input
                          type="select"
                          value={selectedManager}
                          onChange={handleManagerFilter}
                          className="w-100"
                        >
                          <option value="">All Managers</option>
                          {managers.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} 
                              {/* {m.allocated_states_names ? ` — ${m.allocated_states_names.join(', ')}` : ''} */}
                            </option>
                          ))}
                        </Input>
                      </FormGroup>
                    </Col>

                    <Col md={2} className="d-flex">
                      <Button
                        color="success"
                        onClick={exportToExcel}
                        className="ms-auto w-100"
                        style={{ marginTop: "24px" }}
                      >
                        Export to Excel
                      </Button>
                    </Col>
                  </Row>

                  {loading ? (
                    <p>Loading...</p>
                  ) : error ? (
                    <p className="text-danger">{error}</p>
                  ) : (
                    <>
                      <div className="table-responsive">
                        <Table bordered striped hover className="mb-0">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Name</th>
                              <th>GST</th>
                              <th>Email</th>
                              <th>State</th>
                              <th>Phone</th>
                              <th>Family</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentPageData.map((customer, index) => (
                              <tr key={customer.id}>
                                <th scope="row">{indexOfFirstItem + index + 1}</th>
                                <td>{customer.name}</td>
                                <td>{customer.gst || "N/A"}</td>
                                <td>{customer.email || "N/A"}</td>
                                <td>{customer.state_name || "N/A"}</td>
                                <td>{customer.phone || "N/A"}</td>
                                <td>{customer.family || "N/A"}</td>
                                <td>
                                  <Dropdown>
                                    <Dropdown.Toggle
                                      variant="secondary"
                                      size="sm"
                                      id={`dropdown-${customer.id}`}
                                    >
                                      Actions
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu>
                                      <Dropdown.Item
                                        onClick={() => handleUpdate(customer.id)}
                                      >
                                        Update
                                      </Dropdown.Item>
                                      <Dropdown.Item
                                        onClick={() => handleAddress(customer.id)}
                                      >
                                        Address
                                      </Dropdown.Item>
                                      <Dropdown.Item
                                        onClick={() => handleLedger(customer.id)}
                                      >
                                        Ledger
                                      </Dropdown.Item>
                                    </Dropdown.Menu>
                                  </Dropdown>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>

                      <Paginations
                        perPageData={perPageData}
                        data={filteredData}
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        isShowingPageLength={true}
                        paginationDiv="mt-3 d-flex justify-content-center"
                        paginationClass="pagination pagination-rounded"
                        indexOfFirstItem={indexOfFirstItem}
                        indexOfLastItem={indexOfLastItem}
                      />
                    </>
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
