import React, { Component } from 'react';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {alkodata: [{nimi: 'Odota'}], searchResults: [], searchTerms: "", typing: false, typingTimeout: 0, searching: false}
    this.handleChange = this.handleChange.bind(this);
    this.searchData = this.searchData.bind(this);
  }

  componentWillMount() {
    this.setState({alkodata: []});
  }

  searchData(searchTerms) {
    const url = '/data?query=' + searchTerms;
    console.log('Calling url', url);
    console.log('Should be searching with "', searchTerms,'"');

    this.setState({searching: true});

    fetch(url)
    .then(res => res.json())
    .then(json => {
      console.log("Got alko data!", json);
      this.setState({searching: false, alkodata: json});
    })
  }

  handleChange(event) {
    console.log(event.target.value);

    if (this.state.typingTimeout) {
      clearTimeout(this.state.typingTimeout);
    }

    if (event.target.value.length > 2) {
      this.setState({searchTerms: event.target.value, typing: false, typingTimeout: setTimeout(() => {
        console.log('Timeout for typing is out');
        this.searchData(this.state.searchTerms);
      }, 500)
      });
    } else {
      console.log('Search not long enough');
    }

  }

  tableContents() {
    if (this.state.searching) {
      return <tr>Etsitään...</tr>
    } else {
      return this.state.alkodata.map(item => {
        return <tr key={item.nimi + item.nro}>
            <td className="nimi">{item.nimi}</td>
            <td className="numerosarake tyyppi">{item.tyyppi}</td>
            <td className="numerosarake hinta">{item.hinta}</td>
            <td className="numerosarake litrahinta">{item.litrahinta}</td>
            <td className="numerosarake pullokoko">{item.pullokoko}</td>
            <td className="numerosarake alkoholi">{item['alkoholi-%']}</td>
          </tr>
      })
    }
  }

  render() {

    let tableContents = this.tableContents();

    return (
      <div className="App">
        <h1>AlkoAPI</h1>
        <div className="searchcontainer">
          <input className="searchinput" placeholder="Kirjoita tuotteen nimi tai osa siitä" type="text" name="search" onChange={this.handleChange}></input>
        </div>
        <div><table className="resultstable">
          <thead>
          <th>Nimi</th>
          <th className="numerosarake">Tyyppi</th>
          <th className="numerosarake hinta">€</th>
          <th className="numerosarake">€/l</th>
          <th className="numerosarake">Koko</th>
          <th className="numerosarake">%</th>
          </thead>
          <tbody>
          {tableContents}
          </tbody></table>
        </div>
      </div>
    );
  }
}

export default App;
