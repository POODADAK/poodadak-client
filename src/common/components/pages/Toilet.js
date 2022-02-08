import React from "react";
// import { useNavigate } from "react-router-dom";
import styled from "styled-components";

import HeaderSub from "../headers/HeaderSub";

const StyledToilet = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  background-color: black;
`;

function Toilet() {
  // const navigate = useNavigate();

  return (
    <StyledToilet>
      <HeaderSub />
    </StyledToilet>
  );
}

export default Toilet;
