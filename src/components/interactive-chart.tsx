"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, LineChart, PieChart, AreaChart as AreaIcon } from "lucide-react";

export interface ChartDataset {
  label: string;
  data: number[];
  color?: string; // blue, emerald, indigo, purple, pink, amber, rose
}

export interface ChartProps {
  type: "bar" | "line" | "area" | "pie";
  title?: string;
  labels: string[];
  datasets: ChartDataset[];
}

interface ColorStyle {
  stroke: string;
  fill: string;
  gradient: [string, string];
  hoverGlow: string;
  bgHex: string;
  bgHexLight: string;
}

const COLOR_MAP: Record<string, ColorStyle> = {
  blue: {
    stroke: "#3b82f6",
    fill: "rgba(59, 130, 246, 0.12)",
    gradient: ["#3b82f6", "#60a5fa"],
    hoverGlow: "rgba(59, 130, 246, 0.4)",
    bgHex: "#3b82f6",
    bgHexLight: "#60a5fa",
  },
  emerald: {
    stroke: "#10b981",
    fill: "rgba(16, 185, 129, 0.12)",
    gradient: ["#10b981", "#34d399"],
    hoverGlow: "rgba(16, 185, 129, 0.4)",
    bgHex: "#10b981",
    bgHexLight: "#34d399",
  },
  indigo: {
    stroke: "#6366f1",
    fill: "rgba(99, 102, 241, 0.12)",
    gradient: ["#6366f1", "#818cf8"],
    hoverGlow: "rgba(99, 102, 241, 0.4)",
    bgHex: "#6366f1",
    bgHexLight: "#818cf8",
  },
  purple: {
    stroke: "#8b5cf6",
    fill: "rgba(139, 92, 246, 0.12)",
    gradient: ["#8b5cf6", "#a78bfa"],
    hoverGlow: "rgba(139, 92, 246, 0.4)",
    bgHex: "#8b5cf6",
    bgHexLight: "#a78bfa",
  },
  pink: {
    stroke: "#ec4899",
    fill: "rgba(236, 72, 153, 0.12)",
    gradient: ["#ec4899", "#f472b6"],
    hoverGlow: "rgba(236, 72, 153, 0.4)",
    bgHex: "#ec4899",
    bgHexLight: "#f472b6",
  },
  amber: {
    stroke: "#f59e0b",
    fill: "rgba(245, 158, 11, 0.12)",
    gradient: ["#f59e0b", "#fbbf24"],
    hoverGlow: "rgba(245, 158, 11, 0.4)",
    bgHex: "#f59e0b",
    bgHexLight: "#fbbf24",
  },
  rose: {
    stroke: "#f43f5e",
    fill: "rgba(244, 63, 94, 0.12)",
    gradient: ["#f43f5e", "#fb7185"],
    hoverGlow: "rgba(244, 63, 94, 0.4)",
    bgHex: "#f43f5e",
    bgHexLight: "#fb7185",
  },
};

const DEFAULT_COLORS = ["blue", "emerald", "purple", "amber", "pink", "indigo", "rose"];

export default function InteractiveChart({ type: initialType, title, labels, datasets }: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartType, setChartType] = useState(initialType);
  const [width, setWidth] = useState(500);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredPieIndex, setHoveredPieIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [visibleDatasetIndices, setVisibleDatasetIndices] = useState<Set<number>>(() => {
    return new Set(datasets.map((_, i) => i));
  });

  const height = 320;
  const paddingTop = 40;
  const paddingBottom = 40;
  const paddingLeft = 50;
  const paddingRight = 30;

  // React to viewport resize
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Sync initial chart type
  useEffect(() => {
    setChartType(initialType);
  }, [initialType]);

  // Color assignments
  const formattedDatasets = useMemo(() => {
    return datasets.map((ds, idx) => {
      const colorName = ds.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
      const style = COLOR_MAP[colorName] || COLOR_MAP.blue;
      return {
        ...ds,
        colorName,
        style,
      };
    });
  }, [datasets]);

  // Handle Legend Click (Toggle visibility)
  const toggleDataset = (index: number) => {
    setVisibleDatasetIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        if (next.size > 1) {
          next.delete(index);
        }
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // Filtered active datasets
  const activeDatasets = useMemo(() => {
    return formattedDatasets.filter((_, idx) => visibleDatasetIndices.has(idx));
  }, [formattedDatasets, visibleDatasetIndices]);

  // Value Ranges for Y-Scaling
  const { maxY, minY, yTicks } = useMemo(() => {
    if (activeDatasets.length === 0) return { maxY: 100, minY: 0, yTicks: [0, 25, 50, 75, 100] };

    let maxVal = -Infinity;
    let minVal = 0; // Default base is 0 for standard charts

    activeDatasets.forEach((ds) => {
      ds.data.forEach((val) => {
        if (val > maxVal) maxVal = val;
        if (val < minVal) minVal = val;
      });
    });

    if (maxVal === -Infinity) maxVal = 100;
    
    // Add 15% padding at the top for aesthetic space
    const targetMax = maxVal === 0 ? 10 : Math.ceil(maxVal * 1.15);
    const targetMin = minVal;
    
    const range = targetMax - targetMin;
    const step = Math.ceil(range / 4);
    
    const ticks = [];
    for (let i = 0; i <= 4; i++) {
      ticks.push(targetMin + step * i);
    }
    
    return {
      maxY: targetMin + step * 4,
      minY: targetMin,
      yTicks: ticks,
    };
  }, [activeDatasets]);

  // Chart Geometry Coordinates
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const yRatio = chartHeight / (maxY - minY || 1);

  // SVG Coordinates translation
  const getX = (index: number) => {
    if (labels.length <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index * chartWidth) / (labels.length - 1);
  };

  const getY = (val: number) => {
    return paddingTop + chartHeight - (val - minY) * yRatio;
  };

  // SVG Move Handlers
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (chartType === "pie" || activeDatasets.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    // Find nearest x point index
    let minDiff = Infinity;
    let nearestIdx = 0;
    labels.forEach((_, idx) => {
      const nodeX = getX(idx);
      const diff = Math.abs(x - nodeX);
      if (diff < minDiff) {
        minDiff = diff;
        nearestIdx = idx;
      }
    });

    setHoveredIndex(nearestIdx);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
    setHoveredPieIndex(null);
  };

  // Pie chart calculation
  const pieSlices = useMemo(() => {
    if (chartType !== "pie" || activeDatasets.length === 0) return [];
    
    // Pie uses first dataset as main source
    const ds = activeDatasets[0];
    const total = ds.data.reduce((sum, val) => sum + val, 0) || 1;
    
    let accumulatedAngle = -Math.PI / 2; // Start from 12 o'clock
    
    return ds.data.map((val, idx) => {
      const percentage = val / total;
      const angle = percentage * Math.PI * 2;
      
      const startAngle = accumulatedAngle;
      const endAngle = accumulatedAngle + angle;
      accumulatedAngle = endAngle;

      // Color mapping specifically for Pie chart categories
      const colorName = DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
      const style = COLOR_MAP[colorName] || COLOR_MAP.blue;

      return {
        value: val,
        label: labels[idx] || `Item ${idx + 1}`,
        percentage: (percentage * 100).toFixed(1),
        startAngle,
        endAngle,
        style,
      };
    });
  }, [chartType, activeDatasets, labels]);

  // Generate Arc Path for Pie/Donut Chart
  const getPieSlicePath = (
    cx: number,
    cy: number,
    innerRadius: number,
    outerRadius: number,
    startAngle: number,
    endAngle: number
  ) => {
    const x1_out = cx + outerRadius * Math.cos(startAngle);
    const y1_out = cy + outerRadius * Math.sin(startAngle);
    const x2_out = cx + outerRadius * Math.cos(endAngle);
    const y2_out = cy + outerRadius * Math.sin(endAngle);

    const x1_in = cx + innerRadius * Math.cos(endAngle);
    const y1_in = cy + innerRadius * Math.sin(endAngle);
    const x2_in = cx + innerRadius * Math.cos(startAngle);
    const y2_in = cy + innerRadius * Math.sin(startAngle);

    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

    return `
      M ${x1_out} ${y1_out}
      A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2_out} ${y2_out}
      L ${x1_in} ${y1_in}
      A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x2_in} ${y2_in}
      Z
    `;
  };

  return (
    <div
      ref={containerRef}
      className="w-full flex flex-col p-5 bg-card/60 backdrop-blur-md border border-border/80 rounded-2xl shadow-xs transition duration-300 select-none my-4"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between pb-4 border-b border-border/40 mb-3.5">
        <div className="flex flex-col gap-0.5">
          {title && <h4 className="text-sm font-bold text-foreground/90">{title}</h4>}
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            인터랙티브 데이터 시각화
          </span>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-0.5 p-0.5 rounded-xl bg-muted/60 border border-border/20 text-[10px]">
          <button
            onClick={() => setChartType("bar")}
            className={`p-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              chartType === "bar" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
            }`}
            title="막대 그래프"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">막대</span>
          </button>
          <button
            onClick={() => setChartType("line")}
            className={`p-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              chartType === "line" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
            }`}
            title="꺾은선 그래프"
          >
            <LineChart className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">꺾은선</span>
          </button>
          <button
            onClick={() => setChartType("area")}
            className={`p-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              chartType === "area" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
            }`}
            title="영역 그래프"
          >
            <AreaIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">영역</span>
          </button>
          <button
            onClick={() => setChartType("pie")}
            className={`p-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              chartType === "pie" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
            }`}
            title="도넛 그래프"
          >
            <PieChart className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">도넛</span>
          </button>
        </div>
      </div>

      {/* Main Chart Body */}
      <div className="relative w-full h-[320px] overflow-visible">
        <svg
          width="100%"
          height={height}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="overflow-visible"
        >
          {/* Gradients Definitions */}
          <defs>
            {formattedDatasets.map((ds, idx) => (
              <linearGradient
                key={`grad-${idx}`}
                id={`gradient-ds-${idx}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={ds.style.gradient[0]} stopOpacity={0.4} />
                <stop offset="100%" stopColor={ds.style.gradient[1]} stopOpacity={0.0} />
              </linearGradient>
            ))}
            {formattedDatasets.map((ds, idx) => (
              <linearGradient
                key={`bar-grad-${idx}`}
                id={`bar-gradient-ds-${idx}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={ds.style.gradient[0]} stopOpacity={0.95} />
                <stop offset="100%" stopColor={ds.style.gradient[1]} stopOpacity={0.7} />
              </linearGradient>
            ))}
          </defs>

          {/* Grids and Ticks (Only for non-pie charts) */}
          {chartType !== "pie" && (
            <g className="grid-lines">
              {/* Y-axis Ticks & Horizontal Lines */}
              {yTicks.map((tick, i) => {
                const y = getY(tick);
                return (
                  <g key={`y-grid-${i}`} className="opacity-40">
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={width - paddingRight}
                      y2={y}
                      stroke="var(--border)"
                      strokeWidth={1}
                      strokeDasharray={i === 0 ? "none" : "4 4"}
                    />
                    <text
                      x={paddingLeft - 10}
                      y={y + 4}
                      textAnchor="end"
                      className="text-[10px] font-mono fill-muted-foreground font-semibold"
                    >
                      {tick.toLocaleString()}
                    </text>
                  </g>
                );
              })}

              {/* X-axis ticks (Optionally render tick indicators) */}
              {labels.map((lbl, idx) => {
                const x = getX(idx);
                return (
                  <g key={`x-grid-${idx}`}>
                    <text
                      x={x}
                      y={height - paddingBottom + 18}
                      textAnchor="middle"
                      className="text-[10px] font-medium fill-muted-foreground"
                    >
                      {lbl}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* Render 1: AREA CHART */}
          {chartType === "area" &&
            activeDatasets.map((ds, idx) => {
              const originalIdx = formattedDatasets.findIndex((d) => d.label === ds.label);
              if (ds.data.length === 0) return null;

              // Build Path
              const points = ds.data.map((val, i) => `${getX(i)},${getY(val)}`);
              const linePath = `M ${points.join(" L ")}`;
              const areaPath = `${linePath} L ${getX(ds.data.length - 1)},${height - paddingBottom} L ${getX(0)},${height - paddingBottom} Z`;

              return (
                <g key={`area-ds-${originalIdx}`}>
                  {/* Fill Area */}
                  <motion.path
                    d={areaPath}
                    fill={`url(#gradient-ds-${originalIdx})`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                  {/* Line stroke */}
                  <motion.path
                    d={linePath}
                    fill="none"
                    stroke={ds.style.stroke}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                  />
                </g>
              );
            })}

          {/* Render 2: LINE CHART */}
          {chartType === "line" &&
            activeDatasets.map((ds, idx) => {
              const originalIdx = formattedDatasets.findIndex((d) => d.label === ds.label);
              if (ds.data.length === 0) return null;

              const points = ds.data.map((val, i) => `${getX(i)},${getY(val)}`);
              const linePath = `M ${points.join(" L ")}`;

              return (
                <motion.path
                  key={`line-ds-${originalIdx}`}
                  d={linePath}
                  fill="none"
                  stroke={ds.style.stroke}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                />
              );
            })}

          {/* Render 3: BAR CHART */}
          {chartType === "bar" && activeDatasets.length > 0 && (
            <g className="bars">
              {labels.map((_, labelIdx) => {
                // Group spacing
                const groupWidth = labels.length <= 1 ? chartWidth * 0.4 : (chartWidth / labels.length) * 0.75;
                const groupX = getX(labelIdx) - groupWidth / 2;
                const singleBarWidth = groupWidth / activeDatasets.length;

                return activeDatasets.map((ds, dsIdx) => {
                  const originalIdx = formattedDatasets.findIndex((d) => d.label === ds.label);
                  const val = ds.data[labelIdx] || 0;
                  const barX = groupX + dsIdx * singleBarWidth;
                  const barY = getY(val);
                  const barH = Math.max(0, height - paddingBottom - barY);

                  return (
                    <motion.rect
                      key={`bar-${labelIdx}-${originalIdx}`}
                      x={barX + 1}
                      y={barY}
                      width={Math.max(2, singleBarWidth - 2)}
                      height={barH}
                      rx={Math.min(4, singleBarWidth / 3)}
                      fill={`url(#bar-gradient-ds-${originalIdx})`}
                      className="cursor-pointer"
                      style={{
                        filter: hoveredIndex === labelIdx ? "brightness(1.15)" : "none",
                        transition: "filter 0.2s ease",
                        originY: 1,
                      }}
                      initial={{ scaleY: 0, y: height - paddingBottom }}
                      animate={{ scaleY: 1, y: barY }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  );
                });
              })}
            </g>
          )}

          {/* Interactive Guides & Node circles (Only for line/area chart) */}
          {chartType !== "pie" && hoveredIndex !== null && (
            <g className="guides pointer-events-none">
              {/* Vertical Guide bar */}
              <line
                x1={getX(hoveredIndex)}
                y1={paddingTop}
                x2={getX(hoveredIndex)}
                y2={height - paddingBottom}
                stroke="var(--border)"
                strokeWidth={1.5}
                strokeDasharray="3 3"
              />

              {/* Guide dots for Line/Area */}
              {(chartType === "line" || chartType === "area") &&
                activeDatasets.map((ds, idx) => {
                  const originalIdx = formattedDatasets.findIndex((d) => d.label === ds.label);
                  const val = ds.data[hoveredIndex];
                  if (val === undefined) return null;

                  return (
                    <g key={`guide-dot-${originalIdx}`}>
                      {/* Outer Ring */}
                      <circle
                        cx={getX(hoveredIndex)}
                        cy={getY(val)}
                        r={6.5}
                        fill="var(--background)"
                        stroke={ds.style.stroke}
                        strokeWidth={2}
                      />
                      {/* Center Point */}
                      <circle
                        cx={getX(hoveredIndex)}
                        cy={getY(val)}
                        r={2.5}
                        fill={ds.style.stroke}
                      />
                    </g>
                  );
                })}
            </g>
          )}

          {/* Render 4: PIE / DONUT CHART */}
          {chartType === "pie" && (
            <g className="pie-donut">
              {pieSlices.map((slice, idx) => {
                const cx = width / 2;
                const cy = height / 2;
                const outerRadius = Math.min(chartWidth, chartHeight) / 2 * 0.9;
                const innerRadius = outerRadius * 0.65; // Donut style

                const isPieHovered = hoveredPieIndex === idx;
                
                // Exploding slice offset when hovered
                let sliceCx = cx;
                let sliceCy = cy;
                if (isPieHovered) {
                  const midAngle = (slice.startAngle + slice.endAngle) / 2;
                  const offset = 8;
                  sliceCx = cx + offset * Math.cos(midAngle);
                  sliceCy = cy + offset * Math.sin(midAngle);
                }

                const pathD = getPieSlicePath(
                  sliceCx,
                  sliceCy,
                  innerRadius,
                  outerRadius,
                  slice.startAngle,
                  slice.endAngle
                );

                return (
                  <path
                    key={`pie-slice-${idx}`}
                    d={pathD}
                    fill={slice.style.stroke}
                    className="cursor-pointer transition-all duration-200"
                    style={{
                      fillOpacity: isPieHovered ? 0.95 : 0.8,
                      filter: isPieHovered ? `drop-shadow(0 4px 10px ${slice.style.hoverGlow})` : "none",
                    }}
                    onMouseEnter={(e) => {
                      setHoveredPieIndex(idx);
                      const rect = e.currentTarget.getBoundingClientRect();
                      // Put tooltip near slice center
                      const midAngle = (slice.startAngle + slice.endAngle) / 2;
                      const tooltipRadius = (outerRadius + innerRadius) / 2;
                      const clientX = rect.left + rect.width / 2 + tooltipRadius * Math.cos(midAngle);
                      const clientY = rect.top + rect.height / 2 + tooltipRadius * Math.sin(midAngle);
                      setMousePos({ x: clientX - rect.left, y: clientY - rect.top });
                    }}
                    onMouseMove={(e) => {
                      // Adjust mouse pos dynamically if moving inside slice
                      const rect = e.currentTarget.getBoundingClientRect();
                      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                    }}
                  />
                );
              })}
            </g>
          )}
        </svg>

        {/* Hover Tooltip Render */}
        <AnimatePresence>
          {chartType !== "pie" && hoveredIndex !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.12 }}
              className="absolute z-50 p-3 bg-card/95 backdrop-blur-md border border-border shadow-lg rounded-xl text-xs flex flex-col gap-1.5 w-48 pointer-events-none"
              style={{
                left: `${Math.min(width - 200, Math.max(20, getX(hoveredIndex) - 96))}px`,
                top: `${Math.min(height - 130, Math.max(10, mousePos.y - 120))}px`,
              }}
            >
              <div className="font-bold border-b border-border/50 pb-1 text-foreground/80">
                {labels[hoveredIndex]}
              </div>
              <div className="flex flex-col gap-1">
                {activeDatasets.map((ds, idx) => {
                  const originalIdx = formattedDatasets.findIndex((d) => d.label === ds.label);
                  const val = ds.data[hoveredIndex];
                  if (val === undefined) return null;

                  return (
                    <div key={`tip-item-${idx}`} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: ds.style.stroke }}
                        />
                        <span className="truncate max-w-[100px]">{ds.label}</span>
                      </div>
                      <span className="font-semibold text-foreground/90 font-mono">
                        {val.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {chartType === "pie" && hoveredPieIndex !== null && pieSlices[hoveredPieIndex] && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.12 }}
              className="absolute z-50 p-3 bg-card/95 backdrop-blur-md border border-border shadow-lg rounded-xl text-xs flex flex-col gap-1 w-44 pointer-events-none"
              style={{
                left: `${mousePos.x - 88}px`,
                top: `${mousePos.y - 85}px`,
              }}
            >
              <div className="flex items-center gap-1.5 font-bold text-foreground/85 border-b border-border/50 pb-1">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: pieSlices[hoveredPieIndex].style.stroke }}
                />
                <span className="truncate">{pieSlices[hoveredPieIndex].label}</span>
              </div>
              <div className="flex flex-col gap-0.5 mt-0.5">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>값:</span>
                  <span className="font-bold text-foreground/90 font-mono">
                    {pieSlices[hoveredPieIndex].value.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>비율:</span>
                  <span className="font-bold text-foreground/90 font-mono">
                    {pieSlices[hoveredPieIndex].percentage}%
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend & Filter Badges */}
      {chartType !== "pie" && formattedDatasets.length > 0 && (
        <div className="flex flex-wrap gap-2.5 items-center justify-center pt-4 mt-1 border-t border-border/40 text-[11px] font-semibold">
          {formattedDatasets.map((ds, idx) => {
            const isVisible = visibleDatasetIndices.has(idx);
            return (
              <button
                key={`legend-ds-${idx}`}
                onClick={() => toggleDataset(idx)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  isVisible
                    ? "bg-muted/60 border-border text-foreground hover:bg-muted"
                    : "bg-transparent border-transparent text-muted-foreground/50 hover:bg-muted/20"
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full transition-opacity"
                  style={{
                    backgroundColor: ds.style.stroke,
                    opacity: isVisible ? 1 : 0.25,
                  }}
                />
                <span className={isVisible ? "" : "line-through opacity-60"}>{ds.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
