// src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import WalletContext from './WalletContextProvider';


ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <WalletContext>
            <App />
        </WalletContext>
    </React.StrictMode>
);
