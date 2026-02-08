import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API Documentation - RVU Tracker',
  description: 'Complete API documentation for RVU Tracker - Medical Procedure RVU Management',
};

export default function ApiDocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
