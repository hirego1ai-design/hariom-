"use client";

import React, { useState } from "react";
import parse, { domToReact, Element, type DOMNode, type HTMLReactParserOptions } from "html-react-parser";
import { useRouter, usePathname } from "next/navigation";

interface StitchPageEngineProps {
  rawHtml: string;
  bodyClasses?: string;
  nextRoute?: string;
  prevRoute?: string;
}

// Navigation route mapping for common sidebar/header links
const routeKeywordsMap: { keywords: string[]; route: string }[] = [
  { keywords: ["dashboard", "home", "command center"], route: "/dashboard" },
  { keywords: ["jobs", "search jobs", "browse jobs", "job listings"], route: "/jobs" },
  { keywords: ["complete profile", "complete my profile"], route: "/onboarding" },
  { keywords: ["profile", "my profile", "resume builder"], route: "/profile" },
  { keywords: ["practice", "mock interview", "ai practice"], route: "/ai/practice-hub" },
  { keywords: ["applications", "my applications", "application tracker"], route: "/applications" },
  { keywords: ["interviews", "upcoming interviews", "calendar"], route: "/interviews" },
  { keywords: ["pricing", "plans", "upgrade"], route: "/pricing" },
  { keywords: ["settings", "account security"], route: "/settings" },
  { keywords: ["messages", "inbox", "chat"], route: "/messages" },
  { keywords: ["notifications"], route: "/notifications" },
  { keywords: ["referral", "referrals"], route: "/referrals" },
  { keywords: ["leaderboard"], route: "/leaderboard" },
  { keywords: ["screens index", "all screens", "screen index"], route: "/screens" },
  { keywords: ["create account", "sign up", "register"], route: "/register" },
  { keywords: ["forgot password", "reset password"], route: "/forgot-password" },
  { keywords: ["sign in", "login"], route: "/login" },
];

type TextLikeNode = {
  type?: string;
  data?: string;
  children?: TextLikeNode[];
};

const extractText = (node: TextLikeNode): string => {
  if (node.type === "text") return node.data || "";
  if (node.children) return node.children.map(extractText).join(" ");
  return "";
};

const getStableNodeId = (prefix: string, node: Element, attribs: Record<string, string>) => {
  const explicitId = attribs.id || attribs.name;
  if (explicitId) return explicitId;

  const textKey = extractText(node).trim().toLowerCase().replace(/\s+/g, "-").slice(0, 32);
  const attrKey = Object.entries(attribs)
    .slice(0, 4)
    .map(([key, value]) => `${key}-${value}`)
    .join("-")
    .replace(/[^a-z0-9_-]/gi, "")
    .slice(0, 48);

  return `${prefix}_${node.name}_${textKey || attrKey || "control"}`;
};

export default function StitchPageEngine({
  rawHtml,
  bodyClasses = "",
  nextRoute = "/dashboard",
  prevRoute = "/",
}: StitchPageEngineProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [toggleStateMap, setToggleStateMap] = useState<Record<string, boolean>>({});
  const [inputValueMap, setInputValueMap] = useState<Record<string, string>>({});

  // Clean HTML from inline scripts
  const cleanedHtml = rawHtml.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");

  const handleNavigate = (targetRoute: string) => {
    setLoading(true);
    router.push(targetRoute);
  };

  const handleNext = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    handleNavigate(nextRoute);
  };

  const handleBack = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    handleNavigate(prevRoute);
  };

  const renderChildren = (children: DOMNode[] | undefined) =>
    children ? domToReact(children, options) : null;

  const options: HTMLReactParserOptions = {
    replace: (domNode: DOMNode) => {
      if (domNode instanceof Element && domNode.attribs) {
        const attribs: Record<string, string> = { ...domNode.attribs };

        // 1. Purge ALL inline event handler string attributes
        Object.keys(attribs).forEach((key) => {
          if (/^on[a-z]+/i.test(key)) {
            delete attribs[key];
          }
        });

        // 2. Drop unsafe URL protocols from imported static HTML
        ["href", "src", "action", "formAction"].forEach((key) => {
          const value = attribs[key];
          if (typeof value === "string" && /^\s*(javascript|data|vbscript):/i.test(value)) {
            delete attribs[key];
          }
        });

        // 3. Normalize class attributes to className for React elements
        const classVal = attribs.class || attribs.className || attribs.classname || "";
        if (classVal) {
          attribs.className = classVal;
          delete attribs.class;
          delete attribs.classname;
        }

        if (attribs.for !== undefined) {
          attribs.htmlFor = attribs.for;
          delete attribs.for;
        }

        // Remove 'selected' attribute on <option> to fix React console warnings
        if (domNode.name === "option" && attribs.selected !== undefined) {
          delete attribs.selected;
        }

        // 3. Form elements handling
        if (domNode.name === "form") {
          return (
            <form {...attribs} onSubmit={handleNext}>
              {renderChildren(domNode.children as DOMNode[] | undefined)}
            </form>
          );
        }

        // 4. Input & Textarea elements handling
        if (domNode.name === "input" || domNode.name === "textarea") {
          const inputId = getStableNodeId("input", domNode, attribs);
          const currentVal = inputValueMap[inputId] !== undefined ? inputValueMap[inputId] : (attribs.value || "");
          const type = attribs.type || "text";

          if (type === "checkbox" || type === "radio") {
            return (
              <input
                {...attribs}
                onChange={(e) => {
                  setToggleStateMap((prev) => ({ ...prev, [inputId]: e.target.checked }));
                }}
              />
            );
          }

          return domNode.name === "textarea" ? (
            <textarea
              {...attribs}
              value={currentVal}
              onChange={(e) => {
                const val = e.target.value;
                setInputValueMap((prev) => ({ ...prev, [inputId]: val }));
              }}
            />
          ) : (
            <input
              {...attribs}
              value={currentVal}
              onChange={(e) => {
                const val = e.target.value;
                setInputValueMap((prev) => ({ ...prev, [inputId]: val }));
              }}
            />
          );
        }

        // 5. Custom Toggle / Switch handling
        const className = attribs.className || "";
        if (className.includes("custom-toggle") || attribs.role === "switch") {
          const toggleId = getStableNodeId("toggle", domNode, attribs);
          const isToggled = toggleStateMap[toggleId] || className.includes("toggle-active");

          return (
            <div
              {...attribs}
              role="switch"
              aria-checked={isToggled}
              tabIndex={0}
              className={`${className} ${isToggled ? "toggle-active" : ""}`}
              onClick={() => {
                setToggleStateMap((prev) => ({ ...prev, [toggleId]: !isToggled }));
              }}
            >
              {renderChildren(domNode.children as DOMNode[] | undefined)}
            </div>
          );
        }

        // 6. Anchor links, Buttons & Clickable elements (Navigation & Actions)
        const isClickable =
          domNode.name === "a" ||
          domNode.name === "button" ||
          attribs.role === "button" ||
          className.includes("cursor-pointer") ||
          className.includes("btn");

        if (isClickable) {
          const text = extractText(domNode).trim().toLowerCase();
          const href = attribs.href || "";
          const Tag = domNode.name as React.ElementType;

          // Screen index link fallback
          if (href === "/screens" || text.includes("all screens")) {
            return (
              <Tag
                {...attribs}
                onClick={(e: React.MouseEvent<HTMLElement>) => {
                  if (domNode.name === "a") e.preventDefault();
                  handleNavigate("/screens");
                }}
              >
                {renderChildren(domNode.children as DOMNode[] | undefined)}
              </Tag>
            );
          }

          // Check if link matches a known sidebar/header route keyword
          for (const item of routeKeywordsMap) {
            if (item.keywords.some((kw) => text === kw || text === kw + "s" || text.includes(" " + kw) || text.includes(kw + " "))) {
              const isActive = pathname === item.route;
              const activeClass = isActive ? " bg-white/10 text-primary font-bold shadow-[inset_4px_0_0_0_#ffb4aa]" : "";
              const finalClassName = `${attribs.className || ""} ${activeClass}`.trim();

              return (
                <Tag
                  {...attribs}
                  className={finalClassName}
                  onClick={(e: React.MouseEvent<HTMLElement>) => {
                    if (domNode.name === "a") e.preventDefault();
                    handleNavigate(item.route);
                  }}
                >
                  {renderChildren(domNode.children as DOMNode[] | undefined)}
                </Tag>
              );
            }
          }

          // Also check direct href matches for dynamic styling
          if (domNode.name === "a" && href && href !== "#") {
            const isActive = pathname === href;
            if (isActive) {
               attribs.className = `${attribs.className || ""} bg-white/10 text-primary font-bold shadow-[inset_4px_0_0_0_#ffb4aa]`.trim();
            }
          }

          // Check for Back / Previous
          if (text.includes("back") || text.includes("previous") || text.includes("cancel")) {
            return (
              <Tag
                {...attribs}
                onClick={(e: React.MouseEvent<HTMLElement>) => {
                  if (domNode.name === "a") e.preventDefault();
                  handleBack(e);
                }}
              >
                {renderChildren(domNode.children as DOMNode[] | undefined)}
              </Tag>
            );
          }

          // Check for Next / Continue / Action triggers
          if (
            text.includes("next") ||
            text.includes("continue") ||
            text.includes("submit") ||
            text.includes("sign in") ||
            text.includes("login") ||
            text.includes("start") ||
            text.includes("save") ||
            text.includes("complete") ||
            text.includes("proceed") ||
            text.includes("verify") ||
            text.includes("confirm") ||
            text.includes("apply") ||
            text.includes("upgrade") ||
            text.includes("subscribe") ||
            text.includes("pay") ||
            text.includes("get started")
          ) {
            return (
              <Tag
                {...attribs}
                disabled={loading && domNode.name === 'button'}
                onClick={(e: React.MouseEvent<HTMLElement>) => {
                  if (domNode.name === "a") e.preventDefault();
                  handleNext(e);
                }}
              >
                {loading ? "Processing..." : renderChildren(domNode.children as DOMNode[] | undefined)}
              </Tag>
            );
          }
          
          // Default click handler for non-specific links to prevent # jumps
          if (domNode.name === "a" && href === "#") {
            return (
              <Tag
                {...attribs}
                onClick={(e: React.MouseEvent<HTMLElement>) => {
                  e.preventDefault();
                }}
              >
                {renderChildren(domNode.children as DOMNode[] | undefined)}
              </Tag>
            );
          }
        }
      }
    },
  };

  const combinedClasses = `w-full relative overflow-x-hidden ${bodyClasses}`;

  return (
    <div className={combinedClasses}>
      {parse(cleanedHtml, options)}
    </div>
  );
}
