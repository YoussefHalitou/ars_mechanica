import { IndustryPage } from '@/components/IndustryPage'
import { umzugsunternehmen } from '@/lib/industryData'

export const metadata = {
    title: umzugsunternehmen.metaTitle,
    description: umzugsunternehmen.metaDescription,
}

export default function UmzugsunternehmenPage() {
    return <IndustryPage industry={umzugsunternehmen} />
}
