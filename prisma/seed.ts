import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import { parse } from 'csv-parse/sync'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database from CSV...')

  // Clean existing data for idempotency
  await prisma.vote.deleteMany()
  await prisma.match.deleteMany()
  await prisma.team.deleteMany()
  await prisma.settings.deleteMany()

  // 1. Create Default Settings
  await prisma.settings.create({
    data: {
        id: 'global',
        adminPasswordHash: 'admin123', // In production, bcrypt hash this.
        globalPollingOpen: false
    }
  })
  console.log('Created Settings')

  // 2. Read and parse CSV
  const csvPath = path.join(process.cwd(), 'prisma', 'teams.csv')
  const fileContent = fs.readFileSync(csvPath, { encoding: 'utf-8' })
  
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true
  })

  // Format records for Prisma insertion
  const teamsData = records.map((record: any) => ({
      name: record.Name,
      seed: parseInt(record.Seed, 10),
      region: record.Region
  }))

  await prisma.team.createMany({
      data: teamsData
  })
  console.log(`Created ${teamsData.length} Teams`)

  // Fetch created teams to get their generated IDs
  const allTeams = await prisma.team.findMany({
      orderBy: [
          { region: 'asc' },
          { seed: 'asc' }
      ]
  })

  // Group teams by region for easier seeding logic
  const regions = Array.from(new Set(allTeams.map(t => t.region)))
  
  const teamsByRegion: Record<string, any[]> = {}
  for (const region of regions) {
      teamsByRegion[region] = allTeams.filter(t => t.region === region).sort((a, b) => a.seed - b.seed)
  }

  // 3. Create Matches (The Bracket)
  const rounds = [
    { roundNum: 1, matchCount: 32 },
    { roundNum: 2, matchCount: 16 },
    { roundNum: 3, matchCount: 8 },
    { roundNum: 4, matchCount: 4 },
    { roundNum: 5, matchCount: 2 },
    { roundNum: 6, matchCount: 1 },
  ]

  // Standard March Madness Opening Round matchups per Region (8 matches per region):
  // 1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15
  // This layout ensures proper meeting in subsequent rounds.
  const seedMatchups = [
      [1, 16],
      [8, 9],
      [5, 12],
      [4, 13],
      [6, 11],
      [3, 14],
      [7, 10],
      [2, 15]
  ]

  let overallMatchPosition = 1

  for (const round of rounds) {
      if (round.roundNum === 1) {
          // Create Round 1 with predefined seeding logic per region
          for (const region of regions) {
              const regionTeams = teamsByRegion[region]

              for (const [seed1, seed2] of seedMatchups) {
                  const team1 = regionTeams.find(t => t.seed === seed1)
                  const team2 = regionTeams.find(t => t.seed === seed2)

                  await prisma.match.create({
                      data: {
                          round: 1,
                          position: overallMatchPosition++,
                          team1Id: team1?.id || null,
                          team2Id: team2?.id || null,
                          isOpen: false
                      }
                  })
              }
          }
      } else {
          // For Rounds 2-6, create empty matches
          for (let pos = 1; pos <= round.matchCount; pos++) {
              await prisma.match.create({
                  data: {
                      round: round.roundNum,
                      position: pos,
                      team1Id: null,
                      team2Id: null,
                      isOpen: false
                  }
              })
          }
      }
      // Reset position counter for the next round
      overallMatchPosition = 1
  }

  console.log('Created Tournament Bracket structure with correct Seeding.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
