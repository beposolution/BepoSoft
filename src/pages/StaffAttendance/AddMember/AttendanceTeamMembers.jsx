import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Card,
  CardBody,
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

  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState(null);

  const [editInitialValues, setEditInitialValues] = useState({
    team: "",
    member: "",
  });

  const apiBase = useMemo(() => {
    if (!baseUrl) return "";
    const trimmed = baseUrl.replace(/\/+$/, "");
    if (trimmed.endsWith("/api")) return `${trimmed}/`;
    return `${trimmed}/api/`;
  }, [baseUrl]);

  const buildUrl = path => `${apiBase}${path.replace(/^\/+/, "")}`;

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const customSelectStyles = {
    control: provided => ({
      ...provided,
      minHeight: "46px",
      borderRadius: "12px",
      border: "1px solid #e5e7eb",
      background: "#f8fafc",
    }),
    menuPortal: base => ({
      ...base,
      zIndex: 999999,
    }),
    menu: base => ({
      ...base,
      zIndex: 999999,
    }),
  };

  const toArray = payload => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.results?.data)) return payload.results.data;
    if (Array.isArray(payload?.results)) return payload.results;
    return [];
  };

  const mapTeamItem = item => ({
    id: item.id,
    team_name: item.team_name ?? "",
    team_leader: item.team_leader ?? null,
    team_leader_name:
      item.team_leader_name ??
      item.leader_name ??
      item.team_leader_name_display ??
      "",
  });

  const mapStaffItem = item => ({
    id: item.id,
    eid: item.eid ?? "",
    name: item.name ?? "",
    email: item.email ?? "",
    phone: item.phone ?? "",
    designation: item.designation ?? "",
    department_name: item.department_name ?? "",
  });

  const mapMemberTeam = team => ({
    team_id: team.team_id ?? team.id ?? "",
    team_name: team.team_name ?? "",
    team_leader: team.team_leader ?? null,
    team_leader_name: team.team_leader_name ?? "",
    is_team_leader: team.is_team_leader ?? false,
    members_count: team.members_count ?? 0,
    members: Array.isArray(team.members)
      ? team.members.map(member => ({
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
    next.forEach(item => {
      if (!merged.some(x => String(x.id) === String(item.id))) {
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
    } catch {
      toast.error("Failed to load teams");
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await axios.get(buildUrl("staff/attendance/my/team/details/"), {
        headers: authHeaders,
      });

      setMembersData(toArray(res?.data).map(mapMemberTeam));
    } catch {
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
      setStaffs(prev => mergeUniqueStaffs(prev, data));

      return data.map(item => ({
        value: item.id,
        label: item.name,
      }));
    } catch {
      toast.error("Failed to load staff");
      return [];
    }
  };

  const loadStaffOptions = async inputValue => {
    return await fetchStaffs(inputValue);
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
    return teams.map(item => ({
      value: item.id,
      label: item.team_name,
    }));
  }, [teams]);

  const staffOptions = useMemo(() => {
    return staffs.map(item => ({
      value: item.id,
      label: item.name,
    }));
  }, [staffs]);

  const totalTeams = membersData.length;
  const totalMembers = membersData.reduce(
    (sum, team) => sum + Number(team.members_count || team.members?.length || 0),
    0
  );

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
          { headers: authHeaders }
        );

        if (res.status === 200 || res.status === 201) {
          toast.success("Team member added successfully");
          resetForm();
          setAddModal(false);
          await fetchMembers();
        }
      } catch (error) {
        toast.error(error?.response?.data?.message || "Failed to add member");
      } finally {
        setSubmitLoading(false);
      }
    },
  });

  const openEditModal = memberRow => {
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
    onSubmit: async values => {
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
          { headers: authHeaders }
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
      <div className="page-content" style={{ background: "#f5f7fb", minHeight: "100vh" }}>
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
      <div className="page-content" style={{ background: "#f5f7fb", minHeight: "100vh" }}>
        <Container fluid>

          <Card
            className="border-0 mb-4"
            style={{
              borderRadius: "22px",
              background: "linear-gradient(135deg, #1f2937 0%, #334155 45%, #0f172a 100%)",
              boxShadow: "0 12px 35px rgba(15, 23, 42, 0.18)",
              overflow: "hidden",
            }}
          >
            <CardBody className="p-4">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div className="d-flex align-items-center gap-3">
                  <div
                    style={{
                      width: "58px",
                      height: "58px",
                      borderRadius: "18px",
                      background: "rgba(255,255,255,0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: "26px",
                    }}
                  >
                    <i className="bx bx-group"></i>
                  </div>

                  <div>
                    <h4 className="mb-1 text-white fw-bold">
                      {membersData?.[0]?.team_name || "Team"} Team Members
                    </h4>
                    <p className="mb-0" style={{ color: "rgba(255,255,255,0.72)" }}>
                      Manage team members assigned for attendance tracking.
                    </p>
                  </div>
                </div>

                <Button
                  color="primary"
                  onClick={() => setAddModal(true)}
                  style={{
                    borderRadius: "12px",
                    padding: "11px 18px",
                    fontWeight: 700,
                    background: "#5667e8",
                    border: "none",
                  }}
                >
                  <i className="bx bx-plus me-1"></i>
                  Add Team Member
                </Button>
              </div>
            </CardBody>
          </Card>

          <Row className="mb-4">
            <Col md={6} xl={3} className="mb-3">
              <Card
                className="border-0 h-100"
                style={{
                  borderRadius: "18px",
                  boxShadow: "0 8px 25px rgba(15, 23, 42, 0.06)",
                }}
              >
                <CardBody>
                  <p className="text-muted mb-1">Total Teams</p>
                  <h3 className="mb-0 fw-bold">{totalTeams}</h3>
                </CardBody>
              </Card>
            </Col>

            <Col md={6} xl={3} className="mb-3">
              <Card
                className="border-0 h-100"
                style={{
                  borderRadius: "18px",
                  boxShadow: "0 8px 25px rgba(15, 23, 42, 0.06)",
                }}
              >
                <CardBody>
                  <p className="text-muted mb-1">Total Members</p>
                  <h3 className="mb-0 fw-bold text-primary">{totalMembers}</h3>
                </CardBody>
              </Card>
            </Col>
          </Row>

          {membersData.map(team => (
            <Card
              key={team.team_id}
              className="border-0 mb-4"
              style={{
                borderRadius: "20px",
                boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
                overflow: "hidden",
              }}
            >
              <div
                className="d-flex justify-content-between align-items-center flex-wrap gap-3"
                style={{
                  padding: "20px 24px",
                  background: "#fff",
                  borderBottom: "1px solid #eef2f7",
                }}
              >
                <div>
                  <h5 className="fw-bold mb-1">{team.team_name}</h5>
                  <p className="text-muted mb-0">
                    Leader: <strong>{team.team_leader_name || "-"}</strong>
                  </p>
                </div>

                <span
                  className="badge"
                  style={{
                    background: "#eef2ff",
                    color: "#4f46e5",
                    borderRadius: "999px",
                    padding: "9px 14px",
                    fontSize: "13px",
                  }}
                >
                  Members: {team.members_count}
                </span>
              </div>

              <CardBody className="p-0">
                <div className="table-responsive">
                  <Table className="align-middle mb-0">
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        <th style={{ padding: "15px 22px" }}>#</th>
                        <th style={{ padding: "15px 22px" }}>Member Name</th>
                        <th style={{ padding: "15px 22px" }}>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {team.members.length > 0 ? (
                        team.members.map((member, index) => (
                          <tr key={member.id}>
                            <td style={{ padding: "16px 22px" }}>{index + 1}</td>
                            <td style={{ padding: "16px 22px", fontWeight: 700 }}>
                              {member.member_name}
                            </td>
                            <td style={{ padding: "16px 22px" }}>
                              <Button
                                color="warning"
                                size="sm"
                                onClick={() => openEditModal(member)}
                                style={{
                                  borderRadius: "10px",
                                  padding: "7px 14px",
                                  fontWeight: 600,
                                }}
                              >
                                <i className="bx bx-edit me-1"></i>
                                Edit
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="text-center py-4 text-muted">
                            No Members Found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              </CardBody>
            </Card>
          ))}

          <Modal isOpen={addModal} toggle={() => setAddModal(false)} centered>
            <ModalHeader toggle={() => setAddModal(false)}>Add Team Member</ModalHeader>

            <Form onSubmit={formik.handleSubmit}>
              <ModalBody style={{ overflow: "visible" }}>
                <Label>Team</Label>
                <Select
                  options={teamOptions}
                  styles={customSelectStyles}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                  value={
                    teamOptions.find(
                      x => String(x.value) === String(formik.values.team)
                    ) || null
                  }
                  onChange={e => formik.setFieldValue("team", e?.value || "")}
                  placeholder="Select team"
                />
                {formik.touched.team && formik.errors.team ? (
                  <div className="text-danger mt-1">{formik.errors.team}</div>
                ) : null}

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
                      x => String(x.value) === String(formik.values.member)
                    ) || null
                  }
                  onChange={e => formik.setFieldValue("member", e?.value || "")}
                  placeholder="Select member"
                  noOptionsMessage={() => "Type to search member"}
                />
                {formik.touched.member && formik.errors.member ? (
                  <div className="text-danger mt-1">{formik.errors.member}</div>
                ) : null}
              </ModalBody>

              <ModalFooter>
                <Button color="secondary" type="button" onClick={() => setAddModal(false)}>
                  Cancel
                </Button>
                <Button color="primary" type="submit" disabled={submitLoading}>
                  {submitLoading ? "Adding..." : "Add Member"}
                </Button>
              </ModalFooter>
            </Form>
          </Modal>

          <Modal isOpen={editModal} toggle={closeEditModal} centered>
            <ModalHeader toggle={closeEditModal}>Edit Member</ModalHeader>

            <Form onSubmit={editFormik.handleSubmit}>
              <ModalBody style={{ overflow: "visible" }}>
                <Label>Team</Label>
                <Select
                  options={teamOptions}
                  styles={customSelectStyles}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                  value={
                    teamOptions.find(
                      x => String(x.value) === String(editFormik.values.team)
                    ) || null
                  }
                  onChange={e => editFormik.setFieldValue("team", e?.value || "")}
                  placeholder="Select team"
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
                      x => String(x.value) === String(editFormik.values.member)
                    ) || null
                  }
                  onChange={e => editFormik.setFieldValue("member", e?.value || "")}
                  placeholder="Select member"
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