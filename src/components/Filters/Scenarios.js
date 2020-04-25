import React, { Component } from 'react';
import { SCENARIOS } from '../../store/constants.js';

class Scenarios extends Component {
    constructor(props) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
    }
    
    handleClick(i) {
        this.props.onScenarioClick(i);
    }

    render() {
        return (
            <div className="dropdown">
                <button
                    className="btn btn-light dropdown-toggle btn-stat filter-text"
                    type="button" 
                    id="dropdownMenu2" 
                    data-toggle="dropdown" 
                    aria-haspopup="true" 
                    aria-expanded="false">
                    Select Scenarios
                </button>
                <div className="dropdown-menu" aria-labelledby="dropdownMenu2">
                    {SCENARIOS.map(scenario => {
                        return <button
                                    className="dropdown-item" 
                                    type="button" 
                                    onClick={() => this.handleClick(scenario)} 
                                    key={scenario.id}>
                                    {scenario.name}
                                </button>
                    })}
                </div>
            </div>
        )
    }
}

export default Scenarios