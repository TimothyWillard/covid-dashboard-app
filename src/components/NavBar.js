import React, { useState } from 'react';
import { Row, Col } from 'antd';
import { ReactComponent as AltLogo } from '../assets/logo-idd-jhsph.svg';
import MenuItem from './MenuItem';
import { ReactComponent as Hamburger } from '../assets/hamburger.svg';
import { styles } from '../utils/constants';
import { formatNavBar } from '../utils/utils';

export default function NavBar() {
  const [active, setActive] = useState(null);
  
  const links = ['#interactive-graph', '#exploration', '#geographic-map', '#methods', '#about'];

  function handleMouseClick(index) {
    // close nav bar on mobile
    const items = document.getElementsByClassName("menu-items");
    const nav = document.getElementById("nav-menu");
    nav.className = formatNavBar(nav.className)
    for (let item of items) {
      item.className = formatNavBar(item.className)
    }
    setActive(index);
  }

  function handleMenuClick() {
    const items = document.getElementsByClassName("menu-items");
    const nav = document.getElementById("nav-menu");
    const logo = document.getElementById("logo");
    
    // menu item click on mobile
    if (!nav.className.includes('responsive')) {
      nav.className += " responsive";
      logo.className += " responsive";
    } else {
      nav.className = formatNavBar(nav.className)
      logo.className = formatNavBar(logo.className)
    }

    for (let item of items) {
      if (!item.className.includes('responsive')) {
        item.className += " responsive";
      } else {
        item.className = formatNavBar(item.className)
      }
    }
  }

  return (
    <div id="navbar" className="App-header">
      <Row gutter={styles.gutter}>
        <Col id="logo" className="gutter-row logo">
          <AltLogo height="60" throwifnamespace="false" style={{ paddingTop: '8px' }} />
        </Col>

        <Col id="hamburger" className="gutter-row">
          <Hamburger
            onClick={handleMenuClick} />
        </Col>

        <Col id="nav-menu" className="gutter-row nav-menu">
          <ul style={{ marginTop: '5px' }}>
            {links.map((link, index) => {
              /* noun project svgs (index 3 and 4) use clip paths that require 
              different styling of fill rather than stroke */
              const activeClass = index === 3 || index === 4 ? "nav-active-methods" : "nav-active";
              const hoverClass = index === 3 || index === 4 ? "nav-hover-methods" : "nav-hover";
              return (
                <li key={link} className="menu-items">
                  <a href={link}>
                    <MenuItem
                      height={index === 2 ? 36 : 40}
                      active={active === index ? true : false}
                      activeClass={activeClass}
                      hoverClass={hoverClass}
                      handleMouseClick={handleMouseClick}
                      menuItem={index}
                    />
                  </a>
                </li>
              )
            })}
          </ul>
        </Col>
      </Row>
    </div>
  );
}
