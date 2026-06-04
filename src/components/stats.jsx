import React from "react";

export const Stats = (props) => {
  if (!props.data?.length) return null;

  return (
    <section className="lab-stats" aria-label="Diferenciais">
      <div className="lab-container">
        <div className="lab-stats__grid">
          {props.data.map((item, i) => (
            <div key={`${item.value}-${i}`} className="lab-stat">
              <div className="lab-stat__value">{item.value}</div>
              <div className="lab-stat__label">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
