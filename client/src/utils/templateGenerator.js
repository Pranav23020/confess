// Template generator for creating shareable confession images

export const TEMPLATE_TYPES = {
  POETIC: 'poetic',
  INSTAGRAM: 'instagram',
  QNA: 'qna'
};

const TEMPLATES = {
  [TEMPLATE_TYPES.QNA]: {
    name: 'Q&A Box',
    background: 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)',
    textColor: '#111111',
    accentColor: '#FF416C',
    icon: '💬'
  },
  [TEMPLATE_TYPES.INSTAGRAM]: {
    name: 'Aesthetic',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    textColor: '#ffffff',
    accentColor: '#ffd700',
    icon: '📸'
  },
  [TEMPLATE_TYPES.POETIC]: {
    name: 'Poetic',
    background: '#ffffff',
    textColor: '#1a1a1a',
    icon: '✒️'
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

// Helper to draw rounded rectangle
const roundRect = (ctx, x, y, width, height, radius) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
};

export const generateTemplate = async (confessionText, templateType = TEMPLATE_TYPES.INSTAGRAM, options = {}) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Instagram Story size (1080x1920) - 9:16 ratio
  canvas.width = 1080;
  canvas.height = 1920;

  // Handle POETIC template
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

    // 6. Simple Footer
    ctx.font = 'italic 40px Georgia, "Times New Roman", serif';
    ctx.fillStyle = '#666666'; // Muted grey
    ctx.textAlign = 'center';

    // Format: "date | anonconfess.in"
    const footerText = 'anonconfess.in';
    const date = new Date();
    const dateStr = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
    ctx.fillText(`${dateStr} | ${footerText}`, canvas.width / 2, startY + totalTextHeight + 150);

    return canvas;
  }

  // Handle INSTAGRAM template (New Aesthetic)
  if (templateType === TEMPLATE_TYPES.INSTAGRAM) {
    // 1. Vibrant Gradient Background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    // Deep purple to bright pink/orange sunset vibe
    gradient.addColorStop(0, '#2E0249');   // Deep Purple
    gradient.addColorStop(0.5, '#A91079'); // Magenta
    gradient.addColorStop(1, '#F806CC');   // Pink

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add subtle noise/texture (optional, simulated with semi-transparent shapes)
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.arc(0, 0, 800, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(canvas.width, canvas.height, 600, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    // 2. Glassmorphism Card
    const margin = 100;
    const cardWidth = canvas.width - (margin * 2);

    // Calculate text height first to determine card height
    ctx.font = '600 56px "Inter", "Segoe UI", Arial, sans-serif'; // Modern sans-serif
    const textPadding = 100;
    const maxTextWidth = cardWidth - (textPadding * 2);
    const lines = wrapText(ctx, confessionText, maxTextWidth);
    const lineHeight = 84;
    const textBlockHeight = lines.length * lineHeight;

    // Minimum card height, but expand if text is long
    const minCardHeight = 800;
    const cardHeight = Math.max(minCardHeight, textBlockHeight + 500); // 500 for padding + header/footer

    const cardX = margin;
    const cardY = (canvas.height - cardHeight) / 2;
    const cornerRadius = 60;

    // Card Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 50;
    ctx.shadowOffsetY = 20;

    // Card Backdrop (Glass effect base)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    roundRect(ctx, cardX, cardY, cardWidth, cardHeight, cornerRadius);

    // Reset Shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Card Border (Thick, whiteish)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 3. Card Content

    // "Anonymous Confession" Header inside card
    ctx.font = '700 36px "Inter", "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.textAlign = 'center';
    ctx.fillText('ANONYMOUS MESSAGE', canvas.width / 2, cardY + 100);

    // Decorative divider
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillRect(cardX + 150, cardY + 140, cardWidth - 300, 2);

    // Main Quote
    ctx.font = '600 56px "Inter", "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';

    // Center text vertically in the available space between header and footer
    const contentCenterY = cardY + (cardHeight / 2);
    const textStartY = contentCenterY - (textBlockHeight / 2) + 20; // Slight adjustment

    lines.forEach((line, i) => {
      ctx.fillText(line, canvas.width / 2, textStartY + (i * lineHeight));
    });

    // 4. Branding Footer
    ctx.font = '500 42px "Inter", "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText('anonconfess.in', canvas.width / 2, cardY + cardHeight - 80);

    // External decoration (bottom of screen)
    ctx.font = '400 32px "Inter", "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText('Tap to send your own', canvas.width / 2, canvas.height - 150);

    return canvas;
  }

  // Handle QNA template (NGL style inbox box)
  if (templateType === TEMPLATE_TYPES.QNA) {
    // 1. Colorful Gradient Background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    // Orange/Pink gradient
    gradient.addColorStop(0, '#f12711');
    gradient.addColorStop(1, '#f5af19');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Box dimensions
    const boxWidth = 840;
    const padding = 80;
    
    // Text setup
    ctx.font = '700 56px "Inter", "Segoe UI", Arial, sans-serif';
    const lines = wrapText(ctx, confessionText, boxWidth - (padding * 2));
    const lineHeight = 76;
    const textHeight = lines.length * lineHeight;
    
    const headerHeight = 140;
    const footerHeight = 120;
    const boxHeight = textHeight + headerHeight + footerHeight + (padding * 2);
    
    const boxX = (canvas.width - boxWidth) / 2;
    // Position slightly above center so they have room to type a reply natively on Instagram
    const boxY = (canvas.height - boxHeight) / 2 - 200; 

    // Draw shadow
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = 50;
    ctx.shadowOffsetY = 25;

    // Draw main white box
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, boxX, boxY, boxWidth, boxHeight, 48);

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Draw Header with Gradient
    ctx.save();
    roundRect(ctx, boxX, boxY, boxWidth, boxHeight, 48);
    ctx.clip();
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
    ctx.fillRect(boxX, boxY, boxWidth, headerHeight);
    
    // Header Text
    ctx.font = '800 42px "Inter", "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Send me anonymous messages!', boxX + (boxWidth/2), boxY + (headerHeight/2));
    ctx.restore();

    // Draw Confession Text
    ctx.font = '700 56px "Inter", "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#111111'; // Dark text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    const textStartY = boxY + headerHeight + padding;
    lines.forEach((line, i) => {
      ctx.fillText(line, canvas.width / 2, textStartY + (i * lineHeight));
    });

    // Draw Footer Divider
    ctx.fillStyle = '#eeeeee';
    ctx.fillRect(boxX, boxY + boxHeight - footerHeight, boxWidth, 2);

    // Draw Footer Branding
    ctx.font = '600 36px "Inter", "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#888888';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👉 anonconfess.in 👈', canvas.width / 2, boxY + boxHeight - (footerHeight/2));
    
    return canvas;
  }

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
