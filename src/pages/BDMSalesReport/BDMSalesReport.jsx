import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import {
  Card,
  CardBody,
  Col,
  Row,
  CardTitle,
  Form,
  Label,
  Button,
} from "reactstrap";
import "react-toastify/dist/ReactToastify.css";
import Select from "react-select";
import { FaPlusCircle, FaTrash } from "react-icons/fa";

const BDMSalesReport = () => {
  const [stateList, setStateList] = useState([]);
  const [invoiceList, setInvoiceList] = useState([]);
  const [bdoList, setBdoList] = useState([]);
  const [loading, setLoading] = useState(false);
  document.title = "BEPOSOFT | BDO's Daily Sales Report";
  const token = localStorage.getItem("token");

  const [entries, setEntries] = useState([
    {
      state: null,
      invoice: null,
      bdo: null,
      call_duration: "",
      new_coach: "no",
      micro_dealer: "no",
      average: "",
      note: "",
    },
  ]);


  const fetchStates = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_KEY}states/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStateList(response?.data?.data || []);
    } catch (error) {
      toast.error("Failed to load States");
    }
  };


  const fetchInvoice = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_KEY}all/orders/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInvoiceList(response.data || []);
    } catch (error) {
      toast.error("Failed to load Orders");
    }
  };


  const fetchBDOUsers = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_KEY}staffs/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const allStaffs = response?.data?.data || [];
      const bdoOnly = allStaffs.filter(
        (user) => user.designation === "BDO"
      );

      setBdoList(bdoOnly);
    } catch (error) {
      toast.error("Failed to load BDO Users");
    }
  };

  useEffect(() => {
    fetchStates();
    fetchInvoice();
    fetchBDOUsers();
  }, []);

  // dropdown options
  const stateOptions = stateList.map((item) => ({
    value: item.id,
    label: item.name,
  }));

  const invoiceOptions = invoiceList.map((item) => ({
    value: item.id,
    label: `${item.invoice} - ${item.manage_staff}`,
  }));

  const bdoOptions = bdoList.map((item) => ({
    value: item.id,
    label: item.name,
  }));

  // update entry
  const updateEntry = (index, field, value) => {
    const updated = [...entries];
    updated[index][field] = value;
    setEntries(updated);
  };

  // add entry
  const addNewEntry = () => {
    setEntries([
      ...entries,
      {
        state: null,
        invoice: null,
        bdo: null,
        call_duration: "",
        new_coach: "no",
        micro_dealer: "no",
        average: "",
        note: "",
      },
    ]);
  };

  // remove entry
  const removeEntry = (index) => {
    if (entries.length === 1) {
      toast.error("At least one entry is required");
      return;
    }
    const updated = [...entries];
    updated.splice(index, 1);
    setEntries(updated);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    // validation
    for (let i = 0; i < entries.length; i++) {
      const row = entries[i];

      if (!row.state) {
        toast.error(`Row ${i + 1}: Please select State`);
        return;
      }
      if (!row.invoice) {
        toast.error(`Row ${i + 1}: Please select Invoice`);
        return;
      }
      if (!row.bdo) {
        toast.error(`Row ${i + 1}: Please select BDO`);
        return;
      }
    }

    try {
      setLoading(true);

      await Promise.all(
        entries.map((row) =>
          axios.post(
            `${import.meta.env.VITE_APP_KEY}monthly/sales/report/bdm/bdo/`,
            {
              state: row.state.value,
              invoice: row.invoice.value,
              bdo: row.bdo.value,
              new_coach: row.new_coach,
              micro_dealer: row.micro_dealer,
              note: row.note,
              call_duration: row.call_duration,
              average: row.average,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          )
        )
      );

      toast.success("All Reports Added Successfully!");

      // reset
      setEntries([
        {
          state: null,
          invoice: null,
          bdo: null,
          call_duration: "",
          new_coach: "no",
          micro_dealer: "no",
          average: "",
          note: "",
        },
      ]);
    } catch (error) {
      const backendMessage =
        error?.response?.data?.errors?.invoice?.[0] ||
        error?.response?.data?.message ||
        "Failed to submit report";

      toast.error(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <React.Fragment>
      <ToastContainer />
      <div className="page-content">
        <Breadcrumbs
          title="Daily Sales Report"
          breadcrumbItem="Add Daily Sales Report"
        />

        <Row>
          <Col lg={12}>
            <Card>
              <CardBody>
                <CardTitle className="h4 mb-4">
                  ADD DAILY SALES REPORT
                </CardTitle>

                <Form onSubmit={handleSubmit}>
                  {entries.map((row, index) => (
                    <Card
                      key={index}
                      className="p-3 mb-3"
                      style={{ border: "1px solid #ddd" }}
                    >
                      <Row>
                        <Col md={4}>
                          <div className="mb-3">
                            <Label>State</Label>
                            <Select
                              options={stateOptions}
                              value={row.state}
                              onChange={(val) =>
                                updateEntry(index, "state", val)
                              }
                              placeholder="Select State"
                              isClearable
                            />
                          </div>
                        </Col>

                        <Col md={4}>
                          <div className="mb-3">
                            <Label>Invoice</Label>
                            <Select
                              options={invoiceOptions}
                              value={row.invoice}
                              onChange={(val) =>
                                updateEntry(index, "invoice", val)
                              }
                              placeholder="Select Invoice"
                              isClearable
                            />
                          </div>
                        </Col>

                        <Col md={4}>
                          <div className="mb-3">
                            <Label>BDO</Label>
                            <Select
                              options={bdoOptions}
                              value={row.bdo}
                              onChange={(val) =>
                                updateEntry(index, "bdo", val)
                              }
                              placeholder="Select BDO"
                              isClearable
                            />
                          </div>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={4}>
                          <div className="mb-3">
                            <Label>Call Duration</Label>
                            <input
                              type="text"
                              className="form-control"
                              value={row.call_duration}
                              onChange={(e) =>
                                updateEntry(
                                  index,
                                  "call_duration",
                                  e.target.value
                                )
                              }
                              placeholder="Eg: 5 mins"
                            />
                          </div>
                        </Col>

                        <Col md={4}>
                          <div className="mb-3">
                            <Label>New Coach</Label>
                            <select
                              className="form-control"
                              value={row.new_coach}
                              onChange={(e) =>
                                updateEntry(
                                  index,
                                  "new_coach",
                                  e.target.value
                                )
                              }
                            >
                              <option value="no">NO</option>
                              <option value="yes">YES</option>
                            </select>
                          </div>
                        </Col>

                        <Col md={4}>
                          <div className="mb-3">
                            <Label>Micro Dealer</Label>
                            <select
                              className="form-control"
                              value={row.micro_dealer}
                              onChange={(e) =>
                                updateEntry(
                                  index,
                                  "micro_dealer",
                                  e.target.value
                                )
                              }
                            >
                              <option value="no">NO</option>
                              <option value="yes">YES</option>
                            </select>
                          </div>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={4}>
                          <div className="mb-3">
                            <Label>Average</Label>
                            <input
                              type="text"
                              className="form-control"
                              value={row.average}
                              onChange={(e) =>
                                updateEntry(index, "average", e.target.value)
                              }
                              placeholder="Enter Average"
                            />
                          </div>
                        </Col>

                        <Col md={8}>
                          <div className="mb-3">
                            <Label>Note</Label>
                            <textarea
                              className="form-control"
                              value={row.note}
                              onChange={(e) =>
                                updateEntry(index, "note", e.target.value)
                              }
                              placeholder="Enter Note"
                            />
                          </div>
                        </Col>
                      </Row>

                      <div className="d-flex justify-content-end gap-3">
                        <Button
                          type="button"
                          color="danger"
                          onClick={() => removeEntry(index)}
                        >
                          <FaTrash /> Remove
                        </Button>

                        {index === entries.length - 1 && (
                          <Button
                            type="button"
                            color="success"
                            onClick={addNewEntry}
                          >
                            <FaPlusCircle /> Add More
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}

                  <Button color="primary" type="submit" disabled={loading}>
                    {loading ? "Saving..." : "Submit All"}
                  </Button>
                </Form>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
    </React.Fragment>
  );
};

export default BDMSalesReport;
