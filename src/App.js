import React, { Component } from 'react';
import './App.css';
import AiCard from './AiCard';
import Units from './units.json';

class App extends Component {
  render() {
    return (
      <div>
        <AiCard {...Units.stormtrooper} />
        <AiCard {...Units.stormtrooper} elite={true} />
        <AiCard {...Units.imperial_officer} />
        <AiCard {...Units.imperial_officer} elite={true} />
      </div>
    );
  }
}

export default App;
