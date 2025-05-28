import React, { useState } from 'react'
import { supabase } from '../supabase'
import { 
  Paper, TextField, Button, MenuItem, FormControl, 
  InputLabel, Select, RadioGroup, FormControlLabel, Radio,
  Typography, Box, Alert 
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'

const leaveTypes = [
  { value: 'annual', label: 'Annual Leave' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'personal', label: 'Personal Leave' },
  { value: 'emergency', label: 'Emergency Leave' }
]

export default function LeaveForm({ userId, onSuccess }) {
  const [formData, setFormData] = useState({
    leave_type: 'annual',
    start_date: null,
    end_date: null,
    duration: 'full_day',
    reason: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase
      .from('leave_requests')
      .insert([{
        employee_id: userId,
        ...formData,
        start_date: formData.start_date?.toISOString().split('T')[0],
        end_date: formData.end_date?.toISOString().split('T')[0]
      }])

    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage('Leave request submitted successfully!')
      setFormData({
        leave_type: 'annual',
        start_date: null,
        end_date: null,
        duration: 'full_day',
        reason: ''
      })
      setTimeout(() => onSuccess(), 1500)
    }
    setLoading(false)
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Apply for Leave</Typography>
      
      {message && (
        <Alert severity={message.includes('Error') ? 'error' : 'success'} sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <form onSubmit={handleSubmit}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Leave Type</InputLabel>
            <Select
              value={formData.leave_type}
              onChange={(e) => setFormData({...formData, leave_type: e.target.value})}
            >
              {leaveTypes.map(type => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 2, my: 2 }}>
            <DatePicker
              label="Start Date"
              value={formData.start_date}
              onChange={(date) => setFormData({...formData, start_date: date})}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
            <DatePicker
              label="End Date"
              value={formData.end_date}
              onChange={(date) => setFormData({...formData, end_date: date})}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </Box>

          <FormControl component="fieldset" margin="normal">
            <Typography variant="subtitle1">Duration</Typography>
            <RadioGroup
              value={formData.duration}
              onChange={(e) => setFormData({...formData, duration: e.target.value})}
            >
              <FormControlLabel value="full_day" control={<Radio />} label="Full Day" />
              <FormControlLabel value="half_day_morning" control={<Radio />} label="Half Day (Morning)" />
              <FormControlLabel value="half_day_afternoon" control={<Radio />} label="Half Day (Afternoon)" />
            </RadioGroup>
          </FormControl>

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason"
            value={formData.reason}
            onChange={(e) => setFormData({...formData, reason: e.target.value})}
            margin="normal"
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 3 }}
            disabled={loading || !formData.start_date || !formData.end_date}
          >
            {loading ? 'Submitting...' : 'Submit Leave Request'}
          </Button>
        </form>
      </LocalizationProvider>
    </Paper>
  )
}