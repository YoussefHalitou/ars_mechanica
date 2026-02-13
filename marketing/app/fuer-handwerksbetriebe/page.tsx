import { IndustryPage } from '@/components/IndustryPage'
import { weitereGewerke } from '@/lib/industryData'

export const metadata = {
    title: weitereGewerke.metaTitle,
    description: weitereGewerke.metaDescription,
}

export default function HandwerksbetriebePage() {
    return <IndustryPage industry={weitereGewerke} />
}
