// ─────────────────────────────────────────────────────────────────
// Client-side PDF generation via jsPDF + html2canvas.
// No server round-trip, no Lambda cost.
// ─────────────────────────────────────────────────────────────────

export interface PdfOptions {
  filename?: string;
  marginMm?: number;
}

export async function generateResultsPdf(
  element: HTMLElement,
  options: PdfOptions = {}
): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('generateResultsPdf must run in the browser');
  }

  // Lazy-load heavy libs so they don't bloat the initial bundle
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  const margin = options.marginMm ?? 10;
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const contentW = pageW - margin * 2;
  const contentH = pageH - margin * 2;

  // Convert canvas pixels to mm
  const pxPerMm = canvas.width / contentW;
  const totalContentH = canvas.height / pxPerMm;

  // Slice the canvas into page-height chunks
  const pageContentPxHeight = Math.floor(contentH * pxPerMm);
  const pageCount = Math.ceil(canvas.height / pageContentPxHeight);

  for (let page = 0; page < pageCount; page++) {
    const sliceStart = page * pageContentPxHeight;
    const sliceHeight = Math.min(pageContentPxHeight, canvas.height - sliceStart);

    const slice = document.createElement('canvas');
    slice.width = canvas.width;
    slice.height = sliceHeight;
    const ctx = slice.getContext('2d');
    if (!ctx) continue;
    ctx.drawImage(
      canvas,
      0,
      sliceStart,
      canvas.width,
      sliceHeight,
      0,
      0,
      canvas.width,
      sliceHeight
    );

    const imgData = slice.toDataURL('image/jpeg', 0.92);
    const imgH = sliceHeight / pxPerMm;

    if (page > 0) pdf.addPage();
    pdf.addImage(imgData, 'JPEG', margin, margin, contentW, imgH);
  }

  const filename =
    options.filename ?? `SAT-Simulator-Results-${new Date().toISOString().slice(0, 10)}.pdf`;

  pdf.save(filename);

  // Silence unused warnings
  void totalContentH;
}