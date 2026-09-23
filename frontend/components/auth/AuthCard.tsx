import type { ReactNode } from "react";

interface AuthCardProps {
  title: string;
  children: ReactNode;
}

export function AuthCard({ title, children }: AuthCardProps) {
  return (
    <div className="flex justify-center px-24 py-64">
      <div className="flex w-full max-w-[400px] flex-col gap-24">
        <h1 className="font-lunar text-subheading tracking-subheading text-obsidian">{title}</h1>
        {children}
      </div>
    </div>
  );
}
