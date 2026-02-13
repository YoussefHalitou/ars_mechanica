import { Metadata } from 'next';
import { PlanningClient } from './PlanningClient';

export const metadata: Metadata = {
    title: 'Einsatzplanung | Ars Mechanica',
    description: 'Wochen- und Tagesplanung für Handwerksbetriebe.',
};

export default function PlanningPage() {
    return <PlanningClient />;
}
