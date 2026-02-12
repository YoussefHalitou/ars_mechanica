import { IndustryPage } from '@/components/IndustryPage'
import { geruestbauer } from '@/lib/industryData'

export const metadata = {
    title: geruestbauer.metaTitle,
    description: geruestbauer.metaDescription,
}

export default function GeruestbauerPage() {
    return <IndustryPage industry={geruestbauer} />
}
