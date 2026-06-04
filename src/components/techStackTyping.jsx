import React, { useState, useEffect, useMemo } from "react";

function buildTechSegments(items) {
  const segments = [];
  const chipStart = [];
  const chipEnd = [];
  let charIndex = 0;

  const push = (seg) => {
    segments.push(seg);
    charIndex += seg.t.length;
  };

  push({ c: "kw", t: "const" });
  push({ c: "", t: " stack: string[] = [\n  " });

  items.forEach((name, i) => {
    chipStart[i] = charIndex;
    push({ c: "str", t: `'${name}'` });
    chipEnd[i] = charIndex;
    if (i < items.length - 1) {
      push({ c: "", t: ", " });
    }
  });

  push({ c: "", t: "];\n\n" });
  push({ c: "cm", t: "// Principais tecnologias — 55LAB" });

  return { segments, chipStart, chipEnd, total: charIndex };
}

function groupChars(chars) {
  const groups = [];
  let current = null;
  chars.forEach(({ c, char }) => {
    if (!current || current.c !== c) {
      current = { c, text: char };
      groups.push(current);
    } else {
      current.text += char;
    }
  });
  return groups;
}

const TYPING_MS = 28;
const PAUSE_END_MS = 3200;

export const TechStackTyping = ({ items }) => {
  const { segments, chipStart, chipEnd, total } = useMemo(
    () => buildTechSegments(items),
    [items]
  );

  const flat = useMemo(() => {
    const out = [];
    segments.forEach((seg) => {
      [...seg.t].forEach((char) => {
        out.push({ c: seg.c, char });
      });
    });
    return out;
  }, [segments]);

  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) {
      setCount(total);
      return undefined;
    }
    const onChange = () => {
      if (reduced.matches) setCount(total);
    };
    reduced.addEventListener("change", onChange);
    return () => reduced.removeEventListener("change", onChange);
  }, [total]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }
    if (count < total) {
      const id = window.setTimeout(() => setCount((n) => n + 1), TYPING_MS);
      return () => clearTimeout(id);
    }
    setDone(true);
    const resetId = window.setTimeout(() => {
      setDone(false);
      setCount(0);
    }, PAUSE_END_MS);
    return () => clearTimeout(resetId);
  }, [count, total]);

  const visible = groupChars(flat.slice(0, count));

  const typingIndex = items.findIndex(
    (_, i) => count >= chipStart[i] && count < chipEnd[i]
  );
  const visibleCount = items.filter((_, i) => count >= chipEnd[i]).length;

  return (
    <>
      <pre className="lab-code__pre lab-code__pre--stack">
        <code>
          {visible.map((g, i) =>
            g.c ? (
              <span key={i} className={g.c}>
                {g.text}
              </span>
            ) : (
              <span key={i}>{g.text}</span>
            )
          )}
          <span
            className={`lab-code__cursor${done ? " lab-code__cursor--pause" : ""}`}
            aria-hidden="true"
          />
        </code>
      </pre>
      <div className="lab-hero-tech__grid" role="list" aria-label="Tecnologias">
        {items.map((name, i) => {
          const isTyping = i === typingIndex;
          const isVisible = count >= chipEnd[i];
          const label = isTyping
            ? name.slice(0, Math.max(0, count - chipStart[i] - 1))
            : isVisible
            ? name
            : "";

          if (!isVisible && !isTyping) {
            return (
              <span
                key={name}
                className="lab-hero-tech__item lab-hero-tech__item--placeholder"
                role="listitem"
                aria-hidden="true"
              />
            );
          }

          return (
            <span
              key={name}
              className={`lab-hero-tech__item${
                isVisible ? " is-visible" : ""
              }${isTyping ? " is-typing" : ""}`}
              role="listitem"
            >
              {label}
              {isTyping ? (
                <span className="lab-hero-tech__item-cursor" aria-hidden="true" />
              ) : null}
            </span>
          );
        })}
      </div>
    </>
  );
};
