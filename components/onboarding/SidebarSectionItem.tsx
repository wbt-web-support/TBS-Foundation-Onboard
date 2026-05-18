"use client";

import { StepNavItem, type StepNavState } from "./StepNavItem";

export type SectionState = StepNavState;

export function SidebarSectionItem({
  number,
  title,
  subtitle,
  state,
  onClick,
}: {
  number: number;
  title: string;
  subtitle: string;
  state: SectionState;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="mb-1 w-full text-left transition">
      <StepNavItem number={number} title={title} subtitle={subtitle} state={state} />
    </button>
  );
}
