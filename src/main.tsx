import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { LibraryProvider } from './Workspace';
import './style.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode><LibraryProvider><App/></LibraryProvider></React.StrictMode>);
