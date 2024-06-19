import React from 'react';
import PropTypes from 'prop-types';

import { ReactComponent as GraphLogo } from '../assets/graph.svg';
import { ReactComponent as ChartLogo } from '../assets/chart.svg';
import { ReactComponent as MapLogo } from '../assets/globe.svg';
import { ReactComponent as MethodsLogo } from '../assets/book.svg';
import { ReactComponent as AboutLogo } from '../assets/info.svg';

import { styles } from '../utils/constants';

const MenuItem = ({menuItem, height, active, activeClass, hoverClass, handleMouseClick}) => {
  switch (menuItem) {
    case 0:
      return (
        <GraphLogo 
          height={height}
          style={styles.Menu}
          className={active ? activeClass : hoverClass}
          onClick={() => handleMouseClick(menuItem)}
        />
      );
    case 1:
      return (
        <ChartLogo 
          height={height}
          style={styles.Menu}
          className={active ? activeClass : hoverClass}
          onClick={() => handleMouseClick(menuItem)}
        />
      );
    case 2:
      return (
        <MapLogo 
          height={height}
          style={styles.Menu}
          className={active ? activeClass : hoverClass}
          onClick={() => handleMouseClick(menuItem)}
        />
      );
    case 3:
      return (
        <MethodsLogo 
          height={height}
          style={styles.Menu}
          className={active ? activeClass : hoverClass}
          onClick={() => handleMouseClick(menuItem)}
        />
      );
    case 4:
      return (
        <AboutLogo 
          height={height}
          style={styles.Menu}
          className={active ? activeClass : hoverClass}
          onClick={() => handleMouseClick(menuItem)}
        />
      );
    default:
      break;
  }
};

MenuItem.propTypes = {
  menuItem: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  active: PropTypes.bool.isRequired,
  activeClass: PropTypes.string.isRequired,
  hoverClass: PropTypes.string.isRequired,
  handleMouseClick: PropTypes.func.isRequired,
}

export default MenuItem;
