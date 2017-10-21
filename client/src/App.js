import React, { Component } from 'react';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {alkodata: [{nimi: 'Odota'}], searchResults: [], searchTerms: ""}
    this.handleChange = this.handleChange.bind(this);
  }

  componentWillMount() {
    var myHeaders = {'Content-Type': 'application/json', 'Access-Control-Allow-Origin':'*'};
            
    var myInit = {
      method: 'GET',
      mode: 'cors',
      headers: myHeaders
    }
    
    fetch('http://localhost:8080', myInit)
      .then(res => res.json())
      .then(json => {
        console.log("Got alko data!");
        this.setState({alkodata: JSON.parse(json)});
      })
  }

  handleChange(event) {
    console.log(event.target.value);
    this.setState({searchTerms: event.target.value});
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
            this.state.alkodata.filter(data => {
              
              if (this.state.searchTerms && this.state.searchTerms.length > 2 && data.nimi) {
                // console.log(data);
                return data.nimi.toLowerCase().indexOf(this.state.searchTerms.toLowerCase()) !== -1
              }
              return false;
            })
            .map(item => {
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
