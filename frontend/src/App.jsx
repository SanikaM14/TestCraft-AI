import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import MainPage from './MainPage';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

const theme = createTheme({
  palette: {
    primary: { main: '#612135' },
    secondary: { main: '#A4C355' },
    background: {
      default: '#F4EFEA',
      paper: '#ffffff'
    },
    text: {
      primary: '#333333',
      secondary: '#612135'
    }
  },
  typography: {
    fontFamily: "'Quicksand', sans-serif",
    h1: { fontFamily: "'Great Vibes', cursive" },
    h2: { fontFamily: "'Great Vibes', cursive" },
    h3: { fontFamily: "'Great Vibes', cursive" },
    h4: { fontFamily: "'Great Vibes', cursive" },
  }
});

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<Login initialMode="login" />} />
          <Route path="/signup" element={<Login initialMode="signup" />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <MainPage />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}
