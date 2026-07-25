import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Tab, 
  Tabs, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Chip, 
  Button, 
  IconButton, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Warning,
  Error,
  CheckCircle,
  Visibility,
  Edit,
  Delete,
  Add,
  FilterList,
  Refresh,
  Download,
  Security,
  Analytics,
  VideoLibrary,
  Person,
  Schedule,
  Flag,
  ExpandMore,
  Settings,
  NotificationImportant,
  TrendingUp,
  Assessment
} from '@mui/icons-material';

import { Athlete, AssessmentTest } from '../models';
import cheatDetectionService, { CheatDetectionResult } from '../services/cheatDetectionService';
import videoAnalysisEngine, { MovementAnalysisResult } from '../services/videoAnalysisEngine';

interface IntegrityFlag {
  id: string;
  assessmentId: string;
  athleteId: string;
  athleteName: string;
  testType: string;
  flagType: 'video_editing' | 'incorrect_exercise' | 'assisted_movement' | 'environmental' | 'technical';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  confidence: number;
  evidence: string[];
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewDate?: Date;
  reviewNotes?: string;
  detectionDate: Date;
  autoResolved: boolean;
}

interface IntegrityStats {
  totalAssessments: number;
  flaggedAssessments: number;
  flagRate: number;
  pendingReview: number;
  approved: number;
  rejected: number;
  autoResolved: number;
  byType: { [key: string]: number };
  bySeverity: { [key: string]: number };
  trendData: Array<{ date: string; flags: number; assessments: number }>;
}

interface DetectionRule {
  id: string;
  name: string;
  type: 'integrity' | 'performance' | 'quality';
  category: string;
  enabled: boolean;
  sensitivity: 'low' | 'medium' | 'high';
  thresholds: { [key: string]: number };
  description: string;
  autoResolve: boolean;
  createdDate: Date;
  lastModified: Date;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`integrity-tabpanel-${index}`}
      aria-labelledby={`integrity-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AssessmentIntegrityDashboard: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [integrityFlags, setIntegrityFlags] = useState<IntegrityFlag[]>([]);
  const [stats, setStats] = useState<IntegrityStats | null>(null);
  const [detectionRules, setDetectionRules] = useState<DetectionRule[]>([]);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });
  
  // Dialog states
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<IntegrityFlag | null>(null);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<DetectionRule | null>(null);
  
  // Form states
  const [reviewDecision, setReviewDecision] = useState<'approved' | 'rejected'>('approved');
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadIntegrityFlags(),
        loadStats(),
        loadDetectionRules()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadIntegrityFlags = async () => {
    // Simulate loading integrity flags from API
    const mockFlags: IntegrityFlag[] = [
      {
        id: '1',
        assessmentId: 'assessment-1',
        athleteId: 'athlete-1',
        athleteName: 'John Smith',
        testType: 'push-up',
        flagType: 'video_editing',
        severity: 'high',
        description: 'Potential video editing detected - frame inconsistencies',
        confidence: 0.85,
        evidence: ['Frame rate inconsistencies', 'Timestamp gaps', 'Quality variations'],
        status: 'pending',
        detectionDate: new Date('2024-01-15T10:30:00'),
        autoResolved: false
      },
      {
        id: '2',
        assessmentId: 'assessment-2',
        athleteId: 'athlete-2',
        athleteName: 'Sarah Johnson',
        testType: 'sprint',
        flagType: 'environmental',
        severity: 'medium',
        description: 'Poor lighting conditions affecting analysis accuracy',
        confidence: 0.75,
        evidence: ['Low light levels', 'Shadows present', 'Inconsistent illumination'],
        status: 'reviewed',
        reviewedBy: 'Admin User',
        reviewDate: new Date('2024-01-16T14:20:00'),
        reviewNotes: 'Acceptable given outdoor conditions',
        detectionDate: new Date('2024-01-15T11:45:00'),
        autoResolved: false
      },
      {
        id: '3',
        assessmentId: 'assessment-3',
        athleteId: 'athlete-3',
        athleteName: 'Mike Chen',
        testType: 'plank',
        flagType: 'assisted_movement',
        severity: 'critical',
        description: 'Unusual movement patterns suggest external assistance',
        confidence: 0.92,
        evidence: ['Inconsistent movement velocity', 'Unnatural stability', 'Support visible in frame'],
        status: 'pending',
        detectionDate: new Date('2024-01-16T09:15:00'),
        autoResolved: false
      }
    ];

    setIntegrityFlags(mockFlags);
  };

  const loadStats = async () => {
    // Simulate loading statistics
    const mockStats: IntegrityStats = {
      totalAssessments: 1250,
      flaggedAssessments: 89,
      flagRate: 7.1,
      pendingReview: 23,
      approved: 45,
      rejected: 21,
      autoResolved: 15,
      byType: {
        'video_editing': 25,
        'incorrect_exercise': 18,
        'assisted_movement': 15,
        'environmental': 20,
        'technical': 11
      },
      bySeverity: {
        'critical': 12,
        'high': 28,
        'medium': 35,
        'low': 14
      },
      trendData: [
        { date: '2024-01-10', flags: 8, assessments: 125 },
        { date: '2024-01-11', flags: 12, assessments: 143 },
        { date: '2024-01-12', flags: 6, assessments: 98 },
        { date: '2024-01-13', flags: 15, assessments: 167 },
        { date: '2024-01-14', flags: 9, assessments: 132 },
        { date: '2024-01-15', flags: 18, assessments: 189 },
        { date: '2024-01-16', flags: 21, assessments: 201 }
      ]
    };

    setStats(mockStats);
  };

  const loadDetectionRules = async () => {
    // Simulate loading detection rules
    const mockRules: DetectionRule[] = [
      {
        id: '1',
        name: 'Video Quality Threshold',
        type: 'quality',
        category: 'technical',
        enabled: true,
        sensitivity: 'medium',
        thresholds: { lightingScore: 0.4, stabilityScore: 0.6 },
        description: 'Flags videos with poor lighting or camera stability',
        autoResolve: false,
        createdDate: new Date('2024-01-01'),
        lastModified: new Date('2024-01-10')
      },
      {
        id: '2',
        name: 'Exercise Recognition Confidence',
        type: 'integrity',
        category: 'recognition',
        enabled: true,
        sensitivity: 'high',
        thresholds: { confidenceScore: 0.7 },
        description: 'Flags assessments with low exercise recognition confidence',
        autoResolve: false,
        createdDate: new Date('2024-01-01'),
        lastModified: new Date('2024-01-05')
      },
      {
        id: '3',
        name: 'Movement Anomaly Detection',
        type: 'integrity',
        category: 'movement',
        enabled: true,
        sensitivity: 'medium',
        thresholds: { anomalyScore: 0.8, consistencyScore: 0.5 },
        description: 'Detects unusual movement patterns that may indicate assistance',
        autoResolve: false,
        createdDate: new Date('2024-01-01'),
        lastModified: new Date('2024-01-12')
      }
    ];

    setDetectionRules(mockRules);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleReviewFlag = (flag: IntegrityFlag) => {
    setSelectedFlag(flag);
    setReviewDecision('approved');
    setReviewNotes('');
    setReviewDialogOpen(true);
  };

  const submitReview = async () => {
    if (!selectedFlag) return;

    try {
      // Simulate API call to submit review
      const updatedFlag: IntegrityFlag = {
        ...selectedFlag,
        status: 'reviewed',
        reviewedBy: 'Current Admin', // Would come from auth context
        reviewDate: new Date(),
        reviewNotes
      };

      // Update local state
      setIntegrityFlags(prev =>
        prev.map(flag => flag.id === selectedFlag.id ? updatedFlag : flag)
      );

      setReviewDialogOpen(false);
      setSelectedFlag(null);

      // Refresh stats
      loadStats();

    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  const handleEditRule = (rule: DetectionRule) => {
    setSelectedRule(rule);
    setRuleDialogOpen(true);
  };

  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      // Simulate API call
      setDetectionRules(prev =>
        prev.map(rule =>
          rule.id === ruleId ? { ...rule, enabled } : rule
        )
      );
    } catch (error) {
      console.error('Error updating rule:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'reviewed': return 'info';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const filteredFlags = integrityFlags.filter(flag => {
    if (statusFilter !== 'all' && flag.status !== statusFilter) return false;
    if (severityFilter !== 'all' && flag.severity !== severityFilter) return false;
    if (typeFilter !== 'all' && flag.flagType !== typeFilter) return false;
    return true;
  });

  const renderOverviewTab = () => (
    <Grid container spacing={3}>
      {/* Summary Cards */}
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={1}>
              <Assessment color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Total Assessments</Typography>
            </Box>
            <Typography variant="h3" color="primary">
              {stats?.totalAssessments.toLocaleString() || 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Last 30 days
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={1}>
              <Flag color="warning" sx={{ mr: 1 }} />
              <Typography variant="h6">Flagged</Typography>
            </Box>
            <Typography variant="h3" color="warning.main">
              {stats?.flaggedAssessments || 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {stats?.flagRate.toFixed(1)}% flag rate
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={1}>
              <NotificationImportant color="error" sx={{ mr: 1 }} />
              <Typography variant="h6">Pending Review</Typography>
            </Box>
            <Typography variant="h3" color="error.main">
              {stats?.pendingReview || 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Requires attention
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={1}>
              <CheckCircle color="success" sx={{ mr: 1 }} />
              <Typography variant="h6">Resolved</Typography>
            </Box>
            <Typography variant="h3" color="success.main">
              {(stats?.approved || 0) + (stats?.rejected || 0)}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Reviewed & processed
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Flag Distribution Charts */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Flags by Type
            </Typography>
            {stats?.byType && Object.entries(stats.byType).map(([type, count]) => (
              <Box key={type} mb={1}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                    {type.replace('_', ' ')}
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {count}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(count / (stats?.flaggedAssessments || 1)) * 100}
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </Box>
            ))}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Flags by Severity
            </Typography>
            {stats?.bySeverity && Object.entries(stats.bySeverity).map(([severity, count]) => (
              <Box key={severity} mb={1}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Chip 
                    label={severity} 
                    color={getSeverityColor(severity) as any}
                    size="small"
                  />
                  <Typography variant="body2" fontWeight="bold">
                    {count}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(count / (stats?.flaggedAssessments || 1)) * 100}
                  sx={{ height: 6, borderRadius: 3 }}
                  color={getSeverityColor(severity) as any}
                />
              </Box>
            ))}
          </CardContent>
        </Card>
      </Grid>

      {/* Recent Activity */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Integrity Flags
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Athlete</TableCell>
                    <TableCell>Test</TableCell>
                    <TableCell>Flag Type</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Detection Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {integrityFlags.slice(0, 5).map((flag) => (
                    <TableRow key={flag.id}>
                      <TableCell>{flag.athleteName}</TableCell>
                      <TableCell sx={{ textTransform: 'capitalize' }}>
                        {flag.testType.replace('-', ' ')}
                      </TableCell>
                      <TableCell sx={{ textTransform: 'capitalize' }}>
                        {flag.flagType.replace('_', ' ')}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={flag.severity} 
                          color={getSeverityColor(flag.severity) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={flag.status} 
                          color={getStatusColor(flag.status) as any}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {flag.detectionDate.toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderFlaggedAssessmentsTab = () => (
    <Box>
      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filter Flags
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="reviewed">Reviewed</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Severity</InputLabel>
                <Select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  label="Severity"
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  label="Type"
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="video_editing">Video Editing</MenuItem>
                  <MenuItem value="incorrect_exercise">Incorrect Exercise</MenuItem>
                  <MenuItem value="assisted_movement">Assisted Movement</MenuItem>
                  <MenuItem value="environmental">Environmental</MenuItem>
                  <MenuItem value="technical">Technical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={loadDashboardData}
                fullWidth
              >
                Refresh
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button
                variant="outlined"
                startIcon={<Download />}
                fullWidth
              >
                Export
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Flagged Assessments Table */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Flagged Assessments ({filteredFlags.length})
            </Typography>
            <Badge badgeContent={stats?.pendingReview || 0} color="error">
              <Flag />
            </Badge>
          </Box>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Athlete</TableCell>
                  <TableCell>Assessment</TableCell>
                  <TableCell>Flag Type</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Confidence</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Detection Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredFlags.map((flag) => (
                  <TableRow key={flag.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Person sx={{ mr: 1, color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {flag.athleteName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            ID: {flag.athleteId}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                          {flag.testType.replace('-', ' ')}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {flag.assessmentId}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={flag.flagType.replace('_', ' ')} 
                        variant="outlined"
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={flag.severity} 
                        color={getSeverityColor(flag.severity) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {(flag.confidence * 100).toFixed(1)}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={flag.status} 
                        color={getStatusColor(flag.status) as any}
                        size="small"
                        variant={flag.status === 'pending' ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {flag.detectionDate.toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {flag.detectionDate.toLocaleTimeString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="View Details">
                          <IconButton size="small">
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        {flag.status === 'pending' && (
                          <Tooltip title="Review">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleReviewFlag(flag)}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );

  const renderDetectionRulesTab = () => (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Detection Rules</Typography>
            <Button variant="contained" startIcon={<Add />}>
              Add New Rule
            </Button>
          </Box>
          
          {detectionRules.map((rule) => (
            <Accordion key={rule.id}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" width="100%">
                  <Box flex={1}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {rule.name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {rule.description}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Chip 
                      label={rule.type} 
                      size="small" 
                      color={rule.type === 'integrity' ? 'error' : 'primary'}
                    />
                    <Chip 
                      label={rule.sensitivity} 
                      size="small" 
                      variant="outlined"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={rule.enabled}
                          onChange={(e) => handleToggleRule(rule.id, e.target.checked)}
                          size="small"
                        />
                      }
                      label=""
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Configuration
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <Settings fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Category"
                          secondary={rule.category}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <TrendingUp fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Sensitivity"
                          secondary={`${rule.sensitivity} (${rule.sensitivity === 'high' ? 'More flags' : rule.sensitivity === 'low' ? 'Fewer flags' : 'Balanced'})`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <Security fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Auto Resolve"
                          secondary={rule.autoResolve ? 'Yes' : 'No'}
                        />
                      </ListItem>
                    </List>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Thresholds
                    </Typography>
                    <List dense>
                      {Object.entries(rule.thresholds).map(([key, value]) => (
                        <ListItem key={key}>
                          <ListItemText
                            primary={key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                            secondary={`${value} ${typeof value === 'number' && value <= 1 ? '(0-1 scale)' : ''}`}
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                  <Grid item xs={12}>
                    <Box display="flex" gap={1} justifyContent="flex-end">
                      <Button 
                        size="small" 
                        startIcon={<Edit />}
                        onClick={() => handleEditRule(rule)}
                      >
                        Edit Rule
                      </Button>
                      <Button size="small" color="error" startIcon={<Delete />}>
                        Delete
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}
        </CardContent>
      </Card>
    </Box>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <Box textAlign="center">
          <LinearProgress sx={{ width: 200, mb: 2 }} />
          <Typography>Loading integrity dashboard...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Assessment Integrity Dashboard
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        Monitor and manage assessment integrity, review flagged submissions, and configure detection rules.
      </Alert>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab 
            label="Overview" 
            icon={<Analytics />}
            iconPosition="start"
          />
          <Tab 
            label={
              <Badge badgeContent={stats?.pendingReview || 0} color="error">
                Flagged Assessments
              </Badge>
            }
            icon={<Flag />}
            iconPosition="start"
          />
          <Tab 
            label="Detection Rules" 
            icon={<Settings />}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      <TabPanel value={currentTab} index={0}>
        {renderOverviewTab()}
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        {renderFlaggedAssessmentsTab()}
      </TabPanel>

      <TabPanel value={currentTab} index={2}>
        {renderDetectionRulesTab()}
      </TabPanel>

      {/* Review Dialog */}
      <Dialog 
        open={reviewDialogOpen} 
        onClose={() => setReviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Review Integrity Flag
        </DialogTitle>
        <DialogContent>
          {selectedFlag && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Athlete
                  </Typography>
                  <Typography variant="body1">
                    {selectedFlag.athleteName}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Assessment
                  </Typography>
                  <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                    {selectedFlag.testType.replace('-', ' ')}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Description
                  </Typography>
                  <Typography variant="body1">
                    {selectedFlag.description}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Evidence
                  </Typography>
                  <List dense>
                    {selectedFlag.evidence.map((evidence, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={evidence} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              </Grid>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Decision</InputLabel>
                <Select
                  value={reviewDecision}
                  onChange={(e) => setReviewDecision(e.target.value as 'approved' | 'rejected')}
                  label="Decision"
                >
                  <MenuItem value="approved">Approve Assessment</MenuItem>
                  <MenuItem value="rejected">Reject Assessment</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Review Notes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add notes about your decision..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={submitReview} 
            variant="contained"
            color={reviewDecision === 'approved' ? 'success' : 'error'}
          >
            Submit Review
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssessmentIntegrityDashboard;
