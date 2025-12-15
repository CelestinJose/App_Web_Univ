import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './assets/css/style_message.css';
import './index.css'; // Importez votre fichier CSS ici
import './output.css'; // Importez votre fichier CSS ici
// import $ from 'jquery';
// import 'datatables.net';
import './styles/Form.css'


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
reportWebVitals();
