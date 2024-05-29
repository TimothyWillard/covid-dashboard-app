import React, { useCallback } from 'react';
import PropTypes from 'prop-types';

import Severity from '../Filters/Severity';

const SeverityContainer = ({ 
    scenarioList, 
    scenarioMap, 
    severityList, 
    indicator, 
    onSeveritiesClick, 
    onSeveritiesHover, 
    onSeveritiesHoverLeave 
}) => {
    const handleSeverityClick = useCallback((i) => {
        onSeveritiesClick(i);
    }, [ onSeveritiesClick ]);

    const handleSeverityHover = useCallback((i) => {
        onSeveritiesHover(i);
    }, [ onSeveritiesHover ]);

    const handleSeverityHoverLeave = useCallback(() => {
        onSeveritiesHoverLeave();
    }, [ onSeveritiesHoverLeave ]);

    const isDisabled = indicator.name === 'Infections' ? true : false;
    let children = [];
    if (scenarioList && scenarioList.length > 0) {
        for (let i = 0; i < scenarioList.length; i++) {
            const keyVal = `${severityList[i].key}_${scenarioList[i].key}`;
            const child = {
                'key': keyVal,
                'scenario': scenarioList[i],
                'severity': []
            };
            child.severity.push(
                <Severity
                    key={keyVal}
                    severity={severityList[i]}
                    scenario={scenarioList[i]}
                    existingSevs={scenarioMap[scenarioList[i].key]}  // array of sev levels
                    isDisabled={isDisabled}
                    sevCount={severityList.length}
                    onSeverityClick={handleSeverityClick}
                    onSeverityHover={handleSeverityHover}
                    onSeverityHoverLeave={handleSeverityHoverLeave}/>
            );
            children.push(child);
        }
    }

    return (
        <div>
            {children.map(child => {
                return (
                    <div key={child.key}>
                        {child.severity}
                    </div>
                )
            })}
        </div>
    );
};

SeverityContainer.propTypes = {
    scenarioList: PropTypes.array.isRequired, 
    scenarioMap: PropTypes.object.isRequired, 
    severityList: PropTypes.array.isRequired, 
    indicator: PropTypes.object.isRequired, 
    onSeveritiesClick: PropTypes.func.isRequired, 
    onSeveritiesHover: PropTypes.func.isRequired, 
    onSeveritiesHoverLeave: PropTypes.func.isRequired, 
};

export default SeverityContainer;
