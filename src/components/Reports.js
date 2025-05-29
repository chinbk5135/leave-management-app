import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import {
  Paper, Grid, Card, CardContent, Typography, Box,
  FormControl, InputLabel, Select, MenuItem, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip
} from '@mui/material'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

export default function Reports() {
  const [reportData, setReportData] = useState({
    leaveByType: [],
    leaveByDepartment: [],
    leaveByStatus: [],
    recentRequests: [],
    topUsers: []
  })
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReportData()
  }, [selectedPeriod])

  const getDateRange = () => {
    const now = new Date()
    let startDate = new Date()
    
    switch (selectedPeriod) {
      case 'thisWeek':
        startDate.setDate(now.getDate() - 7)
        break
      case 'thisMonth':
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'thisQuarter':
        startDate.setMonth(now.getMonth() - 3)
        break
      case 'thisYear':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setMonth(now.getMonth() - 1)
    }
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0]
    }
  }

  const fetchReportData = async () => {
    setLoading(true)
    const { startDate, endDate } = getDateRange()

    try {
      // Fetch leave requests with profiles
      const { data: requests, error } = await supabase
        .from('leave_requests')
        .select(`
          *,
          profiles!leave_requests_employee_id_fkey (
            full_name,
            department
          )
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Process data for charts
      const leaveByType = processLeaveByType(requests)
      const leaveByDepartment = processLeaveByDepartment(requests)
      const leaveByStatus = processLeaveByStatus(requests)
      const recentRequests = requests.slice(0, 10)
      const topUsers = processTopUsers(requests)

      setReportData({
        leaveByType,
        leaveByDepartment,
        leaveByStatus,
        recentRequests,
        topUsers
      })
    } catch (error) {
      console.error('Error fetching report data:', error)
    }
    setLoading(false)
  }

  const processLeaveByType = (requests) => {
    const typeCount = {}
    requests.forEach(req => {
      const type = req.leave_type || 'unknown'
      typeCount[type] = (typeCount[type] || 0) + 1
    })
    
    return Object.entries(typeCount).map(([type, count]) => ({
      name: type.replace('_', ' ').toUpperCase(),
      value: count
    }))
  }

  const processLeaveByDepartment = (requests) => {
    const deptCount = {}
    requests.forEach(req => {
      const dept = req.profiles?.department || 'Unknown'
      deptCount[dept] = (deptCount[dept] || 0) + 1
    })
    
    return Object.entries(deptCount).map(([dept, count]) => ({
      department: dept,
      requests: count
    }))
  }

  const processLeaveByStatus = (requests) => {
    const statusCount = {}
    requests.forEach(req => {
      const status = req.status || 'unknown'
      statusCount[status] = (statusCount[status] || 0) + 1
    })
    
    return Object.entries(statusCount).map(([status, count]) => ({
      name: status.toUpperCase(),
      value: count
    }))
  }

  const processTopUsers = (requests) => {
    const userCount = {}
    requests.forEach(req => {
      const user = req.profiles?.full_name || 'Unknown'
      userCount[user] = (userCount[user] || 0) + 1
    })
    
    return Object.entries(userCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, requests: count }))
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success'
      case 'rejected': return 'error'
      case 'pending': return 'warning'
      default: return 'default'
    }
  }

  if (loading) {
    return <Typography>Loading reports...</Typography>
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Leave Reports & Analytics</Typography>
        
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Time Period</InputLabel>
          <Select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            label="Time Period"
          >
            <MenuItem value="thisWeek">Last 7 Days</MenuItem>
            <MenuItem value="thisMonth">Last 30 Days</MenuItem>
            <MenuItem value="thisQuarter">Last 3 Months</MenuItem>
            <MenuItem value="thisYear">Last Year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="primary">
                {reportData.recentRequests.length}
              </Typography>
              <Typography color="textSecondary">Total Requests</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="success.main">
                {reportData.leaveByStatus.find(s => s.name === 'APPROVED')?.value || 0}
              </Typography>
              <Typography color="textSecondary">Approved</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="warning.main">
                {reportData.leaveByStatus.find(s => s.name === 'PENDING')?.value || 0}
              </Typography>
              <Typography color="textSecondary">Pending</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="error.main">
                {reportData.leaveByStatus.find(s => s.name === 'REJECTED')?.value || 0}
              </Typography>
              <Typography color="textSecondary">Rejected</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Charts */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Leave Requests by Type</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reportData.leaveByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {reportData.leaveByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Requests by Department</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.leaveByDepartment}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="requests" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Recent Requests Table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Recent Leave Requests</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Leave Type</TableCell>
                    <TableCell>Dates</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Submitted</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData.recentRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{request.profiles?.full_name || 'Unknown'}</TableCell>
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
                        <Chip 
                          label={request.status} 
                          color={getStatusColor(request.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(request.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Top Users */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Most Active Users</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell align="right">Requests</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData.topUsers.map((user, index) => (
                    <TableRow key={index}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell align="right">{user.requests}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}