import React, { useCallback } from 'react';
import { Select } from 'antd';
import PropTypes from 'prop-types';

import { GEOIDS } from '../../utils/geoids';

const { Option } = Select;

const SearchBar = ({ style, onCountySelect}) => {
    const handleCountySelect = useCallback((event) => {
        onCountySelect(event);
        if (typeof event !== 'string') {
            console.log(`handleCountySelect(): unexpected event=${event.toString()}`);
        }
    }, [ onCountySelect ]);

    const children = [];
    for (const [key, value] of Object.entries(GEOIDS).sort((a,b) => parseInt(a[0]) - parseInt(b[0]))) {
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
            placeholder="Search for your state or county"
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
};

export default SearchBar;
