import React, { useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';

const TooltipHandler = ({ children, onClick, showTooltip }) => {
  const wrapperRef = useRef(null);

  const handleClick = useCallback((event) => {
    if (wrapperRef.current && wrapperRef.current.contains(event.target)) {
      // Click on tooltip
      onClick();
    } else if (wrapperRef.current && !wrapperRef.current.contains(event.target) && showTooltip) {
      // Click outside tooltip will close menu
      onClick();
    }
  }, [onClick, showTooltip]);  // Dependencies that determine when handleClick is re-created

  useEffect(() => {
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
    };
  }, [handleClick]); // handleClick is now stable and changes only if onClick or showTooltip changes

  return (
    <div style={{ display: 'inline' }} ref={wrapperRef}>
      {children}
    </div>
  );
};

TooltipHandler.propTypes = {
  children: PropTypes.element.isRequired,
  onClick: PropTypes.func.isRequired,
  showTooltip: PropTypes.bool.isRequired
};

export default TooltipHandler;
