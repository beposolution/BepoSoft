import React, { useEffect, useMemo, useState } from "react";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import {
  Card,
  CardBody,
  Col,
  Row,
  Table,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Input,
  Spinner,
} from "reactstrap";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Paginations from "../../components/Common/Pagination";

const CustomerType = () => {
  // List & loading
  const [items, setItems] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  // Create form (inline, like AddRack)
  const [typeName, setTypeName] = useState("");

  // Modal for View/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [saving, setSaving] = useState(false);

  // Search + pagination
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const perPageData = 10;

  const BASE = import.meta.env.VITE_APP_KEY;
  const token = localStorage.getItem("token");
  const authHeader = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  document.title = "Customer Types | Beposoft";

  // Fetch list
  const fetchList = async () => {
    try {
      setLoadingList(true);
      const res = await axios.get(`${BASE}customer-types/`, authHeader);
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load customer types");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [BASE, token]);

  // Client-side search + pagination
  const filtered = useMemo(() => {
    const q = (query || "").toLowerCase().trim();
    if (!q) return items;
    return items.filter((it) => (it.type_name || "").toLowerCase().includes(q));
  }, [items, query]);

  const indexOfLastItem = currentPage * perPageData;
  const indexOfFirstItem = indexOfLastItem - perPageData;
  const currentList = filtered.slice(indexOfFirstItem, indexOfLastItem);

  // Create (inline form)
  const handleCreate = async (e) => {
    e.preventDefault();
    const name = typeName.trim();
    if (!name) {
      toast.warn("Type name is required");
      return;
    }
    try {
      await axios.post(
        `${BASE}customer-types/`,
        { type_name: name },
        authHeader
      );
      toast.success("Customer type created");
      setTypeName("");
      // refresh
      fetchList();
      // reset to first page so the new item is visible when sorting differs
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.detail ||
        Object.values(err.response?.data || {})?.[0]?.[0] ||
        "Create failed";
      toast.error(String(msg));
    }
  };

  // Open modal + fetch fresh detail for accuracy (like openModal in AddRack)
  const openModal = async (id) => {
    try {
      const res = await axios.get(`${BASE}customer-types/${id}/`, authHeader);
      setEditingType(res.data);
      setIsModalOpen(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch the customer type");
    }
  };

  // Update (from modal)
  const handleUpdate = async () => {
    if (!editingType?.id) return;
    const updatedName = (editingType.type_name || "").trim();
    if (!updatedName) {
      toast.warn("Type name is required");
      return;
    }
    setSaving(true);
    try {
      await axios.put(
        `${BASE}customer-types/${editingType.id}/`,
        { type_name: updatedName },
        authHeader
      );
      toast.success("Customer type updated");
      setIsModalOpen(false);
      setEditingType(null);
      fetchList();
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.detail ||
        Object.values(err.response?.data || {})?.[0]?.[0] ||
        "Update failed";
      toast.error(String(msg));
    } finally {
      setSaving(false);
    }
  };

  return (
    <React.Fragment>
      <ToastContainer position="top-right" autoClose={2000} />
      <div className="page-content">
        <div className="container-fluid">
          <Breadcrumbs title="Customers" breadcrumbItem="CUSTOMER TYPE DETAILS" />

          {/* Top inline form (like AddRack) */}
          <Row>
            <Col>
              <Card>
                <CardBody>
                  <Form onSubmit={handleCreate}>
                    <Row className="g-3 align-items-end">
                      <Col xl={6} lg={6} md={8}>
                        <Label htmlFor="type_name">Type Name</Label>
                        <Input
                          id="type_name"
                          value={typeName}
                          onChange={(e) => setTypeName(e.target.value)}
                          placeholder="e.g., Retail, Wholesale, Distributor"
                        />
                      </Col>
                      <Col xl={3} lg={3} md={4}>
                        <Button color="primary" type="submit" className="mt-md-0 mt-2">
                          Add Type
                        </Button>
                      </Col>
                      <Col xl={3} className="d-flex justify-content-end">
                        <div className="ms-auto" style={{ minWidth: 260 }}>
                          <Label className="mb-1">Search</Label>
                          <Input
                            placeholder="Search type…"
                            value={query}
                            onChange={(e) => {
                              setQuery(e.target.value);
                              setCurrentPage(1);
                            }}
                          />
                        </div>
                      </Col>
                    </Row>
                  </Form>
                </CardBody>
              </Card>
            </Col>
          </Row>

          {/* Table + pagination (like AddRack) */}
          <Row>
            <Col xl={12}>
              <Card>
                <CardBody>
                  <h5 className="mb-3">Customer Type List</h5>
                  <div className="table-responsive">
                    {loadingList ? (
                      <div className="d-flex align-items-center gap-2">
                        <Spinner size="sm" /> <span>Loading…</span>
                      </div>
                    ) : currentList.length > 0 ? (
                      <Table responsive bordered hover className="align-middle">
                        <thead>
                          <tr>
                            <th style={{ width: 80 }}>#</th>
                            <th>Type Name</th>
                            <th style={{ width: 120 }}>View</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentList.map((row, idx) => (
                            <tr key={row.id}>
                              <td>{indexOfFirstItem + idx + 1}</td>
                              <td>{row.type_name || "-"}</td>
                              <td>
                                <Button
                                  size="sm"
                                  color="info"
                                  onClick={() => openModal(row.id)}
                                >
                                  View
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    ) : (
                      <div className="text-muted">No customer types found.</div>
                    )}
                  </div>

                  {/* Pagination control */}
                  <Paginations
                    perPageData={perPageData}
                    data={filtered}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    isShowingPageLength={true}
                    paginationDiv="d-flex justify-content-end"
                    paginationClass=""
                    indexOfFirstItem={indexOfFirstItem}
                    indexOfLastItem={indexOfLastItem}
                  />
                </CardBody>
              </Card>
            </Col>
          </Row>
        </div>
      </div>

      {/* View/Edit Modal (like AddRack) */}
      <Modal isOpen={isModalOpen} toggle={() => setIsModalOpen(false)}>
        <ModalHeader toggle={() => setIsModalOpen(false)}>View / Edit Type</ModalHeader>
        <ModalBody>
          {editingType ? (
            <>
              {/* <FormGroup>
                <Label>ID</Label>
                <Input value={editingType.id} readOnly />
              </FormGroup> */}
              <FormGroup>
                <Label>Type Name</Label>
                <Input
                  value={editingType.type_name || ""}
                  onChange={(e) =>
                    setEditingType((prev) => ({ ...prev, type_name: e.target.value }))
                  }
                />
              </FormGroup>
            </>
          ) : (
            <div className="text-muted d-flex align-items-center gap-2">
              <Spinner size="sm" /> <span>Loading…</span>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={handleUpdate} disabled={saving || !editingType}>
            {saving ? "Saving…" : "Update"}
          </Button>
          <Button color="secondary" onClick={() => setIsModalOpen(false)} disabled={saving}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </React.Fragment>
  );
};

export default CustomerType;
