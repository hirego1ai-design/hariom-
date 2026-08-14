"use client";

import React, { useState } from "react";
import Link from "next/link";
import EmployerSidebar from "./EmployerSidebar";
import EmployerHeader from "./EmployerHeader";

// ─── 1. UNIVERSAL PAGE CONTAINER ───────────────────────────────────────────
interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <div 
      className={`w-full max-w-[1600px] mx-auto px-8 pt-6 pb-10 space-y-6 ${className}`}
      style={{ boxSizing: "border-box" }}
    >
      {children}
    </div>
  );
}

// ─── 2. UNIVERSAL PAGE HEADER ──────────────────────────────────────────────
interface HeaderAction {
  text: string;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  icon?: string;
  disabled?: boolean;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
  primaryAction?: HeaderAction;
  secondaryAction?: HeaderAction;
}

export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  primaryAction,
  secondaryAction,
}: PageHeaderProps) {
  const renderAction = (action: HeaderAction, isPrimary: boolean) => {
    const baseStyle = "h-10 px-5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer select-none active:scale-95";
    let colorStyle = "";

    const variant = action.variant || (isPrimary ? "primary" : "secondary");

    if (variant === "primary") {
      colorStyle = "bg-[#29B6F6] hover:bg-[#29B6F6]/90 text-white shadow-lg";
    } else if (variant === "danger") {
      colorStyle = "bg-[#FF5252] hover:bg-[#FF5252]/90 text-white shadow-lg";
    } else if (variant === "ghost") {
      colorStyle = "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent";
    } else {
      colorStyle = "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10";
    }

    if (action.disabled) {
      colorStyle = "bg-slate-800/50 text-slate-500 border border-white/5 cursor-not-allowed opacity-60";
    }

    const content = (
      <>
        {action.icon && <span className="material-symbols-outlined text-sm">{action.icon}</span>}
        <span>{action.text}</span>
      </>
    );

    if (action.href && !action.disabled) {
      return (
        <Link href={action.href} className={`${baseStyle} ${colorStyle}`}>
          {content}
        </Link>
      );
    }

    return (
      <button 
        onClick={action.disabled ? undefined : action.onClick} 
        disabled={action.disabled}
        className={`${baseStyle} ${colorStyle}`}
      >
        {content}
      </button>
    );
  };

  return (
    <div className="h-[72px] flex items-center justify-between border-b border-white/10 pb-4 flex-shrink-0">
      <div className="flex flex-col justify-center h-full">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">
            {breadcrumbs.map((b, i) => (
              <React.Fragment key={i}>
                {b.href ? (
                  <Link href={b.href} className="hover:text-slate-300 transition-colors">
                    {b.label}
                  </Link>
                ) : (
                  <span>{b.label}</span>
                )}
                {i < breadcrumbs.length - 1 && <span>/</span>}
              </React.Fragment>
            ))}
          </div>
        )}
        <h1 className="text-xl font-extrabold text-white tracking-tight leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-400 mt-1 font-medium leading-none">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {secondaryAction && renderAction(secondaryAction, false)}
        {primaryAction && renderAction(primaryAction, true)}
      </div>
    </div>
  );
}

// ─── 3. UNIVERSAL CARD COMPONENT ───────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`bg-[#121215] border border-white/5 rounded-[20px] p-6 shadow-xl ${className}`}>
      {children}
    </div>
  );
}

// ─── 4. UNIVERSAL TABLE COMPONENTS ──────────────────────────────────────────
interface TableProps {
  headers: string[];
  children: React.ReactNode;
}

export function Table({ headers, children }: TableProps) {
  return (
    <div className="bg-[#121215] border border-white/5 rounded-[20px] overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              {headers.map((h, i) => (
                <th key={i} className="px-6 py-4 text-xs uppercase font-extrabold tracking-wider text-slate-400">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs text-slate-300">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface TableRowProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function TableRow({ children, onClick, className = "" }: TableRowProps) {
  return (
    <tr 
      onClick={onClick}
      className={`hover:bg-white/[0.02] transition-colors ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {children}
    </tr>
  );
}

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
}

export function TableCell({ children, className = "" }: TableCellProps) {
  return (
    <td className={`px-6 py-4.5 align-middle ${className}`}>
      {children}
    </td>
  );
}

// ─── 5. UNIVERSAL FORM CONTROLS ────────────────────────────────────────────
interface FormFieldProps {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function FormGroup({ label, error, helperText, required, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5 w-full">
      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
        {label} {required && <span className="text-[#FF5252]">*</span>}
      </label>
      {children}
      {error && (
        <span className="text-[10px] font-bold text-[#FF5252] block animate-pulse">
          {error}
        </span>
      )}
      {helperText && !error && (
        <span className="text-[10px] text-slate-500 block">
          {helperText}
        </span>
      )}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function FormInput({ error, className = "", ...props }: InputProps) {
  return (
    <input
      {...props}
      className={`w-full h-11 bg-[#121215] border ${
        error ? "border-[#FF5252] focus:border-[#FF5252]" : "border-white/10 focus:border-[#29B6F6]"
      } rounded-xl px-4 text-xs text-white outline-none transition-all placeholder-slate-600 ${className}`}
    />
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export function FormSelect({ error, className = "", children, ...props }: SelectProps) {
  return (
    <select
      {...props}
      className={`w-full h-11 bg-[#121215] border ${
        error ? "border-[#FF5252] focus:border-[#FF5252]" : "border-white/10 focus:border-[#29B6F6]"
      } rounded-xl px-4 text-xs text-white outline-none transition-all cursor-pointer ${className}`}
    >
      {children}
    </select>
  );
}

// ─── 6. UNIVERSAL MODAL COMPONENT ──────────────────────────────────────────
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footerActions?: React.ReactNode;
  size?: "md" | "lg" | "xl" | "3xl" | "4xl";
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footerActions,
  size = "md",
}: ModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className={`bg-[#121215] border border-white/15 rounded-3xl p-6 w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col shadow-2xl relative animate-in fade-in zoom-in-95 duration-200`}>
        <div className="flex justify-between items-start border-b border-white/10 pb-3 flex-shrink-0">
          <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white transition-colors p-1.5 hover:bg-white/5 rounded-full"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1.5 my-4 space-y-4">
          {children}
        </div>

        {footerActions && (
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10 flex-shrink-0">
            {footerActions}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 7. UNIVERSAL EMPTY STATE ──────────────────────────────────────────────
interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionText, onAction }: EmptyStateProps) {
  return (
    <div className="bg-[#121215] border border-white/5 rounded-[20px] p-12 text-center max-w-md mx-auto space-y-4 shadow-xl">
      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 mx-auto border border-white/10">
        <span className="material-symbols-outlined text-3xl">{icon}</span>
      </div>
      <div className="space-y-1.5">
        <h4 className="text-sm font-bold text-white">{title}</h4>
        <p className="text-xs text-slate-500 leading-normal">{description}</p>
      </div>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="h-10 px-5 bg-[#29B6F6] hover:bg-[#29B6F6]/90 text-white rounded-xl text-xs font-bold transition-all active:scale-95 mx-auto block"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}

// ─── 8. UNIVERSAL LOADING & SKELETON LOADERS ───────────────────────────────
export function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-3">
      <div className="w-8 h-8 border-2 border-[#29B6F6] border-t-transparent rounded-full animate-spin"></div>
      <span className="text-xs text-slate-500 font-medium">Loading workspace data...</span>
    </div>
  );
}

export function SkeletonLoader({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4 w-full animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-white/5 rounded-xl w-full border border-white/5" />
      ))}
    </div>
  );
}

// ─── 9. UNIVERSAL PAGINATION ───────────────────────────────────────────────
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-4 border-t border-white/5 flex-shrink-0">
      <span className="text-[11px] text-slate-500 font-medium">
        Page {currentPage} of {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="h-9 px-4 rounded-xl border border-white/10 text-xs font-bold text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 transition-all"
        >
          Previous
        </button>
        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="h-9 px-4 bg-slate-800 border border-white/10 text-xs font-bold text-slate-200 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Next
        </button>
      </div>
    </div>
  );
}

// ─── 10. UNIVERSAL FILTERS & SEARCH BAR ────────────────────────────────────
interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = "Search records..." }: SearchBarProps) {
  return (
    <div className="relative flex-1 max-w-md">
      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-lg">
        search
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 pl-11 pr-4 bg-[#121215] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#29B6F6] transition-all placeholder-slate-600"
      />
    </div>
  );
}

interface FilterBarProps {
  children: React.ReactNode;
}

export function FilterBar({ children }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
      {children}
    </div>
  );
}

// ─── 11. UNIVERSAL STATUS BADGE ────────────────────────────────────────────
interface StatusBadgeProps {
  status: string;
  variant?: "success" | "warning" | "danger" | "info" | "neutral";
}

export function StatusBadge({ status, variant = "neutral" }: StatusBadgeProps) {
  const styles = {
    success: "bg-[#26A69A]/10 text-[#26A69A] border-[#26A69A]/20",
    warning: "bg-[#FFCA28]/10 text-[#FFCA28] border-[#FFCA28]/20",
    danger: "bg-[#FF5252]/10 text-[#FF5252] border-[#FF5252]/20",
    info: "bg-[#29B6F6]/10 text-[#29B6F6] border-[#29B6F6]/20",
    neutral: "bg-white/5 text-slate-400 border-white/10",
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${styles[variant]}`}>
      {status}
    </span>
  );
}

// ─── 12. UNIVERSAL ACTION TOOLBAR ──────────────────────────────────────────
interface ActionToolbarProps {
  children: React.ReactNode;
}

export function ActionToolbar({ children }: ActionToolbarProps) {
  return (
    <div className="flex items-center gap-2.5">
      {children}
    </div>
  );
}

// ─── 13. GLOBAL LAYOUT SHELL ───────────────────────────────────────────────
interface EmployerLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  activeRole?: string;
  onRoleChange?: (role: string) => void;
}

export function EmployerLayout({
  children,
  title,
  subtitle,
  activeRole,
  onRoleChange,
}: EmployerLayoutProps) {
  return (
    <div className="bg-[#0A0A0C] text-white min-h-screen relative flex">
      {/* Universal Side Rail */}
      <EmployerSidebar />

      {/* Main Panel Viewport */}
      <div className="flex-1 md:ml-[116px] flex flex-col min-h-screen">
        <EmployerHeader title={title} subtitle={subtitle} />
        
        {children}
      </div>
    </div>
  );
}
