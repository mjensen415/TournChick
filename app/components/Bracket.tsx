'use client'

import React, { useState } from 'react'

type Team = {
  id: string
  name: string
  seed: number
  region: string
}

type Match = {
  id: string
  round: number
  position: number
  team1: Team | null
  team2: Team | null
  winner: Team | null
  isOpen?: boolean
}

interface BracketProps {
  matches: Match[]
}

export default function Bracket({ matches }: BracketProps) {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)

  const handleMatchClick = (match: Match) => {
    if (!match.winner && match.team1 && match.team2) {
      setSelectedMatch(match)
    }
  }

  const handlePromote = async (teamId: string) => {
    if (!selectedMatch) return

    try {
      const { promoteWinner } = await import('@/app/actions/voting')
      const result = await promoteWinner(selectedMatch.id, teamId)
      
      if (result.success) {
        setSelectedMatch(null)
      } else {
        alert(result.error)
      }
    } catch (e) {
      alert('Failed to promote team')
    }
  }

  const getMatches = (round: number, positions: number[]) => {
    return matches.filter(m => m.round === round && positions.includes(m.position))
      .sort((a,b) => a.position - b.position)
  }

  // Left side matches:
  const r1Left = getMatches(1, Array.from({length: 16}, (_, i) => i + 1))
  const r2Left = getMatches(2, Array.from({length: 8}, (_, i) => i + 1))
  const r3Left = getMatches(3, [1, 2, 3, 4])
  const r4Left = getMatches(4, [1, 2])
  
  // Right side matches:
  const r1Right = getMatches(1, Array.from({length: 16}, (_, i) => i + 17))
  const r2Right = getMatches(2, Array.from({length: 8}, (_, i) => i + 9))
  const r3Right = getMatches(3, [5, 6, 7, 8])
  const r4Right = getMatches(4, [3, 4])
  
  // Center:
  const r5Left = getMatches(5, [1])
  const r6 = getMatches(6, [1])
  const r5Right = getMatches(5, [2])

  // Internal component so we can use state handlers easily
  const RoundColumn = ({ columnMatches, roundNum, isLeft, isCenter }: { columnMatches: Match[], roundNum: number, isLeft?: boolean, isCenter?: boolean }) => {
    if (columnMatches.length === 0) return null;
    
    return (
        <div className="bracket-round" style={{ minHeight: 'auto', justifyContent: 'space-around' }}>
            {columnMatches.map(match => {
                const isClickable = !match.winner && match.team1 && match.team2
                
                // Title overlay for the championship match
                const isChampionship = roundNum === 6;

                return (
                    <div key={`wrapper-${match.id}`} style={{ position: 'relative' }}>
                        {isChampionship && (
                            <h3 className="text-gradient" style={{ position: 'absolute', top: '-150px', left: '50%', transform: 'translateX(-50%)', textTransform: 'uppercase', fontSize: '1.2rem', letterSpacing: '4px', whiteSpace: 'nowrap' }}>
                                Championship
                            </h3>
                        )}

                        <div  
                            className={`match-card glass-panel ${isClickable ? 'is-open' : ''}`}
                            onClick={() => handleMatchClick(match)}
                            style={{ 
                              cursor: isClickable ? 'pointer' : 'default', 
                              margin: '8px 0',
                              width: isChampionship ? '240px' : '200px'
                            }}
                        >
                            <TeamRow team={match.team1} isWinner={match.winner?.id === match.team1?.id} />
                            <TeamRow team={match.team2} isWinner={match.winner?.id === match.team2?.id} />
                            
                            {/* Connectors. */}
                            {roundNum < 6 && !isCenter && isLeft && <div className="match-connector-right" />}
                            {roundNum < 6 && !isCenter && !isLeft && <div className="match-connector-left" />}
                            {isCenter && roundNum === 5 && match.position === 1 && <div className="match-connector-right" />}
                            {isCenter && roundNum === 5 && match.position === 2 && <div className="match-connector-left" />}
                        </div>
                    </div>
                )
            })}
        </div>
    )
  }

  return (
    <>
      <div className="bracket-wrapper">
        <div className="bracket-half left">
            <div className="region-container">
                <h2 id="region-audrey" className="region-title text-gradient-accent">Audrey Hepburn Region</h2>
                <div style={{display: 'flex', gap: '30px'}}>
                    <RoundColumn columnMatches={r1Left.slice(0, 8)} roundNum={1} isLeft />
                    <RoundColumn columnMatches={r2Left.slice(0, 4)} roundNum={2} isLeft />
                    <RoundColumn columnMatches={r3Left.slice(0, 2)} roundNum={3} isLeft />
                    <RoundColumn columnMatches={r4Left.slice(0, 1)} roundNum={4} isLeft />
                </div>
                <div style={{ height: '40px' }} /> {/* Spacer */}
                <h2 id="region-bo" className="region-title text-gradient-accent">Bo Derek Region</h2>
                <div style={{display: 'flex', gap: '30px'}}>
                    <RoundColumn columnMatches={r1Left.slice(8, 16)} roundNum={1} isLeft />
                    <RoundColumn columnMatches={r2Left.slice(4, 8)} roundNum={2} isLeft />
                    <RoundColumn columnMatches={r3Left.slice(2, 4)} roundNum={3} isLeft />
                    <RoundColumn columnMatches={r4Left.slice(1, 2)} roundNum={4} isLeft />
                </div>
            </div>
        </div>
        
        <div className="bracket-center">
            <RoundColumn columnMatches={r5Left} roundNum={5} isCenter />
            <RoundColumn columnMatches={r6} roundNum={6} isCenter />
            <RoundColumn columnMatches={r5Right} roundNum={5} isCenter />
        </div>

        <div className="bracket-half right">
            <div className="region-container" style={{ alignItems: 'flex-end', textAlign: 'right' }}>
                <h2 id="region-marilyn" className="region-title text-gradient-accent">Marilyn Monroe Region</h2>
                <div style={{display: 'flex', gap: '30px', flexDirection: 'row-reverse'}}>
                    <RoundColumn columnMatches={r1Right.slice(0, 8)} roundNum={1} />
                    <RoundColumn columnMatches={r2Right.slice(0, 4)} roundNum={2} />
                    <RoundColumn columnMatches={r3Right.slice(0, 2)} roundNum={3} />
                    <RoundColumn columnMatches={r4Right.slice(0, 1)} roundNum={4} />
                </div>
                <div style={{ height: '40px' }} /> {/* Spacer */}
                <h2 id="region-pamela" className="region-title text-gradient-accent">Pamela Anderson Region</h2>
                <div style={{display: 'flex', gap: '30px', flexDirection: 'row-reverse'}}>
                    <RoundColumn columnMatches={r1Right.slice(8, 16)} roundNum={1} />
                    <RoundColumn columnMatches={r2Right.slice(4, 8)} roundNum={2} />
                    <RoundColumn columnMatches={r3Right.slice(2, 4)} roundNum={3} />
                    <RoundColumn columnMatches={r4Right.slice(1, 2)} roundNum={4} />
                </div>
            </div>
        </div>
      </div>

      {/* Promote Modal */}
      {selectedMatch && selectedMatch.team1 && selectedMatch.team2 && (
        <div className="modal-overlay" onClick={() => setSelectedMatch(null)}>
          <div className="vote-modal glass-panel" onClick={e => e.stopPropagation()}>
            <h2 className="text-gradient">Promote to Next Round</h2>
            <p className="text-muted" style={{ marginTop: 8 }}>
              Are you sure you want to promote this team to the next round?
            </p>
            
            <div className="vote-options">
              <button className="vote-btn" onClick={() => handlePromote(selectedMatch.team1!.id)}>
                <span><span className="team-seed" style={{marginRight: 8}}>{selectedMatch.team1.seed}</span> {selectedMatch.team1.name}</span>
                <span className="text-muted">→</span>
              </button>
              
              <button className="vote-btn" onClick={() => handlePromote(selectedMatch.team2!.id)}>
                <span><span className="team-seed" style={{marginRight: 8}}>{selectedMatch.team2.seed}</span> {selectedMatch.team2.name}</span>
                <span className="text-muted">→</span>
              </button>
            </div>
            
            <button className="btn-secondary" style={{ marginTop: 24, width: '100%' }} onClick={() => setSelectedMatch(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function TeamRow({ team, isWinner }: { team: Team | null, isWinner: boolean }) {
  if (!team) return <div className="team-row"><span className="team-empty">TBD</span></div>

  const handleSearchClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(team.name)}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="team-row" style={{ padding: '8px 12px' }}>
      <span className="team-seed">{team.seed}</span>
      <span 
        className={`team-name ${isWinner ? 'team-winner' : ''}`} 
        style={{ fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
        onClick={handleSearchClick}
        title={`Search images of ${team.name}`}
      >
        {team.name}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6, flexShrink: 0 }}>
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </span>
    </div>
  )
}
