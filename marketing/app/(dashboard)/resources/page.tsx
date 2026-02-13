import { Metadata } from 'next';
import ResourcesClient from './ResourcesClient';

export const metadata: Metadata = {
    title: 'Ressourcen | Ars Mechanica',
    description: 'Verwaltung von Mitarbeitern, Fahrzeugen und Material.',
};

export default function ResourcesPage() {
    return <ResourcesClient />;
}
