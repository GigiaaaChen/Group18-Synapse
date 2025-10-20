import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import WelcomePage from './WelcomePage';
import TaskPage from './TaskPage';
import './App.css';
{/*import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h1>Welcome to Tamagotchi Tasks 🐣</h1>
        <p>We'll build your pages here soon!</p>
       {/* <!--<p>
          Edit <code>src/App.js</code> and save to reload.
        </p>-->*/}
        {/*}
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;*/}


function App() {
  const [tasks, setTasks] = useState([]);
  return (
    <Router>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
         <Route path="/tasks" element={<TaskPage tasks={tasks} setTasks={setTasks} />} />
      </Routes>
    </Router>
  );
}

export default App;