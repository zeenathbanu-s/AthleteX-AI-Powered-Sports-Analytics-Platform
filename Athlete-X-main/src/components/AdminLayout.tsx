import React from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
} from '@mui/material';
import {
  AdminPanelSettings,
  Dashboard,
  ExitToApp,
  AccountCircle,
} from '@mui/icons-material';
import { useAdminAuth } from '../hooks/useAdminAuth';

const AdminLayout: React.FC = () => {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
    handleClose();
  };

  const handleBackToApp = () => {
    navigate('/');
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar 
        position="sticky" 
        sx={{ 
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          boxShadow: 3
        }}
      >
        <Toolbar>
          <AdminPanelSettings sx={{ mr: 2 }} />
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontWeight: 'bold',
              letterSpacing: 1
            }}
          >
            AthleteX Admin Dashboard
          </Typography>

          <Button
            color="inherit"
            startIcon={<Dashboard />}
            onClick={() => navigate('/admin/dashboard')}
            sx={{ mr: 2 }}
          >
            Dashboard
          </Button>

          <Button
            color="inherit"
            onClick={handleBackToApp}
            sx={{ mr: 2 }}
          >
            Back to App
          </Button>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ mr: 2 }}>
              Welcome, {admin?.username}
            </Typography>
            <IconButton
              size="large"
              aria-label="account of current admin"
              aria-controls="admin-menu"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)' }}>
                <AccountCircle />
              </Avatar>
            </IconButton>
            <Menu
              id="admin-menu"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem disabled>
                <Typography variant="body2" color="text.secondary">
                  {admin?.email}
                </Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ExitToApp sx={{ mr: 1 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 3, mb: 3 }}>
        <Outlet />
      </Container>
    </Box>
  );
};

export default AdminLayout;
