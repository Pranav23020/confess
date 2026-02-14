// Template generator for creating shareable confession images

export const TEMPLATE_TYPES = {
  GRADIENT: 'gradient',
  DARK: 'dark',
  MINIMAL: 'minimal',
  COLORFUL: 'colorful',
  NEON: 'neon',
  AESTHETIC: 'aesthetic',
  POETIC: 'poetic'
};

const TEMPLATES = {
  [TEMPLATE_TYPES.POETIC]: {
    name: 'Poetic',
    background: '#ffffff',
    textColor: '#1a1a1a',
    icon: '✒️'
  },
  [TEMPLATE_TYPES.GRADIENT]: {
    name: 'Gradient',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    textColor: '#ffffff',
    icon: '🌈'
  },
  [TEMPLATE_TYPES.DARK]: {
    name: 'Dark Mode',
    background: '#1a1a1a',
    textColor: '#ffffff',
    accentColor: '#8b5cf6',
    icon: '🌙'
  },
  [TEMPLATE_TYPES.MINIMAL]: {
    name: 'Minimal',
    background: '#ffffff',
    textColor: '#1a1a1a',
    accentColor: '#3b82f6',
    icon: '✨'
  },
  [TEMPLATE_TYPES.COLORFUL]: {
    name: 'Colorful',
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    textColor: '#ffffff',
    icon: '🎨'
  },
  [TEMPLATE_TYPES.NEON]: {
    name: 'Neon',
    background: '#000000',
    textColor: '#00ff88',
    accentColor: '#ff00ff',
    icon: '⚡'
  },
  [TEMPLATE_TYPES.AESTHETIC]: {
    name: 'Aesthetic',
    background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    textColor: '#5a3e2b',
    icon: '🌸'
  }
};

// Wrap text to fit within canvas width
const wrapText = (ctx, text, maxWidth) => {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
};

export const generateTemplate = async (confessionText, templateType = TEMPLATE_TYPES.GRADIENT, options = {}) => {
  const template = TEMPLATES[templateType];
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Instagram Story size (1080x1920) - 9:16 ratio
  canvas.width = 1080;
  canvas.height = 1920;

  // Handle POETIC template specifically for the requested aesthetic
  if (templateType === TEMPLATE_TYPES.POETIC) {
    // 1. Clean White Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Configure Font (Serif, elegant)
    ctx.font = 'normal 64px Georgia, "Times New Roman", serif';
    ctx.fillStyle = '#1a1a1a'; // Almost black
    ctx.textBaseline = 'middle';

    // 3. Prepare Text
    const padding = 140; // Generous padding
    const maxWidth = canvas.width - (padding * 2);
    const lines = wrapText(ctx, confessionText, maxWidth);

    const lineHeight = 100; // Loose line height
    const totalTextHeight = lines.length * lineHeight;

    // 4. Calculate Positioning (Centered block, left aligned text)
    // Find the widest line to center the block horizontally
    let maxLineWidth = 0;
    lines.forEach(line => {
      const width = ctx.measureText(line).width;
      if (width > maxLineWidth) maxLineWidth = width;
    });

    const startX = (canvas.width - maxLineWidth) / 2;
    const startY = (canvas.height - totalTextHeight) / 2;

    // 5. Draw Text
    lines.forEach((line, i) => {
      ctx.textAlign = 'left';
      ctx.fillText(line, startX, startY + (i * lineHeight));
    });

    // 6. Simple Footer (no extra decorations)
    ctx.font = 'italic 40px Georgia, "Times New Roman", serif';
    ctx.fillStyle = '#666666'; // Muted grey
    ctx.textAlign = 'center';

    // Format: "date | anon.confess"
    const footerText = 'anon.confess';
    const date = new Date();
    const dateStr = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
    ctx.fillText(`${dateStr} | ${footerText}`, canvas.width / 2, startY + totalTextHeight + 150);

    return canvas;
  }

  // Apply background
  if (template.background.startsWith('linear-gradient')) {
    // Extract gradient colors
    const gradientMatch = template.background.match(/#[0-9a-f]{6}/gi);
    if (gradientMatch && gradientMatch.length >= 2) {
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, gradientMatch[0]);
      gradient.addColorStop(1, gradientMatch[1]);
      ctx.fillStyle = gradient;
    }
  } else {
    ctx.fillStyle = template.background;
  }
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Add decorative elements based on template
  if (templateType === TEMPLATE_TYPES.NEON) {
    // Add neon glow effect
    ctx.shadowBlur = 30;
    ctx.shadowColor = template.accentColor;
  }

  // Add top decoration
  ctx.fillStyle = template.accentColor || 'rgba(255, 255, 255, 0.2)';
  ctx.fillRect(80, 150, 920, 6);

  // Add logo/branding at top
  ctx.font = 'bold 48px Arial';
  ctx.fillStyle = template.textColor;
  ctx.textAlign = 'center';
  ctx.fillText('🤫 Anonymous Confession', canvas.width / 2, 120);

  // Reset shadow
  ctx.shadowBlur = 0;

  // Calculate text positioning
  const padding = 100;
  const maxWidth = canvas.width - (padding * 2);

  // Prepare confession text
  ctx.font = '600 52px Arial';
  ctx.fillStyle = template.textColor;
  ctx.textAlign = 'center';

  // Wrap text
  const lines = wrapText(ctx, confessionText, maxWidth);
  const lineHeight = 72;
  const textBlockHeight = lines.length * lineHeight;
  const startY = (canvas.height - textBlockHeight) / 2;

  // Draw confession text with quote marks
  ctx.font = 'bold 120px Georgia';
  ctx.fillText('"', canvas.width / 2 - 450, startY - 40);

  ctx.font = '600 52px Arial';
  lines.forEach((line, index) => {
    ctx.fillText(line, canvas.width / 2, startY + (index * lineHeight));
  });

  ctx.font = 'bold 120px Georgia';
  ctx.fillText('"', canvas.width / 2 + 450, startY + textBlockHeight + 80);

  // Add decorative element at bottom
  if (templateType === TEMPLATE_TYPES.AESTHETIC || templateType === TEMPLATE_TYPES.COLORFUL) {
    // Add soft circles
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(200, canvas.height - 200, 150, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(canvas.width - 200, canvas.height - 300, 200, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Add watermark at bottom
  ctx.font = '36px Arial';
  ctx.fillStyle = template.textColor;
  ctx.globalAlpha = 0.7;
  ctx.textAlign = 'center';
  ctx.fillText('Share your confession anonymously', canvas.width / 2, canvas.height - 100);
  ctx.globalAlpha = 1;

  // Add accent line at bottom
  ctx.fillStyle = template.accentColor || 'rgba(255, 255, 255, 0.2)';
  ctx.fillRect(80, canvas.height - 150, 920, 6);

  return canvas;
};

export const downloadTemplate = async (confessionText, templateType) => {
  const canvas = await generateTemplate(confessionText, templateType);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/png', 1.0);
  });
};

export const shareTemplate = async (confessionText, templateType) => {
  const blob = await downloadTemplate(confessionText, templateType);
  const file = new File([blob], 'confession.png', { type: 'image/png' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'Anonymous Confession',
        text: 'Check out this confession'
      });
      return { success: true };
    } catch (error) {
      if (error.name === 'AbortError') {
        return { success: false, cancelled: true };
      }
      throw error;
    }
  } else {
    // Fallback: download the image
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'confession.png';
    a.click();
    URL.revokeObjectURL(url);
    return { success: true, downloaded: true };
  }
};

export const getTemplatePreview = async (confessionText, templateType) => {
  const canvas = await generateTemplate(confessionText, templateType);
  return canvas.toDataURL('image/png');
};

export { TEMPLATES };
