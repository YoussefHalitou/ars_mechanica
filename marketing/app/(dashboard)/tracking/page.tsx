import { Metadata } from 'next';
import TrackingClient from './TrackingClient';

export const metadata: Metadata = {
    title: 'Rückerfassung | Ars Mechanica',
    description: 'Zeiterfassung und Arbeitseinsätze verwalten.',
};

export default function TrackingPage() {
    return <TrackingClient />;
}
