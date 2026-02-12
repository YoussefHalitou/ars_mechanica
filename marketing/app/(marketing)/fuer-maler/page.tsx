import { IndustryPage } from '@/components/IndustryPage'
import { maler } from '@/lib/industryData'

export const metadata = {
    title: maler.metaTitle,
    description: maler.metaDescription,
}

export default function MalerPage() {
    return <IndustryPage industry={maler} />
}
