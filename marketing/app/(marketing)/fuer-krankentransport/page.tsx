import { IndustryPage } from '@/components/IndustryPage'
import { krankentransport } from '@/lib/industryData'

export const metadata = {
    title: krankentransport.metaTitle,
    description: krankentransport.metaDescription,
}

export default function KrankentransportPage() {
    return <IndustryPage industry={krankentransport} />
}
