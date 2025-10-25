import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TextField,
  Select,
  MenuItem,
  ListSubheader,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Card,
  CardMedia,
  CardContent,
  IconButton,
  Tooltip,
  Chip,
  Button,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useGetExamsQuery } from 'src/slices/examApiSlice';
import { useGetCheatingLogsQuery } from 'src/slices/cheatingLogApiSlice';
import CloseIcon from '@mui/icons-material/Close';
import ImageIcon from '@mui/icons-material/Image';
import WarningIcon from '@mui/icons-material/Warning';

export default function CheatingTable() {
  const [filter, setFilter] = useState('');
  const [selectedExam, setSelectedExam] = useState(null);
  const [cheatingLogs, setCheatingLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch exams and logs
  const { data: examsData, isLoading: examsLoading, error: examsError, refetch: refetchExams } = useGetExamsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  
  const {
    data: cheatingLogsData,
    isLoading: logsLoading,
    error: logsError,
    refetch: refetchLogs
  } = useGetCheatingLogsQuery(selectedExam?._id, {
    skip: !selectedExam,
    refetchOnMountOrArgChange: true
  });

  // Set initial exam when data loads
  useEffect(() => {
    if (examsData?.length > 0 && !selectedExam) {
      try {
        const firstExam = {
          ...examsData[0],
          _id: examsData[0]._id?.toString() || '',
          examId: examsData[0].examId?.toString() || '',
          examName: examsData[0].examName?.toString() || 'Untitled Exam'
        };
        console.log('Setting initial exam:', firstExam);
        setSelectedExam(firstExam);
      } catch (error) {
        console.error('Error setting initial exam:', error);
      }
    }
  }, [examsData, selectedExam]);

  useEffect(() => {
    try {
      if (cheatingLogsData) {
        console.log('Received cheating logs data:', cheatingLogsData);
        let logs = [];
        
        if (Array.isArray(cheatingLogsData)) {
          logs = cheatingLogsData;
        } else if (typeof cheatingLogsData === 'object') {
          logs = cheatingLogsData.logs || cheatingLogsData.data || [];
        }

        // Ensure logs is always an array
        if (!Array.isArray(logs)) {
          console.warn('Invalid logs data format, defaulting to empty array');
          logs = [];
        }

        // Validate log entries
        logs = logs.filter(log => {
          try {
            if (!log || typeof log !== 'object') {
              console.warn('Invalid log entry:', log);
              return false;
            }
            return true;
          } catch (error) {
            console.error('Error validating log entry:', error);
            return false;
          }
        });
        
        console.log('Processed logs:', logs);
        
        // Log sample entry for debugging
        if (logs.length > 0) {
          console.log('Sample log entry:', {
            id: logs[0]._id,
            examId: logs[0].examId,
            username: logs[0].username,
            violations: {
              noFace: logs[0].noFaceCount,
              multipleFace: logs[0].multipleFaceCount,
              cellPhone: logs[0].cellPhoneCount,
              prohibited: logs[0].prohibitedObjectCount
            }
          });
        }
        
        setCheatingLogs(logs);
      }
    } catch (error) {
      console.error('Error processing cheating logs:', error);
      setCheatingLogs([]);
    }
  }, [cheatingLogsData]);

  // Add automatic refresh every 30 seconds
  useEffect(() => {
    if (selectedExam) {
      const intervalId = setInterval(() => {
        refetchLogs();
      }, 30000);
      return () => clearInterval(intervalId);
    }
  }, [selectedExam, refetchLogs]);

  const filteredUsers = React.useMemo(() => {
    try {
      return cheatingLogs.filter((log) => {
        if (!log) return false;
        const searchTerm = filter.toLowerCase();
        const username = log.username?.toString().toLowerCase() || '';
        const email = log.email?.toString().toLowerCase() || '';
        return username.includes(searchTerm) || email.includes(searchTerm);
      });
    } catch (error) {
      console.error('Error filtering users:', error);
      return [];
    }
  }, [cheatingLogs, filter]);

  const handleViewScreenshots = (log) => {
    try {
      if (!log) {
        console.warn('Attempted to view screenshots for invalid log');
        return;
      }
      setSelectedLog(log);
      setOpenDialog(true);
    } catch (error) {
      console.error('Error viewing screenshots:', error);
    }
  };

  const handleCloseDialog = () => {
    try {
      setOpenDialog(false);
      setSelectedLog(null);
    } catch (error) {
      console.error('Error closing dialog:', error);
    }
  };

  const getViolationColor = (count) => {
    if (count > 5) return 'error';
    if (count > 2) return 'warning';
    return 'success';
  };

  const getViolationIcon = (count) => {
    if (count > 5) return <WarningIcon color="error" />;
    if (count > 2) return <WarningIcon color="warning" />;
    return null;
  };

  if (examsLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (examsError) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">
          Error loading exams: {examsError.data?.message || examsError.error || 'Unknown error'}
        </Typography>
      </Box>
    );
  }

  if (!examsData || examsData.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>No exams available. Please create an exam first.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {selectedExam && (
        <Typography variant="h6" gutterBottom>
          Showing logs for: {selectedExam.examName} {selectedExam._id && `(ID: ${selectedExam._id})`}
        </Typography>
      )}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <Select
              value={selectedExam?._id || ''}
              onChange={(e) => {
                if (e.target.value) {
                  const selected = examsData?.find(exam => exam._id === e.target.value);
                  if (selected) {
                    const newSelected = {
                      ...selected,
                      _id: selected._id?.toString(),
                      examId: selected.examId?.toString(),
                      examName: selected.examName?.toString()
                    };
                    setSelectedExam(newSelected);
                  }
                }
              }}
              displayEmpty
              fullWidth
            >
              <MenuItem disabled value="">
                <em>Select a test to view logs</em>
              </MenuItem>
              {examsData?.map((exam) => (
                <MenuItem 
                  key={exam._id} 
                  value={exam._id}
                >
                  {exam.examName}
                </MenuItem>
              ))}
            </Select>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Filter by Name or Email"
              variant="outlined"
              fullWidth
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              startIcon={<RefreshIcon />}
              disabled={isRefreshing || !selectedExam}
              onClick={async () => {
                setIsRefreshing(true);
                try {
                  if (selectedExam) {
                    await refetchLogs();
                    console.log('Refreshed logs for exam:', selectedExam.examName);
                  }
                } catch (error) {
                  console.error('Error refreshing data:', error);
                } finally {
                  setIsRefreshing(false);
                }
              }}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh Logs'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {logsLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
          <CircularProgress />
        </Box>
      ) : logsError ? (
        <Box sx={{ p: 2 }}>
          <Typography color="error">
            Error loading logs: {logsError.data?.message || logsError.error || 'Unknown error'}
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Sno</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>No Face Count</TableCell>
                <TableCell>Multiple Face Count</TableCell>
                <TableCell>Cell Phone Count</TableCell>
                <TableCell>Prohibited Object Count</TableCell>
                <TableCell>Screenshots</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logsLoading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <CircularProgress size={24} /> Loading logs...
                  </TableCell>
                </TableRow>
              ) : logsError ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" style={{ color: 'red' }}>
                    Error loading logs: {logsError.data?.message || logsError.message || 'Unknown error'}
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No cheating logs found for this exam
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((log, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{log.username}</TableCell>
                    <TableCell>{log.email}</TableCell>
                    <TableCell>
                      <Chip
                        icon={getViolationIcon(log.noFaceCount)}
                        label={log.noFaceCount}
                        color={getViolationColor(log.noFaceCount)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getViolationIcon(log.multipleFaceCount)}
                        label={log.multipleFaceCount}
                        color={getViolationColor(log.multipleFaceCount)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getViolationIcon(log.cellPhoneCount)}
                        label={log.cellPhoneCount}
                        color={getViolationColor(log.cellPhoneCount)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getViolationIcon(log.prohibitedObjectCount)}
                        label={log.prohibitedObjectCount}
                        color={getViolationColor(log.prohibitedObjectCount)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Screenshots">
                        <IconButton
                          onClick={() => handleViewScreenshots(log)}
                          disabled={!log.screenshots?.length}
                        >
                          <ImageIcon color={log.screenshots?.length ? 'primary' : 'disabled'} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Screenshots Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Screenshots - {selectedLog?.username}</Typography>
            <IconButton onClick={handleCloseDialog}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {selectedLog?.screenshots?.map((screenshot, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card>
                  <CardMedia
                    component="img"
                    height="200"
                    image={screenshot.url}
                    alt={`Violation - ${screenshot.type}`}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      Type: {screenshot.type}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Detected: {new Date(screenshot.detectedAt).toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
