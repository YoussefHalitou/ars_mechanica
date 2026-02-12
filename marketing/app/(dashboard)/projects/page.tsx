import { Metadata } from 'next';
import ProjectsClient from './ProjectsClient';

export const metadata: Metadata = {
    title: 'Projekte | Ars Mechanica',
    description: 'Projektverwaltung und Objekthistorie.',
};

export default function ProjectsPage() {
    return <ProjectsClient />;
}
