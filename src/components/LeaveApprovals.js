import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import {
  Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Chip, Box, Typography, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Alert, IconButton, Tooltip
} from '@mui/material'
import { Check, Close, Visibility } from '@mui/icons-material'

export default function LeaveApprovals({ onStatusChange }) {
  const [requests, setRequests] = useState([])
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [comments, setComments] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchLeaveRequests()
  }, [])

  const fetchLeaveRequests = async () => {
    const { data, error } = await supabase
      .from('leave_requests')
      .select(`
        *,
        profiles!leave_requests_employee_id_fkey (
          full_name,
          department,
          role
        )
      `)
      .order('created_at', { ascending: false })

    if (data) setRequests(data)
  }

  const handleApprovalAction = async (requestId, status) => {
    setLoading(true)
    setMessage('')

    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase
      .from('leave_requests')
      .update({
        status,
        manager_comments: comments,
        approved_at: new Date().toISOString(),
        approved_by: user.id
      })
      .eq('id', requestId)

    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage(`Leave request ${status} successfully!`)
      fetchLeaveRequests()
      onStatusChange()
      setTimeout(() => {
        setDialogOpen(false)
        setComments('')
        setSelectedRequest(null)
      }, 1500)
    }
    setLoading(false)
  }

  const openApprovalDialog = (request, action) => {
    setSelectedRequest({ ...request, action })
    setComments('')
    setDialogOpen(true)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success'
      case 'rejected': return 'error'
      case 'pending': return 'warning'
      default: return 'default'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  const calculateDays = (startDate, endDate, duration) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
    
    if (duration.includes('half_day')) {
      return days * 0.5
    }
    return days
  }

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5">Leave Request Approvals</Typography>
        <Typography variant="body2" color="textSecondary">
          Review and approve/reject leave requests from employees
        </Typography>
      </Box>

      {message && (
        <Alert severity={message.includes('Error') ? 'error' : 'success'} sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Leave Type</TableCell>
              <TableCell>Dates</TableCell>
              <TableCell>Days</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Submitted</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>{request.profiles?.full_name}</TableCell>
                <TableCell>{request.profiles?.department}</TableCell>
                <TableCell>
                  <Chip 
                    label={request.leave_type?.replace('_', ' ')} 
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  {formatDate(request.start_date)} - {formatDate(request.end_date)}
                </TableCell>
                <TableCell>
                  {calculateDays(request.start_date, request.end_date, request.duration)}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={request.status} 
                    color={getStatusColor(request.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{formatDate(request.created_at)}</TableCell>
                <TableCell>
                  <Tooltip title="View Details">
                    <IconButton 
                      size="small"
                      onClick={() => {
                        setSelectedRequest(request)
                        setDialogOpen(true)
                      }}
                    >
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                  
                  {request.status === 'pending' && (
                    <>
                      <Tooltip title="Approve">
                        <IconButton 
                          size="small" 
                          color="success"
                          onClick={() => openApprovalDialog(request, 'approved')}
                        >
                          <Check />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Reject">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => openApprovalDialog(request, 'rejected')}
                        >
                          <Close />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
            
            {requests.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography color="textSecondary">No leave requests found</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Approval Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedRequest?.action ? 
            `${selectedRequest.action === 'approved' ? 'Approve' : 'Reject'} Leave Request` :
            'Leave Request Details'
          }
        </DialogTitle>
        
        <DialogContent>
          {selectedRequest && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedRequest.profiles?.full_name}
              </Typography>
              
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Department: {selectedRequest.profiles?.department}
              </Typography>
              
              <Typography variant="body1" sx={{ mt: 2 }}>
                <strong>Leave Type:</strong> {selectedRequest.leave_type?.replace('_', ' ')}
              </Typography>
              
              <Typography variant="body1">
                <strong>Duration:</strong> {selectedRequest.duration?.replace('_', ' ')}
              </Typography>
              
              <Typography variant="body1">
                <strong>Dates:</strong> {formatDate(selectedRequest.start_date)} - {formatDate(selectedRequest.end_date)}
              </Typography>
              
              <Typography variant="body1">
                <strong>Total Days:</strong> {calculateDays(selectedRequest.start_date, selectedRequest.end_date, selectedRequest.duration)}
              </Typography>
              
              {selectedRequest.reason && (
                <Typography variant="body1" sx={{ mt: 2 }}>
                  <strong>Reason:</strong> {selectedRequest.reason}
                </Typography>
              )}
              
              {selectedRequest.manager_comments && (
                <Typography variant="body1" sx={{ mt: 2 }}>
                  <strong>Previous Comments:</strong> {selectedRequest.manager_comments}
                </Typography>
              )}

              {selectedRequest.action && (
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Comments (Optional)"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  margin="normal"
                  placeholder="Add any comments about this decision..."
                />
              )}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            {selectedRequest?.action ? 'Cancel' : 'Close'}
          </Button>
          
          {selectedRequest?.action && (
            <Button
              variant="contained"
              color={selectedRequest.action === 'approved' ? 'success' : 'error'}
              onClick={() => handleApprovalAction(selectedRequest.id, selectedRequest.action)}
              disabled={loading}
            >
              {loading ? 'Processing...' : `${selectedRequest.action === 'approved' ? 'Approve' : 'Reject'} Request`}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  )
}