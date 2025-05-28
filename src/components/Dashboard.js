import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { 
  AppBar, Toolbar, Typography, Button, Container, 
  Grid, Card, CardContent, Tabs, Tab, Box 
} from '@mui/material'
import LeaveForm from './LeaveForm'
import LeaveList from './LeaveList'
import Calendar from './Calendar'

export default function Dashboard({ session }) {
  const [profile, setProfile] = useState(null)
  const [currentTab, setCurrentTab] = useState(0)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (data) setProfile(data)
    else {
      // Create profile if doesn't exist
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([{
          id: session.user.id,
          full_name: session.user.email,
          department: 'General',
          role: 'employee'
        }])
      if (!insertError) fetchProfile()
    }
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
            Leave Tracker - Welcome {profile?.full_name}
          </Typography>
          <Button color="inherit" onClick={handleSignOut}>
            Sign Out
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {/* Quick Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h4">{profile?.annual_leave_balance || 0}</Typography>
                <Typography color="textSecondary">Annual Leave Days</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h4">{profile?.sick_leave_balance || 0}</Typography>
                <Typography color="textSecondary">Sick Leave Days</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Main Content Tabs */}
        <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
          <Tab label="Apply Leave" />
          <Tab label="My Requests" />
          <Tab label="Calendar" />
        </Tabs>

        <TabPanel value={currentTab} index={0}>
          <LeaveForm userId={session.user.id} onSuccess={() => setCurrentTab(1)} />
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <LeaveList userId={session.user.id} />
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          <Calendar userId={session.user.id} />
        </TabPanel>
      </Container>
    </>
  )
}