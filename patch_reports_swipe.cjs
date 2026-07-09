const fs = require('fs');
let content = fs.readFileSync('src/components/Reports.tsx', 'utf8');

const target = `const ReportItemRow = ({ item, onEdit, onDelete, onClick }: { 
  item: ReportItem, 
  onEdit: (item: ReportItem) => void, 
  onDelete: (item: ReportItem) => void,
  onClick: (item: ReportItem) => void 
}) => {
  const controls = useAnimation();
  
  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 80;
    if (info.offset.x > threshold) {
      onEdit(item);
      controls.start({ x: 0 });
    } else if (info.offset.x < -threshold) {
      onDelete(item);
      controls.start({ x: 0 });
    } else {
      controls.start({ x: 0 });
    }
  };

  const isTx = item.type === 'transaction';
  const data = item.data;

  // Don't trigger onClick if dragging
  const handleTap = (e: any) => {
    onClick(item);
  };`;

const replaceStr = `import { useRef } from 'react';

const ReportItemRow = ({ item, onEdit, onDelete, onClick }: { 
  item: ReportItem, 
  onEdit: (item: ReportItem) => void, 
  onDelete: (item: ReportItem) => void,
  onClick: (item: ReportItem) => void 
}) => {
  const controls = useAnimation();
  const isDragging = useRef(false);
  
  const handleDragStart = () => {
    isDragging.current = true;
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    setTimeout(() => {
      isDragging.current = false;
    }, 150);

    const threshold = 40; // More responsive
    if (info.offset.x > threshold) {
      onEdit(item);
      controls.start({ x: 0 });
    } else if (info.offset.x < -threshold) {
      onDelete(item);
      controls.start({ x: 0 });
    } else {
      controls.start({ x: 0 });
    }
  };

  const isTx = item.type === 'transaction';
  const data = item.data;

  const handleClick = (e: any) => {
    if (!isDragging.current && infoRef.current.distance < 10) {
      onClick(item);
    }
  };
  
  const infoRef = useRef({ distance: 0 });
  const handleDrag = (event: any, info: PanInfo) => {
     infoRef.current.distance = Math.abs(info.offset.x);
  };
  `;

// Actually let's just use a simple threshold in onClick
const replaceStr2 = `const ReportItemRow = ({ item, onEdit, onDelete, onClick }: { 
  item: ReportItem, 
  onEdit: (item: ReportItem) => void, 
  onDelete: (item: ReportItem) => void,
  onClick: (item: ReportItem) => void 
}) => {
  const controls = useAnimation();
  const isDragging = useRef(false);
  const dragDist = useRef(0);
  
  const handleDragStart = () => {
    isDragging.current = true;
    dragDist.current = 0;
  };

  const handleDrag = (event: any, info: PanInfo) => {
    dragDist.current = Math.abs(info.offset.x);
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    setTimeout(() => {
      isDragging.current = false;
    }, 50);

    const threshold = 30; // Very responsive
    if (info.offset.x > threshold) {
      onEdit(item);
      controls.start({ x: 0 });
    } else if (info.offset.x < -threshold) {
      onDelete(item);
      controls.start({ x: 0 });
    } else {
      controls.start({ x: 0 });
    }
  };

  const isTx = item.type === 'transaction';
  const data = item.data;

  const handleClick = (e: any) => {
    if (!isDragging.current || dragDist.current < 5) {
      onClick(item);
    }
  };`;

content = content.replace(target, replaceStr2);

content = content.replace("onTap={handleTap}", "onClick={handleClick}\n        onDragStart={handleDragStart}\n        onDrag={handleDrag}");

if (!content.includes("import { useState, useEffect, useRef }")) {
  content = content.replace("import { useState, useEffect }", "import { useState, useEffect, useRef }");
}

fs.writeFileSync('src/components/Reports.tsx', content);
