import type { ReactNode } from 'react';

export const metadata = {
  title: 'Admin — SAT Exam Simulator',
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-bluebook-bg">{children}</div>;
}
