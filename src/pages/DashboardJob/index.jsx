import React from "react";
import { Container, Row } from "reactstrap";
import ActivityFeed from "./ActivityFeed";
import AddedJobs from "./AddedJobs";
import CandidateSection from "./CandidateSection";

//Import Components
import ChartSection from "./ChartSection";
import JobVacancy from "./JobVacancy";
import ReceivedTime from "./ReceivedTime";
// import Section from "./Section";
import StatisticsApplications from "./StatisticsApplications";

const DashboardJob = () => {

  return (
    <React.Fragment>


      <div className="page-content">
        <Container fluid>
          <ChartSection />

          <Row>
            <StatisticsApplications />
            <CandidateSection />
          </Row>

          <Row>
            <JobVacancy />
          </Row>

          <Row>
            <ReceivedTime />
            <ActivityFeed />
            <AddedJobs />
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default DashboardJob;
