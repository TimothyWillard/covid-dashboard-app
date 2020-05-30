import React, { Component } from 'react';
import { ReactComponent as GraphLogo } from '../assets/graph.svg';
import { ReactComponent as ChartLogo } from '../assets/chart.svg';
import { ReactComponent as MapLogo } from '../assets/globe.svg';
import { ReactComponent as MethodsLogo } from '../assets/book.svg';

class MenuItem extends Component {

  handleClickEvent = (menuItem) => {
    this.props.handleMouseClick(menuItem)
  }

  render() {
    
      if (this.props.menuItem === 0) {
        return( <GraphLogo 
          height={this.props.height}
          className={this.props.active ? this.props.activeClass : this.props.hoverClass}
          onClick={() => this.handleClickEvent(this.props.menuItem)}
        />
        )
      }
      if (this.props.menuItem === 1) {
        return( <ChartLogo 
          height={this.props.height}
          className={this.props.active ? this.props.activeClass : this.props.hoverClass}
          onClick={() => this.handleClickEvent(this.props.menuItem)}
        />
        )
      }
      if (this.props.menuItem === 2) {
        return( <MapLogo 
          height={this.props.height}
          className={this.props.active ? this.props.activeClass : this.props.hoverClass}
          onClick={() => this.handleClickEvent(this.props.menuItem)}
        />
        )
      }
      if (this.props.menuItem === 3) {
        return( <MethodsLogo 
          height={this.props.height}
          className={this.props.active ? this.props.activeClass : this.props.hoverClass}
          onClick={() => this.handleClickEvent(this.props.menuItem)}
        />
        )
      }

  }
}

export default MenuItem;