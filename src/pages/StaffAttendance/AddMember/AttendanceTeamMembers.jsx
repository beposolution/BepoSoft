import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Card,
  CardBody,
  CardTitle,
  Col,
  Container,
  Row,
  Form,
  Label,
  Button,
  Spinner,
  Table,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "reactstrap";
import Select from "react-select";
import { useFormik } from "formik";
import * as Yup from "yup";
import Breadcrumbs from "../../../components/Common/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AttendanceTeamMembers = () => {
  document.title = "Attendance Team Members | Beposoft";

  const token = localStorage.getItem("token");
  const baseUrl = import.meta.env.VITE_APP_KEY;

  const [teams, setTeams] = useState([]);
  const [staffs, setStaffs] = useState([]);
  const [membersData, setMembersData] = useState([]);

  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [editModal, setEditModal] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState(null);

  const [editInitialValues, setEditInitialValues] = useState({
    team: "",
    member: "",
  });

  const customSelectStyles = {
    control: (provided) => ({
      ...provided,
      minHeight: "44px",
      borderRadius: "10px",
    }),
  };

  const fetchTeams = async () => {
  try {
    const res = await axios.get(
      `${baseUrl}staff/attendance/teams/`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setTeams(res?.data?.data || []);
  } catch (error) {
  console.log("TEAM ERROR", error);
  console.log("TEAM RESPONSE", error?.response);
  console.log("TEAM REQUEST", error?.request);

  toast.error("Failed to load teams");
}
};

  const fetchStaffs = async () => {
    try {
      const res = await axios.get(
        `${baseUrl}staff/managers/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setStaffs(res?.data?.data || []);
    } catch (error) {
      toast.error("Failed to load staff");
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await axios.get(
        `${baseUrl}staff/attendance/team/members/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMembersData(res?.data?.data || []);
    } catch (error) {
      toast.error("Failed to load members");
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      await Promise.all([
        fetchTeams(),
        fetchStaffs(),
        fetchMembers(),
      ]);

      setLoading(false);
    };

    init();
  }, []);

  const teamOptions = useMemo(() => {
    return teams.map((item) => ({
      value: item.id,
      label: item.team_name,
    }));
  }, [teams]);

  const staffOptions = useMemo(() => {
    return staffs.map((item) => ({
      value: item.id,
      label: item.name,
    }));
  }, [staffs]);

  const formik = useFormik({
    initialValues: {
      team: "",
      member: "",
    },

    validationSchema: Yup.object({
      team: Yup.string().required("Select Team"),
      member: Yup.string().required("Select Member"),
    }),

    onSubmit: async (values, { resetForm }) => {
      try {
        setSubmitLoading(true);

        const payload = {
          team: Number(values.team),
          member: Number(values.member),
        };

        const res = await axios.post(
          `${baseUrl}staff/attendance/team/members/`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (res.status === 200 || res.status === 201) {
          toast.success("Member added successfully");
          resetForm();
          fetchMembers();
        }
      } catch (error) {
        toast.error(
          error?.response?.data?.message ||
          "Failed to add member"
        );
      } finally {
        setSubmitLoading(false);
      }
    },
  });

  const openEditModal = async (id) => {
    try {
      const res = await axios.get(
        `${baseUrl}staff/attendance/team/members/edit/${id}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = res?.data?.data;

      setSelectedMemberId(id);

      setEditInitialValues({
        team: String(data.team),
        member: String(data.member),
      });

      setEditModal(true);
    } catch (error) {
      toast.error("Failed to load member");
    }
  };

  const editFormik = useFormik({
    enableReinitialize: true,

    initialValues: editInitialValues,

    onSubmit: async (values) => {
      try {
        const payload = {
          team: Number(values.team),
          member: Number(values.member),
        };

        await axios.put(
          `${baseUrl}staff/attendance/team/members/edit/${selectedMemberId}/`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        toast.success("Updated successfully");

        setEditModal(false);

        fetchMembers();
      } catch (error) {
        toast.error("Update failed");
      }
    },
  });

  if (loading) {
    return (
      <div className="page-content">
        <Container fluid>
          <div className="text-center py-5">
            <Spinner />
          </div>
        </Container>
      </div>
    );
  }

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>

          <Breadcrumbs
            title="Attendance"
            breadcrumbItem="Team Members"
          />

          <Card className="mb-4">
            <CardBody>
              <CardTitle>Add Team Member</CardTitle>

              <Form onSubmit={formik.handleSubmit}>
                <Row>

                  <Col md={5}>
                    <Label>Team</Label>

                    <Select
                      options={teamOptions}
                      styles={customSelectStyles}
                      value={
                        teamOptions.find(
                          x =>
                            String(x.value) ===
                            String(formik.values.team)
                        ) || null
                      }
                      onChange={(e) =>
                        formik.setFieldValue(
                          "team",
                          e?.value || ""
                        )
                      }
                    />
                  </Col>

                  <Col md={5}>
                    <Label>Member</Label>

                    <Select
                      options={staffOptions}
                      styles={customSelectStyles}
                      value={
                        staffOptions.find(
                          x =>
                            String(x.value) ===
                            String(formik.values.member)
                        ) || null
                      }
                      onChange={(e) =>
                        formik.setFieldValue(
                          "member",
                          e?.value || ""
                        )
                      }
                    />
                  </Col>

                  <Col md={2}>
                    <Button
                      color="primary"
                      className="w-100 mt-4"
                      type="submit"
                    >
                      {submitLoading
                        ? "Adding..."
                        : "Add Member"}
                    </Button>
                  </Col>

                </Row>
              </Form>
            </CardBody>
          </Card>

          {membersData.map((team) => (
            <Card key={team.team_id} className="mb-4">
              <CardBody>

                <h5>{team.team_name}</h5>

                <p>
                  Leader :
                  <strong>
                    {" "}
                    {team.team_leader_name}
                  </strong>
                </p>

                <p>
                  Total Members :
                  <strong>
                    {" "}
                    {team.members_count}
                  </strong>
                </p>

                <Table bordered responsive>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Member Name</th>
                      <th>Created At</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {team.members.length > 0 ? (
                      team.members.map((member, index) => (
                        <tr key={member.id}>
                          <td>{index + 1}</td>
                          <td>{member.member_name}</td>
                          <td>
                            {new Date(
                              member.created_at
                            ).toLocaleString()}
                          </td>

                          <td>
                            <Button
                              color="warning"
                              size="sm"
                              onClick={() =>
                                openEditModal(member.id)
                              }
                            >
                              Edit
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="4"
                          className="text-center"
                        >
                          No Members Found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>

              </CardBody>
            </Card>
          ))}

          <Modal
            isOpen={editModal}
            toggle={() => setEditModal(false)}
            centered
          >
            <ModalHeader toggle={() => setEditModal(false)}>
              Edit Member
            </ModalHeader>

            <Form onSubmit={editFormik.handleSubmit}>
              <ModalBody>

                <Label>Team</Label>

                <Select
                  options={teamOptions}
                  value={
                    teamOptions.find(
                      x =>
                        String(x.value) ===
                        String(editFormik.values.team)
                    ) || null
                  }
                  onChange={(e) =>
                    editFormik.setFieldValue(
                      "team",
                      e?.value || ""
                    )
                  }
                />

                <Label className="mt-3">
                  Member
                </Label>

                <Select
                  options={staffOptions}
                  value={
                    staffOptions.find(
                      x =>
                        String(x.value) ===
                        String(editFormik.values.member)
                    ) || null
                  }
                  onChange={(e) =>
                    editFormik.setFieldValue(
                      "member",
                      e?.value || ""
                    )
                  }
                />

              </ModalBody>

              <ModalFooter>
                <Button color="primary" type="submit">
                  Update
                </Button>
              </ModalFooter>
            </Form>
          </Modal>

          <ToastContainer />
        </Container>
      </div>
    </React.Fragment>
  );
};

export default AttendanceTeamMembers;