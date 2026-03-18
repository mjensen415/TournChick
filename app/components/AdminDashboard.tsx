'use client'

import React, { useState } from 'react'

type DashboardProps = {
  matches: any[]
  voteAggregates: any[]
  globalSettings: any
}

export default function AdminDashboard({ matches, voteAggregates, globalSettings }: DashboardProps) {
  const [globalOpen, setGlobalOpen] = useState(globalSettings.globalPollingOpen)
  
  const handleToggleGlobal = async () => {
    const { toggleGlobalPolling } = await import('@/app/actions/admin')
    const res = await toggleGlobalPolling(!globalOpen)
    if (res.success) setGlobalOpen(!globalOpen)
    else alert(res.error)
  }

  const handleToggleMatch = async (matchId: string, currentOpenStatus: boolean) => {
    const { toggleMatchPolling } = await import('@/app/actions/admin')
    const res = await toggleMatchPolling(matchId, !currentOpenStatus)
    if (!res.success) alert(res.error)
  }

  const handleAdvanceWinner = async (matchId: string, teamId: string) => {
    const { advanceWinner } = await import('@/app/actions/admin')
    const res = await advanceWinner(matchId, teamId)
    if (!res.success) alert(res.error)
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
        <h2>Tournament Dashboard</h2>
        <div style={{ display: 'flex', gap: 16 }}>
          <button 
            className="btn-primary" 
            style={{ background: globalOpen ? 'var(--danger)' : 'var(--success)' }}
            onClick={handleToggleGlobal}
          >
            {globalOpen ? 'Lock All Voting' : 'Open All Voting'}
          </button>
          <button className="btn-secondary" onClick={async () => {
            const { logoutAdmin } = await import('@/app/actions/admin')
            await logoutAdmin()
            window.location.reload()
          }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 24 }}>
        {matches.map(match => {
          // Calculate Votes
          const team1Votes = voteAggregates.find(v => v.matchId === match.id && v.teamId === match.team1Id)?._count.id || 0
          const team2Votes = voteAggregates.find(v => v.matchId === match.id && v.teamId === match.team2Id)?._count.id || 0
          
          return (
            <div key={match.id} className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>Round {match.round} • Match {match.position}</span>
                {match.winner ? (
                  <span className="text-secondary" style={{ fontSize: '0.8rem', color: 'var(--success)' }}>Complete</span>
                ) : (
                  <button 
                  className="btn-secondary" 
                  style={{ padding: '4px 12px', fontSize: '0.8rem', borderColor: match.isOpen ? 'var(--accent-primary)' : '' }}
                  onClick={() => handleToggleMatch(match.id, match.isOpen)}
                  disabled={!match.team1 || !match.team2}
                >
                  {match.isOpen ? 'Close Poils' : 'Open Polls'}
                </button>
                )}
              </div>

              {/* Team 1 UI */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <span className="team-seed" style={{ marginRight: 8 }}>{match.team1?.seed || '-'}</span>
                  <span>{match.team1?.name || 'TBD'}</span>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <strong className="text-gradient" style={{ fontSize: '1.2rem'}}>{team1Votes} Votes</strong>
                  {!match.winner && match.team1 && match.team2 && (
                    <button className="btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleAdvanceWinner(match.id, match.team1.id)}>Advance ✓</button>
                  )}
                </div>
              </div>

              {/* Team 2 UI */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className="team-seed" style={{ marginRight: 8 }}>{match.team2?.seed || '-'}</span>
                  <span>{match.team2?.name || 'TBD'}</span>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <strong className="text-gradient" style={{ fontSize: '1.2rem'}}>{team2Votes} Votes</strong>
                  {!match.winner && match.team1 && match.team2 && (
                    <button className="btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleAdvanceWinner(match.id, match.team2.id)}>Advance ✓</button>
                  )}
                </div>
              </div>

              {match.winner && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--glass-border)', textAlign: 'center', color: 'var(--success)' }}>
                  Winner: {match.winner.name}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
