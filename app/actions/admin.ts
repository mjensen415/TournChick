'use server'

import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

// Basic authentication check
async function isAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  
  // In a real app, use JWT or proper session verification.
  // For MVP, we check if they have the token that matches our hash expectation.
  if (token !== 'authenticated') {
    throw new Error('Unauthorized')
  }
}

export async function loginAdmin(password: string) {
  const settings = await prisma.settings.findUnique({
    where: { id: 'global' },
  })

  // Compare simple password for prototype (use bcrypt locally/prod normally)
  if (password === settings?.adminPasswordHash) {
    const cookieStore = await cookies()
    cookieStore.set('admin_token', 'authenticated', {
      maxAge: 60 * 60 * 24, // 1 day
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })
    return { success: true }
  }

  return { success: false, error: 'Invalid password' }
}

export async function logoutAdmin() {
  const cookieStore = await cookies()
  cookieStore.delete('admin_token')
  return { success: true }
}

export async function toggleGlobalPolling(isOpen: boolean) {
  try {
    await isAdmin()
    
    await prisma.settings.update({
      where: { id: 'global' },
      data: { globalPollingOpen: isOpen }
    })
    
    revalidatePath('/')
    revalidatePath('/admin')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function toggleMatchPolling(matchId: string, isOpen: boolean) {
  try {
    await isAdmin()
    
    await prisma.match.update({
      where: { id: matchId },
      data: { isOpen }
    })

    revalidatePath('/')
    revalidatePath('/admin')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function advanceWinner(matchId: string, winningTeamId: string) {
  try {
    await isAdmin()

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

export async function getAdminMatchData() {
    await isAdmin()
    
    const matches = await prisma.match.findMany({
        include: {
            team1: true,
            team2: true,
            winner: true,
            _count: {
                select: { votes: true }
            }
        },
        orderBy: [
            { round: 'asc' },
            { position: 'asc' }
        ]
    })

    // Compute live vote totals per team per match
    // This requires a group by
    const voteAggregates = await prisma.vote.groupBy({
        by: ['matchId', 'teamId'],
        _count: {
            id: true
        }
    })

    const globalSettings = await prisma.settings.findUnique({ where: { id: 'global'} })

    return { matches, voteAggregates, globalSettings }
}
