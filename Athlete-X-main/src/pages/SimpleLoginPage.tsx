import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Card,
  CardContent
} from '@mui/material';
import {
  FitnessCenter,
  Speed,
  Psychology,
  TrendingUp
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const SimpleLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { user, loading, error, signIn, clearError } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      clearError();
      await signIn(email || 'user', password || 'pass');
    } catch (error) {
      // Error is handled by the hook
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `
          linear-gradient(
            135deg,
            #0a0a0a 0%,
            rgba(0, 245, 255, 0.1) 50%,
            rgba(138, 43, 226, 0.1) 100%
          ),
          radial-gradient(
            ellipse at center,
            rgba(0, 245, 255, 0.15) 0%,
            transparent 70%
          )
        `,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center'
      }}
    >
      {/* Background Pattern */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300f5ff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
          `,
          opacity: 0.5
        }}
      />
      
      <Container maxWidth="lg">
        <Box display="flex" alignItems="center" gap={8}>
          {/* Left Side - Features */}
          <Box flex={1} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Box sx={{ mb: 6 }}>
              <Box display="flex" alignItems="center" gap={2} sx={{ mb: 3 }}>
                <FitnessCenter sx={{ fontSize: 40, color: '#00f5ff' }} />
                <Typography 
                  variant="h4" 
                  fontWeight="bold" 
                  sx={{ 
                    background: 'linear-gradient(135deg, #00f5ff, #0080ff)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  AthleteX
                </Typography>
              </Box>
              
              <Typography 
                variant="h2" 
                sx={{ 
                  color: 'white',
                  fontWeight: 'bold',
                  mb: 2,
                  lineHeight: 1.2
                }}
              >
                Elevate Your
                <br />
                <span style={{ color: '#00f5ff' }}>Athletic Performance</span>
              </Typography>
              
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: 300,
                  lineHeight: 1.6
                }}
              >
                Join thousands of athletes using AI-powered insights to optimize their training and achieve peak performance.
              </Typography>
            </Box>
            
            {/* Feature Cards */}
            <Box display="flex" flexDirection="column" gap={2}>
              {[
                { icon: <Psychology />, title: 'AI-Powered Analysis', desc: 'Get personalized insights from advanced AI' },
                { icon: <Speed />, title: 'Performance Tracking', desc: 'Monitor progress across all athletic metrics' },
                { icon: <TrendingUp />, title: 'Smart Recommendations', desc: 'Receive training plans tailored for you' }
              ].map((feature, index) => (
                <Card
                  key={index}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 2
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box sx={{ color: '#00f5ff' }}>
                        {feature.icon}
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                          {feature.title}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          {feature.desc}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
          
          {/* Right Side - Login Form */}
          <Box flex={1} display="flex" justifyContent="center">
            <Card
              elevation={20}
              sx={{
                width: '100%',
                maxWidth: 400,
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 4,
                overflow: 'hidden'
              }}
            >
              {/* Header */}
              <Box
                sx={{
                  background: 'linear-gradient(135deg, rgba(0, 245, 255, 0.2), rgba(138, 43, 226, 0.2))',
                  p: 4,
                  textAlign: 'center'
                }}
              >
                <Typography 
                  variant="h4" 
                  sx={{ 
                    color: 'white',
                    fontWeight: 'bold',
                    mb: 1
                  }}
                >
                  Welcome Back
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.8)'
                  }}
                >
                  Sign in to access your athletic dashboard
                </Typography>
              </Box>
              
              <CardContent sx={{ p: 4 }}>
                {error && (
                  <Alert 
                    severity="error" 
                    onClose={clearError}
                    sx={{ 
                      mb: 3, 
                      bgcolor: 'rgba(244, 67, 54, 0.1)',
                      color: '#ff6b6b',
                      border: '1px solid rgba(244, 67, 54, 0.3)'
                    }}
                  >
                    {error}
                  </Alert>
                )}

                <Box component="form" onSubmit={handleLogin}>
                  <TextField
                    label="Username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    fullWidth
                    margin="normal"
                    placeholder="Enter any username..."
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'rgba(255, 255, 255, 0.05)',
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.3)'
                        },
                        '&:hover fieldset': {
                          borderColor: '#00f5ff'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#00f5ff'
                        }
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255, 255, 255, 0.7)'
                      },
                      '& .MuiInputBase-input': {
                        color: 'white'
                      }
                    }}
                  />
                  
                  <TextField
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    fullWidth
                    margin="normal"
                    placeholder="Enter any password..."
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'rgba(255, 255, 255, 0.05)',
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.3)'
                        },
                        '&:hover fieldset': {
                          borderColor: '#00f5ff'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#00f5ff'
                        }
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255, 255, 255, 0.7)'
                      },
                      '& .MuiInputBase-input': {
                        color: 'white'
                      }
                    }}
                  />
                  
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{
                      mt: 4,
                      mb: 2,
                      py: 2,
                      bgcolor: '#00f5ff',
                      color: '#000',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      textTransform: 'none',
                      borderRadius: 2,
                      boxShadow: '0 8px 32px rgba(0, 245, 255, 0.3)',
                      '&:hover': {
                        bgcolor: '#0080ff',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 40px rgba(0, 245, 255, 0.4)'
                      },
                      '&:disabled': {
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                        color: 'rgba(255, 255, 255, 0.5)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Enter Your Athletic Zone'}
                  </Button>
                </Box>

                <Box 
                  sx={{ 
                    textAlign: 'center',
                    p: 2,
                    bgcolor: 'rgba(0, 245, 255, 0.05)',
                    borderRadius: 2,
                    border: '1px solid rgba(0, 245, 255, 0.2)'
                  }}
                >
                  <Typography variant="body2" sx={{ color: '#00f5ff', fontWeight: 'bold' }}>
                    Demo Mode: Any credentials work!
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Just enter any username and password to explore
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default SimpleLoginPage;
