import React from "react";
import "./agentCreateProject.css";
import Commonproject from "../../commonProject/project";

const AgentCreateProject = () => {
  const [selectValue, setSelectvalue] = React.useState("");
  const [show, setShow] = React.useState(false);
  const roomId = localStorage.getItem("roomId");
  console.log(roomId);
  const project_id = localStorage.getItem("project_id");
  console.log(project_id);

  return (
    <div className="py-0 create-project-container-height">
      <div className="">
        <h2 className="h3 text-uppercase text-start mb-4 pb-4 border-bottom">
          Project opportunities
        </h2>
        <div className="">
          <div className="customer-create-project">
            <Commonproject
              show={show}
              name={name}
              setShow={setShow}
              selectValue={selectValue}
              setSelectvalue={setSelectvalue}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentCreateProject;
