import React, { Component } from 'react';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {alkodata: [{nimi: 'Odota'}], searchResults: [], searchTerms: ""}
    this.handleChange = this.handleChange.bind(this);
    this.searchData = this.searchData.bind(this);
  }

  componentWillMount() {
    var myHeaders = {'Content-Type': 'application/json', 'Access-Control-Allow-Origin':'*'};
            
    var myInit = {
      method: 'GET',
      headers: myHeaders
    }
    
    fetch('/data?query=nothing', myInit)
      .then(res => res.json())
      .then(json => {
        console.log("Got alko data!", json);
        this.setState({alkodata: json});
      })
  }

  searchData(searchTerms) {
    var myHeaders = {'Content-Type': 'application/json', 'Access-Control-Allow-Origin':'*'};
    
    var myInit = {
      method: 'GET',
      mode: 'cors',
      headers: myHeaders
    }

    var url = '/data?query=' + searchTerms;
    console.log('Calling url', url);
    console.log('Should be searching with "', searchTerms,'"');


    fetch(url, myInit)
    .then(res => res.json())
    .then(json => {
      console.log("Got alko data!", json);
      this.setState({alkodata: json});
    })
  }

  handleChange(event) {
    console.log(event.target.value);
    if (event.target.value.length > 2) {
      this.searchData(event.target.value);
    } else {
      console.log('Search not long enough');
    }
  }

  render() {
    return (
      <div className="App">
        <h1>AlkoAPI</h1>
        <div>
          <input type="text" name="search" onChange={this.handleChange}></input>
        </div>
        <div><table><tbody>
          {
            this.state.alkodata.map(item => {
              return <tr key={item.nimi + item.nro}>
                  <td>{item.nimi}</td>
                  <td>{item.hinta}</td>
                </tr>
            })
          }
          </tbody></table>
        </div>
      </div>
    );
  }
}

export default App;
