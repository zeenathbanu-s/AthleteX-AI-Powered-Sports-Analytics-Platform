import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  Tab,
  Tabs,
  CircularProgress
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface EmailLoginForm {
  email: string;
  password: string;
}

interface PhoneLoginForm {
  phoneNumber: string;
  displayName: string;
  otp?: string;
}

const emailSchema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required')
});

const phoneSchema = yup.object().shape({
  phoneNumber: yup.string()
    .matches(/^\+[1-9]\d{1,14}$/, 'Please enter phone number in international format (e.g., +1234567890)')
    .required('Phone number is required'),
  displayName: yup.string().required('Name is required')
});

const LoginPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const navigate = useNavigate();
  const { 
    signIn, 
    sendOTP, 
    verifyOTP, 
    setupRecaptcha, 
    loading, 
    error, 
    clearError, 
    isOtpSent,
    isVerifyingOtp,
    user 
  } = useAuth();

  const emailForm = useForm<EmailLoginForm>({
    resolver: yupResolver(emailSchema)
  });

  const phoneForm = useForm<PhoneLoginForm>({
    resolver: yupResolver(phoneSchema)
  });

  useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' ? '/admin' : '/profile');
    }
  }, [user, navigate]);

  useEffect(() => {
    // Setup reCAPTCHA for phone authentication
    if (tabValue === 1) {
      setupRecaptcha('recaptcha-container');
    }
  }, [tabValue, setupRecaptcha]);

  const handleEmailLogin = async (data: EmailLoginForm) => {
    try {
      clearError();
      await signIn(data.email, data.password);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handlePhoneLogin = async (data: PhoneLoginForm) => {
    try {
      clearError();
      if (!isOtpSent) {
        await sendOTP(data.phoneNumber);
      } else if (data.otp) {
        await verifyOTP(data.otp, data.displayName);
      }
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    clearError();
    emailForm.reset();
    phoneForm.reset();
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Welcome to AthleteX
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Tabs value={tabValue} onChange={handleTabChange} centered sx={{ mb: 3 }}>
            <Tab label="Email Login" />
            <Tab label="Phone Login" />
          </Tabs>

          {tabValue === 0 && (
            <Box component="form" onSubmit={emailForm.handleSubmit(handleEmailLogin)}>
              <TextField
                {...emailForm.register('email')}
                error={!!emailForm.formState.errors.email}
                helperText={emailForm.formState.errors.email?.message}
                margin="normal"
                fullWidth
                label="Email Address"
                type="email"
                autoComplete="email"
                autoFocus
              />
              
              <TextField
                {...emailForm.register('password')}
                error={!!emailForm.formState.errors.password}
                helperText={emailForm.formState.errors.password?.message}
                margin="normal"
                fullWidth
                label="Password"
                type="password"
                autoComplete="current-password"
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Sign In'}
              </Button>
            </Box>
          )}

          {tabValue === 1 && (
            <Box component="form" onSubmit={phoneForm.handleSubmit(handlePhoneLogin)}>
              <TextField
                {...phoneForm.register('displayName')}
                error={!!phoneForm.formState.errors.displayName}
                helperText={phoneForm.formState.errors.displayName?.message}
                margin="normal"
                fullWidth
                label="Full Name"
                autoComplete="name"
                disabled={isOtpSent}
              />
              
              <TextField
                {...phoneForm.register('phoneNumber')}
                error={!!phoneForm.formState.errors.phoneNumber}
                helperText={phoneForm.formState.errors.phoneNumber?.message}
                margin="normal"
                fullWidth
                label="Phone Number"
                placeholder="+1234567890"
                disabled={isOtpSent}
              />

              {isOtpSent && (
                <TextField
                  {...phoneForm.register('otp')}
                  margin="normal"
                  fullWidth
                  label="Enter OTP"
                  type="text"
                  inputProps={{ maxLength: 6 }}
                />
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading || isVerifyingOtp}
              >
                {loading || isVerifyingOtp ? (
                  <CircularProgress size={24} />
                ) : isOtpSent ? (
                  'Verify OTP'
                ) : (
                  'Send OTP'
                )}
              </Button>

              <div id="recaptcha-container"></div>
            </Box>
          )}

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2">
              Don't have an account?{' '}
              <Link component={RouterLink} to="/signup">
                Sign up here
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage;
