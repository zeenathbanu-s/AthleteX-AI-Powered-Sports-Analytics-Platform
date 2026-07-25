import React, { useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  CircularProgress
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface SignupForm {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
}

const signupSchema = yup.object().shape({
  displayName: yup.string().required('Full name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password')
});

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { signUp, loading, error, clearError, user } = useAuth();

  const form = useForm<SignupForm>({
    resolver: yupResolver(signupSchema)
  });

  useEffect(() => {
    if (user) {
      navigate('/profile');
    }
  }, [user, navigate]);

  const handleSignup = async (data: SignupForm) => {
    try {
      clearError();
      await signUp(data.email, data.password, data.displayName);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Join AthleteX
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={form.handleSubmit(handleSignup)}>
            <TextField
              {...form.register('displayName')}
              error={!!form.formState.errors.displayName}
              helperText={form.formState.errors.displayName?.message}
              margin="normal"
              fullWidth
              label="Full Name"
              autoComplete="name"
              autoFocus
            />
            
            <TextField
              {...form.register('email')}
              error={!!form.formState.errors.email}
              helperText={form.formState.errors.email?.message}
              margin="normal"
              fullWidth
              label="Email Address"
              type="email"
              autoComplete="email"
            />
            
            <TextField
              {...form.register('password')}
              error={!!form.formState.errors.password}
              helperText={form.formState.errors.password?.message}
              margin="normal"
              fullWidth
              label="Password"
              type="password"
              autoComplete="new-password"
            />

            <TextField
              {...form.register('confirmPassword')}
              error={!!form.formState.errors.confirmPassword}
              helperText={form.formState.errors.confirmPassword?.message}
              margin="normal"
              fullWidth
              label="Confirm Password"
              type="password"
              autoComplete="new-password"
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign Up'}
            </Button>
          </Box>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2">
              Already have an account?{' '}
              <Link component={RouterLink} to="/login">
                Sign in here
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default SignupPage;
