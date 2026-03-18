import { fetchBracket } from '@/app/actions/voting'
import Bracket from '@/app/components/Bracket'
import Header from '@/app/components/Header'

export const revalidate = 0 // Disable caching for the index page to always show latest data

export default async function Home() {
  const { matches } = await fetchBracket()

  return (
    <main style={{ paddingTop: '160px' }}>
      <Header />

      {/* The interactive client bracket */}
      <Bracket matches={matches} />
    </main>
  )
}
