import React, { Fragment } from 'react';
import PropTypes from 'prop-types';

import { addCommas } from '../../utils/utils.js';

const CalloutLabel = ({ classProps, scenario, median, label, tenth, ninetyith }) => {
    return (
        <Fragment>
          <div className={classProps}>
              <span className="bold">{scenario}</span>&nbsp;scenario:&nbsp;
              <span className="bold">50%</span>
              &nbsp;{`chance of `}<span className="bold">{addCommas(Math.ceil(median))}</span>
              &nbsp;{`${label}`}
              {/* from `}<span className="bold">{startDate}</span>
              &nbsp;{`to `}<span className="bold">{endDate}</span> */}
          </div>
          <div className={classProps}>
            <span className="bold">90%</span>
              &nbsp;{`chance of `}<span className="bold">{addCommas(Math.ceil(tenth))}</span>
              &nbsp;{`to `}<span className="bold">{addCommas(Math.ceil(ninetyith))}</span>
              &nbsp;{`${label}`} 
              {/* from `}<span className="bold">{startDate}</span>
              &nbsp;{`to `}<span className="bold">{endDate}</span> */}
          </div>
        </Fragment>
        )
};

CalloutLabel.propTypes = {
  classProps: PropTypes.string.isRequired,
  scenario: PropTypes.string.isRequired,
  median: PropTypes.number.isRequired,
  label: PropTypes.string.isRequired,
  tenth: PropTypes.number.isRequired,
  ninetyith: PropTypes.number.isRequired,
}

export default CalloutLabel;
