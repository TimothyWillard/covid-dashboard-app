import React, { useCallback } from 'react';
import { Select } from 'antd';
import PropTypes from 'prop-types';

import { defaultGeoid } from '../../utils/constants';
import { GEOIDS } from '../../utils/geoids';

const { Option } = Select;

const SearchBar = ({ style, onCountySelect, validGeoids }) => {
    const handleCountySelect = useCallback((event) => {
        onCountySelect(event);
        if (typeof event !== 'string') {
            console.log(`handleCountySelect(): unexpected event=${event.toString()}`);
        }
    }, [ onCountySelect ]);

    // If we have validGeoids use those otherwise just fallback to all geoids
    let geoids = Object.entries(GEOIDS).sort((a,b) => parseInt(a[0]) - parseInt(b[0]));
    if (validGeoids && validGeoids.length > 0) {
        geoids = [];
        for (const validGeoid of validGeoids) {
            geoids.push([
                validGeoid.toString(),
                GEOIDS[validGeoid]
            ])
        }
    }

    let children = [];
    for (const [key, value] of geoids) {
        const child = {
            key: `${key}-county`,
            button: []
        };
        child.button.push(
            // @ts-ignore
            <Option
                key={`${key}-county`}
                value={key}>
                {value}
            </Option>
        );
        children.push(child);
    }

    return (
        <Select
            showSearch
            placeholder={`Search for your state or county, like ${GEOIDS[defaultGeoid]}.`}
            optionFilterProp="children"
            style={style}
            size={"large"}
            onChange={handleCountySelect}
            filterOption={(input, option) =>
                option == null ? false : option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }>
            {children.map(county => county.button)}
        </Select>
    );
};

SearchBar.propTypes = {
    style: PropTypes.object.isRequired,
    onCountySelect: PropTypes.func.isRequired,
    validGeoids: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default SearchBar;
