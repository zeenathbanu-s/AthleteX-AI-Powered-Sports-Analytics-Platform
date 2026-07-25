import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Button,
  Grid,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Card,
  CardContent,
  Stack,
  Badge
} from '@mui/material';
import {
  PersonAdd,
  Message,
  LocationOn,
  EmojiEvents,
  Speed,
  School,
  Group,
  Verified,
  Star
} from '@mui/icons-material';
import { AthleteProfile } from '../data/demoData';

interface AthleteProfileViewProps {
  athlete: AthleteProfile;
  onFollow?: () => void;
  onMessage?: () => void;
}

const AthleteProfileView: React.FC<AthleteProfileViewProps> = ({
  athlete,
  onFollow,
  onMessage
}) => {
  return (
    <Box>
      {/* Header Section */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Avatar
              sx={{ 
                width: 120, 
                height: 120, 
                bgcolor: 'rgba(255,255,255,0.2)',
                fontSize: '2rem'
              }}
            >
              {athlete.name.split(' ').map(n => n[0]).join('')}
            </Avatar>
          </Grid>
          <Grid item flex={1}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Typography variant="h4" fontWeight="bold">
                {athlete.name}
              </Typography>
              {athlete.verified && (
                <Verified sx={{ color: 'gold', fontSize: 28 }} />
              )}
            </Box>
            
            <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
              {athlete.sport}
            </Typography>
            
            <Box display="flex" alignItems="center" gap={0.5} mb={2}>
              <LocationOn fontSize="small" />
              <Typography variant="body2">
                {athlete.location}
              </Typography>
            </Box>
            
            <Typography variant="body1" sx={{ opacity: 0.9, mb: 2 }}>
              {athlete.bio}
            </Typography>
            
            {/* Stats Row */}
            <Grid container spacing={4}>
              <Grid item>
                <Typography variant="h5" fontWeight="bold">
                  {athlete.followers.toLocaleString()}
                </Typography>
                <Typography variant="caption">Followers</Typography>
              </Grid>
              <Grid item>
                <Typography variant="h5" fontWeight="bold">
                  {athlete.following.toLocaleString()}
                </Typography>
                <Typography variant="caption">Following</Typography>
              </Grid>
              <Grid item>
                <Typography variant="h5" fontWeight="bold">
                  {athlete.posts}
                </Typography>
                <Typography variant="caption">Posts</Typography>
              </Grid>
              <Grid item>
                <Typography variant="h5" fontWeight="bold">
                  {athlete.yearsExperience}
                </Typography>
                <Typography variant="caption">Years Experience</Typography>
              </Grid>
            </Grid>
          </Grid>
          <Grid item>
            <Stack spacing={2}>
              <Button
                variant="contained"
                size="large"
                startIcon={<PersonAdd />}
                onClick={onFollow}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                  backdropFilter: 'blur(10px)'
                }}
              >
                Follow
              </Button>
              <Button
                variant="outlined"
                size="large"
                startIcon={<Message />}
                onClick={onMessage}
                sx={{ 
                  borderColor: 'rgba(255,255,255,0.5)',
                  color: 'white',
                  '&:hover': { 
                    borderColor: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                Message
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={8}>
          {/* Personal Bests */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <Speed color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" fontWeight="bold">
                Personal Bests
              </Typography>
            </Box>
            <Grid container spacing={2}>
              {Object.entries(athlete.personalBests).map(([event, record]) => (
                <Grid item xs={12} sm={6} md={4} key={event}>
                  <Card variant="outlined">
                    <CardContent sx={{ py: 1.5 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {event}
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" color="primary">
                        {record}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* Achievements */}
          <Paper sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <EmojiEvents color="secondary" sx={{ mr: 1 }} />
              <Typography variant="h6" fontWeight="bold">
                Achievements
              </Typography>
            </Box>
            <List>
              {athlete.achievements.map((achievement, index) => (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Star color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary={achievement}
                    primaryTypographyProps={{ fontWeight: 'medium' }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            {/* Quick Info */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Quick Info
              </Typography>
              <Stack spacing={2}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Level
                  </Typography>
                  <Chip 
                    label={athlete.level} 
                    size="small" 
                    color={athlete.level === 'Professional' ? 'primary' : 'default'}
                    variant={athlete.level === 'Professional' ? 'filled' : 'outlined'}
                  />
                </Box>
                
                {athlete.teamAffiliation && (
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Team
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {athlete.teamAffiliation}
                    </Typography>
                  </Box>
                )}
                
                {athlete.coachName && (
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Coach
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {athlete.coachName}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Paper>

            {/* Specialties */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Specialties
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {athlete.specialties.map((specialty) => (
                  <Chip
                    key={specialty}
                    label={specialty}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                ))}
              </Box>
            </Paper>

            {/* Activity Summary */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Activity Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h5" color="primary" fontWeight="bold">
                      {athlete.achievements.length}
                    </Typography>
                    <Typography variant="caption">Awards</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h5" color="secondary" fontWeight="bold">
                      {Object.keys(athlete.personalBests).length}
                    </Typography>
                    <Typography variant="caption">Records</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h5" color="success.main" fontWeight="bold">
                      {Math.floor(Math.random() * 50) + 20}
                    </Typography>
                    <Typography variant="caption">Competitions</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h5" color="warning.main" fontWeight="bold">
                      {Math.floor(Math.random() * 10) + 5}
                    </Typography>
                    <Typography variant="caption">Training Programs</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AthleteProfileView;
