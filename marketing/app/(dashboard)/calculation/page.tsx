import { Metadata } from 'next';
import CalculationClient from './CalculationClient';

export const metadata: Metadata = {
    title: 'Nachkalkulation | Ars Mechanica',
    description: 'Projektübergreifende Kosten- und Erlöskalkulation.',
};

export default function CalculationPage() {
    return <CalculationClient />;
}
