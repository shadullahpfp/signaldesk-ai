'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface UserProfile {
  id: string
  email: string
  role: 'CUSTOMER' | 'AGENT' | 'ADMIN'
  created_at: string
}

interface Ticket {
  id: string
  customer_id: string
  agent_id: string | null
  subject: string
  description: string
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  created_at: string
  updated_at: string
}

interface AIResponse {
  id: string
  ticket_id: string
  summary: string | null
  suggested_reply: string | null
  created_at: string
}

interface ActivityLog {
  id: string
  user_id: string | null
  action: string
  resource_id: string | null
  metadata_data: Record<string, any> | null
  created_at: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<UserProfile | null>(null)

  // Ticket Queue State
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [urgencyFilter, setUrgencyFilter] = useState('')
  const [offset, setOffset] = useState(0)
  const limit = 10

  // Ticket Details Side State
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null)
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [fetchingDetails, setFetchingDetails] = useState(false)

  // Creation Modal State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newSubject, setNewSubject] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [submittingTicket, setSubmittingTicket] = useState(false)

  // Platform loading states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Helper to extract cookies client-side
  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return null
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null
    return null
  }

  // Handle Logout
  const handleLogout = () => {
    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax'
    document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax'
    router.push('/login')
    router.refresh()
  }

  // Load user profile
  useEffect(() => {
    const accToken = getCookie('access_token')
    if (!accToken) {
      router.push('/login')
      return
    }
    setToken(accToken)

    const fetchProfile = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${accToken}`
          }
        })
        if (!res.ok) throw new Error('Session expired')
        const data = await res.json()
        setUser(data)
      } catch (err) {
        handleLogout()
      }
    }
    fetchProfile()
  }, [])

  // Fetch Tickets List
  const fetchTickets = useCallback(async () => {
    if (!token) return
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      if (urgencyFilter) params.append('urgency', urgencyFilter)
      if (searchQuery) params.append('q', searchQuery)
      params.append('limit', String(limit))
      params.append('offset', String(offset))

      const res = await fetch(`http://localhost:8000/api/tickets/?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!res.ok) throw new Error('Failed to load tickets')
      const data = await res.json()
      setTickets(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token, statusFilter, urgencyFilter, searchQuery, offset])

  // Trigger ticket list load
  useEffect(() => {
    if (token) {
      fetchTickets()
    }
  }, [token, fetchTickets])

  // Fetch AI responses and activity logs when a ticket is selected
  const selectTicketAndFetchData = async (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setAiResponse(null)
    setActivityLogs([])
    if (!token) return

    setFetchingDetails(true)
    try {
      // 1. Fetch AI response
      const aiRes = await fetch(`http://localhost:8000/api/tickets/${ticket.id}/ai-response`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (aiRes.ok) {
        const aiData = await aiRes.json()
        setAiResponse(aiData)
      }

      // 2. Fetch Activity logs
      const actRes = await fetch(`http://localhost:8000/api/tickets/${ticket.id}/activity`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (actRes.ok) {
        const actData = await actRes.json()
        setActivityLogs(actData)
      }
    } catch (err) {
      console.error("Error loading ticket detail assets:", err)
    } finally {
      setFetchingDetails(false)
    }
  }

  // Create ticket handler
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !newSubject || !newDescription) return
    setSubmittingTicket(true)

    try {
      const res = await fetch('http://localhost:8000/api/tickets/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subject: newSubject,
          description: newDescription
        })
      })

      if (!res.ok) throw new Error('Could not submit ticket.')
      
      setNewSubject('')
      setNewDescription('')
      setShowCreateModal(false)
      fetchTickets() // Reload list
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSubmittingTicket(false)
    }
  }

  // Update ticket details (Urgency, Status, Assignee)
  const updateTicketDetails = async (updates: { status?: string, urgency?: string, agent_id?: string | null }) => {
    if (!selectedTicket || !token) return
    try {
      const res = await fetch(`http://localhost:8000/api/tickets/${selectedTicket.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.detail || 'Could not update ticket details.')
      }

      const updated = await res.json()
      setSelectedTicket(updated)
      
      // Update in local tickets list
      setTickets(prev => prev.map(t => t.id === updated.id ? updated : t))
      
      // Refresh details and logs
      const actRes = await fetch(`http://localhost:8000/api/tickets/${updated.id}/activity`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (actRes.ok) {
        const actData = await actRes.json()
        setActivityLogs(actData)
      }
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
      {/* Top Banner Nav */}
      <header className="bg-slate-900 border-b border-white/5 px-8 py-4 flex justify-between items-center z-10">
        <div className="flex items-center space-x-3">
          <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500">
            SignalDesk AI
          </span>
          <span className="bg-white/5 text-gray-400 border border-white/10 text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold">
            Console
          </span>
        </div>

        <div className="flex items-center space-x-6">
          <div className="text-right">
            <p className="text-sm font-semibold text-white">{user?.email || 'Loading...'}</p>
            <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider mt-0.5">{user?.role || '---'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 text-gray-300 hover:text-red-400 text-sm font-medium px-4 py-2 rounded-xl transition-all duration-200"
          >
            Log Out
          </button>
        </div>
      </header>

      {/* Main Panel Content */}
      <div className="flex-grow flex flex-col p-8 overflow-hidden max-w-7xl mx-auto w-full">
        {/* Metric Cards Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 w-full">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-xl">
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">Open Queue</h3>
            <p className="text-4xl font-extrabold text-white mt-2">{tickets.filter(t => t.status !== 'CLOSED' && t.status !== 'RESOLVED').length}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-xl">
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">Critical urgency</h3>
            <p className="text-4xl font-extrabold text-red-400 mt-2">{tickets.filter(t => t.urgency === 'CRITICAL').length}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-xl">
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Tickets</h3>
            <p className="text-4xl font-extrabold text-indigo-400 mt-2">{tickets.length}</p>
          </div>
        </div>

        {/* Action Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 w-full">
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            {/* Search Input */}
            <input
              type="text"
              placeholder="Search subject or desc..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setOffset(0); }}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full sm:w-60"
            />
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setOffset(0); }}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              style={{ colorScheme: 'dark' }}
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
            {/* Urgency Filter */}
            <select
              value={urgencyFilter}
              onChange={(e) => { setUrgencyFilter(e.target.value); setOffset(0); }}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              style={{ colorScheme: 'dark' }}
            >
              <option value="">All Urgencies</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          {user?.role === 'CUSTOMER' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/25 transition-all duration-200 w-full md:w-auto"
            >
              New Support Ticket
            </button>
          )}
        </div>

        {/* Dashboard Grid */}
        <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
          {/* Left Column: Tickets Queue list */}
          <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl h-[600px] flex flex-col">
            <div className="border-b border-white/5 px-6 py-4 bg-slate-900/50 flex justify-between items-center">
              <span className="text-sm font-extrabold uppercase tracking-wider text-gray-400">Queue List</span>
              <span className="bg-indigo-500/10 text-indigo-400 text-xs px-2.5 py-0.5 rounded-full font-bold">
                {tickets.length} Matches
              </span>
            </div>

            <div className="flex-grow overflow-y-auto divide-y divide-white/5">
              {loading ? (
                <div className="p-8 text-center text-gray-400 text-sm">Loading tickets...</div>
              ) : tickets.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">No tickets found in this queue.</div>
              ) : (
                tickets.map(ticket => (
                  <div
                    key={ticket.id}
                    onClick={() => selectTicketAndFetchData(ticket)}
                    className={`p-6 cursor-pointer hover:bg-white/[0.02] transition-colors ${selectedTicket?.id === ticket.id ? 'bg-white/[0.04] border-l-4 border-indigo-500' : ''}`}
                  >
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <h4 className="font-bold text-white text-sm line-clamp-1 flex-grow">{ticket.subject}</h4>
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        ticket.urgency === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        ticket.urgency === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                        ticket.urgency === 'MEDIUM' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                      }`}>
                        {ticket.urgency}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-3">{ticket.description}</p>
                    <div className="flex justify-between items-center text-[10px] text-gray-500">
                      <span className={`px-2 py-0.5 rounded font-extrabold ${
                        ticket.status === 'OPEN' ? 'bg-green-500/10 text-green-400' :
                        ticket.status === 'IN_PROGRESS' ? 'bg-amber-500/10 text-amber-400' :
                        ticket.status === 'RESOLVED' ? 'bg-blue-500/10 text-blue-400' :
                        'bg-gray-500/10 text-gray-400'
                      }`}>
                        {ticket.status}
                      </span>
                      <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination Panel */}
            <div className="border-t border-white/5 px-6 py-4 bg-slate-900/50 flex justify-between items-center">
              <button
                disabled={offset === 0}
                onClick={() => setOffset(prev => Math.max(0, prev - limit))}
                className="bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 text-xs px-3 py-1.5 rounded-lg transition-colors"
              >
                Previous
              </button>
              <span className="text-xs text-gray-400">Page {Math.floor(offset / limit) + 1}</span>
              <button
                disabled={tickets.length < limit}
                onClick={() => setOffset(prev => prev + limit)}
                className="bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 text-xs px-3 py-1.5 rounded-lg transition-colors"
              >
                Next
              </button>
            </div>
          </div>

          {/* Right Column: Ticket details pane */}
          <div className="lg:col-span-7 space-y-6">
            {selectedTicket ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6">
                {/* Header info */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 pb-5 gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedTicket.subject}</h2>
                    <p className="text-xs text-gray-500 mt-1">Ticket ID: {selectedTicket.id}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`text-xs font-extrabold uppercase px-3 py-1 rounded-full ${
                      selectedTicket.urgency === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      selectedTicket.urgency === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                      selectedTicket.urgency === 'MEDIUM' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                      'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                    }`}>
                      {selectedTicket.urgency} urgency
                    </span>
                    <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold uppercase px-3 py-1 rounded-full">
                      {selectedTicket.status}
                    </span>
                  </div>
                </div>

                {/* Description Body */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Description</h3>
                  <div className="bg-white/5 rounded-xl p-5 border border-white/5 text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                    {selectedTicket.description}
                  </div>
                </div>

                {/* Agent Control Panel (Only visible for AGENT or ADMIN roles) */}
                {user && user.role !== 'CUSTOMER' && (
                  <div className="bg-white/5 rounded-xl p-5 border border-white/5 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Agent Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Set Status</label>
                        <select
                          value={selectedTicket.status}
                          onChange={(e) => updateTicketDetails({ status: e.target.value })}
                          className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                          style={{ colorScheme: 'dark' }}
                        >
                          <option value="OPEN">Open</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="RESOLVED">Resolved</option>
                          <option value="CLOSED">Closed</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Set Urgency</label>
                        <select
                          value={selectedTicket.urgency}
                          onChange={(e) => updateTicketDetails({ urgency: e.target.value })}
                          className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                          style={{ colorScheme: 'dark' }}
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                          <option value="CRITICAL">Critical</option>
                        </select>
                      </div>

                      <div className="flex flex-col justify-end">
                        <button
                          onClick={() => updateTicketDetails({ agent_id: user.id })}
                          disabled={selectedTicket.agent_id === user.id}
                          className="w-full bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 hover:text-white border border-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-xs py-2 rounded-lg transition-colors h-[34px]"
                        >
                          {selectedTicket.agent_id === user.id ? 'Assigned to You' : 'Assign to Me'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Insights Sidebar/Drawer Details */}
                {fetchingDetails ? (
                  <div className="text-center text-gray-400 text-xs py-6">Analyzing ticket contents...</div>
                ) : aiResponse ? (
                  <div className="border border-indigo-500/20 bg-indigo-500/5 rounded-xl p-5 space-y-4">
                    <div className="flex justify-between items-center border-b border-indigo-500/10 pb-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">AI Support assistant</h3>
                      <span className="text-[10px] text-indigo-400 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded">GPT-3.5 Agent</span>
                    </div>

                    {aiResponse.summary && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase text-indigo-300">Generated Summary</span>
                        <p className="text-xs text-gray-300 leading-relaxed bg-slate-950/40 p-3 rounded border border-indigo-500/10">
                          {aiResponse.summary}
                        </p>
                      </div>
                    )}

                    {aiResponse.suggested_reply && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold uppercase text-indigo-300">Suggested Draft Reply</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(aiResponse.suggested_reply || '');
                              alert('Copied suggested reply to clipboard!');
                            }}
                            className="text-[10px] text-indigo-400 hover:text-white bg-indigo-600/10 hover:bg-indigo-600/20 px-2.5 py-1 rounded font-semibold transition-colors"
                          >
                            Copy Response
                          </button>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed bg-slate-950/40 p-3 rounded border border-indigo-500/10 whitespace-pre-line">
                          {aiResponse.suggested_reply}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border border-white/5 bg-white/[0.01] rounded-xl p-5 text-center text-gray-500 text-xs">
                    AI triage summary is not ready yet. Please wait.
                  </div>
                )}

                {/* Audit trail system activity logs */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Audit Trail</h3>
                  
                  {activityLogs.length === 0 ? (
                    <p className="text-xs text-gray-500">No activity logs recorded yet.</p>
                  ) : (
                    <div className="relative pl-6 border-l border-white/10 space-y-5">
                      {activityLogs.map(log => (
                        <div key={log.id} className="relative text-xs">
                          {/* Circle indicator */}
                          <div className="absolute left-[-29px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-950 border-2 border-indigo-500" />
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-gray-300">{log.action}</span>
                            <span className="text-[10px] text-gray-500">{new Date(log.created_at).toLocaleTimeString()}</span>
                          </div>
                          {log.metadata_data && (
                            <div className="bg-slate-950/50 rounded-lg p-3 border border-white/5 text-[10px] text-gray-400 mt-2">
                              {Object.entries(log.metadata_data).map(([key, val]) => (
                                <p key={key}>
                                  <span className="font-semibold text-indigo-400">{key}:</span> {String(val)}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center text-gray-400 text-sm h-[400px] flex items-center justify-center shadow-2xl">
                Select a ticket from the queue list to view details, AI assistant suggestions, and the audit trail.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl relative">
            <h2 className="text-2xl font-bold text-white mb-2">New Support Request</h2>
            <p className="text-xs text-gray-400 mb-6">Describe your issue in detail. Our AI will automatically classify and suggest replies.</p>

            <form onSubmit={handleCreateTicket} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Summarize the core request"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Description / Issue</label>
                <textarea
                  required
                  rows={5}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Provide details about the issue..."
                />
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTicket}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 transition-all duration-200"
                >
                  {submittingTicket ? 'Submitting...' : 'Submit Support Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
