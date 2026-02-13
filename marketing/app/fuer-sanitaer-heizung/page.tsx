import { IndustryPage } from '@/components/IndustryPage'
import { sanitaerHeizung } from '@/lib/industryData'

export const metadata = {
    title: sanitaerHeizung.metaTitle,
    description: sanitaerHeizung.metaDescription,
}

export default function SanitaerHeizungPage() {
    return <IndustryPage industry={sanitaerHeizung} />
}
