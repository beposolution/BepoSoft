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
import AsyncSelect from "react-select/async";
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

  const apiBase = useMemo(() => {
    if (!baseUrl) return "";
    const trimmed = baseUrl.replace(/\/+$/, "");
    if (trimmed.endsWith("/api")) {
      return `${trimmed}/`;
    }
    return `${trimmed}/api/`;
  }, [baseUrl]);

  const buildUrl = (path) => `${apiBase}${path.replace(/^\/+/, "")}`;

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const customSelectStyles = {
    control: (provided) => ({
      ...provided,
      minHeight: "44px",
      borderRadius: "10px",
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999,
    }),
    menu: (base) => ({
      ...base,
      zIndex: 9999,
    }),
  };

  const toArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.results?.data)) return payload.results.data;
    if (Array.isArray(payload?.results)) return payload.results;
    return [];
  };

  const mapTeamItem = (item) => ({
    id: item.id,
    team_name: item.team_name ?? "",
    team_leader: item.team_leader ?? null,
    team_leader_name:
      item.team_leader_name ??
      item.leader_name ??
      item.team_leader_name_display ??
      "",
  });

  const mapStaffItem = (item) => ({
    id: item.id,
    eid: item.eid ?? "",
    name: item.name ?? "",
    email: item.email ?? "",
    phone: item.phone ?? "",
    designation: item.designation ?? "",
    department_name: item.department_name ?? "",
  });

  const mapMemberTeam = (team) => ({
    team_id: team.team_id ?? team.id ?? "",
    team_name: team.team_name ?? "",
    team_leader: team.team_leader ?? null,
    team_leader_name: team.team_leader_name ?? "",
    is_team_leader: team.is_team_leader ?? false,
    members_count: team.members_count ?? 0,
    members: Array.isArray(team.members)
      ? team.members.map((member) => ({
          id: member.id,
          team: member.team ?? team.team_id ?? team.id ?? "",
          team_name: member.team_name ?? team.team_name ?? "",
          member: member.member ?? member.member_id ?? "",
          member_name: member.member_name ?? "",
          created_at: member.created_at ?? null,
        }))
      : [],
  });

  const mergeUniqueStaffs = (prev, next) => {
    const merged = [...prev];
    next.forEach((item) => {
      if (!merged.some((x) => String(x.id) === String(item.id))) {
        merged.push(item);
      }
    });
    return merged;
  };

  const fetchTeams = async () => {
    try {
      const res = await axios.get(buildUrl("staff/attendance/teams/"), {
        headers: authHeaders,
      });

      setTeams(toArray(res?.data).map(mapTeamItem));
    } catch (error) {
      toast.error("Failed to load teams");
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await axios.get(
        buildUrl("staff/attendance/my/team/details/"),
        {
          headers: authHeaders,
        }
      );


      setMembersData(toArray(res?.data).map(mapMemberTeam));
    } catch (error) {
      toast.error("Failed to load members");
    }
  };

  const fetchStaffs = async (searchText = "") => {
    try {
      const res = await axios.get(buildUrl("get/staffs/"), {
        headers: authHeaders,
        params: {
          page: 1,
          ...(searchText?.trim() ? { search: searchText.trim() } : {}),
        },
      });

      const data = toArray(res?.data).map(mapStaffItem);
      setStaffs((prev) => mergeUniqueStaffs(prev, data));
      return data.map((item) => ({
        value: item.id,
        label: item.name,
      }));
    } catch (error) {
      toast.error("Failed to load staff");
      return [];
    }
  };

  const loadStaffOptions = async (inputValue) => {
    const list = await fetchStaffs(inputValue);
    return list;
  };

  const refreshAll = async () => {
    await Promise.all([fetchTeams(), fetchStaffs(""), fetchMembers()]);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await refreshAll();
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
          buildUrl("staff/attendance/team/members/"),
          payload,
          {
            headers: authHeaders,
          }
        );

        if (res.status === 200 || res.status === 201) {
          toast.success("Team member added successfully");
          resetForm();
          await fetchMembers();
        }
      } catch (error) {
        toast.error(error?.response?.data?.message || "Failed to add member");
      } finally {
        setSubmitLoading(false);
      }
    },
  });

  const openEditModal = (memberRow) => {
    setSelectedMemberId(memberRow.id);
    setEditInitialValues({
      team: String(memberRow.team ?? memberRow.team_id ?? ""),
      member: String(memberRow.member ?? memberRow.member_id ?? ""),
    });
    setEditModal(true);
  };

  const closeEditModal = () => {
    setEditModal(false);
    setSelectedMemberId(null);
    setEditInitialValues({
      team: "",
      member: "",
    });
  };

  const editFormik = useFormik({
    enableReinitialize: true,
    initialValues: editInitialValues,
    validationSchema: Yup.object({
      team: Yup.string().required("Select Team"),
      member: Yup.string().required("Select Member"),
    }),
    onSubmit: async (values) => {
      if (!selectedMemberId) {
        toast.error("Member id missing");
        return;
      }

      try {
        const payload = {
          team: Number(values.team),
          member: Number(values.member),
        };

        const res = await axios.put(
          buildUrl(`staff/attendance/team/members/edit/${selectedMemberId}/`),
          payload,
          {
            headers: authHeaders,
          }
        );

        if (res.status === 200 || res.status === 201) {
          toast.success("Updated successfully");
          closeEditModal();
          await fetchMembers();
        }
      } catch (error) {
        toast.error(error?.response?.data?.message || "Update failed");
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
          <Breadcrumbs title="Attendance" breadcrumbItem="Team Members" />

          <Card className="mb-4" style={{ overflow: "visible" }}>
            <CardBody style={{ overflow: "visible" }}>
              <CardTitle>Add Team Member</CardTitle>

              <Form onSubmit={formik.handleSubmit}>
                <Row>
                  <Col md={5}>
                    <Label>Team</Label>

                    <Select
                      options={teamOptions}
                      styles={customSelectStyles}
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                      value={
                        teamOptions.find(
                          (x) =>
                            String(x.value) === String(formik.values.team)
                        ) || null
                      }
                      onChange={(e) =>
                        formik.setFieldValue("team", e?.value || "")
                      }
                      placeholder="Select..."
                    />
                  </Col>

                  <Col md={5}>
                    <Label>Member</Label>

                    <AsyncSelect
                      cacheOptions
                      defaultOptions={staffOptions}
                      loadOptions={loadStaffOptions}
                      styles={customSelectStyles}
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                      value={
                        staffOptions.find(
                          (x) =>
                            String(x.value) === String(formik.values.member)
                        ) || null
                      }
                      onChange={(e) =>
                        formik.setFieldValue("member", e?.value || "")
                      }
                      placeholder="Select..."
                      noOptionsMessage={() => "Type to search member"}
                    />
                  </Col>

                  <Col md={2}>
                    <Button
                      color="primary"
                      className="w-100 mt-4"
                      type="submit"
                    >
                      {submitLoading ? "Adding..." : "Add Member"}
                    </Button>
                  </Col>
                </Row>
              </Form>
            </CardBody>
          </Card>

          <div style={{ position: "relative", zIndex: 1 }}>
            {membersData.map((team) => (
              <Card key={team.team_id} className="mb-4">
                <CardBody>
                  <h5>{team.team_name}</h5>

                  <p>
                    Leader : <strong>{team.team_leader_name}</strong>
                  </p>

                  <p>
                    Total Members : <strong>{team.members_count}</strong>
                  </p>

                  <Table bordered responsive>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Member Name</th>
                        {/* <th>Created At</th> */}
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {team.members.length > 0 ? (
                        team.members.map((member, index) => (
                          <tr key={member.id}>
                            <td>{index + 1}</td>
                            <td>{member.member_name}</td>
                            {/* <td>
                              {member.created_at
                                ? new Date(member.created_at).toLocaleString()
                                : "-"}
                            </td> */}
                            <td>
                              <Button
                                color="warning"
                                size="sm"
                                onClick={() => openEditModal(member)}
                              >
                                Edit
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center">
                            No Members Found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </CardBody>
              </Card>
            ))}
          </div>

          <Modal isOpen={editModal} toggle={closeEditModal} centered>
            <ModalHeader toggle={closeEditModal}>Edit Member</ModalHeader>

            <Form onSubmit={editFormik.handleSubmit}>
              <ModalBody>
                <Label>Team</Label>

                <Select
                  options={teamOptions}
                  styles={customSelectStyles}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                  value={
                    teamOptions.find(
                      (x) =>
                        String(x.value) === String(editFormik.values.team)
                    ) || null
                  }
                  onChange={(e) =>
                    editFormik.setFieldValue("team", e?.value || "")
                  }
                  placeholder="Select..."
                />

                <Label className="mt-3">Member</Label>

                <AsyncSelect
                  cacheOptions
                  defaultOptions={staffOptions}
                  loadOptions={loadStaffOptions}
                  styles={customSelectStyles}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                  value={
                    staffOptions.find(
                      (x) =>
                        String(x.value) === String(editFormik.values.member)
                    ) || null
                  }
                  onChange={(e) =>
                    editFormik.setFieldValue("member", e?.value || "")
                  }
                  placeholder="Select..."
                  noOptionsMessage={() => "Type to search member"}
                />
              </ModalBody>

              <ModalFooter>
                <Button color="secondary" type="button" onClick={closeEditModal}>
                  Cancel
                </Button>
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