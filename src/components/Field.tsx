// This whole thing is a huge mess that honestly shouldn't be seen by anyone, it's functional somehow (kinda) but I hate practically everything about it and plan to rework it all to not be so incredibly cursed

import React, { useState, useRef, useEffect } from "react";

interface MovementStep {
  from: { x: number; y: number };
  to: { x: number; y: number };
  done: boolean;
}

interface FieldNode {
  id: number;
  x: number;
  y: number;
  steps: MovementStep[];
}

function Circle({
  node,
  onMouseDown,
}: {
  node: FieldNode;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>, node: FieldNode) => void;
}) {
  return (
    <div
      draggable={false}
      tabIndex={-1}
      style={{
        position: "absolute",
        width: 40,
        height: 40,
        borderRadius: "50%",
        backgroundColor: "blue",
        left: node.x - 20,
        top: node.y - 20,
        cursor: "pointer",
        userSelect: "none",
      }}
      onMouseDown={(e) => onMouseDown(e, node)}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}

function DragDropArrowField() {
  const [trayNodes, setTrayNodes] = useState<FieldNode[]>([
    { id: 1, x: 0, y: 0, steps: [] },
    { id: 2, x: 0, y: 0, steps: [] },
    { id: 3, x: 0, y: 0, steps: [] },
  ]);
  const [fieldNodes, setFieldNodes] = useState<FieldNode[]>([]);
  const [draggingNode, setDraggingNode] = useState<FieldNode | null>(null);
  const [drawingFrom, setDrawingFrom] = useState<{
    nodeId: number;
    position: { x: number; y: number };
  } | null>(null);
  const [mousePosition, setMousePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const fieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const disableDragStart = (e: DragEvent) => e.preventDefault();
    window.addEventListener("dragstart", disableDragStart);
    return () => window.removeEventListener("dragstart", disableDragStart);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = fieldRef.current?.getBoundingClientRect();
      if (!rect) return;

      if (draggingNode) {
        setDraggingNode((prev) =>
          prev
            ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top }
            : null
        );
      }

      if (drawingFrom) {
        setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      const rect = fieldRef.current?.getBoundingClientRect();
      if (!rect) return;

      if (draggingNode) {
        setFieldNodes((prev) => [
          ...prev.filter((n) => n.id !== draggingNode.id),
          draggingNode,
        ]);
        setTrayNodes((prev) => prev.filter((n) => n.id !== draggingNode.id));
        setDraggingNode(null);
      }

      if (drawingFrom) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setFieldNodes((prev) =>
          prev.map((node) =>
            node.id === drawingFrom.nodeId
              ? {
                  ...node,
                  steps: [
                    ...node.steps,
                    { from: drawingFrom.position, to: { x, y }, done: false },
                  ],
                }
              : node
          )
        );
        setDrawingFrom(null);
        setMousePosition(null);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingNode, drawingFrom]);

  const handleTrayMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    node: FieldNode
  ) => {
    e.preventDefault();
    const rect = fieldRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDraggingNode({
      id: node.id,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      steps: [],
    });
  };

  const handleFieldNodeMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    node: FieldNode
  ) => {
    e.preventDefault();
    if (e.button === 2) {
      const rect = fieldRef.current?.getBoundingClientRect();
      if (!rect) return;
      setDraggingNode({ id: node.id, x: node.x, y: node.y, steps: [] });
      setFieldNodes((prev) =>
        prev.map((n) => (n.id === node.id ? { ...n, steps: [] } : n))
      );
    } else if (e.button === 0) {
      setDrawingFrom({ nodeId: node.id, position: { x: node.x, y: node.y } });
    }
  };

  const handleGhostMouseDown = (
    nodeId: number,
    position: { x: number; y: number }
  ) => {
    setDrawingFrom({ nodeId, position });
  };

  const handleMove = () => {
    fieldNodes.forEach((node) => {
      const runSteps = async () => {
        for (const step of node.steps) {
          if (step.done) continue;
          const stepsCount = 60;
          for (let i = 1; i <= stepsCount; i++) {
            await new Promise((resolve) => setTimeout(resolve, 16));
            const progress = i / stepsCount;
            const newX = step.from.x + (step.to.x - step.from.x) * progress;
            const newY = step.from.y + (step.to.y - step.from.y) * progress;
            setFieldNodes((prev) =>
              prev.map((n) =>
                n.id === node.id ? { ...n, x: newX, y: newY } : n
              )
            );
          }
          setFieldNodes((prev) =>
            prev.map((n) =>
              n.id === node.id
                ? {
                    ...n,
                    steps: n.steps.map((s) =>
                      s === step ? { ...s, done: true } : s
                    ),
                  }
                : n
            )
          );
        }
      };
      runSteps();
    });
  };

  const handleReset = () => {
    setFieldNodes((prev) =>
      prev.map((node) =>
        node.steps.length > 0
          ? {
              ...node,
              x: node.steps[0].from.x,
              y: node.steps[0].from.y,
              steps: node.steps.map((s) => ({ ...s, done: false })),
            }
          : node
      )
    );
  };

  const handleClear = () => {
    setFieldNodes([]);
    setTrayNodes([
      { id: 1, x: 0, y: 0, steps: [] },
      { id: 2, x: 0, y: 0, steps: [] },
      { id: 3, x: 0, y: 0, steps: [] },
    ]);
    setDraggingNode(null);
    setDrawingFrom(null);
    setMousePosition(null);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
      }}
    >
      <div
        ref={fieldRef}
        style={{
          width: "75vw",
          height: "25vw",
          background: 'url("src/assets/Field.svg")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
        }}
      >
        {fieldNodes.map((node) => (
          <Circle
            key={node.id}
            node={node}
            onMouseDown={handleFieldNodeMouseDown}
          />
        ))}

        {fieldNodes.flatMap((node) =>
          node.steps.map((step, idx) => (
            <svg
              key={`${node.id}-step-${idx}`}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
              }}
            >
              <line
                x1={step.from.x}
                y1={step.from.y}
                x2={step.to.x}
                y2={step.to.y}
                stroke="black"
                strokeWidth="2"
              />
            </svg>
          ))
        )}

        {fieldNodes.flatMap((node) =>
          node.steps.map((step, idx) =>
            !step.done ? (
              <div
                key={`ghost-${node.id}-${idx}`}
                onMouseDown={() => handleGhostMouseDown(node.id, step.to)}
                style={{
                  position: "absolute",
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  backgroundColor: "blue",
                  opacity: 0.5,
                  left: step.to.x - 10,
                  top: step.to.y - 10,
                  cursor: "pointer",
                  userSelect: "none",
                }}
              />
            ) : null
          )
        )}

        {draggingNode && (
          <div
            style={{
              position: "absolute",
              width: 40,
              height: 40,
              borderRadius: "50%",
              backgroundColor: "blue",
              left: draggingNode.x - 20,
              top: draggingNode.y - 20,
              opacity: 0.6,
              pointerEvents: "none",
            }}
          />
        )}

        {drawingFrom && mousePosition && (
          <svg
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
            }}
          >
            <line
              x1={drawingFrom.position.x}
              y1={drawingFrom.position.y}
              x2={mousePosition.x}
              y2={mousePosition.y}
              stroke="gray"
              strokeDasharray="5,5"
              strokeWidth="2"
            />
          </svg>
        )}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "600px",
          height: "100px",
          border: "2px solid black",
          background: "#ccc",
          gap: "16px",
          padding: "8px",
        }}
      >
        {trayNodes.map((node) => (
          <div
            key={node.id}
            draggable={false}
            tabIndex={-1}
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              backgroundColor: "blue",
              cursor: "pointer",
              userSelect: "none",
            }}
            onMouseDown={(e) => handleTrayMouseDown(e, node)}
          />
        ))}
      </div>

      <div style={{ display: "flex", gap: "16px", marginTop: "16px" }}>
        <button onClick={handleMove}>Move</button>
        <button onClick={handleReset}>Reset</button>
        <button onClick={handleClear}>Clear</button>
      </div>
    </div>
  );
}

export default DragDropArrowField;
