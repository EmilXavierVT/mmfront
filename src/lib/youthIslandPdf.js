import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

let fontPromise;

async function loadFont() {
  if (!fontPromise) {
    fontPromise = fetch(`${import.meta.env.BASE_URL}fonts/DejaVuSans.ttf`)
      .then(response => {
        if (!response.ok) throw new Error('PDF-skrifttypen kunne ikke hentes. Prøv igen.');
        return response.arrayBuffer();
      })
      .then(buffer => {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let offset = 0; offset < bytes.length; offset += 32768) {
          binary += String.fromCharCode(...bytes.subarray(offset, offset + 32768));
        }
        return btoa(binary);
      })
      .catch(error => {
        fontPromise = null;
        throw error;
      });
  }
  return fontPromise;
}

export function buildYouthOrderPdf(sheet, fontBase64) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true, putOnlyUsedFonts: true });
  doc.addFileToVFS('DejaVuSans.ttf', fontBase64);
  doc.addFont('DejaVuSans.ttf', 'OrderForm', 'normal');
  doc.setFont('OrderForm', 'normal');
  doc.setFontSize(11);
  doc.setProperties({ title: `Bestillingsformular - ${sheet.customerName}`, creator: 'Morgendagens Maaltid' });
  doc.text(sheet.title, 20, 42);

  autoTable(doc, {
    startY: 55,
    margin: { left: 20, right: 20, top: 32, bottom: 22 },
    tableWidth: 170,
    theme: 'grid',
    body: sheet.rows,
    styles: {
      font: 'OrderForm', fontStyle: 'normal', fontSize: 10.5, textColor: 0,
      lineColor: 0, lineWidth: 0.18, fillColor: 255, valign: 'top',
      minCellHeight: 10.5, cellPadding: { top: 1.6, right: 2, bottom: 1.6, left: 2 },
      overflow: 'linebreak',
    },
    columnStyles: { 0: { cellWidth: 85 }, 1: { cellWidth: 85 } },
    rowPageBreak: 'avoid',
    didDrawPage: data => {
      if (data.pageNumber > 1) doc.text('BESTILLINGSFORMULAR (fortsat)', 20, 20);
    },
  });

  doc.setFont('OrderForm', 'normal');
  doc.setFontSize(10.5);
  let y = doc.lastAutoTable.finalY + 10;
  const footer = [`Dato for bestilling af UØ: ${sheet.orderDate}`, `Hvem har bestilt: ${sheet.orderedBy}`];
  for (const text of footer) {
    const lines = doc.splitTextToSize(text, 170);
    if (y + lines.length * 5 > 280) {
      doc.addPage();
      y = 25;
    }
    doc.text(lines, 20, y);
    y += lines.length * 5 + 3;
  }
  return doc;
}

export async function downloadYouthOrderPdf(sheet, filename) {
  const doc = buildYouthOrderPdf(sheet, await loadFont());
  doc.save(filename);
}
