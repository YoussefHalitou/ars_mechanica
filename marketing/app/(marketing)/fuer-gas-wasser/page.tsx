import { IndustryPage } from '@/components/IndustryPage'
import { gasWasser } from '@/lib/industryData'

export const metadata = {
    title: gasWasser.metaTitle,
    description: gasWasser.metaDescription,
}

export default function GasWasserPage() {
    return <IndustryPage industry={gasWasser} />
}
