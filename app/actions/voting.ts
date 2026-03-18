'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function fetchBracket() {
  // Fetch all matches with their associated teams
  const matches = await prisma.match.findMany({
    include: {
      team1: true,
      team2: true,
      winner: true,
    },
    orderBy: [
      { round: 'asc' },
      { position: 'asc' }
    ]
  })
  
  return { matches }
}

export async function promoteWinner(matchId: string, winningTeamId: string) {
  try {
    // 1. Fetch current match to know round and position
    const currentMatch = await prisma.match.findUnique({
      where: { id: matchId }
    })

    if (!currentMatch) throw new Error('Match not found')
    
    if (currentMatch.round === 6) {
       // Championship round
       await prisma.match.update({
           where: { id: matchId },
           data: { winnerId: winningTeamId, isOpen: false }
       })
       revalidatePath('/')
       revalidatePath('/admin')
       return { success: true }
    }

    // 2. Determine next match position in bracket tree
    const nextRound = currentMatch.round + 1
    const nextPosition = Math.ceil(currentMatch.position / 2)
    const isTeam1 = currentMatch.position % 2 !== 0

    // 3. Update current match winner and close it
    await prisma.match.update({
      where: { id: matchId },
      data: { winnerId: winningTeamId, isOpen: false }
    })

    // 4. Update the next match with the advancing team
    const nextMatchData: any = {}
    if (isTeam1) {
      nextMatchData.team1Id = winningTeamId
    } else {
      nextMatchData.team2Id = winningTeamId
    }

    await prisma.match.update({
      where: { round_position: { round: nextRound, position: nextPosition } },
      data: nextMatchData
    })

    revalidatePath('/')
    revalidatePath('/admin')
    return { success: true }

  } catch (error: any) {
    console.error('Advance error:', error)
    return { success: false, error: error.message || 'Error advancing winner' }
  }
}
