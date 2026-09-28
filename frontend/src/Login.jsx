import React, { useState } from 'react';
import { 
  Box, Card, Typography, TextField, Button, CircularProgress, 
  Tabs, Tab, Alert, InputAdornment, IconButton, Chip 
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import LoginIcon from '@mui/icons-material/Login';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export default function Login({ initialMode = 'login' }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialMode === 'signup' ? 1 : 0);
  const isLogin = activeTab === 0;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const formatError = (err) => {
    if (!err) return 'An unexpected error occurred.';
    const detail = err.response?.data?.detail;
    if (detail) {
      if (typeof detail === 'string') return detail;
      if (Array.isArray(detail)) {
        return detail.map((d) => (typeof d === 'object' ? d.msg || JSON.stringify(d) : String(d))).join('. ');
      }
      if (typeof detail === 'object') return JSON.stringify(detail);
    }
    if (err.response?.data?.message) return err.response.data.message;
    if (err.code === 'ERR_NETWORK') return 'Unable to connect to server. Please check your network connection.';
    return err.message || 'Authentication failed. Please try again.';
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setError('');
    setSuccess('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername) {
      setError('Please enter your username or email.');
      return;
    }

    if (cleanUsername.length < 3) {
      setError('Username must be at least 3 characters long.');
      return;
    }

    if (!cleanPassword) {
      setError('Please enter your password.');
      return;
    }

    if (cleanPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (!isLogin && cleanPassword !== confirmPassword.trim()) {
      setError('Passwords do not match. Please verify and try again.');
      return;
    }

    setLoading(true);

    try {
      let res;
      if (!isLogin) {
        // Step 1: Sign up new user and receive token
        res = await axios.post(`${API_BASE}/api/signup`, {
          username: cleanUsername,
          password: cleanPassword
        });
        setSuccess('Account created successfully! Redirecting...');
      } else {
        // Step 2: Authenticate existing user
        res = await axios.post(`${API_BASE}/api/login`, {
          username: cleanUsername,
          password: cleanPassword
        });
      }

      if (res.data && res.data.access_token) {
        localStorage.setItem('token', res.data.access_token);
      }

      setTimeout(() => {
        navigate('/', { replace: true });
      }, 400);
    } catch (err) {
      setError(formatError(err));
      setSuccess('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ bgcolor: 'primary.main', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Burgundy Header Section */}
      <Box sx={{ 
        bgcolor: 'primary.main', 
        color: 'white', 
        pt: { xs: 5, sm: 7 }, 
        pb: 10,
        textAlign: 'center'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
          <Chip 
            icon={<AutoAwesomeIcon sx={{ fontSize: 16, color: '#A4C355 !important' }} />} 
            label="AI Requirements to QA Engine" 
            size="small"
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.12)', 
              color: 'white', 
              fontFamily: 'Quicksand', 
              fontWeight: 700, 
              fontSize: '0.8rem',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255,255,255,0.2)'
            }} 
          />
        </Box>

        <Typography 
          variant="h1" 
          sx={{ fontSize: { xs: '3.5rem', sm: '5.5rem' }, textShadow: '2px 2px 4px rgba(0,0,0,0.3)', m: 0 }}
        >
          TestCraft AI
        </Typography>

        <Typography variant="h6" sx={{ fontFamily: 'Quicksand', fontWeight: 500, mt: 0.5, letterSpacing: 1.5, color: '#f0e8e4' }}>
          Intelligent Test Case & Scenario Generator
        </Typography>
      </Box>

      {/* Torn Paper Divider */}
      <svg viewBox="0 0 1440 120" style={{ display: 'block', width: '100%', height: 'auto', backgroundColor: '#612135', marginBottom: '-1px' }}>
        <path fill="#F4EFEA" d="M0,64L48,80C96,96,192,128,288,122.7C384,117,480,75,576,64C672,53,768,75,864,85.3C960,96,1056,96,1152,85.3C1248,75,1344,53,1392,42.7L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"></path>
      </svg>

      {/* Cream Card Container */}
      <Box sx={{ 
        bgcolor: '#F4EFEA', 
        flex: 1, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'flex-start',
        pt: { xs: 2, sm: 3 },
        pb: 8,
        px: 2
      }}>
        <Card sx={{ 
          p: { xs: 3, sm: 5 }, 
          width: '100%',
          maxWidth: 460, 
          borderRadius: 5, 
          boxShadow: '0 16px 40px rgba(97,33,53,0.14)',
          textAlign: 'center',
          bgcolor: '#ffffff',
          border: '1px solid #ebdcd5'
        }}>
          <Typography 
            variant="h3" 
            color="primary" 
            sx={{ mb: 0.5, fontWeight: 'normal', fontFamily: "'Great Vibes', cursive", fontSize: { xs: '2.8rem', sm: '3.2rem' } }}
          >
            {isLogin ? "Welcome Back" : "Join TestCraft AI"}
          </Typography>

          <Typography variant="body2" sx={{ mb: 3, fontFamily: 'Quicksand', fontWeight: 600, color: '#612135' }}>
            {isLogin ? "Sign in to access your QA workspace" : "Create a free account with 10 starting credits"}
          </Typography>

          {/* Unified Brand Tabs */}
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            variant="fullWidth" 
            sx={{ 
              mb: 3, 
              bgcolor: '#F4EFEA', 
              borderRadius: 3,
              p: 0.5,
              border: '1px solid #ebdcd5',
              '& .MuiTabs-indicator': {
                display: 'none'
              },
              '& .MuiTab-root': {
                borderRadius: 2.5,
                textTransform: 'none',
                fontFamily: 'Quicksand',
                fontWeight: 700,
                fontSize: '0.95rem',
                minHeight: 42,
                color: '#612135',
                transition: 'all 0.2s',
                '&.Mui-selected': {
                  bgcolor: '#612135',
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(97,33,53,0.3)'
                }
              }
            }}
          >
            <Tab icon={<LoginIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Sign In" />
            <Tab icon={<PersonAddAlt1Icon sx={{ fontSize: 18 }} />} iconPosition="start" label="Sign Up" />
          </Tabs>

          {error && (
            <Alert severity="error" sx={{ mb: 2, textAlign: 'left', borderRadius: 2, fontFamily: 'Quicksand', fontWeight: 600 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2, textAlign: 'left', borderRadius: 2, fontFamily: 'Quicksand', fontWeight: 600 }}>
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField 
              fullWidth 
              label="Username or Email" 
              variant="outlined" 
              margin="normal" 
              value={username}
              disabled={loading}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. alex@example.com"
              helperText={!isLogin ? "Min 3 characters" : ""}
              sx={{ 
                '& .MuiOutlinedInput-root': { 
                  borderRadius: 3, 
                  bgcolor: '#fdfbf9',
                  fontFamily: 'Quicksand'
                } 
              }}
            />

            <TextField 
              fullWidth 
              type={showPassword ? 'text' : 'password'}
              label="Password" 
              variant="outlined" 
              margin="normal" 
              value={password}
              disabled={loading}
              onChange={(e) => setPassword(e.target.value)}
              helperText={!isLogin ? "Min 6 characters" : ""}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  )
                }
              }}
              sx={{ 
                '& .MuiOutlinedInput-root': { 
                  borderRadius: 3, 
                  bgcolor: '#fdfbf9',
                  fontFamily: 'Quicksand'
                } 
              }}
            />

            {!isLogin && (
              <TextField 
                fullWidth 
                type={showPassword ? 'text' : 'password'}
                label="Confirm Password" 
                variant="outlined" 
                margin="normal" 
                value={confirmPassword}
                disabled={loading}
                onChange={(e) => setConfirmPassword(e.target.value)}
                helperText="Must match password"
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          size="small"
                        >
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }
                }}
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: 3, 
                    bgcolor: '#fdfbf9',
                    fontFamily: 'Quicksand'
                  } 
                }}
              />
            )}

            <Button 
              type="submit"
              fullWidth 
              variant="contained" 
              color="secondary"
              disabled={loading}
              sx={{ 
                mt: 3, 
                mb: 2, 
                py: 1.6, 
                borderRadius: 4, 
                fontSize: '1.15rem', 
                textTransform: 'none', 
                color: '#fff',
                bgcolor: '#A4C355',
                boxShadow: '0 8px 20px rgba(164,195,85,0.4)', 
                fontFamily: 'Quicksand', 
                fontWeight: 700,
                '&:hover': { bgcolor: '#8ea846' }
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                isLogin ? "Sign In to TestCraft" : "Create Account & Sign In"
              )}
            </Button>
          </form>

          <Typography variant="body2" sx={{ mt: 2, fontFamily: 'Quicksand', fontWeight: 600, color: '#555' }}>
            {isLogin ? "Don't have an account yet? " : "Already have an account? "}
            <span 
              style={{ color: '#612135', cursor: 'pointer', fontWeight: 800, textDecoration: 'underline' }}
              onClick={() => {
                setActiveTab(isLogin ? 1 : 0);
                setError('');
                setSuccess('');
              }}
            >
              {isLogin ? "Sign Up here" : "Sign In here"}
            </span>
          </Typography>
        </Card>
      </Box>
    </Box>
  );
}
