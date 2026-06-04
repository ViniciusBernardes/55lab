import React, { useState, useEffect, useMemo } from "react";

/** Segmentos com as mesmas classes do painel lab-code */
const CODE_SEGMENTS = [
  { c: "kw", t: "const" },
  { c: "", t: " entrega = " },
  { c: "kw", t: "await" },
  { c: "", t: " " },
  { c: "fn", t: "buildSistema" },
  { c: "", t: "({\n  " },
  { c: "key", t: "stack" },
  { c: "", t: ": [" },
  { c: "str", t: "'Node'" },
  { c: "", t: ", " },
  { c: "str", t: "'React'" },
  { c: "", t: ", " },
  { c: "str", t: "'PostgreSQL'" },
  { c: "", t: "],\n  " },
  { c: "key", t: "integracoes" },
  { c: "", t: ": [" },
  { c: "str", t: "'ERP'" },
  { c: "", t: ", " },
  { c: "str", t: "'APIs'" },
  { c: "", t: "],\n  " },
  { c: "key", t: "qualidade" },
  { c: "", t: ": " },
  { c: "str", t: "'testes + code review'" },
  { c: "", t: ",\n  " },
  { c: "key", t: "deploy" },
  { c: "", t: ": " },
  { c: "str", t: "'CI/CD → produção'" },
  { c: "", t: ",\n});\n\n" },
  { c: "cm", t: "// 55LAB — software que escala com o negócio" },
];

function flattenSegments(segments) {
  const out = [];
  segments.forEach((seg) => {
    [...seg.t].forEach((char) => {
      out.push({ c: seg.c, char });
    });
  });
  return out;
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

const TYPING_MS = 32;
const PAUSE_END_MS = 2800;
export const CodeTyping = () => {
  const flat = useMemo(() => flattenSegments(CODE_SEGMENTS), []);
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) {
      setCount(flat.length);
      return undefined;
    }
    const onChange = () => {
      if (reduced.matches) setCount(flat.length);
    };
    reduced.addEventListener("change", onChange);
    return () => reduced.removeEventListener("change", onChange);
  }, [flat.length]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }
    if (count < flat.length) {
      const id = window.setTimeout(() => setCount((n) => n + 1), TYPING_MS);
      return () => clearTimeout(id);
    }
    setDone(true);
    const resetId = window.setTimeout(() => {
      setDone(false);
      setCount(0);
    }, PAUSE_END_MS);
    return () => clearTimeout(resetId);
  }, [count, flat.length]);

  const visible = groupChars(flat.slice(0, count));

  return (
    <pre className="lab-code__pre">
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
  );
};
