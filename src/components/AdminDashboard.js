import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { 
  AppBar, Toolbar, Typography, Button, Container, 
  Tabs, Tab, Box, Card, CardContent, Grid
} from '@mui/material'
import UserManagement from './UserManagement'
import LeaveApprovals from './LeaveApprovals'
import Reports from './Reports'

export default function AdminDashboard({ session, profile }) {
  const [currentTab, setCurrentTab] = useState(0)
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingRequests: 0,
    activeEmployees: 0
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    // Get user count
    const { count: userCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Get pending requests count
    const { count: pendingCount } = await supabase
      .from('leave_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    setStats({
      totalUsers: userCount || 0,
      pendingRequests: pendingCount || 0,
      activeEmployees: userCount || 0
    })
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Admin Dashboard - {profile?.full_name}
          </Typography>
          <Button color="inherit" onClick={handleSignOut}>
            Sign Out
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4 }}>
        {/* Admin Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="primary">
                  {stats.totalUsers}
                </Typography>
                <Typography color="textSecondary">Total Users</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="warning.main">
                  {stats.pendingRequests}
                </Typography>
                <Typography color="textSecondary">Pending Requests</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="success.main">
                  {stats.activeEmployees}
                </Typography>
                <Typography color="textSecondary">Active Employees</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Admin Tabs */}
        <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
          <Tab label="User Management" />
          <Tab label="Leave Approvals" />
          <Tab label="Reports" />
        </Tabs>

        <TabPanel value={currentTab} index={0}>
          <UserManagement onUserChange={fetchStats} />
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <LeaveApprovals onStatusChange={fetchStats} />
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          <Reports />
        </TabPanel>
      </Container>
    </>
  )
}