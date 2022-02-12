import PropTypes from "prop-types";
import React from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";

import chat from "../../../assets/icon-chat.png";
import ButtonDefault from "../buttons/ButtonDefault";

const StyledHeaderSub = styled.div`
  width: 100%;
  height: 50px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: black;
  .back {
    margin-left: 10px;
    display: flex;
    align-items: center;
  }
  .btns {
    margin-right: 10px;
    display: flex;
    align-items: center;
  }
`;

function HeaderSub({ onClick }) {
  const navigate = useNavigate();

  return (
    <StyledHeaderSub>
      <div className="back">
        <ButtonDefault moveTo="left" onClick={() => navigate(-1)}>
          뒤로가기
        </ButtonDefault>
      </div>
      <div className="btns">
        <ButtonDefault icon={chat} onClick={onClick} />
      </div>
    </StyledHeaderSub>
  );
}
HeaderSub.propTypes = {
  onClick: PropTypes.func,
};
HeaderSub.defaultProps = {
  onClick: null,
};

export default HeaderSub;
