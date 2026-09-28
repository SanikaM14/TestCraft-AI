import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, TextField, Button, Card, 
  CircularProgress, FormGroup, Checkbox, Select, MenuItem, 
  InputLabel, FormControl, FormControlLabel, RadioGroup, Radio,
  Alert, Stack, Tooltip, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, InputAdornment, IconButton, Divider
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import LogoutIcon from '@mui/icons-material/Logout';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import KeyOffIcon from '@mui/icons-material/KeyOff';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import GitHubIcon from '@mui/icons-material/GitHub';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LayersIcon from '@mui/icons-material/Layers';
import SpeedIcon from '@mui/icons-material/Speed';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Robust Markdown table & syntax normalizer
const cleanMarkdown = (raw) => {
  if (!raw) return '';
  let text = String(raw);
  // 1. Replace concatenated table row pipes (e.g. || or |||) with newline + pipe
  text = text.replace(/\|\s*\|+/g, '|\n|');
  // 2. Ensure exactly one newline between consecutive table rows
  while (/(\|.+?\|)\n\s*\n+(\|)/.test(text)) {
    text = text.replace(/(\|.+?\|)\n\s*\n+(\|)/g, '$1\n$2');
  }
  // 3. Ensure an empty line before the table header starts
  text = text.replace(/([^\n\|])\n(\|)/g, '$1\n\n$2');
  return text.trim();
};

export default function MainPage() {
  const navigate = useNavigate();
  const [tokens, setTokens] = useState(null);
  const [username, setUsername] = useState('');
  
  // Custom API Key state
  const [customApiKey, setCustomApiKey] = useState('');
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);
  const [tempKeyInput, setTempKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [keySuccessMsg, setKeySuccessMsg] = useState('');

  const [inputType, setInputType] = useState('upload');
  const [file, setFile] = useState(null);
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [copied, setCopied] = useState(false);
  const [markdown, setMarkdown] = useState('');
  const [error, setError] = useState('');

  const [formatStyle, setFormatStyle] = useState('Standard (Step-by-Step)');
  const [focusAreas, setFocusAreas] = useState({ 
    Functional: true, 
    UIUX: true, 
    Security: false, 
    Performance: false, 
    EdgeCases: true 
  });

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
    if (err.code === 'ERR_NETWORK') return 'Unable to connect to server. Please verify the backend is running on port 8000.';
    return err.message || 'Operation failed. Please try again.';
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Load saved custom Groq API key from localStorage if exists
    const savedCustomKey = localStorage.getItem('custom_groq_api_key') || '';
    setCustomApiKey(savedCustomKey);
    setTempKeyInput(savedCustomKey);

    axios.get('/api/me', { 
      headers: { Authorization: `Bearer ${token}` } 
    })
      .then(res => {
        setTokens(res.data.tokens);
        setUsername(res.data.username);
      })
      .catch(() => {
        localStorage.removeItem('token');
        navigate('/login');
      });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleSaveCustomKey = () => {
    const cleanKey = tempKeyInput.trim();
    if (cleanKey) {
      localStorage.setItem('custom_groq_api_key', cleanKey);
      setCustomApiKey(cleanKey);
      setKeySuccessMsg('Custom Groq API Key saved! Generating using your personal key.');
    } else {
      localStorage.removeItem('custom_groq_api_key');
      setCustomApiKey('');
      setKeySuccessMsg('Custom key removed. Using default server credits.');
    }
    setTimeout(() => {
      setKeySuccessMsg('');
      setKeyDialogOpen(false);
    }, 1200);
  };

  const handleClearCustomKey = () => {
    localStorage.removeItem('custom_groq_api_key');
    setCustomApiKey('');
    setTempKeyInput('');
    setKeySuccessMsg('Custom key removed.');
    setTimeout(() => {
      setKeySuccessMsg('');
      setKeyDialogOpen(false);
    }, 800);
  };

  const handleGenerate = async () => {
    setError('');
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    let textContext = urlInput.trim();
    if (inputType === 'upload') {
      if (!file) {
        setError('Please select a PDF, DOCX, or CSV file to upload.');
        return;
      }
    } else {
      if (!textContext) {
        setError('Please provide a website URL or application description.');
        return;
      }
    }

    setLoading(true);

    try {
      if (inputType === 'upload' && file) {
        const formData = new FormData();
        formData.append("file", file);
        const extractRes = await axios.post('/api/extract-text', formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        textContext = extractRes.data.extracted_text;
      }

      if (!textContext || !textContext.trim()) {
        setError('No text could be extracted. Please check your document and try again.');
        setLoading(false);
        return;
      }

      const activeFocusAreas = Object.keys(focusAreas).filter(k => focusAreas[k]);
      const genRes = await axios.post('/api/generate-tests', {
        text_context: textContext.substring(0, 25000),
        format_style: formatStyle,
        focus_areas: activeFocusAreas,
        custom_api_key: customApiKey.trim() || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const normalizedMd = cleanMarkdown(genRes.data.markdown);
      setMarkdown(normalizedMd);
      setTokens(genRes.data.tokens_remaining);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!markdown) return;
    setDownloadingPdf(true);
    setError('');
    try {
      const res = await axios.post('/api/download-pdf', 
        { markdown: cleanMarkdown(markdown) }, 
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'TestCraft_Generated_Test_Cases.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (err) {
      let errorMsg = err.message || 'PDF Generation failed.';
      if (err.response?.data instanceof Blob) {
        try {
          const rawText = await err.response.data.text();
          const parsed = JSON.parse(rawText);
          errorMsg = parsed.detail || rawText;
        } catch {
          // fallback
        }
      }
      setError("Failed to download PDF: " + errorMsg);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleCopyMarkdown = () => {
    if (!markdown) return;
    navigator.clipboard.writeText(cleanMarkdown(markdown));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box sx={{ bgcolor: 'primary.main', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header Section */}
      <Box sx={{ 
        bgcolor: 'primary.main', 
        color: 'white', 
        pt: { xs: 6, sm: 8 }, 
        pb: 12,
        textAlign: 'center'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
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

        <Typography variant="h1" sx={{ fontSize: { xs: '3.8rem', sm: '6.5rem' }, textShadow: '2px 2px 4px rgba(0,0,0,0.3)', m: 0 }}>
          TestCraft AI
        </Typography>
        <Typography variant="h6" sx={{ fontFamily: 'Quicksand', fontWeight: 500, mt: 1, letterSpacing: 2 }}>
          Transform Software Specs into Complete Test Suites in Seconds
        </Typography>

        {/* User Status Bar & Custom Key Toggle */}
        <Box mt={3} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, flexWrap: 'wrap', px: 2 }}>
          <Box sx={{ fontFamily: 'Quicksand', fontWeight: 600, color: '#f0e8e4', fontSize: '1rem' }}>
            User: <strong style={{ color: '#fff' }}>{username || 'Tester'}</strong>
          </Box>

          <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.3)', height: 20, my: 'auto' }} />

          {/* Credits / Custom Key Status Badge */}
          <Tooltip title={customApiKey ? "Using your personal Groq API key (No server credits deducted)" : "Using default server credits"}>
            <Chip 
              icon={<VpnKeyIcon sx={{ fontSize: 16, color: customApiKey ? '#A4C355 !important' : '#ffd54f !important' }} />}
              label={customApiKey ? "Custom Groq Key Active" : `Server Credits: ${tokens !== null ? tokens : '...'}`}
              onClick={() => setKeyDialogOpen(true)}
              clickable
              sx={{ 
                bgcolor: customApiKey ? 'rgba(164,195,85,0.2)' : 'rgba(255,213,79,0.15)',
                color: customApiKey ? '#A4C355' : '#ffd54f',
                fontFamily: 'Quicksand',
                fontWeight: 700,
                border: customApiKey ? '1px solid #A4C355' : '1px solid #ffd54f',
                cursor: 'pointer',
                '&:hover': { bgcolor: customApiKey ? 'rgba(164,195,85,0.3)' : 'rgba(255,213,79,0.25)' }
              }}
            />
          </Tooltip>

          <Button 
            size="small" 
            variant="outlined"
            startIcon={<VpnKeyIcon sx={{ fontSize: 14 }} />}
            onClick={() => setKeyDialogOpen(true)}
            sx={{ 
              color: 'white', 
              borderColor: 'rgba(255,255,255,0.4)', 
              textTransform: 'none', 
              fontFamily: 'Quicksand', 
              fontWeight: 600, 
              borderRadius: 3,
              fontSize: '0.82rem',
              '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } 
            }}
          >
            {customApiKey ? "Manage API Key" : "Add Your Free Groq Key"}
          </Button>

          <Button 
            size="small" 
            startIcon={<LogoutIcon sx={{ fontSize: 14 }} />}
            sx={{ color: '#f0d8df', textTransform: 'none', textDecoration: 'underline', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }} 
            onClick={handleLogout}
          >
            Sign Out
          </Button>
        </Box>
      </Box>

      {/* Torn Paper Divider Top */}
      <svg viewBox="0 0 1440 120" style={{ display: 'block', width: '100%', height: 'auto', backgroundColor: '#612135', marginBottom: '-1px' }}>
        <path fill="#F4EFEA" d="M0,64L48,80C96,96,192,128,288,122.7C384,117,480,75,576,64C672,53,768,75,864,85.3C960,96,1056,96,1152,85.3C1248,75,1344,53,1392,42.7L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"></path>
      </svg>

      {/* Content Area */}
      <Box sx={{ bgcolor: '#F4EFEA', pt: 6, pb: 10, flex: 1 }}>
        <Container maxWidth="lg">
          <Typography variant="h2" color="primary" align="center" gutterBottom>Craft Your Scenarios</Typography>
          
          <Card sx={{ p: { xs: 3, sm: 5 }, mb: 6, borderRadius: 4, boxShadow: '0 12px 36px rgba(97,33,53,0.15)', bgcolor: 'white' }}>
            <FormControl component="fieldset" sx={{ mb: 3 }}>
              <RadioGroup row value={inputType} onChange={(e) => setInputType(e.target.value)}>
                <FormControlLabel value="upload" control={<Radio sx={{ color: 'secondary.main', '&.Mui-checked': { color: 'secondary.main' } }} />} label={<span style={{fontFamily: 'Quicksand', fontWeight: 600}}>Upload Document (PDF, DOCX, CSV)</span>} />
                <FormControlLabel value="url" control={<Radio sx={{ color: 'secondary.main', '&.Mui-checked': { color: 'secondary.main' } }} />} label={<span style={{fontFamily: 'Quicksand', fontWeight: 600}}>Text / Description</span>} />
              </RadioGroup>
            </FormControl>

            <Box mb={4}>
              {inputType === 'upload' ? (
                <Button 
                  variant="outlined" 
                  component="label" 
                  fullWidth 
                  startIcon={<CloudUploadIcon sx={{ fontSize: 28 }} />}
                  sx={{ 
                    py: 4, 
                    borderStyle: 'dashed', 
                    borderWidth: 2,
                    borderColor: file ? '#A4C355' : 'primary.main', 
                    color: file ? '#4e7314' : 'primary.main', 
                    borderRadius: 4, 
                    fontFamily: 'Quicksand', 
                    fontWeight: 700, 
                    fontSize: '1.1rem',
                    bgcolor: file ? '#f4f8ec' : '#fdfbfa',
                    transition: 'all 0.2s',
                    '&:hover': { borderWidth: 2, bgcolor: file ? '#eaf3dd' : '#f9f5f2' }
                  }}
                >
                  {file ? `SELECTED: ${file.name.toUpperCase()}` : "Click to select PDF, DOCX, or CSV..."}
                  <input type="file" hidden accept=".pdf,.docx,.csv" onChange={(e) => setFile(e.target.files[0])} />
                </Button>
              ) : (
                <TextField 
                  fullWidth 
                  label="Describe feature, user story, or paste requirements..." 
                  variant="outlined" 
                  multiline 
                  rows={4} 
                  value={urlInput} 
                  onChange={(e) => setUrlInput(e.target.value)} 
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 4, fontFamily: 'Quicksand' } }} 
                />
              )}
            </Box>

            <Typography variant="h4" color="primary" gutterBottom sx={{ mt: 4, textAlign: 'center' }}>Strategy & Scope</Typography>
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel sx={{ fontFamily: 'Quicksand' }}>Format Style</InputLabel>
              <Select value={formatStyle} label="Format Style" onChange={(e) => setFormatStyle(e.target.value)} sx={{ borderRadius: 4, fontFamily: 'Quicksand' }}>
                <MenuItem value="Standard (Step-by-Step)" sx={{ fontFamily: 'Quicksand' }}>Standard Tables (Test ID, Steps, Expected)</MenuItem>
                <MenuItem value="BDD (Given-When-Then)" sx={{ fontFamily: 'Quicksand' }}>BDD Gherkin (Given / When / Then)</MenuItem>
              </Select>
            </FormControl>

            <Typography variant="body2" sx={{ fontFamily: 'Quicksand', fontWeight: 700, color: '#612135', mb: 1, textAlign: 'center' }}>
              Select Focus Areas:
            </Typography>
            <FormGroup row sx={{ justifyContent: 'center', mb: 3 }}>
              {Object.keys(focusAreas).map(key => (
                <FormControlLabel 
                  key={key} 
                  control={<Checkbox checked={focusAreas[key]} onChange={(e) => setFocusAreas({...focusAreas, [key]: e.target.checked})} sx={{ color: 'secondary.main', '&.Mui-checked': { color: 'secondary.main' } }} />} 
                  label={<span style={{fontFamily: 'Quicksand', fontWeight: 600}}>{key}</span>} 
                />
              ))}
            </FormGroup>

            {error && (
              <Alert severity="error" sx={{ mt: 2, mb: 2, borderRadius: 2, fontFamily: 'Quicksand', fontWeight: 600 }}>
                {error}
              </Alert>
            )}

            <Button 
              variant="contained" 
              color="secondary" 
              size="large" 
              fullWidth 
              startIcon={<AutoAwesomeIcon />}
              onClick={handleGenerate} 
              disabled={loading} 
              sx={{ 
                mt: 3, 
                py: 2, 
                borderRadius: 8, 
                fontSize: '1.25rem', 
                color: '#fff', 
                textTransform: 'none', 
                boxShadow: '0 8px 20px rgba(164,195,85,0.4)', 
                fontFamily: 'Quicksand', 
                fontWeight: 700,
                '&:hover': { bgcolor: '#8ea846' }
              }}
            >
              {loading ? <CircularProgress size={28} sx={{ color: 'white' }} /> : 'Generate Test Scenarios'}
            </Button>
          </Card>

          {markdown && (
            <Card sx={{ p: { xs: 3, sm: 5 }, borderRadius: 4, boxShadow: '0 12px 36px rgba(97,33,53,0.15)', bgcolor: 'white' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3, borderBottom: '2px solid #f0e8e4', pb: 2 }}>
                <Typography variant="h3" color="primary" sx={{ m: 0, fontSize: { xs: '2.5rem', sm: '3.2rem' } }}>
                  Generated Test Plan
                </Typography>
                
                <Stack direction="row" spacing={1.5}>
                  <Tooltip title={copied ? "Copied to clipboard!" : "Copy Markdown"}>
                    <Button 
                      variant="outlined" 
                      size="medium" 
                      startIcon={copied ? <CheckIcon color="success" /> : <ContentCopyIcon />}
                      onClick={handleCopyMarkdown}
                      sx={{ 
                        borderRadius: 3, 
                        textTransform: 'none', 
                        fontFamily: 'Quicksand', 
                        fontWeight: 700,
                        borderColor: '#9e7abf',
                        color: '#612135',
                        '&:hover': { borderColor: '#612135', bgcolor: '#f9f5fa' }
                      }}
                    >
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                  </Tooltip>

                  <Button 
                    variant="contained" 
                    color="secondary" 
                    size="medium" 
                    startIcon={downloadingPdf ? <CircularProgress size={18} color="inherit" /> : <DownloadIcon />}
                    onClick={handleDownloadPdf}
                    disabled={downloadingPdf}
                    sx={{ 
                      borderRadius: 3, 
                      textTransform: 'none', 
                      color: '#fff', 
                      fontFamily: 'Quicksand', 
                      fontWeight: 700,
                      boxShadow: '0 4px 12px rgba(164,195,85,0.35)',
                      '&:hover': { bgcolor: '#8ea846' }
                    }}
                  >
                    {downloadingPdf ? "Exporting..." : "Download PDF"}
                  </Button>
                </Stack>
              </Box>

              <Box sx={{ 
                fontFamily: 'Quicksand', 
                color: '#2b2b2b',
                lineHeight: 1.7,
                '& h1': { 
                  color: '#612135', 
                  fontSize: '2rem',
                  fontFamily: 'Quicksand', 
                  fontWeight: 800, 
                  borderBottom: '2px solid #F4EFEA',
                  pb: 1,
                  mt: 3, 
                  mb: 2 
                },
                '& h2': { 
                  color: '#612135', 
                  fontSize: '1.6rem',
                  fontFamily: 'Quicksand', 
                  fontWeight: 700, 
                  mt: 4, 
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  '&::before': {
                    content: '""',
                    display: 'inline-block',
                    width: '6px',
                    height: '24px',
                    backgroundColor: '#A4C355',
                    borderRadius: '3px',
                    marginRight: '10px'
                  }
                },
                '& h3, & h4': { 
                  color: '#612135', 
                  fontFamily: 'Quicksand', 
                  fontWeight: 700, 
                  mt: 3, 
                  mb: 1.5 
                },
                '& p': { 
                  fontSize: '1rem',
                  lineHeight: 1.8, 
                  mb: 2 
                },
                '& ul, & ol': { 
                  pl: 3, 
                  mb: 2,
                  '& li': { 
                    mb: 0.8,
                    lineHeight: 1.7
                  } 
                },
                '& strong': {
                  color: '#612135',
                  fontWeight: 700
                },
                '& code': {
                  bgcolor: '#f5f0fa',
                  color: '#612135',
                  px: 1,
                  py: 0.3,
                  borderRadius: 1.5,
                  fontSize: '0.9rem',
                  fontFamily: 'Consolas, Monaco, monospace',
                  border: '1px solid #e8def2'
                },
                // Responsive & Styled Table Container
                '& table': { 
                  width: '100%', 
                  borderCollapse: 'separate', 
                  borderSpacing: 0,
                  my: 3, 
                  borderRadius: 3, 
                  overflow: 'hidden',
                  border: '1px solid #e8e0db',
                  boxShadow: '0 4px 16px rgba(97,33,53,0.06)',
                  display: 'table',
                  '& th': { 
                    backgroundColor: '#612135', 
                    color: '#ffffff', 
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    padding: '14px 16px',
                    textAlign: 'left',
                    letterSpacing: '0.5px',
                    borderBottom: '2px solid #4a1928'
                  },
                  '& td': { 
                    borderBottom: '1px solid #f0e8e4', 
                    padding: '14px 16px', 
                    textAlign: 'left',
                    fontSize: '0.92rem',
                    verticalAlign: 'top',
                    lineHeight: 1.6
                  },
                  '& tbody tr:nth-of-type(even)': {
                    backgroundColor: '#faf7f4'
                  },
                  '& tbody tr:nth-of-type(odd)': {
                    backgroundColor: '#ffffff'
                  },
                  '& tbody tr:hover': {
                    backgroundColor: '#f3ece6',
                    transition: 'background-color 0.15s ease'
                  },
                  '& tbody tr:last-of-type td': {
                    borderBottom: 'none'
                  }
                }
              }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {markdown}
                </ReactMarkdown>
              </Box>
            </Card>
          )}
        </Container>
      </Box>

      {/* Torn Paper Divider Bottom */}
      <svg viewBox="0 0 1440 120" style={{ display: 'block', width: '100%', height: 'auto', backgroundColor: '#F4EFEA', marginTop: '-1px' }}>
        <path fill="#612135" d="M0,64L48,80C96,96,192,128,288,122.7C384,117,480,75,576,64C672,53,768,75,864,85.3C960,96,1056,96,1152,85.3C1248,75,1344,53,1392,42.7L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"></path>
      </svg>

      {/* COMPREHENSIVE FOOTER SECTION */}
      <Box component="footer" sx={{ bgcolor: '#612135', color: '#f4efea', pt: 6, pb: 6, px: { xs: 3, md: 8 } }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '2fr 1.5fr 1.5fr 1.5fr' }, gap: 4, mb: 6 }}>
            
            {/* Column 1: About TestCraft */}
            <Box>
              <Typography variant="h4" sx={{ color: 'white', mb: 1, fontFamily: "'Great Vibes', cursive", fontSize: '2.5rem' }}>
                TestCraft AI
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'Quicksand', lineHeight: 1.8, color: '#e8dbd4', mb: 2 }}>
                Intelligent Quality Assurance automation platform designed to turn requirement specifications, PRDs, and user stories into production-grade test suites in seconds.
              </Typography>
              <Chip 
                label="v1.0.0 • Production Ready" 
                size="small" 
                sx={{ bgcolor: 'rgba(164,195,85,0.2)', color: '#A4C355', fontFamily: 'Quicksand', fontWeight: 700, border: '1px solid #A4C355' }} 
              />
            </Box>

            {/* Column 2: How It Works */}
            <Box>
              <Typography variant="h6" sx={{ color: 'white', fontFamily: 'Quicksand', fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SpeedIcon sx={{ fontSize: 20, color: '#A4C355' }} /> How It Works
              </Typography>
              <Box component="ul" sx={{ pl: 2, m: 0, fontFamily: 'Quicksand', fontSize: '0.9rem', color: '#e8dbd4', lineHeight: 2 }}>
                <li><strong>1. Ingest Specs:</strong> PDF, Word, CSV, or raw text.</li>
                <li><strong>2. Configure Strategy:</strong> Tables or BDD Gherkin.</li>
                <li><strong>3. AI Synthesis:</strong> Groq Cloud LLM engine.</li>
                <li><strong>4. Export & Integrate:</strong> PDF or Jira markdown.</li>
              </Box>
            </Box>

            {/* Column 3: Tech Stack */}
            <Box>
              <Typography variant="h6" sx={{ color: 'white', fontFamily: 'Quicksand', fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <LayersIcon sx={{ fontSize: 20, color: '#A4C355' }} /> Architecture
              </Typography>
              <Box sx={{ fontFamily: 'Quicksand', fontSize: '0.88rem', color: '#e8dbd4', lineHeight: 1.9 }}>
                <div>• <strong>Frontend:</strong> React 19, Vite, MUI v9</div>
                <div>• <strong>Backend:</strong> FastAPI, Python 3.12</div>
                <div>• <strong>AI Core:</strong> Groq Cloud API</div>
                <div>• <strong>Parsing:</strong> PyMuPDF, docx, pandas</div>
                <div>• <strong>Auth:</strong> JWT & Bcrypt OAuth2</div>
              </Box>
            </Box>

            {/* Column 4: Contact & Creator Details */}
            <Box>
              <Typography variant="h6" sx={{ color: 'white', fontFamily: 'Quicksand', fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <GitHubIcon sx={{ fontSize: 20, color: '#A4C355' }} /> Creator & Contact
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'Quicksand', color: '#e8dbd4', mb: 2 }}>
                Designed and built by <strong>Sanika</strong>. Open source and free for developers & QA teams.
              </Typography>
              
              <Button 
                variant="outlined" 
                size="small"
                startIcon={<GitHubIcon />}
                endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                href="https://github.com/SanikaM14" 
                target="_blank"
                rel="noopener noreferrer"
                sx={{ 
                  color: 'white', 
                  borderColor: '#A4C355', 
                  borderRadius: 3, 
                  textTransform: 'none', 
                  fontFamily: 'Quicksand', 
                  fontWeight: 700,
                  bgcolor: 'rgba(164,195,85,0.15)',
                  '&:hover': { bgcolor: 'rgba(164,195,85,0.3)', borderColor: '#A4C355' }
                }}
              >
                github.com/SanikaM14
              </Button>
            </Box>

          </Box>

          <Divider sx={{ bgcolor: 'rgba(255,255,255,0.15)', mb: 3 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="body2" sx={{ fontFamily: 'Quicksand', color: '#c9b7b0', fontSize: '0.85rem' }}>
              © {new Date().getFullYear()} <strong>TestCraft AI</strong>. Developed with passion by <a href="https://github.com/SanikaM14" target="_blank" rel="noopener noreferrer" style={{ color: '#A4C355', textDecoration: 'underline', fontWeight: 'bold' }}>SanikaM14</a>.
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'Quicksand', color: '#c9b7b0', fontSize: '0.85rem' }}>
              Powered by Groq High-Speed AI Engine
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Custom Groq API Key Dialog Modal */}
      <Dialog 
        open={keyDialogOpen} 
        onClose={() => setKeyDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: 4, p: 1 }
          }
        }}
      >
        <DialogTitle sx={{ fontFamily: 'Quicksand', fontWeight: 800, color: '#612135', display: 'flex', alignItems: 'center', gap: 1 }}>
          <VpnKeyIcon sx={{ color: '#A4C355' }} /> Bring Your Own Groq API Key (Free)
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ fontFamily: 'Quicksand', mb: 2, color: '#444', lineHeight: 1.7 }}>
            Want to <strong>generate test plans without using server credits</strong>? You can provide your own free API key from Groq Console. It is stored locally in your browser and used only for your requests.
          </Typography>

          <Box sx={{ bgcolor: '#fdfaf7', p: 2, borderRadius: 2, mb: 3, border: '1px solid #f0e6dd' }}>
            <Typography variant="subtitle2" sx={{ fontFamily: 'Quicksand', fontWeight: 700, color: '#612135', mb: 0.5 }}>
              How to get your free Groq API key (in 10 seconds):
            </Typography>
            <Box component="ol" sx={{ pl: 2.5, m: 0, fontFamily: 'Quicksand', fontSize: '0.85rem', color: '#555', lineHeight: 1.8 }}>
              <li>Visit <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" style={{ color: '#9e7abf', fontWeight: 'bold' }}>console.groq.com/keys</a> and sign in.</li>
              <li>Click <strong>'Create API Key'</strong> and copy it.</li>
              <li>Paste your key below and click <strong>Save & Use Key</strong>.</li>
            </Box>
          </Box>

          {keySuccessMsg && (
            <Alert severity="success" sx={{ mb: 2, borderRadius: 2, fontFamily: 'Quicksand', fontWeight: 600 }}>
              {keySuccessMsg}
            </Alert>
          )}

          <TextField
            fullWidth
            type={showApiKey ? 'text' : 'password'}
            label="Groq API Key"
            placeholder="gsk_..."
            value={tempKeyInput}
            onChange={(e) => setTempKeyInput(e.target.value)}
            helperText={customApiKey ? "Active: You are currently using your own Groq API key." : "Leave blank to use default server credits."}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle key visibility"
                      onClick={() => setShowApiKey(!showApiKey)}
                      edge="end"
                      size="small"
                    >
                      {showApiKey ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                )
              }
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, fontFamily: 'Quicksand' } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Box>
            {customApiKey && (
              <Button 
                color="error" 
                startIcon={<KeyOffIcon />}
                onClick={handleClearCustomKey}
                sx={{ textTransform: 'none', fontFamily: 'Quicksand', fontWeight: 600 }}
              >
                Remove Custom Key
              </Button>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              onClick={() => setKeyDialogOpen(false)} 
              sx={{ textTransform: 'none', fontFamily: 'Quicksand', fontWeight: 600, color: '#777' }}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              color="secondary"
              onClick={handleSaveCustomKey}
              sx={{ 
                borderRadius: 3, 
                textTransform: 'none', 
                fontFamily: 'Quicksand', 
                fontWeight: 700, 
                color: '#fff',
                boxShadow: '0 4px 12px rgba(164,195,85,0.35)'
              }}
            >
              Save & Use Key
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
