import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import {
  Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Dialog, DialogTitle, DialogContent, TextField, MenuItem,
  IconButton, Chip, Box, Typography, Alert
} from '@mui/material'
import { Add, Edit, Delete } from '@mui/icons-material'

const roles = [
  { value: 'employee', label: 'Employee' },
  { value: 'manager', label: 'Manager' },
  { value: 'hr', label: 'HR' }
]

export default function UserManagement({ onUserChange }) {
  const [users, setUsers] = useState([])
  const [open, setOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    department: '',
    role: 'employee',
    annual_leave_balance: 25,
    sick_leave_balance: 10
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) setUsers(data)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (editingUser) {
        // Update existing user
        const { error } = await supabase
          .from('profiles')
          .update(formData)
          .eq('id', editingUser.id)

        if (error) throw error
        setMessage('User updated successfully!')
      } else {
        // Create new user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: formData.email,
          password: 'TempPass123!', // You might want to generate a random password
          email_confirm: true
        })

        if (authError) throw authError

        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: authData.user.id,
            ...formData
          }])

        if (profileError) throw profileError
        setMessage('User created successfully! Temporary password: TempPass123!')
      }

      fetchUsers()
      onUserChange()
      setTimeout(() => {
        setOpen(false)
        resetForm()
      }, 2000)
    } catch (error) {
      setMessage(`Error: ${error.message}`)
    }
    setLoading(false)
  }

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      department: '',
      role: 'employee',
      annual_leave_balance: 25,
      sick_leave_balance: 10
    })
    setEditingUser(null)
    setMessage('')
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setFormData({
      full_name: user.full_name || '',
      email: user.email || '',
      department: user.department || '',
      role: user.role || 'employee',
      annual_leave_balance: user.annual_leave_balance || 25,
      sick_leave_balance: user.sick_leave_balance || 10
    })
    setOpen(true)
  }

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return

    const { error } = await supabase.auth.admin.deleteUser(userId)
    if (!error) {
      fetchUsers()
      onUserChange()
    }
  }

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">User Management</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpen(true)}
        >
          Add User
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Annual Leave</TableCell>
              <TableCell>Sick Leave</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.full_name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.department}</TableCell>
                <TableCell>
                  <Chip 
                    label={user.role} 
                    color={user.role === 'admin' ? 'primary' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{user.annual_leave_balance}</TableCell>
                <TableCell>{user.sick_leave_balance}</TableCell>
                <TableCell>
                  {user.role !== 'admin' && (
                    <>
                      <IconButton onClick={() => handleEdit(user)}>
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(user.id)}>
                        <Delete />
                      </IconButton>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* User Form Dialog */}
      <Dialog open={open} onClose={() => { setOpen(false); resetForm(); }} maxWidth="sm" fullWidth>
        <DialogTitle>{editingUser ? 'Edit User' : 'Create New User'}</DialogTitle>
        <DialogContent>
          {message && (
            <Alert severity={message.includes('Error') ? 'error' : 'success'} sx={{ mb: 2 }}>
              {message}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Full Name"
              value={formData.full_name}
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              margin="normal"
              required
              disabled={editingUser} // Can't change email for existing users
            />

            <TextField
              fullWidth
              label="Department"
              value={formData.department}
              onChange={(e) => setFormData({...formData, department: e.target.value})}
              margin="normal"
            />

            <TextField
              select
              fullWidth
              label="Role"
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              margin="normal"
            >
              {roles.map((role) => (
                <MenuItem key={role.value} value={role.value}>
                  {role.label}
                </MenuItem>
              ))}
            </TextField>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Annual Leave Balance"
                type="number"
                value={formData.annual_leave_balance}
                onChange={(e) => setFormData({...formData, annual_leave_balance: parseInt(e.target.value)})}
                margin="normal"
                fullWidth
              />

              <TextField
                label="Sick Leave Balance"
                type="number"
                value={formData.sick_leave_balance}
                onChange={(e) => setFormData({...formData, sick_leave_balance: parseInt(e.target.value)})}
                margin="normal"
                fullWidth
              />
            </Box>

            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button onClick={() => { setOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? 'Saving...' : (editingUser ? 'Update' : 'Create')}
              </Button>
            </Box>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}