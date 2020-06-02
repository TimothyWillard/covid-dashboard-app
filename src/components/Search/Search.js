import React, { Component } from 'react';
import { Layout, Col } from 'antd';
import SearchBar from './SearchBar';
import FileUploader from './FileUploader';
import UploadSwitch from './UploadSwitch';
import { styles } from '../../utils/constants';

class Search extends Component {
    constructor(props) {
        super(props);
        this.state = {
            fileName: '',
            showFileUpload: false,
        }
    }

    handleCountySelect = (event) => {
        this.props.onCountySelect(event);
    }

    handleUpload = (event, name) => {
        console.log('handling Upload in Search', event, name)
        this.props.onFileUpload(event, name);
    }

    handleUploadToggle = () => {
        this.setState(prevState => ({
            showFileUpload: !prevState.showFileUpload
        }));
    }

    render() {
        const { showFileUpload } = this.state;
        const { geoid, stat } = this.props;
        const { Content } = Layout;
        return (
            <Content>
                <div id="search-container" className="search-container">
                    <Col className="gutter-row container">
                        <div className="content-section">
                            <div className="title-header">
                                COVID-19 Intervention Scenario Modeling
                            </div>
                            <div>
                                Find your state or county in our registry 
                                to start comparing scenarios now.
                            </div>
                            <div className="dropdown">
                                <SearchBar
                                    stat={stat}
                                    geoid={geoid}
                                    onCountySelect={this.handleCountySelect}
                                    style={styles.SearchBar}
                                    size="large"
                                />
                            </div>
                            <UploadSwitch   
                                showFileUpload={this.state.showFileUpload}
                                onUploadToggle={this.handleUploadToggle}/>
                            <br />
                            {showFileUpload ? 
                                <FileUploader onUpload={this.handleUpload}/> 
                                : null
                            }
                        </div>
                    </Col>
                </div>  
            </Content>
        )
    }
}

export default Search;
