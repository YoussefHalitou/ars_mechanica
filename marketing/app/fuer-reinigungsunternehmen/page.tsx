import { IndustryPage } from '@/components/IndustryPage'
import { reinigungsunternehmen } from '@/lib/industryData'

export const metadata = {
    title: reinigungsunternehmen.metaTitle,
    description: reinigungsunternehmen.metaDescription,
}

export default function ReinigungsunternehmenPage() {
    return <IndustryPage industry={reinigungsunternehmen} />
}
