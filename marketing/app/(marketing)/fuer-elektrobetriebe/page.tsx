import { IndustryPage } from '@/components/IndustryPage'
import { elektrobetriebe } from '@/lib/industryData'

export const metadata = {
    title: elektrobetriebe.metaTitle,
    description: elektrobetriebe.metaDescription,
}

export default function ElektrobetriebePage() {
    return <IndustryPage industry={elektrobetriebe} />
}
