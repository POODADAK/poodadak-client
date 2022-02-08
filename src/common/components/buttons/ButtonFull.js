import PropTypes from "prop-types";
import React from "react";
import styled from "styled-components";

const StyledButtonFull = styled.button`
  width: 100%;
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: large;
  font-weight: 400;
  color: #bc955c;
  background-color: black;
  cursor: pointer;
  .icon {
    margin-top: 2px;
    margin-right: 0.5rem;
  }
`;

function ButtonFull({ type, onClick, icon, disabled, children }) {
  return (
    <StyledButtonFull type={type} onClick={onClick} disabled={disabled}>
      {icon && (
        <div className="icon">
          <img src={icon} alt="아이콘" />
        </div>
      )}
      {children}
    </StyledButtonFull>
  );
}

ButtonFull.propTypes = {
  type: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  icon: PropTypes.element,
  disabled: PropTypes.bool.isRequired,
  children: PropTypes.string.isRequired,
};

ButtonFull.defaultProps = {
  icon: null,
};

export default ButtonFull;