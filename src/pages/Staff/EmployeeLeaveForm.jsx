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
import Select from "react-select";

const EmployeeLeaveForm = () => {
  document.title = "Employee Leave Form | Beposoft";

  const token = localStorage.getItem("token");

  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [supervisorLoading, setSupervisorLoading] = useState(false);
  const [error, setError] = useState(null);

  const supervisorOptions = supervisors.map((item) => ({
    value: item.id,
    label:
      item.name ||
      item.supervisor_name ||
      item.user_name ||
      item.employee_name ||
      `Supervisor ${item.id}`,
  }));

  const formik = useFormik({
    initialValues: {
      leave_type: "",
      no_of_days: "",
      start_date: "",
      end_date: "",
      reason: "",
      manager: "",
    },

    validationSchema: Yup.object({
      leave_type: Yup.string().required("Please select leave type"),
      no_of_days: Yup.number()
        .typeError("No of days must be a number")
        .nullable(),
      start_date: Yup.string().required("Start date is required"),
      end_date: Yup.string().required("End date is required"),
      reason: Yup.string().nullable(),
      manager: Yup.string().required("Please select manager"),
    }),

    onSubmit: async (values, { resetForm }) => {
      try {
        setLoading(true);
        setError(null);

        const payload = {
          leave_type: values.leave_type,
          no_of_days: values.no_of_days ? Number(values.no_of_days) : null,
          start_date: values.start_date,
          end_date: values.end_date,
          reason: values.reason,
          manager: values.manager ? Number(values.manager) : null,
        };

        const response = await axios.post(
          `${import.meta.env.VITE_APP_KEY}employee/leaves/`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 201 || response.status === 200) {
          toast.success("Employee leave submitted successfully!", {
            position: "top-right",
            autoClose: 4000,
            theme: "colored",
          });

          resetForm();
        }
      } catch (error) {
        const responseData = error?.response?.data;

        let message =
          responseData?.message ||
          responseData?.detail ||
          "Something went wrong. Please try again.";

        if (responseData?.errors) {
          const firstKey = Object.keys(responseData.errors)[0];
          const firstError = responseData.errors[firstKey];

          message = Array.isArray(firstError)
            ? firstError[0]
            : firstError || message;

          formik.setFieldTouched(firstKey, true, false);
          formik.setFieldError(firstKey, message);
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

  const fetchSupervisors = async () => {
    try {
      setSupervisorLoading(true);

      const response = await axios.get(
        `${import.meta.env.VITE_APP_KEY}supervisors/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data =
        response?.data?.results?.data ||
        response?.data?.results ||
        response?.data?.data ||
        response?.data ||
        [];

      setSupervisors(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Failed to fetch supervisors");
    } finally {
      setSupervisorLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchSupervisors();
    } else {
      setError("Token not found");
    }
  }, [token]);

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid={true}>
          <Breadcrumbs title="Forms" breadcrumbItem="Employee Leave Form" />

          <Row>
            <Col xl={12}>
              <Card>
                <CardBody>
                  <CardTitle className="mb-4">Employee Leave Form</CardTitle>

                  {error && <p className="text-danger">{error}</p>}

                  <Form onSubmit={formik.handleSubmit}>
                    <Row>
                      <Col lg={4}>
                        <div className="mb-3">
                          <Label htmlFor="leave_type">Leave Type</Label>
                          <Input
                            type="select"
                            name="leave_type"
                            id="leave_type"
                            value={formik.values.leave_type}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            invalid={
                              formik.touched.leave_type &&
                              !!formik.errors.leave_type
                            }
                          >
                            <option value="">Select Leave Type</option>
                            <option value="sick_leave">Sick Leave</option>
                            <option value="casual_leave">Casual Leave</option>
                            <option value="earned_leave">Earned Leave</option>
                            <option value="maternity_leave">
                              Maternity Leave
                            </option>
                            <option value="paternity_leave">
                              Paternity Leave
                            </option>
                          </Input>

                          {formik.errors.leave_type &&
                          formik.touched.leave_type ? (
                            <FormFeedback>
                              {formik.errors.leave_type}
                            </FormFeedback>
                          ) : null}
                        </div>
                      </Col>

                      <Col lg={4}>
                        <div className="mb-3">
                          <Label htmlFor="no_of_days">No Of Days</Label>
                          <Input
                            type="number"
                            name="no_of_days"
                            id="no_of_days"
                            placeholder="Enter no of days"
                            value={formik.values.no_of_days}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            invalid={
                              formik.touched.no_of_days &&
                              !!formik.errors.no_of_days
                            }
                          />

                          {formik.errors.no_of_days &&
                          formik.touched.no_of_days ? (
                            <FormFeedback>
                              {formik.errors.no_of_days}
                            </FormFeedback>
                          ) : null}
                        </div>
                      </Col>

                      <Col lg={4}>
                        <div className="mb-3">
                          <Label htmlFor="manager">Manager</Label>
                          <Select
                            inputId="manager"
                            name="manager"
                            options={supervisorOptions}
                            isClearable
                            isSearchable
                            isLoading={supervisorLoading}
                            placeholder="Select Manager"
                            classNamePrefix="react-select"
                            noOptionsMessage={() =>
                              supervisorLoading
                                ? "Loading..."
                                : "No supervisors found"
                            }
                            value={
                              supervisorOptions.find(
                                (option) =>
                                  String(option.value) ===
                                  String(formik.values.manager)
                              ) || null
                            }
                            onChange={(selectedOption) => {
                              formik.setFieldValue(
                                "manager",
                                selectedOption ? selectedOption.value : ""
                              );
                            }}
                            onBlur={() =>
                              formik.setFieldTouched("manager", true)
                            }
                            className={
                              formik.touched.manager && formik.errors.manager
                                ? "is-invalid"
                                : ""
                            }
                          />

                          {formik.errors.manager && formik.touched.manager ? (
                            <div className="invalid-feedback d-block">
                              {formik.errors.manager}
                            </div>
                          ) : null}
                        </div>
                      </Col>
                    </Row>

                    <Row>
                      <Col lg={4}>
                        <div className="mb-3">
                          <Label htmlFor="start_date">Start Date</Label>
                          <Input
                            type="date"
                            name="start_date"
                            id="start_date"
                            value={formik.values.start_date}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            invalid={
                              formik.touched.start_date &&
                              !!formik.errors.start_date
                            }
                          />

                          {formik.errors.start_date &&
                          formik.touched.start_date ? (
                            <FormFeedback>
                              {formik.errors.start_date}
                            </FormFeedback>
                          ) : null}
                        </div>
                      </Col>

                      <Col lg={4}>
                        <div className="mb-3">
                          <Label htmlFor="end_date">End Date</Label>
                          <Input
                            type="date"
                            name="end_date"
                            id="end_date"
                            value={formik.values.end_date}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            invalid={
                              formik.touched.end_date &&
                              !!formik.errors.end_date
                            }
                          />

                          {formik.errors.end_date &&
                          formik.touched.end_date ? (
                            <FormFeedback>
                              {formik.errors.end_date}
                            </FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                    </Row>

                    <Row>
                      <Col lg={12}>
                        <div className="mb-3">
                          <Label htmlFor="reason">Reason</Label>
                          <Input
                            type="textarea"
                            name="reason"
                            id="reason"
                            placeholder="Enter leave reason"
                            value={formik.values.reason}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            invalid={
                              formik.touched.reason && !!formik.errors.reason
                            }
                          />

                          {formik.errors.reason && formik.touched.reason ? (
                            <FormFeedback>{formik.errors.reason}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                    </Row>

                    <div className="mb-3 mt-4">
                      <Button type="submit" color="primary" disabled={loading}>
                        {loading ? "Submitting..." : "Submit Leave"}
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

export default EmployeeLeaveForm;